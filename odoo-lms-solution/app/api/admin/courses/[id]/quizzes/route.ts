import { db } from "@/lib/db";
import { courses, quizzes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
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

export async function GET(
  _request: Request,
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

    const { id } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const result = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.courseId, courseId))
      .orderBy(asc(quizzes.createdAt));

    return NextResponse.json({ quizzes: result });
  } catch (error) {
    console.error("Get quizzes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
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

    const { id } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      firstTryPoints,
      secondTryPoints,
      thirdTryPoints,
      fourthPlusPoints,
    } = body;

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: "Title must be 255 characters or less" },
        { status: 400 },
      );
    }

    // Validate points (optional — use defaults if not provided)
    const pointsFields = {
      firstTryPoints,
      secondTryPoints,
      thirdTryPoints,
      fourthPlusPoints,
    };

    for (const [key, value] of Object.entries(pointsFields)) {
      if (value !== undefined && value !== null) {
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
      }
    }

    const [quiz] = await db
      .insert(quizzes)
      .values({
        courseId,
        title: title.trim(),
        firstTryPoints: firstTryPoints ?? 10,
        secondTryPoints: secondTryPoints ?? 7,
        thirdTryPoints: thirdTryPoints ?? 5,
        fourthPlusPoints: fourthPlusPoints ?? 2,
      })
      .returning();

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
