import { db } from "@/lib/db";
import { discussionReplies } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// DELETE /api/discussions/[threadId]/replies/[replyId] — delete a reply (admin or author)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ threadId: string; replyId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { replyId } = await params;
    const isAdmin =
      session.user.role === "superadmin" || session.user.role === "instructor";

    // Fetch existing reply
    const [existing] = await db
      .select()
      .from(discussionReplies)
      .where(eq(discussionReplies.id, replyId));

    if (!existing) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const isAuthor = existing.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: "Only admins can delete other users' replies" },
        { status: 403 }
      );
    }

    await db
      .delete(discussionReplies)
      .where(eq(discussionReplies.id, replyId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
