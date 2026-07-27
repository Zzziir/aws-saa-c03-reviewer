import type { Attempt, Difficulty, Domain } from "./types";
import { DOMAIN_ORDER, getQuestion } from "./questions";

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
