import { db } from "@/lib/db";
import { users, badgeLevels } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc, asc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view the leaderboard" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100) : 25;

    // Fetch top users by points
    const topUsers = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        totalPoints: users.totalPoints,
        role: users.role,
      })
      .from(users)
      .orderBy(desc(users.totalPoints), asc(users.name))
      .limit(limit);

    // Fetch all badge levels (sorted by minPoints descending for easy matching)
    const badges = await db
      .select()
      .from(badgeLevels)
      .orderBy(desc(badgeLevels.minPoints));

    // Assign badge to each user based on their points
    const leaderboard = topUsers.map((user, index) => {
      const badge = badges.find((b) => user.totalPoints >= b.minPoints) ?? null;

      return {
        rank: index + 1,
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        totalPoints: user.totalPoints,
        role: user.role,
        badge: badge
          ? { name: badge.name, minPoints: badge.minPoints }
          : null,
      };
    });

    // Find the current user's rank if they're not in the top list
    const currentUserInList = leaderboard.find((u) => u.id === session.user.id);
    let currentUserRank = null;

    if (!currentUserInList) {
      // Count how many users have more points than the current user
      const [rankResult] = await db
        .select({
          rank: sql<number>`COUNT(*) + 1`,
        })
        .from(users)
        .where(sql`${users.totalPoints} > (SELECT ${users.totalPoints} FROM ${users} WHERE ${users.id} = ${session.user.id})`);

      const [currentUser] = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          totalPoints: users.totalPoints,
          role: users.role,
        })
        .from(users)
        .where(sql`${users.id} = ${session.user.id}`);

      if (currentUser) {
        const badge =
          badges.find((b) => currentUser.totalPoints >= b.minPoints) ?? null;

        currentUserRank = {
          rank: Number(rankResult?.rank ?? 0),
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          totalPoints: currentUser.totalPoints,
          role: currentUser.role,
          badge: badge
            ? { name: badge.name, minPoints: badge.minPoints }
            : null,
        };
      }
    }

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserInList ?? currentUserRank,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
