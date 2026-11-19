/**
 * The model-aware phase-batching contract (`phase-batching@1`) — issue #632's
 * machine envelope.
 *
 * One versioned document, the journal-entry and batch-plan precedent: a
 * contract id, a version, a `schema` token, closed vocabularies, a
 * dependency-free validator, and — deliberately — no open map. The document is
 * the whole answer a consumer reads, so an unknown key is refused rather than
 * ignored.
 *
 * **What it carries, and what it does not.** The document reports a
 * recommendation and the facts it was made from: the eligibility the caller
 * stated, the model's capability record when one was found, the decision, the
 * phase count, the one reason that decides it, and the degradations a
 * fail-closed answer declares. It carries no route, no tier and no gate: a
 * consumer that reads it can run a whole unit in one context or one phase per
 * turn, and the workflow's gates are identical either way.
 *
 * **Three axes agree.** `decision` says batched or not, `phases_per_context`
 * says how many, `reason` says why — and the validator refuses any pair that
 * contradicts the third, including a count above the model's own
 * `max_phases_per_context` and a count above the phases the caller said remain.
 * A reason no consumer can act on is a defect, so the vocabulary is closed and
 * total: the policy's every branch answers exactly one of them.
 *
 * The policy itself lives where the model knowledge lives — the provider preset
 * (`@gtrabanco/pi-nan-agentic-workflow`), per issue #632's own words. This
 * module owns the vocabulary and the shape, so a preset cannot invent a token
 * and a consumer cannot read one that nothing publishes
 * (`vocabulary-residency@1`).
 */

import { RISK_TIER_KINDS, SIZE_TIER_KINDS } from "./vocabularies.js";
import type { RiskTier, SizeTier } from "./vocabularies.js";

/** The contract id of the canonical recommendation. */
export const PHASE_BATCHING_CONTRACT_ID = "agentic-workflow/phase-batching";

/** The schema token printed in the document's `schema` field. */
export const PHASE_BATCHING_SCHEMA = "phase-batching@1";

/** The version constant: adding or changing a core field bumps this. */
export const PHASE_BATCHING_VERSION = 1;

/**
 * The ceiling the policy can never exceed, whatever a capability record claims:
 * past four phases in one context the batch stops being a context-window
 * economy and becomes the failure mode batching was meant to avoid — one long
 * turn whose step repetition nobody re-reads between phases.
 */
export const PHASE_BATCHING_MAX_PHASES = 4;

/**
 * The closed decision set. Two values, not three: a fail-closed answer is still
 * a decision — `one-phase-per-turn` — and the *reason* says why, so no consumer
 * has to interpret an `unknown` token.
 */
export const PHASE_BATCHING_DECISIONS = Object.freeze(["batched-phases", "one-phase-per-turn"] as const);
export type PhaseBatchingDecision = (typeof PHASE_BATCHING_DECISIONS)[number];

/**
 * The closed reason set — the only thing that turns a decision into an
 * explanation. The first two are the shipped posture and the fail-closed
 * unknown model; the next five are the eligibility gates in the order the
 * policy applies them; the last two are the answer itself.
 *
 *  - `config-off` — the config key is off; nothing was inspected, because the
 *    operator asked for today's behaviour byte for byte.
 *  - `model-unknown` — no capability record exists for the model, so no claim
 *    about its context is available.
 *  - `risk-tier-high` — a `high` risk tier never batches.
 *  - `size-tier-large` — a `large` unit never batches.
 *  - `relay-in-flow` — a unit carrying a Relay leg never batches.
 *  - `tool-harness-xml` — the model documents XML tool calling only, which the
 *    executor path's harness does not drive.
 *  - `tool-harness-unmeasured` — the record states no documented harness.
 *  - `cache-posture-unmeasured` — the record states no cache economics, so a
 *    saving cannot be claimed.
 *  - `cache-posture-flat` — the provider bills a cached read at the input rate,
 *    so batching that re-reads a prefix saves nothing.
 *  - `single-phase` — one phase remains; there is nothing to batch.
 *  - `phases-batched` — the answer: N phases in one context.
 */
