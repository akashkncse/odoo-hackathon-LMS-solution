import { db } from "@/lib/db";
import {
  users,
  courses,
  enrollments,
  lessons,
  quizzes,
  quizAttempts,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── User counts by role ──────────────────────────────────────────────
    const userCountRows = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.role);

    const userCounts = {
      total: 0,
      learners: 0,
      instructors: 0,
      superadmins: 0,
    };

    for (const row of userCountRows) {
      const c = Number(row.count);
      userCounts.total += c;
      if (row.role === "learner") userCounts.learners = c;
      else if (row.role === "instructor") userCounts.instructors = c;
      else if (row.role === "superadmin") userCounts.superadmins = c;
    }

    // ── Course counts ────────────────────────────────────────────────────
    // For instructors, scope to their own courses; for superadmins, show all
    const isSuperadmin = session.user.role === "superadmin";

    const courseCondition = isSuperadmin
      ? sql`1=1`
      : eq(courses.responsibleId, session.user.id);

    const courseCountRows = await db
      .select({
        published: courses.published,
        count: sql<number>`count(*)::int`,
        totalViews: sql<number>`coalesce(sum(${courses.viewsCount}), 0)::int`,
      })
      .from(courses)
      .where(courseCondition)
      .groupBy(courses.published);

    const courseCounts = {
      total: 0,
      published: 0,
      draft: 0,
      totalViews: 0,
    };

    for (const row of courseCountRows) {
      const c = Number(row.count);
      const v = Number(row.totalViews);
      courseCounts.total += c;
      courseCounts.totalViews += v;
      if (row.published) courseCounts.published = c;
      else courseCounts.draft = c;
    }

    // ── Lesson count ─────────────────────────────────────────────────────
    const [lessonCountRow] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(lessons)
      .innerJoin(courses, eq(lessons.courseId, courses.id))
      .where(courseCondition);

    const lessonCount = Number(lessonCountRow?.count ?? 0);

    // ── Quiz count ───────────────────────────────────────────────────────
    const [quizCountRow] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(quizzes)
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .where(courseCondition);

    const quizCount = Number(quizCountRow?.count ?? 0);

    // ── Enrollment counts by status ──────────────────────────────────────
    const enrollmentCountRows = await db
      .select({
        status: enrollments.status,
        count: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(courseCondition)
      .groupBy(enrollments.status);

    const enrollmentCounts = {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
    };

    for (const row of enrollmentCountRows) {
      const c = Number(row.count);
      enrollmentCounts.total += c;
      if (row.status === "not_started") enrollmentCounts.notStarted = c;
      else if (row.status === "in_progress") enrollmentCounts.inProgress = c;
      else if (row.status === "completed") enrollmentCounts.completed = c;
    }

    const completionRate =
      enrollmentCounts.total > 0
        ? Math.round(
            (enrollmentCounts.completed / enrollmentCounts.total) * 100,
          )
        : 0;

    // ── Quiz attempt stats ───────────────────────────────────────────────
    const [quizAttemptStats] = await db
      .select({
        totalAttempts: sql<number>`count(*)::int`,
        avgScore: sql<number>`coalesce(round(avg(${quizAttempts.score})), 0)::int`,
        totalPointsAwarded: sql<number>`coalesce(sum(${quizAttempts.pointsEarned}), 0)::int`,
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .where(courseCondition);

    // ── Recent enrollments (last 10) ─────────────────────────────────────
    const recentEnrollments = await db
      .select({
        id: enrollments.id,
        status: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        userName: users.name,
        userEmail: users.email,
        courseTitle: courses.title,
        courseId: courses.id,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(courseCondition)
      .orderBy(desc(enrollments.enrolledAt))
      .limit(10);

    // ── Top courses by enrollment count ──────────────────────────────────
    const topCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        published: courses.published,
        viewsCount: courses.viewsCount,
        enrollmentCount: sql<number>`count(${enrollments.id})::int`,
        completedCount: sql<number>`count(case when ${enrollments.status} = 'completed' then 1 end)::int`,
      })
      .from(courses)
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .where(courseCondition)
      .groupBy(courses.id, courses.title, courses.published, courses.viewsCount)
      .orderBy(sql`count(${enrollments.id}) desc`)
      .limit(5);

    return NextResponse.json({
      userCounts,
      courseCounts,
      lessonCount,
      quizCount,
      enrollmentCounts,
      completionRate,
      quizAttemptStats: {
        totalAttempts: Number(quizAttemptStats?.totalAttempts ?? 0),
        avgScore: Number(quizAttemptStats?.avgScore ?? 0),
        totalPointsAwarded: Number(quizAttemptStats?.totalPointsAwarded ?? 0),
      },
      recentEnrollments,
      topCourses,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
