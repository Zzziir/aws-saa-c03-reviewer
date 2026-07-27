export type Domain = "secure" | "resilient" | "performance" | "cost";
export type Difficulty = "easy" | "medium" | "hard";
export type Mode = "reviewer" | "exam";

export interface Question {
  id: number;
  domain: Domain;
  difficulty: Difficulty;
  question: string;
  options: string[];
  /** Index (single-answer) or sorted indices (multi-answer) of the correct option(s). */
  answer: number | number[];
  explanation: string;
  keyTakeaway: string;
}

/** Difficulty filter chosen at setup. "mixed" draws from every difficulty. */
export type DifficultyFilter = Difficulty | "mixed";

export interface SessionConfig {
  mode: Mode;
  count: number;
  /** Duration in seconds. */
  durationSec: number;
  difficulty: DifficultyFilter;
  /** Domains included; empty means all four. */
  domains: Domain[];
}

/** A user's response to one question during a run. */
export interface AnswerRecord {
  questionId: number;
  /** Selected option indices, sorted. Empty = unanswered/skipped. */
  selected: number[];
  correct: boolean;
  flagged: boolean;
}

/** A live, resumable run persisted while in progress. */
export interface ActiveSession {
  id: string;
  config: SessionConfig;
  questionIds: number[];
  index: number;
  answers: Record<number, AnswerRecord>;
  startedAt: number;
  /** Accumulated elapsed seconds while running (excludes paused time). */
  elapsedSec: number;
  paused: boolean;
  /** Timestamp when the current running segment began; null while paused. */
  segmentStart: number | null;
  finished: boolean;
}

/** Per-domain score slice used in results and analytics. */
export interface DomainBreakdown {
  domain: Domain;
  total: number;
  correct: number;
}

/** A completed attempt, stored in history. */
export interface Attempt {
  id: string;
  mode: Mode;
  config: SessionConfig;
  date: number;
  durationSec: number;
  total: number;
  correct: number;
  scorePct: number;
  passed: boolean;
  breakdown: DomainBreakdown[];
  /** Full per-question detail for the results dropdown / review. */
  answers: AnswerRecord[];
  questionIds: number[];
}
