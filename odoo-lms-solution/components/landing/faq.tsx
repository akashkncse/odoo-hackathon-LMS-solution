"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is the platform free to use?",
    answer:
      "Yes! Many courses on our platform are completely free and open to everyone. Some premium courses may require payment or an invitation from the instructor, but there's always plenty of free content to get you started.",
  },
  {
    question: "How does the points system work?",
    answer:
      "You earn points by scoring perfectly on quizzes. The first time you ace a quiz, you earn the maximum points (typically 10). If you need a second attempt, you earn slightly fewer points (7), and so on. This system rewards genuine mastery — the better you understand the material on your first try, the more you earn.",
  },
  {
    question: "What are badges and how do I unlock them?",
    answer:
      "Badges are achievement levels that you unlock as you accumulate points across the platform. Each badge has a minimum point threshold. As you complete more quizzes and earn more points, you'll automatically level up to higher badge tiers — from beginner all the way to expert and beyond.",
  },
  {
    question: "Can I retake a quiz if I don't pass?",
    answer:
      "Absolutely! You can retake any quiz as many times as you like. However, points are only awarded for your first perfect score. Subsequent attempts still help you learn, and you can always review your previous answers to understand where you went wrong.",
  },
  {
    question: "What types of content are available in courses?",
    answer:
      "Courses can include a variety of content types: video lessons for visual learning, documents and reading materials, images and diagrams, and interactive quizzes to test your understanding. Instructors combine these to create engaging, well-rounded learning experiences.",
  },
  {
    question: "How does the leaderboard work?",
    answer:
      "The leaderboard ranks all learners on the platform by their total points. It updates in real-time as you earn points from quizzes. You can see your rank, how many points you need to overtake the person above you, and celebrate as you climb higher. It's a great way to stay motivated!",
  },
  {
    question: "Can instructors create their own courses?",
    answer:
      "Yes! Instructors and administrators can create courses, add lessons with various content types, build quizzes with custom point values, and manage enrollments. The course editor is intuitive and lets you structure content exactly how you want.",
  },
  {
    question: "Do I need to create an account to browse courses?",
    answer:
      "You can browse publicly visible courses without an account. However, to enroll in a course, take quizzes, earn points, and appear on the leaderboard, you'll need to sign up — it's quick and free!",
  },
];

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section id="faq" ref={sectionRef} className="relative py-20 sm:py-28">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary/70">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about the platform. Can&apos;t find what
            you&apos;re looking for? Feel free to reach out to us.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto max-w-3xl"
        >
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-border/40 px-6"
                >
                  <AccordionTrigger className="py-5 text-left text-[15px] font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
