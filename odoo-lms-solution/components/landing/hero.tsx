"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

interface HeroProps {
  heroImageUrl: string | null;
  platformName?: string;
}

export function Hero({ heroImageUrl, platformName = "LearnHub" }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-4rem)] items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          {/* Left: Text content */}
          <div className="flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              Now open for enrollments
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Learn Smarter.{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Earn Rewards.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              A gamified learning platform where every quiz you ace earns you
              points, every milestone unlocks badges, and every step moves you
              up the leaderboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Button size="lg" className="h-12 px-7 text-base" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-7 text-base"
                asChild
              >
                <Link href="/dashboard/courses">
                  <Play className="mr-1 size-4" />
                  Browse Courses
                </Link>
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-2.5">
                {[
                  "bg-blue-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-purple-500",
                ].map((color, i) => (
                  <div
                    key={i}
                    className={`flex size-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white ${color}`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">
                  Join learners
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  already leveling up
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[560px]">
              {/* Decorative elements behind the image */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent blur-2xl" />
              <div className="absolute -right-6 -top-6 -z-10 size-24 rounded-full bg-primary/10 blur-xl" />
              <div className="absolute -bottom-4 -left-4 -z-10 size-32 rounded-full bg-primary/[0.07] blur-xl" />

              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt={`${platformName} platform preview`}
                  className="relative w-full rounded-2xl border border-border/50 shadow-2xl shadow-primary/[0.08] object-cover aspect-[4/3]"
                />
              ) : (
                /* Gradient placeholder with illustration */
                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.08] via-muted to-primary/[0.04] shadow-2xl shadow-primary/[0.08]">
                  {/* Faux dashboard illustration */}
                  <div className="w-[85%] space-y-4 p-6">
                    {/* Title bar */}
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-red-400/70" />
                      <div className="size-3 rounded-full bg-yellow-400/70" />
                      <div className="size-3 rounded-full bg-green-400/70" />
                      <div className="ml-4 h-3 w-32 rounded-full bg-foreground/10" />
                    </div>
                    {/* Fake cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Courses",
                          value: "12",
                          color: "bg-blue-500/20 text-blue-600",
                        },
                        {
                          label: "Points",
                          value: "850",
                          color: "bg-emerald-500/20 text-emerald-600",
                        },
                        {
                          label: "Rank",
                          value: "#3",
                          color: "bg-amber-500/20 text-amber-600",
                        },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className="rounded-xl border border-border/30 bg-background/60 p-3 backdrop-blur-sm"
                        >
                          <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                            {card.label}
                          </p>
                          <p
                            className={`mt-1 text-lg font-bold sm:text-xl ${card.color.split(" ")[1]}`}
                          >
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Fake progress bars */}
                    <div className="space-y-2.5 rounded-xl border border-border/30 bg-background/60 p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="h-2.5 w-24 rounded-full bg-foreground/10" />
                        <div className="h-2.5 w-8 rounded-full bg-foreground/10" />
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                        <div className="h-full w-[72%] rounded-full bg-primary/50" />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-2.5 w-28 rounded-full bg-foreground/10" />
                        <div className="h-2.5 w-8 rounded-full bg-foreground/10" />
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                        <div className="h-full w-[45%] rounded-full bg-emerald-500/50" />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-2.5 w-20 rounded-full bg-foreground/10" />
                        <div className="h-2.5 w-8 rounded-full bg-foreground/10" />
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                        <div className="h-full w-[90%] rounded-full bg-amber-500/50" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="absolute -right-3 top-6 rounded-xl border border-border/50 bg-background/90 px-4 py-2.5 shadow-lg backdrop-blur-sm sm:-right-6"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-xs font-semibold">+10 Points!</p>
                    <p className="text-[10px] text-muted-foreground">
                      Perfect score
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Floating streak badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="absolute -left-3 bottom-8 rounded-xl border border-border/50 bg-background/90 px-4 py-2.5 shadow-lg backdrop-blur-sm sm:-left-6"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="text-xs font-semibold">Level Up!</p>
                    <p className="text-[10px] text-muted-foreground">
                      New badge unlocked
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
