"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

interface FooterProps {
  platformName?: string;
  logoUrl?: string | null;
}

const footerLinks = {
  platform: [
    { label: "Browse Courses", href: "/dashboard/courses" },
    { label: "Leaderboard", href: "/dashboard/points" },
    { label: "Sign Up", href: "/signup" },
    { label: "Log In", href: "/login" },
  ],
  resources: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ],
};

export function Footer({ platformName = "LearnHub", logoUrl }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid gap-10 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              {logoUrl ? (
                <div className="flex size-9 items-center justify-center rounded-lg overflow-hidden bg-muted transition-transform group-hover:scale-105">
                  <img
                    src={logoUrl}
                    alt={platformName}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                  <GraduationCap className="size-5" />
                </div>
              )}
              <span className="text-lg font-bold tracking-tight">
                {platformName}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A gamified learning platform that makes education fun and
              rewarding. Earn points, unlock badges, and climb the leaderboard
              as you learn.
            </p>

            {/* Social proof mini */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["bg-blue-500", "bg-emerald-500", "bg-amber-500"].map(
                  (color, i) => (
                    <div
                      key={i}
                      className={`flex size-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white ${color}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ),
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Trusted by learners worldwide
              </p>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Platform
            </h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/40 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {platformName}. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Built with</span>
            <span className="text-red-500">❤</span>
            <span>for learners everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
