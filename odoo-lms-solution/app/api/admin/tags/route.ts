import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const allTags = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .orderBy(tags.name);

    return NextResponse.json({ tags: allTags });
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Tag name must be 100 characters or less" },
        { status: 400 },
      );
    }

    // Check if tag already exists (case-insensitive)
    const existing = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(eq(tags.name, trimmedName));

    if (existing.length > 0) {
      // Return the existing tag instead of erroring — this is friendlier for "create or get" UX
      return NextResponse.json({ tag: existing[0] }, { status: 200 });
    }

    const [newTag] = await db
      .insert(tags)
      .values({ name: trimmedName })
      .returning({
        id: tags.id,
        name: tags.name,
      });

    return NextResponse.json({ tag: newTag }, { status: 201 });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
