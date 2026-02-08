import { db } from "@/lib/db";
import {
  courses,
  quizzes,
  quizQuestions,
  quizOptions,
  enrollments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view quizzes" },
        { status: 401 },
      );
    }

    const { id, quizId } = await params;
    const courseId = Number(id);

    // Verify the course exists and is published
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
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
      .select({
        id: quizzes.id,
        courseId: quizzes.courseId,
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

    // Fetch questions
    const questions = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        sortOrder: quizQuestions.sortOrder,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.sortOrder), asc(quizQuestions.createdAt));

    // Fetch options for each question — WITHOUT isCorrect
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db
          .select({
            id: quizOptions.id,
            optionText: quizOptions.optionText,
            sortOrder: quizOptions.sortOrder,
          })
          .from(quizOptions)
          .where(eq(quizOptions.questionId, question.id))
          .orderBy(asc(quizOptions.sortOrder));

        return {
          ...question,
          options,
        };
      }),
    );

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: questionsWithOptions,
      },
    });
  } catch (error) {
    console.error("Get learner quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
