import { db } from "@/lib/db";
import { courseInvitations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/invitations/[id] — decline/dismiss an invitation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: invitationId } = await params;

    // Find the invitation — must belong to this user's email and be pending
    const [invitation] = await db
      .select({
        id: courseInvitations.id,
        email: courseInvitations.email,
        status: courseInvitations.status,
      })
      .from(courseInvitations)
      .where(
        and(
          eq(courseInvitations.id, invitationId),
          eq(courseInvitations.email, session.user.email),
          eq(courseInvitations.status, "pending"),
        ),
      );

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or already processed" },
        { status: 404 },
      );
    }

    // Delete the invitation
    await db
      .delete(courseInvitations)
      .where(eq(courseInvitations.id, invitationId));

    return NextResponse.json({ message: "Invitation declined successfully" });
  } catch (error) {
    console.error("Decline invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
