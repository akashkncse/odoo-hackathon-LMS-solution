"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { LessonList } from "@/components/lesson-list";
import { QuizEditor } from "@/components/quiz-editor";
import { ParticipantsTable } from "@/components/participants-table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  ListOrdered,
  HelpCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

interface CourseTag {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  price: string | null;
  published: boolean;
  tags?: CourseTag[];
}

type Tab = "details" | "lessons" | "quizzes" | "participants";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(
    tabFromUrl === "participants"
      ? "participants"
      : tabFromUrl === "quizzes"
        ? "quizzes"
        : tabFromUrl === "lessons"
          ? "lessons"
          : "details",
  );

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

  // Sync tab from URL when searchParams change
  useEffect(() => {
    if (tabFromUrl === "participants") {
      setActiveTab("participants");
    } else if (tabFromUrl === "quizzes") {
      setActiveTab("quizzes");
    } else if (tabFromUrl === "lessons") {
      setActiveTab("lessons");
    }
  }, [tabFromUrl]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-destructive">{error || "Course not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/courses">
            <ArrowLeft className="size-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "details",
      label: "Course Details",
      icon: <BookOpen className="size-4" />,
    },
    {
      key: "lessons",
      label: "Lessons",
      icon: <ListOrdered className="size-4" />,
    },
    {
      key: "quizzes",
      label: "Quizzes",
      icon: <HelpCircle className="size-4" />,
    },
    {
      key: "participants",
      label: "Participants",
      icon: <Users className="size-4" />,
    },
  ];

  return (
    <div
      className={`mx-auto ${activeTab === "participants" ? "max-w-6xl" : "max-w-4xl"}`}
    >
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/courses">
            <ArrowLeft className="size-4" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-2xl font-bold truncate">{course.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage course details, lessons, quizzes, and participants.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <Separator className="mb-6" />

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="max-w-2xl">
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
              tags: course.tags ?? [],
            }}
          />
        </div>
      )}

      {activeTab === "lessons" && <LessonList courseId={course.id} />}

      {activeTab === "quizzes" && <QuizEditor courseId={course.id} />}

      {activeTab === "participants" && (
        <ParticipantsTable courseId={course.id} />
      )}
    </div>
  );
}
