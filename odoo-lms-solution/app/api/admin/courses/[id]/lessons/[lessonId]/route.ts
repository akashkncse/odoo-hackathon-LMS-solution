import { db } from "@/lib/db";
import { courses, lessons } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
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

async function getLessonForCourse(courseId: number, lessonId: string) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));

  return lesson ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, lessonId } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const lesson = await getLessonForCourse(courseId, lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Get lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, lessonId } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await getLessonForCourse(courseId, lessonId);

    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      type,
      description,
      videoUrl,
      videoDuration,
      fileUrl,
      allowDownload,
      sortOrder,
      quizId,
    } = body;

    const updates: Record<string, unknown> = {};

    // Validate and set title
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

    // Validate and set type
    if (type !== undefined) {
      const validTypes = ["video", "document", "image", "quiz"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: "Type must be one of: video, document, image, quiz" },
          { status: 400 },
        );
      }
      updates.type = type;
    }

    // Set description
    if (description !== undefined) {
      updates.description = description || null;
    }

    // Validate and set videoUrl
    if (videoUrl !== undefined) {
      if (videoUrl === null || videoUrl === "") {
        updates.videoUrl = null;
      } else {
        if (typeof videoUrl !== "string" || videoUrl.length > 500) {
          return NextResponse.json(
            { error: "Video URL must be a string of 500 characters or less" },
            { status: 400 },
          );
        }
        updates.videoUrl = videoUrl;
      }
    }

    // Validate and set videoDuration
    if (videoDuration !== undefined) {
      if (videoDuration === null) {
        updates.videoDuration = null;
      } else {
        if (typeof videoDuration !== "number" || videoDuration < 0) {
          return NextResponse.json(
            { error: "Video duration must be a non-negative number" },
            { status: 400 },
          );
        }
        updates.videoDuration = videoDuration;
      }
    }

    // Validate and set fileUrl
    if (fileUrl !== undefined) {
      if (fileUrl === null || fileUrl === "") {
        updates.fileUrl = null;
      } else {
        if (typeof fileUrl !== "string" || fileUrl.length > 500) {
          return NextResponse.json(
            { error: "File URL must be a string of 500 characters or less" },
            { status: 400 },
          );
        }
        updates.fileUrl = fileUrl;
      }
    }

    // Validate and set allowDownload
    if (allowDownload !== undefined) {
      if (typeof allowDownload !== "boolean") {
        return NextResponse.json(
          { error: "allowDownload must be a boolean" },
          { status: 400 },
        );
      }
      updates.allowDownload = allowDownload;
    }

    // Validate and set sortOrder
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== "number" || sortOrder < 0) {
        return NextResponse.json(
          { error: "Sort order must be a non-negative number" },
          { status: 400 },
        );
      }
      updates.sortOrder = sortOrder;
    }

    // Validate and set quizId
    if (quizId !== undefined) {
      if (quizId === null || quizId === "") {
        updates.quizId = null;
      } else {
        if (typeof quizId !== "string") {
          return NextResponse.json(
            { error: "quizId must be a string" },
            { status: 400 },
          );
        }
        updates.quizId = quizId;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    const [lesson] = await db
      .update(lessons)
      .set(updates)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
      .returning();

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, lessonId } = await params;
    const courseId = Number(id);

    const course = await verifyCourseAccess(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await getLessonForCourse(courseId, lessonId);

    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    await db
      .delete(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));

    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    console.error("Delete lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
