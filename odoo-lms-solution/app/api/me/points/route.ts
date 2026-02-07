import { db } from "@/lib/db";
import { users, badgeLevels, quizAttempts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Fetch the user's current points
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        totalPoints: users.totalPoints,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the user's current badge level (highest badge they qualify for)
    const [currentBadge] = await db
      .select()
      .from(badgeLevels)
      .where(lte(badgeLevels.minPoints, user.totalPoints))
      .orderBy(desc(badgeLevels.minPoints))
      .limit(1);

    // Fetch the next badge level (the one they're working toward)
    const allBadges = await db
      .select()
      .from(badgeLevels)
      .orderBy(badgeLevels.sortOrder);

    let nextBadge = null;
    if (currentBadge) {
      const currentIndex = allBadges.findIndex((b) => b.id === currentBadge.id);
      if (currentIndex < allBadges.length - 1) {
        nextBadge = allBadges[currentIndex + 1];
      }
    } else if (allBadges.length > 0) {
      nextBadge = allBadges[0];
    }

    // Compute points breakdown: total points earned from quiz attempts
    const [quizPointsResult] = await db
      .select({
        totalQuizPoints: sql<number>`COALESCE(SUM(${quizAttempts.pointsEarned}), 0)`,
        totalAttempts: sql<number>`COUNT(${quizAttempts.id})`,
        perfectScores: sql<number>`COUNT(CASE WHEN ${quizAttempts.score} = 100 THEN 1 END)`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, session.user.id));

    // Progress toward next badge
    let progressToNextBadge = null;
    if (nextBadge) {
      const pointsNeeded = nextBadge.minPoints - user.totalPoints;
      const progressPercent = currentBadge
        ? Math.round(
            ((user.totalPoints - currentBadge.minPoints) /
              (nextBadge.minPoints - currentBadge.minPoints)) *
              100,
          )
        : Math.round((user.totalPoints / nextBadge.minPoints) * 100);

      progressToNextBadge = {
        badge: {
          id: nextBadge.id,
          name: nextBadge.name,
          minPoints: nextBadge.minPoints,
        },
        pointsNeeded: Math.max(0, pointsNeeded),
        progressPercent: Math.min(100, Math.max(0, progressPercent)),
      };
    }

    return NextResponse.json({
      points: {
        total: user.totalPoints,
        fromQuizzes: Number(quizPointsResult?.totalQuizPoints ?? 0),
      },
      stats: {
        totalQuizAttempts: Number(quizPointsResult?.totalAttempts ?? 0),
        perfectScores: Number(quizPointsResult?.perfectScores ?? 0),
      },
      currentBadge: currentBadge
        ? {
            id: currentBadge.id,
            name: currentBadge.name,
            minPoints: currentBadge.minPoints,
          }
        : null,
      progressToNextBadge,
      allBadges: allBadges.map((b) => ({
        id: b.id,
        name: b.name,
        minPoints: b.minPoints,
        achieved: user.totalPoints >= b.minPoints,
      })),
    });
  } catch (error) {
    console.error("Get user points error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
