"use client";

import { useEffect, useState, useRef, use } from "react";
import { useBranding } from "@/hooks/use-branding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  Download,
  Linkedin,
  Share2,
  Loader2,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CertificateData {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  courseTitle: string;
  courseDescription: string | null;
  userName: string;
  userEmail: string;
  completedAt: string | null;
  totalLessons: number;
}

export default function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);

  const { platformName } = useBranding();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadOrGenerate() {
      setLoading(true);
      try {
        // First try to GET existing certificate
        const getRes = await fetch(`/api/courses/${courseId}/certificate`);

        if (getRes.ok) {
          const data = await getRes.json();
          setCertificate(data.certificate);
          return;
        }

        // If not found, try to generate one
        if (getRes.status === 404) {
          setGenerating(true);
          const postRes = await fetch(`/api/courses/${courseId}/certificate`, {
            method: "POST",
          });
          const data = await postRes.json();

          if (!postRes.ok) {
            setError(data.error || "Unable to generate certificate.");
            return;
          }

          setCertificate(data.certificate);

          if (data.created) {
            toast.success("Certificate Generated! 🎓", {
              description: "Congratulations on completing the course!",
            });
          }
          return;
        }

        const errData = await getRes.json();
        setError(errData.error || "Failed to load certificate.");
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
        setGenerating(false);
      }
    }

    loadOrGenerate();
  }, [courseId]);

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    // Use html2canvas-like approach via print-to-PDF prompt
    // For simplicity, we trigger print which allows "Save as PDF"
    toast.info("Use your browser's 'Save as PDF' option in the print dialog.", {
      duration: 5000,
    });
    setTimeout(() => {
      window.print();
    }, 500);
  }

  function getVerificationUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/verify/${certificate?.certificateNumber}`;
  }

  function handleShareLinkedIn() {
    if (!certificate) return;

    const completedDate = certificate.completedAt
      ? new Date(certificate.completedAt)
      : new Date(certificate.issuedAt);

    const issueYear = completedDate.getFullYear();
    const issueMonth = completedDate.getMonth() + 1;
    const verificationUrl = getVerificationUrl();

    // LinkedIn Add to Profile URL
    const linkedInUrl = new URL("https://www.linkedin.com/profile/add");
    linkedInUrl.searchParams.set("startTask", "CERTIFICATION_NAME");
    linkedInUrl.searchParams.set(
      "name",
      `${certificate.courseTitle} — Certificate of Completion`,
    );
    linkedInUrl.searchParams.set("organizationName", platformName);
    linkedInUrl.searchParams.set("issueYear", String(issueYear));
    linkedInUrl.searchParams.set("issueMonth", String(issueMonth));
    linkedInUrl.searchParams.set("certUrl", verificationUrl);
    linkedInUrl.searchParams.set("certId", certificate.certificateNumber);

    window.open(linkedInUrl.toString(), "_blank", "noopener,noreferrer");

    toast.success("Opening LinkedIn...", {
      description: "Add this certificate to your LinkedIn profile!",
    });
  }

  function handleCopyLink() {
    const url = getVerificationUrl();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Verification link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link.");
      });
    setShowShareMenu(false);
  }

  function handleCopyCertNumber() {
    if (!certificate) return;
    navigator.clipboard
      .writeText(certificate.certificateNumber)
      .then(() => {
        toast.success("Certificate number copied!");
      })
      .catch(() => {
        toast.error("Failed to copy.");
      });
  }

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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {generating
            ? "Generating your certificate..."
            : "Loading certificate..."}
        </p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Award className="size-16 text-muted-foreground/30 mb-4" />
        <p className="text-destructive text-lg font-medium">
          {error || "Certificate not available."}
        </p>
        <p className="text-muted-foreground text-sm mt-2 max-w-md text-center">
          Make sure you have completed all lessons in this course to receive
          your certificate.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/dashboard/courses/${courseId}`}>
            <ArrowLeft className="size-4" />
            Back to Course
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-print-area,
          #certificate-print-area * {
            visibility: visible;
          }
          #certificate-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Top bar — navigation & actions (hidden in print) */}
        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={`/dashboard/courses/${courseId}`}>
              <ArrowLeft className="size-4" />
              Back to Course
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Print */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="size-3.5" />
              Print
            </Button>

            {/* Download (Save as PDF) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Save as PDF
            </Button>

            {/* Share on LinkedIn */}
            <Button
              size="sm"
              onClick={handleShareLinkedIn}
              className="gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              <Linkedin className="size-3.5" />
              Add to LinkedIn
            </Button>

            {/* Share / Copy Link */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="gap-1.5"
              >
                <Share2 className="size-3.5" />
                Share
              </Button>
              {showShareMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Copy className="size-4 text-muted-foreground" />
                      Copy verification link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyCertNumber();
                        setShowShareMenu(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Copy className="size-4 text-muted-foreground" />
                      Copy certificate number
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleShareLinkedIn();
                        setShowShareMenu(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Linkedin className="size-4 text-[#0A66C2]" />
                      Add to LinkedIn Profile
                    </button>
                    <a
                      href={getVerificationUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowShareMenu(false)}
                    >
                      <ExternalLink className="size-4 text-muted-foreground" />
                      View public verification page
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Certificate Card ──────────────────────────────────────── */}
        <div id="certificate-print-area" ref={certificateRef}>
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border-4 border-amber-300/70 bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-gray-950 dark:via-amber-950/10 dark:to-gray-950 shadow-2xl">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
                <svg
                  viewBox="0 0 128 128"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0H128L0 128V0Z" fill="url(#cornerGrad1)" />
                  <defs>
                    <linearGradient
                      id="cornerGrad1"
                      x1="0"
                      y1="0"
                      x2="128"
                      y2="128"
                    >
                      <stop stopColor="#D97706" />
                      <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 rotate-180">
                <svg
                  viewBox="0 0 128 128"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0H128L0 128V0Z" fill="url(#cornerGrad2)" />
                  <defs>
                    <linearGradient
                      id="cornerGrad2"
                      x1="0"
                      y1="0"
                      x2="128"
                      y2="128"
                    >
                      <stop stopColor="#D97706" />
                      <stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Inner border */}
              <div className="m-4 rounded-xl border-2 border-amber-200/40 dark:border-amber-800/30 p-8 sm:p-12 md:p-16">
                {/* Header */}
                <div className="text-center space-y-4">
                  {/* Award icon */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150" />
                      <div className="relative flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
                        <Award
                          className="size-10 text-white"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
                      Certificate of Completion
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-300 dark:to-amber-700" />
                      <div className="size-1.5 rounded-full bg-amber-400" />
                      <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-300 dark:to-amber-700" />
                    </div>
                  </div>

                  {/* "This is to certify that" */}
                  <p className="text-muted-foreground text-sm mt-6">
                    This is to certify that
                  </p>

                  {/* Recipient name */}
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground py-2">
                    {certificate.userName}
                  </h1>

                  <p className="text-muted-foreground text-sm">
                    has successfully completed the course
                  </p>

                  {/* Course title */}
                  <div className="py-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-700 dark:text-amber-400">
                      {certificate.courseTitle}
                    </h2>
                    {certificate.courseDescription && (
                      <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto line-clamp-2">
                        {certificate.courseDescription}
                      </p>
                    )}
                  </div>

                  {/* Completion details */}
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
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
                        <CheckCircle2 className="size-4 text-green-500" />
                        <span>
                          <span className="font-medium text-foreground">
                            {certificate.totalLessons}
                          </span>{" "}
                          lesson{certificate.totalLessons !== 1 ? "s" : ""}{" "}
                          completed
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="my-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent dark:via-amber-800/50" />
                </div>

                {/* Footer: certificate number, issue date, verification */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="uppercase tracking-wider text-[10px] font-medium block text-muted-foreground/70">
                        Certificate No.
                      </span>
                      <span className="font-mono text-foreground font-medium">
                        {certificate.certificateNumber}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <span className="uppercase tracking-wider text-[10px] font-medium block text-muted-foreground/70">
                        Issued
                      </span>
                      <span className="font-medium text-foreground">
                        {formatShortDate(certificate.issuedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="uppercase tracking-wider text-[10px] font-medium block text-muted-foreground/70">
                      Verify at
                    </span>
                    <span className="font-medium text-foreground">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/verify/${certificate.certificateNumber}`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions below certificate (hidden in print) ───────────── */}
        <div className="no-print mx-auto max-w-4xl">
          {/* LinkedIn CTA card */}
          <Card className="border-[#0A66C2]/20 bg-[#0A66C2]/5 dark:bg-[#0A66C2]/10">
            <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
              <div className="flex items-center justify-center size-12 rounded-xl bg-[#0A66C2] shrink-0">
                <Linkedin className="size-6 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-sm font-semibold">Share on LinkedIn</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add this certificate to your LinkedIn profile and showcase
                  your achievement to your professional network.
                </p>
              </div>
              <Button
                onClick={handleShareLinkedIn}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white gap-1.5 shrink-0"
              >
                <Linkedin className="size-4" />
                Add to LinkedIn Profile
              </Button>
            </CardContent>
          </Card>

          {/* Certificate details card */}
          <Card className="mt-4">
            <CardContent className="py-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recipient
                  </span>
                  <p className="mt-1 text-sm font-medium">
                    {certificate.userName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {certificate.userEmail}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Course
                  </span>
                  <p className="mt-1 text-sm font-medium">
                    {certificate.courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {certificate.totalLessons} lesson
                    {certificate.totalLessons !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Completed
                  </span>
                  <p className="mt-1 text-sm font-medium">
                    {certificate.completedAt
                      ? formatDate(certificate.completedAt)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Certificate ID
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCertNumber}
                    className="mt-1 flex items-center gap-1.5 group"
                  >
                    <span className="text-sm font-mono font-medium">
                      {certificate.certificateNumber}
                    </span>
                    <Copy className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
