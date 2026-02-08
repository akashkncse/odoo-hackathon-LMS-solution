import { db } from "@/lib/db";
import {
  courses,
  lessons,
  enrollments,
  lessonProgress,
  reviews,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const courseId = Number(id);
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
      .where(eq(courses.id, courseId));

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
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.sortOrder);

    // Check enrollment status if user is logged in
    let enrollment = null;
    let progress: {
      completedLessons: number;
      totalLessons: number;
      percentComplete: number;
      lessonStatuses: Record<
        string,
        "not_started" | "in_progress" | "completed"
      >;
    } | null = null;

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
            eq(enrollments.courseId, courseId),
            eq(enrollments.userId, session.user.id),
          ),
        );

      enrollment = existing || null;

      // If enrolled, fetch lesson progress for this user
      if (enrollment && courseLessons.length > 0) {
        const lessonIds = courseLessons.map((l) => l.id);

        const progressRows = await db
          .select({
            lessonId: lessonProgress.lessonId,
            status: lessonProgress.status,
          })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, session.user.id),
              // Filter to only lessons in this course
              // We use an IN-style check via multiple conditions
            ),
          );

        // Build a map of lessonId -> status (only for lessons in this course)
        const lessonIdSet = new Set(lessonIds);
        const lessonStatuses: Record<
          string,
          "not_started" | "in_progress" | "completed"
        > = {};

        // Initialize all lessons as not_started
        for (const lessonId of lessonIds) {
          lessonStatuses[lessonId] = "not_started";
        }

        // Overlay actual progress
        for (const row of progressRows) {
          if (lessonIdSet.has(row.lessonId)) {
            lessonStatuses[row.lessonId] = row.status;
          }
        }

        const completedLessons = Object.values(lessonStatuses).filter(
          (s) => s === "completed",
        ).length;

        const totalLessons = courseLessons.length;
        const percentComplete =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        progress = {
          completedLessons,
          totalLessons,
          percentComplete,
          lessonStatuses,
        };
      }
    }

    // Fetch average rating and review count
    const [reviewStats] = await db
      .select({
        averageRating: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1), 0)::float`,
        totalReviews: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.courseId, courseId));

    return NextResponse.json({
      course: {
        ...course,
        averageRating: Number(reviewStats?.averageRating ?? 0),
        totalReviews: Number(reviewStats?.totalReviews ?? 0),
      },
      lessons: courseLessons,
      enrollment,
      progress,
    });
  } catch (error) {
    console.error("Get course detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
