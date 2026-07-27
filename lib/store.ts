"use client";

import { create } from "zustand";
import type {
  ActiveSession,
  AnswerRecord,
  Attempt,
  SessionConfig,
} from "./types";
import { getQuestion } from "./questions";
import {
  createSession,
  finalizeAttempt,
  isSelectionCorrect,
  liveElapsed,
} from "./session-utils";
import { getSupabaseBrowserClient } from "./supabase/client";
import * as db from "./db/progress";

export const DEFAULT_CONFIG: SessionConfig = {
  mode: "reviewer",
  count: 20,
  durationSec: 2 * 60 * 60,
  difficulty: "mixed",
  domains: [],
};

interface Store {
  hasHydrated: boolean;
  settings: SessionConfig;
  active: ActiveSession | null;
  history: Attempt[];
  flaggedIds: number[];

  /** Load this user's persisted state from Supabase (called on sign-in). */
  hydrateFromServer: () => Promise<void>;
  /** Clear in-memory state on sign-out (does not touch the DB). */
  reset: () => void;

  updateSettings: (patch: Partial<SessionConfig>) => void;
  startSession: (config: SessionConfig) => void;
  /** Start a run from an explicit set of question ids (e.g. flagged review). */
  startFromQuestions: (ids: number[], mode: SessionConfig["mode"]) => void;
  abandonSession: () => void;

  selectOption: (questionId: number, optionIndex: number) => void;
  goto: (index: number) => void;
  next: () => void;
  prev: () => void;
  togglePause: () => void;
  toggleFlag: (questionId: number) => void;

  /** Finalizes the active run, stores it in history, returns the attempt id. */
  finish: () => string | null;

  deleteAttempt: (id: string) => void;
  clearHistory: () => void;
  isFlagged: (questionId: number) => boolean;
}

function mutateActive(
  state: Store,
  fn: (s: ActiveSession) => ActiveSession | void,
): Partial<Store> {
  if (!state.active) return {};
  const draft: ActiveSession = { ...state.active };
  const res = fn(draft);
  return { active: res ?? draft };
}

// --- background sync (Supabase source of truth) ------------------------------
// Suspends write-back while we apply server state during hydration so the
// incoming snapshot isn't immediately echoed back to the DB.
let suspendSync = false;

type Debounced<T extends (...args: never[]) => void> = T & {
  cancel: () => void;
  flush: () => void;
};

function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): Debounced<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  const run = () => {
    timer = null;
    const args = lastArgs;
    lastArgs = null;
    if (args) fn(...args);
  };
  const wrapped = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, ms);
  }) as Debounced<T>;
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };
  wrapped.flush = () => {
    if (timer) {
      clearTimeout(timer);
      run();
    }
  };
  return wrapped;
}

