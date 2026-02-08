import { db } from "@/lib/db";
import { courses, quizzes, enrollments, quizAttempts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view attempt history" },
        { status: 401 },
      );
    }

    const { id, quizId } = await params;
    const courseId = Number(id);

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

    // Verify the user is enrolled in this course
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to view attempts" },
        { status: 403 },
      );
    }

    // Verify the quiz exists and belongs to this course
    const [quiz] = await db
      .select({
        id: quizzes.id,
        title: quizzes.title,
        firstTryPoints: quizzes.firstTryPoints,
        secondTryPoints: quizzes.secondTryPoints,
        thirdTryPoints: quizzes.thirdTryPoints,
        fourthPlusPoints: quizzes.fourthPlusPoints,
      })
      .from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Fetch all attempts by this user for this quiz
    const attempts = await db
      .select({
        id: quizAttempts.id,
        attemptNumber: quizAttempts.attemptNumber,
        score: quizAttempts.score,
        pointsEarned: quizAttempts.pointsEarned,
        startedAt: quizAttempts.startedAt,
        completedAt: quizAttempts.completedAt,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, session.user.id),
        ),
      )
      .orderBy(desc(quizAttempts.attemptNumber));

    // Compute summary stats
    const totalAttempts = attempts.length;
    const bestScore =
      totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
    const totalPointsEarned = attempts.reduce(
      (sum, a) => sum + a.pointsEarned,
      0,
    );
    const hasPerfectScore = attempts.some((a) => a.score === 100);

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
      },
      summary: {
        totalAttempts,
        bestScore,
        totalPointsEarned,
        hasPerfectScore,
      },
      attempts,
    });
  } catch (error) {
    console.error("Get quiz attempts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
