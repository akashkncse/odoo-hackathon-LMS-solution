"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Tag } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
}

interface CourseFormValues {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  price: string;
  published: boolean;
  tags?: TagItem[];
}

interface CourseFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<CourseFormValues>;
}

export function CourseForm({ mode, defaultValues }: CourseFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(defaultValues?.imageUrl ?? "");
  const [visibility, setVisibility] = useState<"everyone" | "signed_in">(
    defaultValues?.visibility ?? "everyone",
  );
  const [accessRule, setAccessRule] = useState<
    "open" | "invitation" | "payment"
  >(defaultValues?.accessRule ?? "open");
  const [price, setPrice] = useState(defaultValues?.price ?? "");
  const [published, setPublished] = useState(defaultValues?.published ?? false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tag management state
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>(
    defaultValues?.tags ?? [],
  );
  const [tagInput, setTagInput] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Fetch available tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch("/api/admin/tags");
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags || []);
        }
      } catch {
        // Silently fail — tags are optional
      }
    }
    fetchTags();
  }, []);

  // Filter tags for dropdown
  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTags.some((s) => s.id === tag.id) &&
      (tagInput === "" ||
        tag.name.toLowerCase().includes(tagInput.toLowerCase())),
  );

  const exactMatch = availableTags.some(
    (tag) => tag.name.toLowerCase() === tagInput.trim().toLowerCase(),
  );
  const alreadySelected = selectedTags.some(
    (tag) => tag.name.toLowerCase() === tagInput.trim().toLowerCase(),
  );
  const canCreateNew =
    tagInput.trim().length > 0 && !exactMatch && !alreadySelected;

  function handleSelectTag(tag: TagItem) {
    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
    setShowTagDropdown(false);
  }

  function handleRemoveTag(tagId: string) {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  }

  async function handleCreateTag() {
    const name = tagInput.trim();
    if (!name) return;

    setCreatingTag(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok && data.tag) {
        // Add to available tags if it's new
        setAvailableTags((prev) => {
          if (prev.some((t) => t.id === data.tag.id)) return prev;
          return [...prev, data.tag].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
        });
        // Select it
        setSelectedTags((prev) => {
          if (prev.some((t) => t.id === data.tag.id)) return prev;
          return [...prev, data.tag];
        });
        setTagInput("");
        setShowTagDropdown(false);
        toast.success(`Tag "${data.tag.name}" created`);
      } else {
        toast.error(data.error || "Failed to create tag");
      }
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  }

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

    if (accessRule === "payment" && price) {
      const parsed = parseFloat(price);
      if (isNaN(parsed) || parsed < 0) {
        setError("Price must be a non-negative number.");
        return;
      }
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
        visibility,
        accessRule,
        price: accessRule === "payment" && price ? price : null,
        published,
        tagIds: selectedTags.map((t) => t.id),
      };

      const url =
        mode === "create"
          ? "/api/admin/courses"
          : `/api/admin/courses/${defaultValues?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        toast.error(data.error || "Failed to save course.");
        return;
      }

      toast.success(
        mode === "create" ? "Course created! 🎉" : "Course updated!",
        {
          description: title.trim(),
        },
      );
      router.push("/admin/courses");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!defaultValues?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this course? This will also delete all lessons, quizzes, enrollments, and reviews associated with it.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/courses/${defaultValues.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        toast.error(data.error || "Failed to delete course.");
        return;
      }

      toast.success("Course deleted.", {
        description: defaultValues?.title || "The course has been removed.",
      });
      router.push("/admin/courses");
      router.refresh();
    } catch {
      setError("Failed to delete course. Try again.");
      toast.error("Failed to delete course. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create New Course" : "Edit Course"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Fill in the details below to create a new course."
            : "Update the course details below."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            {error && (
              <div className="text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                type="text"
                placeholder="e.g. Introduction to Web Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <FieldDescription>
                The name of your course. This will be visible to learners.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                placeholder="Describe what learners will gain from this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="imageUrl">Image URL</FieldLabel>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/course-image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <FieldDescription>
                A cover image for the course. Paste a URL to an image.
              </FieldDescription>
            </Field>

            {/* Tags */}
            <Field>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Tag className="size-3.5" />
                  Tags
                </span>
              </FieldLabel>

              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="size-3" />
                        <span className="sr-only">Remove {tag.name}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tag input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder={
                    selectedTags.length > 0
                      ? "Add more tags..."
                      : "Search or create tags..."
                  }
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagDropdown(true);
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setShowTagDropdown(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreateNew) {
                      e.preventDefault();
                      handleCreateTag();
                    } else if (e.key === "Enter" && filteredTags.length === 1) {
                      e.preventDefault();
                      handleSelectTag(filteredTags[0]);
                    } else if (
                      e.key === "Backspace" &&
                      tagInput === "" &&
                      selectedTags.length > 0
                    ) {
                      handleRemoveTag(selectedTags[selectedTags.length - 1].id);
                    }
                  }}
                />

                {/* Dropdown */}
                {showTagDropdown &&
                  (filteredTags.length > 0 || canCreateNew) && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md max-h-48 overflow-y-auto">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-default"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectTag(tag);
                          }}
                        >
                          <Tag className="size-3 text-muted-foreground" />
                          {tag.name}
                        </button>
                      ))}
                      {canCreateNew && (
                        <>
                          {filteredTags.length > 0 && (
                            <div className="my-1 h-px bg-border -mx-1" />
                          )}
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-default text-primary"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleCreateTag();
                            }}
                            disabled={creatingTag}
                          >
                            {creatingTag ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Plus className="size-3" />
                            )}
                            Create &quot;{tagInput.trim()}&quot;
                          </button>
                        </>
                      )}
                    </div>
                  )}
              </div>

              <FieldDescription>
                Add tags to help learners find this course. Type to search
                existing tags or create new ones.
              </FieldDescription>
            </Field>

            <div className="grid gap-7 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
                <select
                  id="visibility"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "everyone" | "signed_in")
                  }
                  className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                >
                  <option value="everyone">Everyone</option>
                  <option value="signed_in">Signed In Users Only</option>
                </select>
                <FieldDescription>
                  Who can see this course in the catalog.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="accessRule">Access Rule</FieldLabel>
                <select
                  id="accessRule"
                  value={accessRule}
                  onChange={(e) =>
                    setAccessRule(
                      e.target.value as "open" | "invitation" | "payment",
                    )
                  }
                  className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                >
                  <option value="open">Open</option>
                  <option value="invitation">Invitation Only</option>
                  <option value="payment">Payment Required</option>
                </select>
                <FieldDescription>
                  How learners can enroll in this course.
                </FieldDescription>
              </Field>
            </div>

            {accessRule === "payment" && (
              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="29.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <FieldDescription>
                  Set the price for this course. Leave empty for free.
                </FieldDescription>
              </Field>
            )}

            <Field orientation="horizontal">
              <label
                htmlFor="published"
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  id="published"
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4 rounded border"
                />
                <div>
                  <div className="text-sm font-medium">Published</div>
                  <p className="text-muted-foreground text-sm">
                    When published, this course will be visible to learners
                    based on the visibility setting.
                  </p>
                </div>
              </label>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-between gap-4 p-4">
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || deleting}>
              {loading
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Course"
                  : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/courses")}
              disabled={loading || deleting}
            >
              Cancel
            </Button>
          </div>
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || deleting}
            >
              {deleting ? "Deleting..." : "Delete Course"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
