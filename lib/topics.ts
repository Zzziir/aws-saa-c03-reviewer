import type { Domain } from "./types";

/**
 * Fine-grained AWS service/topic taxonomy layered on top of the four exam
 * domains. Each question maps to exactly one topic (see `question-topics.ts`),
 * which powers per-topic strengths/weaknesses and the weighted suggested set.
 */
export type TopicSlug =
  // secure
  | "sec-iam"
  | "sec-federation"
  | "sec-encryption"
  | "sec-network"
  | "sec-detect"
  | "sec-secrets"
  // resilient
  | "res-scaling"
  | "res-ha"
  | "res-decouple"
  | "res-backup"
  | "res-dns"
  | "res-durability"
  // performance
  | "perf-caching"
  | "perf-compute"
  | "perf-database"
  | "perf-storage"
  | "perf-network"
  // cost
  | "cost-storage"
  | "cost-compute"
  | "cost-transfer"
  | "cost-rightsize"
  | "cost-tooling";

export interface TopicMeta {
  slug: TopicSlug;
  label: string;
  domain: Domain;
}

/** Canonical ordering, grouped by domain (drives display order). */
export const TOPICS: TopicMeta[] = [
  { slug: "sec-iam", label: "IAM & Policies", domain: "secure" },
  { slug: "sec-federation", label: "Identity Federation & Cognito", domain: "secure" },
  { slug: "sec-encryption", label: "KMS & Encryption", domain: "secure" },
  { slug: "sec-network", label: "Network Security", domain: "secure" },
  { slug: "sec-detect", label: "Detection & Audit", domain: "secure" },
  { slug: "sec-secrets", label: "Secrets Management", domain: "secure" },

  { slug: "res-scaling", label: "Auto Scaling & ELB", domain: "resilient" },
  { slug: "res-ha", label: "Multi-AZ & Failover", domain: "resilient" },
  { slug: "res-decouple", label: "Decoupling (SQS/SNS)", domain: "resilient" },
  { slug: "res-backup", label: "Backup & Disaster Recovery", domain: "resilient" },
  { slug: "res-dns", label: "Route 53 & DNS", domain: "resilient" },
  { slug: "res-durability", label: "Storage Durability", domain: "resilient" },

  { slug: "perf-caching", label: "Caching (CloudFront/ElastiCache)", domain: "performance" },
  { slug: "perf-compute", label: "Compute Optimization", domain: "performance" },
  { slug: "perf-database", label: "Database Performance", domain: "performance" },
  { slug: "perf-storage", label: "Storage Performance", domain: "performance" },
  { slug: "perf-network", label: "Networking (VPC/TGW)", domain: "performance" },

  { slug: "cost-storage", label: "S3 Tiering & Lifecycle", domain: "cost" },
  { slug: "cost-compute", label: "Compute Pricing (Spot/RIs)", domain: "cost" },
  { slug: "cost-transfer", label: "Data Transfer Costs", domain: "cost" },
  { slug: "cost-rightsize", label: "Right-Sizing", domain: "cost" },
  { slug: "cost-tooling", label: "Cost Tooling", domain: "cost" },
];

export const TOPIC_META: Record<TopicSlug, TopicMeta> = Object.fromEntries(
  TOPICS.map((t) => [t.slug, t]),
) as Record<TopicSlug, TopicMeta>;

export const TOPICS_BY_DOMAIN: Record<Domain, TopicMeta[]> = {
  secure: TOPICS.filter((t) => t.domain === "secure"),
  resilient: TOPICS.filter((t) => t.domain === "resilient"),
  performance: TOPICS.filter((t) => t.domain === "performance"),
  cost: TOPICS.filter((t) => t.domain === "cost"),
};

export function topicLabel(slug: TopicSlug): string {
  return TOPIC_META[slug]?.label ?? slug;
}
