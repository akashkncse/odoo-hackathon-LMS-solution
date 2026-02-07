"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useCurrency } from "@/hooks/use-currency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Star,
  HelpCircle,
  Loader2,
  ArrowRight,
  GraduationCap,
  PlayCircle,
  AlertCircle,
  Target,
  Timer,
} from "lucide-react";

interface CourseReport {
  id: string;
  title: string;
  imageUrl: string | null;
  published: boolean;
  accessRule: string;
  price: string | null;
  viewsCount: number;
  createdAt: string;
  enrollment: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    completionRate: number;
    totalTimeSpentSeconds: number;
    avgTimeSpentSeconds: number;
  };
  content: {
    totalLessons: number;
    totalDurationSeconds: number;
  };
  quiz: {
    totalQuizzes: number;
    totalAttempts: number;
    avgScore: number;
    totalPointsAwarded: number;
  };
  reviews: {
    totalReviews: number;
    avgRating: number;
  };
}

interface Summary {
  totalCourses: number;
  totalEnrollments: number;
  totalCompleted: number;
  totalInProgress: number;
  totalNotStarted: number;
  totalViews: number;
  overallCompletionRate: number;
  averageRating: number;
  totalTimeSpentSeconds: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface ReportData {
  courses: CourseReport[];
  summary: Summary;
  trends: {
    enrollments: TrendPoint[];
    completions: TrendPoint[];
  };
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProgressBar({
  value,
  max,
  color = "blue",
}: {
  value: number;
  max: number;
  color?: "blue" | "green" | "amber" | "purple";
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const colorStyles = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorStyles[color]}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-10 text-right">
        {percent}%
      </span>
    </div>
  );
}

function MiniBarChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No data yet
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const last14 = data.slice(-14);

