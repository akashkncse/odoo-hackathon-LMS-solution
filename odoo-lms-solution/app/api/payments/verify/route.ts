import { db } from "@/lib/db";
import { courses, enrollments, payments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
      testMode,
    } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing internal payment ID" },
        { status: 400 },
      );
    }

    const isTestMode =
      !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;

    if (testMode && isTestMode) {
      // ── TEST MODE ──────────────────────────────────────────────
      // Razorpay keys are not configured. Skip HMAC verification
      // and directly complete the payment + create enrollment so
      // the user can demo the full payment flow.

      // Fetch our payment record (only needs paymentId + userId match)
      const [payment] = await db
        .select()
        .from(payments)
        .where(
          and(eq(payments.id, paymentId), eq(payments.userId, session.user.id)),
        );

      if (!payment) {
        return NextResponse.json(
          { error: "Payment record not found" },
          { status: 404 },
        );
      }

      if (payment.status === "completed") {
        const [existingEnrollment] = await db
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.courseId, payment.courseId),
              eq(enrollments.userId, session.user.id),
            ),
          );

        return NextResponse.json({
          message: "Payment already verified (test mode)",
          enrollment: existingEnrollment || null,
        });
      }

      // Mark payment as completed with test-mode identifiers
      const testPaymentId = `test_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const testSignature = "test_mode_no_signature";

      await db
        .update(payments)
        .set({
          razorpayPaymentId: testPaymentId,
          razorpaySignature: testSignature,
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));

      // Check if user is already enrolled (race condition guard)
      const [existingEnrollment] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, payment.courseId),
            eq(enrollments.userId, session.user.id),
          ),
        );

      if (existingEnrollment) {
        return NextResponse.json({
          message: "Payment verified (test mode). Already enrolled.",
          enrollment: existingEnrollment,
        });
      }

      // Verify the course still exists
      const [course] = await db
        .select({ id: courses.id, title: courses.title })
        .from(courses)
        .where(eq(courses.id, payment.courseId));

      if (!course) {
        return NextResponse.json(
          { error: "Course no longer exists" },
          { status: 404 },
        );
      }

      // Create the enrollment
      const [enrollment] = await db
        .insert(enrollments)
        .values({
          userId: session.user.id,
          courseId: payment.courseId,
          status: "not_started",
        })
        .returning();

      return NextResponse.json(
        {
          message: "Payment verified successfully (test mode)!",
          enrollment,
        },
        { status: 201 },
      );
    }

    // ── LIVE MODE ────────────────────────────────────────────────
    // Full Razorpay HMAC-SHA256 signature verification.

    // Validate required fields for live mode
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 },
      );
    }

    // Check Razorpay secret is configured
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured. Please contact the administrator.",
        },
        { status: 503 },
      );
    }

    // Fetch our payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.userId, session.user.id),
          eq(payments.razorpayOrderId, razorpay_order_id),
        ),
      );

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 },
      );
    }

    if (payment.status === "completed") {
      // Already verified — check if enrollment exists
      const [existingEnrollment] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, payment.courseId),
            eq(enrollments.userId, session.user.id),
          ),
        );

      return NextResponse.json({
        message: "Payment already verified",
        enrollment: existingEnrollment || null,
      });
    }

    // Verify the Razorpay signature using HMAC-SHA256
    // Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Signature mismatch — mark payment as failed
      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));

      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 },
      );
    }

    // Signature is valid — update payment record to completed
    await db
      .update(payments)
      .set({
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    // Check if user is already enrolled (race condition guard)
    const [existingEnrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, payment.courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (existingEnrollment) {
      return NextResponse.json({
        message: "Payment verified. Already enrolled.",
        enrollment: existingEnrollment,
      });
    }

    // Verify the course still exists
    const [course] = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(eq(courses.id, payment.courseId));

    if (!course) {
      return NextResponse.json(
        { error: "Course no longer exists" },
        { status: 404 },
      );
    }

    // Create the enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        userId: session.user.id,
        courseId: payment.courseId,
        status: "not_started",
      })
      .returning();

    return NextResponse.json(
      {
        message: "Payment verified successfully!",
        enrollment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed. Please contact support." },
      { status: 500 },
    );
  }
}
