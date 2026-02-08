import { db } from "@/lib/db";
import { courses, enrollments, payments, siteSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { getRazorpay, RAZORPAY_KEY_ID } from "@/lib/razorpay";
import { toSmallestUnit } from "@/lib/currency";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId: rawCourseId } = body;

    if (!rawCourseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 },
      );
    }

    const courseId = Number(rawCourseId);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: "courseId must be a valid number" },
        { status: 400 },
      );
    }

    // Determine if Razorpay is configured
    const isTestMode = !RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

    // Fetch the course
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.published) {
      return NextResponse.json(
        { error: "Course is not available" },
        { status: 404 },
      );
    }

    if (course.accessRule !== "payment") {
      return NextResponse.json(
        { error: "This course does not require payment" },
        { status: 400 },
      );
    }

    if (!course.price) {
      return NextResponse.json(
        { error: "Course price is not set" },
        { status: 400 },
      );
    }

    const priceNum = parseFloat(course.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: "Invalid course price" },
        { status: 400 },
      );
    }

    // Check if user is already enrolled
    const [existingEnrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 409 },
      );
    }

    // Fetch platform currency from site settings
    const [settings] = await db.select().from(siteSettings).limit(1);
    const currency = settings?.currency || "INR";

    // Convert amount to smallest currency unit (paise for INR, cents for USD, etc.)
    const amountInSmallestUnit = toSmallestUnit(priceNum, currency);

    if (isTestMode) {
      // ── TEST MODE ──────────────────────────────────────────────
      // Razorpay keys are not configured. Create a mock order so
      // the user can still demo the payment flow via the test
      // checkout page.
      const mockOrderId = `test_order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // Insert a pending payment row with the mock order ID
      const [payment] = await db
        .insert(payments)
        .values({
          userId: session.user.id,
          courseId,
          razorpayOrderId: mockOrderId,
          amount: String(priceNum),
          currency: currency.toUpperCase(),
          status: "pending",
        })
        .returning();

      return NextResponse.json(
        {
          testMode: true,
          orderId: mockOrderId,
          amount: amountInSmallestUnit,
          currency: currency.toUpperCase(),
          paymentId: payment.id,
          courseName: course.title,
          courseId: course.id,
          prefill: {
            name: session.user.name,
            email: session.user.email,
          },
        },
        { status: 201 },
      );
    }

    // ── LIVE MODE ────────────────────────────────────────────────
    // Create a real Razorpay order
    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInSmallestUnit,
      currency: currency.toUpperCase(),
      receipt: `course_${courseId}_user_${session.user.id}_${Date.now()}`,
      notes: {
        courseId: String(courseId),
        userId: String(session.user.id),
        courseTitle: course.title,
        userName: session.user.name,
        userEmail: session.user.email,
      },
    });

    // Insert a pending payment row in our database
    const [payment] = await db
      .insert(payments)
      .values({
        userId: session.user.id,
        courseId,
        razorpayOrderId: razorpayOrder.id,
        amount: String(priceNum),
        currency: currency.toUpperCase(),
        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        testMode: false,
        orderId: razorpayOrder.id,
        amount: amountInSmallestUnit,
        currency: currency.toUpperCase(),
        paymentId: payment.id,
        keyId: RAZORPAY_KEY_ID,
        courseName: course.title,
        courseId: course.id,
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create payment order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 },
    );
  }
}
