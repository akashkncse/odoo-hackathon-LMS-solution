import { db } from "@/lib/db";
import { courseInvitations, courses, enrollments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// POST /api/invitations/[id]/accept — accept an invitation and enroll in the course
export async function POST(
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
        courseId: courseInvitations.courseId,
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
        { error: "Invitation not found or already accepted" },
        { status: 404 },
      );
    }

    // Verify the course exists and is published
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        published: courses.published,
      })
      .from(courses)
      .where(eq(courses.id, invitation.courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.published) {
      return NextResponse.json(
        { error: "This course is not currently available" },
        { status: 400 },
      );
    }

    // Check if the user is already enrolled
    const [existingEnrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, invitation.courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (existingEnrollment) {
      // Mark invitation as accepted even if already enrolled
      await db
        .update(courseInvitations)
        .set({ status: "accepted" })
        .where(eq(courseInvitations.id, invitation.id));

      return NextResponse.json(
        { message: "You are already enrolled in this course", alreadyEnrolled: true },
        { status: 200 },
      );
    }

    // Mark invitation as accepted
    await db
      .update(courseInvitations)
      .set({ status: "accepted" })
      .where(eq(courseInvitations.id, invitation.id));

    // Create the enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        userId: session.user.id,
        courseId: invitation.courseId,
        status: "not_started",
      })
      .returning();

    return NextResponse.json(
      {
        message: "Invitation accepted and enrolled successfully",
        enrollment,
        courseId: invitation.courseId,
        courseTitle: course.title,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
