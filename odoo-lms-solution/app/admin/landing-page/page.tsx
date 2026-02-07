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
import {
  ImageIcon,
  Save,
  ExternalLink,
  Eye,
  Palette,
  Type,
} from "lucide-react";

interface SiteSettings {
  id: string | null;
  platformName: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  featuredImageUrl: string | null;
}

export default function SiteSettingsAdmin() {
  const [settings, setSettings] = useState<SiteSettings>({
    id: null,
    platformName: null,
    logoUrl: null,
    heroImageUrl: null,
    featuredImageUrl: null,
  });
  const [platformName, setPlatformName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save settings.");
        return;
      }

      setSettings(data.settings);
      // Invalidate branding cache so sidebars and other components pick up the changes
      invalidateBrandingCache();
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
