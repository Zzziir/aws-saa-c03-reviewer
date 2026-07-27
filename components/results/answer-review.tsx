"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X, Bookmark, Lightbulb } from "lucide-react";
import type { Attempt } from "@/lib/types";
import { getQuestion, DOMAIN_META } from "@/lib/questions";
import { answerIndices } from "@/lib/session-utils";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
type Filter = "all" | "incorrect" | "flagged";

export function AnswerReview({ attempt }: { attempt: Attempt }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const flaggedIds = useStore((s) => s.flaggedIds);
  const toggleFlag = useStore((s) => s.toggleFlag);

  const answerByQ = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const items = attempt.questionIds.filter((id) => {
    const a = answerByQ.get(id);
    if (filter === "incorrect") return !a?.correct;
    if (filter === "flagged") return flaggedIds.includes(id);
    return true;
  });

  const counts = {
    all: attempt.questionIds.length,
    incorrect: attempt.answers.filter((a) => !a.correct).length,
    flagged: attempt.questionIds.filter((id) => flaggedIds.includes(id)).length,
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["all", "incorrect", "flagged"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold capitalize transition-colors active:scale-95",
              filter === f
                ? "bg-solid text-solid-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {f} <span className="opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Nothing here — {filter === "incorrect" ? "you got everything right." : "no flagged questions."}
          </p>
        )}
        {items.map((id, idx) => {
          const q = getQuestion(id);
          if (!q) return null;
          const a = answerByQ.get(id);
          const selected = a?.selected ?? [];
          const correctIdx = answerIndices(q);
          const isOpen = open === id;
          const num = attempt.questionIds.indexOf(id) + 1;
          const flagged = flaggedIds.includes(id);
          const meta = DOMAIN_META[q.domain];

          return (
            <div
              key={id}
              className="overflow-hidden rounded-xl border border-border bg-card"
              style={{ "--i": idx } as React.CSSProperties}
            >
              <button
                onClick={() => setOpen(isOpen ? null : id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/40"
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md text-white",
                    a?.correct ? "bg-ok" : "bg-no",
                  )}
                >
                  {a?.correct ? (
                    <Check className="size-4" />
                  ) : (
                    <X className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-faint">
                      Q{num}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                      style={{ background: `${meta.hue}1a`, color: meta.hue }}
                    >
                      {meta.short}
                    </span>
                    {flagged && (
                      <Bookmark className="size-3 fill-brand-deep text-brand-deep" />
                    )}
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
                          const isSel = selected.includes(i);
                          const isRight = correctIdx.includes(i);
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg border-[1.5px] px-3 py-2.5 text-[13.5px]",
                                isRight
                                  ? "border-ok bg-ok-tint"
                                  : isSel
                                    ? "border-no bg-no-tint"
                                    : "border-border",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded text-[11px] font-bold",
                                  isRight
                                    ? "bg-ok text-white"
                                    : isSel
                                      ? "bg-no text-white"
                                      : "bg-secondary text-muted-foreground",
                                )}
                              >
                                {isRight ? (
                                  <Check className="size-3" />
                                ) : isSel ? (
                                  <X className="size-3" />
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
                        onClick={() => toggleFlag(id)}
                        className={cn(
                          "mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold",
                          flagged ? "text-brand-deep" : "text-muted-foreground",
                        )}
                      >
                        <Bookmark
                          className={cn(
                            "size-3.5",
                            flagged && "fill-brand-deep",
                          )}
                        />
                        {flagged ? "Flagged for review" : "Flag for review"}
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
