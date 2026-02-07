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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/admin/courses");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load courses.");
          return;
        }

        setCourses(data.courses);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function visibilityLabel(v: string) {
    return v === "signed_in" ? "Signed In Only" : "Everyone";
  }

  function accessRuleLabel(a: string) {
    switch (a) {
      case "invitation":
        return "Invitation Only";
      case "payment":
        return "Payment Required";
      default:
        return "Open";
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses here. Create, edit, and publish courses for your
            learners.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">Create Course</Link>
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading courses...</p>}

      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              You haven&apos;t created any courses yet.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Get started by creating your first course.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/courses/new">Create Your First Course</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              {course.imageUrl && (
                <div className="overflow-hidden rounded-t-xl">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    {course.title}
                  </CardTitle>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.published
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {course.published ? "Published" : "Draft"}
                  </span>
                </div>
                {course.description && (
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-muted-foreground flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Visibility</span>
                    <span className="font-medium text-foreground">
                      {visibilityLabel(course.visibility)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Access</span>
                    <span className="font-medium text-foreground">
                      {accessRuleLabel(course.accessRule)}
                    </span>
                  </div>
                  {course.accessRule === "payment" && course.price && (
                    <div className="flex items-center justify-between">
                      <span>Price</span>
                      <span className="font-medium text-foreground">
                        ${parseFloat(course.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Views</span>
                    <span className="font-medium text-foreground">
                      {course.viewsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created</span>
                    <span className="font-medium text-foreground">
                      {formatDate(course.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/admin/courses/${course.id}`}>Edit</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
