"use client";

import { useState, useEffect, useCallback } from "react";

interface Branding {
  platformName: string;
  logoUrl: string | null;
}

const DEFAULT_PLATFORM_NAME = "LearnHub";
const DEFAULT_BRANDING: Branding = {
  platformName: DEFAULT_PLATFORM_NAME,
  logoUrl: null,
};

// Module-level cache so the fetch only happens once across all components
let cachedBranding: Branding | null = null;
let fetchPromise: Promise<Branding> | null = null;

async function fetchBranding(): Promise<Branding> {
  try {
    const res = await fetch("/api/site-settings");
    if (res.ok) {
      const data = await res.json();
      return {
        platformName: data.settings?.platformName || DEFAULT_PLATFORM_NAME,
        logoUrl: data.settings?.logoUrl || null,
      };
    }
  } catch {
    // Silently fall back to defaults
  }
  return { ...DEFAULT_BRANDING };
}

export function useBranding(): Branding & { loading: boolean } {
  const [branding, setBranding] = useState<Branding>(
    () => cachedBranding ?? { ...DEFAULT_BRANDING },
  );
  const [loading, setLoading] = useState(() => !cachedBranding);

  const load = useCallback(() => {
    if (cachedBranding) return;

    // Deduplicate concurrent fetches
    if (!fetchPromise) {
      fetchPromise = fetchBranding();
    }

    let cancelled = false;

    fetchPromise.then((result) => {
      if (cancelled) return;
      cachedBranding = result;
      setBranding(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return { ...branding, loading };
}

/**
 * Invalidate the cached branding so the next call to useBranding()
 * will re-fetch from the server. Useful after the admin saves new settings.
 */
export function invalidateBrandingCache() {
  cachedBranding = null;
  fetchPromise = null;
}
