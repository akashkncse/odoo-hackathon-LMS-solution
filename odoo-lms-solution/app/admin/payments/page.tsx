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
  Search,
  Loader2,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

interface Payment {
  id: string;
  userId: string;
  courseId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  courseTitle: string;
  courseImageUrl: string | null;
}

interface PaymentSummary {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  totalRevenue: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 gap-1">
          <CheckCircle2 className="size-3" />
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 gap-1">
          <XCircle className="size-3" />
          Failed
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
          <RotateCcw className="size-3" />
          Refunded
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const { formatPrice } = useCurrency();

  const fetchPayments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        if (search.trim()) {
          params.set("search", search.trim());
        }
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const res = await fetch(`/api/admin/payments?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load payments.");
          return;
        }

        setPayments(data.payments);
        setPagination(data.pagination);
        setSummary(data.summary);
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, sortBy, sortOrder],
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPayments(1);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="size-6" />
          Payments
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all payment transactions, revenue, and payment statuses.
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {formatPrice(summary.totalRevenue)}
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <TrendingUp className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Transactions
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {summary.totalPayments}
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Receipt className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Completed
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-green-600">
                    {summary.completedPayments}
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-amber-600">
                    {summary.pendingPayments}
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Failed
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-red-600">
                    {summary.failedPayments}
                  </p>
                  {summary.refundedPayments > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {summary.refundedPayments} refunded
                    </p>
                  )}
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <XCircle className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment History</CardTitle>
          <CardDescription>
            All payment transactions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, course, or order ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!loading && payments.length === 0 && (
            <div className="py-12 text-center">
              <IndianRupee className="mx-auto size-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-lg">
                No payments found.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Payment records will appear here once learners purchase courses."}
              </p>
            </div>
          )}

          {/* Payments Table */}
          {!loading && payments.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button
                          onClick={() => toggleSort("userName")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          User
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button
                          onClick={() => toggleSort("courseTitle")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Course
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button
                          onClick={() => toggleSort("amount")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Amount
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button
                          onClick={() => toggleSort("status")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Status
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button
                          onClick={() => toggleSort("createdAt")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Date
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {payment.userAvatarUrl ? (
                              <img
                                src={payment.userAvatarUrl}
                                alt={payment.userName}
                                className="size-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                {payment.userName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[160px]">
                                {payment.userName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {payment.userEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {payment.courseImageUrl ? (
                              <img
                                src={payment.courseImageUrl}
                                alt={payment.courseTitle}
                                className="size-8 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                                <CreditCard className="size-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[200px]">
                              {payment.courseTitle}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3">
                          <span className="font-semibold tabular-nums">
                            {formatPrice(payment.amount)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {statusBadge(payment.status)}
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {payment.razorpayOrderId.length > 20
                              ? `${payment.razorpayOrderId.slice(0, 20)}...`
                              : payment.razorpayOrderId}
                          </code>
                          {payment.razorpayPaymentId && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                              Pay:{" "}
                              {payment.razorpayPaymentId.length > 20
                                ? `${payment.razorpayPaymentId.slice(0, 20)}...`
                                : payment.razorpayPaymentId}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} &middot;{" "}
                    {pagination.total} payment
                    {pagination.total !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => fetchPayments(pagination.page - 1)}
                      className="gap-1"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                      onClick={() => fetchPayments(pagination.page + 1)}
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
        </CardContent>
      </Card>
    </div>
  );
}
