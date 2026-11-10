// src/preset.ts
// The NaN preset's data and its tier-aware derivation (issue #388).
//
// Everything vendor-specific lives here as data: the provider id, the quota
// tier per model, today's published ladder (the routing-off reference), and
// the strength classification per skill/task class. `qwen3.6` unlimited is
// "for now" — when the provider changes its quota structure, a one-line edit
// to `NAN_MODELS` is the whole change, and every ladder follows.
//
// Ladder order is DERIVED from tier + task class (issue #388 amendment 1, S5):
// no per-skill hand-ordered array may drift from the tier facts.

import type { ModelChain, RecommendedProfile, RouteFile } from "@gtrabanco/pi-agentic-workflow/dist/config/types.js";

export const PROVIDER = "nan";

/** A preset model reference: `provider/modelId`, the exact shape the router stores. */
const ref = (id: string) => `${PROVIDER}/${id}` as `${typeof PROVIDER}/${string}`;

/** Quota tiers the provider currently publishes. */
export type QuotaTier = "unlimited" | "limited";

/**
 * The tier facts (source: the provider's catalog and the member FAQ — the
 * cluster models carry no token counter, i.e. unlimited).
 * Re-trigger condition: the provider announces quota changes → edit here.
 */
export const NAN_MODELS: Readonly<Record<string, QuotaTier>> = {
  "qwen3.6": "unlimited",
  "gemma4": "unlimited",
  "glm5.3": "limited",
  "glm5.3-flash": "limited",
  "deepseek-v4-flash": "limited",
  "mimo-v2.6-flash": "limited",
};

/**
 * Today's published ladder — the routing-off reference order (issue #388 S5:
 * "the ladders match today's published order — no silent quality regression
 * for users who disable routing"). Judgment slots use the Xiaomi family for
 * reviewer independence from the DeepSeek/GLM executors; mimo-v2.6-flash
 * supersedes mimo-v2.5 there (same family, same 1.0B quota, OpenAI-`tools`-
 * native, stronger on the shared coding/agentic benchmarks).
 */
export const PUBLISHED_LADDER: RecommendedProfile = {
  default: { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
  commands: {
    "audit-pr": { model: [`${PROVIDER}/mimo-v2.6-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "high" },
    "product-audit": { model: [`${PROVIDER}/glm5.3`, `${PROVIDER}/mimo-v2.6-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "high" },
    "review-change": { model: [`${PROVIDER}/mimo-v2.6-flash`, `${PROVIDER}/glm5.3-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "high" },
    "unit-lane": { model: [`${PROVIDER}/mimo-v2.6-flash`, `${PROVIDER}/glm5.3-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "high" },
    "triage-issue": { model: [`${PROVIDER}/glm5.3-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "inherit" },
    "init-workspace": { model: [`${PROVIDER}/glm5.3-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "inherit" },
    "execute-phase": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "fold-findings": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "log-session": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "workflow-status": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "audit-docs": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "discover-repository-state": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "resolve-repository-state": { model: [`${PROVIDER}/deepseek-v4-flash`, `${PROVIDER}/glm5.3-flash`], thinking: "inherit" },
    "advance": { model: [`${PROVIDER}/glm5.3-flash`, `${PROVIDER}/deepseek-v4-flash`], thinking: "inherit" },
  },
};

/**
 * Skills whose output quality is load-bearing (review axes, audits, planning):
 * the limited tier is reserved for these; everything else derives
 * unlimited-first. Visible data, not folklore (issue #388 S5).
 */
export const STRENGTH_SENSITIVE_SKILLS: readonly string[] = [
  "audit-pr",
  "product-audit",
  "review-change",
  "unit-lane",
];

/**
 * The task-class catalog for work skills spawn (subagents, child sessions,
 * conductor continuations, cheap catalog passes): unlimited-first unless the
 * class is declared strength-sensitive (issue #388 S3/S5).
 */
export const TASK_CLASSES: Readonly<Record<string, { strengthSensitive: boolean }>> = {
  "review-axis": { strengthSensitive: true },
  "audit-verdict": { strengthSensitive: true },
  "planning": { strengthSensitive: true },
  "summarization": { strengthSensitive: false },
  "triage": { strengthSensitive: false },
  "mechanical-logging": { strengthSensitive: false },
  "catalog-step": { strengthSensitive: false },
  "conduction": { strengthSensitive: false },
};

/** The tier-routing opt-out, exactly the config key's shape (issue #388). */
export type TierRoutingSetting = boolean | { enabled?: boolean; skills?: Record<string, boolean> } | undefined;

export interface TierRoutingOptions {
  tierRouting?: TierRoutingSetting;
}

/** The unlimited-tier chain, derived from the tier map in catalog order. */
export function unlimitedChain(): ModelChain {
  return Object.entries(NAN_MODELS)
    .filter(([, tier]) => tier === "unlimited")
    .map(([id]) => ref(id));
}

/** Whether tier routing applies to one skill, given the opt-out setting. */
export function routingEnabledFor(skill: string, tierRouting: TierRoutingSetting = undefined): boolean {
  const tr = tierRouting;
  if (tr === false) return false;
  if (tr === true || tr === undefined) return true;
  if (tr.skills && skill in tr.skills) return tr.skills[skill];
  return tr.enabled !== false;
}

/** Derive one skill's route from tier + classification (pure). */
export function deriveCommandRoute(skill: string, opts: TierRoutingOptions = {}): RouteFile {
  const published =
    PUBLISHED_LADDER.commands[skill] ?? PUBLISHED_LADDER.default;
  if (!routingEnabledFor(skill, opts.tierRouting)) return { ...published };
  if (STRENGTH_SENSITIVE_SKILLS.includes(skill)) return { ...published };
  return { model: unlimitedChain(), thinking: published.thinking };
}

/** The full preset ladder for one resolution (pure). */
export function resolvePresetProfile(opts: TierRoutingOptions = {}): RecommendedProfile {
  const commands: Record<string, RouteFile> = {};
  for (const skill of Object.keys(PUBLISHED_LADDER.commands)) {
    commands[skill] = deriveCommandRoute(skill, opts);
  }
  return {
    default: deriveCommandRoute("(unclassified)", opts),
    commands,
  };
}

/** Route one spawned task class under the same tier policy (issue #388 S3). */
export function resolveTaskRoute(taskClass: string, opts: TierRoutingOptions = {}): RouteFile {
  const classification = TASK_CLASSES[taskClass];
  if (!classification) return deriveCommandRoute("(unclassified)", opts);
  if (!classification.strengthSensitive && routingEnabledFor(taskClass, opts.tierRouting)) {
    return { model: unlimitedChain(), thinking: "inherit" };
  }
  return { ...PUBLISHED_LADDER.default };
}
