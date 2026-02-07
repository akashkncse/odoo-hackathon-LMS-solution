"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Award,
  Target,
  Star,
  Loader2,
  Crown,
  Medal,
  Sparkles,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  User,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PointsData {
  points: {
    total: number;
    fromQuizzes: number;
  };
  stats: {
    totalQuizAttempts: number;
    perfectScores: number;
  };
  currentBadge: {
    id: string;
    name: string;
    minPoints: number;
  } | null;
  progressToNextBadge: {
    badge: {
      id: string;
      name: string;
      minPoints: number;
    };
    pointsNeeded: number;
    progressPercent: number;
  } | null;
  allBadges: {
    id: string;
    name: string;
    minPoints: number;
    achieved: boolean;
  }[];
}

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  role: string;
  badge: {
    name: string;
    minPoints: number;
  } | null;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  currentUser: LeaderboardUser | null;
}

// ─── Badge Icon Helper ───────────────────────────────────────────────────────

function getBadgeIcon(badgeName: string, className?: string) {
  const name = badgeName.toLowerCase();
  if (
    name.includes("gold") ||
    name.includes("legend") ||
    name.includes("master")
  ) {
    return <Crown className={className || "size-4"} />;
  }
  if (
    name.includes("silver") ||
    name.includes("expert") ||
    name.includes("diamond")
  ) {
    return <Medal className={className || "size-4"} />;
  }
  if (name.includes("bronze") || name.includes("advanced")) {
    return <Award className={className || "size-4"} />;
  }
  return <Star className={className || "size-4"} />;
}

function getBadgeColor(badgeName: string) {
  const name = badgeName.toLowerCase();
  if (
    name.includes("gold") ||
    name.includes("legend") ||
    name.includes("master")
  ) {
    return "text-amber-500";
  }
  if (
    name.includes("silver") ||
    name.includes("expert") ||
    name.includes("diamond")
  ) {
    return "text-slate-400";
  }
  if (name.includes("bronze") || name.includes("advanced")) {
    return "text-orange-600";
  }
  return "text-primary";
}

function getBadgeBgColor(badgeName: string) {
  const name = badgeName.toLowerCase();
  if (
    name.includes("gold") ||
    name.includes("legend") ||
    name.includes("master")
  ) {
    return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
  }
  if (
    name.includes("silver") ||
    name.includes("expert") ||
    name.includes("diamond")
  ) {
    return "bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800";
  }
  if (name.includes("bronze") || name.includes("advanced")) {
    return "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800";
  }
  return "bg-primary/5 border-primary/20";
}

// ─── Rank Badge Component ────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
        <Crown className="size-4 text-amber-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-950/50">
        <Medal className="size-4 text-slate-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50">
        <Medal className="size-4 text-orange-500" />
      </div>
    );
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
      <span className="text-xs font-bold text-muted-foreground">{rank}</span>
    </div>
  );
}

// ─── Progress Ring Component ─────────────────────────────────────────────────

function ProgressRing({
  percent,
  size = 80,
}: {
  percent: number;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold">{percent}%</span>
      </div>
    </div>
  );
}

// ─── Main Points Page ────────────────────────────────────────────────────────

