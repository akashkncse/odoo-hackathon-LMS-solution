import { db } from "@/lib/db";
import { courses, quizzes, quizQuestions, quizOptions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

async function verifyCourseAccess(
  courseId: number,
  userId: number,
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

async function getQuizForCourse(courseId: number, quizId: string) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)));

  return quiz ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, quizId } = await params;
    const courseId = Number(id);

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

    // Fetch questions with their options
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.sortOrder), asc(quizQuestions.createdAt));

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db
          .select()
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
    console.error("Get quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, quizId } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await getQuizForCourse(courseId, quizId);

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      firstTryPoints,
      secondTryPoints,
      thirdTryPoints,
      fourthPlusPoints,
    } = body;

    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 },
        );
      }
      if (title.length > 255) {
        return NextResponse.json(
          { error: "Title must be 255 characters or less" },
          { status: 400 },
        );
      }
      updates.title = title.trim();
    }

    const pointsFields: Record<string, unknown> = {
      firstTryPoints,
      secondTryPoints,
      thirdTryPoints,
      fourthPlusPoints,
    };

    for (const [key, value] of Object.entries(pointsFields)) {
      if (value !== undefined) {
        if (
          typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < 0
        ) {
          return NextResponse.json(
            { error: `${key} must be a non-negative integer` },
            { status: 400 },
          );
        }
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    const [quiz] = await db
      .update(quizzes)
      .set(updates)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)))
      .returning();

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; quizId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, quizId } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await getQuizForCourse(courseId, quizId);

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Delete the quiz — cascades to questions, options, attempts, responses
    await db
      .delete(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)));

    return NextResponse.json({ message: "Quiz deleted" });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
