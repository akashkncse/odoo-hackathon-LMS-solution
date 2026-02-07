"use client";

import { useEffect, useState, use } from "react";
import { useBranding } from "@/hooks/use-branding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  BookOpen,
  Calendar,
  User,
  Hash,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface VerifiedCertificate {
  certificateNumber: string;
  issuedAt: string;
  courseTitle: string;
  courseDescription: string | null;
  userName: string;
  completedAt: string | null;
  totalLessons: number;
}

export default function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const { certificateNumber } = use(params);

  const { platformName } = useBranding();
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/certificates/${encodeURIComponent(certificateNumber)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setValid(false);
          setError(
            data.error ||
              "Certificate not found. Please check the certificate number.",
          );
          return;
        }

        setValid(data.valid === true);
        setCertificate(data.certificate || null);

        if (!data.valid) {
          setError("This certificate could not be verified.");
        }
      } catch {
        setValid(false);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [certificateNumber]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatShortDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Loader2 className="size-10 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">
          Verifying certificate...
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1 font-mono">
          {certificateNumber}
        </p>
      </div>
    );
  }

  // Invalid / Not Found
  if (!valid || !certificate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="w-full max-w-md">
          <Card className="border-destructive/30 shadow-lg">
            <CardContent className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10">
                  <XCircle className="size-8 text-destructive" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold text-destructive">
                  Certificate Not Verified
                </h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {error}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                  <Hash className="size-3 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {certificateNumber}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/">
                    <ArrowLeft className="size-4" />
                    Go to Homepage
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            If you believe this is an error, please contact the certificate
            holder or the issuing institution.
          </p>
        </div>
      </div>
    );
  }

  // Valid Certificate
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back link */}
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Homepage
          </Link>
        </Button>

        {/* Verification badge */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-2 text-green-700 dark:text-green-400">
            <ShieldCheck className="size-4" />
            <span className="text-sm font-semibold">Verified Certificate</span>
          </div>
        </div>

        {/* Certificate display */}
        <Card className="overflow-hidden border-2 border-amber-300/50 shadow-xl">
          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            {/* Award icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150" />
                <div className="relative flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
                  <Award className="size-8 text-white" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
                Certificate of Completion
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300 dark:to-amber-700" />
                <div className="size-1 rounded-full bg-amber-400" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300 dark:to-amber-700" />
              </div>
            </div>

            {/* Certifies that */}
            <p className="text-muted-foreground text-sm">
              This is to certify that
            </p>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {certificate.userName}
            </h1>

            <p className="text-muted-foreground text-sm">
              has successfully completed the course
            </p>

            {/* Course name */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-amber-700 dark:text-amber-400">
              {certificate.courseTitle}
            </h2>

            {certificate.courseDescription && (
              <p className="text-muted-foreground text-sm max-w-md mx-auto line-clamp-2">
                {certificate.courseDescription}
              </p>
            )}

            {/* Completion details */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
              {certificate.completedAt && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span>
                    Completed on{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(certificate.completedAt)}
                    </span>
                  </span>
                </div>
              )}
              {certificate.totalLessons > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="size-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium text-foreground">
                      {certificate.totalLessons}
                    </span>{" "}
                    lesson{certificate.totalLessons !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent dark:via-amber-800/40" />
            </div>

            {/* Footer info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Hash className="size-3" />
                <span className="font-mono font-medium text-foreground">
                  {certificate.certificateNumber}
                </span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                <span>
                  Issued{" "}
                  <span className="font-medium text-foreground">
                    {formatShortDate(certificate.issuedAt)}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="size-4 text-green-500" />
              Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Recipient
                </span>
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{certificate.userName}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Course
                </span>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{certificate.courseTitle}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Certificate Number
                </span>
                <div className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-muted-foreground" />
                  <span className="font-mono font-medium">
                    {certificate.certificateNumber}
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Status
                </span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-green-500" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Valid & Verified
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/60 pb-8">
          This certificate was issued by {platformName}. The authenticity of
          this certificate has been verified.
        </p>
      </div>
    </div>
  );
}
