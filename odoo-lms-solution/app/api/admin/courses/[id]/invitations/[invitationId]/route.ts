import { db } from "@/lib/db";
import { courses, courseInvitations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/admin/courses/[id]/invitations/[invitationId] — revoke an invitation
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; invitationId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: courseId, invitationId } = await params;

    // Verify course exists and user has access
    const [course] = await db
      .select({ id: courses.id, responsibleId: courses.responsibleId })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      session.user.role !== "superadmin" &&
      course.responsibleId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the invitation
    const [invitation] = await db
      .select({ id: courseInvitations.id, status: courseInvitations.status })
      .from(courseInvitations)
      .where(
        and(
          eq(courseInvitations.id, invitationId),
          eq(courseInvitations.courseId, courseId),
        ),
      );

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "Cannot revoke an already accepted invitation" },
        { status: 400 },
      );
    }

    // Delete the invitation
    await db
      .delete(courseInvitations)
      .where(eq(courseInvitations.id, invitationId));

    return NextResponse.json({ message: "Invitation revoked successfully" });
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
