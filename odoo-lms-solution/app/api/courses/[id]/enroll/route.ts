import { db } from "@/lib/db";
import { courses, enrollments, courseInvitations } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the course
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, id));

    if (!course || !course.published) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if user is already enrolled
    const [existing] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, id),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (existing) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 409 },
      );
    }

    // Handle access rules
    if (course.accessRule === "payment") {
      return NextResponse.json(
        { error: "Payment required — coming soon" },
        { status: 402 },
      );
    }

    if (course.accessRule === "invitation") {
      const [invitation] = await db
        .select()
        .from(courseInvitations)
        .where(
          and(
            eq(courseInvitations.courseId, id),
            eq(courseInvitations.email, session.user.email),
            eq(courseInvitations.status, "pending"),
          ),
        );

      if (!invitation) {
        return NextResponse.json(
          { error: "You need an invitation to enroll in this course" },
          { status: 403 },
        );
      }

      // Mark the invitation as accepted
      await db
        .update(courseInvitations)
        .set({ status: "accepted" })
        .where(eq(courseInvitations.id, invitation.id));
    }

    // Create the enrollment
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        userId: session.user.id,
        courseId: id,
        status: "not_started",
      })
      .returning();

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error("Enroll error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
