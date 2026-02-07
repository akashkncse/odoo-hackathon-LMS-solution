import { db } from "@/lib/db";
import { certificates, courses, users, enrollments, lessons } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/certificates/[certificateNumber] — public verification endpoint
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> },
) {
  try {
    const { certificateNumber } = await params;

    if (!certificateNumber || certificateNumber.trim().length === 0) {
      return NextResponse.json(
        { error: "Certificate number is required." },
        { status: 400 },
      );
    }

    // Look up the certificate with all related data
    const [certificate] = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        courseId: certificates.courseId,
        courseTitle: courses.title,
        courseDescription: courses.description,
        userName: users.name,
        completedAt: enrollments.completedAt,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(
        enrollments,
        eq(certificates.enrollmentId, enrollments.id),
      )
      .where(eq(certificates.certificateNumber, certificateNumber.trim()));

    if (!certificate) {
      return NextResponse.json(
        {
          error: "Certificate not found. Please check the certificate number and try again.",
          valid: false,
        },
        { status: 404 },
      );
    }

    // Get lesson count for additional context
    const [lessonCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lessons)
      .where(eq(lessons.courseId, certificate.courseId));

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        courseTitle: certificate.courseTitle,
        courseDescription: certificate.courseDescription,
        userName: certificate.userName,
        completedAt: certificate.completedAt,
        totalLessons: Number(lessonCount?.count ?? 0),
      },
    });
  } catch (error) {
    console.error("Verify certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
