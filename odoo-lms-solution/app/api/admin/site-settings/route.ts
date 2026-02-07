import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db.select().from(siteSettings).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        settings: {
          id: null,
          heroImageUrl: null,
          featuredImageUrl: null,
        },
      });
    }

    return NextResponse.json({ settings: rows[0] });
  } catch (error) {
    console.error("Get site settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { heroImageUrl, featuredImageUrl } = body;

    const updates: Record<string, unknown> = {};

    if (heroImageUrl !== undefined) {
      if (heroImageUrl !== null && typeof heroImageUrl !== "string") {
        return NextResponse.json(
          { error: "heroImageUrl must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof heroImageUrl === "string" && heroImageUrl.length > 500) {
        return NextResponse.json(
          { error: "heroImageUrl must be 500 characters or less" },
          { status: 400 },
        );
      }
      updates.heroImageUrl = heroImageUrl || null;
    }

    if (featuredImageUrl !== undefined) {
      if (featuredImageUrl !== null && typeof featuredImageUrl !== "string") {
        return NextResponse.json(
          { error: "featuredImageUrl must be a string or null" },
          { status: 400 },
        );
      }
      if (typeof featuredImageUrl === "string" && featuredImageUrl.length > 500) {
        return NextResponse.json(
          { error: "featuredImageUrl must be 500 characters or less" },
          { status: 400 },
        );
      }
      updates.featuredImageUrl = featuredImageUrl || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.updatedAt = new Date();

    // Check if a settings row already exists
    const existing = await db.select().from(siteSettings).limit(1);

    let settings;

    if (existing.length === 0) {
      // Create the first settings row
      const [created] = await db
        .insert(siteSettings)
        .values({
          heroImageUrl: (updates.heroImageUrl as string | null) ?? null,
          featuredImageUrl: (updates.featuredImageUrl as string | null) ?? null,
          updatedAt: updates.updatedAt as Date,
        })
        .returning();
      settings = created;
    } else {
      // Update the existing row
      const [updated] = await db
        .update(siteSettings)
        .set(updates)
        .where(eq(siteSettings.id, existing[0].id))
        .returning();
      settings = updated;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update site settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
