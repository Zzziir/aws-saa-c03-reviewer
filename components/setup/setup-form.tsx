"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Timer,
  Shuffle,
  Play,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useStore, useHydrated, DEFAULT_CONFIG } from "@/lib/store";
import {
  DOMAIN_META,
  DOMAIN_ORDER,
  countAvailable,
  DIFFICULTY_META,
} from "@/lib/questions";
import type {
  Difficulty,
  DifficultyFilter,
  Domain,
  Mode,
  SessionConfig,
} from "@/lib/types";
import { formatDuration } from "@/lib/session-utils";

const DIFF_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const TIME_PRESETS = [30, 60, 90, 130];

// Guide notches for the sliders.
const COUNT_TICKS = Array.from({ length: 13 }, (_, i) => 5 + i * 5); // 5…65
const TIME_TICKS = [30, 60, 90, 120, 150, 180]; // 30-min marks

export function SetupForm({ initialDomain }: { initialDomain?: Domain }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const saved = useStore((s) => s.settings);
  const active = useStore((s) => s.active);
  const startSession = useStore((s) => s.startSession);

  const base = hydrated ? saved : DEFAULT_CONFIG;
  const [mode, setMode] = useState<Mode>(base.mode);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(
    base.difficulty,
  );
  const [domains, setDomains] = useState<Domain[]>(
    initialDomain ? [initialDomain] : base.domains,
  );
  const [count, setCount] = useState<number>(base.count);
  const [minutes, setMinutes] = useState<number>(
    Math.round(base.durationSec / 60),
  );

  const available = useMemo(
    () => countAvailable(difficulty, domains),
    [difficulty, domains],
  );
  const effectiveCount = Math.min(count, available);

  function toggleDomain(d: Domain) {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function start() {
    const config: SessionConfig = {
      mode,
      count: effectiveCount,
      durationSec: minutes * 60,
      difficulty,
      domains,
    };
    startSession(config);
    router.push("/session");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Mode */}
        <Field label="Mode" hint="How feedback is delivered">
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={mode === "reviewer"}
              onClick={() => setMode("reviewer")}
              icon={<GraduationCap className="size-5" />}
              title="Reviewer"
              desc="Instant feedback — see the correct answer and explanation after each question."
            />
            <ModeCard
              active={mode === "exam"}
              onClick={() => setMode("exam")}
              icon={<Timer className="size-5" />}
              title="Exam"
              desc="No feedback until the end. Score and full review revealed when you finish."
            />
          </div>
        </Field>

        {/* Difficulty */}
        <Field label="Difficulty" hint={`${available} questions available`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIFF_OPTIONS.map((opt) => {
              const n =
                opt.value === "mixed"
                  ? countAvailable("mixed", domains)
                  : countAvailable(opt.value as Difficulty, domains);
              return (
                <Segment
                  key={opt.value}
                  active={difficulty === opt.value}
                  onClick={() => setDifficulty(opt.value)}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                    {n}
                  </span>
                </Segment>
              );
            })}
          </div>
        </Field>

        {/* Domains */}
        <Field
          label="Domains"
          hint={domains.length === 0 ? "All four" : `${domains.length} selected`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {DOMAIN_ORDER.map((d) => {
              const meta = DOMAIN_META[d];
              const on = domains.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDomain(d)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-[1.5px] px-3.5 py-3 text-left transition-all duration-150 active:scale-[0.99]",
                    on
                      ? "border-brand bg-brand-tint"
                      : "border-border bg-card hover:border-muted-foreground/30",
                  )}
                >
                  <span
                    className="grid size-8 place-items-center rounded-md text-white"
                    style={{ background: meta.hue }}
                  >
                    {on ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="text-[11px] font-bold">
                        {meta.weight}%
                      </span>
                    )}
                  </span>
                  <div>
                    <div className="text-[13.5px] font-semibold">
                      {meta.name}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Exam weight {meta.weight}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Leave all off to draw from every domain.
          </p>
        </Field>

        {/* Count */}
        <Field
          label="Questions"
          hint="5 to 65, in steps of 5"
          readout={
            <span className="font-mono text-lg font-bold tnum">
              {effectiveCount}
              {effectiveCount < count && (
                <span className="ml-1 text-xs font-medium text-brand-deep">
                  max
                </span>
              )}
            </span>
          }
        >
          <Slider
            min={5}
            max={65}
            step={5}
            ticks={COUNT_TICKS}
            value={[Math.min(count, 65)]}
            onValueChange={(v) => setCount(Array.isArray(v) ? v[0] : v)}
            className="py-2"
          />
        </Field>

        {/* Time */}
        <Field
          label="Time limit"
          hint="Pause anytime during the run"
          readout={
            <span className="font-mono text-lg font-bold tnum">
              {formatDuration(minutes * 60)}
            </span>
          }
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {TIME_PRESETS.map((m) => (
              <Segment
                key={m}
                active={minutes === m}
                onClick={() => setMinutes(m)}
                className="flex-1 px-2 py-2 text-center"
              >
                <span className="font-mono text-[13px] font-semibold">
                  {formatDuration(m * 60)}
                </span>
              </Segment>
            ))}
          </div>
          <Slider
            min={10}
            max={180}
            step={5}
            ticks={TIME_TICKS}
            value={[minutes]}
            onValueChange={(v) => setMinutes(Array.isArray(v) ? v[0] : v)}
            className="py-2"
          />
        </Field>
      </div>

      {/* Sticky summary / launch */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
            Session summary
          </p>
          <div className="mt-4 space-y-2.5 text-sm">
            <SummaryRow
              label="Mode"
              value={mode === "reviewer" ? "Reviewer" : "Exam"}
            />
            <SummaryRow
              label="Difficulty"
              value={
                difficulty === "mixed"
                  ? "Mixed"
                  : DIFFICULTY_META[difficulty as Difficulty].name
              }
            />
            <SummaryRow
              label="Domains"
              value={
                domains.length === 0
                  ? "All 4"
                  : domains.map((d) => DOMAIN_META[d].short).join(", ")
              }
            />
            <SummaryRow label="Questions" value={String(effectiveCount)} />
            <SummaryRow label="Time" value={formatDuration(minutes * 60)} />
          </div>

          <motion.div whileTap={{ scale: 0.98 }} className="mt-5">
            <Button
              onClick={start}
              disabled={effectiveCount === 0}
              className="h-12 w-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand-deep hover:text-white"
            >
              <Play className="size-4 fill-current" />
              Start {mode === "exam" ? "exam" : "session"}
            </Button>
          </motion.div>

          {hydrated && active && (
            <div className="mt-3 rounded-lg border border-brand/40 bg-brand-tint px-3 py-2.5 text-[12.5px]">
              <p className="font-medium">You have a run in progress.</p>
              <button
                onClick={() => router.push("/session")}
                className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-deep"
              >
                <RotateCcw className="size-3.5" /> Resume it
              </button>
            </div>
          )}

          <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Shuffle className="size-3.5" /> Questions are randomized each run.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  hint,
  readout,
  children,
}: {
  label: string;
  hint?: string;
  readout?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
        {readout}
      </div>
      {children}
    </section>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border-[1.5px] p-4 text-left transition-all duration-150 active:scale-[0.99]",
        active
          ? "border-brand bg-brand-tint shadow-sm"
          : "border-border bg-card hover:border-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-lg",
          active ? "bg-brand text-ink" : "bg-secondary text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <div className="mt-3 text-[15px] font-semibold">{title}</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </button>
  );
}

function Segment({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border-[1.5px] px-3 py-2.5 text-center transition-all duration-150 active:scale-[0.97]",
        active
          ? "border-brand bg-brand-tint"
          : "border-border bg-card hover:border-muted-foreground/30",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
