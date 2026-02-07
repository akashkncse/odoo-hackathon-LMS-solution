"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  price: string | null;
  viewsCount: number;
  createdAt: string;
}

export default function BrowseCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
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

  function accessRuleLabel(rule: string) {
    switch (rule) {
      case "invitation":
        return "Invitation Only";
      case "payment":
        return "Paid";
      default:
        return "Free";
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Browse Courses</h1>
        <p className="text-muted-foreground mt-1">
          Explore our catalog and find courses that interest you.
        </p>
      </div>

      {loading && <p className="text-muted-foreground">Loading courses...</p>}

      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              No courses available yet.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Check back later for new courses.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden">
              {course.imageUrl ? (
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${accessRuleStyle(course.accessRule)}`}
                  >
                    {accessRuleLabel(course.accessRule)}
                  </span>
                </div>
              ) : (
                <div className="bg-muted relative flex h-44 w-full items-center justify-center">
                  <span className="text-muted-foreground text-4xl">📚</span>
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${accessRuleStyle(course.accessRule)}`}
                  >
                    {accessRuleLabel(course.accessRule)}
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">
                  {course.title}
                </CardTitle>
                {course.description && (
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    <span>{course.viewsCount} views</span>
                  </div>
                  {course.accessRule === "payment" && course.price && (
                    <span className="text-foreground font-semibold">
                      ${parseFloat(course.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    View Course
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
