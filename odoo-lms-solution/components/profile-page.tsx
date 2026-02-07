"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Trophy,
  Shield,
  BookOpen,
  GraduationCap,
  Loader2,
  Camera,
  Pencil,
  Check,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "instructor" | "learner";
  avatarUrl: string | null;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
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

function formatMemberSince(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Edit avatar state
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarValue, setAvatarValue] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me/profile");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load profile");
          return;
        }
        const data = await res.json();
        setProfile(data.user);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setSavingName(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update name");
        return;
      }

      setProfile(data.user);
      setEditingName(false);
      toast.success("Name updated successfully");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveAvatar(url?: string) {
    const urlToSave = url !== undefined ? url : avatarValue.trim();
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: urlToSave || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update avatar");
        return;
      }

      setProfile(data.user);
      setEditingAvatar(false);
      toast.success(
        urlToSave ? "Avatar updated successfully" : "Avatar removed",
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User className="size-12 text-muted-foreground/40 mb-4" />
        <p className="text-destructive text-lg">
          {error || "Failed to load profile"}
        </p>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[profile.role];
  const RoleIcon = roleConfig.icon;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and personal information.
        </p>
      </div>

      {/* ── Profile Card ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              {profile.avatarUrl ? (
                <div className="size-24 rounded-full overflow-hidden ring-4 ring-background shadow-lg">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="size-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold ring-4 ring-background shadow-lg">
                  {getInitials(profile.name)}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setAvatarValue(profile.avatarUrl ?? "");
                  setEditingAvatar(true);
                }}
                className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="size-3.5" />
                <span className="sr-only">Change avatar</span>
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              {/* Name */}
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="max-w-xs h-9 text-lg font-semibold"
                      placeholder="Your name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      disabled={savingName}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="size-8 p-0"
                    >
                      {savingName ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingName(false)}
                      disabled={savingName}
                      className="size-8 p-0"
                    >
                      <X className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{profile.name}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setNameValue(profile.name);
                        setEditingName(true);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit name</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Role badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleConfig.color}`}
              >
                <RoleIcon className="size-3" />
                {roleConfig.label}
              </span>

              {/* Details */}
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="size-3.5 shrink-0" />
                  Member since {formatMemberSince(profile.createdAt)}
                </span>
                {profile.role === "learner" && (
                  <span className="flex items-center gap-2">
                    <Trophy className="size-3.5 shrink-0 text-amber-500" />
                    <span className="text-foreground font-medium">
                      {profile.totalPoints}
                    </span>{" "}
                    points earned
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Avatar ───────────────────────────────────────────── */}
      {editingAvatar && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="size-4" />
              Change Avatar
            </CardTitle>
            <CardDescription>
              Upload an image to use as your avatar, or remove your current one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              imageOnly
              maxSizeMB={5}
              folder="avatars"
              currentUrl={avatarValue || null}
              onUpload={(url) => {
                setAvatarValue(url);
                handleSaveAvatar(url);
              }}
              onRemove={() => {
                setAvatarValue("");
                handleSaveAvatar("");
              }}
              description="JPG, PNG, WebP, or GIF. Max 5MB. Square images work best."
              disabled={savingAvatar}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingAvatar(false)}
              disabled={savingAvatar}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── Change Password ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="size-4" />
                Password
              </CardTitle>
              <CardDescription className="mt-1">
                Change your password to keep your account secure.
              </CardDescription>
            </div>
            {!showPasswordForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(true)}
                className="gap-2"
              >
                <KeyRound className="size-3.5" />
                Change
              </Button>
            )}
          </div>
        </CardHeader>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label
                  htmlFor="current-password"
                  className="text-sm font-medium"
                >
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="pr-10"
                    disabled={savingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Separator />

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="pr-10"
                    disabled={savingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium"
                >
                  Confirm New Password
                </label>
                <Input
                  id="confirm-password"
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  disabled={savingPassword}
                />
                {confirmPassword &&
                  newPassword &&
                  confirmPassword !== newPassword && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
                {confirmPassword &&
                  newPassword &&
                  confirmPassword === newPassword &&
                  newPassword.length >= 6 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="size-3" />
                      Passwords match
                    </p>
                  )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                }}
                disabled={savingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  savingPassword ||
                  !currentPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="gap-2"
              >
                {savingPassword ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                {savingPassword ? "Changing..." : "Change Password"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

      {/* ── Account Info ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Account Information
          </CardTitle>
          <CardDescription>
            Details about your account. Email and role cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </p>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </p>
              <p className="text-sm">
                <Badge variant="outline" className="gap-1 font-normal">
                  <RoleIcon className="size-3" />
                  {roleConfig.label}
                </Badge>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Member Since
              </p>
              <p className="text-sm font-medium">
                {formatFullDate(profile.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Updated
              </p>
              <p className="text-sm font-medium">
                {formatFullDate(profile.updatedAt)}
              </p>
            </div>
            {profile.role === "learner" && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Points
                </p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Trophy className="size-3.5 text-amber-500" />
                  {profile.totalPoints} points
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
