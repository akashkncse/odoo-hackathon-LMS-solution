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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Users,
  Send,
  X,
  AlertCircle,
  UserCheck,
  UserX,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  status: "pending" | "accepted";
  createdAt: string;
  invitedByName: string;
  invitedByEmail: string;
}

interface InviteResult {
  email: string;
  status: "invited" | "already_invited" | "already_enrolled" | "not_registered";
}

interface InvitationsManagerProps {
  courseId: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvitationsManager({ courseId }: InvitationsManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/invitations`);
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
  }, [courseId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addEmail();
    }
    if (e.key === "Backspace" && emailInput === "" && emailTags.length > 0) {
      setEmailTags((prev) => prev.slice(0, -1));
    }
  }

  function addEmail() {
    const email = emailInput.trim().toLowerCase().replace(/,$/g, "");
    if (!email) return;

    if (!email.includes("@") || !email.includes(".")) {
      toast.error(`"${email}" is not a valid email address`);
      return;
    }

    if (emailTags.includes(email)) {
      toast.error(`"${email}" is already in the list`);
      setEmailInput("");
      return;
    }

    setEmailTags((prev) => [...prev, email]);
    setEmailInput("");
  }

  function removeEmailTag(email: string) {
    setEmailTags((prev) => prev.filter((e) => e !== email));
  }

  async function handleSendInvitations() {
    // Also add anything currently typed
    const finalEmails = [...emailTags];
    const currentInput = emailInput.trim().toLowerCase();
    if (currentInput && currentInput.includes("@") && !finalEmails.includes(currentInput)) {
      finalEmails.push(currentInput);
    }

    if (finalEmails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    setSending(true);
    setResults(null);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: finalEmails }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send invitations");
        return;
      }

      setResults(data.results);

      if (data.invitedCount > 0) {
        toast.success(`${data.invitedCount} invitation(s) sent successfully`);
      } else {
        toast.info("No new invitations were sent");
      }

      setEmailTags([]);
      setEmailInput("");
      fetchInvitations();
    } catch {
      toast.error("Failed to send invitations");
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    setRevokingId(invitationId);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/invitations/${invitationId}`,
        { method: "DELETE" },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to revoke invitation");
        return;
      }

      toast.success("Invitation revoked");
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch {
      toast.error("Failed to revoke invitation");
    } finally {
      setRevokingId(null);
    }
  }

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter(
    (i) => i.status === "accepted",
  ).length;

  function resultIcon(status: InviteResult["status"]) {
    switch (status) {
      case "invited":
        return <CheckCircle2 className="size-4 text-green-600" />;
      case "already_invited":
        return <Info className="size-4 text-yellow-600" />;
      case "already_enrolled":
        return <UserCheck className="size-4 text-blue-600" />;
      case "not_registered":
        return <UserX className="size-4 text-red-600" />;
    }
  }

  function resultLabel(status: InviteResult["status"]) {
    switch (status) {
      case "invited":
        return "Invitation sent";
      case "already_invited":
        return "Already invited (pending)";
      case "already_enrolled":
        return "Already enrolled";
      case "not_registered":
        return "Not a registered user";
    }
  }

  function resultBadgeVariant(status: InviteResult["status"]) {
    switch (status) {
      case "invited":
        return "default" as const;
      case "already_invited":
        return "secondary" as const;
      case "already_enrolled":
        return "outline" as const;
      case "not_registered":
        return "destructive" as const;
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{invitations.length}</p>
              <p className="text-xs text-muted-foreground">Total Invitations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-yellow-500/10 p-2.5">
              <Clock className="size-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{acceptedCount}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Invitations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="size-5" />
            Send Invitations
          </CardTitle>
          <CardDescription>
            Invite registered users by email. They&apos;ll see the invitation in
            their dashboard and can accept or decline it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email tag input */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {emailTags.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="gap-1 pl-2 pr-1 py-1"
                >
                  <Mail className="size-3" />
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmailTag(email)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                onBlur={addEmail}
                placeholder={
                  emailTags.length === 0
                    ? "Type email addresses and press Enter..."
                    : "Add more..."
                }
                className="flex-1 min-w-[200px] border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                disabled={sending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">Enter</kbd>,{" "}
              <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">,</kbd> or{" "}
              <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono">Tab</kbd> to add
              each email. Only registered users can be invited.
            </p>
          </div>

          <Button
            onClick={handleSendInvitations}
            disabled={sending || (emailTags.length === 0 && !emailInput.trim())}
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Send Invitation{emailTags.length > 1 ? "s" : ""}
              </>
            )}
          </Button>

          {/* Results after sending */}
          {results && results.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="size-4" />
                Invitation Results
              </h4>
              <div className="space-y-1.5">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {resultIcon(result.status)}
                      <span className="truncate font-mono text-xs">
                        {result.email}
                      </span>
                    </div>
                    <Badge variant={resultBadgeVariant(result.status)} className="shrink-0 text-xs">
                      {resultLabel(result.status)}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResults(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-5" />
            Sent Invitations
          </CardTitle>
          <CardDescription>
            {invitations.length === 0
              ? "No invitations sent yet."
              : `${invitations.length} invitation(s) sent for this course.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Mail className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No invitations yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Use the form above to invite registered users to this course.
                They&apos;ll receive the invitation in their dashboard.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv, idx) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm">
                            {inv.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {inv.status === "pending" ? (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1"
                          >
                            <Clock className="size-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1"
                          >
                            <CheckCircle2 className="size-3" />
                            Accepted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {inv.invitedByName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(inv.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status === "pending" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={revokingId === inv.id}
                              >
                                {revokingId === inv.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke Invitation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke the invitation
                                  for <strong>{inv.email}</strong>? They will no
                                  longer be able to accept it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevoke(inv.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
