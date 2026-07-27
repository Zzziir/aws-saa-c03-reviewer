"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, ListChecks } from "lucide-react";
import type { Attempt } from "@/lib/types";
import { PASS_PCT } from "@/lib/questions";
import { formatDuration, formatDate } from "@/lib/session-utils";
import { Donut } from "@/components/charts/donut";
import { DomainBars } from "@/components/charts/domain-bars";
import { AnswerReview } from "./answer-review";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ResultsView({
  attempt,
  celebrate = false,
}: {
  attempt: Attempt;
  celebrate?: boolean;
}) {
  const incorrect = attempt.answers.filter(
    (a) => a.selected.length > 0 && !a.correct,
  ).length;
  const skipped = attempt.answers.filter((a) => a.selected.length === 0).length;
  const passed = attempt.scorePct >= PASS_PCT;

  const segments = [
    { value: attempt.correct, color: "var(--ok)", label: "Correct" },
    { value: incorrect, color: "var(--no)", label: "Incorrect" },
    { value: skipped, color: "var(--skip)", label: "Skipped" },
  ];

  return (
    <div className="space-y-5">
      {/* Score hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
          <Donut segments={segments} size={190}>
            <div>
              <div className="font-display text-4xl font-bold tnum">
                {attempt.scorePct}
                <span className="text-2xl">%</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {attempt.correct}/{attempt.total} correct
              </div>
            </div>
          </Donut>

          <div className="flex-1 text-center sm:text-left">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide",
                passed ? "bg-ok-tint text-ok" : "bg-no-tint text-no",
              )}
            >
              <Trophy className="size-3.5" />
              {passed ? "Passing score" : "Below pass line"}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              {celebrate ? "Run complete" : "Attempt review"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {attempt.mode === "exam" ? "Exam mode" : "Reviewer mode"} ·{" "}
              {formatDuration(attempt.durationSec)} · {formatDate(attempt.date)}
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Pass line is {PASS_PCT}%. You need{" "}
              {Math.max(0, Math.ceil((PASS_PCT / 100) * attempt.total)) -
                attempt.correct >
              0
                ? `${
                    Math.ceil((PASS_PCT / 100) * attempt.total) -
                    attempt.correct
                  } more correct`
                : "no more — you cleared it"}
              .
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-3 text-center sm:justify-start">
              <Legend color="var(--ok)" label="Correct" value={attempt.correct} />
              <Legend color="var(--no)" label="Incorrect" value={incorrect} />
              <Legend color="var(--skip)" label="Skipped" value={skipped} />
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
              <Link
                href="/practice"
                className={cn(
                  buttonVariants(),
                  "h-10 bg-solid px-4 text-solid-foreground hover:bg-solid/90",
                )}
              >
                <RotateCcw className="size-4" /> New run
              </Link>
              <Link
                href="/analytics"
                className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}
              >
                <ListChecks className="size-4" /> Analytics
              </Link>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "ghost" }), "h-10 px-4")}
              >
                <Home className="size-4" /> Home
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Domains */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold">Performance by domain</h2>
        <DomainBars breakdown={attempt.breakdown} />
      </div>

      {/* Review */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Review questions</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Correct answers are green; your incorrect picks are red.
        </p>
        <AnswerReview attempt={attempt} />
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-sm" style={{ background: color }} />
      <span className="text-[13px] font-semibold tnum">{value}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}
