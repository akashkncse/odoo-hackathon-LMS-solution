"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Step = "email" | "otp" | "reset";

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  {
    label: "One special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  const results = useMemo(
    () =>
      PASSWORD_CHECKS.map((check) => ({
        ...check,
        passed: check.test(password),
      })),
    [password],
  );

  if (!password) return null;

  return (
    <ul className="mt-1 space-y-1 text-xs">
      {results.map((r) => (
        <li key={r.label} className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex size-3.5 items-center justify-center rounded-full text-[10px] font-bold leading-none",
              r.passed
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {r.passed ? "✓" : "✗"}
          </span>
          <span
            className={
              r.passed
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }
          >
            {r.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isPasswordValid = useMemo(
    () => PASSWORD_CHECKS.every((check) => check.test(newPassword)),
    [newPassword],
  );

  const passwordsMatch = newPassword === confirmPassword;

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code.");
        toast.error(data.error || "Failed to send reset code.");
        return;
      }

      toast.success("Reset code sent! 📧", {
        description: "Check your email inbox.",
      });
      setStep("otp");
      startResendCooldown();
    } catch {
      setError("Something went wrong. Try again.");
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: otp.trim(),
          type: "password_reset",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code.");
        toast.error(data.error || "Invalid code.");
        return;
      }

      toast.success("Code verified! 🔓", {
        description: "Now set your new password.",
      });
      setStep("reset");
    } catch {
      setError("Something went wrong. Try again.");
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet all requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        toast.error(data.error || "Failed to reset password.");
        return;
      }

      toast.success("Password reset successfully! 🎉", {
        description: "You can now log in with your new password.",
      });
      window.location.href = "/login";
    } catch {
      setError("Something went wrong. Try again.");
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        toast.error(data.error || "Failed to resend code.");
        return;
      }

      toast.success("New code sent! 📧");
      setOtp("");
      startResendCooldown();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function getTitle() {
    switch (step) {
      case "email":
        return "Forgot your password?";
      case "otp":
        return "Enter verification code";
      case "reset":
        return "Set new password";
    }
  }

  function getDescription() {
    switch (step) {
      case "email":
        return "Enter your email and we'll send you a code to reset your password.";
      case "otp":
        return `We've sent a 6-digit code to ${email}`;
      case "reset":
        return "Choose a strong new password for your account.";
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ── Step 1: Enter Email ── */}
          {step === "email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
            >
              <FieldGroup>
                {error && (
                  <div className="text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <FieldDescription>
                    Enter the email address associated with your account.
                  </FieldDescription>
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending code..." : "Send Reset Code"}
                  </Button>
                  <FieldDescription className="text-center">
                    Remember your password? <a href="/login">Sign in</a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === "otp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyOtp();
              }}
            >
              <FieldGroup>
                {error && (
                  <div className="text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setOtp(value);
                    }}
                    autoComplete="one-time-code"
                    required
                    className="text-center text-lg tracking-[0.3em] font-mono"
                  />
                  <FieldDescription>
                    Enter the 6-digit code we sent to your email. The code
                    expires in 10 minutes.
                  </FieldDescription>
                </Field>
                <Field>
                  <Button type="submit" disabled={loading || otp.length !== 6}>
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                </Field>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setError("");
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    className={cn(
                      "underline-offset-4 hover:underline transition-colors",
                      resendCooldown > 0
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-primary hover:text-primary/80",
                    )}
                    onClick={handleResendOtp}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend code"}
                  </button>
                </div>
              </FieldGroup>
            </form>
          )}

          {/* ── Step 3: Reset Password ── */}
          {step === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleResetPassword();
              }}
            >
              <FieldGroup>
                {error && (
                  <div className="text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <PasswordStrengthIndicator password={newPassword} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-new-password">
                    Confirm New Password
                  </FieldLabel>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-destructive text-xs mt-0.5">
                      Passwords do not match.
                    </p>
                  )}
                </Field>
                <Field>
                  <Button
                    type="submit"
                    disabled={loading || !isPasswordValid || !passwordsMatch}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
