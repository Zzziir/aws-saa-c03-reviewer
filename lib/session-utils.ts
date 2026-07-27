import type {
  ActiveSession,
  AnswerRecord,
  Attempt,
  DomainBreakdown,
  Question,
  SessionConfig,
} from "./types";
import { DOMAIN_ORDER, PASS_PCT, QUESTIONS, getQuestion } from "./questions";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Correct-answer indices as a sorted array, regardless of single/multi. */
export function answerIndices(q: Question): number[] {
  return (Array.isArray(q.answer) ? q.answer : [q.answer]).slice().sort();
}

export function isMultiAnswer(q: Question): boolean {
  return Array.isArray(q.answer) && q.answer.length > 1;
}

export function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export function isSelectionCorrect(q: Question, selected: number[]): boolean {
  return sameSet(selected, answerIndices(q));
}

/** Pick and randomize the question ids for a new run. */
export function buildQuestionIds(config: SessionConfig): number[] {
  const pool = QUESTIONS.filter(
    (q) =>
      (config.difficulty === "mixed" || q.difficulty === config.difficulty) &&
      (config.domains.length === 0 || config.domains.includes(q.domain)),
  );
  return shuffle(pool)
    .slice(0, Math.min(config.count, pool.length))
    .map((q) => q.id);
}

export function createSession(config: SessionConfig): ActiveSession {
  const now = Date.now();
  return {
    id: `s_${now}_${Math.random().toString(36).slice(2, 7)}`,
    config,
    questionIds: buildQuestionIds(config),
    index: 0,
    answers: {},
    startedAt: now,
    elapsedSec: 0,
    paused: false,
    segmentStart: now,
    finished: false,
  };
}

/** Live elapsed seconds including the currently running segment. */
export function liveElapsed(s: ActiveSession, now = Date.now()): number {
  if (s.paused || s.segmentStart == null) return s.elapsedSec;
  return s.elapsedSec + Math.floor((now - s.segmentStart) / 1000);
}

export function remainingSec(s: ActiveSession, now = Date.now()): number {
  return Math.max(0, s.config.durationSec - liveElapsed(s, now));
}

export function domainBreakdown(
  questionIds: number[],
  answers: Record<number, AnswerRecord> | AnswerRecord[],
): DomainBreakdown[] {
  const map: AnswerRecord[] = Array.isArray(answers)
    ? answers
    : Object.values(answers);
  const answerByQ = new Map(map.map((a) => [a.questionId, a]));
  const acc: Record<string, { total: number; correct: number }> = {};
  for (const d of DOMAIN_ORDER) acc[d] = { total: 0, correct: 0 };
  for (const id of questionIds) {
    const q = getQuestion(id);
    if (!q) continue;
    acc[q.domain].total += 1;
    if (answerByQ.get(id)?.correct) acc[q.domain].correct += 1;
  }
  return DOMAIN_ORDER.filter((d) => acc[d].total > 0).map((d) => ({
    domain: d,
    total: acc[d].total,
    correct: acc[d].correct,
  }));
}

export function finalizeAttempt(s: ActiveSession): Attempt {
  const answers = s.questionIds.map<AnswerRecord>((id) => {
    const rec = s.answers[id];
    return (
      rec ?? {
        questionId: id,
        selected: [],
        correct: false,
        flagged: false,
      }
    );
  });
  const total = s.questionIds.length;
  const correct = answers.filter((a) => a.correct).length;
  const scorePct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return {
    id: s.id,
    mode: s.config.mode,
    config: s.config,
    date: Date.now(),
    durationSec: liveElapsed(s),
    total,
    correct,
    scorePct,
    passed: scorePct >= PASS_PCT,
    breakdown: domainBreakdown(s.questionIds, answers),
    answers,
    questionIds: s.questionIds,
  };
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Human duration like "2 hours 10 minutes" for results/history. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (h === 0 && m === 0) return `${s} second${s === 1 ? "" : "s"}`;
  return parts.join(" ");
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
