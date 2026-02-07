"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Search, BookOpen, Trophy, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Browse & Enroll",
    description:
      "Explore our catalog of expertly crafted courses. Find what interests you and enroll instantly — many courses are completely free.",
    color:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    ring: "ring-blue-500/20",
    gradient: "from-blue-500/10 to-blue-500/[0.02]",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Learn & Practice",
    description:
      "Work through lessons at your own pace — watch videos, read documents, and test your understanding with interactive quizzes.",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500/10 to-emerald-500/[0.02]",
  },
  {
    number: "03",
    icon: Trophy,
    title: "Earn & Compete",
    description:
      "Ace quizzes to earn points, unlock achievement badges, and climb the leaderboard. The better you score, the more you earn.",
    color:
      "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500/10 to-amber-500/[0.02]",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-20 sm:py-28"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary/70">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Three simple steps to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              start learning
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Getting started is easy. Browse, learn, and earn — all in one
            platform designed to make education fun.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
          {/* Connecting line (desktop only) */}
          <div className="pointer-events-none absolute top-[72px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden md:block">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="h-[2px] w-full origin-left bg-gradient-to-r from-blue-500/30 via-emerald-500/30 to-amber-500/30"
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.15,
                ease: "easeOut",
              }}
              className="group relative flex flex-col items-center text-center"
            >
              {/* Step number + icon */}
              <div className="relative mb-6">
                {/* Outer ring */}
                <div
                  className={`flex size-[88px] items-center justify-center rounded-2xl border-2 border-border/50 bg-background shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-primary/20 group-hover:-translate-y-1`}
                >
                  <div
                    className={`flex size-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${step.color}`}
                  >
                    <step.icon className="size-6" />
                  </div>
                </div>

                {/* Step number badge */}
                <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                  {step.number}
                </div>
              </div>

              {/* Arrow between steps (mobile only) */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.15 }}
                  className="my-2 flex items-center justify-center text-muted-foreground/40 md:hidden"
                >
                  <ArrowRight className="size-5 rotate-90" />
                </motion.div>
              )}

              {/* Content */}
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {step.title}
              </h3>

              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* Subtle background glow on hover */}
              <div
                className={`pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${step.gradient}`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
