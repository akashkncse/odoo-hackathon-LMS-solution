import { db } from "@/lib/db";
import { courses, lessons, enrollments, lessonProgress } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to track progress" },
        { status: 401 },
      );
    }

    const { id, lessonId } = await params;
    const courseId = Number(id);

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["not_started", "in_progress", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Status must be one of: not_started, in_progress, completed",
        },
        { status: 400 },
      );
    }

    // Verify the course exists and is published
    const [course] = await db
      .select({
        id: courses.id,
        published: courses.published,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course || !course.published) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify the user is enrolled
    const [enrollment] = await db
      .select({
        id: enrollments.id,
        status: enrollments.status,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to track progress" },
        { status: 403 },
      );
    }

    // Verify the lesson exists and belongs to this course
    const [lesson] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check for existing progress record
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.lessonId, lessonId),
          eq(lessonProgress.userId, session.user.id),
        ),
      );

    const now = new Date();
    let progress;

    if (existing) {
      // Don't allow going back from completed to a lesser status
      if (existing.status === "completed" && status !== "completed") {
        return NextResponse.json({
          progress: {
            id: existing.id,
            status: existing.status,
            startedAt: existing.startedAt,
            completedAt: existing.completedAt,
          },
        });
      }

      const updates: Record<string, unknown> = { status };

      if (status === "in_progress" && !existing.startedAt) {
        updates.startedAt = now;
      }

      if (status === "completed") {
        updates.completedAt = now;
        if (!existing.startedAt) {
          updates.startedAt = now;
        }
      }

      const [updated] = await db
        .update(lessonProgress)
        .set(updates)
        .where(eq(lessonProgress.id, existing.id))
        .returning();

      progress = updated;
    } else {
      // Create new progress record
      const values: Record<string, unknown> = {
        userId: session.user.id,
        lessonId,
        status,
      };

      if (status === "in_progress" || status === "completed") {
        values.startedAt = now;
      }

      if (status === "completed") {
        values.completedAt = now;
      }

      const [created] = await db
        .insert(lessonProgress)
        .values(values as typeof lessonProgress.$inferInsert)
        .returning();

      progress = created;
    }

    // Update enrollment status if needed
    if (status === "in_progress" && enrollment.status === "not_started") {
      await db
        .update(enrollments)
        .set({ status: "in_progress", startedAt: now })
        .where(eq(enrollments.id, enrollment.id));
    }

    // If marking as completed, check if all lessons in the course are now complete
    if (status === "completed") {
      const allLessons = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.courseId, courseId));

      const completedProgress = await db
        .select({ lessonId: lessonProgress.lessonId })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.userId, session.user.id),
            eq(lessonProgress.status, "completed"),
          ),
        );

      const completedLessonIds = new Set(
        completedProgress.map((p) => p.lessonId),
      );
      const allComplete = allLessons.every((l) => completedLessonIds.has(l.id));

      if (allComplete) {
        await db
          .update(enrollments)
          .set({ status: "completed", completedAt: now })
          .where(eq(enrollments.id, enrollment.id));
      } else if (enrollment.status === "not_started") {
        await db
          .update(enrollments)
          .set({ status: "in_progress", startedAt: now })
          .where(eq(enrollments.id, enrollment.id));
      }
    }

    return NextResponse.json({
      progress: {
        id: progress.id,
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
      },
    });
  } catch (error) {
    console.error("Update lesson progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
