import { db } from "@/lib/db";
import { courses, users, quizzes, enrollments } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Count published courses
    const [courseCount] = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.published, true));

    // Count learner users
    const [learnerCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "learner"));

    // Count quizzes
    const [quizCount] = await db.select({ count: count() }).from(quizzes);

    // Count completed enrollments for completion rate
    const [totalEnrollments] = await db
      .select({ count: count() })
      .from(enrollments);

    const [completedEnrollments] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.status, "completed"));

    const completionRate =
      totalEnrollments.count > 0
        ? Math.round((completedEnrollments.count / totalEnrollments.count) * 100)
        : 0;

    // Use real numbers but set minimum display values so the landing page
    // doesn't look empty on a fresh install
    const stats = {
      courses: Math.max(courseCount.count, 0),
      learners: Math.max(learnerCount.count, 0),
      quizzes: Math.max(quizCount.count, 0),
      completionRate,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
