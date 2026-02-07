import { db } from "@/lib/db";
import { courses, tags, courseTags } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const tagFilter = searchParams.get("tag") || ""; // tag ID
    const tagNames = searchParams.get("tags")?.trim() || ""; // comma-separated tag names
    const sort = searchParams.get("sort") || "newest"; // newest, oldest, popular, title
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
    );
    const offset = (page - 1) * limit;

    // Build base conditions
    const conditions = [eq(courses.published, true)];

    // Visibility filter for anonymous users
    if (!session) {
      conditions.push(eq(courses.visibility, "everyone"));
    }

    // Search filter — match title, description, or tag name
    if (search) {
      conditions.push(
        sql`(
          ${ilike(courses.title, `%${search}%`)}
          OR ${ilike(courses.description, `%${search}%`)}
          OR ${courses.id} IN (
            SELECT ${courseTags.courseId} FROM ${courseTags}
            INNER JOIN ${tags} ON ${tags.id} = ${courseTags.tagId}
            WHERE ${ilike(tags.name, `%${search}%`)}
          )
        )`,
      );
    }

    // Tag filter by ID — if a single tag ID is provided, only return courses with that tag
    if (tagFilter) {
      conditions.push(
        sql`${courses.id} IN (
          SELECT ${courseTags.courseId} FROM ${courseTags}
          WHERE ${courseTags.tagId} = ${tagFilter}
        )`,
      );
    }

    // Tag filter by names (comma-separated) — courses must have at least one of these tags
    if (tagNames) {
      const tagNameList = tagNames
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (tagNameList.length > 0) {
        conditions.push(
          sql`${courses.id} IN (
            SELECT ${courseTags.courseId} FROM ${courseTags}
            INNER JOIN ${tags} ON ${tags.id} = ${courseTags.tagId}
            WHERE ${tags.name} IN (${sql.join(
              tagNameList.map((n) => sql`${n}`),
              sql`, `,
            )})
          )`,
        );
      }
    }

    const whereClause = and(...conditions);

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "oldest":
        orderBy = asc(courses.createdAt);
        break;
      case "popular":
        orderBy = desc(courses.viewsCount);
        break;
      case "title":
        orderBy = asc(courses.title);
        break;
      case "newest":
      default:
        orderBy = desc(courses.createdAt);
        break;
    }

    // Get total count for pagination
    const [countResult] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(courses)
      .where(whereClause);

    const total = Number(countResult?.total ?? 0);

    // Get courses
    const courseRows = await db
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
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Fetch tags for all returned courses in a single query
    const courseIds = courseRows.map((c) => c.id);
    const courseTagsMap: Record<string, { id: string; name: string }[]> = {};

    if (courseIds.length > 0) {
      const tagRows = await db
        .select({
          courseId: courseTags.courseId,
          tagId: tags.id,
          tagName: tags.name,
        })
        .from(courseTags)
        .innerJoin(tags, eq(courseTags.tagId, tags.id))
        .where(inArray(courseTags.courseId, courseIds));

      for (const row of tagRows) {
        if (!courseTagsMap[row.courseId]) {
          courseTagsMap[row.courseId] = [];
        }
        courseTagsMap[row.courseId].push({
          id: row.tagId,
          name: row.tagName,
        });
      }
    }

    // Attach tags to each course
    const coursesWithTags = courseRows.map((course) => ({
      ...course,
      tags: courseTagsMap[course.id] || [],
    }));

    // Fetch all available tags for the filter UI
    const allTags = await db
      .select({
        id: tags.id,
        name: tags.name,
      })
      .from(tags)
      .orderBy(tags.name);

    return NextResponse.json({
      courses: coursesWithTags,
      tags: allTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get catalog error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
