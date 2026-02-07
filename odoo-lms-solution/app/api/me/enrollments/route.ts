import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await db
      .select({
        enrollment: {
          id: enrollments.id,
          status: enrollments.status,
          enrolledAt: enrollments.enrolledAt,
          startedAt: enrollments.startedAt,
          completedAt: enrollments.completedAt,
          timeSpentSeconds: enrollments.timeSpentSeconds,
        },
        course: {
          id: courses.id,
          title: courses.title,
          description: courses.description,
          imageUrl: courses.imageUrl,
          accessRule: courses.accessRule,
          price: courses.price,
        },
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, session.user.id))
      .orderBy(enrollments.enrolledAt);

    return NextResponse.json({ enrollments: result });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
