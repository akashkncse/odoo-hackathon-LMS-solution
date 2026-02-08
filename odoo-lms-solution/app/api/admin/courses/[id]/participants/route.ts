import { db } from "@/lib/db";
import { courses, enrollments, users, lessons } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql, desc, asc, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);

    // Verify the course exists and the user has access
    const [course] = await db
      .select({ id: courses.id, responsibleId: courses.responsibleId })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      session.user.role !== "superadmin" &&
      course.responsibleId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "enrolledAt";
    const sortDir = searchParams.get("sortDir") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const offset = (page - 1) * limit;

    // Get total lesson count for the course (for completion percentage)
    const [lessonCountRow] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    const totalLessons = lessonCountRow?.count ?? 0;

    // Build conditions
    const conditions = [eq(enrollments.courseId, courseId)];

    if (search.trim()) {
      conditions.push(
        sql`(${ilike(users.name, `%${search.trim()}%`)} OR ${ilike(
          users.email,
          `%${search.trim()}%`,
        )})`,
      );
    }

    if (statusFilter && statusFilter !== "all") {
      if (["not_started", "in_progress", "completed"].includes(statusFilter)) {
        conditions.push(
          eq(
            enrollments.status,
            statusFilter as "not_started" | "in_progress" | "completed",
          ),
        );
      }
    }

    const whereClause = and(...conditions);

    // Get total count for pagination
    const [countRow] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(whereClause);

    const totalCount = countRow?.count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Build sort
    let orderByClause;
    const direction = sortDir === "asc" ? asc : desc;

    switch (sortBy) {
      case "name":
        orderByClause = direction(users.name);
        break;
      case "email":
        orderByClause = direction(users.email);
        break;
      case "status":
        orderByClause = direction(enrollments.status);
        break;
      case "startedAt":
        orderByClause = direction(enrollments.startedAt);
        break;
      case "completedAt":
        orderByClause = direction(enrollments.completedAt);
        break;
      case "timeSpent":
        orderByClause = direction(enrollments.timeSpentSeconds);
        break;
      case "enrolledAt":
      default:
        orderByClause = direction(enrollments.enrolledAt);
        break;
    }

    // Fetch participants with completion data
    const participantRows = await db
      .select({
        enrollmentId: enrollments.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        startedAt: enrollments.startedAt,
        completedAt: enrollments.completedAt,
        timeSpentSeconds: enrollments.timeSpentSeconds,
        completedLessons: sql<number>`(
          SELECT count(*)::int FROM lesson_progress lp
          INNER JOIN lessons l ON lp.lesson_id = l.id
          WHERE lp.user_id = ${users.id}
            AND l.course_id = ${courseId}
            AND lp.status = 'completed'
        )`,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const participants = participantRows.map((row, index) => {
      const completedLessons = Number(row.completedLessons);
      const completionPercentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      return {
        sno: offset + index + 1,
        enrollmentId: row.enrollmentId,
        userId: row.userId,
        name: row.userName,
        email: row.userEmail,
        avatarUrl: row.userAvatarUrl,
        status: row.status,
        enrolledAt: row.enrolledAt,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        timeSpentSeconds: row.timeSpentSeconds,
        completedLessons,
        totalLessons,
        completionPercentage,
      };
    });

    // Summary stats
    const summaryConditions = [eq(enrollments.courseId, courseId)];
    const [summaryRow] = await db
      .select({
        total: sql<number>`count(*)::int`,
        notStarted: sql<number>`count(case when ${enrollments.status} = 'not_started' then 1 end)::int`,
        inProgress: sql<number>`count(case when ${enrollments.status} = 'in_progress' then 1 end)::int`,
        completed: sql<number>`count(case when ${enrollments.status} = 'completed' then 1 end)::int`,
        avgTimeSpent: sql<number>`coalesce(round(avg(${enrollments.timeSpentSeconds})), 0)::int`,
        totalTimeSpent: sql<number>`coalesce(sum(${enrollments.timeSpentSeconds}), 0)::int`,
      })
      .from(enrollments)
      .where(and(...summaryConditions));

    return NextResponse.json({
      participants,
      totalLessons,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
      summary: {
        total: summaryRow?.total ?? 0,
        notStarted: summaryRow?.notStarted ?? 0,
        inProgress: summaryRow?.inProgress ?? 0,
        completed: summaryRow?.completed ?? 0,
        avgTimeSpentSeconds: summaryRow?.avgTimeSpent ?? 0,
        totalTimeSpentSeconds: summaryRow?.totalTimeSpent ?? 0,
      },
    });
  } catch (error) {
    console.error("Participants API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
