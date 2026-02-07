import { db } from "@/lib/db";
import { payments, users, courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql, and, or, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (
      session.user.role !== "superadmin" &&
      session.user.role !== "instructor"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const courseId = searchParams.get("courseId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build conditions
    const conditions = [];

    // If instructor, only show payments for their courses
    if (session.user.role === "instructor") {
      conditions.push(eq(courses.responsibleId, session.user.id));
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(courses.title, `%${search}%`),
          ilike(payments.razorpayOrderId, `%${search}%`),
          ilike(payments.razorpayPaymentId, `%${search}%`),
        ),
      );
    }

    if (
      status &&
      ["pending", "completed", "failed", "refunded"].includes(status)
    ) {
      conditions.push(
        eq(
          payments.status,
          status as "pending" | "completed" | "failed" | "refunded",
        ),
      );
    }

    if (courseId) {
      conditions.push(eq(payments.courseId, courseId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort mapping
    const sortColumns: Record<string, unknown> = {
      createdAt: payments.createdAt,
      amount: payments.amount,
      status: payments.status,
      userName: users.name,
      courseTitle: courses.title,
    };

    const sortColumn = sortColumns[sortBy] || payments.createdAt;
    const orderFn =
      sortOrder === "asc" ? sql`${sortColumn} ASC` : sql`${sortColumn} DESC`;

    // Count total matching records
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(whereClause);

    const total = countResult?.count ?? 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch payment records
    const rows = await db
      .select({
        id: payments.id,
        userId: payments.userId,
        courseId: payments.courseId,
        razorpayOrderId: payments.razorpayOrderId,
        razorpayPaymentId: payments.razorpayPaymentId,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
        courseTitle: courses.title,
        courseImageUrl: courses.imageUrl,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(whereClause)
      .orderBy(orderFn)
      .limit(limit)
      .offset(offset);

    // Summary stats
    const [summaryResult] = await db
      .select({
        totalPayments: sql<number>`count(*)::int`,
        completedPayments: sql<number>`count(*) filter (where ${payments.status} = 'completed')::int`,
        pendingPayments: sql<number>`count(*) filter (where ${payments.status} = 'pending')::int`,
        failedPayments: sql<number>`count(*) filter (where ${payments.status} = 'failed')::int`,
        refundedPayments: sql<number>`count(*) filter (where ${payments.status} = 'refunded')::int`,
        totalRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'completed' then ${payments.amount}::numeric else 0 end), 0)::float`,
      })
      .from(payments)
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(
        session.user.role === "instructor"
          ? eq(courses.responsibleId, session.user.id)
          : undefined,
      );

    return NextResponse.json({
      payments: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalPayments: summaryResult?.totalPayments ?? 0,
        completedPayments: summaryResult?.completedPayments ?? 0,
        pendingPayments: summaryResult?.pendingPayments ?? 0,
        failedPayments: summaryResult?.failedPayments ?? 0,
        refundedPayments: summaryResult?.refundedPayments ?? 0,
        totalRevenue: summaryResult?.totalRevenue ?? 0,
      },
    });
  } catch (error) {
    console.error("Get admin payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
