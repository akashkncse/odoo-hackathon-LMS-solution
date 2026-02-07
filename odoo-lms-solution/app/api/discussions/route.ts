import { db } from "@/lib/db";
import { discussionThreads, discussionReplies, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, sql, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/discussions — list all discussion threads (with reply counts & author info)
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const conditions = includeArchived
      ? undefined
      : eq(discussionThreads.isArchived, false);

    const replyCountSq = db
      .select({
        threadId: discussionReplies.threadId,
        count: sql<number>`count(*)`.as("reply_count"),
      })
      .from(discussionReplies)
      .groupBy(discussionReplies.threadId)
      .as("reply_counts");

    const lastReplySq = db
      .select({
        threadId: discussionReplies.threadId,
        lastReplyAt: sql<string>`max(${discussionReplies.createdAt})`.as("last_reply_at"),
      })
      .from(discussionReplies)
      .groupBy(discussionReplies.threadId)
      .as("last_reply");

    const threads = await db
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
        replyCount: sql<number>`coalesce(${replyCountSq.count}, 0)`.as("reply_count"),
        lastReplyAt: lastReplySq.lastReplyAt,
      })
      .from(discussionThreads)
      .innerJoin(users, eq(discussionThreads.authorId, users.id))
      .leftJoin(replyCountSq, eq(discussionThreads.id, replyCountSq.threadId))
      .leftJoin(lastReplySq, eq(discussionThreads.id, lastReplySq.threadId))
      .where(conditions)
      .orderBy(desc(discussionThreads.isPinned), desc(discussionThreads.createdAt));

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("List discussions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/discussions — create a new discussion thread
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: threadBody } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (
      !threadBody ||
      typeof threadBody !== "string" ||
      threadBody.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Body is required" },
        { status: 400 }
      );
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { error: "Title must be 255 characters or less" },
        { status: 400 }
      );
    }

    const [thread] = await db
      .insert(discussionThreads)
      .values({
        title: title.trim(),
        body: threadBody.trim(),
        authorId: session.user.id,
      })
      .returning();

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error("Create discussion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
