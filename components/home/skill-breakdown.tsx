"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Sparkles, ArrowRight } from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import {
  computeTopicStats,
  classifyTopics,
  buildSuggestedSet,
  TOPIC_MIN_SAMPLE,
  type TopicStat,
} from "@/lib/analytics";
import { DOMAIN_META } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SkillBreakdown() {
  const router = useRouter();
  const hydrated = useHydrated();
  const history = useStore((s) => s.history);
  const count = useStore((s) => s.settings.count);
  const startFromQuestions = useStore((s) => s.startFromQuestions);

  const stats = React.useMemo(
    () => (hydrated ? computeTopicStats(history) : []),
    [hydrated, history],
  );
  const { strengths, weaknesses } = React.useMemo(
    () => classifyTopics(stats),
    [stats],
  );
  const mix = React.useMemo(
    () => (hydrated ? buildSuggestedSet(history, count) : null),
    [hydrated, history, count],
  );

  const hasSignal = strengths.length > 0 || weaknesses.length > 0;

  function startSuggested() {
    if (!mix || mix.ids.length === 0) return;
    startFromQuestions(mix.ids, "reviewer");
    router.push("/session");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <SkillCard
          tone="good"
          title="Your strengths"
          icon={<TrendingUp className="size-4" />}
          hint={`≥80% · ${TOPIC_MIN_SAMPLE}+ answered`}
          topics={strengths.slice(0, 5)}
          empty={
            hydrated
              ? "Keep going — topics you ace will surface here."
              : "Loading…"
          }
        />
        <SkillCard
          tone="bad"
          title="Needs work"
          icon={<TrendingDown className="size-4" />}
          hint={`<60% · ${TOPIC_MIN_SAMPLE}+ answered`}
          topics={weaknesses.slice(0, 5)}
          empty={
            hydrated
              ? "No weak spots flagged yet. Answer more to find them."
              : "Loading…"
          }
        />
      </div>

      {/* Suggested set */}
      {hydrated && mix && mix.ids.length > 0 && (
        <div className="rounded-2xl border border-brand/30 bg-gradient-to-b from-brand-tint to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="size-4 text-brand-deep" />
                Your next set — built from your gaps
              </h3>
              <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
                {mix.ids.length} questions, weighted toward what&apos;s dragging
                your score. Refreshes as you improve.
              </p>
            </div>
            <Button
              onClick={startSuggested}
              className="h-11 w-full shrink-0 bg-brand px-5 font-semibold text-ink hover:bg-brand-deep hover:text-white sm:w-auto"
            >
              Start suggested set <ArrowRight className="size-4" />
            </Button>
          </div>

          {/* Composition bar */}
          <div className="mt-4 flex h-8 overflow-hidden rounded-lg">
            <MixSeg n={mix.weak} total={mix.ids.length} color="var(--no)" label="weak" />
            <MixSeg n={mix.dev} total={mix.ids.length} color="var(--brand)" label="dev" />
            <MixSeg n={mix.strong} total={mix.ids.length} color="var(--ok)" label="keep" />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <Legend color="var(--no)" text={`${mix.weak} weak`} />
            <Legend color="var(--brand)" text={`${mix.dev} developing`} />
            <Legend color="var(--ok)" text={`${mix.strong} maintain`} />
            {mix.weakTopics.length > 0 && (
              <span className="text-muted-foreground/80">
                · focus: {mix.weakTopics.join(", ")}
              </span>
            )}
          </div>
        </div>
      )}

      {hydrated && !hasSignal && (
        <p className="text-center text-[13px] text-muted-foreground">
          Answer at least {TOPIC_MIN_SAMPLE} questions in a topic to start
          building your strengths &amp; weaknesses profile.
        </p>
      )}
    </div>
  );
}

function SkillCard({
  tone,
  title,
  icon,
  hint,
  topics,
  empty,
}: {
  tone: "good" | "bad";
  title: string;
  icon: React.ReactNode;
  hint: string;
  topics: TopicStat[];
  empty: string;
}) {
  const accent = tone === "good" ? "var(--ok)" : "var(--no)";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <span
            className="grid size-6 place-items-center rounded-md"
            style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}
          >
            {icon}
          </span>
          {title}
        </h2>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          {hint}
        </span>
      </div>

      {topics.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">
          {topics.map((t) => (
            <div key={t.slug}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: DOMAIN_META[t.domain].hue }}
                  />
                  <span className="truncate">{t.label}</span>
                </span>
                <span className="shrink-0 font-mono text-[12px] font-bold tnum">
                  {t.pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${t.pct}%`,
                    background: accent,
                    transition: "width 0.6s var(--ease-out)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MixSeg({
  n,
  total,
  color,
  label,
}: {
  n: number;
  total: number;
  color: string;
  label: string;
}) {
  if (n <= 0) return null;
  const pct = Math.round((n / total) * 100);
  return (
    <div
      className="grid place-items-center font-mono text-[11px] font-semibold text-ink"
      style={{ flexGrow: n, background: color, minWidth: 0 }}
      title={`${n} ${label}`}
    >
      {pct >= 12 ? `${pct}%` : ""}
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("size-2.5 rounded-sm")}
        style={{ background: color }}
      />
      {text}
    </span>
  );
}
