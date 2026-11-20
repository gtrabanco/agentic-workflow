// src/phase-batching.ts
// The NaN preset's phase-batching policy (issue #632).
//
// Two halves, both data-first. The **capability record** states, per routed
// model, the four facts the policy needs — and every one of them is a fact the
// recorded catalog already publishes, transcribed here because the runtime
// reads `src/` and never the snapshot (`test/catalog-parity.test.mjs` pins the
// pair):
//
//   context_window           ← the snapshot's `context`
//   tool_harness             ← its `capabilities[]`: "Tool calling" is the
//                              OpenAI `tools` harness the executor path drives,
//                              "Tool calling (XML)" is not; a model that lists
//                              neither states nothing (`unmeasured`)
//   cache_posture            ← its own rate pair: a `cached` rate below the
//                              `input` rate is `discounted`, an equal one is
//                              `flat`, and a model that publishes no pair
//                              states no economics (`unmeasured`)
//   max_phases_per_context   ← the declared thresholds below, applied to those
//                              two facts: the executor harness plus the fleet's
//                              largest window reaches four phases, the smaller
//                              window reaches two, and a model without the
//                              harness batches nothing
//
// The **policy** turns an eligible unit plus that record into the published
// `phase-batching@1` document (owner: `@gtrabanco/agentic-workflow-schema`).
// It ships OFF: with the key off it answers `one-phase-per-turn` / `config-off`
// without inspecting anything, which is the posture the workflow already runs.
// Everything it cannot read fails closed on the same posture, and says which
// fact was missing — an unknown model, an undocumented harness, an unmeasured
// cache, a flat one (a cached read billed at the input rate saves nothing).
//
// It changes no route, no risk tier and no gate: a recommendation is a
// recommendation, and the operator decides.

import {
  PHASE_BATCHING_CONTRACT_ID,
  PHASE_BATCHING_MAX_PHASES,
  PHASE_BATCHING_SCHEMA,
  PHASE_BATCHING_VERSION,
} from "@gtrabanco/agentic-workflow-schema";
import type {
  ModelPhaseCapability,
  PhaseBatchingDegradation,
  PhaseBatchingEligibility,
  PhaseBatchingReason,
  PhaseBatchingRecommendation,
} from "@gtrabanco/agentic-workflow-schema";

import { PROVIDER } from "./preset.js";

/**
 * The preset's declared thresholds. They are policy, not provider data: the
 * window bounds come from the fleet itself (pinned by the sibling parity
 * suite), and the phase counts are this preset's posture — revisable by the
 * tier-cost corpus (#631) when the config key's default-on trigger is met.
 */
export const NAN_PHASE_THRESHOLDS = Object.freeze({
  /** The fleet's largest recorded context window, in tokens. */
  largeContextWindow: 1_000_000,
  /** The fleet's smallest recorded context window, in tokens. */
  smallContextWindow: 262_144,
  /** Phases one context holds on the executor harness and the largest window. */
  phasesOnLargeWindow: PHASE_BATCHING_MAX_PHASES,
  /** …and on the smaller window, which reaches half as far. */
  phasesOnSmallWindow: 2,
  /** A model without the documented executor harness batches nothing. */
  phasesWithoutHarness: 1,
});

/** The transcribed facts, one row per billed model, in `NAN_MODELS` order. */
const RECORDED_FACTS: Readonly<
  Record<string, Omit<ModelPhaseCapability, "max_phases_per_context">>
> = {
  // Unlimited cluster models: XML tool calling only, no published rate pair.
  "qwen3.6": { context_window: 262_144, tool_harness: "xml", cache_posture: "unmeasured" },
  gemma4: { context_window: 262_144, tool_harness: "xml", cache_posture: "unmeasured" },
  // Quota tier: the four executor rungs document the OpenAI `tools` harness.
  "deepseek-v4-flash": { context_window: 1_000_000, tool_harness: "native", cache_posture: "discounted" },
  "glm5.3-flash": { context_window: 1_000_000, tool_harness: "native", cache_posture: "discounted" },
  "qwen3.8-flash": { context_window: 1_000_000, tool_harness: "xml", cache_posture: "discounted" },
  "mimo-v2.6-flash": { context_window: 1_000_000, tool_harness: "native", cache_posture: "discounted" },
  "glm5.3": { context_window: 1_000_000, tool_harness: "native", cache_posture: "discounted" },
  // Paid / external: the snapshot names no tool-calling format for them.
  "kimi-k3.1-pro": { context_window: 1_000_000, tool_harness: "unmeasured", cache_posture: "discounted" },
  "qwen3.8-max": { context_window: 1_000_000, tool_harness: "unmeasured", cache_posture: "discounted" },
  "deepseek-v4-pro": { context_window: 1_000_000, tool_harness: "unmeasured", cache_posture: "discounted" },
  hy4: { context_window: 1_000_000, tool_harness: "unmeasured", cache_posture: "discounted" },
};

