import { db } from "@/lib/db";
import {
  courses,
  quizzes,
  quizQuestions,
  quizOptions,
  enrollments,
  quizAttempts,
  quizResponses,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, asc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to submit a quiz attempt" },
        { status: 401 },
      );
    }

    const { id: courseId, quizId } = await params;

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
        { error: "You must be enrolled in this course to take quizzes" },
        { status: 403 },
      );
    }

    // Fetch the quiz
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { answers } = body;

    // Validate answers format: { questionId: selectedOptionId }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json(
        {
          error:
            "Answers must be an object mapping questionId to selectedOptionId",
        },
        { status: 400 },
      );
    }

    // Fetch all questions for this quiz
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.sortOrder));

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "This quiz has no questions" },
        { status: 400 },
      );
    }

    // Validate that every question has an answer
    const questionIds = questions.map((q) => q.id);
    for (const qId of questionIds) {
      if (!answers[qId] || typeof answers[qId] !== "string") {
        return NextResponse.json(
          { error: `Missing or invalid answer for question ${qId}` },
          { status: 400 },
        );
      }
    }

    // Fetch all correct options for the quiz questions (batch)
    const allOptions = await db
      .select()
      .from(quizOptions)
      .where(sql`${quizOptions.questionId} IN ${questionIds}`);

    // Build lookup maps
    const correctOptionsByQuestion = new Map<string, Set<string>>();
    const validOptionsByQuestion = new Map<string, Set<string>>();

    for (const opt of allOptions) {
      // Track all valid options
      if (!validOptionsByQuestion.has(opt.questionId)) {
        validOptionsByQuestion.set(opt.questionId, new Set());
      }
      validOptionsByQuestion.get(opt.questionId)!.add(opt.id);

      // Track correct options
      if (opt.isCorrect) {
        if (!correctOptionsByQuestion.has(opt.questionId)) {
          correctOptionsByQuestion.set(opt.questionId, new Set());
        }
        correctOptionsByQuestion.get(opt.questionId)!.add(opt.id);
      }
    }

    // Validate that each selected option belongs to its question
    for (const qId of questionIds) {
      const selectedOptionId = answers[qId] as string;
      const validOptions = validOptionsByQuestion.get(qId);
      if (!validOptions || !validOptions.has(selectedOptionId)) {
        return NextResponse.json(
          {
            error: `Invalid option selected for question ${qId}`,
          },
          { status: 400 },
        );
      }
    }

    // Compute score (number of correct answers)
    let correctCount = 0;
    const responseRecords: {
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
    }[] = [];

    for (const qId of questionIds) {
      const selectedOptionId = answers[qId] as string;
      const correctOptions = correctOptionsByQuestion.get(qId);
      const isCorrect = correctOptions
        ? correctOptions.has(selectedOptionId)
        : false;

      if (isCorrect) {
        correctCount++;
      }

      responseRecords.push({
        questionId: qId,
        selectedOptionId,
        isCorrect,
      });
    }

    const score = Math.round((correctCount / questions.length) * 100);

    // Determine attempt number for this user + quiz
    const existingAttempts = await db
      .select({ attemptNumber: quizAttempts.attemptNumber })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.userId, session.user.id),
        ),
      );

    const attemptNumber = existingAttempts.length + 1;

    // Determine points earned based on attempt number and quiz config
    // Points are only awarded if the user got a perfect score (100%)
    let pointsEarned = 0;

    if (score === 100) {
      // Check if the user has already earned points for a perfect score on this quiz
      const previousPerfect =
        existingAttempts.length > 0
          ? await db
              .select({ id: quizAttempts.id })
              .from(quizAttempts)
              .where(
                and(
                  eq(quizAttempts.quizId, quizId),
                  eq(quizAttempts.userId, session.user.id),
                  eq(quizAttempts.score, 100),
                ),
              )
          : [];

      // Only award points on the first perfect score
      if (previousPerfect.length === 0) {
        switch (attemptNumber) {
          case 1:
            pointsEarned = quiz.firstTryPoints;
            break;
          case 2:
            pointsEarned = quiz.secondTryPoints;
            break;
          case 3:
            pointsEarned = quiz.thirdTryPoints;
            break;
          default:
            pointsEarned = quiz.fourthPlusPoints;
            break;
        }
      }
    }

    const now = new Date();

    // Create the attempt record
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: session.user.id,
        quizId,
        attemptNumber,
        score,
        pointsEarned,
        startedAt: now,
        completedAt: now,
      })
      .returning();

    // Create all response records
    const responseValues = responseRecords.map((r) => ({
      attemptId: attempt.id,
      questionId: r.questionId,
      selectedOptionId: r.selectedOptionId,
      isCorrect: r.isCorrect,
    }));

    await db.insert(quizResponses).values(responseValues);

    // Award points to the user if earned
    if (pointsEarned > 0) {
      await db
        .update(users)
        .set({
          totalPoints: sql`${users.totalPoints} + ${pointsEarned}`,
          updatedAt: now,
        })
        .where(eq(users.id, session.user.id));
    }

    // Build the results — only reveal correct answers for questions the user got right
    const results = responseRecords.map((r) => {
      const correctOptions = correctOptionsByQuestion.get(r.questionId);
      const correctOptionIds = r.isCorrect
        ? correctOptions
          ? Array.from(correctOptions)
          : []
        : [];

      return {
        questionId: r.questionId,
        selectedOptionId: r.selectedOptionId,
        isCorrect: r.isCorrect,
        correctOptionIds,
      };
    });

    return NextResponse.json(
      {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          score: attempt.score,
          pointsEarned: attempt.pointsEarned,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
        },
        summary: {
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          scorePercent: score,
          pointsEarned,
          isFirstPerfect: score === 100 && pointsEarned > 0,
        },
        results,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Submit quiz attempt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
