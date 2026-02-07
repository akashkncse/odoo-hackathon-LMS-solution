import { db } from "@/lib/db";
import {
  courses,
  quizzes,
  quizQuestions,
  quizOptions,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
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

async function getQuizForCourse(courseId: string, quizId: string) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)));

  return quiz ?? null;
}

async function getQuestionForQuiz(quizId: string, questionId: string) {
  const [question] = await db
    .select()
    .from(quizQuestions)
    .where(
      and(
        eq(quizQuestions.id, questionId),
        eq(quizQuestions.quizId, quizId),
      ),
    );

  return question ?? null;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; quizId: string; questionId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: courseId, quizId, questionId } = await params;

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const quiz = await getQuizForCourse(courseId, quizId);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const existing = await getQuestionForQuiz(quizId, questionId);

    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { questionText, sortOrder, options } = body;

    // Update question fields
    const questionUpdates: Record<string, unknown> = {};

    if (questionText !== undefined) {
      if (
        typeof questionText !== "string" ||
        questionText.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "Question text cannot be empty" },
          { status: 400 },
        );
      }
      questionUpdates.questionText = questionText.trim();
    }

    if (sortOrder !== undefined) {
      if (typeof sortOrder !== "number" || sortOrder < 0) {
        return NextResponse.json(
          { error: "Sort order must be a non-negative number" },
          { status: 400 },
        );
      }
      questionUpdates.sortOrder = sortOrder;
    }

    // Update the question row if there are field changes
    if (Object.keys(questionUpdates).length > 0) {
      await db
        .update(quizQuestions)
        .set(questionUpdates)
        .where(eq(quizQuestions.id, questionId));
    }

    // If options are provided, replace all existing options with the new set
    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: "At least 2 options are required" },
          { status: 400 },
        );
      }

      // Validate each option
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt || typeof opt !== "object") {
          return NextResponse.json(
            { error: `Option ${i + 1} is invalid` },
            { status: 400 },
          );
        }
        if (
          !opt.optionText ||
          typeof opt.optionText !== "string" ||
          opt.optionText.trim().length === 0
        ) {
          return NextResponse.json(
            { error: `Option ${i + 1} text is required` },
            { status: 400 },
          );
        }
        if (opt.optionText.length > 500) {
          return NextResponse.json(
            { error: `Option ${i + 1} text must be 500 characters or less` },
            { status: 400 },
          );
        }
      }

      // Validate at least one correct option
      const hasCorrect = options.some(
        (opt: { isCorrect?: boolean }) => opt.isCorrect === true,
      );
      if (!hasCorrect) {
        return NextResponse.json(
          { error: "At least one option must be marked as correct" },
          { status: 400 },
        );
      }

      // Delete all existing options for this question
      await db
        .delete(quizOptions)
        .where(eq(quizOptions.questionId, questionId));

      // Insert new options
      const optionValues = options.map(
        (
          opt: { optionText: string; isCorrect?: boolean; sortOrder?: number },
          index: number,
        ) => ({
          questionId,
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect ?? false,
          sortOrder: opt.sortOrder ?? index,
        }),
      );

      await db.insert(quizOptions).values(optionValues);
    }

    // Return the updated question with its options
    const [updatedQuestion] = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId));

    const updatedOptions = await db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.questionId, questionId))
      .orderBy(asc(quizOptions.sortOrder));

    return NextResponse.json({
      question: {
        ...updatedQuestion,
        options: updatedOptions,
      },
    });
  } catch (error) {
    console.error("Update quiz question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; quizId: string; questionId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: courseId, quizId, questionId } = await params;

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const quiz = await getQuizForCourse(courseId, quizId);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const existing = await getQuestionForQuiz(quizId, questionId);

    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    // Delete the question — cascades to options
    await db
      .delete(quizQuestions)
      .where(
        and(
          eq(quizQuestions.id, questionId),
          eq(quizQuestions.quizId, quizId),
        ),
      );

    return NextResponse.json({ message: "Question deleted" });
  } catch (error) {
    console.error("Delete quiz question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
