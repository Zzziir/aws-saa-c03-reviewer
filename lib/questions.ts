import type { Domain, Difficulty, Question } from "./types";
import raw from "./questions.data.json";

export const QUESTIONS = raw as Question[];

export const PASS_PCT = 72;

export const DOMAIN_META: Record<
  Domain,
  { name: string; short: string; weight: number; hue: string }
> = {
  secure: {
    name: "Design Secure Architectures",
    short: "Secure",
    weight: 30,
    hue: "var(--domain-secure)",
  },
  resilient: {
    name: "Design Resilient Architectures",
    short: "Resilient",
    weight: 26,
    hue: "var(--domain-resilient)",
  },
  performance: {
    name: "Design High-Performing Architectures",
    short: "High-Performing",
    weight: 24,
    hue: "var(--domain-performance)",
  },
  cost: {
    name: "Design Cost-Optimized Architectures",
    short: "Cost-Optimized",
    weight: 20,
    hue: "var(--domain-cost)",
  },
};

export const DOMAIN_ORDER: Domain[] = [
  "secure",
  "resilient",
  "performance",
  "cost",
];

export const DIFFICULTY_META: Record<
  Difficulty,
  { name: string; order: number }
> = {
  easy: { name: "Easy", order: 1 },
  medium: { name: "Medium", order: 2 },
  hard: { name: "Hard", order: 3 },
};

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
export function getQuestion(id: number): Question | undefined {
  return byId.get(id);
}

/** Count of available questions matching a difficulty filter + domain set. */
export function countAvailable(
  difficulty: Difficulty | "mixed",
  domains: Domain[],
): number {
  return QUESTIONS.filter(
    (q) =>
      (difficulty === "mixed" || q.difficulty === difficulty) &&
      (domains.length === 0 || domains.includes(q.domain)),
  ).length;
}
