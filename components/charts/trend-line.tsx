"use client";

import type { ScorePoint } from "@/lib/analytics";
import { PASS_PCT } from "@/lib/questions";

/** Score-over-time area chart. Scales 0–100 on Y; pass line drawn at PASS_PCT. */
export function TrendLine({ series }: { series: ScorePoint[] }) {
  const W = 640;
  const H = 200;
  const pad = { t: 14, r: 12, b: 22, l: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const n = series.length;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (pct: number) => pad.t + (1 - pct / 100) * ih;

  const pts = series.map((p, i) => ({ px: x(i), py: y(p.pct), ...p }));
  const line = pts.map((p) => `${p.px},${p.py}`).join(" ");
  const area =
    n > 0
      ? `${pad.l},${pad.t + ih} ${line} ${pts[n - 1].px},${pad.t + ih}`
      : "";
  const passY = y(PASS_PCT);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[320px]"
        role="img"
        aria-label="Score trend over time"
      >
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(g)}
              y2={y(g)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={pad.l - 6}
              y={y(g) + 3}
              textAnchor="end"
              className="fill-[var(--faint)] font-mono text-[9px]"
            >
              {g}
            </text>
          </g>
        ))}

        {/* pass line */}
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={passY}
          y2={passY}
          stroke="var(--ok)"
          strokeWidth="1.25"
          strokeDasharray="4 4"
          opacity="0.7"
        />
        <text
          x={W - pad.r}
          y={passY - 4}
          textAnchor="end"
          className="fill-[var(--ok)] font-mono text-[9px] font-semibold"
        >
          pass {PASS_PCT}%
        </text>

        {n > 1 && (
          <polygon points={area} fill="url(#scoreFill)" stroke="none" />
        )}
        {n > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.px}
            cy={p.py}
            r={n === 1 ? 5 : 3.5}
            fill="var(--card)"
            stroke="var(--brand)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
