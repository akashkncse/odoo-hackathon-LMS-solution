"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/file-upload";

export interface LessonFormValues {
  id?: string;
  title: string;
  type: "video" | "document" | "image" | "quiz";
  description: string;
  videoUrl: string;
  videoDuration: number | null;
  fileUrl: string;
  allowDownload: boolean;
  quizId?: string | null;
}

interface QuizOption {
  id: string;
  title: string;
}

interface LessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  courseId: string;
  defaultValues?: Partial<LessonFormValues>;
  onSuccess: () => void;
}

const emptyValues: LessonFormValues = {
  title: "",
  type: "video",
  description: "",
  videoUrl: "",
  videoDuration: null,
  fileUrl: "",
  allowDownload: false,
  quizId: null,
};

export function LessonForm({
  open,
  onOpenChange,
  mode,
  courseId,
  defaultValues,
  onSuccess,
}: LessonFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "document" | "image" | "quiz">(
    "video",
  );
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  const [availableQuizzes, setAvailableQuizzes] = useState<QuizOption[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/closes or defaultValues change
  useEffect(() => {
    if (open) {
      const vals = { ...emptyValues, ...defaultValues };
      setTitle(vals.title);
      setType(vals.type);
      setDescription(vals.description);
      setVideoUrl(vals.videoUrl);
      setVideoDuration(
        vals.videoDuration !== null && vals.videoDuration !== undefined
          ? String(vals.videoDuration)
          : "",
      );
      setFileUrl(vals.fileUrl);
      setAllowDownload(vals.allowDownload);
      setQuizId(vals.quizId ?? null);
      setError("");
    }
  }, [open, defaultValues]);

  // Fetch available quizzes when type is "quiz"
  useEffect(() => {
    if (open && type === "quiz") {
      setLoadingQuizzes(true);
      fetch(`/api/admin/courses/${courseId}/quizzes`)
        .then((res) => res.json())
        .then((data) => {
          if (data.quizzes && Array.isArray(data.quizzes)) {
            setAvailableQuizzes(
              data.quizzes.map((q: { id: string; title: string }) => ({
                id: q.id,
                title: q.title,
              })),
            );
          } else {
            setAvailableQuizzes([]);
          }
        })
        .catch(() => {
          setAvailableQuizzes([]);
        })
        .finally(() => {
          setLoadingQuizzes(false);
        });
    }
  }, [open, type, courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (title.length > 255) {
      setError("Title must be 255 characters or less.");
      return;
    }

    let parsedDuration: number | null = null;
    if (videoDuration.trim()) {
      parsedDuration = parseInt(videoDuration, 10);
      if (isNaN(parsedDuration) || parsedDuration < 0) {
        setError("Video duration must be a non-negative number (in seconds).");
        return;
      }
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type,
        description: description.trim() || null,
        videoUrl: type === "video" && videoUrl.trim() ? videoUrl.trim() : null,
        videoDuration: type === "video" ? parsedDuration : null,
        fileUrl:
          (type === "document" || type === "image") && fileUrl.trim()
            ? fileUrl.trim()
            : null,
        allowDownload:
          type === "document" || type === "image" ? allowDownload : false,
      };

      // Include quizId when type is quiz
      if (type === "quiz") {
        body.quizId = quizId || null;
      }

      const url =
        mode === "create"
          ? `/api/admin/courses/${courseId}/lessons`
          : `/api/admin/courses/${courseId}/lessons/${defaultValues?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Lesson" : "Edit Lesson"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details below to add a new lesson to this course."
              : "Update the lesson details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="text-destructive text-sm text-center rounded-md bg-destructive/10 p-3">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="lesson-title">Title</FieldLabel>
              <Input
                id="lesson-title"
                type="text"
                placeholder="e.g. Introduction to Variables"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="lesson-type">Type</FieldLabel>
              <Select
                value={type}
                onValueChange={(val) =>
                  setType(val as "video" | "document" | "image" | "quiz")
                }
              >
                <SelectTrigger id="lesson-type" className="w-full">
                  <SelectValue placeholder="Select lesson type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                The type determines how the lesson content is displayed to
                learners.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="lesson-description">Description</FieldLabel>
              <Textarea
                id="lesson-description"
                placeholder="Briefly describe what this lesson covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>

            {type === "video" && (
              <>
                <Field>
                  <FieldLabel htmlFor="lesson-video-url">Video URL</FieldLabel>
                  <Input
                    id="lesson-video-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or video file URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <FieldDescription>
                    A link to the video (YouTube, Vimeo, or direct file URL).
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="lesson-video-duration">
                    Duration (seconds)
                  </FieldLabel>
                  <Input
                    id="lesson-video-duration"
                    type="number"
                    min="0"
                    placeholder="e.g. 600 for 10 minutes"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                  />
                  <FieldDescription>
                    Optional. The length of the video in seconds.
                  </FieldDescription>
                </Field>
              </>
            )}

            {(type === "document" || type === "image") && (
              <>
                <Field>
                  <FieldLabel>
                    {type === "document" ? "Document File" : "Image File"}
                  </FieldLabel>
                  <FileUpload
                    imageOnly={type === "image"}
                    maxSizeMB={type === "image" ? 5 : 25}
                    folder={`lessons/${type}s`}
                    currentUrl={fileUrl || null}
                    onUpload={(url) => setFileUrl(url)}
                    onRemove={() => setFileUrl("")}
                    accept={
                      type === "document"
                        ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                        : "image/*"
                    }
                    description={
                      type === "document"
                        ? "Upload a PDF, Word, PowerPoint, Excel, or text file. Max 25MB."
                        : "Upload an image file (JPG, PNG, WebP, GIF, SVG). Max 5MB."
                    }
                    disabled={loading}
                  />
                </Field>

                <Field orientation="horizontal">
                  <label
                    htmlFor="lesson-allow-download"
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      id="lesson-allow-download"
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      className="size-4 rounded border"
                    />
                    <div>
                      <div className="text-sm font-medium">Allow Download</div>
                      <p className="text-muted-foreground text-sm">
                        Let learners download this {type} file.
                      </p>
                    </div>
                  </label>
                </Field>
              </>
            )}

            {type === "quiz" && (
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="lesson-quiz-select">
                    Link Quiz
                  </FieldLabel>
                  {loadingQuizzes ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <svg
                        className="animate-spin size-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading quizzes...
                    </div>
                  ) : availableQuizzes.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        No quizzes available for this course. Go to the
                        &ldquo;Quizzes&rdquo; tab to create one first, then come
                        back here to link it to this lesson.
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={quizId ?? "none"}
                      onValueChange={(val) =>
                        setQuizId(val === "none" ? null : val)
                      }
                    >
                      <SelectTrigger id="lesson-quiz-select" className="w-full">
                        <SelectValue placeholder="Select a quiz to link" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No quiz selected</SelectItem>
                        {availableQuizzes.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FieldDescription>
                    Select an existing quiz to display when learners open this
                    lesson. You can create and manage quizzes from the
                    &ldquo;Quizzes&rdquo; tab.
                  </FieldDescription>
                </Field>
              </div>
            )}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "create"
                  ? "Adding..."
                  : "Saving..."
                : mode === "create"
                  ? "Add Lesson"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
