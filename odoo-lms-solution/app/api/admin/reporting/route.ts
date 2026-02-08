import { db } from "@/lib/db";
import {
  courses,
  enrollments,
  lessons,
  quizzes,
  quizAttempts,
  reviews,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isSuperadmin = session.user.role === "superadmin";
    const courseCondition = isSuperadmin
      ? sql`1=1`
      : eq(courses.responsibleId, session.user.id);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    // ── Per-course reporting with all stats ──────────────────────────────
    const parsedCourseId = courseId ? Number(courseId) : null;

    const courseRows = await db
      .select({
        id: courses.id,
        title: courses.title,
        imageUrl: courses.imageUrl,
        published: courses.published,
        viewsCount: courses.viewsCount,
        accessRule: courses.accessRule,
        price: courses.price,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(
        parsedCourseId
          ? and(courseCondition, eq(courses.id, parsedCourseId))
          : courseCondition,
      )
      .orderBy(desc(courses.createdAt));

    const courseIds = courseRows.map((c) => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        courses: [],
        summary: {
          totalCourses: 0,
          totalEnrollments: 0,
          totalCompleted: 0,
          totalInProgress: 0,
          totalNotStarted: 0,
          totalViews: 0,
          overallCompletionRate: 0,
          averageRating: 0,
          totalTimeSpentSeconds: 0,
          totalQuizAttempts: 0,
          averageQuizScore: 0,
        },
      });
    }

    // ── Enrollment stats per course ──────────────────────────────────────
    const enrollmentStats = await db
      .select({
        courseId: enrollments.courseId,
        totalEnrollments: sql<number>`count(*)::int`,
        notStarted: sql<number>`count(case when ${enrollments.status} = 'not_started' then 1 end)::int`,
        inProgress: sql<number>`count(case when ${enrollments.status} = 'in_progress' then 1 end)::int`,
        completed: sql<number>`count(case when ${enrollments.status} = 'completed' then 1 end)::int`,
        totalTimeSpentSeconds: sql<number>`coalesce(sum(${enrollments.timeSpentSeconds}), 0)::int`,
        avgTimeSpentSeconds: sql<number>`coalesce(round(avg(${enrollments.timeSpentSeconds})), 0)::int`,
      })
      .from(enrollments)
      .where(
        courseIds.length === 1
          ? eq(enrollments.courseId, courseIds[0])
          : sql`${enrollments.courseId} = ANY(${sql`ARRAY[${sql.join(
              courseIds.map((id) => sql`${id}::int`),
              sql`, `,
            )}]`})`,
      )
      .groupBy(enrollments.courseId);

    const enrollmentMap = new Map(enrollmentStats.map((e) => [e.courseId, e]));

    // ── Lesson counts per course ─────────────────────────────────────────
    const lessonCounts = await db
      .select({
        courseId: lessons.courseId,
        totalLessons: sql<number>`count(*)::int`,
        totalDurationSeconds: sql<number>`coalesce(sum(${lessons.videoDuration}), 0)::int`,
      })
      .from(lessons)
      .where(
        courseIds.length === 1
          ? eq(lessons.courseId, courseIds[0])
          : sql`${lessons.courseId} = ANY(${sql`ARRAY[${sql.join(
              courseIds.map((id) => sql`${id}::int`),
              sql`, `,
            )}]`})`,
      )
      .groupBy(lessons.courseId);

    const lessonMap = new Map(lessonCounts.map((l) => [l.courseId, l]));

    // ── Quiz stats per course ────────────────────────────────────────────
    const quizStats = await db
      .select({
        courseId: quizzes.courseId,
        totalQuizzes: sql<number>`count(distinct ${quizzes.id})::int`,
        totalAttempts: sql<number>`count(${quizAttempts.id})::int`,
        avgScore: sql<number>`coalesce(round(avg(${quizAttempts.score})), 0)::int`,
        totalPointsAwarded: sql<number>`coalesce(sum(${quizAttempts.pointsEarned}), 0)::int`,
      })
      .from(quizzes)
      .leftJoin(quizAttempts, eq(quizzes.id, quizAttempts.quizId))
      .where(
        courseIds.length === 1
          ? eq(quizzes.courseId, courseIds[0])
          : sql`${quizzes.courseId} = ANY(${sql`ARRAY[${sql.join(
              courseIds.map((id) => sql`${id}::int`),
              sql`, `,
            )}]`})`,
      )
      .groupBy(quizzes.courseId);

    const quizMap = new Map(quizStats.map((q) => [q.courseId, q]));

    // ── Review stats per course ──────────────────────────────────────────
    const reviewStats = await db
      .select({
        courseId: reviews.courseId,
        totalReviews: sql<number>`count(*)::int`,
        avgRating: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1), 0)::float`,
      })
      .from(reviews)
      .where(
        courseIds.length === 1
          ? eq(reviews.courseId, courseIds[0])
          : sql`${reviews.courseId} = ANY(${sql`ARRAY[${sql.join(
              courseIds.map((id) => sql`${id}::int`),
              sql`, `,
            )}]`})`,
      )
      .groupBy(reviews.courseId);

    const reviewMap = new Map(reviewStats.map((r) => [r.courseId, r]));

    // ── Enrollment trends (last 30 days) ─────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrollmentTrends = await db
      .select({
        date: sql<string>`to_char(${enrollments.enrolledAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          courseCondition,
          gte(enrollments.enrolledAt, thirtyDaysAgo),
          parsedCourseId ? eq(enrollments.courseId, parsedCourseId) : sql`1=1`,
        ),
      )
      .groupBy(sql`to_char(${enrollments.enrolledAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${enrollments.enrolledAt}, 'YYYY-MM-DD')`);

    // ── Completion trends (last 30 days) ─────────────────────────────────
    const completionTrends = await db
      .select({
        date: sql<string>`to_char(${enrollments.completedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          courseCondition,
          gte(enrollments.completedAt!, thirtyDaysAgo),
          eq(enrollments.status, "completed"),
          parsedCourseId ? eq(enrollments.courseId, parsedCourseId) : sql`1=1`,
        ),
      )
      .groupBy(sql`to_char(${enrollments.completedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${enrollments.completedAt}, 'YYYY-MM-DD')`);

    // ── Assemble per-course report ───────────────────────────────────────
    const courseReports = courseRows.map((course) => {
      const enr = enrollmentMap.get(course.id);
      const les = lessonMap.get(course.id);
      const qui = quizMap.get(course.id);
      const rev = reviewMap.get(course.id);

      const totalEnrollments = enr?.totalEnrollments ?? 0;
      const completedCount = enr?.completed ?? 0;
      const completionRate =
        totalEnrollments > 0
          ? Math.round((completedCount / totalEnrollments) * 100)
          : 0;

      return {
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        published: course.published,
        accessRule: course.accessRule,
        price: course.price,
        viewsCount: course.viewsCount,
        createdAt: course.createdAt,
        enrollment: {
          total: totalEnrollments,
          notStarted: enr?.notStarted ?? 0,
          inProgress: enr?.inProgress ?? 0,
          completed: completedCount,
          completionRate,
          totalTimeSpentSeconds: enr?.totalTimeSpentSeconds ?? 0,
          avgTimeSpentSeconds: enr?.avgTimeSpentSeconds ?? 0,
        },
        content: {
          totalLessons: les?.totalLessons ?? 0,
          totalDurationSeconds: les?.totalDurationSeconds ?? 0,
        },
        quiz: {
          totalQuizzes: qui?.totalQuizzes ?? 0,
          totalAttempts: qui?.totalAttempts ?? 0,
          avgScore: qui?.avgScore ?? 0,
          totalPointsAwarded: qui?.totalPointsAwarded ?? 0,
        },
        reviews: {
          totalReviews: rev?.totalReviews ?? 0,
          avgRating: rev?.avgRating ?? 0,
        },
      };
    });

    // ── Summary across all courses ───────────────────────────────────────
    const summary = {
      totalCourses: courseRows.length,
      totalEnrollments: courseReports.reduce(
        (s, c) => s + c.enrollment.total,
        0,
      ),
      totalCompleted: courseReports.reduce(
        (s, c) => s + c.enrollment.completed,
        0,
      ),
      totalInProgress: courseReports.reduce(
        (s, c) => s + c.enrollment.inProgress,
        0,
      ),
      totalNotStarted: courseReports.reduce(
        (s, c) => s + c.enrollment.notStarted,
        0,
      ),
      totalViews: courseReports.reduce((s, c) => s + c.viewsCount, 0),
      overallCompletionRate: 0 as number,
      averageRating: 0 as number,
      totalTimeSpentSeconds: courseReports.reduce(
        (s, c) => s + c.enrollment.totalTimeSpentSeconds,
        0,
      ),
      totalQuizAttempts: courseReports.reduce(
        (s, c) => s + c.quiz.totalAttempts,
        0,
      ),
      averageQuizScore: 0 as number,
    };

    const totalEnr = summary.totalEnrollments;
    if (totalEnr > 0) {
      summary.overallCompletionRate = Math.round(
        (summary.totalCompleted / totalEnr) * 100,
      );
    }

    const coursesWithReviews = courseReports.filter(
      (c) => c.reviews.totalReviews > 0,
    );
    if (coursesWithReviews.length > 0) {
      summary.averageRating = parseFloat(
        (
          coursesWithReviews.reduce(
            (s, c) => s + Number(c.reviews.avgRating),
            0,
          ) / coursesWithReviews.length
        ).toFixed(1),
      );
    }

    const coursesWithQuizzes = courseReports.filter(
      (c) => c.quiz.totalAttempts > 0,
    );
    if (coursesWithQuizzes.length > 0) {
      summary.averageQuizScore = Math.round(
        coursesWithQuizzes.reduce((s, c) => s + c.quiz.avgScore, 0) /
          coursesWithQuizzes.length,
      );
    }

    return NextResponse.json({
      courses: courseReports,
      summary,
      trends: {
        enrollments: enrollmentTrends,
        completions: completionTrends,
      },
    });
  } catch (error) {
    console.error("Admin reporting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
