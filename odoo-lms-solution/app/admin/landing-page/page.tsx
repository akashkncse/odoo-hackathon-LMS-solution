"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { ImageIcon, Save, ExternalLink, Eye } from "lucide-react";

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
        toast.error(data.error || "Failed to save settings.");
        return;
      }

      setSettings(data.settings);
      toast.success("Landing page settings saved successfully!");
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
