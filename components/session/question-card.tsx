"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Bookmark, Lightbulb, CircleDot } from "lucide-react";
import type { Mode, Question } from "@/lib/types";
import { DOMAIN_META, DIFFICULTY_META } from "@/lib/questions";
import { answerIndices, isMultiAnswer } from "@/lib/session-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const DIFF_CLASS: Record<string, string> = {
  easy: "border-ok-fill bg-ok-tint text-ok",
  medium: "border-brand/40 bg-brand-tint text-brand-deep",
  hard: "border-no-fill bg-no-tint text-no",
};

export function QuestionCard({
  question,
  index,
  total,
  selected,
  mode,
  revealed,
  flagged,
  onSelect,
  onReveal,
  onToggleFlag,
}: {
  question: Question;
  index: number;
  total: number;
  selected: number[];
  mode: Mode;
  revealed: boolean;
  flagged: boolean;
  onSelect: (i: number) => void;
  onReveal: () => void;
  onToggleFlag: () => void;
}) {
  const multi = isMultiAnswer(question);
  const correct = answerIndices(question);
  const meta = DOMAIN_META[question.domain];
  const isCorrect =
    revealed &&
    selected.length === correct.length &&
    correct.every((c) => selected.includes(c));

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Q{index + 1}
          <span className="text-faint"> / {total}</span>
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ background: `${meta.hue}1a`, color: meta.hue }}
        >
          {meta.short}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
            DIFF_CLASS[question.difficulty],
          )}
        >
          {DIFFICULTY_META[question.difficulty].name}
        </span>
        {multi && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Select {correct.length}
          </span>
        )}
        <button
          onClick={onToggleFlag}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors active:scale-95",
            flagged
              ? "bg-brand-tint text-brand-deep"
              : "text-muted-foreground hover:bg-secondary",
          )}
          aria-pressed={flagged}
        >
          <Bookmark
            className={cn("size-3.5", flagged && "fill-brand-deep")}
          />
          {flagged ? "Flagged" : "Flag"}
        </button>
      </div>

      <h2 className="text-[16.5px] font-medium leading-relaxed sm:text-[17.5px]">
        {question.question}
      </h2>

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const isSel = selected.includes(i);
          const isRight = correct.includes(i);
          let state: "idle" | "sel" | "right" | "wrong" | "missed" = "idle";
          if (revealed) {
            if (isRight) state = "right";
            else if (isSel) state = "wrong";
          } else if (isSel) {
            state = "sel";
          }
          if (revealed && isRight && !isSel) state = "missed";

          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => onSelect(i)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5 text-left transition-all duration-150",
                !revealed && "hover:border-muted-foreground/40 active:scale-[0.995]",
                state === "idle" && "border-border bg-card",
                state === "sel" && "border-brand bg-brand-tint",
                state === "right" && "border-ok bg-ok-tint",
                state === "missed" &&
                  "border-ok border-dashed bg-ok-tint/60",
                state === "wrong" && "border-no bg-no-tint",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-[12px] font-bold transition-colors",
                  multi && "rounded-[7px]",
                  state === "idle" &&
                    "border-border text-muted-foreground group-hover:border-muted-foreground/50",
                  state === "sel" && "border-brand bg-brand text-ink",
                  (state === "right" || state === "missed") &&
                    "border-ok bg-ok text-white",
                  state === "wrong" && "border-no bg-no text-white",
                )}
              >
                {state === "right" || state === "missed" ? (
                  <Check className="size-3.5" />
                ) : state === "wrong" ? (
                  <X className="size-3.5" />
                ) : (
                  LETTERS[i]
                )}
              </span>
              <span className="pt-0.5 text-[14.5px] leading-relaxed">
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reviewer mode: check button for multi-answer before reveal */}
      {mode === "reviewer" && !revealed && (
        <div className="mt-4">
          <Button
            onClick={onReveal}
            disabled={selected.length === 0}
            className="bg-solid font-semibold text-solid-foreground hover:bg-solid/90"
          >
            <CircleDot className="size-4" />
            Check answer
          </Button>
          {multi && (
            <span className="ml-3 text-xs text-muted-foreground">
              Select {correct.length}, then check.
            </span>
          )}
        </div>
      )}

      {/* Reviewer explanation */}
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-4">
              <div
                className={cn(
                  "mb-2 flex items-center gap-2 text-[13px] font-bold",
                  isCorrect ? "text-ok" : "text-no",
                )}
              >
                {isCorrect ? (
                  <>
                    <Check className="size-4" /> Correct
                  </>
                ) : (
                  <>
                    <X className="size-4" /> Not quite
                  </>
                )}
              </div>
              <p className="text-[13.5px] leading-relaxed text-foreground/90">
                {question.explanation}
              </p>
              {question.keyTakeaway && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-tint px-3 py-2 font-mono text-[11.5px] font-medium leading-relaxed text-brand-deep">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                  {question.keyTakeaway}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
