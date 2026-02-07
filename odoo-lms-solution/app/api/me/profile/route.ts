import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        totalPoints: users.totalPoints,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatarUrl } = body;

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 },
        );
      }
      if (name.trim().length > 255) {
        return NextResponse.json(
          { error: "Name must be 255 characters or less" },
          { status: 400 },
        );
      }
      updateFields.name = name.trim();
    }

    // Validate avatar URL
    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === "") {
        updateFields.avatarUrl = null;
      } else {
        if (typeof avatarUrl !== "string") {
          return NextResponse.json(
            { error: "Avatar URL must be a string" },
            { status: 400 },
          );
        }
        if (avatarUrl.length > 500) {
          return NextResponse.json(
            { error: "Avatar URL must be 500 characters or less" },
            { status: 400 },
          );
        }
        // Basic URL validation
        try {
          new URL(avatarUrl);
        } catch {
          return NextResponse.json(
            { error: "Avatar URL must be a valid URL" },
            { status: 400 },
          );
        }
        updateFields.avatarUrl = avatarUrl;
      }
    }

    // Must have at least one field to update (besides updatedAt)
    if (Object.keys(updateFields).length <= 1) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        totalPoints: users.totalPoints,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
