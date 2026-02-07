"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Save, ExternalLink, Trash2, Eye } from "lucide-react";

interface SiteSettings {
  id: string | null;
  heroImageUrl: string | null;
  featuredImageUrl: string | null;
}

export default function LandingPageAdmin() {
  const [settings, setSettings] = useState<SiteSettings>({
    id: null,
    heroImageUrl: null,
    featuredImageUrl: null,
  });
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroImageUrl: heroImageUrl.trim() || null,
          featuredImageUrl: featuredImageUrl.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save settings.");
        return;
      }

      setSettings(data.settings);
      setSuccess("Landing page settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save settings. Try again.");
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
          <h1 className="text-2xl font-bold">Landing Page</h1>
          <p className="text-muted-foreground mt-1">
            Customize the images displayed on the public landing page.
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

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Hero Image */}
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
            <div className="space-y-2">
              <Label htmlFor="heroImageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                />
                {heroImageUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHeroImageUrl("")}
                    title="Clear"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Paste a direct link to an image. You can use services like
                Unsplash, Imgur, or any image hosting.
              </p>
            </div>

            {/* Preview */}
            {heroImageUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Preview</Label>
                <div className="relative overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="h-64 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {!heroImageUrl && (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                <div className="text-center">
                  <ImageIcon className="mx-auto size-10 text-muted-foreground opacity-40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hero image set — a gradient placeholder will be shown
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Image */}
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
            <div className="space-y-2">
              <Label htmlFor="featuredImageUrl">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="featuredImageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                />
                {featuredImageUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFeaturedImageUrl("")}
                    title="Clear"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Paste a direct link to an image. You can use services like
                Unsplash, Imgur, or any image hosting.
              </p>
            </div>

            {/* Preview */}
            {featuredImageUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Preview</Label>
                <div className="relative overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={featuredImageUrl}
                    alt="Featured preview"
                    className="h-64 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {!featuredImageUrl && (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                <div className="text-center">
                  <ImageIcon className="mx-auto size-10 text-muted-foreground opacity-40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No featured image set — a gradient placeholder will be shown
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <p className="text-muted-foreground text-sm flex-1">
            {settings.id
              ? "Changes are saved to the database and reflected immediately on the landing page."
              : "First time setup — this will create the landing page configuration."}
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
