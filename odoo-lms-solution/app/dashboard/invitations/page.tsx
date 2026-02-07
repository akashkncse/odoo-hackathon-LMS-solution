"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  UserCircle,
  Clock,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  status: "pending" | "accepted";
  createdAt: string;
  courseId: string;
  courseTitle: string;
  courseDescription: string | null;
  courseImageUrl: string | null;
  courseAccessRule: "open" | "invitation" | "payment";
  invitedByName: string;
  invitedByEmail: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/invitations");
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load invitations");
        return;
      }

      setInvitations(data.invitations);
    } catch {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  async function handleAccept(invitation: Invitation) {
    setAcceptingId(invitation.id);
    try {
      const res = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to accept invitation");
        return;
      }

      if (data.alreadyEnrolled) {
        toast.info("You are already enrolled in this course");
      } else {
        toast.success(`Enrolled in "${invitation.courseTitle}" successfully!`);
      }

      // Remove from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      // Navigate to the course after a brief delay
      setTimeout(() => {
        router.push(`/dashboard/courses/${invitation.courseId}`);
      }, 1000);
    } catch {
      toast.error("Failed to accept invitation");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setDecliningId(invitationId);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to decline invitation");
        return;
      }

      toast.success("Invitation declined");
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch {
      toast.error("Failed to decline invitation");
    } finally {
      setDecliningId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Course invitations from instructors
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Invitations</h1>
        <p className="text-muted-foreground mt-1">
          {invitations.length === 0
            ? "No pending invitations"
            : `You have ${invitations.length} pending invitation${invitations.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* Empty State */}
      {invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-5 mb-5">
              <Inbox className="size-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-2">All caught up!</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              You don&apos;t have any pending course invitations right now.
              When an instructor invites you to a course, it will appear here.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/courses")}
            >
              <BookOpen className="size-4" />
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card
              key={invitation.id}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Course Image */}
                {invitation.courseImageUrl ? (
                  <div className="sm:w-48 h-40 sm:h-auto shrink-0">
                    <img
                      src={invitation.courseImageUrl}
                      alt={invitation.courseTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="sm:w-48 h-40 sm:h-auto shrink-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <BookOpen className="size-12 text-primary/30" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 gap-1 shrink-0"
                        >
                          <Mail className="size-3" />
                          Invitation
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(invitation.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg truncate">
                        {invitation.courseTitle}
                      </h3>
                    </div>
                  </div>

                  {invitation.courseDescription && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {invitation.courseDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <UserCircle className="size-3.5" />
                    <span>
                      Invited by{" "}
                      <span className="font-medium text-foreground">
                        {invitation.invitedByName}
                      </span>
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <Clock className="size-3.5" />
                    <span>{formatDate(invitation.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleAccept(invitation)}
                      disabled={
                        acceptingId === invitation.id ||
                        decliningId === invitation.id
                      }
                      size="sm"
                    >
                      {acceptingId === invitation.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Accept & Enroll
                          <ArrowRight className="size-3.5" />
                        </>
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            acceptingId === invitation.id ||
                            decliningId === invitation.id
                          }
                          className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
                        >
                          {decliningId === invitation.id ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Declining...
                            </>
                          ) : (
                            <>
                              <XCircle className="size-4" />
                              Decline
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Decline Invitation
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to decline the invitation to{" "}
                            <strong>&quot;{invitation.courseTitle}&quot;</strong>?
                            You won&apos;t be able to enroll unless you receive a
                            new invitation.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDecline(invitation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Decline Invitation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
