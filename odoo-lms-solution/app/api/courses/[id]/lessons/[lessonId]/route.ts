import { db } from "@/lib/db";
import { courses, lessons, enrollments, lessonProgress } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view lesson content" },
        { status: 401 },
      );
    }

    const { id: courseId, lessonId } = await params;

    // Fetch the course and verify it's published
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        published: courses.published,
        visibility: courses.visibility,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course || !course.published) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    // Check visibility
    if (course.visibility === "signed_in" && !session) {
      return NextResponse.json(
        { error: "You must be signed in to view this course" },
        { status: 401 },
      );
    }

    // Verify the user is enrolled in this course
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
        { error: "You must be enrolled in this course to view lesson content" },
        { status: 403 },
      );
    }

    // Fetch the full lesson content
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(
        and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)),
      );

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 },
      );
    }

    // Fetch all lessons for this course (for navigation — prev/next)
    const allLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        type: lessons.type,
        sortOrder: lessons.sortOrder,
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.sortOrder);

    // Find prev and next lessons
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson =
      currentIndex < allLessons.length - 1
        ? allLessons[currentIndex + 1]
        : null;

    // Fetch the user's progress for this lesson
    const [progress] = await db
      .select({
        id: lessonProgress.id,
        status: lessonProgress.status,
        startedAt: lessonProgress.startedAt,
        completedAt: lessonProgress.completedAt,
      })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.lessonId, lessonId),
          eq(lessonProgress.userId, session.user.id),
        ),
      );

    // If no progress record exists and enrollment is not_started, update enrollment to in_progress
    if (!progress && enrollment.status === "not_started") {
      await db
        .update(enrollments)
        .set({
          status: "in_progress",
          startedAt: new Date(),
        })
        .where(eq(enrollments.id, enrollment.id));
    }

    // Auto-create a "not_started" progress record if none exists
    if (!progress) {
      await db.insert(lessonProgress).values({
        userId: session.user.id,
        lessonId,
        status: "not_started",
      });
    }

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        type: lesson.type,
        description: lesson.description,
        sortOrder: lesson.sortOrder,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        fileUrl: lesson.fileUrl,
        allowDownload: lesson.allowDownload,
        quizId: lesson.quizId,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      },
      course: {
        id: course.id,
        title: course.title,
      },
      progress: progress ?? { status: "not_started", startedAt: null, completedAt: null },
      navigation: {
        currentIndex,
        totalLessons: allLessons.length,
        prevLesson,
        nextLesson,
      },
    });
  } catch (error) {
    console.error("Get lesson content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
