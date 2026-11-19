/**
 * phase-batching.test.mjs — the model-aware phase-batching contract
 * (`phase-batching@1`, issue #632).
 *
 * The corpus was observed RED before `src/phase-batching.ts` existed (the
 * owner's local unpublished workflow: one case per requested rule, red first).
 * The contract it pins:
 *
 *  - **One versioned document.** Contract id + version + the convenience
 *    `schema` token, the journal-entry and batch-plan precedent.
 *  - **Core is closed.** An unknown top-level key is refused, and so is a
 *    missing one: there is deliberately no `metadata` escape, because the
 *    document is the whole answer a consumer reads.
 *  - **Closed vocabularies.** The decision, the reason, the model's tool
 *    harness, its cache posture and the degradation tokens are the published
 *    sets — a policy that answers a token nobody published is the defect this
 *    suite names.
 *  - **The three axes agree.** The decision says batched or not, the phase count
 *    says how many, the reason says why: a `batched-phases` decision below two
 *    phases, a `one-phase-per-turn` decision above one, a count above the
 *    model's own ceiling, or a reason that contradicts the decision are all
 *    refused rather than trusted.
 *  - **Facts are echoed, never invented.** The eligibility block replays the
 *    inputs the policy was given (the published risk and size tier
 *    vocabularies), and a capability block is present exactly when the model's
 *    record was inspected.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PHASE_BATCHING_CACHE_POSTURES,
  PHASE_BATCHING_CONTRACT_ID,
  PHASE_BATCHING_DECISIONS,
  PHASE_BATCHING_DEGRADATIONS,
  PHASE_BATCHING_FIELDS,
  PHASE_BATCHING_MAX_PHASES,
  PHASE_BATCHING_REASON_KINDS,
  PHASE_BATCHING_SCHEMA,
  PHASE_BATCHING_TOOL_HARNESSES,
  PHASE_BATCHING_VERSION,
  RISK_TIER_KINDS,
  SIZE_TIER_KINDS,
  validatePhaseBatching,
} from "../dist/index.js";

/** The canonical vector: an eligible unit whose model holds four phases. */
const CANONICAL = {
  contract: PHASE_BATCHING_CONTRACT_ID,
  version: PHASE_BATCHING_VERSION,
  schema: PHASE_BATCHING_SCHEMA,
  decision: "batched-phases",
  phases_per_context: 3,
  reason: "phases-batched",
  model: "nan/glm5.3-flash",
  capability: {
    context_window: 1_000_000,
    tool_harness: "native",
    max_phases_per_context: 4,
    cache_posture: "discounted",
  },
  eligibility: {
    risk_tier: "standard",
    size_tier: "small",
    relay_in_flow: false,
    phases_remaining: 3,
  },
  degradations: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const reason = (doc) => validatePhaseBatching(doc).errors.join(" | ");

/** A `one-phase-per-turn` document carrying one reason, with the capability
 *  block the reason implies. */
function declined(token, overrides = {}) {
  const doc = clone(CANONICAL);
  doc.decision = "one-phase-per-turn";
  doc.phases_per_context = 1;
  doc.reason = token;
  doc.eligibility.phases_remaining = 1;
  doc.capability = { ...doc.capability, cache_posture: "discounted", tool_harness: "native" };
  if (token === "config-off" || token === "model-unknown") doc.capability = null;
  if (token === "tool-harness-xml") doc.capability.tool_harness = "xml";
  if (token === "tool-harness-unmeasured") doc.capability.tool_harness = "unmeasured";
  if (token === "cache-posture-unmeasured") doc.capability.cache_posture = "unmeasured";
  doc.degradations =
    token === "model-unknown"
      ? ["unknown-model"]
      : token === "tool-harness-unmeasured" || token === "cache-posture-unmeasured"
        ? ["unmeasured-capability"]
        : [];
  return Object.assign(doc, overrides);
}

test("the canonical recommendation validates", () => {
  const result = validatePhaseBatching(CANONICAL);
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("the contract publishes one id, one version and one schema token", () => {
  assert.equal(PHASE_BATCHING_CONTRACT_ID, "agentic-workflow/phase-batching");
  assert.equal(PHASE_BATCHING_VERSION, 1);
  assert.equal(PHASE_BATCHING_SCHEMA, "phase-batching@1");
  assert.deepEqual([...PHASE_BATCHING_FIELDS].sort(), Object.keys(CANONICAL).sort());
});

test("every published vocabulary is a closed set of unique non-empty tokens", () => {
  for (const [name, set] of Object.entries({
    PHASE_BATCHING_DECISIONS,
    PHASE_BATCHING_REASON_KINDS,
    PHASE_BATCHING_TOOL_HARNESSES,
    PHASE_BATCHING_CACHE_POSTURES,
    PHASE_BATCHING_DEGRADATIONS,
  })) {
    assert.ok(set.length > 0, `${name} is non-empty`);
    assert.equal(new Set(set).size, set.length, `${name} carries no duplicate`);
    for (const token of set) {
      assert.equal(typeof token, "string", `${name} carries strings`);
      assert.match(token, /^[a-z][a-z0-9-]*$/u, `${name}: ${token} is a lowercase token`);
    }
  }
  assert.deepEqual([...PHASE_BATCHING_DECISIONS], ["batched-phases", "one-phase-per-turn"]);
  assert.equal(PHASE_BATCHING_MAX_PHASES, 4, "the published ceiling the policy can never exceed");
});

test("a document that is not an object is refused by name", () => {
  for (const value of [null, undefined, 1, "x", [], true]) {
    const result = validatePhaseBatching(value);
    assert.equal(result.ok, false, `${JSON.stringify(value)} is refused`);
    assert.match(result.errors.join(" | "), /not a JSON object/u);
  }
});

test("core is closed: an unexpected top-level key is refused and named", () => {
  const doc = clone(CANONICAL);
  doc.metadata = { anything: true };
  assert.match(reason(doc), /unexpected key: metadata/u);
});

test("core is closed: a missing top-level key is refused by name", () => {
  const doc = clone(CANONICAL);
  delete doc.degradations;
  assert.match(reason(doc), /missing key: degradations/u);
});

test("the three identity cells are constants, not advice", () => {
  for (const [key, value] of [
    ["contract", "agentic-workflow/other"],
    ["version", 2],
    ["schema", "phase-batching@2"],
  ]) {
    const doc = clone(CANONICAL);
    doc[key] = value;
    assert.equal(validatePhaseBatching(doc).ok, false, `${key} is pinned`);
  }
});

test("a decision or a reason outside its published set is refused", () => {
  const badDecision = clone(CANONICAL);
  badDecision.decision = "batch-everything";
  assert.match(reason(badDecision), /decision must be one of/u);
  const badReason = clone(CANONICAL);
  badReason.reason = "looks-fine";
  assert.match(reason(badReason), /reason must be one of/u);
});

test("every published reason validates in a document of its own", () => {
  for (const token of PHASE_BATCHING_REASON_KINDS) {
    const doc = token === "phases-batched" ? clone(CANONICAL) : declined(token);
    const result = validatePhaseBatching(doc);
    assert.deepEqual(result, { ok: true, errors: [] }, `${token}: ${result.errors.join(" | ")}`);
  }
});

test("the decision, the phase count and the reason cannot disagree", () => {
  const batchedBelowTwo = clone(CANONICAL);
  batchedBelowTwo.phases_per_context = 1;
  assert.match(reason(batchedBelowTwo), /batched-phases needs at least two phases/u);

  const turnAboveOne = declined("single-phase", { phases_per_context: 2 });
  assert.match(reason(turnAboveOne), /one-phase-per-turn carries exactly one phase/u);

  const batchedButDeclined = clone(CANONICAL);
  batchedButDeclined.decision = "one-phase-per-turn";
  batchedButDeclined.phases_per_context = 1;
  assert.match(reason(batchedButDeclined), /reason phases-batched needs decision batched-phases/u);
});

test("the phase count stays inside its published bounds and the model's own ceiling", () => {
  const tooMany = clone(CANONICAL);
  tooMany.phases_per_context = PHASE_BATCHING_MAX_PHASES + 1;
  tooMany.eligibility.phases_remaining = PHASE_BATCHING_MAX_PHASES + 1;
  tooMany.capability.max_phases_per_context = PHASE_BATCHING_MAX_PHASES + 1;
  assert.equal(validatePhaseBatching(tooMany).ok, false, "above the published ceiling");

  const zero = clone(CANONICAL);
  zero.phases_per_context = 0;
  assert.match(reason(zero), /phases_per_context must be an integer between/u);

  const fractional = clone(CANONICAL);
  fractional.phases_per_context = 2.5;
  assert.equal(validatePhaseBatching(fractional).ok, false, "a fractional phase count is nothing");

  const aboveCeiling = clone(CANONICAL);
  aboveCeiling.capability.max_phases_per_context = 2;
  assert.match(reason(aboveCeiling), /exceeds the model's max_phases_per_context/u);

  const aboveRemaining = clone(CANONICAL);
  aboveRemaining.eligibility.phases_remaining = 2;
  assert.match(reason(aboveRemaining), /exceeds eligibility.phases_remaining/u);
});

test("the capability block is present exactly when the model was inspected", () => {
  const inspectedButNull = clone(CANONICAL);
  inspectedButNull.capability = null;
  assert.match(reason(inspectedButNull), /capability is null only for config-off and model-unknown/u);

  const silentButPresent = declined("model-unknown", { capability: clone(CANONICAL).capability });
  silentButPresent.degradations = ["unknown-model"];
  assert.match(reason(silentButPresent), /model-unknown carries no capability/u);

  const configOff = declined("config-off");
  assert.equal(validatePhaseBatching(configOff).ok, true);
  assert.equal(configOff.capability, null);
});

test("the capability block is closed and each cell is a published token or a bound", () => {
  const extra = clone(CANONICAL);
  extra.capability.one_shot = "strong";
  assert.match(reason(extra), /capability has unexpected key: one_shot/u);

  const badHarness = clone(CANONICAL);
  badHarness.capability.tool_harness = "maybe";
  assert.match(reason(badHarness), /capability.tool_harness must be one of/u);

  const badCache = clone(CANONICAL);
  badCache.capability.cache_posture = "great";
  assert.match(reason(badCache), /capability.cache_posture must be one of/u);

  const badWindow = clone(CANONICAL);
  badWindow.capability.context_window = 0;
  assert.match(reason(badWindow), /capability.context_window must be a positive integer/u);

  const badMax = clone(CANONICAL);
  badMax.capability.max_phases_per_context = 0;
  assert.match(reason(badMax), /capability.max_phases_per_context must be an integer between/u);
});

test("the eligibility block replays the published tier vocabularies", () => {
  const badRisk = clone(CANONICAL);
  badRisk.eligibility.risk_tier = "extreme";
  assert.match(reason(badRisk), /eligibility.risk_tier must be one of/u);

  const badSize = clone(CANONICAL);
  badSize.eligibility.size_tier = "enormous";
  assert.match(reason(badSize), /eligibility.size_tier must be one of/u);

  const badRelay = clone(CANONICAL);
  badRelay.eligibility.relay_in_flow = "no";
  assert.match(reason(badRelay), /eligibility.relay_in_flow must be a boolean/u);

  const badPhases = clone(CANONICAL);
  badPhases.eligibility.phases_remaining = 0;
  assert.match(reason(badPhases), /eligibility.phases_remaining must be a positive integer/u);

  const extra = clone(CANONICAL);
  extra.eligibility.owner = "someone";
  assert.match(reason(extra), /eligibility has unexpected key: owner/u);

  // the vocabularies the block resolves against are the published ones
  for (const tier of RISK_TIER_KINDS) {
    const doc = declined("risk-tier-high");
    doc.eligibility.risk_tier = tier;
    assert.equal(validatePhaseBatching(doc).ok, true, `${tier} resolves in the block`);
  }
  for (const tier of SIZE_TIER_KINDS) {
    const doc = declined("size-tier-large");
    doc.eligibility.size_tier = tier;
    assert.equal(validatePhaseBatching(doc).ok, true, `${tier} resolves in the block`);
  }
});

test("a fail-closed state states itself: the degradation and the reason agree", () => {
  const missingDegradation = declined("model-unknown");
  missingDegradation.degradations = [];
  assert.match(reason(missingDegradation), /reason model-unknown requires the unknown-model degradation/u);

  const unknownToken = declined("config-off");
  unknownToken.degradations = ["banana"];
  assert.match(reason(unknownToken), /degradations must be one of/u);

  const duplicated = declined("tool-harness-unmeasured");
  duplicated.degradations = ["unmeasured-capability", "unmeasured-capability"];
  assert.match(reason(duplicated), /degradations carries no duplicate/u);

  const unearned = clone(CANONICAL);
  unearned.degradations = ["unknown-model"];
  assert.match(reason(unearned), /degradation unknown-model is declared only when/u);

  const silent = declined("cache-posture-unmeasured");
  silent.degradations = [];
  assert.match(reason(silent), /reason cache-posture-unmeasured requires the unmeasured-capability degradation/u);
});

test("the model reference is a non-empty `provider/modelId`", () => {
  for (const value of ["", "glm5.3-flash", "nan/", "/glm5.3-flash", 7]) {
    const doc = clone(CANONICAL);
    doc.model = value;
    assert.equal(validatePhaseBatching(doc).ok, false, `${JSON.stringify(value)} is refused`);
  }
});