/** The phases a record's two facts earn, by the declared thresholds. */
function phasesFor(facts: { tool_harness: string; context_window: number }): number {
  if (facts.tool_harness !== "native") return NAN_PHASE_THRESHOLDS.phasesWithoutHarness;
  return facts.context_window >= NAN_PHASE_THRESHOLDS.largeContextWindow
    ? NAN_PHASE_THRESHOLDS.phasesOnLargeWindow
    : NAN_PHASE_THRESHOLDS.phasesOnSmallWindow;
}

/** The capability record: one frozen entry per billed model. */
export const NAN_MODEL_CAPABILITIES: Readonly<Record<string, ModelPhaseCapability>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RECORDED_FACTS).map(([slug, facts]) => [
      slug,
      Object.freeze({ ...facts, max_phases_per_context: phasesFor(facts) }),
    ]),
  ),
);

/** The model refs this preset routes; `provider/modelId`, exactly as stored. */
const REF_PREFIX = `${PROVIDER}/`;

/**
 * The record for one routed model reference, or `undefined` when this preset
 * has none. A bare model id is not a reference — the router stores
 * `provider/modelId`, so a lookup that cannot name the provider names nothing.
 */
export function capabilityFor(model: string): ModelPhaseCapability | undefined {
  if (!model.startsWith(REF_PREFIX)) return undefined;
  const id = model.slice(REF_PREFIX.length);
  return Object.hasOwn(NAN_MODEL_CAPABILITIES, id) ? NAN_MODEL_CAPABILITIES[id] : undefined;
}

/**
 * A malformed reference is a caller error, never a recommendation: this is a
 * programmer mistake (the command validates its flags first), so it throws the
 * same way the preset registry refuses a broken preset at registration.
 */
function assertModelRef(model: unknown): asserts model is string {
  if (typeof model !== "string" || model.length === 0) {
    throw new TypeError("phase-batching: model must be a non-empty `provider/modelId` reference");
  }
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1) {
    throw new TypeError(`phase-batching: model must be a \`provider/modelId\` reference, got "${model}"`);
  }
}

export interface PhaseBatchingInput {
  /** The routed model reference (`provider/modelId`). */
  readonly model: string;
  readonly eligibility: PhaseBatchingEligibility;
  /** The resolved `phaseBatching.enabled` switch; absent/false is the shipped OFF. */
  readonly enabled: boolean;
}

/** The decision without the record lookup, so every branch is reachable from a
 *  fixture — the policy itself calls it once it has the model's record. */
export interface PhaseBatchingDecisionInput extends PhaseBatchingInput {
  readonly capability: ModelPhaseCapability;
}

function documentOf(
  input: { model: string; eligibility: PhaseBatchingEligibility },
  capability: ModelPhaseCapability | null,
  reason: PhaseBatchingReason,
  phases: number,
  degradations: readonly PhaseBatchingDegradation[] = [],
): PhaseBatchingRecommendation {
  return {
    contract: PHASE_BATCHING_CONTRACT_ID,
    version: PHASE_BATCHING_VERSION,
    schema: PHASE_BATCHING_SCHEMA,
    decision: phases > 1 ? "batched-phases" : "one-phase-per-turn",
    phases_per_context: phases,
    reason,
    model: input.model,
    capability,
    eligibility: input.eligibility,
    degradations,
  };
}

/**
 * Decide from a known record. The gate order is the published reason order and
 * never changes: the shipped switch, the unit's eligibility, the model's
 * harness, the model's cache economics, and finally how much of the unit is
 * left.
 */
export function decidePhaseBatching(input: PhaseBatchingDecisionInput): PhaseBatchingRecommendation {
  assertModelRef(input.model);
  const { eligibility, capability } = input;
  const decline = (reason: PhaseBatchingReason, degradations: readonly PhaseBatchingDegradation[] = []) =>
    documentOf(input, capability, reason, 1, degradations);

  if (!input.enabled) return documentOf(input, null, "config-off", 1);
  if (eligibility.risk_tier === "high") return decline("risk-tier-high");
  if (eligibility.size_tier === "large") return decline("size-tier-large");
  if (eligibility.relay_in_flow) return decline("relay-in-flow");
  if (capability.tool_harness === "xml") return decline("tool-harness-xml");
  if (capability.tool_harness === "unmeasured") return decline("tool-harness-unmeasured", ["unmeasured-capability"]);
  if (capability.cache_posture === "unmeasured") {
    return decline("cache-posture-unmeasured", ["unmeasured-capability"]);
  }
  if (capability.cache_posture === "flat") return decline("cache-posture-flat");
  if (eligibility.phases_remaining < 2) return decline("single-phase");

  const phases = Math.min(capability.max_phases_per_context, eligibility.phases_remaining, PHASE_BATCHING_MAX_PHASES);
  return phases > 1 ? documentOf(input, capability, "phases-batched", phases) : decline("single-phase");
}

/**
 * The full policy: validate the reference, honor the switch without inspecting
 * anything, resolve the record, and fail closed when there is none.
 */
export function recommendPhaseBatching(input: PhaseBatchingInput): PhaseBatchingRecommendation {
  assertModelRef(input.model);
  if (!input.enabled) return documentOf(input, null, "config-off", 1);
  const capability = capabilityFor(input.model);
  if (!capability) return documentOf(input, null, "model-unknown", 1, ["unknown-model"]);
  return decidePhaseBatching({ ...input, capability });
}
