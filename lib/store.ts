"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

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

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      settings: DEFAULT_CONFIG,
      active: null,
      history: [],
      flaggedIds: [],

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
          const flaggedIds = s.flaggedIds.includes(questionId)
            ? s.flaggedIds.filter((id) => id !== questionId)
            : [...s.flaggedIds, questionId];
          const patch = mutateActive(s, (a) => {
            const rec = a.answers[questionId];
            const flagged = flaggedIds.includes(questionId);
            a.answers = {
              ...a.answers,
              [questionId]: rec
                ? { ...rec, flagged }
                : { questionId, selected: [], correct: false, flagged },
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
        return attempt.id;
      },

      deleteAttempt: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      clearHistory: () => set({ history: [] }),

      isFlagged: (questionId) => get().flaggedIds.includes(questionId),
    }),
    {
      name: "saa-reviewer-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({
        settings: s.settings,
        active: s.active,
        history: s.history,
        flaggedIds: s.flaggedIds,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Resume the timer cleanly: don't count time while the tab was closed.
        if (state.active && !state.active.paused) {
          state.active.segmentStart = Date.now();
        }
        state.hasHydrated = true;
      },
    },
  ),
);

/** True once persisted state has loaded — gate client UI on this to avoid SSR mismatch. */
export function useHydrated(): boolean {
  return useStore((s) => s.hasHydrated);
}
