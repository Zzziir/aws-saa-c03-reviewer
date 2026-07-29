"use client";

import * as React from "react";
import { Pencil, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveExamDate } from "@/lib/db/progress";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Today's date at Asia/Manila (matches the streak/greeting timezone). */
function manilaToday(): Date {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ExamCountdown() {
  const { user } = useAuth();
  const today = React.useMemo(manilaToday, []);

  const metaDate =
    (user?.user_metadata?.target_exam_date as string | undefined) ?? null;
  const [target, setTarget] = React.useState<Date | null>(parseDate(metaDate));
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState(() => {
    const base = parseDate(metaDate) ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Keep in sync if auth metadata changes elsewhere.
  React.useEffect(() => {
    setTarget(parseDate(metaDate));
  }, [metaDate]);

  // Close on outside click / Escape.
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const daysLeft = target
    ? Math.round((target.getTime() - today.getTime()) / 86_400_000)
    : null;

  async function pick(date: Date) {
    setTarget(date);
    setOpen(false);
    const iso = toISO(date);
    // Persist to profile (canonical) + auth metadata (instant client read).
    void saveExamDate(iso);
    const { error } = await getSupabaseBrowserClient().auth.updateUser({
      data: { target_exam_date: iso },
    });
    if (error) toast.error("Couldn't save your exam date. Try again.");
    else toast.success("Exam date updated.");
  }

  function openCalendar() {
    setView(
      target
        ? new Date(target.getFullYear(), target.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 1),
    );
    setOpen((o) => !o);
  }

  const bigNumber =
    daysLeft === null ? "—" : daysLeft < 0 ? "—" : String(daysLeft);
  const label =
    daysLeft === null
      ? "set exam date"
      : daysLeft < 0
        ? "exam passed"
        : daysLeft === 0
          ? "exam is today"
          : daysLeft === 1
            ? "day to exam"
            : "days to exam";

  // Build the calendar grid for the current view month.
  const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={openCalendar}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Set your exam date"
        className={cn(
          "group flex flex-col items-end rounded-2xl border px-4 py-2.5 text-right transition-colors",
          "border-white/15 bg-white/5 hover:border-brand/60 hover:bg-white/10",
        )}
      >
        <span className="font-display text-[26px] font-bold leading-none tnum text-brand">
          {bigNumber}
        </span>
        <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white/55">
          {label}
          <Pencil className="size-3 opacity-50 transition-opacity group-hover:opacity-100" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose exam date"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(17rem,calc(100vw-2.5rem))] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
              }
              className="grid size-7 place-items-center rounded-lg border border-border hover:border-brand hover:text-brand"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
              }
              className="grid size-7 place-items-center rounded-lg border border-border hover:border-brand hover:text-brand"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DOW.map((d) => (
              <span
                key={d}
                className="grid h-6 place-items-center font-mono text-[10px] text-muted-foreground"
              >
                {d}
              </span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={`e${i}`} />;
              const past = date.getTime() < today.getTime();
              const isToday = sameDay(date, today);
              const isSel = target && sameDay(date, target);
              return (
                <button
                  key={toISO(date)}
                  type="button"
                  disabled={past}
                  onClick={() => pick(date)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg font-mono text-[12px] tnum transition-colors",
                    isSel
                      ? "bg-brand font-bold text-ink"
                      : isToday
                        ? "ring-1 ring-inset ring-border hover:bg-secondary"
                        : "hover:bg-secondary",
                    past && "cursor-default text-muted-foreground/40 hover:bg-transparent",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 font-mono text-[11px] text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {target
              ? `Target: ${MONTHS[target.getMonth()].slice(0, 3)} ${target.getDate()}, ${target.getFullYear()}`
              : "Pick your exam day"}
          </div>
        </div>
      )}
    </div>
  );
}
