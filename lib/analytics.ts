import type { Attempt, Difficulty, Domain } from "./types";
import { DOMAIN_ORDER, getQuestion, QUESTIONS } from "./questions";
import { TOPICS, type TopicSlug } from "./topics";

export interface DomainStat {
  domain: Domain;
  total: number;
  correct: number;
  pct: number;
}
export interface DifficultyStat {
  difficulty: Difficulty;
  total: number;
  correct: number;
  pct: number;
}
export interface ScorePoint {
  date: number;
  pct: number;
  label: string;
}

export interface Analytics {
  runs: number;
  totalQuestions: number;
  totalCorrect: number;
  totalTimeSec: number;
  avgScore: number;
  bestScore: number;
  lastScore: number;
  passRate: number;
  /** 0–100; higher = more consistent (lower score variance). */
  consistency: number;
  byDomain: DomainStat[];
  byDifficulty: DifficultyStat[];
  series: ScorePoint[];
  weakestDomain: DomainStat | null;
}

const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard"];

export function computeAnalytics(history: Attempt[]): Analytics {
  const chrono = [...history].sort((a, b) => a.date - b.date);
  const runs = chrono.length;

  const domainAcc: Record<string, { total: number; correct: number }> = {};
  for (const d of DOMAIN_ORDER) domainAcc[d] = { total: 0, correct: 0 };
  const diffAcc: Record<string, { total: number; correct: number }> = {};
  for (const d of DIFF_ORDER) diffAcc[d] = { total: 0, correct: 0 };

  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTimeSec = 0;
  let passes = 0;

  for (const attempt of chrono) {
    totalTimeSec += attempt.durationSec;
    if (attempt.passed) passes += 1;
    for (const a of attempt.answers) {
      const q = getQuestion(a.questionId);
      if (!q) continue;
      totalQuestions += 1;
      if (a.correct) totalCorrect += 1;
      domainAcc[q.domain].total += 1;
      diffAcc[q.difficulty].total += 1;
      if (a.correct) {
        domainAcc[q.domain].correct += 1;
        diffAcc[q.difficulty].correct += 1;
      }
    }
  }

  const scores = chrono.map((a) => a.scorePct);
  const avgScore = runs
    ? Math.round(scores.reduce((s, x) => s + x, 0) / runs)
    : 0;
  const bestScore = runs ? Math.max(...scores) : 0;
  const lastScore = runs ? scores[scores.length - 1] : 0;

  // Consistency: inverse of population standard deviation, scaled to 0–100.
  let consistency = 100;
  if (runs >= 2) {
    const mean = scores.reduce((s, x) => s + x, 0) / runs;
    const variance =
      scores.reduce((s, x) => s + (x - mean) ** 2, 0) / runs;
    const std = Math.sqrt(variance);
    consistency = Math.max(0, Math.round(100 - std * 2.2));
  }

  const byDomain: DomainStat[] = DOMAIN_ORDER.map((d) => {
    const { total, correct } = domainAcc[d];
    return {
      domain: d,
      total,
      correct,
      pct: total ? Math.round((correct / total) * 100) : 0,
    };
  });

  const byDifficulty: DifficultyStat[] = DIFF_ORDER.map((d) => {
    const { total, correct } = diffAcc[d];
    return {
      difficulty: d,
      total,
      correct,
      pct: total ? Math.round((correct / total) * 100) : 0,
    };
  });

  const series: ScorePoint[] = chrono.map((a, i) => ({
    date: a.date,
    pct: a.scorePct,
    label: `#${i + 1}`,
  }));

  const attempted = byDomain.filter((d) => d.total > 0);
  const weakestDomain = attempted.length
    ? attempted.reduce((min, d) => (d.pct < min.pct ? d : min))
    : null;

  return {
    runs,
    totalQuestions,
    totalCorrect,
    totalTimeSec,
    avgScore,
    bestScore,
    lastScore,
    passRate: runs ? Math.round((passes / runs) * 100) : 0,
    consistency,
    byDomain,
    byDifficulty,
    series,
    weakestDomain,
  };
}

// --- topic-level strengths & weaknesses --------------------------------------

export interface TopicStat {
  slug: TopicSlug;
  label: string;
  domain: Domain;
  total: number;
  correct: number;
  pct: number;
}

/** A topic must have at least this many answered questions before we classify it. */
export const TOPIC_MIN_SAMPLE = 5;
/** Accuracy at or above this = a strength; below WEAKNESS_PCT = needs work. */
export const STRENGTH_PCT = 80;
export const WEAKNESS_PCT = 60;

