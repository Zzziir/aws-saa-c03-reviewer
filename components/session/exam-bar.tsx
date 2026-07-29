"use client";

import { Pause, Play, Flag, PanelLeft, BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/session-utils";
import type { Mode } from "@/lib/types";

export function ExamBar({
  mode,
  remaining,
  timed,
  paused,
  index,
  total,
  answeredCount,
  bionic,
  onTogglePause,
  onOpenDrawer,
  onToggleBionic,
  onSubmit,
}: {
  mode: Mode;
  remaining: number;
  timed: boolean;
  paused: boolean;
  index: number;
  total: number;
  answeredCount: number;
  bionic: boolean;
  onTogglePause: () => void;
  onOpenDrawer: () => void;
  onToggleBionic: () => void;
  onSubmit: () => void;
}) {
  const warn = timed && remaining <= 300 && remaining > 60;
  const crit = timed && remaining <= 60;
  const progress = total ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[#1e2a38] text-white">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6">
        <button
          onClick={onOpenDrawer}
          className="-ml-1 flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-white/20 active:scale-95"
          aria-label="Review answered questions"
        >
          <PanelLeft className="size-3.5" />
          <span className="hidden sm:inline">Review</span>
        </button>

        <span
          className={cn(
            "font-mono text-lg font-bold tabular-nums tracking-wide sm:text-xl",
            warn && "text-brand",
            crit && "animate-[timer-pulse_1.3s_ease-in-out_infinite] text-no-fill",
          )}
        >
          {timed ? formatClock(remaining) : "∞"}
        </span>

        <span
          className={cn(
            "hidden rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] sm:inline",
            mode === "exam"
              ? "bg-brand text-ink"
              : "bg-white/12 text-white/80",
          )}
        >
          {mode}
        </span>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="mr-1 hidden text-[12px] text-white/60 sm:inline">
            {answeredCount}/{total} answered
          </span>
          <button
            onClick={onToggleBionic}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors active:scale-95",
              bionic ? "bg-brand text-ink" : "bg-white/10 hover:bg-white/20",
            )}
            aria-pressed={bionic}
            title="Bionic reading mode"
          >
            <BookOpenText className="size-3.5" />
            <span className="hidden sm:inline">Bionic</span>
          </button>
          <button
            onClick={onTogglePause}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-white/20 active:scale-95"
          >
            {paused ? (
              <Play className="size-3.5" />
            ) : (
              <Pause className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {paused ? "Resume" : "Pause"}
            </span>
          </button>
          <button
            onClick={onSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-bold text-ink transition-colors hover:bg-brand-deep hover:text-white active:scale-95"
          >
            <Flag className="size-3.5" />
            Submit
          </button>
        </div>
      </div>
      <div className="h-[3px] bg-white/10">
        <div
          className="h-full bg-brand"
          style={{ width: `${progress}%`, transition: "width 0.3s ease-out" }}
        />
      </div>
    </div>
  );
}