  return (
    <div className="flex items-end gap-1 h-24">
      {last14.map((point, i) => {
        const height = Math.max((point.count / maxCount) * 100, 4);
        const dateObj = new Date(point.date);
        const label = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group relative"
          >
            <div className="absolute -top-6 hidden group-hover:block bg-popover border rounded px-1.5 py-0.5 text-[10px] font-medium shadow-sm z-10 whitespace-nowrap">
              {label}: {point.count}
            </div>
            <div
              className="w-full rounded-sm bg-primary/80 hover:bg-primary transition-colors cursor-default min-w-[6px]"
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  accent?: "default" | "blue" | "green" | "amber" | "purple" | "rose";
}) {
  const accentStyles = {
    default: "bg-muted text-foreground",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accentStyles[accent]}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportingPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const { formatPrice } = useCurrency();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url =
        selectedCourseId && selectedCourseId !== "all"
          ? `/api/admin/reporting?courseId=${selectedCourseId}`
          : "/api/admin/reporting";
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load report.");
        return;
      }

      setData(json);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  // Initial fetch (all courses) to populate the dropdown
  const [allCourses, setAllCourses] = useState<{ id: string; title: string }[]>(
    [],
  );

  useEffect(() => {
    async function fetchAllCourses() {
      try {
        const res = await fetch("/api/admin/reporting");
        const json = await res.json();
        if (res.ok) {
          setAllCourses(
            json.courses.map((c: CourseReport) => ({
              id: c.id,
              title: c.title,
            })),
          );
          setData(json);
        } else {
          setError(json.error || "Failed to load report.");
        }
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId !== "all") {
      fetchReport();
    } else {
      // Re-fetch all
      setLoading(true);
      fetch("/api/admin/reporting")
        .then((r) => r.json())
        .then((json) => setData(json))
        .catch(() => setError("Something went wrong."))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto size-10 text-destructive mb-3" />
        <p className="text-destructive text-lg font-medium">{error}</p>
        <Button onClick={fetchReport} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, courses: courseReports, trends } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="size-6" />
            Reporting
          </h1>
          <p className="text-muted-foreground mt-1">
            Course-wise analytics, enrollment stats, and performance reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {allCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Participants"
          value={summary.totalEnrollments}
          icon={Users}
          description={`${summary.totalCompleted} completed`}
          accent="blue"
        />
        <StatCard
          label="Completion Rate"
          value={`${summary.overallCompletionRate}%`}
          icon={Target}
          description={`${summary.totalCompleted} of ${summary.totalEnrollments}`}
          accent="green"
        />
        <StatCard
          label="Total Views"
          value={summary.totalViews.toLocaleString()}
          icon={Eye}
          description={`Across ${summary.totalCourses} course${summary.totalCourses !== 1 ? "s" : ""}`}
          accent="purple"
        />
        <StatCard
          label="Total Time Spent"
          value={formatTime(summary.totalTimeSpentSeconds)}
          icon={Clock}
          description="By all participants"
          accent="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Yet to Start"
          value={summary.totalNotStarted}
          icon={AlertCircle}
          accent="rose"
        />
        <StatCard
          label="In Progress"
          value={summary.totalInProgress}
          icon={PlayCircle}
          accent="amber"
        />
        <StatCard
          label="Completed"
          value={summary.totalCompleted}
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          label="Avg. Rating"
          value={
            summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "N/A"
          }
          icon={Star}
          description={
            summary.totalQuizAttempts > 0
              ? `Quiz avg: ${summary.averageQuizScore}%`
              : undefined
          }
          accent="purple"
        />
      </div>

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Enrollment Trend
            </CardTitle>
            <CardDescription>Last 14 days of new enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={trends.enrollments} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="size-4" />
              Completion Trend
            </CardTitle>
            <CardDescription>Last 14 days of completions</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={trends.completions} />
          </CardContent>
        </Card>
      </div>

      {/* Course-wise reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Course-wise Report</h2>
        {courseReports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto size-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No courses found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courseReports.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
                    <div className="flex items-start gap-3 min-w-0">
                      {course.imageUrl ? (
                        <img
                          src={course.imageUrl}
                          alt={course.title}
                          className="size-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <BookOpen className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={course.published ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {course.published ? "Published" : "Draft"}
                          </Badge>
                          {course.accessRule === "payment" && course.price && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {formatPrice(course.price)}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Created {formatDate(course.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0"
                      >
                        View Details
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <Separator className="mb-5" />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {/* Participants */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-3.5" />
                        <span className="text-xs font-medium">
                          Participants
                        </span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">
                        {course.enrollment.total}
                      </p>
                    </div>

                    {/* Views */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="size-3.5" />
                        <span className="text-xs font-medium">Views</span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">
                        {course.viewsCount}
                      </p>
                    </div>

                    {/* Contents */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <BookOpen className="size-3.5" />
                        <span className="text-xs font-medium">Contents</span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">
                        {course.content.totalLessons}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="size-3.5" />
                        <span className="text-xs font-medium">Duration</span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">
                        {course.content.totalDurationSeconds > 0
                          ? formatDuration(course.content.totalDurationSeconds)
                          : "—"}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Star className="size-3.5" />
                        <span className="text-xs font-medium">Rating</span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">
                        {course.reviews.avgRating > 0
                          ? Number(course.reviews.avgRating).toFixed(1)
                          : "—"}
                      </p>
                      {course.reviews.totalReviews > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {course.reviews.totalReviews} review
                          {course.reviews.totalReviews !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Quiz */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <HelpCircle className="size-3.5" />
                        <span className="text-xs font-medium">
                          Quiz Attempts
                        </span>
                      </div>
                      <p className="text-xl font-bold tabular-nums">
                        {course.quiz.totalAttempts}
                      </p>
                      {course.quiz.totalAttempts > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Avg score: {course.quiz.avgScore}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Enrollment breakdown */}
                  {course.enrollment.total > 0 && (
                    <div className="mt-5 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Completion Rate
                        </span>
                        <span className="text-xs font-semibold">
                          {course.enrollment.completionRate}%
                        </span>
                      </div>
                      <ProgressBar
                        value={course.enrollment.completed}
                        max={course.enrollment.total}
                        color="green"
                      />
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-yellow-500" />
                          <span>
                            Yet to Start: {course.enrollment.notStarted}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-blue-500" />
                          <span>
                            In Progress: {course.enrollment.inProgress}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-green-500" />
                          <span>Completed: {course.enrollment.completed}</span>
                        </div>
                        {course.enrollment.avgTimeSpentSeconds > 0 && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <Clock className="size-3" />
                            <span>
                              Avg time:{" "}
                              {formatTime(
                                course.enrollment.avgTimeSpentSeconds,
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Participants button */}
                      <div className="mt-4">
                        <Link
                          href={`/admin/courses/${course.id}?tab=participants`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                          >
                            <Users className="size-3.5" />
                            View All Participants
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
