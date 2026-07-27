"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Trash2,
  ArrowRight,
  History as HistoryIcon,
} from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import { PASS_PCT, DIFFICULTY_META } from "@/lib/questions";
import { formatDuration, formatDate } from "@/lib/session-utils";
import { Donut } from "@/components/charts/donut";
import { DomainBars } from "@/components/charts/domain-bars";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Attempt } from "@/lib/types";

export function HistoryList() {
  const hydrated = useHydrated();
  const history = useStore((s) => s.history);
  const clearHistory = useStore((s) => s.clearHistory);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary/60" />;
  }

  if (history.length === 0) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          <HistoryIcon className="size-6" />
        </span>
        <div>
          <p className="font-semibold">No runs yet</p>
          <p className="text-sm text-muted-foreground">
            Finish a session and it will appear here.
          </p>
        </div>
        <Link
          href="/practice"
          className={cn(
            buttonVariants(),
            "mt-1 h-10 bg-brand px-4 text-ink hover:bg-brand-deep hover:text-white",
          )}
        >
          Start your first run
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (confirm("Clear all history? This cannot be undone.")) {
              clearHistory();
            }
          }}
          className="text-[12.5px] font-medium text-muted-foreground hover:text-no"
        >
          Clear history
        </button>
      </div>
      <div className="stagger space-y-3">
        {history.map((attempt, i) => (
          <div key={attempt.id} style={{ "--i": i } as React.CSSProperties}>
            <HistoryCard
              attempt={attempt}
              number={history.length - i}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryCard({
  attempt,
  number,
}: {
  attempt: Attempt;
  number: number;
}) {
  const [open, setOpen] = useState(false);
  const deleteAttempt = useStore((s) => s.deleteAttempt);
  const passed = attempt.scorePct >= PASS_PCT;
  const incorrect = attempt.total - attempt.correct;

  const segments = [
    { value: attempt.correct, color: "var(--ok)", label: "Correct" },
    { value: incorrect, color: "var(--no)", label: "Incorrect" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <Donut segments={segments} size={72} thickness={9}>
          <span className="font-mono text-[13px] font-bold tnum">
            {attempt.scorePct}%
          </span>
        </Donut>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[15px] font-bold">
              Attempt {number}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                passed ? "bg-ok-tint text-ok" : "bg-no-tint text-no",
              )}
            >
              {passed ? "Pass" : "Fail"}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {attempt.mode}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {attempt.correct}/{attempt.total} correct ·{" "}
            {formatDuration(attempt.durationSec)}
          </p>
          <p className="text-[12px] text-faint">
            {formatDate(attempt.date)} ·{" "}
            {attempt.config.difficulty === "mixed"
              ? "Mixed"
              : DIFFICULTY_META[attempt.config.difficulty].name}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-muted-foreground hover:bg-secondary"
          >
            Domains
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-4 sm:px-5">
              <DomainBars breakdown={attempt.breakdown} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2.5 sm:px-5">
        <button
          onClick={() => deleteAttempt(attempt.id)}
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-no"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
        <Link
          href={`/results/${attempt.id}`}
          className="flex items-center gap-1.5 text-[12.5px] font-bold text-brand-deep hover:gap-2.5"
          style={{ transition: "gap 0.15s ease-out" }}
        >
          Review questions <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
