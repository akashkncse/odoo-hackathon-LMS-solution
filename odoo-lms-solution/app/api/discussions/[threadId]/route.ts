import { db } from "@/lib/db";
import {
  discussionThreads,
  discussionReplies,
  users,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/discussions/[threadId] — get a single thread with its replies
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { threadId } = await params;

    // Fetch thread with author info
    const [thread] = await db
      .select({
        id: discussionThreads.id,
        title: discussionThreads.title,
        body: discussionThreads.body,
        isPinned: discussionThreads.isPinned,
        isArchived: discussionThreads.isArchived,
        createdAt: discussionThreads.createdAt,
        updatedAt: discussionThreads.updatedAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(discussionThreads)
      .innerJoin(users, eq(discussionThreads.authorId, users.id))
      .where(eq(discussionThreads.id, threadId));

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Fetch replies with author info
    const replies = await db
      .select({
        id: discussionReplies.id,
        body: discussionReplies.body,
        createdAt: discussionReplies.createdAt,
        updatedAt: discussionReplies.updatedAt,
        authorId: users.id,
        authorName: users.name,
        authorEmail: users.email,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(discussionReplies)
      .innerJoin(users, eq(discussionReplies.authorId, users.id))
      .where(eq(discussionReplies.threadId, threadId))
      .orderBy(asc(discussionReplies.createdAt));

    return NextResponse.json({ thread, replies });
  } catch (error) {
    console.error("Get discussion thread error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/discussions/[threadId] — update thread (admin: archive/unarchive/pin/unpin, author: edit own)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const isAdmin =
      session.user.role === "superadmin" || session.user.role === "instructor";

    // Fetch existing thread
    const [existing] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, threadId));

    if (!existing) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const isAuthor = existing.authorId === session.user.id;

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Admin-only fields
    if (typeof body.isArchived === "boolean") {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins can archive/unarchive threads" },
          { status: 403 }
        );
      }
      updateData.isArchived = body.isArchived;
    }

    if (typeof body.isPinned === "boolean") {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins can pin/unpin threads" },
          { status: 403 }
        );
      }
      updateData.isPinned = body.isPinned;
    }

    // Author or admin can edit title/body
    if (body.title !== undefined) {
      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: "You can only edit your own threads" },
          { status: 403 }
        );
      }
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.body !== undefined) {
      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: "You can only edit your own threads" },
          { status: 403 }
        );
      }
      if (typeof body.body !== "string" || body.body.trim().length === 0) {
        return NextResponse.json(
          { error: "Body is required" },
          { status: 400 }
        );
      }
      updateData.body = body.body.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(discussionThreads)
      .set(updateData)
      .where(eq(discussionThreads.id, threadId))
      .returning();

    return NextResponse.json({ thread: updated });
  } catch (error) {
    console.error("Update discussion thread error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/discussions/[threadId] — delete thread (admin only, or author's own)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { threadId } = await params;
    const isAdmin =
      session.user.role === "superadmin" || session.user.role === "instructor";

    // Fetch existing thread
    const [existing] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, threadId));

    if (!existing) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const isAuthor = existing.authorId === session.user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: "Only admins can delete other users' threads" },
        { status: 403 }
      );
    }

    // Cascade delete will handle replies
    await db
      .delete(discussionThreads)
      .where(eq(discussionThreads.id, threadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete discussion thread error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
