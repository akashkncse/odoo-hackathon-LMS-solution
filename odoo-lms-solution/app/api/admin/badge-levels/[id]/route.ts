import { db } from "@/lib/db";
import { badgeLevels } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/badge-levels/[id] — update a badge level
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if badge exists
    const [existing] = await db
      .select({ id: badgeLevels.id })
      .from(badgeLevels)
      .where(eq(badgeLevels.id, id));

    if (!existing) {
      return NextResponse.json(
        { error: "Badge level not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, minPoints, sortOrder } = body as {
      name?: string;
      minPoints?: number;
      sortOrder?: number;
    };

    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Badge name cannot be empty" },
          { status: 400 },
        );
      }
      updates.name = name.trim();
    }

    if (minPoints !== undefined) {
      if (typeof minPoints !== "number" || minPoints < 0) {
        return NextResponse.json(
          { error: "Minimum points must be a non-negative number" },
          { status: 400 },
        );
      }
      updates.minPoints = minPoints;
    }

    if (sortOrder !== undefined) {
      if (typeof sortOrder !== "number") {
        return NextResponse.json(
          { error: "Sort order must be a number" },
          { status: 400 },
        );
      }
      updates.sortOrder = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const [badge] = await db
      .update(badgeLevels)
      .set(updates)
      .where(eq(badgeLevels.id, id))
      .returning();

    return NextResponse.json({ badge });
  } catch (error) {
    console.error("Update badge level error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/badge-levels/[id] — delete a badge level
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if badge exists
    const [existing] = await db
      .select({ id: badgeLevels.id })
      .from(badgeLevels)
      .where(eq(badgeLevels.id, id));

    if (!existing) {
      return NextResponse.json(
        { error: "Badge level not found" },
        { status: 404 },
      );
    }

    await db.delete(badgeLevels).where(eq(badgeLevels.id, id));

    return NextResponse.json({ message: "Badge level deleted successfully" });
  } catch (error) {
    console.error("Delete badge level error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
