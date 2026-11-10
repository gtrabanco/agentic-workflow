// src/preset.ts
// The NaN preset's data and its derivation (issue #388, amendments 1 + 2).
//
// Everything vendor-specific lives here as data: the provider id, the billing
// tier per model, the four approved cost-posture profiles and each one's
// per-command ladder. Nothing derives a hand-ordered surprise: routing picks
// the selected profile's ladder verbatim, and tier routing (on by default)
// demotes only the mechanical one-way passes to the zero-credit chain.
//
// Fleet basis (provider catalog + tariff table, November 2026): the two
// cluster models cost nothing ever (`free`); the five flash/full models carry
// a monthly free allowance and bill credits beyond it (`quota`); the four
// "larger" models bill credits from token one (`paid`). Reset the whole surface
// with one edit here when the provider changes either side.
//
// Default posture (owner decision, 2026-11-10): no `presetProfile` selection
// resolves `economy` — the opinionated-but-flexible default. The configuration
// is flexible (any profile name, an ordered fallback list, per-skill
// overrides, user-defined profiles shadowing preset entries); without any of
// it, the shipped ladder is what runs.

import type { ModelChain, RecommendedProfile, RouteFile } from "@gtrabanco/pi-agentic-workflow/dist/config/types.js";

export const PROVIDER = "nan";

/** A preset model reference: `provider/modelId`, the exact shape the router stores. */
const ref = (id: string) => `${PROVIDER}/${id}` as `${typeof PROVIDER}/${string}`;

/**
 * The named cost postures the preset contributes (amendment 2, owner-approved
 * 2026-11-10). Route selection: `presetProfile: "economy"`, or an ordered
 * array (`["quality", "economy"]` — the chain demotes to the next entry when a
 * route fails, e.g. as credits run out).
 */
export const PROFILES = ["quality", "balanced", "economy", "no-credits-continue-working"] as const;
export type ProfileName = (typeof PROFILES)[number];

/** Absent selection → `economy`: the recommended posture for most tasks. */
export const DEFAULT_PROFILE: ProfileName = "economy";

/**
 * Billing tier per model (source: the provider's catalog and tariff table,
 * November 2026).
 *  - `free`  — a cluster model with no token counter: costs no credits, ever
 *              (bounded by 1.5M tpm and 5 concurrent requests per model).
 *  - `quota` — a monthly free allowance resets each billing period; credits
 *              bill only the tokens beyond it.
 *  - `paid`  — billed from token one; needs a credit balance or subscription.
 * Re-trigger condition: the provider announces quota or tariff changes →
 * edit here; every ladder derives or is re-cut from these facts.
 */
export type BillingTier = "free" | "quota" | "paid";

export const NAN_MODELS: Readonly<Record<string, BillingTier>> = {
  "qwen3.6": "free",
  "gemma4": "free",
  "deepseek-v4-flash": "quota",
  "glm5.3-flash": "quota",
  "qwen3.8-flash": "quota",
  "mimo-v2.6-flash": "quota",
  "glm5.3": "quota",
  "kimi-k3.1-pro": "paid",
  "qwen3.8-max": "paid",
  "deepseek-v4-pro": "paid",
  "hy4": "paid",
};

const ladder = (models: string[], thinking: RouteFile["thinking"] = "inherit"): RouteFile => ({
  model: models.map(ref),
  thinking,
});

const commandRow = (models: string[], thinking: RouteFile["thinking"]): RouteFile => ladder(models, thinking);

/**
 * The four published ladders, re-cut 2026-11-10 against the refreshed fleet
 * and the independent benchmark evidence (AA Intelligence Index / Terminal-Bench /
 * DeepSWE; vendor claims flagged where unreplicated). Per-task-class rungs:
 *
 *  - merge gates       — `audit-pr`, `product-audit` (thinking high)
 *  - product definition — `unit-lane` (thinking high)
 *  - planning / triage  — `review-change` (thinking high), `triage-issue`,
 *                        `init-workspace`, `advance`
 *  - execution          — `execute-phase`, `fold-findings`,
 *                        `discover-repository-state`, `resolve-repository-state`
 *  - mechanical         — `audit-docs`
 *  - cheap / logging    — `log-session`, `workflow-status`
 */
