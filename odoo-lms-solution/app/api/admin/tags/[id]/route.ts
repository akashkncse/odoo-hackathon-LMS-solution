import { db } from "@/lib/db";
import { tags, courseTags } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: tagId } = await params;

    // Check if tag exists
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.id, tagId));

    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Delete associations first (cascade should handle this, but be explicit)
    await db.delete(courseTags).where(eq(courseTags.tagId, tagId));

    // Delete the tag
    await db.delete(tags).where(eq(tags.id, tagId));

    return NextResponse.json({ message: "Tag deleted" });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
