import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getCourseForAdmin(
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

    const { id } = await params;

    const course = await getCourseForAdmin(
      id,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const existing = await getCourseForAdmin(
      id,
      session.user.id,
      session.user.role,
    );

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      imageUrl,
      visibility,
      accessRule,
      price,
      published,
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

    if (description !== undefined) {
      updates.description = description || null;
    }

    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl || null;
    }

    if (visibility !== undefined) {
      if (!["everyone", "signed_in"].includes(visibility)) {
        return NextResponse.json(
          { error: "Visibility must be 'everyone' or 'signed_in'" },
          { status: 400 },
        );
      }
      updates.visibility = visibility;
    }

    if (accessRule !== undefined) {
      if (!["open", "invitation", "payment"].includes(accessRule)) {
        return NextResponse.json(
          { error: "Access rule must be 'open', 'invitation', or 'payment'" },
          { status: 400 },
        );
      }
      updates.accessRule = accessRule;
    }

    if (price !== undefined) {
      if (price === null) {
        updates.price = null;
      } else {
        const parsed = parseFloat(price);
        if (isNaN(parsed) || parsed < 0) {
          return NextResponse.json(
            { error: "Price must be a non-negative number" },
            { status: 400 },
          );
        }
        updates.price = String(parsed);
      }
    }

    if (published !== undefined) {
      if (typeof published !== "boolean") {
        return NextResponse.json(
          { error: "Published must be a boolean" },
          { status: 400 },
        );
      }
      updates.published = published;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    const [course] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const existing = await getCourseForAdmin(
      id,
      session.user.id,
      session.user.role,
    );

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db.delete(courses).where(eq(courses.id, id));

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
