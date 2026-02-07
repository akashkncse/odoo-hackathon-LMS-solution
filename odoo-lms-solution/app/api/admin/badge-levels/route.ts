import { db } from "@/lib/db";
import { badgeLevels } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/badge-levels — list all badge levels
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const badges = await db
      .select()
      .from(badgeLevels)
      .orderBy(asc(badgeLevels.sortOrder));

    return NextResponse.json({ badges });
  } catch (error) {
    console.error("List badge levels error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/badge-levels — create a new badge level
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, minPoints, sortOrder } = body as {
      name: string;
      minPoints: number;
      sortOrder: number;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Badge name is required" },
        { status: 400 },
      );
    }

    if (typeof minPoints !== "number" || minPoints < 0) {
      return NextResponse.json(
        { error: "Minimum points must be a non-negative number" },
        { status: 400 },
      );
    }

    if (typeof sortOrder !== "number") {
      return NextResponse.json(
        { error: "Sort order is required" },
        { status: 400 },
      );
    }

    const [badge] = await db
      .insert(badgeLevels)
      .values({
        name: name.trim(),
        minPoints,
        sortOrder,
      })
      .returning();

    return NextResponse.json({ badge }, { status: 201 });
  } catch (error) {
    console.error("Create badge level error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
