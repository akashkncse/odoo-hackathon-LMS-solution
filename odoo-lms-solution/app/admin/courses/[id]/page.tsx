"use client";

import { useEffect, useState, use } from "react";
import { CourseForm } from "@/components/course-form";

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  price: string | null;
  published: boolean;
}

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/admin/courses/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load course.");
          return;
        }

        setCourse(data.course);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-destructive">{error || "Course not found."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <CourseForm
        mode="edit"
        defaultValues={{
          id: course.id,
          title: course.title,
          description: course.description ?? "",
          imageUrl: course.imageUrl ?? "",
          visibility: course.visibility,
          accessRule: course.accessRule,
          price: course.price ?? "",
          published: course.published,
        }}
      />
    </div>
  );
}
