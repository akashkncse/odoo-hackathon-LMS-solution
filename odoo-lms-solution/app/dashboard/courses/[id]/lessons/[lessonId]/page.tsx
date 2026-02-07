"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { QuizRunner } from "@/components/quiz-runner";

interface LessonData {
  id: string;
  courseId: string;
  title: string;
  type: "video" | "document" | "image" | "quiz";
  description: string | null;
  sortOrder: number;
  videoUrl: string | null;
  videoDuration: number | null;
  fileUrl: string | null;
  allowDownload: boolean;
  quizId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CourseInfo {
  id: string;
  title: string;
}

interface ProgressInfo {
  status: "not_started" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
}

interface NavLesson {
  id: string;
  title: string;
  type: string;
  sortOrder: number;
}

interface NavigationInfo {
  currentIndex: number;
  totalLessons: number;
  prevLesson: NavLesson | null;
  nextLesson: NavLesson | null;
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/,
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function VideoPlayer({ url }: { url: string }) {
  const embedUrl = getEmbedUrl(url);

  if (embedUrl) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        <iframe
          src={embedUrl}
          title="Video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  if (isDirectVideoUrl(url)) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-black">
        <video src={url} controls className="w-full" preload="metadata">
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback: link to video
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
      <PlayCircle className="size-12 text-muted-foreground/50 mb-3" />
      <p className="text-muted-foreground text-sm mb-4">
        This video cannot be embedded directly.
      </p>
      <Button asChild variant="outline">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open Video in New Tab
        </a>
      </Button>
    </div>
  );
}

function DocumentViewer({
  url,
  allowDownload,
}: {
  url: string;
  allowDownload: boolean;
}) {
  const isPdf = /\.pdf(\?.*)?$/i.test(url);

  return (
    <div className="space-y-4">
      {isPdf ? (
        <div
          className="relative w-full overflow-hidden rounded-lg border"
          style={{ height: "70vh" }}
        >
          <iframe src={url} title="Document viewer" className="h-full w-full" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
          <FileText className="size-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            This document type cannot be previewed inline.
          </p>
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open Document
            </a>
          </Button>
        </div>
      )}
      {allowDownload && (
        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <a href={url} download>
              <Download className="size-4" />
              Download Document
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function ImageViewer({
  url,
  title,
  allowDownload,
}: {
  url: string;
  title: string;
  allowDownload: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-lg border bg-muted/20 p-4">
        <img
          src={url}
          alt={title}
          className="max-h-[70vh] max-w-full rounded-md object-contain"
        />
      </div>
      {allowDownload && (
        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <a href={url} download>
              <Download className="size-4" />
              Download Image
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function NoContent({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
      {lessonTypeIcon(type)}
      <p className="text-muted-foreground text-sm mt-3">
        No content has been added to this lesson yet.
      </p>
    </div>
  );
}

export default function LessonViewerPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = use(params);
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [navigation, setNavigation] = useState<NavigationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load lesson.");
          return;
        }

        setLesson(data.lesson);
        setCourse(data.course);
        setProgress(data.progress);
        setNavigation(data.navigation);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [courseId, lessonId]);

  // Mark the current lesson as completed via the progress API
  const markAsComplete = useCallback(async () => {
    if (progress?.status === "completed") return;

    try {
      const res = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        },
      );

      if (res.ok) {
        setProgress((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                completedAt: new Date().toISOString(),
              }
            : prev,
        );
      }
    } catch {
      // Silently fail — navigation is more important than blocking on this
    }
  }, [courseId, lessonId, progress?.status]);

  // Called when clicking "Next" or "Finish Course"
  // For non-quiz lessons: mark complete, then navigate
  // For quiz lessons: just navigate (completion handled by onPerfectScore)
  async function handleNext(destinationUrl: string) {
    setNavigating(true);

    if (lesson?.type !== "quiz" && progress?.status !== "completed") {
      await markAsComplete();
    }

    router.push(destinationUrl);
  }

  // Called by QuizRunner when the learner scores 100%
  function handleQuizPerfectScore() {
    markAsComplete();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading lesson...</span>
      </div>
    );
  }

  if (error || !lesson || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive text-lg">
          {error || "Lesson not found."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/dashboard/courses/${courseId}`}>
            <ChevronLeft className="size-4" />
            Back to Course
          </Link>
        </Button>
      </div>
    );
  }

  const isCompleted = progress?.status === "completed";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/dashboard/courses/${courseId}`}>
            <ChevronLeft className="size-4" />
            {course.title}
          </Link>
        </Button>
        {navigation && (
          <span className="text-muted-foreground text-xs shrink-0">
            Lesson {navigation.currentIndex + 1} of {navigation.totalLessons}
          </span>
        )}
      </div>

      {/* Lesson header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-2xl font-bold flex-1">{lesson.title}</h1>
          <Badge
            variant={
              lesson.type === "video"
                ? "default"
                : lesson.type === "quiz"
                  ? "destructive"
                  : "secondary"
            }
            className="shrink-0 mt-1"
          >
            {lessonTypeIcon(lesson.type)}
            <span className="ml-1 capitalize">{lesson.type}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {lesson.type === "video" && lesson.videoDuration !== null && (
            <span className="flex items-center gap-1">
              <PlayCircle className="size-3.5" />
              {formatDuration(lesson.videoDuration)}
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-3.5" />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {lesson.description && (
        <Card className="mb-6">
          <CardContent className="">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {lesson.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lesson content */}
      <div className="mb-8">
        {lesson.type === "video" && lesson.videoUrl ? (
          <VideoPlayer url={lesson.videoUrl} />
        ) : lesson.type === "document" && lesson.fileUrl ? (
          <DocumentViewer
            url={lesson.fileUrl}
            allowDownload={lesson.allowDownload}
          />
        ) : lesson.type === "image" && lesson.fileUrl ? (
          <ImageViewer
            url={lesson.fileUrl}
            title={lesson.title}
            allowDownload={lesson.allowDownload}
          />
        ) : lesson.type === "quiz" && lesson.quizId ? (
          <QuizRunner
            courseId={courseId}
            quizId={lesson.quizId}
            onPerfectScore={handleQuizPerfectScore}
          />
        ) : lesson.type === "quiz" && !lesson.quizId ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
            <HelpCircle className="size-12 text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium mb-1">Quiz</p>
            <p className="text-muted-foreground text-sm">
              No quiz has been linked to this lesson yet.
            </p>
          </div>
        ) : (
          <NoContent type={lesson.type} />
        )}
      </div>

      <Separator className="mb-6" />

      {/* Bottom: Completion status + Prev/Next navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Completion status indicator (no manual button) */}
        <div>
          {isCompleted ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
              <CheckCircle2 className="size-4" />
              Lesson completed
              {progress?.completedAt && (
                <span className="text-muted-foreground font-normal">
                  on{" "}
                  {new Date(progress.completedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          ) : lesson.type === "quiz" ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="size-3.5" />
              Score 100% on the quiz to complete this lesson
            </p>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="size-3.5" />
              Press Next to mark this lesson as complete
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        {navigation && (
          <div className="flex items-center gap-2">
            {navigation.prevLesson ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/dashboard/courses/${courseId}/lessons/${navigation.prevLesson.id}`}
                >
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline max-w-30 truncate">
                    {navigation.prevLesson.title}
                  </span>
                  <span className="sm:hidden">Previous</span>
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ArrowLeft className="size-4" />
                Previous
              </Button>
            )}

            {navigation.nextLesson ? (
              <Button
                size="sm"
                disabled={navigating}
                onClick={() =>
                  handleNext(
                    `/dashboard/courses/${courseId}/lessons/${navigation.nextLesson!.id}`,
                  )
                }
              >
                {navigating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline max-w-30 truncate">
                      {navigation.nextLesson.title}
                    </span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={navigating}
                onClick={() => handleNext(`/dashboard/courses/${courseId}`)}
              >
                {navigating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Finish Course
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
