"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

interface SiteSettings {
  id: string | null;
  platformName: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  featuredImageUrl: string | null;
  currency: string | null;
}

export default function SiteSettingsAdmin() {
  const [settings, setSettings] = useState<SiteSettings>({
    id: null,
    platformName: null,
    logoUrl: null,
    heroImageUrl: null,
    featuredImageUrl: null,
    currency: null,
  });
  const [platformName, setPlatformName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
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
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: platformName.trim() || null,
          logoUrl: logoUrl.trim() || null,
          heroImageUrl: heroImageUrl.trim() || null,
          featuredImageUrl: featuredImageUrl.trim() || null,
          currency: currency || "INR",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save settings.");
        return;
      }

      setSettings(data.settings);
      // Invalidate branding & currency cache so all components pick up the changes
      invalidateBrandingCache();
      invalidateCurrencyCache();
      toast.success("Site settings saved successfully!");
    } catch {
      toast.error("Failed to save settings. Try again.");
    } finally {
      setSaving(false);
    }
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
            Customize your platform branding and landing page images.
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
