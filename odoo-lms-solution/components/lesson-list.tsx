"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { LessonForm, type LessonFormValues } from "@/components/lesson-form";
import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Loader2,
} from "lucide-react";

interface Lesson {
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
  createdAt: string;
  updatedAt: string;
}

interface LessonListProps {
  courseId: string;
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
      return <FileText className="size-4" />;
  }
}

function lessonTypeBadgeVariant(type: string) {
  switch (type) {
    case "video":
      return "default" as const;
    case "document":
      return "secondary" as const;
    case "image":
      return "outline" as const;
    case "quiz":
      return "destructive" as const;
    default:
      return "secondary" as const;
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

export function LessonList({ courseId }: LessonListProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingLesson, setEditingLesson] = useState<
    Partial<LessonFormValues> | undefined
  >(undefined);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load lessons.");
        return;
      }

      setLessons(data.lessons);
    } catch {
      setError("Something went wrong loading lessons.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  function handleAddLesson() {
    setFormMode("create");
    setEditingLesson(undefined);
    setFormOpen(true);
  }

  function handleEditLesson(lesson: Lesson) {
    setFormMode("edit");
    setEditingLesson({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      description: lesson.description ?? "",
      videoUrl: lesson.videoUrl ?? "",
      videoDuration: lesson.videoDuration,
      fileUrl: lesson.fileUrl ?? "",
      allowDownload: lesson.allowDownload,
    });
    setFormOpen(true);
  }

  function handleDeleteClick(lesson: Lesson) {
    setDeletingLesson(lesson);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingLesson) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/lessons/${deletingLesson.id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete lesson.");
        return;
      }

      await fetchLessons();
    } catch {
      setError("Failed to delete lesson. Try again.");
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeletingLesson(null);
    }
  }

  async function handleMoveLesson(index: number, direction: "up" | "down") {
    if (reordering) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    // Optimistic reorder in the UI
    const reordered = [...lessons];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setLessons(reordered);

    // Send to server
    setReordering(true);
    try {
      const orderedIds = reordered.map((l) => l.id);
      const res = await fetch(
        `/api/admin/courses/${courseId}/lessons/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reorder lessons.");
        // Revert on failure
        await fetchLessons();
        return;
      }

      setLessons(data.lessons);
    } catch {
      setError("Failed to reorder lessons.");
      await fetchLessons();
    } finally {
      setReordering(false);
    }
  }

  function handleFormSuccess() {
    fetchLessons();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading lessons...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lessons</CardTitle>
              <CardDescription className="mt-1">
                {lessons.length === 0
                  ? "No lessons yet. Add your first lesson to get started."
                  : `${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"} in this course`}
              </CardDescription>
            </div>
            <Button onClick={handleAddLesson} size="sm">
              <Plus className="size-4" />
              Add Lesson
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 text-destructive text-sm text-center rounded-md bg-destructive/10 p-3">
              {error}
              <button
                onClick={() => setError("")}
                className="ml-2 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <FileText className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm mb-1">
                This course has no lessons yet.
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                Lessons are what learners will see when they open this course.
              </p>
              <Button onClick={handleAddLesson} variant="outline" size="sm">
                <Plus className="size-4" />
                Add First Lesson
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {lessons.map((lesson, index) => (
                <div key={lesson.id}>
                  {index > 0 && <Separator />}
                  <div
                    className={`group flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted/50 ${reordering ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {/* Grip / Order indicator */}
                    <div className="flex shrink-0 items-center gap-1">
                      <GripVertical className="size-4 text-muted-foreground/40" />
                      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    {/* Lesson info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {lesson.title}
                        </span>
                        <Badge variant={lessonTypeBadgeVariant(lesson.type)}>
                          {lessonTypeIcon(lesson.type)}
                          <span className="ml-1 capitalize">{lesson.type}</span>
                        </Badge>
                      </div>
                      {(lesson.description || lesson.videoDuration || lesson.videoUrl || lesson.fileUrl) && (
                        <div className="flex items-center gap-3 mt-1">
                          {lesson.description && (
                            <p className="text-muted-foreground text-xs line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                          {lesson.type === "video" &&
                            lesson.videoDuration !== null && (
                              <span className="text-muted-foreground text-xs shrink-0">
                                {formatDuration(lesson.videoDuration)}
                              </span>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleMoveLesson(index, "up")}
                        disabled={index === 0 || reordering}
                        title="Move up"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleMoveLesson(index, "down")}
                        disabled={index === lessons.length - 1 || reordering}
                        title="Move down"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEditLesson(lesson)}
                        title="Edit lesson"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(lesson)}
                        title="Delete lesson"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Create/Edit Dialog */}
      <LessonForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        courseId={courseId}
        defaultValues={editingLesson}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deletingLesson?.title}&rdquo;
              </span>
              ? This will also delete all progress data and attachments
              associated with this lesson. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Lesson"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
