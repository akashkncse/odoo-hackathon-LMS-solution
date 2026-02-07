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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserX,
  UserCheck,
  Mail,
  Calendar,
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "instructor" | "learner";
  avatarUrl: string | null;
  isActive: boolean;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  courseCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    icon: Shield,
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  instructor: {
    label: "Instructor",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  learner: {
    label: "Learner",
    icon: GraduationCap,
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

function RoleBadge({
  role,
}: {
  role: "superadmin" | "instructor" | "learner";
}) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <span className="size-1.5 rounded-full bg-gray-400" />
      Deactivated
    </span>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // Create instructor dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "instructor" as "instructor" | "learner",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "reactivate" | "role";
    user: UserRow;
    newRole?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (search) params.set("search", search);
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (activeFilter !== "all") params.set("active", activeFilter);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch users");
        }
        const data = await res.json();
        setUsersList(data.users);
        setPagination(data.pagination);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load users";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, activeFilter],
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create account");
        return;
      }

      toast.success(
        `${createForm.role === "instructor" ? "Instructor" : "Learner"} account created!`,
        {
          description: `${data.user.name} (${data.user.email}) can now log in.`,
        },
      );

      setCreateDialogOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "instructor" });
      setShowPassword(false);
      fetchUsers(pagination.page);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);

    try {
      const { type, user, newRole } = confirmAction;

      const body: Record<string, unknown> = {};
      if (type === "deactivate") body.isActive = false;
      if (type === "reactivate") body.isActive = true;
      if (type === "role" && newRole) body.role = newRole;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }

      if (type === "deactivate") {
        toast.success(`${user.name} has been deactivated`, {
          description: "They have been logged out and can no longer sign in.",
        });
      } else if (type === "reactivate") {
        toast.success(`${user.name} has been reactivated`, {
          description: "They can now log in again.",
        });
      } else if (type === "role") {
        const roleLabel =
          ROLE_CONFIG[newRole as keyof typeof ROLE_CONFIG]?.label ?? newRole;
        toast.success(`${user.name}'s role updated to ${roleLabel}`);
      }

      fetchUsers(pagination.page);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  function generatePassword() {
    const chars =
      "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pw = "";
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pw }));
    setShowPassword(true);
  }

  const confirmTitle = confirmAction
    ? confirmAction.type === "deactivate"
      ? `Deactivate ${confirmAction.user.name}?`
      : confirmAction.type === "reactivate"
        ? `Reactivate ${confirmAction.user.name}?`
        : `Change role for ${confirmAction.user.name}?`
    : "";

  const confirmDescription = confirmAction
    ? confirmAction.type === "deactivate"
      ? "This will immediately log them out and prevent them from signing in. You can reactivate them later."
      : confirmAction.type === "reactivate"
        ? "This will allow them to sign in again with their existing credentials."
        : `This will change their role from ${ROLE_CONFIG[confirmAction.user.role]?.label} to ${ROLE_CONFIG[confirmAction.newRole as keyof typeof ROLE_CONFIG]?.label}. Their permissions will change immediately.`
    : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and access.
            {!loading && (
              <span className="ml-1">
                {pagination.total} user{pagination.total !== 1 ? "s" : ""}{" "}
                total.
              </span>
            )}
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="size-4" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Create an instructor or learner account. They&apos;ll be able to
                log in immediately with the credentials you set.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="create-name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="create-name"
                    placeholder="Jane Smith"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    minLength={2}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="create-email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="jane@example.com"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="create-password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="create-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={createForm.password}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generatePassword}
                      className="whitespace-nowrap text-xs"
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share these credentials securely with the user.
                  </p>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value: "instructor" | "learner") =>
                      setCreateForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instructor">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-3.5 text-blue-600" />
                          Instructor
                        </div>
                      </SelectItem>
                      <SelectItem value="learner">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="size-3.5 text-green-600" />
                          Learner
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {createForm.role === "instructor"
                      ? "Instructors can create and manage courses, lessons, and quizzes."
                      : "Learners can browse, enroll in, and take courses."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setCreateForm({
                      name: "",
                      email: "",
                      password: "",
                      role: "instructor",
                    });
                    setShowPassword(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="gap-2"
                >
                  {createLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  {createLoading ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="learner">Learner</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
          <CardDescription>
            {loading
              ? "Loading users..."
              : `Showing ${usersList.length} of ${pagination.total} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : usersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">
                No users found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || roleFilter !== "all" || activeFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "No users have been created yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-0 divide-y">
              {usersList.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 ${
                    !user.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        user.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>

                    {/* User info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {user.name}
                        </span>
                        <RoleBadge role={user.role} />
                        <StatusBadge isActive={user.isActive} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="size-3 shrink-0" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="size-3" />
                          {formatDate(user.createdAt)}
                        </span>
                        {user.role === "learner" && (
                          <>
                            <span className="flex items-center gap-1 shrink-0">
                              <Trophy className="size-3" />
                              {user.totalPoints} pts
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <GraduationCap className="size-3" />
                              {user.enrollmentCount} enrolled
                            </span>
                          </>
                        )}
                        {(user.role === "instructor" ||
                          user.role === "superadmin") && (
                          <span className="flex items-center gap-1 shrink-0">
                            <BookOpen className="size-3" />
                            {user.courseCount} course
                            {user.courseCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                      {(["superadmin", "instructor", "learner"] as const).map(
                        (role) => {
                          const config = ROLE_CONFIG[role];
                          const Icon = config.icon;
                          const isCurrent = user.role === role;
                          return (
                            <DropdownMenuItem
                              key={role}
                              disabled={isCurrent}
                              onClick={() => {
                                if (!isCurrent) {
                                  setConfirmAction({
                                    type: "role",
                                    user,
                                    newRole: role,
                                  });
                                }
                              }}
                            >
                              <Icon className="size-4" />
                              <span>
                                {config.label}
                                {isCurrent ? " (current)" : ""}
                              </span>
                            </DropdownMenuItem>
                          );
                        },
                      )}
                      <DropdownMenuSeparator />
                      {user.isActive ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setConfirmAction({ type: "deactivate", user })
                          }
                        >
                          <UserX className="size-4" />
                          <span>Deactivate</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmAction({ type: "reactivate", user })
                          }
                        >
                          <UserCheck className="size-4" />
                          <span>Reactivate</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Alert Dialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              variant={
                confirmAction?.type === "deactivate" ? "destructive" : "default"
              }
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              {confirmAction?.type === "deactivate"
                ? "Deactivate"
                : confirmAction?.type === "reactivate"
                  ? "Reactivate"
                  : "Change Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
