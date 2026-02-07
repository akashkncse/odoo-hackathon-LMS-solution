"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";

export default function TestCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice } = useCurrency();

  const paymentId = searchParams.get("paymentId") || "";
  const orderId = searchParams.get("orderId") || "";
  const amount = searchParams.get("amount") || "0";
  const currency = searchParams.get("currency") || "INR";
  const courseName = searchParams.get("courseName") || "Course";

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Guard: if required query params are missing, redirect back
  useEffect(() => {
    if (!paymentId || !orderId) {
      router.replace(`/dashboard/courses/${id}`);
    }
  }, [paymentId, orderId, id, router]);

  async function handleFinishPayment() {
    setProcessing(true);

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          testMode: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Payment failed. Try again.");
        setProcessing(false);
        return;
      }

      setSuccess(true);
      toast.success("Payment completed! 🎉", {
        description: "You now have full access to this course.",
      });

      // Redirect back to the course page after a brief pause
      setTimeout(() => {
        router.push(`/dashboard/courses/${id}`);
        router.refresh();
      }, 1500);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setProcessing(false);
    }
  }

  // Parse the display amount — `amount` from the URL is in the smallest
  // currency unit (paise / cents). Convert back to major unit for display.
  const displayAmount = (() => {
    const raw = parseInt(amount, 10);
    if (isNaN(raw)) return formatPrice(0);
    // INR & most currencies: 2 decimal places → divide by 100
    // JPY, KRW, etc.: 0 decimal places → divide by 1
    const noDecimalCurrencies = ["JPY", "KRW", "VND", "CLP", "IDR", "TWD", "COP", "HUF"];
    const divisor = noDecimalCurrencies.includes(currency.toUpperCase()) ? 1 : 100;
    return formatPrice(raw / divisor);
  })();

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground">
              You now have full access to <strong>{courseName}</strong>.
              Redirecting you to the course…
            </p>
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/dashboard/courses/${id}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>

        {/* Test Mode Warning Banner */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                Razorpay is not configured — Test Mode
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                The payment gateway is running in test mode because the
                Razorpay API keys have not been set up. Clicking
                &ldquo;Finish Payment&rdquo; below will simulate a successful
                payment and enroll you in the course.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left — Setup Instructions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4" />
                Set up Razorpay API Keys
              </CardTitle>
              <CardDescription>
                To enable real payments, add these environment variables to
                your <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Env var list */}
              <div className="rounded-lg border bg-muted/50 overflow-hidden">
                <div className="flex items-center gap-2 border-b px-3 py-2 bg-muted/80">
                  <Terminal className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    .env.local
                  </span>
                </div>
                <div className="p-3 space-y-2 font-mono text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground select-none">#</span>
                    <span className="text-muted-foreground">
                      Get keys from https://dashboard.razorpay.com/app/keys
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">
                      RAZORPAY_KEY_ID
                    </span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-green-600 dark:text-green-400">
                      rzp_test_xxxxxxxxxx
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">
                      RAZORPAY_KEY_SECRET
                    </span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-green-600 dark:text-green-400">
                      your_key_secret_here
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">
                      NEXT_PUBLIC_RAZORPAY_KEY_ID
                    </span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-green-600 dark:text-green-400">
                      rzp_test_xxxxxxxxxx
                    </span>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3 text-sm">
                <h4 className="font-medium">How to get your keys:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                  <li>
                    Go to{" "}
                    <a
                      href="https://dashboard.razorpay.com/app/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      dashboard.razorpay.com/app/keys
                    </a>
                  </li>
                  <li>
                    Sign in or create a Razorpay account (KYC required)
                  </li>
                  <li>
                    Generate a new key pair (use <strong>Test Mode</strong> for
                    development)
                  </li>
                  <li>
                    Copy the Key ID and Key Secret into your{" "}
                    <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                      .env.local
                    </code>
                  </li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Right — Order Summary & Finish Payment */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Course info */}
              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-medium text-sm leading-snug line-clamp-2">
                  {courseName}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Price</span>
                  <span className="text-lg font-bold">{displayAmount}</span>
                </div>
              </div>

              {/* Order meta */}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Order ID</span>
                  <code className="font-mono bg-muted px-1 py-0.5 rounded max-w-[180px] truncate">
                    {orderId}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>Currency</span>
                  <span className="font-medium text-foreground">
                    {currency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mode</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                  >
                    <AlertTriangle className="size-2.5 mr-0.5" />
                    Test
                  </Badge>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Security note */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lock className="size-3 mt-0.5 shrink-0" />
                <p>
                  In live mode, payments are securely processed by Razorpay
                  with HMAC-SHA256 signature verification.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-0">
              <Button
                onClick={handleFinishPayment}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Finish Payment — {displayAmount}
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                This is a simulated payment. No real money will be charged.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
