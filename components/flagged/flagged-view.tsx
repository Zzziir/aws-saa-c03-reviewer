"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Bookmark, Lightbulb, Play } from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import { getQuestion, DOMAIN_META, DIFFICULTY_META } from "@/lib/questions";
import { answerIndices } from "@/lib/session-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function FlaggedView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const flaggedIds = useStore((s) => s.flaggedIds);
  const toggleFlag = useStore((s) => s.toggleFlag);
  const startFromQuestions = useStore((s) => s.startFromQuestions);
  const [open, setOpen] = useState<number | null>(null);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary/60" />;
  }

  const questions = flaggedIds
    .map((id) => getQuestion(id))
    .filter((q): q is NonNullable<typeof q> => !!q);

  if (questions.length === 0) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Bookmark className="size-6" />
        </span>
        <div>
          <p className="font-semibold">No flagged questions</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap the flag icon on any question during a run — or in a review —
            to save it here for later.
          </p>
        </div>
        <Link
          href="/practice"
          className={cn(
            buttonVariants(),
            "mt-1 h-10 bg-brand px-4 text-ink hover:bg-brand-deep hover:text-white",
          )}
        >
          Start a run
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm">
          <span className="font-bold">{questions.length}</span> question
          {questions.length === 1 ? "" : "s"} flagged for review.
        </p>
        <Button
          onClick={() => {
            startFromQuestions(flaggedIds, "reviewer");
            router.push("/session");
          }}
          className="bg-brand text-ink hover:bg-brand-deep hover:text-white"
        >
          <Play className="size-4 fill-current" /> Practice these
        </Button>
      </div>

      <div className="stagger space-y-2.5">
        {questions.map((q, idx) => {
          const isOpen = open === q.id;
          const correct = answerIndices(q);
          const meta = DOMAIN_META[q.domain];
          return (
            <div
              key={q.id}
              style={{ "--i": idx } as React.CSSProperties}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <button
                onClick={() => setOpen(isOpen ? null : q.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/40"
              >
                <Bookmark className="size-4 shrink-0 fill-brand-deep text-brand-deep" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                      style={{ background: `${meta.hue}1a`, color: meta.hue }}
                    >
                      {meta.short}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-faint">
                      {DIFFICULTY_META[q.difficulty].name}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13.5px] font-medium">
                    {q.question}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-4 pb-4 pt-3">
                      <p className="mb-3 text-[14.5px] font-medium leading-relaxed">
                        {q.question}
                      </p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, i) => {
                          const isRight = correct.includes(i);
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg border-[1.5px] px-3 py-2.5 text-[13.5px]",
                                isRight
                                  ? "border-ok bg-ok-tint"
                                  : "border-border",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded text-[11px] font-bold",
                                  isRight
                                    ? "bg-ok text-white"
                                    : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {isRight ? (
                                  <Check className="size-3" />
                                ) : (
                                  LETTERS[i]
                                )}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 rounded-lg bg-secondary/50 p-3">
                        <p className="text-[13px] leading-relaxed text-foreground/90">
                          {q.explanation}
                        </p>
                        {q.keyTakeaway && (
                          <p className="mt-2.5 flex items-start gap-2 rounded-md bg-brand-tint px-2.5 py-1.5 font-mono text-[11px] font-medium leading-relaxed text-brand-deep">
                            <Lightbulb className="mt-0.5 size-3 shrink-0" />
                            {q.keyTakeaway}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFlag(q.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-deep"
                      >
                        <Bookmark className="size-3.5 fill-brand-deep" />
                        Remove flag
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