export const PHASE_BATCHING_REASON_KINDS = Object.freeze([
  "config-off",
  "model-unknown",
  "risk-tier-high",
  "size-tier-large",
  "relay-in-flow",
  "tool-harness-xml",
  "tool-harness-unmeasured",
  "cache-posture-unmeasured",
  "cache-posture-flat",
  "single-phase",
  "phases-batched",
] as const);
export type PhaseBatchingReason = (typeof PHASE_BATCHING_REASON_KINDS)[number];

/**
 * The tool-harness vocabulary: what a model documents for the OpenAI `tools`
 * harness the executor path drives. `unmeasured` is a first-class value — a
 * model whose record states nothing is not "probably fine".
 */
export const PHASE_BATCHING_TOOL_HARNESSES = Object.freeze(["native", "xml", "unmeasured"] as const);
export type PhaseBatchingToolHarness = (typeof PHASE_BATCHING_TOOL_HARNESSES)[number];

/**
 * The cache-posture vocabulary, derived from the provider's own rate pair: a
 * `cached` rate below the `input` rate is `discounted`, an equal one is `flat`,
 * and a model that publishes no rate pair is `unmeasured` — never `flat`, which
 * would read as a measurement nobody made.
 */
export const PHASE_BATCHING_CACHE_POSTURES = Object.freeze(["discounted", "flat", "unmeasured"] as const);
export type PhaseBatchingCachePosture = (typeof PHASE_BATCHING_CACHE_POSTURES)[number];

/**
 * The closed degradation set — a fail-closed answer says which fact it could
 * not read. `unknown-model` accompanies `model-unknown`;
 * `unmeasured-capability` accompanies the two `unmeasured` reasons.
 */
export const PHASE_BATCHING_DEGRADATIONS = Object.freeze(["unknown-model", "unmeasured-capability"] as const);
export type PhaseBatchingDegradation = (typeof PHASE_BATCHING_DEGRADATIONS)[number];

/** The closed top-level key list. */
export const PHASE_BATCHING_FIELDS = Object.freeze([
  "contract",
  "version",
  "schema",
  "decision",
  "phases_per_context",
  "reason",
  "model",
  "capability",
  "eligibility",
  "degradations",
] as const);

/** One model's capability record: facts about the model, never about a task. */
export interface ModelPhaseCapability {
  /** The model's recorded context window, in tokens. */
  readonly context_window: number;
  /** What the model documents for the executor path's tool harness. */
  readonly tool_harness: PhaseBatchingToolHarness;
  /** How many executor phases this model's record lets one context hold. */
  readonly max_phases_per_context: number;
  /** The provider's stated cache economics for a growing prefix. */
  readonly cache_posture: PhaseBatchingCachePosture;
}

/** The unit facts the caller states; both tier values are published vocabularies. */
export interface PhaseBatchingEligibility {
  readonly risk_tier: RiskTier;
  readonly size_tier: SizeTier;
  readonly relay_in_flow: boolean;
  readonly phases_remaining: number;
}

/** The published document. */
export interface PhaseBatchingRecommendation {
  readonly contract: typeof PHASE_BATCHING_CONTRACT_ID;
  readonly version: typeof PHASE_BATCHING_VERSION;
  readonly schema: typeof PHASE_BATCHING_SCHEMA;
  readonly decision: PhaseBatchingDecision;
  readonly phases_per_context: number;
  readonly reason: PhaseBatchingReason;
  readonly model: string;
  readonly capability: ModelPhaseCapability | null;
  readonly eligibility: PhaseBatchingEligibility;
  readonly degradations: readonly PhaseBatchingDegradation[];
}

export interface PhaseBatchingValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

const CAPABILITY_FIELDS = Object.freeze(["context_window", "tool_harness", "max_phases_per_context", "cache_posture"]);
const ELIGIBILITY_FIELDS = Object.freeze(["risk_tier", "size_tier", "relay_in_flow", "phases_remaining"]);

/** The reasons that short-circuit before any capability record is read. */
const UNINSPECTED_REASONS: readonly PhaseBatchingReason[] = ["config-off", "model-unknown"];