/** Per-topic accuracy across all history. Includes every topic (0-sample too). */
export function computeTopicStats(history: Attempt[]): TopicStat[] {
  const acc: Record<string, { total: number; correct: number }> = {};
  for (const t of TOPICS) acc[t.slug] = { total: 0, correct: 0 };

  for (const attempt of history) {
    for (const a of attempt.answers) {
      const q = getQuestion(a.questionId);
      if (!q) continue;
      const s = acc[q.topic];
      if (!s) continue;
      s.total += 1;
      if (a.correct) s.correct += 1;
    }
  }

  return TOPICS.map((t) => {
    const { total, correct } = acc[t.slug];
    return {
      slug: t.slug,
      label: t.label,
      domain: t.domain,
      total,
      correct,
      pct: total ? Math.round((correct / total) * 100) : 0,
    };
  });
}

/** Split classified topics into strengths and weaknesses (min-sample gated). */
export function classifyTopics(stats: TopicStat[]): {
  strengths: TopicStat[];
  weaknesses: TopicStat[];
} {
  const eligible = stats.filter((s) => s.total >= TOPIC_MIN_SAMPLE);
  return {
    strengths: eligible
      .filter((s) => s.pct >= STRENGTH_PCT)
      .sort((a, b) => b.pct - a.pct || b.total - a.total),
    weaknesses: eligible
      .filter((s) => s.pct < WEAKNESS_PCT)
      .sort((a, b) => a.pct - b.pct || b.total - a.total),
  };
}

// --- suggested exam set (weighted mix) ---------------------------------------

type Bucket = "weak" | "dev" | "strong";

/** Composition of a suggested set, for display alongside the CTA. */
export interface SuggestedMix {
  ids: number[];
  weak: number;
  dev: number;
  strong: number;
  weakTopics: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a targeted practice set weighted toward weak areas (~65% weak, ~20%
 * developing, ~15% maintain-strengths). Under-practiced topics count as gaps
 * (weak) so early runs still push into unseen material.
 */
export function buildSuggestedSet(
  history: Attempt[],
  count: number,
): SuggestedMix {
  const stats = computeTopicStats(history);
  const bucketOf = (s: TopicStat): Bucket => {
    if (s.total < TOPIC_MIN_SAMPLE) return "weak";
    if (s.pct < WEAKNESS_PCT) return "weak";
    if (s.pct < STRENGTH_PCT) return "dev";
    return "strong";
  };
  const bucketByTopic = new Map<TopicSlug, Bucket>();
  for (const s of stats) bucketByTopic.set(s.slug, bucketOf(s));

  const pools: Record<Bucket, number[]> = { weak: [], dev: [], strong: [] };
  for (const q of QUESTIONS) {
    pools[bucketByTopic.get(q.topic) ?? "weak"].push(q.id);
  }
  (["weak", "dev", "strong"] as Bucket[]).forEach((b) => {
    pools[b] = shuffle(pools[b]);
  });

  const total = Math.min(count, QUESTIONS.length);
  const want: Record<Bucket, number> = {
    weak: Math.round(total * 0.65),
    dev: Math.round(total * 0.2),
    strong: 0,
  };
  want.strong = Math.max(0, total - want.weak - want.dev);

  const chosen: number[] = [];
  const tally: Record<Bucket, number> = { weak: 0, dev: 0, strong: 0 };
  (["weak", "dev", "strong"] as Bucket[]).forEach((b) => {
    const n = Math.min(want[b], pools[b].length);
    chosen.push(...pools[b].splice(0, n));
    tally[b] += n;
  });

  // Backfill any shortfall (a thin bucket) from whatever's left, weak first.
  if (chosen.length < total) {
    const leftover: Array<[Bucket, number]> = [
      ...pools.weak.map((id) => ["weak", id] as [Bucket, number]),
      ...pools.dev.map((id) => ["dev", id] as [Bucket, number]),
      ...pools.strong.map((id) => ["strong", id] as [Bucket, number]),
    ];
    for (const [b, id] of leftover) {
      if (chosen.length >= total) break;
      chosen.push(id);
      tally[b] += 1;
    }
  }

  const { weaknesses } = classifyTopics(stats);
  return {
    ids: shuffle(chosen),
    weak: tally.weak,
    dev: tally.dev,
    strong: tally.strong,
    weakTopics: weaknesses.slice(0, 3).map((w) => w.label),
  };
}
