"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

interface SiteSettings {
  heroImageUrl: string | null;
  featuredImageUrl: string | null;
}

interface PlatformStats {
  courses: number;
  learners: number;
  quizzes: number;
  completionRate: number;
}

const defaultStats: PlatformStats = {
  courses: 0,
  learners: 0,
  quizzes: 0,
  completionRate: 0,
};

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings>({
    heroImageUrl: null,
    featuredImageUrl: null,
  });
  const [stats, setStats] = useState<PlatformStats>(defaultStats);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, statsRes] = await Promise.all([
          fetch("/api/site-settings"),
          fetch("/api/stats"),
        ]);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData.settings);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch {
        // Silently fail — landing page still works with defaults
      }
    }

    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main>
        <Hero heroImageUrl={settings.heroImageUrl} />
        <Stats stats={stats} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTA featuredImageUrl={settings.featuredImageUrl} />
      </main>
      <Footer />
    </div>
  );
}