export const PROFILE_LADDERS: Readonly<Record<ProfileName, RecommendedProfile>> = {
  quality: {
    default: ladder(["kimi-k3.1-pro", "glm5.3", "deepseek-v4-flash"]),
    commands: {
      "audit-pr": commandRow(["glm5.3", "kimi-k3.1-pro", "deepseek-v4-flash"], "high"),
      "product-audit": commandRow(["glm5.3", "kimi-k3.1-pro", "deepseek-v4-flash"], "high"),
      "unit-lane": commandRow(["glm5.3", "kimi-k3.1-pro", "mimo-v2.6-flash"], "high"),
      "review-change": commandRow(["glm5.3-flash", "glm5.3", "deepseek-v4-flash"], "high"),
      "triage-issue": ladder(["glm5.3-flash", "glm5.3", "deepseek-v4-flash"]),
      "init-workspace": ladder(["glm5.3-flash", "glm5.3", "deepseek-v4-flash"]),
      advance: ladder(["glm5.3-flash", "glm5.3", "deepseek-v4-flash"]),
      "execute-phase": ladder(["kimi-k3.1-pro", "glm5.3", "deepseek-v4-flash"]),
      "fold-findings": ladder(["kimi-k3.1-pro", "glm5.3", "deepseek-v4-flash"]),
      "discover-repository-state": ladder(["kimi-k3.1-pro", "glm5.3", "deepseek-v4-flash"]),
      "resolve-repository-state": ladder(["kimi-k3.1-pro", "glm5.3", "deepseek-v4-flash"]),
      "audit-docs": ladder(["deepseek-v4-flash", "glm5.3-flash"]),
      "log-session": ladder(["qwen3.6", "qwen3.8-flash"]),
      "workflow-status": ladder(["qwen3.6", "qwen3.8-flash"]),
    },
  },
  balanced: {
    default: ladder(["deepseek-v4-flash", "glm5.3-flash", "mimo-v2.6-flash"]),
    commands: {
      "audit-pr": commandRow(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-pro"], "high"),
      "product-audit": commandRow(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-pro"], "high"),
      "unit-lane": commandRow(["mimo-v2.6-flash", "glm5.3-flash", "deepseek-v4-pro"], "high"),
      "review-change": commandRow(["glm5.3-flash", "deepseek-v4-flash", "deepseek-v4-pro"], "high"),
      "triage-issue": ladder(["glm5.3-flash", "deepseek-v4-flash", "deepseek-v4-pro"]),
      "init-workspace": ladder(["glm5.3-flash", "deepseek-v4-flash", "deepseek-v4-pro"]),
      advance: ladder(["glm5.3-flash", "deepseek-v4-flash", "deepseek-v4-pro"]),
      "execute-phase": ladder(["deepseek-v4-flash", "glm5.3-flash", "mimo-v2.6-flash"]),
      "fold-findings": ladder(["deepseek-v4-flash", "glm5.3-flash", "mimo-v2.6-flash"]),
      "discover-repository-state": ladder(["deepseek-v4-flash", "glm5.3-flash", "mimo-v2.6-flash"]),
      "resolve-repository-state": ladder(["deepseek-v4-flash", "glm5.3-flash", "mimo-v2.6-flash"]),
      "audit-docs": ladder(["deepseek-v4-flash", "glm5.3-flash"]),
      "log-session": ladder(["qwen3.6", "gemma4", "qwen3.8-flash"]),
      "workflow-status": ladder(["qwen3.6", "gemma4", "qwen3.8-flash"]),
    },
  },
  economy: {
    default: ladder(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-flash"]),
    commands: {
      "audit-pr": commandRow(["mimo-v2.6-flash", "glm5.3-flash", "deepseek-v4-flash"], "high"),
      "product-audit": commandRow(["mimo-v2.6-flash", "glm5.3-flash", "deepseek-v4-flash"], "high"),
      "unit-lane": commandRow(["mimo-v2.6-flash", "glm5.3-flash"], "high"),
      "review-change": commandRow(["glm5.3-flash", "mimo-v2.6-flash"], "high"),
      "triage-issue": ladder(["glm5.3-flash", "mimo-v2.6-flash"]),
      "init-workspace": ladder(["glm5.3-flash", "mimo-v2.6-flash"]),
      advance: ladder(["glm5.3-flash", "mimo-v2.6-flash"]),
      "execute-phase": ladder(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-flash"]),
      "fold-findings": ladder(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-flash"]),
      "discover-repository-state": ladder(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-flash"]),
      "resolve-repository-state": ladder(["glm5.3-flash", "mimo-v2.6-flash", "deepseek-v4-flash"]),
      "audit-docs": ladder(["glm5.3-flash", "deepseek-v4-flash"]),
      "log-session": ladder(["qwen3.6", "gemma4"]),
      "workflow-status": ladder(["qwen3.6", "gemma4"]),
    },
  },
  "no-credits-continue-working": {
    default: ladder(["deepseek-v4-flash", "glm5.3-flash", "qwen3.8-flash", "qwen3.6"]),
    commands: {
      "audit-pr": commandRow(["mimo-v2.6-flash", "glm5.3-flash", "deepseek-v4-flash", "qwen3.6"], "high"),
      "product-audit": commandRow(["mimo-v2.6-flash", "glm5.3-flash", "deepseek-v4-flash", "qwen3.6"], "high"),
      "unit-lane": commandRow(["mimo-v2.6-flash", "glm5.3-flash", "deepseek-v4-flash"], "high"),
      "review-change": commandRow(["glm5.3-flash", "deepseek-v4-flash", "qwen3.8-flash"], "high"),
      "triage-issue": ladder(["glm5.3-flash", "deepseek-v4-flash", "qwen3.8-flash"]),
      "init-workspace": ladder(["glm5.3-flash", "deepseek-v4-flash", "qwen3.8-flash"]),
      advance: ladder(["glm5.3-flash", "deepseek-v4-flash", "qwen3.8-flash"]),
      "execute-phase": ladder(["deepseek-v4-flash", "glm5.3-flash", "qwen3.8-flash", "qwen3.6"]),
      "fold-findings": ladder(["deepseek-v4-flash", "glm5.3-flash", "qwen3.8-flash", "qwen3.6"]),
      "discover-repository-state": ladder(["deepseek-v4-flash", "glm5.3-flash", "qwen3.8-flash", "qwen3.6"]),
      "resolve-repository-state": ladder(["deepseek-v4-flash", "glm5.3-flash", "qwen3.8-flash", "qwen3.6"]),
      "audit-docs": ladder(["qwen3.6", "gemma4"]),
      "log-session": ladder(["qwen3.6", "gemma4"]),
      "workflow-status": ladder(["qwen3.6", "gemma4"]),
    },
  },
};

/**
 * Today's published ladder for the mainstream posture — the routing-off
 * reference the README documents table-by-table (the `PUBLISHED_LADDER`
 * byte-pin from amendment 1 now points at the data it always meant: the
 * balanced baseline).
 */
export const PUBLISHED_LADDER: RecommendedProfile = PROFILE_LADDERS.balanced;

/** Every command a profile publishes. */
export const ROUTED_COMMANDS: readonly string[] = [
  "audit-pr",
  "product-audit",
  "unit-lane",
  "review-change",
  "triage-issue",
  "init-workspace",
  "advance",
  "execute-phase",
  "fold-findings",
  "discover-repository-state",
  "resolve-repository-state",
  "audit-docs",
  "log-session",
  "workflow-status",
];

/**
 * Under tier routing (on by default) only these mechanical, one-way passes —
 * whose output review re-checks or whose stakes are nil — demote to the
 * zero-credit chain. Everything else (executor phases included: their flash
 * rungs live inside the monthly free allowances) keeps its profile's ladder.
 */
export const ROUTING_DEMOTE_COMMANDS: readonly string[] = ["log-session", "workflow-status", "audit-docs"];

/**
 * The task-class catalog for work skills spawn (subagents, child sessions,
 * conductor continuations, cheap catalog passes): `strengthSensitive: false`
 * resolves to the zero-credit chain under tier routing (issue #388 S3).
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
  /** Amendment 2: which named profile resolves. Unknown names fall back to
   *  `DEFAULT_PROFILE` — a typo must pick a sane posture, never crash. */
  profile?: string;
}

/** The zero-credit chain, derived from the tier map in catalog order. */
export function freeChain(): ModelChain {
  return Object.entries(NAN_MODELS)
    .filter(([, tier]) => tier === "free")
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

/** The selected profile's name: a catalog member, else the default posture. */
export function resolveProfileName(profile: string | undefined): ProfileName {
  return (PROFILES as readonly string[]).includes(profile ?? "") ? (profile as ProfileName) : DEFAULT_PROFILE;
}

/** Derive one skill's route from the selected profile + tier policy (pure). */
export function deriveCommandRoute(skill: string, opts: TierRoutingOptions = {}): RouteFile {
  const profileLadder = PROFILE_LADDERS[resolveProfileName(opts.profile)];
  const published = profileLadder.commands[skill] ?? profileLadder.default;
  if (!routingEnabledFor(skill, opts.tierRouting)) return { ...published };
  if (ROUTING_DEMOTE_COMMANDS.includes(skill)) return { model: freeChain(), thinking: published.thinking };
  return { ...published };
}

/** The full preset ladder for one resolution (pure). */
export function resolvePresetProfile(opts: TierRoutingOptions = {}): RecommendedProfile {
  const commands: Record<string, RouteFile> = {};
  for (const skill of ROUTED_COMMANDS) {
    commands[skill] = deriveCommandRoute(skill, opts);
  }
  return { default: deriveCommandRoute("(unclassified)", opts), commands };
}

/** Route one spawned task class under the same tier policy (issue #388 S3). */
export function resolveTaskRoute(taskClass: string, opts: TierRoutingOptions = {}): RouteFile {
  const classification = TASK_CLASSES[taskClass];
  const profileLadder = PROFILE_LADDERS[resolveProfileName(opts.profile)];
  const published = profileLadder.default ?? { model: freeChain(), thinking: "inherit" as const };
  if (!classification) return { ...published };
  if (!classification.strengthSensitive && routingEnabledFor(taskClass, opts.tierRouting)) {
    return { model: freeChain(), thinking: published.thinking ?? "inherit" };
  }
  return { ...published };
}
