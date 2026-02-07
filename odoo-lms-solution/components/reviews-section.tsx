"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { StarRating, RatingDistribution } from "@/components/star-rating";
import {
  MessageSquare,
  Pencil,
  Trash2,
  Send,
  X,
  ChevronDown,
  Loader2,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  userId: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  userName: string;
  userAvatarUrl: string | null;
}

interface UserReview {
  id: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewsSectionProps {
  courseId: string;
  isEnrolled: boolean;
  isLoggedIn: boolean;
}

export default function ReviewsSection({
  courseId,
  isEnrolled,
  isLoggedIn,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [userReview, setUserReview] = useState<UserReview | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchReviews = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "10");

        const res = await fetch(
          `/api/courses/${courseId}/reviews?${params.toString()}`,
        );
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load reviews:", data.error);
          return;
        }

        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews || []);
        }

        setStats(
          data.stats || {
            averageRating: 0,
            totalReviews: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        );
        setUserReview(data.userReview || null);
        setPagination(
          data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        );
      } catch {
        console.error("Failed to fetch reviews");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [courseId],
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  function openWriteForm() {
    if (userReview) {
      // Edit mode — populate form with existing review
      setFormRating(userReview.rating);
      setFormText(userReview.reviewText || "");
      setIsEditing(true);
    } else {
      setFormRating(0);
      setFormText("");
      setIsEditing(false);
    }
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setFormRating(0);
    setFormText("");
    setIsEditing(false);
  }

  async function handleSubmit() {
    if (formRating < 1 || formRating > 5) {
      toast.error("Please select a rating (1-5 stars).");
      return;
    }

    if (formText.trim().length > 2000) {
      toast.error("Review text must be 2000 characters or less.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          reviewText: formText.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit review.");
        return;
      }

      toast.success(
        data.updated ? "Review updated! ✏️" : "Review submitted! ⭐",
        {
          description: data.updated
            ? "Your review has been updated."
            : "Thank you for your feedback!",
        },
      );

      setShowForm(false);
      setFormRating(0);
      setFormText("");
      setIsEditing(false);

      // Refresh reviews
      fetchReviews(1);
    } catch {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!userReview) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete review.");
        return;
      }

      toast.success("Review deleted.", {
        description: "Your review has been removed.",
      });

      setUserReview(null);
      setShowForm(false);

      // Refresh reviews
      fetchReviews(1);
    } catch {
      toast.error("Failed to delete review. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function handleLoadMore() {
    if (pagination.page < pagination.totalPages) {
      fetchReviews(pagination.page + 1, true);
    }
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground text-sm">
            Loading reviews...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              Reviews & Ratings
            </CardTitle>
            <CardDescription>
              {stats.totalReviews > 0
                ? `${stats.totalReviews} review${stats.totalReviews !== 1 ? "s" : ""}`
                : "No reviews yet"}
            </CardDescription>
          </div>

          {/* Write / Edit Review button */}
          {isEnrolled && !showForm && (
            <Button
              variant={userReview ? "outline" : "default"}
              size="sm"
              onClick={openWriteForm}
              className="gap-1.5"
            >
              {userReview ? (
                <>
                  <Pencil className="size-3.5" />
                  Edit Review
                </>
              ) : (
                <>
                  <Star className="size-3.5" />
                  Write a Review
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Stats summary ─────────────────────────────────────────── */}
        {stats.totalReviews > 0 && (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Average rating */}
            <div className="flex flex-col items-center justify-center shrink-0 sm:min-w-[140px]">
              <span className="text-4xl font-bold tracking-tight">
                {stats.averageRating.toFixed(1)}
              </span>
              <StarRating
                rating={stats.averageRating}
                size="md"
                className="mt-1"
              />
              <span className="text-xs text-muted-foreground mt-1">
                {stats.totalReviews} review
                {stats.totalReviews !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 min-w-0">
              <RatingDistribution
                distribution={stats.distribution}
                totalReviews={stats.totalReviews}
              />
            </div>
          </div>
        )}

        {/* ── Write / Edit Review Form ──────────────────────────────── */}
        {showForm && (
          <>
            {stats.totalReviews > 0 && <Separator />}
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  {isEditing ? "Edit Your Review" : "Write a Review"}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={cancelForm}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Star selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Your Rating
                </label>
                <StarRating
                  rating={formRating}
                  size="lg"
                  interactive
                  onRate={setFormRating}
                />
              </div>

              {/* Review text */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Your Review{" "}
                  <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Textarea
                  placeholder="Share your experience with this course..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <span
                    className={`text-xs ${formText.length > 1900 ? "text-amber-500" : "text-muted-foreground/60"}`}
                  >
                    {formText.length}/2000
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  {isEditing && userReview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting || submitting}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      {deleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      Delete Review
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelForm}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting || formRating === 0}
                    className="gap-1.5"
                  >
                    {submitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    {isEditing ? "Update Review" : "Submit Review"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CTA for non-enrolled users ────────────────────────────── */}
        {!isEnrolled && isLoggedIn && stats.totalReviews > 0 && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground text-center py-2">
              Enroll in this course to leave a review.
            </p>
          </>
        )}

        {/* ── Reviews list ──────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              {reviews.map((review) => {
                const isOwnReview =
                  userReview && review.id === userReview.id;

                return (
                  <div
                    key={review.id}
                    className={`flex gap-3 rounded-lg p-3 transition-colors ${
                      isOwnReview
                        ? "bg-primary/5 ring-1 ring-primary/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {review.userAvatarUrl ? (
                        <img
                          src={review.userAvatarUrl}
                          alt={review.userName}
                          className="size-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {getInitials(review.userName)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {review.userName}
                          </span>
                          {isOwnReview && (
                            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5 font-medium shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <StarRating rating={review.rating} size="sm" />

                      {review.reviewText && (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-1.5">
                          {review.reviewText}
                        </p>
                      )}

                      {/* Edit/Delete for own review (inline) */}
                      {isOwnReview && !showForm && (
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={openWriteForm}
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-7 text-xs gap-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          >
                            {deleting ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Trash2 className="size-3" />
                            )}
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {stats.totalReviews === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No reviews yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
              {isEnrolled
                ? "Be the first to review this course and help others decide!"
                : "Enroll in this course to be the first to leave a review."}
            </p>
            {isEnrolled && !showForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={openWriteForm}
                className="mt-4 gap-1.5"
              >
                <Star className="size-3.5" />
                Write the First Review
              </Button>
            )}
          </div>
        )}

        {/* ── Load more ─────────────────────────────────────────────── */}
        {pagination.page < pagination.totalPages && (
          <>
            <Separator />
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-1.5 text-muted-foreground"
              >
                {loadingMore ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
                Load More Reviews
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
