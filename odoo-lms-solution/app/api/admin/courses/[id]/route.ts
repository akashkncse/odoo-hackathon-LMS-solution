import { db } from "@/lib/db";
import { courses, tags, courseTags } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getCourseForAdmin(
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

async function getCourseTagIds(courseId: number) {
  const rows = await db
    .select({
      tagId: courseTags.tagId,
      tagName: tags.name,
    })
    .from(courseTags)
    .innerJoin(tags, eq(courseTags.tagId, tags.id))
    .where(eq(courseTags.courseId, courseId));

  return rows.map((r) => ({ id: r.tagId, name: r.tagName }));
}

async function syncCourseTags(courseId: number, tagIds: string[]) {
  // Delete existing associations
  await db.delete(courseTags).where(eq(courseTags.courseId, courseId));

  // Insert new associations
  if (tagIds.length > 0) {
    // Verify all tag IDs exist
    const existingTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.id, tagIds));

    const validTagIds = existingTags.map((t) => t.id);

    if (validTagIds.length > 0) {
      await db.insert(courseTags).values(
        validTagIds.map((tagId) => ({
          courseId,
          tagId,
        })),
      );
    }
  }
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

    const course = await getCourseForAdmin(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseTags = await getCourseTagIds(courseId);

    return NextResponse.json({
      course: {
        ...course,
        tags: courseTags,
      },
    });
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
    const courseId = Number(id);

    const existing = await getCourseForAdmin(
      courseId,
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
      tagIds,
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

    // When access rule is "payment", price must be greater than 0
    const effectiveAccessRule = updates.accessRule ?? existing.accessRule;
    const effectivePrice =
      updates.price !== undefined ? updates.price : existing.price;
    if (effectiveAccessRule === "payment") {
      const priceNum = effectivePrice ? parseFloat(String(effectivePrice)) : 0;
      if (!priceNum || priceNum <= 0) {
        return NextResponse.json(
          { error: "Amount must be greater than 0 for paid courses" },
          { status: 400 },
        );
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

    if (Object.keys(updates).length === 0 && tagIds === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();

      await db.update(courses).set(updates).where(eq(courses.id, courseId));
    }

    // Sync tags if provided
    if (tagIds !== undefined) {
      if (!Array.isArray(tagIds)) {
        return NextResponse.json(
          { error: "tagIds must be an array" },
          { status: 400 },
        );
      }
      await syncCourseTags(courseId, tagIds);
    }

    // Fetch the updated course with tags
    const [updatedCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    const updatedTags = await getCourseTagIds(courseId);

    return NextResponse.json({
      course: {
        ...updatedCourse,
        tags: updatedTags,
      },
    });
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
    const courseId = Number(id);

    const existing = await getCourseForAdmin(
      courseId,
      session.user.id,
      session.user.role,
    );

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db.delete(courses).where(eq(courses.id, courseId));

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
