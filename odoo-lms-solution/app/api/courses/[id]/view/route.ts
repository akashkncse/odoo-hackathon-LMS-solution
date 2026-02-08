import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const courseId = Number(id);

    const [course] = await db
      .select({ id: courses.id, viewsCount: courses.viewsCount })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await db
      .update(courses)
      .set({ viewsCount: course.viewsCount + 1 })
      .where(eq(courses.id, courseId));

    return NextResponse.json({ viewsCount: course.viewsCount + 1 });
  } catch (error) {
    console.error("Increment view count error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
