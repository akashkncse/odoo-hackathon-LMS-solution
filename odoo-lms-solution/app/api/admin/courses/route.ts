import { db } from "@/lib/db";
import { courses, tags, courseTags } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let result;

    if (session.user.role === "superadmin") {
      result = await db.select().from(courses).orderBy(courses.createdAt);
    } else {
      result = await db
        .select()
        .from(courses)
        .where(eq(courses.responsibleId, session.user.id))
        .orderBy(courses.createdAt);
    }

    return NextResponse.json({ courses: result });
  } catch (error) {
    console.error("Get courses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: "Title must be 255 characters or less" },
        { status: 400 },
      );
    }

    if (visibility && !["everyone", "signed_in"].includes(visibility)) {
      return NextResponse.json(
        { error: "Visibility must be 'everyone' or 'signed_in'" },
        { status: 400 },
      );
    }

    if (accessRule && !["open", "invitation", "payment"].includes(accessRule)) {
      return NextResponse.json(
        { error: "Access rule must be 'open', 'invitation', or 'payment'" },
        { status: 400 },
      );
    }

    if (price !== undefined && price !== null) {
      const parsed = parseFloat(price);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "Price must be a non-negative number" },
          { status: 400 },
        );
      }
    }

    const body_full = body;
    const tagIds: string[] | undefined = body_full.tagIds;

    const [course] = await db
      .insert(courses)
      .values({
        title: title.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
        visibility: visibility || "everyone",
        accessRule: accessRule || "open",
        price: price !== undefined && price !== null ? String(price) : null,
        published: published ?? false,
        responsibleId: session.user.id,
      })
      .returning();

    // Associate tags if provided
    let courseTags_result: { id: string; name: string }[] = [];
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      // Verify all tag IDs exist
      const existingTags = await db
        .select({ id: tags.id, name: tags.name })
        .from(tags)
        .where(inArray(tags.id, tagIds));

      if (existingTags.length > 0) {
        await db.insert(courseTags).values(
          existingTags.map((tag) => ({
            courseId: course.id,
            tagId: tag.id,
          })),
        );
        courseTags_result = existingTags;
      }
    }

    return NextResponse.json(
      { course: { ...course, tags: courseTags_result } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
