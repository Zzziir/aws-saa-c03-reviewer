"use client";

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

/**
 * A thin donut ring. Segments animate in via stroke-dashoffset on mount.
 * Sized by `size` (px); stroke width scales with it.
 */
export function Donut({
  segments,
  size = 200,
  thickness,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const stroke = thickness ?? Math.round(size * 0.13);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  let offset = 0;
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={stroke}
        />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const len = frac * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeLinecap={frac > 0 && frac < 1 ? "butt" : "round"}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              style={{
                transition: "stroke-dasharray 0.7s var(--ease-out)",
              }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
