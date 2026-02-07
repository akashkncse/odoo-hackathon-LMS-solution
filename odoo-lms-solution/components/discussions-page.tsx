"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Send,
  Trash2,
  Clock,
  MessageCircle,
  Shield,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ThreadListItem {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  replyCount: number;
  lastReplyAt: string | null;
}

interface Reply {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  authorAvatarUrl: string | null;
}

interface ThreadDetail {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  authorAvatarUrl: string | null;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function RoleBadge({ role }: { role: string }) {
  if (role === "superadmin") {
    return (
      <Badge className="ml-1.5 gap-1 bg-red-600 text-white hover:bg-red-700 text-[10px] px-1.5 py-0">
        <Shield className="size-2.5" />
        Admin
      </Badge>
    );
  }
  if (role === "instructor") {
    return (
      <Badge className="ml-1.5 gap-1 bg-blue-600 text-white hover:bg-blue-700 text-[10px] px-1.5 py-0">
        <GraduationCap className="size-2.5" />
        Instructor
      </Badge>
    );
  }
  return null;
}

// ── New Thread Dialog ──────────────────────────────────────────────────────────

function NewThreadDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create thread");
        return;
      }
      toast.success("Thread created!");
      setTitle("");
      setBody("");
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Failed to create thread");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Thread
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a New Discussion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="thread-title">
              Title
            </label>
            <Input
              id="thread-title"
              placeholder="What do you want to discuss?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              disabled={creating}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="thread-body">
              Body
            </label>
            <Textarea
              id="thread-body"
              placeholder="Share your thoughts, questions, or ideas..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              disabled={creating}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={creating}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !body.trim()}
          >
            {creating ? "Creating..." : "Create Thread"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Thread Card ────────────────────────────────────────────────────────────────

function ThreadCard({
  thread,
  isAdmin,
  currentUser,
  onOpen,
  onRefresh,
}: {
  thread: ThreadListItem;
  isAdmin: boolean;
  currentUser: CurrentUser;
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleToggleArchive() {
    setActionLoading("archive");
    try {
      const res = await fetch(`/api/discussions/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !thread.isArchived }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update thread");
        return;
      }
      toast.success(thread.isArchived ? "Thread restored" : "Thread archived");
      onRefresh();
    } catch {
      toast.error("Failed to update thread");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTogglePin() {
    setActionLoading("pin");
    try {
      const res = await fetch(`/api/discussions/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !thread.isPinned }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update thread");
        return;
      }
      toast.success(thread.isPinned ? "Thread unpinned" : "Thread pinned");
      onRefresh();
    } catch {
      toast.error("Failed to update thread");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/discussions/${thread.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete thread");
        return;
      }
      toast.success("Thread deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete thread");
    } finally {
      setActionLoading(null);
    }
  }

  const isAuthor = thread.authorId === currentUser.id;
  const canDelete = isAdmin || isAuthor;

  return (
    <Card
      className={`transition-colors cursor-pointer hover:border-primary/30 hover:shadow-md ${
        thread.isArchived ? "opacity-60" : ""
      } ${thread.isPinned ? "border-primary/40 bg-primary/[0.02]" : ""}`}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onOpen(thread.id)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {thread.isPinned && (
                <Pin className="size-3.5 text-primary fill-primary shrink-0" />
              )}
              {thread.isArchived && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Archived
                </Badge>
              )}
              <CardTitle className="text-base leading-snug truncate">
                {thread.title}
              </CardTitle>
            </div>
          </div>

          {/* Admin / author actions */}
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePin();
                  }}
                  disabled={actionLoading !== null}
                  title={thread.isPinned ? "Unpin" : "Pin"}
                >
                  {thread.isPinned ? (
                    <PinOff className="size-3.5" />
                  ) : (
                    <Pin className="size-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleArchive();
                  }}
                  disabled={actionLoading !== null}
                  title={thread.isArchived ? "Restore" : "Archive"}
                >
                  {thread.isArchived ? (
                    <ArchiveRestore className="size-3.5" />
                  ) : (
                    <Archive className="size-3.5" />
                  )}
                </Button>
              </>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => e.stopPropagation()}
                    disabled={actionLoading !== null}
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this thread and all its
                      replies. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent onClick={() => onOpen(thread.id)}>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {thread.body}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              {thread.authorAvatarUrl && (
                <AvatarImage
                  src={thread.authorAvatarUrl}
                  alt={thread.authorName}
                />
              )}
              <AvatarFallback className="text-[9px]">
                {getInitials(thread.authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground/80">
              {thread.authorName}
            </span>
            <RoleBadge role={thread.authorRole} />
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3" />
              {thread.replyCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {timeAgo(thread.lastReplyAt || thread.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Thread Detail View ─────────────────────────────────────────────────────────

function ThreadDetailView({
  threadId,
  isAdmin,
  currentUser,
  onBack,
}: {
  threadId: string;
  isAdmin: boolean;
  currentUser: CurrentUser;
  onBack: () => void;
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/discussions/${threadId}`);
      if (!res.ok) {
        toast.error("Failed to load thread");
        onBack();
        return;
      }
      const data = await res.json();
      setThread(data.thread);
      setReplies(data.replies);
    } catch {
      toast.error("Failed to load thread");
      onBack();
    } finally {
      setLoading(false);
    }
  }, [threadId, onBack]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  async function handleSendReply() {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/discussions/${threadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send reply");
        return;
      }
      toast.success("Reply sent!");
      setReplyBody("");
      fetchThread();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteReply(replyId: string) {
    try {
      const res = await fetch(
        `/api/discussions/${threadId}/replies/${replyId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete reply");
        return;
      }
      toast.success("Reply deleted");
      fetchThread();
    } catch {
      toast.error("Failed to delete reply");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!thread) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {thread.isPinned && (
              <Pin className="size-4 text-primary fill-primary shrink-0" />
            )}
            {thread.isArchived && (
              <Badge variant="secondary" className="text-xs">
                Archived
              </Badge>
            )}
            <h1 className="text-xl font-bold truncate">{thread.title}</h1>
          </div>
        </div>
      </div>

      {/* Thread body */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Avatar>
              {thread.authorAvatarUrl && (
                <AvatarImage
                  src={thread.authorAvatarUrl}
                  alt={thread.authorName}
                />
              )}
              <AvatarFallback>{getInitials(thread.authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap mb-1">
                <span className="font-semibold text-sm">
                  {thread.authorName}
                </span>
                <RoleBadge role={thread.authorRole} />
                <span className="text-xs text-muted-foreground ml-1">
                  · {timeAgo(thread.createdAt)}
                </span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {thread.body}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare className="size-4" />
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MessageCircle className="size-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No replies yet. Be the first to respond!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => {
              const isReplyAuthor = reply.authorId === currentUser.id;
              const canDeleteReply = isAdmin || isReplyAuthor;

              return (
                <Card key={reply.id} className="py-4">
                  <CardContent className="pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-7 mt-0.5">
                        {reply.authorAvatarUrl && (
                          <AvatarImage
                            src={reply.authorAvatarUrl}
                            alt={reply.authorName}
                          />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {getInitials(reply.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-medium text-sm">
                              {reply.authorName}
                            </span>
                            <RoleBadge role={reply.authorRole} />
                            <span className="text-xs text-muted-foreground ml-1">
                              · {timeAgo(reply.createdAt)}
                            </span>
                          </div>
                          {canDeleteReply && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 text-muted-foreground hover:text-destructive"
                                  title="Delete reply"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Reply
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this reply.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReply(reply.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1">
                          {reply.body}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply input */}
      {!thread.isArchived ? (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3 items-end">
              <Textarea
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={2}
                disabled={sending}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSendReply}
                disabled={sending || !replyBody.trim()}
                className="shrink-0"
                title="Send reply (Ctrl+Enter)"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Press Ctrl+Enter to send
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Archive className="size-4" />
              This thread is archived. New replies are disabled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Discussions Page Component ────────────────────────────────────────────

export function DiscussionsPage() {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin =
    currentUser?.role === "superadmin" || currentUser?.role === "instructor";

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    try {
      const url = showArchived
        ? "/api/discussions?includeArchived=true"
        : "/api/discussions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads);
      }
    } catch {
      toast.error("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Auto-refresh every 30 seconds when on the list view
  useEffect(() => {
    if (selectedThreadId) return;
    const interval = setInterval(fetchThreads, 30000);
    return () => clearInterval(interval);
  }, [selectedThreadId, fetchThreads]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Thread detail view
  if (selectedThreadId) {
    return (
      <ThreadDetailView
        threadId={selectedThreadId}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onBack={() => {
          setSelectedThreadId(null);
          fetchThreads();
        }}
      />
    );
  }

  // Filter threads by search
  const filteredThreads = searchQuery.trim()
    ? threads.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.authorName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : threads;

  const pinnedThreads = filteredThreads.filter(
    (t) => t.isPinned && !t.isArchived,
  );
  const activeThreads = filteredThreads.filter(
    (t) => !t.isPinned && !t.isArchived,
  );
  const archivedThreads = filteredThreads.filter((t) => t.isArchived);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="size-6" />
            Discussions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions, share ideas, and connect with the community
          </p>
        </div>
        <NewThreadDialog onCreated={fetchThreads} />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Input
          placeholder="Search discussions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        {isAdmin && (
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setShowArchived(!showArchived);
              setLoading(true);
            }}
            className="gap-2"
          >
            <Archive className="size-3.5" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredThreads.length} thread
          {filteredThreads.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="size-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-1">No discussions yet</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No threads match your search. Try different keywords."
              : "Start the conversation by creating the first thread!"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned threads */}
          {pinnedThreads.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="size-3 fill-current" />
                Pinned
              </h2>
              {pinnedThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  onOpen={setSelectedThreadId}
                  onRefresh={fetchThreads}
                />
              ))}
            </div>
          )}

          {/* Active threads */}
          {activeThreads.length > 0 && (
            <div className="space-y-3">
              {pinnedThreads.length > 0 && (
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  All Threads
                </h2>
              )}
              {activeThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  onOpen={setSelectedThreadId}
                  onRefresh={fetchThreads}
                />
              ))}
            </div>
          )}

          {/* Archived threads */}
          {showArchived && archivedThreads.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Archive className="size-3" />
                Archived
              </h2>
              {archivedThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  onOpen={setSelectedThreadId}
                  onRefresh={fetchThreads}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
