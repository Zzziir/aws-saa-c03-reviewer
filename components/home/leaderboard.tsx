"use client";

import * as React from "react";
import { Trophy, Flame } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchLeaderboard, type LeaderboardRow } from "@/lib/db/progress";
import { cn } from "@/lib/utils";

const AVATAR_HUES = [
  "#7c9cff", "#3ecf8e", "#f0616d", "#ffb020", "#b98cff", "#4dd0e1",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = React.useState<LeaderboardRow[] | null>(null);

  React.useEffect(() => {
    if (!user) return;
    let alive = true;
    void fetchLeaderboard().then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  const meIndex = rows?.findIndex((r) => r.is_me) ?? -1;
  const top = rows?.slice(0, 8) ?? [];
  // If "me" isn't in the visible top, append my row separately.
  const showMeSeparately = meIndex >= 8;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="size-4 text-brand-deep" />
          Leaderboard
        </h2>
        <span className="font-mono text-[10.5px] text-muted-foreground">
          points = correct + 10 × streak
        </span>
      </div>

      {rows === null ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          No one&apos;s on the board yet. Answer 30 questions today to claim your
          streak. 🔥
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <Th className="w-9 pl-2">#</Th>
                <Th>Reviewer</Th>
                <Th className="text-right">Points</Th>
                <Th className="text-right">Streak</Th>
                <Th className="text-right">Acc.</Th>
                <Th className="hidden text-right sm:table-cell">Qs</Th>
              </tr>
            </thead>
            <tbody>
              {top.map((r, i) => (
                <Row key={r.user_id} rank={i + 1} row={r} />
              ))}
              {showMeSeparately && rows[meIndex] && (
                <>
                  <tr>
                    <td colSpan={6} className="py-1 text-center text-muted-foreground">
                      ⋯
                    </td>
                  </tr>
                  <Row rank={meIndex + 1} row={rows[meIndex]} />
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "py-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Row({ rank, row }: { rank: number; row: LeaderboardRow }) {
  const hue = AVATAR_HUES[(rank - 1) % AVATAR_HUES.length];
  return (
    <tr
      className={cn(
        "border-t border-border",
        row.is_me && "bg-brand-tint",
      )}
    >
      <td className="py-2.5 pl-2 font-mono text-[13px] tnum">
        <span className={cn(rank <= 3 && "font-bold text-brand-deep")}>
          {rank}
        </span>
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold text-ink"
            style={{ background: row.is_me ? "var(--brand)" : hue }}
          >
            {initials(row.display_name)}
          </span>
          <span className={cn("truncate text-[13.5px]", row.is_me && "font-bold")}>
            {row.display_name}
            {row.is_me && (
              <span className="ml-1.5 rounded bg-brand px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-ink">
                YOU
              </span>
            )}
          </span>
        </div>
      </td>
      <td className="py-2.5 text-right font-mono text-[13px] font-semibold tnum text-brand-deep">
        {row.points}
      </td>
      <td className="py-2.5 text-right font-mono text-[13px] tnum">
        {row.streak > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5 text-brand" />
            {row.streak}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 text-right font-mono text-[13px] tnum">
        {row.accuracy}%
      </td>
      <td className="hidden py-2.5 text-right font-mono text-[13px] tnum sm:table-cell">
        {row.questions}
      </td>
    </tr>
  );
}
