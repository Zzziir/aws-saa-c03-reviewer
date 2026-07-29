"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, Check, Lock } from "lucide-react";
import { getQuestion } from "@/lib/questions";
import type { ActiveSession } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Left slide-in drawer for reviewing already-answered questions mid-run.
 * Answered questions are clickable and jump you there; unanswered ones are
 * locked (you can't skip ahead to something you haven't reached). Flagged
 * questions are marked so they're easy to find again.
 */
export function QuestionDrawer({
  open,
  onClose,
  active,
  flaggedIds,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  active: ActiveSession;
  flaggedIds: number[];
  onJump: (index: number) => void;
}) {
  const answeredCount = active.questionIds.filter(
    (id) => (active.answers[id]?.selected.length ?? 0) > 0,
  ).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col border-r border-border bg-card shadow-2xl"
            aria-label="Answered questions"
          >
            <div className="flex items-start justify-between border-b border-border px-4 py-3.5">
              <div>
                <h3 className="font-semibold">Review answers</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {answeredCount} of {active.questionIds.length} answered
                </p>
              </div>
              <button
                onClick={onClose}
                className="-mr-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {active.questionIds.map((id, i) => {
                const q = getQuestion(id);
                const answered = (active.answers[id]?.selected.length ?? 0) > 0;
                const flagged = flaggedIds.includes(id);
                const current = i === active.index;

                return (
                  <button
                    key={id}
                    disabled={!answered}
                    onClick={() => {
                      onJump(i);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      current && "bg-brand-tint",
                      !current && answered && "hover:bg-secondary",
                      !answered && "cursor-not-allowed opacity-45",
                    )}
                    aria-current={current ? "true" : undefined}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-[11px] font-bold",
                        current
                          ? "border-brand bg-brand text-ink"
                          : answered
                            ? "border-ok/40 bg-ok-tint text-ok"
                            : "border-border text-muted-foreground",
                      )}
                    >
                      {answered && !current ? (
                        <Check className="size-3.5" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          Q{i + 1}
                        </span>
                        {flagged && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.05em] text-brand-deep">
                            <Flag className="size-2.5 fill-brand-deep" />
                            Flagged
                          </span>
                        )}
                        {!answered && (
                          <Lock className="size-3 text-faint" aria-label="Not answered yet" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 line-clamp-2 text-[13px] leading-snug",
                          answered ? "text-foreground/90" : "text-faint",
                        )}
                      >
                        {answered ? (q?.question ?? "…") : "—"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Flag className="size-3 fill-brand-deep text-brand-deep" />
                Flagged
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-3" />
                Locked until reached
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
