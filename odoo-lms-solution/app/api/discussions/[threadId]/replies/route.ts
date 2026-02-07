import { db } from "@/lib/db";
import { discussionThreads, discussionReplies } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST /api/discussions/[threadId]/replies — add a reply to a thread
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { threadId } = await params;

    // Verify thread exists and is not archived
    const [thread] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, threadId));

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.isArchived) {
      return NextResponse.json(
        { error: "Cannot reply to an archived thread" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { body: replyBody } = body;

    if (
      !replyBody ||
      typeof replyBody !== "string" ||
      replyBody.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Reply body is required" },
        { status: 400 }
      );
    }

    const [reply] = await db
      .insert(discussionReplies)
      .values({
        threadId,
        authorId: session.user.id,
        body: replyBody.trim(),
      })
      .returning();

    // Update the thread's updatedAt to reflect new activity
    await db
      .update(discussionThreads)
      .set({ updatedAt: new Date() })
      .where(eq(discussionThreads.id, threadId));

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Create reply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
