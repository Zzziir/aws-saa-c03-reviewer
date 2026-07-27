"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  Zap,
  Target,
  Flame,
  ArrowRight,
  RotateCcw,
  Bookmark,
  Library,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import { computeAnalytics } from "@/lib/analytics";
import { QUESTIONS, PASS_PCT, DOMAIN_META } from "@/lib/questions";
import { formatDuration, formatDate } from "@/lib/session-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Donut } from "@/components/charts/donut";
import { cn } from "@/lib/utils";
import type { SessionConfig } from "@/lib/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const history = useStore((s) => s.history);
  const active = useStore((s) => s.active);
  const flaggedIds = useStore((s) => s.flaggedIds);
  const startSession = useStore((s) => s.startSession);

  const a = hydrated ? computeAnalytics(history) : null;
  const ready = a && a.runs > 0 ? a.avgScore : null;

  function quickStart(config: SessionConfig) {
    startSession(config);
    router.push("/session");
  }

  const readiness = ready ?? 0;
  const readinessColor =
    readiness >= PASS_PCT
      ? "var(--ok)"
      : readiness >= 55
        ? "var(--brand)"
        : "var(--no)";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#131a24] to-[#1e2a38] p-6 text-white shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              SAA-C03 · Solutions Architect Associate
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-[34px]">
              {greeting()}, Lance.
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">
              {ready === null
                ? "Let's get your first run on the board. 200 questions across all four domains are ready when you are."
                : readiness >= PASS_PCT
                  ? "You're tracking above the pass line. Keep the streak sharp and shore up your weak spots."
                  : "Steady progress beats cramming. A focused run a day moves the needle — let's go."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/practice"
                className={cn(
                  buttonVariants(),
                  "h-11 bg-brand px-5 font-semibold text-ink hover:bg-brand-deep hover:text-white",
                )}
              >
                <Play className="size-4 fill-current" /> Start a session
              </Link>
              <Button
                onClick={() =>
                  quickStart({
                    mode: "exam",
                    count: 65,
                    durationSec: 130 * 60,
                    difficulty: "mixed",
                    domains: [],
                  })
                }
                className="h-11 border border-white/15 bg-white/10 px-5 font-semibold text-white hover:bg-white/20"
              >
                <GraduationCap className="size-4" /> Full mock exam
              </Button>
            </div>
          </div>

          {/* Readiness ring */}
          <div className="flex shrink-0 items-center justify-center">
            <Donut
              segments={[
                { value: readiness, color: readinessColor, label: "Readiness" },
                { value: 100 - readiness, color: "rgba(255,255,255,0.12)", label: "" },
              ]}
              size={150}
              thickness={14}
            >
              <div>
                <div className="font-display text-3xl font-bold tnum">
                  {ready === null ? "—" : `${readiness}%`}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-white/50">
                  avg score
                </div>
              </div>
            </Donut>
          </div>
        </div>
      </motion.div>

      {/* Resume */}
      {hydrated && active && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand/40 bg-brand-tint p-4 sm:p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-brand text-ink">
            <RotateCcw className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">You have a run in progress</p>
            <p className="text-[13px] text-muted-foreground">
              {active.config.mode === "exam" ? "Exam" : "Reviewer"} ·{" "}
              {active.questionIds.length} questions · question{" "}
              {active.index + 1}
            </p>
          </div>
          <Button
            onClick={() => router.push("/session")}
            className="bg-solid text-solid-foreground hover:bg-solid/90"
          >
            Resume <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Runs"
          value={hydrated ? String(a!.runs) : "—"}
        />
        <StatCard
          icon={<Target className="size-4" />}
          label="Best score"
          value={hydrated && a!.runs ? `${a!.bestScore}%` : "—"}
        />
        <StatCard
          icon={<Flame className="size-4" />}
          label="Consistency"
          value={hydrated && a!.runs ? String(a!.consistency) : "—"}
        />
        <StatCard
          icon={<Bookmark className="size-4" />}
          label="Flagged"
          value={hydrated ? String(flaggedIds.length) : "—"}
        />
      </div>

      {/* Quick start tiles */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Jump back in</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickTile
            icon={<Zap className="size-5" />}
            title="Quick 20"
            desc="Reviewer mode, mixed difficulty, instant feedback."
            onClick={() =>
              quickStart({
                mode: "reviewer",
                count: 20,
                durationSec: 40 * 60,
                difficulty: "mixed",
                domains: [],
              })
            }
          />
          <QuickTile
            icon={<GraduationCap className="size-5" />}
            title="Mock exam"
            desc="65 questions, 2h10m, exam conditions."
            onClick={() =>
              quickStart({
                mode: "exam",
                count: 65,
                durationSec: 130 * 60,
                difficulty: "mixed",
                domains: [],
              })
            }
          />
          {hydrated && a?.weakestDomain && a.weakestDomain.total > 0 ? (
            <QuickTile
              icon={<Flame className="size-5" />}
              title={`Fix ${DOMAIN_META[a.weakestDomain.domain].short}`}
              desc={`Your weakest domain at ${a.weakestDomain.pct}%. 20 targeted Qs.`}
              highlight
              onClick={() =>
                quickStart({
                  mode: "reviewer",
                  count: 20,
                  durationSec: 45 * 60,
                  difficulty: "mixed",
                  domains: [a.weakestDomain!.domain],
                })
              }
            />
          ) : (
            <QuickTileLink
              icon={<Library className="size-5" />}
              title="Service cheat-sheet"
              desc="Browse every in-scope service and when to use it."
              href="/services"
            />
          )}
        </div>
      </div>

      {/* Recent + domain snapshot */}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent runs</h2>
            <Link
              href="/history"
              className="text-[12.5px] font-semibold text-brand-deep hover:underline"
            >
              View all
            </Link>
          </div>
          {!hydrated || history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {hydrated ? "No runs yet — start one above." : "Loading…"}
            </p>
          ) : (
            <div className="space-y-2.5">
              {history.slice(0, 3).map((h, i) => (
                <Link
                  key={h.id}
                  href={`/results/${h.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/40"
                >
                  <Donut
                    segments={[
                      { value: h.correct, color: "var(--ok)", label: "" },
                      {
                        value: h.total - h.correct,
                        color: "var(--no)",
                        label: "",
                      },
                    ]}
                    size={44}
                    thickness={6}
                  >
                    <span className="font-mono text-[10px] font-bold">
                      {h.scorePct}
                    </span>
                  </Donut>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">
                      Attempt {history.length - i} · {h.correct}/{h.total}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {formatDate(h.date)} · {formatDuration(h.durationSec)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold">Domain snapshot</h2>
          {!hydrated || !a || a.runs === 0 ? (
            <div className="space-y-3">
              {(["secure", "resilient", "performance", "cost"] as const).map(
                (d) => (
                  <div key={d} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px]">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: DOMAIN_META[d].hue }}
                      />
                      {DOMAIN_META[d].short}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {DOMAIN_META[d].weight}% of exam
                    </span>
                  </div>
                ),
              )}
              <p className="pt-1 text-[12px] text-muted-foreground">
                {QUESTIONS.length} questions loaded. Finish a run to see your
                mastery here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {a.byDomain.map((d) => {
                const meta = DOMAIN_META[d.domain];
                return (
                  <div key={d.domain}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="flex items-center gap-2 text-[13px] font-medium">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: meta.hue }}
                        />
                        {meta.short}
                      </span>
                      <span className="font-mono text-[12px] font-bold tnum">
                        {d.total ? `${d.pct}%` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
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
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11.5px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-2xl font-bold tnum">{value}</p>
    </div>
  );
}

function QuickTile({
  icon,
  title,
  desc,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col rounded-2xl border p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]",
        highlight
          ? "border-brand/50 bg-brand-tint"
          : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          highlight ? "bg-brand text-ink" : "bg-secondary text-foreground",
        )}
      >
        {icon}
      </span>
      <span className="mt-3 flex items-center gap-1 text-[15px] font-semibold">
        {title}
        <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </span>
      <span className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {desc}
      </span>
    </button>
  );
}

function QuickTileLink({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-secondary text-foreground">
        {icon}
      </span>
      <span className="mt-3 flex items-center gap-1 text-[15px] font-semibold">
        {title}
        <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </span>
      <span className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {desc}
      </span>
    </Link>
  );
}
