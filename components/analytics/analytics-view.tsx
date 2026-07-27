"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Target,
  Activity,
  Award,
  Zap,
  BarChart3,
} from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import { computeAnalytics } from "@/lib/analytics";
import { DOMAIN_META, DIFFICULTY_META, PASS_PCT } from "@/lib/questions";
import { formatDuration } from "@/lib/session-utils";
import { TrendLine } from "@/components/charts/trend-line";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Domain } from "@/lib/types";

export function AnalyticsView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const history = useStore((s) => s.history);
  const startSession = useStore((s) => s.startSession);

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary/60" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          <BarChart3 className="size-6" />
        </span>
        <div>
          <p className="font-semibold">No data yet</p>
          <p className="text-sm text-muted-foreground">
            Complete a few runs to unlock your progress analytics.
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

  const a = computeAnalytics(history);
  const trend =
    a.series.length >= 2
      ? a.lastScore - a.series[a.series.length - 2].pct
      : 0;

  function focusWeakest(domain: Domain) {
    startSession({
      mode: "reviewer",
      count: 20,
      durationSec: 45 * 60,
      difficulty: "mixed",
      domains: [domain],
    });
    router.push("/session");
  }

  return (
    <div className="space-y-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<Target className="size-4" />}
          label="Average score"
          value={`${a.avgScore}%`}
          sub={`${a.runs} run${a.runs === 1 ? "" : "s"}`}
        />
        <StatTile
          icon={<TrendingUp className="size-4" />}
          label="Latest"
          value={`${a.lastScore}%`}
          sub={
            trend === 0
              ? "no change"
              : `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend)} pts`
          }
          subClass={trend > 0 ? "text-ok" : trend < 0 ? "text-no" : ""}
        />
        <StatTile
          icon={<Award className="size-4" />}
          label="Best"
          value={`${a.bestScore}%`}
          sub={`${a.passRate}% pass rate`}
        />
        <StatTile
          icon={<Activity className="size-4" />}
          label="Consistency"
          value={`${a.consistency}`}
          sub="stability index"
        />
      </div>

      {/* Trend */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Score trend</h2>
          <span className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-brand" /> score
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-ok" />{" "}
              pass
            </span>
          </span>
        </div>
        <TrendLine series={a.series} />
      </div>

      {/* Focus mode */}
      {a.weakestDomain && a.weakestDomain.total > 0 && (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-brand/40 bg-brand-tint p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-ink">
              <Zap className="size-5" />
            </span>
            <div>
              <p className="font-display text-[15px] font-bold">
                Focus mode: {DOMAIN_META[a.weakestDomain.domain].short}
              </p>
              <p className="text-[13px] text-foreground/75">
                Your weakest domain at {a.weakestDomain.pct}%. Run 20 targeted
                questions in reviewer mode.
              </p>
            </div>
          </div>
          <Button
            onClick={() => focusWeakest(a.weakestDomain!.domain)}
            className="shrink-0 bg-solid text-solid-foreground hover:bg-solid/90"
          >
            <Zap className="size-4" /> Start focus run
          </Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Domain mastery */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold">Domain mastery</h2>
          <div className="space-y-4">
            {a.byDomain.map((d) => {
              const meta = DOMAIN_META[d.domain];
              return (
                <div key={d.domain}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: meta.hue }}
                      />
                      {meta.short}
                    </span>
                    <span className="font-mono text-[12.5px] font-bold tnum">
                      {d.total ? `${d.pct}%` : "—"}
                      <span className="ml-1 font-normal text-faint">
                        {d.correct}/{d.total}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.pct}%`,
                        background: meta.hue,
                        transition: "width 0.6s var(--ease-out)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold">By difficulty</h2>
          <div className="space-y-4">
            {a.byDifficulty.map((d) => (
              <div key={d.difficulty}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium">
                    {DIFFICULTY_META[d.difficulty].name}
                  </span>
                  <span className="font-mono text-[12.5px] font-bold tnum">
                    {d.total ? `${d.pct}%` : "—"}
                    <span className="ml-1 font-normal text-faint">
                      {d.correct}/{d.total}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.pct >= PASS_PCT ? "bg-ok" : "bg-brand",
                    )}
                    style={{
                      width: `${d.pct}%`,
                      transition: "width 0.6s var(--ease-out)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center">
            <div>
              <p className="font-display text-xl font-bold tnum">
                {a.totalQuestions}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                questions answered
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold tnum">
                {formatDuration(a.totalTimeSec)}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                total study time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  subClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11.5px] font-medium">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tnum">{value}</p>
      <p className={cn("text-[11.5px] text-muted-foreground", subClass)}>
        {sub}
      </p>
    </div>
  );
}
