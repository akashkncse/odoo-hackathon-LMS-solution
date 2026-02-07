import { db } from "@/lib/db";
import {
  courses,
  courseInvitations,
  users,
  enrollments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/courses/[id]/invitations — list all invitations for a course
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: courseId } = await params;

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

    // Fetch all invitations for this course with inviter info
    const invitations = await db
      .select({
        id: courseInvitations.id,
        email: courseInvitations.email,
        status: courseInvitations.status,
        createdAt: courseInvitations.createdAt,
        invitedByName: users.name,
        invitedByEmail: users.email,
      })
      .from(courseInvitations)
      .innerJoin(users, eq(courseInvitations.invitedBy, users.id))
      .where(eq(courseInvitations.courseId, courseId))
      .orderBy(desc(courseInvitations.createdAt));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("List invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/courses/[id]/invitations — send invitation(s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role === "learner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: courseId } = await params;

    // Verify course exists and user has access
    const [course] = await db
      .select({
        id: courses.id,
        responsibleId: courses.responsibleId,
        title: courses.title,
        accessRule: courses.accessRule,
      })
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

    const body = await request.json();
    const { emails } = body as { emails: string[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 },
      );
    }

    // Validate and normalize emails
    const normalizedEmails = emails
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => e.length > 0 && e.includes("@"));

    if (normalizedEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses provided" },
        { status: 400 },
      );
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(normalizedEmails)];

    const results: {
      email: string;
      status:
        | "invited"
        | "already_invited"
        | "already_enrolled"
        | "not_registered";
    }[] = [];

    for (const email of uniqueEmails) {
      // Check if user exists
      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        results.push({ email, status: "not_registered" });
        continue;
      }

      // Check if already enrolled
      const [existingEnrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.courseId, courseId),
            eq(enrollments.userId, user.id),
          ),
        );

      if (existingEnrollment) {
        results.push({ email, status: "already_enrolled" });
        continue;
      }

      // Check if already invited (pending)
      const [existingInvitation] = await db
        .select({ id: courseInvitations.id })
        .from(courseInvitations)
        .where(
          and(
            eq(courseInvitations.courseId, courseId),
            eq(courseInvitations.email, email),
            eq(courseInvitations.status, "pending"),
          ),
        );

      if (existingInvitation) {
        results.push({ email, status: "already_invited" });
        continue;
      }

      // Create the invitation
      await db.insert(courseInvitations).values({
        courseId,
        email,
        invitedBy: session.user.id,
        status: "pending",
      });

      results.push({ email, status: "invited" });
    }

    const invitedCount = results.filter((r) => r.status === "invited").length;

    return NextResponse.json(
      {
        message: `${invitedCount} invitation(s) sent successfully`,
        results,
        invitedCount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Send invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
