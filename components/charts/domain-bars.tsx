"use client";

import type { DomainBreakdown } from "@/lib/types";
import { DOMAIN_META } from "@/lib/questions";

/**
 * Correct/incorrect split per domain, styled after the results screen Lance
 * likes: a labeled row with a green→red proportional bar.
 */
export function DomainBars({ breakdown }: { breakdown: DomainBreakdown[] }) {
  return (
    <div className="flex flex-col gap-5">
      {breakdown.map((d) => {
        const meta = DOMAIN_META[d.domain];
        const pct = d.total ? Math.round((d.correct / d.total) * 100) : 0;
        return (
          <div key={d.domain}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: meta.hue }}
                />
                <span className="text-[13.5px] font-semibold">
                  {meta.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({d.total} {d.total === 1 ? "question" : "questions"})
                </span>
              </div>
              <span className="font-mono text-[13px] font-bold tnum">
                {pct}%
              </span>
            </div>
            <div className="flex h-7 overflow-hidden rounded-md bg-no-tint text-[11px] font-semibold">
              <div
                className="flex items-center justify-center bg-ok-tint text-ok"
                style={{
                  width: `${pct}%`,
                  transition: "width 0.6s var(--ease-out)",
                }}
              >
                {pct >= 12 && `${pct}%`}
              </div>
              <div className="flex flex-1 items-center justify-center text-no">
                {100 - pct >= 12 && `${100 - pct}%`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
