"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "saa:bionic";

// Module-level store so the preference is shared and, via useSyncExternalStore,
// read SSR-safely without a setState-in-effect. It's a per-device reading aid,
// so it lives in localStorage rather than the Supabase-synced settings.
let state = false;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    state = localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    /* private mode / unavailable — default off */
  }
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  load();
  return state;
}

/** Server render (and first hydration paint) always sees the default. */
function getServerSnapshot() {
  return false;
}

/**
 * Device-local preference for bionic reading mode (not synced to Supabase —
 * it's a per-device reading aid, not run state).
 */
export function useBionicPref(): [boolean, () => void] {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => {
    state = !state;
    try {
      localStorage.setItem(STORAGE_KEY, state ? "1" : "0");
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);
  return [on, toggle];
}

/** How many leading characters of a word to emphasize (the "fixation"). */
function fixationLength(word: string): number {
  const n = word.length;
  if (n <= 1) return n;
  if (n <= 3) return 1;
  return Math.ceil(n * 0.4);
}

/**
 * Renders text with bionic reading emphasis: the first ~40% of each word is
 * bolded so the eye can fixate and skim. When `active` is false the text is
 * returned unchanged. Screen readers read the plain words regardless.
 */
export function BionicText({
  text,
  active,
  className,
}: {
  text: string;
  active: boolean;
  className?: string;
}) {
  if (!active) return <>{text}</>;

  // Split into alternating word / whitespace tokens, preserving spacing.
  const tokens = text.split(/(\s+)/);

  return (
    <span className={className}>
      {tokens.map((tok, i) => {
        if (tok === "" || /^\s+$/.test(tok)) return tok;
        const cut = fixationLength(tok);
        return (
          <span key={i}>
            <b className="font-bold">{tok.slice(0, cut)}</b>
            {tok.slice(cut)}
          </span>
        );
      })}
    </span>
  );
}
