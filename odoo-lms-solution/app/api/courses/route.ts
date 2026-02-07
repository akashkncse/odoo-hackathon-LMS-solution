import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    let result;

    if (session) {
      // Logged-in users see all published courses (both "everyone" and "signed_in")
      result = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          imageUrl: courses.imageUrl,
          visibility: courses.visibility,
          accessRule: courses.accessRule,
          price: courses.price,
          viewsCount: courses.viewsCount,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .where(eq(courses.published, true))
        .orderBy(courses.createdAt);
    } else {
      // Anonymous users only see published courses with visibility "everyone"
      result = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          imageUrl: courses.imageUrl,
          visibility: courses.visibility,
          accessRule: courses.accessRule,
          price: courses.price,
          viewsCount: courses.viewsCount,
          createdAt: courses.createdAt,
        })
        .from(courses)
        .where(
          and(
            eq(courses.published, true),
            eq(courses.visibility, "everyone"),
          ),
        )
        .orderBy(courses.createdAt);
    }

    return NextResponse.json({ courses: result });
  } catch (error) {
    console.error("Get catalog error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
