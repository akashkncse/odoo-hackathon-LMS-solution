"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Trophy,
  Star,
  Shield,
  Crown,
  Gem,
  Medal,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

interface BadgeLevel {
  id: string;
  name: string;
  minPoints: number;
  sortOrder: number;
}

function getBadgeIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("diamond") || lower.includes("gem"))
    return <Gem className="size-5" />;
  if (lower.includes("crown") || lower.includes("king") || lower.includes("master"))
    return <Crown className="size-5" />;
  if (lower.includes("gold") || lower.includes("champion"))
    return <Trophy className="size-5" />;
  if (lower.includes("silver") || lower.includes("expert"))
    return <Shield className="size-5" />;
  if (lower.includes("star") || lower.includes("rising"))
    return <Star className="size-5" />;
  if (lower.includes("medal") || lower.includes("bronze"))
    return <Medal className="size-5" />;
  return <Award className="size-5" />;
}

function getBadgeColor(index: number, total: number) {
  if (total <= 1) return "from-amber-400 to-amber-600 text-white";
  const ratio = index / (total - 1);
  if (ratio >= 0.8) return "from-violet-500 to-purple-700 text-white";
  if (ratio >= 0.6) return "from-amber-400 to-amber-600 text-white";
  if (ratio >= 0.4) return "from-slate-300 to-slate-500 text-white";
  if (ratio >= 0.2) return "from-orange-400 to-orange-600 text-white";
  return "from-green-400 to-green-600 text-white";
}

export default function BadgeLevelsPage() {
  const [badges, setBadges] = useState<BadgeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeLevel | null>(null);
  const [formName, setFormName] = useState("");
  const [formMinPoints, setFormMinPoints] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/badge-levels");
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load badge levels");
        return;
      }

      setBadges(data.badges);
    } catch {
      toast.error("Failed to load badge levels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  function openCreateDialog() {
    setEditingBadge(null);
    setFormName("");
    setFormMinPoints("");
    setFormSortOrder(String(badges.length + 1));
    setDialogOpen(true);
  }

  function openEditDialog(badge: BadgeLevel) {
    setEditingBadge(badge);
    setFormName(badge.name);
    setFormMinPoints(String(badge.minPoints));
    setFormSortOrder(String(badge.sortOrder));
    setDialogOpen(true);
  }

  async function handleSave() {
    const name = formName.trim();
    if (!name) {
      toast.error("Badge name is required");
      return;
    }

    const minPoints = parseInt(formMinPoints, 10);
    if (isNaN(minPoints) || minPoints < 0) {
      toast.error("Minimum points must be a non-negative number");
      return;
    }

    const sortOrder = parseInt(formSortOrder, 10);
    if (isNaN(sortOrder)) {
      toast.error("Sort order must be a number");
      return;
    }

    setSaving(true);

    try {
      if (editingBadge) {
        // Update
        const res = await fetch(`/api/admin/badge-levels/${editingBadge.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, minPoints, sortOrder }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to update badge level");
          return;
        }

        toast.success(`"${name}" updated successfully`);
      } else {
        // Create
        const res = await fetch("/api/admin/badge-levels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, minPoints, sortOrder }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to create badge level");
          return;
        }

        toast.success(`"${name}" created successfully`);
      }

      setDialogOpen(false);
      fetchBadges();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(badge: BadgeLevel) {
    setDeletingId(badge.id);
    try {
      const res = await fetch(`/api/admin/badge-levels/${badge.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete badge level");
        return;
      }

      toast.success(`"${badge.name}" deleted`);
      setBadges((prev) => prev.filter((b) => b.id !== badge.id));
    } catch {
      toast.error("Failed to delete badge level");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Badge Levels</h1>
          <p className="text-muted-foreground mt-1">
            Manage gamification badge levels and point thresholds.
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Badge Levels</h1>
          <p className="text-muted-foreground mt-1">
            Define badge tiers that learners earn as they accumulate points.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Add Badge Level
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Award className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{badges.length}</p>
              <p className="text-xs text-muted-foreground">Total Badges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <Trophy className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {badges.length > 0 ? badges[0].minPoints : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Lowest Threshold
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <Crown className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {badges.length > 0 ? badges[badges.length - 1].minPoints : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Highest Threshold
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge List */}
      {badges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-5 mb-5">
              <Award className="size-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-2">No badge levels yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Create badge levels to gamify the learning experience. Learners
              will earn badges as they accumulate points from quizzes and course
              completions.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Your First Badge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpDown className="size-5" />
              Badge Tiers
            </CardTitle>
            <CardDescription>
              Badges are displayed in sort order. Learners earn the highest badge
              their points qualify for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {badges.map((badge, index) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  {/* Badge icon */}
                  <div
                    className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${getBadgeColor(index, badges.length)} shadow-sm shrink-0`}
                  >
                    {getBadgeIcon(badge.name)}
                  </div>

                  {/* Badge info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base truncate">
                        {badge.name}
                      </h3>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        #{badge.sortOrder}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Requires{" "}
                      <span className="font-semibold text-foreground">
                        {badge.minPoints.toLocaleString()}
                      </span>{" "}
                      {badge.minPoints === 1 ? "point" : "points"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEditDialog(badge)}
                    >
                      <Pencil className="size-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingId === badge.id}
                        >
                          {deletingId === badge.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Badge Level</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the{" "}
                            <strong>&quot;{badge.name}&quot;</strong> badge? This
                            won&apos;t affect users&apos; points, but the badge
                            will no longer be displayed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(badge)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {badges.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>
              How badges appear to learners on the Points &amp; Leaderboard
              pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge, index) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2.5 rounded-full border bg-background px-4 py-2 shadow-sm"
                >
                  <div
                    className={`flex items-center justify-center size-7 rounded-full bg-gradient-to-br ${getBadgeColor(index, badges.length)} shadow-sm`}
                  >
                    {getBadgeIcon(badge.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {badge.minPoints.toLocaleString()} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBadge ? "Edit Badge Level" : "Create Badge Level"}
            </DialogTitle>
            <DialogDescription>
              {editingBadge
                ? "Update the badge name, point threshold, or sort order."
                : "Define a new badge tier for learners to earn."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="badge-name">Badge Name</Label>
              <Input
                id="badge-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Gold Champion"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name like &quot;Bronze Starter&quot;,
                &quot;Silver Expert&quot;, or &quot;Diamond Master&quot;.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge-points">Minimum Points</Label>
              <Input
                id="badge-points"
                type="number"
                min={0}
                value={formMinPoints}
                onChange={(e) => setFormMinPoints(e.target.value)}
                placeholder="e.g., 100"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                The minimum points a learner needs to earn this badge.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge-order">Sort Order</Label>
              <Input
                id="badge-order"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                placeholder="e.g., 1"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Controls the display order. Lower numbers appear first.
              </p>
            </div>

            {/* Live preview */}
            {formName.trim() && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Preview
                  </Label>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
                      {getBadgeIcon(formName)}
                    </div>
                    <div>
                      <p className="font-semibold">{formName.trim()}</p>
                      <p className="text-xs text-muted-foreground">
                        {formMinPoints
                          ? `${parseInt(formMinPoints, 10).toLocaleString()} points`
                          : "0 points"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {editingBadge ? "Updating..." : "Creating..."}
                </>
              ) : editingBadge ? (
                "Update Badge"
              ) : (
                "Create Badge"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
