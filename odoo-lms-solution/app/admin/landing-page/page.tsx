"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { invalidateBrandingCache } from "@/hooks/use-branding";
import { invalidateCurrencyCache } from "@/hooks/use-currency";
import { CURRENCY_LIST } from "@/lib/currency";
import {
  ImageIcon,
  Save,
  ExternalLink,
  Eye,
  Palette,
  Type,
  Coins,
  Search,
  Plus,
  Trash2,
  MessageSquareQuote,
  HelpCircle,
  FootprintsIcon,
  Star,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterLinks {
  platform: FooterLink[];
  resources: FooterLink[];
}

interface TestimonialItem {
  name: string;
  role: string;
  initials: string;
  color: string;
  rating: number;
  text: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SiteSettings {
  id: string | null;
  platformName: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  featuredImageUrl: string | null;
  currency: string | null;
  footerTagline: string | null;
  footerLinks: FooterLinks | null;
  testimonials: TestimonialItem[] | null;
  faqs: FAQItem[] | null;
}

const avatarColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SiteSettingsAdmin() {
  const [settings, setSettings] = useState<SiteSettings>({
    id: null,
    platformName: null,
    logoUrl: null,
    heroImageUrl: null,
    featuredImageUrl: null,
    currency: null,
    footerTagline: null,
    footerLinks: null,
    testimonials: null,
    faqs: null,
  });
  const [platformName, setPlatformName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Footer state
  const [footerTagline, setFooterTagline] = useState("");
  const [platformLinks, setPlatformLinks] = useState<FooterLink[]>([]);
  const [resourceLinks, setResourceLinks] = useState<FooterLink[]>([]);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  // FAQ state
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  // Collapsed sections for FAQ and testimonials editing
  const [expandedTestimonial, setExpandedTestimonial] = useState<number | null>(
    null,
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/site-settings");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load settings.");
          return;
        }

        setSettings(data.settings);
        setPlatformName(data.settings.platformName || "");
        setLogoUrl(data.settings.logoUrl || "");
        setHeroImageUrl(data.settings.heroImageUrl || "");
        setFeaturedImageUrl(data.settings.featuredImageUrl || "");
        setCurrency(data.settings.currency || "INR");

        // Footer
        setFooterTagline(data.settings.footerTagline || "");
        if (data.settings.footerLinks) {
          setPlatformLinks(data.settings.footerLinks.platform || []);
          setResourceLinks(data.settings.footerLinks.resources || []);
        }

        // Testimonials
        if (
          data.settings.testimonials &&
          Array.isArray(data.settings.testimonials)
        ) {
          setTestimonials(data.settings.testimonials);
        }

        // FAQs
        if (data.settings.faqs && Array.isArray(data.settings.faqs)) {
          setFaqs(data.settings.faqs);
        }
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      // Build footer links — only include if user has entries
      const footerLinksPayload: FooterLinks | null =
        platformLinks.length > 0 || resourceLinks.length > 0
          ? {
              platform: platformLinks.filter(
                (l) => l.label.trim() && l.href.trim(),
              ),
              resources: resourceLinks.filter(
                (l) => l.label.trim() && l.href.trim(),
              ),
            }
          : null;

      // Build testimonials — only include valid entries
      const testimonialsPayload: TestimonialItem[] | null =
        testimonials.length > 0
          ? testimonials
              .filter((t) => t.name.trim() && t.text.trim())
              .map((t, i) => ({
                ...t,
                name: t.name.trim(),
                role: t.role?.trim() || "",
                initials: t.initials?.trim() || getInitials(t.name.trim()),
                color: t.color?.trim() || avatarColors[i % avatarColors.length],
                rating: t.rating ?? 5,
                text: t.text.trim(),
              }))
          : null;

      // Build FAQs — only include valid entries
      const faqsPayload: FAQItem[] | null =
        faqs.length > 0
          ? faqs.filter((f) => f.question.trim() && f.answer.trim())
          : null;

      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: platformName.trim() || null,
          logoUrl: logoUrl.trim() || null,
          heroImageUrl: heroImageUrl.trim() || null,
          featuredImageUrl: featuredImageUrl.trim() || null,
          currency: currency || "INR",
          footerTagline: footerTagline.trim() || null,
          footerLinks: footerLinksPayload,
          testimonials: testimonialsPayload,
          faqs: faqsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save settings.");
        return;
      }

      setSettings(data.settings);
      invalidateBrandingCache();
      invalidateCurrencyCache();
      toast.success("Site settings saved successfully!");
    } catch {
      toast.error("Failed to save settings. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // --- Footer link helpers ---
  function addPlatformLink() {
    setPlatformLinks((prev) => [...prev, { label: "", href: "" }]);
  }
  function updatePlatformLink(
    index: number,
    field: keyof FooterLink,
    value: string,
  ) {
    setPlatformLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  }
  function removePlatformLink(index: number) {
    setPlatformLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addResourceLink() {
    setResourceLinks((prev) => [...prev, { label: "", href: "" }]);
  }
  function updateResourceLink(
    index: number,
    field: keyof FooterLink,
    value: string,
  ) {
    setResourceLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    );
  }
  function removeResourceLink(index: number) {
    setResourceLinks((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Testimonial helpers ---
  function addTestimonial() {
    const newIndex = testimonials.length;
    setTestimonials((prev) => [
      ...prev,
      {
        name: "",
        role: "",
        initials: "",
        color: avatarColors[newIndex % avatarColors.length],
        rating: 5,
        text: "",
      },
    ]);
    setExpandedTestimonial(newIndex);
  }
  function updateTestimonial(
    index: number,
    field: keyof TestimonialItem,
    value: string | number,
  ) {
    setTestimonials((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const updated = { ...t, [field]: value };
        // Auto-generate initials when name changes
        if (field === "name" && typeof value === "string" && value.trim()) {
          updated.initials = getInitials(value.trim());
        }
        return updated;
      }),
    );
  }
  function removeTestimonial(index: number) {
    setTestimonials((prev) => prev.filter((_, i) => i !== index));
    if (expandedTestimonial === index) setExpandedTestimonial(null);
  }
  function moveTestimonial(index: number, direction: "up" | "down") {
    setTestimonials((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (expandedTestimonial === index) setExpandedTestimonial(newIndex);
  }

  // --- FAQ helpers ---
  function addFaq() {
    const newIndex = faqs.length;
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
    setExpandedFaq(newIndex);
  }
  function updateFaq(index: number, field: keyof FAQItem, value: string) {
    setFaqs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  }
  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
    if (expandedFaq === index) setExpandedFaq(null);
  }
  function moveFaq(index: number, direction: "up" | "down") {
    setFaqs((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (expandedFaq === index) setExpandedFaq(newIndex);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your platform branding, landing page content, and footer.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Eye className="size-4" />
            Preview
            <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ── Branding ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-5" />
              Branding
            </CardTitle>
            <CardDescription>
              Set your platform name and logo. These appear across the entire
              site — the navigation bar, sidebars, footer, certificates, and
              more. If left empty, defaults to &ldquo;LearnHub&rdquo; with a
              graduation cap icon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Name */}
            <div className="space-y-2">
              <label
                htmlFor="platformName"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Type className="size-3.5 text-muted-foreground" />
                Platform Name
              </label>
              <Input
                id="platformName"
                placeholder="LearnHub"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                maxLength={100}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                The name shown in the navbar, footer, sidebars, and
                certificates. Max 100 characters.
              </p>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <FileUpload
                label="Logo"
                imageOnly
                maxSizeMB={5}
                folder="site/logo"
                currentUrl={logoUrl || null}
                onUpload={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl("")}
                description="Upload a square logo (PNG, SVG, or WebP recommended). Displayed at 36×36px in navbars and sidebars."
                disabled={saving}
              />
            </div>

            {/* Live preview */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Preview
              </p>
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <div className="flex size-9 items-center justify-center rounded-lg overflow-hidden bg-muted border">
                    <img
                      src={logoUrl}
                      alt={platformName || "Logo preview"}
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                      <path d="M22 10v6" />
                      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                    </svg>
                  </div>
                )}
                <span className="text-lg font-bold tracking-tight">
                  {platformName.trim() || "LearnHub"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Payments & Currency ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="size-5" />
              Payments &amp; Currency
            </CardTitle>
            <CardDescription>
              Set the platform currency. This currency is used across the entire
              site — course prices, payment checkout, invoices, and reports.
              Changing this does not convert existing prices; it only changes
              the display symbol.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="currency"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Coins className="size-3.5 text-muted-foreground" />
                Currency
              </label>

              {/* Currency selector with search */}
              <div className="relative">
                <div
                  className="border-input bg-transparent focus-within:border-ring focus-within:ring-ring/50 flex h-9 w-full items-center rounded-md border px-3 text-sm shadow-xs focus-within:ring-[3px] cursor-pointer"
                  onClick={() => setShowCurrencyDropdown((v) => !v)}
                >
                  {(() => {
                    const selected = CURRENCY_LIST.find(
                      (c) => c.code === currency,
                    );
                    if (selected) {
                      return (
                        <span>
                          {selected.symbol} — {selected.name} ({selected.code})
                        </span>
                      );
                    }
                    return (
                      <span className="text-muted-foreground">
                        Select currency...
                      </span>
                    );
                  })()}
                </div>

                {showCurrencyDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                    <div className="flex items-center gap-2 border-b px-3 py-2">
                      <Search className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Search currencies..."
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {CURRENCY_LIST.filter((c) => {
                        if (!currencySearch.trim()) return true;
                        const q = currencySearch.toLowerCase();
                        return (
                          c.code.toLowerCase().includes(q) ||
                          c.name.toLowerCase().includes(q) ||
                          c.symbol.includes(q)
                        );
                      }).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                            currency === c.code
                              ? "bg-accent text-accent-foreground font-medium"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrency(c.code);
                            setCurrencySearch("");
                            setShowCurrencyDropdown(false);
                          }}
                        >
                          <span className="w-8 text-center font-medium">
                            {c.symbol}
                          </span>
                          <span className="flex-1 text-left">{c.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                This currency symbol will be shown next to every price across
                the platform. Default is Indian Rupee (₹).
              </p>
            </div>

            {/* Live preview */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Price Preview
              </p>
              <div className="flex items-center gap-4">
                {(() => {
                  const selected = CURRENCY_LIST.find(
                    (c) => c.code === currency,
                  );
                  const sym = selected?.symbol ?? currency;
                  const decimals = selected?.decimals ?? 2;
                  const samplePrice = (499).toFixed(decimals);
                  const formattedPrice =
                    selected?.symbolFirst !== false
                      ? `${sym}${samplePrice}`
                      : `${samplePrice} ${sym}`;
                  return (
                    <span className="text-2xl font-bold">{formattedPrice}</span>
                  );
                })()}
                <span className="text-sm text-muted-foreground">
                  (sample course price)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Hero Image ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              Hero Image
            </CardTitle>
            <CardDescription>
              This image appears in the hero section at the top of the landing
              page. It&apos;s the first thing visitors see — use a high-quality,
              eye-catching image. Recommended size: 800×600px or larger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              imageOnly
              maxSizeMB={5}
              folder="site/hero"
              currentUrl={heroImageUrl || null}
              onUpload={(url) => setHeroImageUrl(url)}
              onRemove={() => setHeroImageUrl("")}
              description="Upload a high-quality, eye-catching image. Recommended size: 800×600px or larger."
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* ── Featured Image ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              Featured Image
            </CardTitle>
            <CardDescription>
              This image appears in the call-to-action section near the bottom
              of the landing page. Great for showcasing a screenshot of the
              platform or a motivational visual. Recommended size: 700×500px or
              larger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              imageOnly
              maxSizeMB={5}
              folder="site/featured"
              currentUrl={featuredImageUrl || null}
              onUpload={(url) => setFeaturedImageUrl(url)}
              onRemove={() => setFeaturedImageUrl("")}
              description="Upload a screenshot or motivational visual. Recommended size: 700×500px or larger."
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* ── Testimonials ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="size-5" />
              Testimonials
            </CardTitle>
            <CardDescription>
              Manage the testimonials shown on your landing page. Add real
              reviews from learners to build trust. If no testimonials are
              added, default placeholder testimonials will be displayed. Maximum
              20 testimonials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonials.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                <MessageSquareQuote className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  No custom testimonials yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Default testimonials will be shown on the landing page. Add
                  your own to personalize.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTestimonial}
                  disabled={saving}
                >
                  <Plus className="size-4" />
                  Add First Testimonial
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {testimonials.map((t, index) => {
                  const isExpanded = expandedTestimonial === index;
                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-border/50 bg-background overflow-hidden transition-all"
                    >
                      {/* Collapsed header */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          setExpandedTestimonial(isExpanded ? null : index)
                        }
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                            disabled={index === 0 || saving}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTestimonial(index, "up");
                            }}
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                            disabled={
                              index === testimonials.length - 1 || saving
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTestimonial(index, "down");
                            }}
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </div>

                        {/* Avatar preview */}
                        <div
                          className={`flex size-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ${
                            t.color || avatarColors[index % avatarColors.length]
                          }`}
                        >
                          {t.initials || (t.name ? getInitials(t.name) : "?")}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.name || (
                              <span className="text-muted-foreground italic">
                                Unnamed
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.role || "No role"} · {"★".repeat(t.rating || 5)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTestimonial(index);
                            }}
                            disabled={saving}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded form */}
                      {isExpanded && (
                        <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Name *
                              </label>
                              <Input
                                placeholder="Sarah Chen"
                                value={t.name}
                                onChange={(e) =>
                                  updateTestimonial(
                                    index,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                disabled={saving}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Role / Title
                              </label>
                              <Input
                                placeholder="Software Developer"
                                value={t.role}
                                onChange={(e) =>
                                  updateTestimonial(
                                    index,
                                    "role",
                                    e.target.value,
                                  )
                                }
                                disabled={saving}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              Testimonial Text *
                            </label>
                            <Textarea
                              placeholder="Write what this person said about the platform..."
                              value={t.text}
                              onChange={(e) =>
                                updateTestimonial(index, "text", e.target.value)
                              }
                              rows={3}
                              disabled={saving}
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Rating
                              </label>
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      updateTestimonial(index, "rating", star)
                                    }
                                    disabled={saving}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`size-5 ${
                                        star <= (t.rating || 5)
                                          ? "fill-amber-400 text-amber-400"
                                          : "fill-muted text-muted-foreground/30"
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">
                                  {t.rating || 5}/5
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Avatar Color
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {avatarColors.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`size-6 rounded-full transition-all ${color} ${
                                      t.color === color
                                        ? "ring-2 ring-offset-2 ring-primary"
                                        : "hover:scale-110"
                                    }`}
                                    onClick={() =>
                                      updateTestimonial(index, "color", color)
                                    }
                                    disabled={saving}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {testimonials.length < 20 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestimonial}
                    disabled={saving}
                    className="w-full"
                  >
                    <Plus className="size-4" />
                    Add Testimonial
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {testimonials.length > 0
                ? `${testimonials.length} testimonial${testimonials.length !== 1 ? "s" : ""} configured. `
                : ""}
              Leave empty to use default testimonials on the landing page.
            </p>
          </CardContent>
        </Card>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Manage the FAQ section on your landing page. Add common questions
              and answers to help visitors. If no FAQs are added, default
              questions will be displayed. Maximum 30 FAQs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-8 text-center">
                <HelpCircle className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  No custom FAQs yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Default FAQs will be shown on the landing page. Add your own
                  to customize.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFaq}
                  disabled={saving}
                >
                  <Plus className="size-4" />
                  Add First FAQ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-border/50 bg-background overflow-hidden transition-all"
                    >
                      {/* Collapsed header */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          setExpandedFaq(isExpanded ? null : index)
                        }
                      >
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                            disabled={index === 0 || saving}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveFaq(index, "up");
                            }}
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                            disabled={index === faqs.length - 1 || saving}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveFaq(index, "down");
                            }}
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {faq.question || (
                              <span className="text-muted-foreground italic">
                                No question yet
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFaq(index);
                            }}
                            disabled={saving}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded form */}
                      {isExpanded && (
                        <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              Question *
                            </label>
                            <Input
                              placeholder="How does the points system work?"
                              value={faq.question}
                              onChange={(e) =>
                                updateFaq(index, "question", e.target.value)
                              }
                              disabled={saving}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              Answer *
                            </label>
                            <Textarea
                              placeholder="Provide a clear and helpful answer..."
                              value={faq.answer}
                              onChange={(e) =>
                                updateFaq(index, "answer", e.target.value)
                              }
                              rows={4}
                              disabled={saving}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {faqs.length < 30 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFaq}
                    disabled={saving}
                    className="w-full"
                  >
                    <Plus className="size-4" />
                    Add FAQ
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {faqs.length > 0
                ? `${faqs.length} FAQ${faqs.length !== 1 ? "s" : ""} configured. `
                : ""}
              Leave empty to use default FAQs on the landing page.
            </p>
          </CardContent>
        </Card>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FootprintsIcon className="size-5" />
              Footer
            </CardTitle>
            <CardDescription>
              Customize the footer section of your landing page. Set a custom
              tagline and manage the footer navigation links. Leave empty to use
              defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tagline */}
            <div className="space-y-2">
              <label
                htmlFor="footerTagline"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Type className="size-3.5 text-muted-foreground" />
                Footer Tagline
              </label>
              <Textarea
                id="footerTagline"
                placeholder="A gamified learning platform that makes education fun and rewarding..."
                value={footerTagline}
                onChange={(e) => setFooterTagline(e.target.value)}
                rows={2}
                maxLength={500}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Short description shown below the logo in the footer. Max 500
                characters.
              </p>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-muted-foreground" />
                  Platform Links
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addPlatformLink}
                  disabled={saving || platformLinks.length >= 10}
                  className="h-7 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>

              {platformLinks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No custom platform links. Defaults (Browse Courses,
                  Leaderboard, Sign Up, Log In) will be used.
                </p>
              ) : (
                <div className="space-y-2">
                  {platformLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) =>
                          updatePlatformLink(index, "label", e.target.value)
                        }
                        className="flex-1"
                        disabled={saving}
                      />
                      <Input
                        placeholder="/path or https://..."
                        value={link.href}
                        onChange={(e) =>
                          updatePlatformLink(index, "href", e.target.value)
                        }
                        className="flex-1"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        onClick={() => removePlatformLink(index)}
                        disabled={saving}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resource Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-muted-foreground" />
                  Resource Links
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addResourceLink}
                  disabled={saving || resourceLinks.length >= 10}
                  className="h-7 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>

              {resourceLinks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No custom resource links. Defaults (Features, How It Works,
                  Testimonials, FAQ) will be used.
                </p>
              ) : (
                <div className="space-y-2">
                  {resourceLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) =>
                          updateResourceLink(index, "label", e.target.value)
                        }
                        className="flex-1"
                        disabled={saving}
                      />
                      <Input
                        placeholder="#section or https://..."
                        value={link.href}
                        onChange={(e) =>
                          updateResourceLink(index, "href", e.target.value)
                        }
                        className="flex-1"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        onClick={() => removeResourceLink(index)}
                        disabled={saving}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer preview */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Footer Preview
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <div className="flex size-7 items-center justify-center rounded overflow-hidden bg-muted border">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                        <path d="M22 10v6" />
                        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm font-bold">
                    {platformName.trim() || "LearnHub"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  {footerTagline.trim() ||
                    "A gamified learning platform that makes education fun and rewarding."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Save ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <p className="text-muted-foreground text-sm flex-1">
            {settings.id
              ? "Changes are saved to the database and reflected immediately across the site."
              : "First time setup — this will create the site configuration."}
          </p>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