export const useStore = create<Store>()((set, get) => ({
  hasHydrated: false,
  settings: DEFAULT_CONFIG,
  active: null,
  history: [],
  flaggedIds: [],

  hydrateFromServer: async () => {
    try {
      const { data } = await getSupabaseBrowserClient().auth.getUser();
      const uid = data.user?.id ?? null;
      db.setCurrentUserId(uid);
      if (!uid) {
        set({ hasHydrated: true });
        return;
      }
      const state = await db.loadUserState();
      const active = state.active;
      // Resume the timer cleanly: don't count time while the tab was away.
      if (active && !active.paused) active.segmentStart = Date.now();
      suspendSync = true;
      set({
        settings: state.settings ?? DEFAULT_CONFIG,
        active,
        history: state.history,
        flaggedIds: state.flaggedIds,
        hasHydrated: true,
      });
      suspendSync = false;
    } catch {
      // Never leave the UI stuck behind the hydration gate.
      set({ hasHydrated: true });
    }
  },

  reset: () => {
    db.setCurrentUserId(null);
    suspendSync = true;
    set({
      settings: DEFAULT_CONFIG,
      active: null,
      history: [],
      flaggedIds: [],
      hasHydrated: false,
    });
    suspendSync = false;
  },

  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),

  startSession: (config) => {
    set({ settings: config, active: createSession(config) });
  },

  startFromQuestions: (ids, mode) => {
    const config: SessionConfig = {
      mode,
      count: ids.length,
      durationSec: Math.max(10, ids.length * 90),
      difficulty: "mixed",
      domains: [],
    };
    const session = createSession(config);
    // Randomize the provided set rather than the whole pool.
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    set({ active: { ...session, questionIds: shuffled } });
  },

  abandonSession: () => set({ active: null }),

  selectOption: (questionId, optionIndex) =>
    set((s) =>
      mutateActive(s, (a) => {
        if (a.finished) return;
        const q = getQuestion(questionId);
        if (!q) return;
        const prev = a.answers[questionId]?.selected ?? [];
        const multi = Array.isArray(q.answer) && q.answer.length > 1;
        let selected: number[];
        if (multi) {
          selected = prev.includes(optionIndex)
            ? prev.filter((i) => i !== optionIndex)
            : [...prev, optionIndex].sort((x, y) => x - y);
        } else {
          selected = [optionIndex];
        }
        const rec: AnswerRecord = {
          questionId,
          selected,
          correct: isSelectionCorrect(q, selected),
          flagged: a.answers[questionId]?.flagged ?? false,
        };
        a.answers = { ...a.answers, [questionId]: rec };
      }),
    ),

  goto: (index) =>
    set((s) =>
      mutateActive(s, (a) => {
        a.index = Math.max(0, Math.min(index, a.questionIds.length - 1));
      }),
    ),

  next: () =>
    set((s) =>
      mutateActive(s, (a) => {
        a.index = Math.min(a.index + 1, a.questionIds.length - 1);
      }),
    ),

  prev: () =>
    set((s) =>
      mutateActive(s, (a) => {
        a.index = Math.max(a.index - 1, 0);
      }),
    ),

  togglePause: () =>
    set((s) =>
      mutateActive(s, (a) => {
        const now = Date.now();
        if (a.paused) {
          a.paused = false;
          a.segmentStart = now;
        } else {
          a.elapsedSec = liveElapsed(a, now);
          a.paused = true;
          a.segmentStart = null;
        }
      }),
    ),

  toggleFlag: (questionId) =>
    set((s) => {
      const on = !s.flaggedIds.includes(questionId);
      const flaggedIds = on
        ? [...s.flaggedIds, questionId]
        : s.flaggedIds.filter((id) => id !== questionId);
      void db.setFlag(questionId, on);
      const patch = mutateActive(s, (a) => {
        const rec = a.answers[questionId];
        a.answers = {
          ...a.answers,
          [questionId]: rec
            ? { ...rec, flagged: on }
            : { questionId, selected: [], correct: false, flagged: on },
        };
      });
      return { flaggedIds, ...patch };
    }),

  finish: () => {
    const a = get().active;
    if (!a) return null;
    const attempt: Attempt = finalizeAttempt(a);
    set((s) => ({
      active: null,
      history: [attempt, ...s.history],
    }));
    void db.recordAttempt(attempt);
    // active -> null triggers the sync subscription to delete the server row.
    return attempt.id;
  },

  deleteAttempt: (id) => {
    set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
    void db.deleteAttempt(id);
  },

  clearHistory: () => {
    set({ history: [] });
    void db.clearHistory();
  },

  isFlagged: (questionId) => get().flaggedIds.includes(questionId),
}));

// Register write-back once, in the browser only.
if (typeof window !== "undefined") {
  const saveActiveDebounced = debounce((a: ActiveSession) => {
    void db.saveActive(a);
  }, 1200);
  const saveSettingsDebounced = debounce((c: SessionConfig) => {
    void db.saveSettings(c);
  }, 800);

  useStore.subscribe((state, prev) => {
    if (suspendSync) return;
    if (state.active !== prev.active) {
      if (state.active) {
        saveActiveDebounced(state.active);
      } else {
        saveActiveDebounced.cancel();
        void db.deleteActive();
      }
    }
    if (state.settings !== prev.settings) {
      saveSettingsDebounced(state.settings);
    }
  });

  // Flush a pending active-session save before the tab is hidden/closed.
  const flushActive = () => {
    saveActiveDebounced.flush();
  };
  window.addEventListener("pagehide", flushActive);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushActive();
  });
}

/** True once persisted state has loaded — gate client UI on this to avoid SSR mismatch. */
export function useHydrated(): boolean {
  return useStore((s) => s.hasHydrated);
}
