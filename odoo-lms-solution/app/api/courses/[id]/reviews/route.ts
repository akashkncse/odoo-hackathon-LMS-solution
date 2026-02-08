import { db } from "@/lib/db";
import { reviews, users, enrollments, courses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/courses/[id]/reviews — list reviews + aggregate stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const courseId = Number(id);
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const offset = (page - 1) * limit;

    // Verify course exists and is published
    const [course] = await db
      .select({ id: courses.id, published: courses.published })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course || !course.published) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Aggregate stats: average rating, total count, distribution (1-5)
    const [stats] = await db
      .select({
        averageRating: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1), 0)::float`,
        totalReviews: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.courseId, courseId));

    // Rating distribution
    const distributionRows = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.courseId, courseId))
      .groupBy(reviews.rating);

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const row of distributionRows) {
      distribution[row.rating] = row.count;
    }

    // Total count for pagination
    const totalReviews = Number(stats?.totalReviews ?? 0);

    // Fetch paginated reviews with user info, newest first
    const reviewRows = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        rating: reviews.rating,
        reviewText: reviews.reviewText,
        createdAt: reviews.createdAt,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, courseId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Get the current user's review separately (if logged in)
    let userReview = null;
    if (session) {
      const [existing] = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          reviewText: reviews.reviewText,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.courseId, courseId),
            eq(reviews.userId, session.user.id),
          ),
        );

      userReview = existing || null;
    }

    return NextResponse.json({
      reviews: reviewRows,
      stats: {
        averageRating: Number(stats?.averageRating ?? 0),
        totalReviews,
        distribution,
      },
      userReview,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/courses/[id]/reviews — create or update a review
export async function POST(
  request: NextRequest,
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
      .select({ id: courses.id, published: courses.published })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify user is enrolled in the course
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.userId, session.user.id),
        ),
      );

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to leave a review." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { rating, reviewText } = body;

    // Validate rating
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5." },
        { status: 400 },
      );
    }

    // Validate reviewText
    const trimmedText =
      typeof reviewText === "string" ? reviewText.trim() : null;
    if (trimmedText && trimmedText.length > 2000) {
      return NextResponse.json(
        { error: "Review text must be 2000 characters or less." },
        { status: 400 },
      );
    }

    // Check if user already has a review for this course
    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.courseId, courseId),
          eq(reviews.userId, session.user.id),
        ),
      );

    let review;

    if (existingReview) {
      // Update existing review
      const [updated] = await db
        .update(reviews)
        .set({
          rating,
          reviewText: trimmedText || null,
        })
        .where(eq(reviews.id, existingReview.id))
        .returning({
          id: reviews.id,
          rating: reviews.rating,
          reviewText: reviews.reviewText,
          createdAt: reviews.createdAt,
        });

      review = updated;
    } else {
      // Create new review
      const [created] = await db
        .insert(reviews)
        .values({
          userId: session.user.id,
          courseId,
          rating,
          reviewText: trimmedText || null,
        })
        .returning({
          id: reviews.id,
          rating: reviews.rating,
          reviewText: reviews.reviewText,
          createdAt: reviews.createdAt,
        });

      review = created;
    }

    return NextResponse.json({
      review,
      updated: !!existingReview,
    });
  } catch (error) {
    console.error("Create/update review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/courses/[id]/reviews — delete own review
export async function DELETE(
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

    // Find the user's review for this course
    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.courseId, courseId),
          eq(reviews.userId, session.user.id),
        ),
      );

    if (!existingReview) {
      return NextResponse.json(
        { error: "You don't have a review for this course." },
        { status: 404 },
      );
    }

    await db.delete(reviews).where(eq(reviews.id, existingReview.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
