"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/services";

export function ServicesView() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.map((cat) => ({
      ...cat,
      services: cat.services.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.note.toLowerCase().includes(query),
      ),
    })).filter((cat) => cat.services.length > 0);
  }, [query]);

  const total = filtered.reduce((n, c) => n + c.services.length, 0);

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 bg-background/80 px-4 py-3 backdrop-blur sm:top-14">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search services — e.g. cache, queue, DNS, encryption…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="mt-2 text-xs text-muted-foreground">
            {total} match{total === 1 ? "" : "es"}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {filtered.map((cat) => (
          <section key={cat.name}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="font-display text-lg font-bold">{cat.name}</h2>
              <span className="font-mono text-xs text-faint">
                {cat.services.length}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {cat.services.map((s) => (
                <div
                  key={s.name}
                  className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <h3 className="text-[14px] font-semibold">{s.name}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {s.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No services match “{q}”.
          </p>
        )}
      </div>
    </div>
  );
}
