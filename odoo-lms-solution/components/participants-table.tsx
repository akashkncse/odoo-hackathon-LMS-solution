"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  PlayCircle,
  Columns3,
  UserCircle,
} from "lucide-react";

interface Participant {
  sno: number;
  enrollmentId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: "not_started" | "in_progress" | "completed";
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  timeSpentSeconds: number;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
}

interface ParticipantSummary {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  avgTimeSpentSeconds: number;
  totalTimeSpentSeconds: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ParticipantsTableProps {
  courseId: string;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: undefined,
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 gap-1 font-medium">
          <CheckCircle2 className="size-3" />
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 gap-1 font-medium">
          <PlayCircle className="size-3" />
          In Progress
        </Badge>
      );
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1 font-medium">
          <Clock className="size-3" />
          Yet to Start
        </Badge>
      );
  }
}

function CompletionBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 100
              ? "bg-green-500"
              : percentage > 0
                ? "bg-blue-500"
                : "bg-muted-foreground/20"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-8 text-right">
        {percentage}%
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-all hover:shadow-md cursor-pointer ${
        active
          ? `ring-2 ring-offset-2 ${accent} shadow-md`
          : "hover:bg-muted/50"
      }`}
    >
      <Icon
        className={`size-5 ${active ? "text-foreground" : "text-muted-foreground"}`}
      />
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </button>
  );
}

export function ParticipantsTable({ courseId }: ParticipantsTableProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [summary, setSummary] = useState<ParticipantSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "enrolledAt", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    sno: true,
    name: true,
    enrolledAt: true,
    startedAt: true,
    timeSpent: true,
    completionPercentage: true,
    completedAt: true,
    status: true,
    email: false,
  });

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const sortBy =
        sorting.length > 0
          ? sorting[0].id === "name"
            ? "name"
            : sorting[0].id === "timeSpent"
              ? "timeSpent"
              : sorting[0].id === "startedAt"
                ? "startedAt"
                : sorting[0].id === "completedAt"
                  ? "completedAt"
                  : sorting[0].id === "status"
                    ? "status"
                    : "enrolledAt"
          : "enrolledAt";
      const sortDir =
        sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy,
        sortDir,
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(
        `/api/admin/courses/${courseId}/participants?${params}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load participants.");
        return;
      }

      setParticipants(data.participants);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [courseId, page, pageSize, debouncedSearch, statusFilter, sorting]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Column definitions
  const columns = useMemo<ColumnDef<Participant>[]>(
    () => [
      {
        id: "sno",
        accessorKey: "sno",
        header: "S.No.",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-medium tabular-nums">
            {row.original.sno}
          </span>
        ),
        size: 70,
        enableSorting: false,
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Participant Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            {row.original.avatarUrl ? (
              <img
                src={row.original.avatarUrl}
                alt={row.original.name}
                className="size-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <UserCircle className="size-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{row.original.name}</p>
              {columnVisibility.email === false && (
                <p className="text-xs text-muted-foreground truncate">
                  {row.original.email}
                </p>
              )}
            </div>
          </div>
        ),
        size: 220,
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
            {row.original.email}
          </span>
        ),
        size: 200,
      },
      {
        id: "enrolledAt",
        accessorKey: "enrolledAt",
        header: "Enrolled Date",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatDate(row.original.enrolledAt)}
          </span>
        ),
        size: 120,
      },
      {
        id: "startedAt",
        accessorKey: "startedAt",
        header: "Start Date",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatDate(row.original.startedAt)}
          </span>
        ),
        size: 120,
      },
      {
        id: "timeSpent",
        accessorKey: "timeSpentSeconds",
        header: "Time Spent",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums font-medium">
            {formatTime(row.original.timeSpentSeconds)}
          </span>
        ),
        size: 110,
      },
      {
        id: "completionPercentage",
        accessorKey: "completionPercentage",
        header: "Completion",
        cell: ({ row }) => (
          <CompletionBar percentage={row.original.completionPercentage} />
        ),
        size: 160,
        enableSorting: false,
      },
      {
        id: "completedAt",
        accessorKey: "completedAt",
        header: "Completed Date",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatDate(row.original.completedAt)}
          </span>
        ),
        size: 130,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 140,
      },
    ],
    [columnVisibility.email],
  );

  const table = useReactTable({
    data: participants,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    pageCount: pagination.totalPages,
  });

  const columnLabels: Record<string, string> = {
    sno: "S.No.",
    name: "Participant Name",
    email: "Email",
    enrolledAt: "Enrolled Date",
    startedAt: "Start Date",
    timeSpent: "Time Spent",
    completionPercentage: "Completion %",
    completedAt: "Completed Date",
    status: "Status",
  };

  function handleCardFilter(status: string) {
    setStatusFilter((prev) => (prev === status ? "all" : status));
  }

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Total Participants"
            value={summary.total}
            icon={Users}
            active={statusFilter === "all"}
            onClick={() => handleCardFilter("all")}
            accent="ring-primary"
          />
          <SummaryCard
            label="Yet to Start"
            value={summary.notStarted}
            icon={Clock}
            active={statusFilter === "not_started"}
            onClick={() => handleCardFilter("not_started")}
            accent="ring-yellow-500"
          />
          <SummaryCard
            label="In Progress"
            value={summary.inProgress}
            icon={PlayCircle}
            active={statusFilter === "in_progress"}
            onClick={() => handleCardFilter("in_progress")}
            accent="ring-blue-500"
          />
          <SummaryCard
            label="Completed"
            value={summary.completed}
            icon={CheckCircle2}
            active={statusFilter === "completed"}
            onClick={() => handleCardFilter("completed")}
            accent="ring-green-500"
          />
        </div>
      )}

      {/* Table Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Participants</CardTitle>
              <CardDescription>
                {pagination.total} participant
                {pagination.total !== 1 ? "s" : ""} enrolled
                {statusFilter !== "all" && (
                  <span>
                    {" "}
                    &middot; Filtered by{" "}
                    <span className="font-medium">
                      {statusFilter === "not_started"
                        ? "Yet to Start"
                        : statusFilter === "in_progress"
                          ? "In Progress"
                          : "Completed"}
                    </span>
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search participant..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px] sm:w-[240px] h-9"
                />
              </div>

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9">
                    <Columns3 className="size-4" />
                    <span className="hidden sm:inline">Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(columnLabels).map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={columnVisibility[key] !== false}
                      onCheckedChange={(checked) => {
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [key]: checked,
                        }));
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Page size */}
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(parseInt(val, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[80px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-y bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        style={{
                          width: header.getSize(),
                        }}
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer select-none"
                            onClick={() => {
                              const current = sorting.find(
                                (s) => s.id === header.column.id,
                              );
                              if (!current) {
                                setSorting([
                                  { id: header.column.id, desc: false },
                                ]);
                              } else if (!current.desc) {
                                setSorting([
                                  { id: header.column.id, desc: true },
                                ]);
                              } else {
                                setSorting([{ id: "enrolledAt", desc: true }]);
                              }
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sorting.find((s) => s.id === header.column.id) ? (
                              sorting.find((s) => s.id === header.column.id)
                                ?.desc ? (
                                <ArrowDown className="size-3.5" />
                              ) : (
                                <ArrowUp className="size-3.5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        <span>Loading participants...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-destructive">
                        <AlertCircle className="size-8" />
                        <p className="font-medium">{error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchParticipants}
                        >
                          Retry
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="size-8 opacity-40" />
                        <p className="font-medium">No participants found</p>
                        {(search || statusFilter !== "all") && (
                          <p className="text-xs">
                            Try clearing your search or filters.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={`border-b transition-colors hover:bg-muted/30 ${
                        rowIndex % 2 === 0 ? "" : "bg-muted/10"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                –
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                participants
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 text-sm font-medium tabular-nums">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(pagination.totalPages)}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
