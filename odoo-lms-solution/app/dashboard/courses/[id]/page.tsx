"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  price: string | null;
  published: boolean;
  viewsCount: number;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  type: "video" | "document" | "image" | "quiz";
  description: string | null;
  sortOrder: number;
}

interface Enrollment {
  id: string;
  status: "not_started" | "in_progress" | "completed";
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

function lessonTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <PlayCircle className="size-4" />;
    case "document":
      return <FileText className="size-4" />;
    case "image":
      return <ImageIcon className="size-4" />;
    case "quiz":
      return <HelpCircle className="size-4" />;
    default:
      return <BookOpen className="size-4" />;
  }
}

function lessonTypeLabel(type: string) {
  switch (type) {
    case "video":
      return "Video";
    case "document":
      return "Document";
    case "image":
      return "Image";
    case "quiz":
      return "Quiz";
    default:
      return type;
  }
}

function accessRuleLabel(rule: string) {
  switch (rule) {
    case "invitation":
      return "Invitation Only";
    case "payment":
      return "Paid Course";
    default:
      return "Free & Open";
  }
}

function accessRuleStyle(rule: string) {
  switch (rule) {
    case "invitation":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "payment":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
}

function enrollmentStatusLabel(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Not Started";
  }
}

function enrollmentStatusStyle(status: string) {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load course.");
          return;
        }

        setCourse(data.course);
        setLessons(data.lessons);
        setEnrollment(data.enrollment);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  async function handleEnroll() {
    setEnrollError("");
    setEnrolling(true);

    try {
      const res = await fetch(`/api/courses/${id}/enroll`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setEnrollError(data.error);
        return;
      }

      setEnrollment(data.enrollment);
    } catch {
      setEnrollError("Failed to enroll. Try again.");
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive text-lg">
          {error || "Course not found."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/courses">
            <ArrowLeft className="size-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="-m-6">
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden sm:h-72 md:h-80">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <BookOpen className="text-muted-foreground size-20 opacity-30" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Banner content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${accessRuleStyle(course.accessRule)}`}
            >
              {accessRuleLabel(course.accessRule)}
            </span>
            {enrollment && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${enrollmentStatusStyle(enrollment.status)}`}
              >
                {enrollmentStatusLabel(enrollment.status)}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            {course.title}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Eye className="size-3.5" />
              <span>{course.viewsCount} views</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              <span>
                {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
              </span>
            </div>
            {course.accessRule === "payment" && course.price && (
              <span className="font-semibold text-white">
                ${parseFloat(course.price).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Back link */}
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link href="/dashboard/courses">
              <ArrowLeft className="size-4" />
              Back to Courses
            </Link>
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column — Course info + lessons */}
            <div className="space-y-6 lg:col-span-2">
              {/* Description */}
              {course.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About this Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {course.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Lessons list */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                  <CardDescription>
                    {lessons.length}{" "}
                    {lessons.length === 1 ? "lesson" : "lessons"} in this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lessons.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      No lessons have been added to this course yet.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {lessons.map((lesson, index) => {
                        const isEnrolled = !!enrollment;
                        const content = (
                          <>
                            <span className="text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">
                                  {lesson.title}
                                </span>
                              </div>
                              {lesson.description && (
                                <p className="text-muted-foreground text-xs line-clamp-1 mt-0.5">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                              {lessonTypeIcon(lesson.type)}
                              <span className="text-xs">
                                {lessonTypeLabel(lesson.type)}
                              </span>
                            </div>
                          </>
                        );

                        return (
                          <div key={lesson.id}>
                            {index > 0 && <Separator className="my-1" />}
                            {isEnrolled ? (
                              <Link
                                href={`/dashboard/courses/${id}/lessons/${lesson.id}`}
                                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/60 group"
                              >
                                {content}
                                <ArrowLeft className="size-4 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0" />
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3 rounded-md px-3 py-2.5 opacity-75">
                                {content}
                                <Lock className="size-4 text-muted-foreground/50 shrink-0" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column — Enroll card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {enrollment ? "You're Enrolled" : "Enroll Now"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {enrollment ? (
                      <>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${enrollmentStatusStyle(enrollment.status)}`}
                            >
                              {enrollmentStatusLabel(enrollment.status)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Enrolled
                            </span>
                            <span className="font-medium">
                              {new Date(
                                enrollment.enrolledAt,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {enrollment.status === "completed" &&
                            enrollment.completedAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Completed
                                </span>
                                <span className="font-medium">
                                  {new Date(
                                    enrollment.completedAt,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                        </div>
                        <Separator />
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 className="size-4" />
                          <span>You have access to this course</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {course.accessRule === "payment" && course.price ? (
                          <div className="text-center">
                            <span className="text-3xl font-bold">
                              ${parseFloat(course.price).toFixed(2)}
                            </span>
                          </div>
                        ) : course.accessRule === "open" ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="size-4" />
                            <span>Free to enroll</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="size-4" />
                            <span>Requires an invitation</span>
                          </div>
                        )}

                        {enrollError && (
                          <p className="text-destructive text-sm text-center">
                            {enrollError}
                          </p>
                        )}

                        <Button
                          onClick={handleEnroll}
                          disabled={enrolling}
                          className="w-full"
                          size="lg"
                        >
                          {enrolling
                            ? "Enrolling..."
                            : course.accessRule === "payment"
                              ? "Buy Course"
                              : "Enroll for Free"}
                        </Button>

                        <p className="text-muted-foreground text-xs text-center">
                          {course.accessRule === "open"
                            ? "Instant access after enrollment."
                            : course.accessRule === "invitation"
                              ? "You'll be enrolled if you have a valid invitation."
                              : "Payment processing coming soon."}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
