"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Check } from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import { getQuestion } from "@/lib/questions";
import { remainingSec, isMultiAnswer } from "@/lib/session-utils";
import type { Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ExamBar } from "./exam-bar";
import { QuestionCard } from "./question-card";
import { QuestionDrawer } from "./question-drawer";
import { useBionicPref } from "./bionic-text";

export function SessionRunner() {
  const router = useRouter();
  const hydrated = useHydrated();
  const active = useStore((s) => s.active);
  const selectOption = useStore((s) => s.selectOption);
  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const goto = useStore((s) => s.goto);
  const togglePause = useStore((s) => s.togglePause);
  const toggleFlag = useStore((s) => s.toggleFlag);
  const flaggedIds = useStore((s) => s.flaggedIds);
  const finish = useStore((s) => s.finish);

  const [, forceTick] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [bionic, toggleBionic] = useBionicPref();
  const submittingRef = useRef(false);

  // Redirect out if there is nothing to run (but not while we're submitting,
  // which briefly nulls `active` before routing to the results page).
  useEffect(() => {
    if (hydrated && !active && !submittingRef.current) {
      router.replace("/practice");
    }
  }, [hydrated, active, router]);

  const doSubmit = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const id = finish();
    router.replace(id ? `/results/${id}` : "/practice");
  }, [finish, router]);

  // 1s timer tick; auto-submit when time expires.
  useEffect(() => {
    if (!active || active.paused) return;
    const t = setInterval(() => {
      forceTick((n) => n + 1);
      if (active && remainingSec(active) <= 0) doSubmit();
    }, 1000);
    return () => clearInterval(t);
  }, [active, doSubmit]);

  const mode = active?.config.mode ?? "reviewer";
  const q: Question | undefined = active
    ? getQuestion(active.questionIds[active.index])
    : undefined;

  const isRevealed = useCallback(
    (question: Question) => {
      if (mode !== "reviewer") return false;
      if (revealed.has(question.id)) return true;
      const rec = active?.answers[question.id];
      // Single-answer reviewer questions reveal on selection; survive reload.
      return !!rec && rec.selected.length > 0 && !isMultiAnswer(question);
    },
    [mode, revealed, active],
  );

  const handleSelect = useCallback(
    (optIndex: number) => {
      if (!active || !q) return;
      if (isRevealed(q)) return;
      selectOption(q.id, optIndex);
      if (mode === "reviewer" && !isMultiAnswer(q)) {
        setRevealed((s) => new Set(s).add(q.id));
      }
    },
    [active, q, mode, selectOption, isRevealed],
  );

  const handleReveal = useCallback(() => {
    if (q) setRevealed((s) => new Set(s).add(q.id));
  }, [q]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active || active.paused || confirm || drawer) return;
      if (e.key >= "1" && e.key <= "6") {
        const i = Number(e.key) - 1;
        if (q && i < q.options.length) handleSelect(i);
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key.toLowerCase() === "f" && q) toggleFlag(q.id);
      else if (e.key.toLowerCase() === "p") togglePause();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, confirm, drawer, q, handleSelect, next, prev, toggleFlag, togglePause]);

  if (!hydrated || !active || !q) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        Loading session…
      </div>
    );
  }

  const rec = active.answers[q.id];
  const selected = rec?.selected ?? [];
  const remaining = remainingSec(active);
  const answeredCount = Object.values(active.answers).filter(
    (a) => a.selected.length > 0,
  ).length;
  const atLast = active.index === active.questionIds.length - 1;

  return (
    <div className="min-h-screen">
      <ExamBar
        mode={mode}
        remaining={remaining}
        timed
        paused={active.paused}
        index={active.index}
        total={active.questionIds.length}
        answeredCount={answeredCount}
        bionic={bionic}
        onTogglePause={togglePause}
        onOpenDrawer={() => setDrawer(true)}
        onToggleBionic={toggleBionic}
        onSubmit={() => setConfirm(true)}
      />

      <QuestionDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        active={active}
        flaggedIds={flaggedIds}
        onJump={goto}
      />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={q.id}
            question={q}
            index={active.index}
            total={active.questionIds.length}
            selected={selected}
            mode={mode}
            revealed={isRevealed(q)}
            flagged={flaggedIds.includes(q.id)}
            bionic={bionic}
            onSelect={handleSelect}
            onReveal={handleReveal}
            onToggleFlag={() => toggleFlag(q.id)}
          />
        </AnimatePresence>

        {/* Bottom nav */}
        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={prev}
            disabled={active.index === 0}
            className="h-11 flex-1 sm:flex-none"
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>
          {atLast ? (
            <Button
              onClick={() => setConfirm(true)}
              className="h-11 flex-1 bg-brand font-semibold text-ink hover:bg-brand-deep hover:text-white"
            >
              <Check className="size-4" /> Finish
            </Button>
          ) : (
            <Button
              onClick={next}
              className="h-11 flex-1 bg-solid font-semibold text-solid-foreground hover:bg-solid/90"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit confirm */}
      <AnimatePresence>
        {confirm && (
          <Overlay onClose={() => setConfirm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl"
            >
              <h3 className="text-lg font-bold">Submit this run?</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {answeredCount} of {active.questionIds.length} answered.
                {answeredCount < active.questionIds.length &&
                  " Unanswered questions count as incorrect."}
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirm(false)}
                  className="h-11 flex-1"
                >
                  Keep going
                </Button>
                <Button
                  onClick={doSubmit}
                  className="h-11 flex-1 bg-brand font-semibold text-ink hover:bg-brand-deep hover:text-white"
                >
                  Submit
                </Button>
              </div>
            </motion.div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* Pause overlay */}
      <AnimatePresence>
        {active.paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/80 backdrop-blur-md"
          >
            <div className="text-center text-white">
              <Pause className="mx-auto size-10 opacity-80" />
              <p className="mt-4 font-display text-2xl font-bold">Paused</p>
              <p className="mt-1 text-sm text-white/60">
                The timer is stopped. Take your time.
              </p>
              <Button
                onClick={togglePause}
                className="mt-6 h-12 bg-brand px-8 font-semibold text-ink hover:bg-brand-deep hover:text-white"
              >
                Resume
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
    >
      {children}
    </motion.div>
  );
}
