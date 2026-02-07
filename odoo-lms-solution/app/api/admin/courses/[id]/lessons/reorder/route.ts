import { db } from "@/lib/db";
import { courses, lessons } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function verifyCourseAccess(
  courseId: string,
  userId: string,
  role: string,
) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course) return null;

  if (role !== "superadmin" && course.responsibleId !== userId) {
    return null;
  }

  return course;
}

export async function PATCH(
  request: Request,
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

    const { id: courseId } = await params;

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const { orderedIds } = body;

    // Validate orderedIds is an array of strings
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "orderedIds must be a non-empty array of lesson IDs" },
        { status: 400 },
      );
    }

    for (const id of orderedIds) {
      if (typeof id !== "string") {
        return NextResponse.json(
          { error: "Each item in orderedIds must be a string (lesson ID)" },
          { status: 400 },
        );
      }
    }

    // Verify all lesson IDs belong to this course
    const existingLessons = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    const existingIds = new Set(existingLessons.map((l) => l.id));

    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return NextResponse.json(
          { error: `Lesson ID "${id}" does not belong to this course` },
          { status: 400 },
        );
      }
    }

    // Check for duplicates
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return NextResponse.json(
        { error: "orderedIds contains duplicate lesson IDs" },
        { status: 400 },
      );
    }

    // Update sortOrder for each lesson
    const updatePromises = orderedIds.map((lessonId: string, index: number) =>
      db
        .update(lessons)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(lessons.id, lessonId)),
    );

    await Promise.all(updatePromises);

    // Return the updated lessons in the new order
    const updatedLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.sortOrder);

    return NextResponse.json({ lessons: updatedLessons });
  } catch (error) {
    console.error("Reorder lessons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
