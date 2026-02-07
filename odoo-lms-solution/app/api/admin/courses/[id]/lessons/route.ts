import { db } from "@/lib/db";
import { courses, lessons } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, asc, max } from "drizzle-orm";
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

    const { id: courseId } = await params;

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
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.sortOrder), asc(lessons.createdAt));

    return NextResponse.json({ lessons: result });
  } catch (error) {
    console.error("Get lessons error:", error);
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

    const { id: courseId } = await params;

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
      type,
      description,
      videoUrl,
      videoDuration,
      fileUrl,
      allowDownload,
      sortOrder,
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

    // Validate type
    const validTypes = ["video", "document", "image", "quiz"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type must be one of: video, document, image, quiz" },
        { status: 400 },
      );
    }

    // Validate video fields
    if (type === "video" && videoUrl) {
      if (typeof videoUrl !== "string" || videoUrl.length > 500) {
        return NextResponse.json(
          { error: "Video URL must be a string of 500 characters or less" },
          { status: 400 },
        );
      }
    }

    if (videoDuration !== undefined && videoDuration !== null) {
      if (typeof videoDuration !== "number" || videoDuration < 0) {
        return NextResponse.json(
          { error: "Video duration must be a non-negative number" },
          { status: 400 },
        );
      }
    }

    // Validate file URL
    if (fileUrl) {
      if (typeof fileUrl !== "string" || fileUrl.length > 500) {
        return NextResponse.json(
          { error: "File URL must be a string of 500 characters or less" },
          { status: 400 },
        );
      }
    }

    // Determine sortOrder: if not provided, place at the end
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const [maxResult] = await db
        .select({ maxOrder: max(lessons.sortOrder) })
        .from(lessons)
        .where(eq(lessons.courseId, courseId));

      finalSortOrder = (maxResult?.maxOrder ?? -1) + 1;
    } else {
      if (typeof finalSortOrder !== "number" || finalSortOrder < 0) {
        return NextResponse.json(
          { error: "Sort order must be a non-negative number" },
          { status: 400 },
        );
      }
    }

    const [lesson] = await db
      .insert(lessons)
      .values({
        courseId,
        title: title.trim(),
        type,
        description: description || null,
        sortOrder: finalSortOrder,
        responsibleId: session.user.id,
        videoUrl: videoUrl || null,
        videoDuration: videoDuration ?? null,
        fileUrl: fileUrl || null,
        allowDownload: allowDownload ?? false,
      })
      .returning();

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Create lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
