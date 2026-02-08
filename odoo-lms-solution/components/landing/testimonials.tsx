"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface TestimonialItem {
  name: string;
  role: string;
  initials: string;
  color: string;
  rating: number;
  text: string;
}

const defaultTestimonials: TestimonialItem[] = [
  {
    name: "Sarah Chen",
    role: "Software Developer",
    initials: "SC",
    color: "bg-blue-500",
    rating: 5,
    text: "The gamified points system completely changed how I approach learning. I used to procrastinate on courses, but now I'm genuinely excited to ace quizzes and climb the leaderboard!",
  },
  {
    name: "Marcus Johnson",
    role: "Data Analyst",
    initials: "MJ",
    color: "bg-emerald-500",
    rating: 5,
    text: "What I love most is the instant feedback on quizzes. Knowing exactly where I went wrong helps me learn so much faster. Plus, earning badges is surprisingly motivating.",
  },
  {
    name: "Priya Sharma",
    role: "UX Designer",
    initials: "PS",
    color: "bg-purple-500",
    rating: 5,
    text: "I've tried many online learning platforms, but this one stands out. The course content is well-structured, and the points system adds a fun competitive edge that keeps me coming back.",
  },
  {
    name: "Alex Rivera",
    role: "Marketing Manager",
    initials: "AR",
    color: "bg-amber-500",
    rating: 5,
    text: "Our team uses this platform for professional development. The leaderboard has sparked a healthy competition among colleagues — everyone wants to be #1!",
  },
  {
    name: "Emily Watson",
    role: "Graduate Student",
    initials: "EW",
    color: "bg-rose-500",
    rating: 5,
    text: "As a student, I appreciate that many courses are free. The quiz-based learning approach really helps me retain information better than passive video watching.",
  },
  {
    name: "David Kim",
    role: "Product Manager",
    initials: "DK",
    color: "bg-cyan-500",
    rating: 5,
    text: "The progress tracking is excellent — I can see exactly where I am in each course. And the diminishing points system for retries is clever; it rewards genuine understanding.",
  },
];

const avatarColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

interface TestimonialsProps {
  testimonials?: TestimonialItem[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  // Use provided testimonials or fall back to defaults
  const items = (
    testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials
  ).map((t, i) => ({
    ...t,
    // Auto-generate initials and color if not provided
    initials: t.initials || getInitials(t.name),
    color: t.color || avatarColors[i % avatarColors.length],
    rating: t.rating ?? 5,
  }));

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary/70">
            Testimonials
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              learners
            </span>{" "}
            everywhere
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Don&apos;t just take our word for it — hear from learners who have
            transformed their education journey with our platform.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20"
            >
              {/* Quote icon */}
              <div className="pointer-events-none absolute -right-2 -top-2 text-primary/[0.04]">
                <Quote className="size-24" strokeWidth={1} />
              </div>

              {/* Subtle gradient on hover */}
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Stars */}
              <div className="mb-4">
                <StarRating rating={testimonial.rating} />
              </div>

              {/* Review text */}
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                <Avatar className="size-10">
                  <AvatarFallback
                    className={`${testimonial.color} text-white text-xs font-bold`}
                  >
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
