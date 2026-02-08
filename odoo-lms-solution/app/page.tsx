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

interface Testimonial {
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

interface FooterLinks {
  platform: { label: string; href: string }[];
  resources: { label: string; href: string }[];
}

interface SiteSettings {
  platformName: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  featuredImageUrl: string | null;
  footerTagline: string | null;
  footerLinks: FooterLinks | null;
  testimonials: Testimonial[] | null;
  faqs: FAQItem[] | null;
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
    platformName: null,
    logoUrl: null,
    heroImageUrl: null,
    featuredImageUrl: null,
    footerTagline: null,
    footerLinks: null,
    testimonials: null,
    faqs: null,
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
      <Navbar
        platformName={settings.platformName ?? undefined}
        logoUrl={settings.logoUrl}
      />
      <main>
        <Hero
          heroImageUrl={settings.heroImageUrl}
          platformName={settings.platformName ?? undefined}
        />
        <Stats stats={stats} />
        <Features />
        <HowItWorks />
        <Testimonials testimonials={settings.testimonials ?? undefined} />
        <FAQ faqs={settings.faqs ?? undefined} />
        <CTA
          featuredImageUrl={settings.featuredImageUrl}
          platformName={settings.platformName ?? undefined}
        />
      </main>
      <Footer
        platformName={settings.platformName ?? undefined}
        logoUrl={settings.logoUrl}
        tagline={settings.footerTagline ?? undefined}
        links={settings.footerLinks ?? undefined}
      />
    </div>
  );
}
