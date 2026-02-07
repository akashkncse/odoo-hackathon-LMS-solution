import { db } from "@/lib/db";
import { users, enrollments, courses } from "@/lib/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq, sql, ilike, or, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden: superadmin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role") || "";
    const activeFilter = searchParams.get("active"); // "true", "false", or null (all)
    const offset = (page - 1) * limit;

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)),
      );
    }

    if (
      roleFilter &&
      ["superadmin", "instructor", "learner"].includes(roleFilter)
    ) {
      conditions.push(
        eq(users.role, roleFilter as "superadmin" | "instructor" | "learner"),
      );
    }

    if (activeFilter === "true") {
      conditions.push(eq(users.isActive, true));
    } else if (activeFilter === "false") {
      conditions.push(eq(users.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);

    // Get users with enrollment counts and course counts (for instructors)
    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        totalPoints: users.totalPoints,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Enrich each user with stats
    const enrichedUsers = await Promise.all(
      userRows.map(async (user) => {
        let enrollmentCount = 0;
        let courseCount = 0;

        if (user.role === "learner") {
          const [enrollResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(enrollments)
            .where(eq(enrollments.userId, user.id));
          enrollmentCount = Number(enrollResult?.count ?? 0);
        }

        if (user.role === "instructor" || user.role === "superadmin") {
          const [courseResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(courses)
            .where(eq(courses.responsibleId, user.id));
          courseCount = Number(courseResult?.count ?? 0);
        }

        return {
          ...user,
          enrollmentCount,
          courseCount,
        };
      }),
    );

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden: superadmin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Only allow creating instructor or learner accounts (not superadmin)
    const allowedRoles = ["instructor", "learner"] as const;
    const assignedRole = allowedRoles.includes(role) ? role : "instructor";

    // Check if email is already taken
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole,
        isActive: true,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
