"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTAProps {
  featuredImageUrl: string | null;
}

export function CTA({ featuredImageUrl }: CTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.03]">
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/[0.05] blur-3xl" />
            <div className="absolute -bottom-20 -left-20 size-72 rounded-full bg-primary/[0.05] blur-3xl" />
          </div>

          <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="size-3.5" />
                Start your journey today
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                Ready to transform the way you{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  learn?
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Join our community of learners who are earning points, unlocking
                badges, and making education an adventure. Sign up for free and
                start your first course in minutes.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" className="h-12 px-7 text-base" asChild>
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-7 text-base"
                  asChild
                >
                  <Link href="/dashboard/courses">Browse Courses</Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Free to start
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Earn rewards instantly
                </span>
              </div>
            </motion.div>

            {/* Right: Featured image */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full max-w-[480px]">
                {/* Decorative glow */}
                <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent blur-2xl" />

                {featuredImageUrl ? (
                  <img
                    src={featuredImageUrl}
                    alt="Start learning on LearnHub"
                    className="w-full rounded-2xl border border-border/50 shadow-xl object-cover aspect-[4/3]"
                  />
                ) : (
                  /* Gradient placeholder with motivational illustration */
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.08] via-muted to-primary/[0.04] shadow-xl">
                    <div className="flex flex-col items-center gap-4 p-8 text-center">
                      {/* Trophy illustration */}
                      <div className="relative">
                        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 sm:size-24">
                          <span className="text-4xl sm:text-5xl">🎓</span>
                        </div>
                        {/* Floating particles */}
                        <motion.div
                          animate={{ y: [-4, 4, -4] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute -right-3 -top-3 flex size-10 items-center justify-center rounded-xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
                        >
                          <span className="text-lg">⭐</span>
                        </motion.div>
                        <motion.div
                          animate={{ y: [4, -4, 4] }}
                          transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute -bottom-2 -left-4 flex size-10 items-center justify-center rounded-xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
                        >
                          <span className="text-lg">🏆</span>
                        </motion.div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-base font-semibold text-foreground sm:text-lg">
                          Your next achievement awaits
                        </p>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          Courses, quizzes, points, and badges — all in one
                          place
                        </p>
                      </div>

                      {/* Fake progress bar */}
                      <div className="w-full max-w-[200px] space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Progress</span>
                          <span>Get started!</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={isInView ? { width: "15%" } : {}}
                            transition={{
                              duration: 1.5,
                              delay: 0.8,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