export default function PointsPage() {
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [pointsRes, leaderboardRes] = await Promise.all([
          fetch("/api/me/points"),
          fetch("/api/leaderboard?limit=15"),
        ]);

        const pointsJson = await pointsRes.json();
        const leaderboardJson = await leaderboardRes.json();

        if (!pointsRes.ok) {
          setError(pointsJson.error || "Failed to load points data.");
          return;
        }

        setPointsData(pointsJson);

        if (leaderboardRes.ok) {
          setLeaderboardData(leaderboardJson);
        }
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error || !pointsData) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Points</h1>
          <p className="text-muted-foreground mt-1">
            Track your points and achievements.
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              {error || "Failed to load data."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { points, stats, currentBadge, progressToNextBadge, allBadges } =
    pointsData;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">My Points</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress, earn badges, and climb the leaderboard.
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Points */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <Trophy className="size-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{points.total}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Badge */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  currentBadge ? getBadgeBgColor(currentBadge.name) : "bg-muted"
                }`}
              >
                {currentBadge ? (
                  getBadgeIcon(
                    currentBadge.name,
                    `size-5 ${getBadgeColor(currentBadge.name)}`,
                  )
                ) : (
                  <Star className="size-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold">
                  {currentBadge ? currentBadge.name : "No Badge"}
                </p>
                <p className="text-xs text-muted-foreground">Current Badge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Attempts */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <HelpCircle className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalQuizAttempts}</p>
                <p className="text-xs text-muted-foreground">Quiz Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perfect Scores */}
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
                <Target className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.perfectScores}</p>
                <p className="text-xs text-muted-foreground">Perfect Scores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Progress + Badges */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress to Next Badge */}
          {progressToNextBadge && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Next Badge</CardTitle>
                <CardDescription>
                  Keep earning points to unlock the next badge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <ProgressRing percent={progressToNextBadge.progressPercent} />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getBadgeIcon(
                      progressToNextBadge.badge.name,
                      `size-5 ${getBadgeColor(progressToNextBadge.badge.name)}`,
                    )}
                    <span className="font-semibold">
                      {progressToNextBadge.badge.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {progressToNextBadge.pointsNeeded > 0 ? (
                      <>
                        <span className="font-medium text-foreground">
                          {progressToNextBadge.pointsNeeded}
                        </span>{" "}
                        more points needed
                      </>
                    ) : (
                      "Almost there!"
                    )}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{points.total} pts</span>
                    <span>{progressToNextBadge.badge.minPoints} pts</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.min(progressToNextBadge.progressPercent, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Badges */}
          {allBadges.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Badges</CardTitle>
                <CardDescription>
                  {allBadges.filter((b) => b.achieved).length} of{" "}
                  {allBadges.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                        badge.achieved
                          ? getBadgeBgColor(badge.name)
                          : "border-dashed border-muted-foreground/20 opacity-50"
                      }`}
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                          badge.achieved
                            ? "bg-white/60 dark:bg-white/10"
                            : "bg-muted"
                        }`}
                      >
                        {badge.achieved ? (
                          getBadgeIcon(
                            badge.name,
                            `size-4 ${getBadgeColor(badge.name)}`,
                          )
                        ) : (
                          <Star className="size-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            badge.achieved ? "" : "text-muted-foreground"
                          }`}
                        >
                          {badge.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {badge.minPoints} points required
                        </p>
                      </div>
                      {badge.achieved && (
                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Points Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Points Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <HelpCircle className="size-3.5" />
                    From Quizzes
                  </span>
                  <span className="text-sm font-semibold">
                    {points.fromQuizzes} pts
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm font-bold">{points.total} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <div>
                  <CardTitle>Leaderboard</CardTitle>
                  <CardDescription className="mt-0.5">
                    See how you rank among other learners
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!leaderboardData || leaderboardData.leaderboard.length === 0 ? (
                <div className="text-center py-10">
                  <Trophy className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No leaderboard data yet. Be the first to earn points!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top 3 podium */}
                  {leaderboardData.leaderboard.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 mb-6 pt-4">
                      {/* 2nd place */}
                      <div className="flex flex-col items-center w-24">
                        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 mb-2">
                          <User className="size-5 text-slate-400" />
                        </div>
                        <Medal className="size-5 text-slate-400 mb-1" />
                        <p className="text-xs font-semibold text-center truncate w-full">
                          {leaderboardData.leaderboard[1].name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leaderboardData.leaderboard[1].totalPoints} pts
                        </p>
                        <div className="h-16 w-full bg-slate-100 dark:bg-slate-900 rounded-t-lg mt-2 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-400">
                            2
                          </span>
                        </div>
                      </div>

                      {/* 1st place */}
                      <div className="flex flex-col items-center w-24">
                        <div className="relative">
                          <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 border-2 border-amber-400 mb-2">
                            <User className="size-6 text-amber-500" />
                          </div>
                          <Sparkles className="absolute -top-1 -right-1 size-4 text-amber-400" />
                        </div>
                        <Crown className="size-5 text-amber-500 mb-1" />
                        <p className="text-xs font-semibold text-center truncate w-full">
                          {leaderboardData.leaderboard[0].name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leaderboardData.leaderboard[0].totalPoints} pts
                        </p>
                        <div className="h-24 w-full bg-amber-100 dark:bg-amber-950/30 rounded-t-lg mt-2 flex items-center justify-center">
                          <span className="text-lg font-bold text-amber-500">
                            1
                          </span>
                        </div>
                      </div>

                      {/* 3rd place */}
                      <div className="flex flex-col items-center w-24">
                        <div className="flex size-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50 border-2 border-orange-300 dark:border-orange-800 mb-2">
                          <User className="size-5 text-orange-500" />
                        </div>
                        <Medal className="size-5 text-orange-500 mb-1" />
                        <p className="text-xs font-semibold text-center truncate w-full">
                          {leaderboardData.leaderboard[2].name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leaderboardData.leaderboard[2].totalPoints} pts
                        </p>
                        <div className="h-10 w-full bg-orange-100 dark:bg-orange-950/30 rounded-t-lg mt-2 flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-500">
                            3
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Full leaderboard list */}
                  <div className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      <span className="col-span-1">Rank</span>
                      <span className="col-span-5">User</span>
                      <span className="col-span-3">Badge</span>
                      <span className="col-span-3 text-right">Points</span>
                    </div>
                    {leaderboardData.leaderboard.map((user) => {
                      const isCurrentUser =
                        leaderboardData.currentUser?.id === user.id;

                      return (
                        <div
                          key={user.id}
                          className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-t text-sm transition-colors ${
                            isCurrentUser
                              ? "bg-primary/5 border-l-2 border-l-primary"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <div className="col-span-1">
                            <RankBadge rank={user.rank} />
                          </div>
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                              <User className="size-3.5 text-muted-foreground" />
                            </div>
                            <span
                              className={`truncate ${
                                isCurrentUser ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {user.name}
                              {isCurrentUser && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (you)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="col-span-3">
                            {user.badge ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${getBadgeColor(user.badge.name)}`}
                              >
                                {getBadgeIcon(user.badge.name, "size-3 mr-0.5")}
                                {user.badge.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </div>
                          <div className="col-span-3 text-right">
                            <span
                              className={`font-semibold ${
                                user.rank <= 3
                                  ? "text-amber-600 dark:text-amber-400"
                                  : ""
                              }`}
                            >
                              {user.totalPoints}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              pts
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Current user if not in the list */}
                    {leaderboardData.currentUser &&
                      !leaderboardData.leaderboard.find(
                        (u) => u.id === leaderboardData.currentUser!.id,
                      ) && (
                        <>
                          <div className="px-4 py-1.5 border-t">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <ChevronRight className="size-3 rotate-90" />
                              <span>...</span>
                              <ChevronRight className="size-3 rotate-90" />
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-t bg-primary/5 border-l-2 border-l-primary text-sm">
                            <div className="col-span-1">
                              <RankBadge
                                rank={leaderboardData.currentUser.rank}
                              />
                            </div>
                            <div className="col-span-5 flex items-center gap-2 min-w-0">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                <User className="size-3.5 text-muted-foreground" />
                              </div>
                              <span className="truncate font-semibold">
                                {leaderboardData.currentUser.name}
                                <span className="text-xs text-muted-foreground ml-1">
                                  (you)
                                </span>
                              </span>
                            </div>
                            <div className="col-span-3">
                              {leaderboardData.currentUser.badge ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${getBadgeColor(leaderboardData.currentUser.badge.name)}`}
                                >
                                  {getBadgeIcon(
                                    leaderboardData.currentUser.badge.name,
                                    "size-3 mr-0.5",
                                  )}
                                  {leaderboardData.currentUser.badge.name}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                            <div className="col-span-3 text-right">
                              <span className="font-semibold">
                                {leaderboardData.currentUser.totalPoints}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                pts
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
