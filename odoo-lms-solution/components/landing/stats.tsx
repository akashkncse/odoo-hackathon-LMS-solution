"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { BookOpen, Users, Brain, TrendingUp } from "lucide-react";

interface StatsProps {
  stats: {
    courses: number;
    learners: number;
    quizzes: number;
    completionRate: number;
  };
}

function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const endValue = value;

    function animate(currentTime: number) {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

const statItems = [
  {
    key: "courses" as const,
    label: "Courses Available",
    icon: BookOpen,
    suffix: "+",
    color:
      "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    key: "learners" as const,
    label: "Active Learners",
    icon: Users,
    suffix: "+",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    key: "quizzes" as const,
    label: "Quizzes Created",
    icon: Brain,
    suffix: "+",
    color:
      "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    key: "completionRate" as const,
    label: "Completion Rate",
    icon: TrendingUp,
    suffix: "%",
    color:
      "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
];

export function Stats({ stats }: StatsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary/70">
            Platform Stats
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Trusted by learners everywhere
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {statItems.map((item, index) => {
            const value = stats[item.key];
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div
                  className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-xl ${item.color}`}
                >
                  <item.icon className="size-5" />
                </div>

                <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  <AnimatedCounter
                    value={value}
                    suffix={item.suffix}
                    duration={2}
                  />
                </p>

                <p className="mt-1.5 text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
