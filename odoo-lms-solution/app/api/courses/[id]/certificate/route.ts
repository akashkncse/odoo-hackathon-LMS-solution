import { db } from "@/lib/db";
import {
  certificates,
  enrollments,
  courses,
  users,
  lessons,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function generateCertificateNumber(): string {
  const prefix = "CERT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// GET /api/courses/[id]/certificate — fetch existing certificate for the authenticated user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = Number(id);

    // Find certificate for this user + course
    const [certificate] = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        courseTitle: courses.title,
        courseDescription: courses.description,
        userName: users.name,
        userEmail: users.email,
        completedAt: enrollments.completedAt,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(enrollments, eq(certificates.enrollmentId, enrollments.id))
      .where(
        and(
          eq(certificates.courseId, courseId),
          eq(certificates.userId, session.user.id),
        ),
      );

    if (!certificate) {
      return NextResponse.json(
        { error: "No certificate found. Complete the course first." },
        { status: 404 },
      );
    }

    // Get lesson count for this course
    const [lessonCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    return NextResponse.json({
      certificate: {
        ...certificate,
        totalLessons: Number(lessonCount?.count ?? 0),
      },
    });
  } catch (error) {
    console.error("Get certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/courses/[id]/certificate — generate a certificate (idempotent)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = Number(id);

    // Verify course exists
    const [course] = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify user has completed the course
    const [enrollment] = await db
      .select({
        id: enrollments.id,
        status: enrollments.status,
        completedAt: enrollments.completedAt,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this course." },
        { status: 403 },
      );
    }

    if (enrollment.status !== "completed") {
      return NextResponse.json(
        {
          error:
            "You must complete all lessons before receiving a certificate.",
        },
        { status: 403 },
      );
    }

    // Check if certificate already exists (idempotent)
    const [existingCert] = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
      })
      .from(certificates)
      .where(
        and(
          eq(certificates.courseId, courseId),
          eq(certificates.userId, session.user.id),
        ),
      );

    if (existingCert) {
      // Certificate already issued — return it
      const [fullCert] = await db
        .select({
          id: certificates.id,
          certificateNumber: certificates.certificateNumber,
          issuedAt: certificates.issuedAt,
          courseTitle: courses.title,
          courseDescription: courses.description,
          userName: users.name,
          userEmail: users.email,
          completedAt: enrollments.completedAt,
        })
        .from(certificates)
        .innerJoin(courses, eq(certificates.courseId, courses.id))
        .innerJoin(users, eq(certificates.userId, users.id))
        .innerJoin(enrollments, eq(certificates.enrollmentId, enrollments.id))
        .where(eq(certificates.id, existingCert.id));

      const [lessonCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lessons)
        .where(eq(lessons.courseId, courseId));

      return NextResponse.json({
        certificate: {
          ...fullCert,
          totalLessons: Number(lessonCount?.count ?? 0),
        },
        created: false,
      });
    }

    // Generate a unique certificate number
    let certNumber = generateCertificateNumber();

    // Ensure uniqueness (very unlikely collision, but safety first)
    let attempts = 0;
    while (attempts < 5) {
      const [dup] = await db
        .select({ id: certificates.id })
        .from(certificates)
        .where(eq(certificates.certificateNumber, certNumber));

      if (!dup) break;
      certNumber = generateCertificateNumber();
      attempts++;
    }

    // Create the certificate
    const [newCert] = await db
      .insert(certificates)
      .values({
        userId: session.user.id,
        courseId,
        enrollmentId: enrollment.id,
        certificateNumber: certNumber,
      })
      .returning({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
      });

    // Fetch full certificate data
    const [fullCert] = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        courseTitle: courses.title,
        courseDescription: courses.description,
        userName: users.name,
        userEmail: users.email,
        completedAt: enrollments.completedAt,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(enrollments, eq(certificates.enrollmentId, enrollments.id))
      .where(eq(certificates.id, newCert.id));

    const [lessonCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));

    return NextResponse.json({
      certificate: {
        ...fullCert,
        totalLessons: Number(lessonCount?.count ?? 0),
      },
      created: true,
    });
  } catch (error) {
    console.error("Generate certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
