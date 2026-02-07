"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  GraduationCap,
  Eye,
  Trophy,
  HelpCircle,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  Award,
  Loader2,
} from "lucide-react";

interface DashboardData {
  userCounts: {
    total: number;
    learners: number;
    instructors: number;
    superadmins: number;
  };
  courseCounts: {
    total: number;
    published: number;
    draft: number;
    totalViews: number;
  };
  lessonCount: number;
  quizCount: number;
  enrollmentCounts: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  completionRate: number;
  quizAttemptStats: {
    totalAttempts: number;
    avgScore: number;
    totalPointsAwarded: number;
  };
  recentEnrollments: {
    id: string;
    status: "not_started" | "in_progress" | "completed";
    enrolledAt: string;
    userName: string;
    userEmail: string;
    courseTitle: string;
    courseId: string;
  }[];
  topCourses: {
    id: string;
    title: string;
    published: boolean;
    viewsCount: number;
    enrollmentCount: number;
    completedCount: number;
  }[];
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "default",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  accent?: "default" | "blue" | "green" | "amber" | "purple" | "rose";
}) {
  const accentStyles = {
    default: "bg-muted text-muted-foreground",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
    amber:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={`flex size-10 items-center justify-center rounded-lg ${accentStyles[accent]}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({
  value,
  max,
  color = "blue",
}: {
  value: number;
  max: number;
  color?: "blue" | "green" | "amber";
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const colorStyles = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorStyles[color]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-8 text-right">
        {percent}%
      </span>
    </div>
  );
}

function enrollmentStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400"
        >
          <CheckCircle2 className="size-3 mr-1" />
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="default"
          className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400"
        >
          <Clock className="size-3 mr-1" />
          In Progress
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:text-yellow-400"
        >
          Not Started
        </Badge>
      );
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to load dashboard.");
          return;
        }

        setData(json);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive text-lg">{error || "Failed to load."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and key metrics at a glance.
        </p>
      </div>

      {/* Primary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data.userCounts.total}
          description={`${data.userCounts.learners} learners · ${data.userCounts.instructors} instructors`}
          icon={Users}
          accent="blue"
        />
        <StatCard
          title="Courses"
          value={data.courseCounts.total}
          description={`${data.courseCounts.published} published · ${data.courseCounts.draft} draft`}
          icon={BookOpen}
          accent="purple"
        />
        <StatCard
          title="Enrollments"
          value={data.enrollmentCounts.total}
          description={`${data.enrollmentCounts.inProgress} active · ${data.enrollmentCounts.completed} completed`}
          icon={GraduationCap}
          accent="green"
        />
        <StatCard
          title="Completion Rate"
          value={`${data.completionRate}%`}
          description={`${data.enrollmentCounts.completed} of ${data.enrollmentCounts.total} enrollments`}
          icon={TrendingUp}
          accent="amber"
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Lessons"
          value={data.lessonCount}
          description="Across all courses"
          icon={FileText}
        />
        <StatCard
          title="Total Quizzes"
          value={data.quizCount}
          description={`${data.quizAttemptStats.totalAttempts} attempts total`}
          icon={HelpCircle}
          accent="rose"
        />
        <StatCard
          title="Avg Quiz Score"
          value={`${data.quizAttemptStats.avgScore}%`}
          description={`${data.quizAttemptStats.totalPointsAwarded} total points awarded`}
          icon={Target}
          accent="amber"
        />
        <StatCard
          title="Total Views"
          value={data.courseCounts.totalViews.toLocaleString()}
          description="Course page views"
          icon={Eye}
          accent="blue"
        />
      </div>

      {/* Enrollment funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4" />
            Enrollment Funnel
          </CardTitle>
          <CardDescription>
            How learners progress through enrolled courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Not Started</span>
                <span className="font-medium">
                  {data.enrollmentCounts.notStarted}
                </span>
              </div>
              <ProgressBar
                value={data.enrollmentCounts.notStarted}
                max={data.enrollmentCounts.total}
                color="amber"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium">
                  {data.enrollmentCounts.inProgress}
                </span>
              </div>
              <ProgressBar
                value={data.enrollmentCounts.inProgress}
                max={data.enrollmentCounts.total}
                color="blue"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {data.enrollmentCounts.completed}
                </span>
              </div>
              <ProgressBar
                value={data.enrollmentCounts.completed}
                max={data.enrollmentCounts.total}
                color="green"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent enrollments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="size-4" />
                  Recent Enrollments
                </CardTitle>
                <CardDescription>Latest learner sign-ups</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentEnrollments.length === 0 ? (
              <div className="py-8 text-center">
                <GraduationCap className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No enrollments yet.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.recentEnrollments.map((enrollment, index) => (
                  <div key={enrollment.id}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-start justify-between gap-3 py-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                            {enrollment.userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {enrollment.userName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {enrollment.courseTitle}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {enrollmentStatusBadge(enrollment.status)}
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(enrollment.enrolledAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="size-4" />
                  Top Courses
                </CardTitle>
                <CardDescription>
                  Most popular courses by enrollment
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/courses">
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.topCourses.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No courses yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/admin/courses/new">
                    Create your first course
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {data.topCourses.map((course, index) => {
                  const courseCompletionRate =
                    course.enrollmentCount > 0
                      ? Math.round(
                          (course.completedCount / course.enrollmentCount) *
                            100,
                        )
                      : 0;

                  return (
                    <div key={course.id}>
                      {index > 0 && <Separator className="my-2" />}
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="block rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-muted/60 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">
                                {course.title}
                              </span>
                              {course.published ? (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                                >
                                  Published
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Draft
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="size-3" />
                                {course.enrollmentCount}{" "}
                                {course.enrollmentCount === 1
                                  ? "enrollment"
                                  : "enrollments"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="size-3" />
                                {course.viewsCount}{" "}
                                {course.viewsCount === 1 ? "view" : "views"}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                {courseCompletionRate}% completed
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5 mt-1">
                            <Trophy className="size-3.5 text-amber-500" />
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                        {course.enrollmentCount > 0 && (
                          <div className="mt-2">
                            <ProgressBar
                              value={course.completedCount}
                              max={course.enrollmentCount}
                              color="green"
                            />
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/courses/new">
                <BookOpen className="size-4" />
                Create Course
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/courses">
                <FileText className="size-4" />
                Manage Courses
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Eye className="size-4" />
                View Landing Page
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
