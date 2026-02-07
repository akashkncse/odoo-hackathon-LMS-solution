import { db } from "@/lib/db";
import { courses, lessons, enrollments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();

    // Fetch the course
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageUrl: courses.imageUrl,
        visibility: courses.visibility,
        accessRule: courses.accessRule,
        price: courses.price,
        published: courses.published,
        viewsCount: courses.viewsCount,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(eq(courses.id, id));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only show published courses through this public endpoint
    if (!course.published) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check visibility — if "signed_in" only, require auth
    if (course.visibility === "signed_in" && !session) {
      return NextResponse.json(
        { error: "You must be signed in to view this course" },
        { status: 401 },
      );
    }

    // Increment view count
    await db
      .update(courses)
      .set({ viewsCount: course.viewsCount + 1 })
      .where(eq(courses.id, id));

    // Fetch lessons for this course (metadata only, not content)
    const courseLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        type: lessons.type,
        description: lessons.description,
        sortOrder: lessons.sortOrder,
      })
      .from(lessons)
      .where(eq(lessons.courseId, id))
      .orderBy(lessons.sortOrder);

    // Check enrollment status if user is logged in
    let enrollment = null;

    if (session) {
      const [existing] = await db
        .select({
          id: enrollments.id,
          status: enrollments.status,
          enrolledAt: enrollments.enrolledAt,
          startedAt: enrollments.startedAt,
          completedAt: enrollments.completedAt,
        })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, id),
            eq(enrollments.userId, session.user.id),
          ),
        );

      enrollment = existing || null;
    }

    return NextResponse.json({
      course: {
        ...course,
        viewsCount: course.viewsCount + 1,
      },
      lessons: courseLessons,
      enrollment,
    });
  } catch (error) {
    console.error("Get course detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
