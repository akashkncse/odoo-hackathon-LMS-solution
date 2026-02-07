"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  BookOpen,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";

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
  viewsCount: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  tags: CourseTag[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BrowseCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allTags, setAllTags] = useState<CourseTag[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");

  const fetchCourses = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "12");
        params.set("sort", sort);
        if (search.trim()) params.set("search", search.trim());
        if (selectedTagId) params.set("tag", selectedTagId);

        const res = await fetch(`/api/courses?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load courses.");
          return;
        }

        setCourses(data.courses || []);
        setAllTags(data.tags || []);
        setPagination(
          data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 },
        );
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [search, selectedTagId, sort],
  );

  // Debounced fetch on filter changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCourses(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCourses]);

  function handleTagClick(tagId: string) {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  }

  function clearFilters() {
    setSearch("");
    setSelectedTagId(null);
    setSort("newest");
  }

  const hasActiveFilters =
    search.trim() !== "" || selectedTagId !== null || sort !== "newest";

  const selectedTagName = selectedTagId
    ? allTags.find((t) => t.id === selectedTagId)?.name
    : null;

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Courses</h1>
        <p className="text-muted-foreground mt-1">
          Explore our catalog and find courses that interest you.
        </p>
      </div>

      {/* ── Horizontal Filter Bar ───────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Row 1: Search + Sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ArrowUpDown className="size-3.5" />
                <span className="text-xs font-medium hidden sm:inline">
                  Sort
                </span>
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Row 2: Tag Pills (horizontal scrollable) */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <Tag className="size-3.5" />
                <span className="text-xs font-medium hidden sm:inline">
                  Tags
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {allTags.map((tag) => {
                  const isActive = selectedTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagClick(tag.id)}
                      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-all shrink-0 ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag.name}
                      {isActive && <X className="size-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active filter summary */}
          {hasActiveFilters && !loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              <span>
                {pagination.total} result{pagination.total !== 1 ? "s" : ""}
                {search.trim() && (
                  <span>
                    {" "}
                    for &quot;
                    <span className="font-medium text-foreground">
                      {search.trim()}
                    </span>
                    &quot;
                  </span>
                )}
                {selectedTagName && (
                  <span>
                    {" "}
                    in{" "}
                    <Badge variant="secondary" className="text-xs ml-0.5">
                      {selectedTagName}
                    </Badge>
                  </span>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Course Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading courses...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchCourses(1)}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              No courses found
            </p>
            <p className="text-muted-foreground mt-1 text-sm max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "No courses are available yet. Check back later!"}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4 gap-2"
              >
                <X className="size-4" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
              >
                {/* Image */}
                {course.imageUrl ? (
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${accessRuleStyle(course.accessRule)}`}
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

                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-lg leading-snug">
                    {course.title}
                  </CardTitle>
                  {course.description && (
                    <CardDescription className="line-clamp-2 mt-1">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  {/* Tags on card */}
                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-normal"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {course.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                        >
                          +{course.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Rating */}
                  {course.totalReviews > 0 && (
                    <div className="flex items-center gap-1.5">
                      <StarRating
                        rating={course.averageRating}
                        size="sm"
                        showValue
                      />
                      <span className="text-xs text-muted-foreground">
                        ({course.totalReviews})
                      </span>
                    </div>
                  )}

                  {/* Stats row */}
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

                <CardFooter className="pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/courses/${course.id}`}>
                      View Course
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} &middot;{" "}
                {pagination.total} course{pagination.total !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchCourses(pagination.page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => fetchCourses(pagination.page + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