/** The reasons that declare `unmeasured-capability`. */
const UNMEASURED_REASONS: readonly PhaseBatchingReason[] = ["tool-harness-unmeasured", "cache-posture-unmeasured"];

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: Record<string, unknown>, label: string, allowed: readonly string[], errors: string[]): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${label} has unexpected key: ${key}`);
  }
}

function rejectMissingKeys(value: Record<string, unknown>, label: string, required: readonly string[], errors: string[]): void {
  for (const key of required) {
    if (!(key in value)) errors.push(`${label} is missing key: ${key}`);
  }
}

function member(value: unknown, set: readonly string[]): value is string {
  return typeof value === "string" && set.includes(value);
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function checkCapability(value: unknown, errors: string[]): ModelPhaseCapability | null {
  if (!isObj(value)) {
    errors.push("capability must be an object");
    return null;
  }
  rejectUnknownKeys(value, "capability", CAPABILITY_FIELDS, errors);
  rejectMissingKeys(value, "capability", CAPABILITY_FIELDS, errors);
  if (!positiveInteger(value.context_window)) {
    errors.push("capability.context_window must be a positive integer");
  }
  if (!member(value.tool_harness, PHASE_BATCHING_TOOL_HARNESSES)) {
    errors.push(`capability.tool_harness must be one of ${PHASE_BATCHING_TOOL_HARNESSES.join(" | ")}`);
  }
  const maxPhases = value.max_phases_per_context;
  const maxValid = typeof maxPhases === "number" && Number.isInteger(maxPhases) && maxPhases >= 1 && maxPhases <= PHASE_BATCHING_MAX_PHASES;
  if (!maxValid) {
    errors.push(`capability.max_phases_per_context must be an integer between 1 and ${PHASE_BATCHING_MAX_PHASES}`);
  }
  if (!member(value.cache_posture, PHASE_BATCHING_CACHE_POSTURES)) {
    errors.push(`capability.cache_posture must be one of ${PHASE_BATCHING_CACHE_POSTURES.join(" | ")}`);
  }
  return maxValid ? (value as unknown as ModelPhaseCapability) : null;
}

function checkEligibility(value: unknown, errors: string[]): PhaseBatchingEligibility | null {
  if (!isObj(value)) {
    errors.push("eligibility must be an object");
    return null;
  }
  rejectUnknownKeys(value, "eligibility", ELIGIBILITY_FIELDS, errors);
  rejectMissingKeys(value, "eligibility", ELIGIBILITY_FIELDS, errors);
  if (!member(value.risk_tier, RISK_TIER_KINDS)) {
    errors.push(`eligibility.risk_tier must be one of ${RISK_TIER_KINDS.join(" | ")}`);
  }
  if (!member(value.size_tier, SIZE_TIER_KINDS)) {
    errors.push(`eligibility.size_tier must be one of ${SIZE_TIER_KINDS.join(" | ")}`);
  }
  if (typeof value.relay_in_flow !== "boolean") {
    errors.push("eligibility.relay_in_flow must be a boolean");
  }
  if (!positiveInteger(value.phases_remaining)) {
    errors.push("eligibility.phases_remaining must be a positive integer");
  }
  return value as unknown as PhaseBatchingEligibility;
}

function checkDegradations(value: unknown, reason: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("degradations must be an array");
    return;
  }
  const seen = new Set<string>();
  for (const entry of value) {
    if (!member(entry, PHASE_BATCHING_DEGRADATIONS)) {
      errors.push(`degradations must be one of ${PHASE_BATCHING_DEGRADATIONS.join(" | ")}`);
      continue;
    }
    if (seen.has(entry)) errors.push("degradations carries no duplicate");
    seen.add(entry);
  }
  if (reason === "model-unknown" && !seen.has("unknown-model")) {
    errors.push("reason model-unknown requires the unknown-model degradation");
  }
  if (UNMEASURED_REASONS.includes(reason as PhaseBatchingReason) && !seen.has("unmeasured-capability")) {
    errors.push(`reason ${reason} requires the unmeasured-capability degradation`);
  }
  if (seen.has("unknown-model") && reason !== "model-unknown") {
    errors.push("degradation unknown-model is declared only when the reason is model-unknown");
  }
  if (seen.has("unmeasured-capability") && !UNMEASURED_REASONS.includes(reason as PhaseBatchingReason)) {
    errors.push("degradation unmeasured-capability is declared only for the two unmeasured reasons");
  }
}

/**
 * Validate one document against `phase-batching@1`. Structural and
 * vocabulary-closed: which recommendation a policy *should* answer stays the
 * policy's tests, while the shape, the tokens and the three-axis agreement are
 * decided here.
 */
export function validatePhaseBatching(value: unknown): PhaseBatchingValidationResult {
  const errors: string[] = [];
  if (!isObj(value)) return { ok: false, errors: ["phase-batching document is not a JSON object"] };

  rejectUnknownKeys(value, "phase-batching document", PHASE_BATCHING_FIELDS, errors);
  rejectMissingKeys(value, "phase-batching document", PHASE_BATCHING_FIELDS, errors);

  if (value.contract !== PHASE_BATCHING_CONTRACT_ID) errors.push(`contract must be ${PHASE_BATCHING_CONTRACT_ID}`);
  if (value.version !== PHASE_BATCHING_VERSION) errors.push(`version must be ${PHASE_BATCHING_VERSION}`);
  if (value.schema !== PHASE_BATCHING_SCHEMA) errors.push(`schema must be ${PHASE_BATCHING_SCHEMA}`);

  if (!member(value.decision, PHASE_BATCHING_DECISIONS)) {
    errors.push(`decision must be one of ${PHASE_BATCHING_DECISIONS.join(" | ")}`);
  }
  if (!member(value.reason, PHASE_BATCHING_REASON_KINDS)) {
    errors.push(`reason must be one of ${PHASE_BATCHING_REASON_KINDS.join(" | ")}`);
  }

  const model = value.model;
  if (typeof model !== "string" || model.length === 0) errors.push("model must be a non-empty string");
  else {
    const slash = model.indexOf("/");
    if (slash <= 0 || slash === model.length - 1) errors.push("model must be a `provider/modelId` reference");
  }

  const count = value.phases_per_context;
  const countValid =
    typeof count === "number" && Number.isInteger(count) && count >= 1 && count <= PHASE_BATCHING_MAX_PHASES;
  if (!countValid) errors.push(`phases_per_context must be an integer between 1 and ${PHASE_BATCHING_MAX_PHASES}`);

  const capability = value.capability === null ? null : checkCapability(value.capability, errors);
  const eligibility = checkEligibility(value.eligibility, errors);
  const reason = typeof value.reason === "string" ? value.reason : "";
  checkDegradations(value.degradations, reason, errors);

  // The capability block is present exactly when the record was inspected.
  if (value.capability === null) {
    if (!UNINSPECTED_REASONS.includes(reason as PhaseBatchingReason)) {
      errors.push(`capability is null only for config-off and model-unknown, not for ${reason || "an absent reason"}`);
    }
  } else if (reason === "model-unknown") {
    errors.push("reason model-unknown carries no capability");
  }

  // The three axes: decision, count and reason cannot disagree.
  if (countValid && member(value.decision, PHASE_BATCHING_DECISIONS)) {
    if (value.decision === "batched-phases" && count < 2) {
      errors.push("decision batched-phases needs at least two phases");
    }
    if (value.decision === "one-phase-per-turn" && count !== 1) {
      errors.push("decision one-phase-per-turn carries exactly one phase");
    }
    if (reason === "phases-batched" && value.decision !== "batched-phases") {
      errors.push("reason phases-batched needs decision batched-phases");
    }
    if (value.decision === "batched-phases" && reason !== "phases-batched") {
      errors.push(`decision batched-phases carries reason phases-batched, not ${reason || "an absent reason"}`);
    }
    if (reason === "single-phase" && count !== 1) {
      errors.push("reason single-phase carries exactly one phase");
    }
  }

  if (countValid && capability !== null && count > capability.max_phases_per_context) {
    errors.push(
      `phases_per_context ${count} exceeds the model's max_phases_per_context ${capability.max_phases_per_context}`,
    );
  }
  if (countValid && eligibility !== null && positiveInteger(eligibility.phases_remaining) && count > eligibility.phases_remaining) {
    errors.push(`phases_per_context ${count} exceeds eligibility.phases_remaining ${eligibility.phases_remaining}`);
  }

  return { ok: errors.length === 0, errors };
}
