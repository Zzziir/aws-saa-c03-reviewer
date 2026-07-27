"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lives in the always-dark top bar, so it uses header-palette styling
 * (light icon on translucent white) rather than theme tokens.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative grid size-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white active:scale-95",
        className,
      )}
    >
      {/* Cross-fade + rotate between sun and moon; avoid mismatch pre-mount. */}
      <Sun
        className={cn(
          "size-[18px] transition-all duration-300",
          mounted && isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      />
      <Moon
        className={cn(
          "absolute size-[18px] transition-all duration-300",
          mounted && !isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0",
        )}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      />
    </button>
  );
}
