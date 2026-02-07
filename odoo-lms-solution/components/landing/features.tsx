"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Brain,
  Trophy,
  BarChart3,
  BookOpen,
  Medal,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Interactive Quizzes",
    description:
      "Test your knowledge with engaging multiple-choice quizzes after every lesson. Instant feedback helps you learn faster.",
    color:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    borderHover: "group-hover:border-blue-500/30",
  },
  {
    icon: Trophy,
    title: "Gamified Points",
    description:
      "Earn points for every perfect quiz score. First attempts earn the most — rewarding mastery over memorization.",
    color:
      "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    borderHover: "group-hover:border-amber-500/30",
  },
  {
    icon: Users,
    title: "Live Leaderboard",
    description:
      "Compete with fellow learners on a real-time leaderboard. See where you rank and push yourself to climb higher.",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    borderHover: "group-hover:border-emerald-500/30",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Track your learning journey with detailed progress indicators for every course and lesson you take.",
    color:
      "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    borderHover: "group-hover:border-purple-500/30",
  },
  {
    icon: BookOpen,
    title: "Rich Course Content",
    description:
      "Learn through videos, documents, images, and quizzes — all organized into structured, easy-to-follow courses.",
    color:
      "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    borderHover: "group-hover:border-rose-500/30",
  },
  {
    icon: Medal,
    title: "Badges & Achievements",
    description:
      "Unlock badges as you accumulate points. Each badge level represents a new milestone in your learning journey.",
    color:
      "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
    borderHover: "group-hover:border-cyan-500/30",
  },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={sectionRef} className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary/70">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              love learning
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our platform combines the best of education and gaming to keep you
            motivated, engaged, and constantly progressing.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${feature.borderHover}`}
            >
              {/* Subtle gradient on hover */}
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div
                className={`mb-4 flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${feature.color}`}
              >
                <feature.icon className="size-5" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
