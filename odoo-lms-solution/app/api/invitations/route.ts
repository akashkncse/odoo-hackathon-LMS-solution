import { db } from "@/lib/db";
import { courseInvitations, courses, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/invitations — list all pending invitations for the current user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch all pending invitations for this user's email, with course and inviter info
    const invitations = await db
      .select({
        id: courseInvitations.id,
        status: courseInvitations.status,
        createdAt: courseInvitations.createdAt,
        courseId: courses.id,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseImageUrl: courses.imageUrl,
        courseAccessRule: courses.accessRule,
        invitedByName: users.name,
        invitedByEmail: users.email,
      })
      .from(courseInvitations)
      .innerJoin(courses, eq(courseInvitations.courseId, courses.id))
      .innerJoin(users, eq(courseInvitations.invitedBy, users.id))
      .where(
        and(
          eq(courseInvitations.email, session.user.email),
          eq(courseInvitations.status, "pending"),
        ),
      )
      .orderBy(desc(courseInvitations.createdAt));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("List user invitations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
