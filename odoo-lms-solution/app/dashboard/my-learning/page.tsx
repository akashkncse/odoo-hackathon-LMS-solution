"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Clock, ArrowRight, Award } from "lucide-react";

interface EnrollmentData {
  enrollment: {
    id: string;
    status: "not_started" | "in_progress" | "completed";
    enrolledAt: string;
    startedAt: string | null;
    completedAt: string | null;
    timeSpentSeconds: number;
  };
  course: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    accessRule: "open" | "invitation" | "payment";
    price: string | null;
  };
}

function statusLabel(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Not Started";
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
}

function formatTimeSpent(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const res = await fetch("/api/me/enrollments");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load enrollments.");
          return;
        }

        setEnrollments(data.enrollments);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollments();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Learning</h1>
        <p className="text-muted-foreground mt-1">
          Your enrolled courses and progress.
        </p>
      </div>

      {loading && (
        <p className="text-muted-foreground">Loading your courses...</p>
      )}

      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && enrollments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
              <BookOpen className="text-muted-foreground size-8" />
            </div>
            <p className="text-muted-foreground text-lg">
              You haven&apos;t enrolled in any courses yet.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Browse our catalog to find courses that interest you.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && enrollments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(({ enrollment, course }) => (
            <Card key={enrollment.id} className="flex flex-col overflow-hidden">
              {course.imageUrl ? (
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(enrollment.status)}`}
                  >
                    {statusLabel(enrollment.status)}
                  </span>
                </div>
              ) : (
                <div className="bg-muted relative flex h-40 w-full items-center justify-center">
                  <BookOpen className="text-muted-foreground size-12 opacity-30" />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle(enrollment.status)}`}
                  >
                    {statusLabel(enrollment.status)}
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">
                  {course.title}
                </CardTitle>
                {course.description && (
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-muted-foreground flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Enrolled</span>
                    <span className="text-foreground font-medium">
                      {formatDate(enrollment.enrolledAt)}
                    </span>
                  </div>
                  {enrollment.timeSpentSeconds > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        <span>Time Spent</span>
                      </div>
                      <span className="text-foreground font-medium">
                        {formatTimeSpent(enrollment.timeSpentSeconds)}
                      </span>
                    </div>
                  )}
                  {enrollment.status === "completed" &&
                    enrollment.completedAt && (
                      <div className="flex items-center justify-between">
                        <span>Completed</span>
                        <span className="text-foreground font-medium">
                          {formatDate(enrollment.completedAt)}
                        </span>
                      </div>
                    )}
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    {enrollment.status === "completed" ? (
                      <>Review Course</>
                    ) : enrollment.status === "in_progress" ? (
                      <>
                        Continue Learning
                        <ArrowRight className="size-4" />
                      </>
                    ) : (
                      <>
                        Start Learning
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Link>
                </Button>
                {enrollment.status === "completed" && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full gap-1.5"
                    size="sm"
                  >
                    <Link href={`/dashboard/courses/${course.id}/certificate`}>
                      <Award className="size-4 text-amber-500" />
                      View Certificate
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
