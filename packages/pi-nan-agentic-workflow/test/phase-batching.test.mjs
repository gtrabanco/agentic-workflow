// phase-batching.test.mjs — the NaN preset's phase-batching policy (issue
// #632).
//
// The capability record is data derived from the recorded catalog: a model's
// context window, the tool harness it documents, the cache posture its own rate
// pair implies, and the phases its record lets one context hold. The policy
// turns an eligible unit plus that record into the published
// `phase-batching@1` document. It ships OFF, and every fact it cannot read
// fails closed to the posture the workflow already runs — one phase per turn.
//
// The corpus was observed RED before `dist/phase-batching.js` existed (the
// owner's local unpublished workflow: one case per requested rule, red first).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PHASE_BATCHING_MAX_PHASES, validatePhaseBatching } from "@gtrabanco/agentic-workflow-schema";

import {
  NAN_PHASE_THRESHOLDS,
  NAN_MODEL_CAPABILITIES,
  capabilityFor,
  decidePhaseBatching,
  recommendPhaseBatching,
} from "../dist/phase-batching.js";
import { PHASE_BATCHING_COMMAND, phaseBatchingCommand } from "../dist/phase-batching-command.js";
import { NAN_MODELS, PROVIDER, PROFILE_LADDERS, PUBLISHED_LADDER, resolvePresetProfile } from "../dist/preset.js";

const readme = () => readFileSync(new URL("../README.md", import.meta.url), "utf8");

/** The eligible unit this suite starts from: standard risk, small size, no
 *  Relay, a whole unit's worth of phases left. */
const ELIGIBLE = Object.freeze({ risk_tier: "standard", size_tier: "small", relay_in_flow: false, phases_remaining: 4 });

const MODEL = `${PROVIDER}/glm5.3-flash`;

const recommend = (overrides = {}) =>
  recommendPhaseBatching({ model: MODEL, eligibility: ELIGIBLE, enabled: true, ...overrides });

const assertValid = (doc, label) => {
  const result = validatePhaseBatching(doc);
  assert.deepEqual(result, { ok: true, errors: [] }, `${label}: ${result.errors.join(" | ")}`);
  return doc;
};

// ── The capability record ────────────────────────────────────────────────

test("capability record: every billed model carries one, and nothing else does", () => {
  assert.deepEqual(Object.keys(NAN_MODEL_CAPABILITIES).sort(), Object.keys(NAN_MODELS).sort());
  for (const [slug, capability] of Object.entries(NAN_MODEL_CAPABILITIES)) {
    assert.ok(capability.context_window > 0, `${slug}: a window is stated`);
    assert.ok(capability.max_phases_per_context >= 1, `${slug}: a phase count is stated`);
    assert.ok(capability.max_phases_per_context <= PHASE_BATCHING_MAX_PHASES, `${slug}: never above the published ceiling`);
    assert.ok(["native", "xml", "unmeasured"].includes(capability.tool_harness), `${slug}: a published harness`);
    assert.ok(["discounted", "flat", "unmeasured"].includes(capability.cache_posture), `${slug}: a published posture`);
  }
});

test("capability record: the declared thresholds are the published ceiling and the fleet's own extremes", () => {
  assert.equal(NAN_PHASE_THRESHOLDS.phasesOnLargeWindow, PHASE_BATCHING_MAX_PHASES);
  assert.equal(NAN_PHASE_THRESHOLDS.phasesOnSmallWindow, 2);
  assert.equal(NAN_PHASE_THRESHOLDS.phasesWithoutHarness, 1);
  assert.ok(NAN_PHASE_THRESHOLDS.smallContextWindow < NAN_PHASE_THRESHOLDS.largeContextWindow);
});

test("capability record: only the models that document the executor harness batch, and they reach four", () => {
  const batching = Object.entries(NAN_MODEL_CAPABILITIES).filter(([, record]) => record.max_phases_per_context > 1);
  assert.deepEqual(
    batching.map(([slug]) => slug).sort(),
    ["deepseek-v4-flash", "glm5.3", "glm5.3-flash", "mimo-v2.6-flash"],
  );
  for (const [, record] of batching) assert.equal(record.max_phases_per_context, 4);
});

test("capability record: a model is looked up by its exact `provider/modelId` reference", () => {
  assert.deepEqual(capabilityFor(MODEL), NAN_MODEL_CAPABILITIES["glm5.3-flash"]);
  assert.equal(capabilityFor("glm5.3-flash"), undefined, "a bare id is not a route reference");
  assert.equal(capabilityFor(`${PROVIDER}/not-a-model`), undefined);
  assert.equal(capabilityFor("other/glm5.3-flash"), undefined, "another provider's model is not this preset's");
  assert.equal(capabilityFor(""), undefined);
});

test("capability record: a malformed model reference is a caller error, never a silent recommendation", () => {
  assert.throws(() => recommendPhaseBatching({ model: "glm5.3-flash", eligibility: ELIGIBLE, enabled: true }), TypeError);
  assert.throws(() => recommendPhaseBatching({ model: "", eligibility: ELIGIBLE, enabled: true }), TypeError);
});

// ── The policy: the two decisions and every reason between them ───────────

test("the shipped posture: with the key off the answer is one phase per turn and nothing was inspected", () => {
  const doc = assertValid(recommend({ enabled: false }), "config off");
  assert.equal(doc.decision, "one-phase-per-turn");
  assert.equal(doc.phases_per_context, 1);
  assert.equal(doc.reason, "config-off");
  assert.equal(doc.capability, null, "nothing was inspected, so nothing is claimed");
  assert.deepEqual(doc.degradations, []);
  assert.equal(doc.model, MODEL);
  assert.deepEqual(doc.eligibility, ELIGIBLE);
});

test("an unknown model fails closed and says so inline", () => {
  const doc = assertValid(recommend({ model: "other/glm5.3-flash" }), "unknown model");
  assert.equal(doc.decision, "one-phase-per-turn");
  assert.equal(doc.reason, "model-unknown");
  assert.equal(doc.capability, null);
  assert.deepEqual(doc.degradations, ["unknown-model"]);
});

test("the eligibility gates: a high tier, a large unit or a Relay leg each decline for their own reason", () => {
  const cases = [
    [{ risk_tier: "high" }, "risk-tier-high"],
    [{ size_tier: "large" }, "size-tier-large"],
    [{ relay_in_flow: true }, "relay-in-flow"],
  ];
  for (const [patch, expected] of cases) {
    const doc = assertValid(recommend({ eligibility: { ...ELIGIBLE, ...patch } }), expected);
    assert.equal(doc.reason, expected);
    assert.equal(doc.decision, "one-phase-per-turn");
    assert.equal(doc.phases_per_context, 1);
    assert.ok(doc.capability, `${expected}: the record was read, so it is reported`);
  }
});

test("a model without the executor harness never batches", () => {
  const xml = assertValid(recommend({ model: `${PROVIDER}/qwen3.8-flash` }), "xml harness");
  assert.equal(xml.reason, "tool-harness-xml");
  assert.equal(xml.phases_per_context, 1);

  const unmeasured = assertValid(recommend({ model: `${PROVIDER}/kimi-k3.1-pro` }), "unmeasured harness");
  assert.equal(unmeasured.reason, "tool-harness-unmeasured");
  assert.deepEqual(unmeasured.degradations, ["unmeasured-capability"]);
});

test("an unmeasured cache posture declines, and a measured one that saves nothing declines differently", () => {
  const nativeRecord = { ...NAN_MODEL_CAPABILITIES["glm5.3-flash"] };
  const unmeasured = assertValid(
    decidePhaseBatching({
      model: MODEL,
      capability: { ...nativeRecord, cache_posture: "unmeasured" },
      eligibility: ELIGIBLE,
      enabled: true,
    }),
    "unmeasured cache",
  );
  assert.equal(unmeasured.reason, "cache-posture-unmeasured");
  assert.deepEqual(unmeasured.degradations, ["unmeasured-capability"]);

  const flat = assertValid(
    decidePhaseBatching({
      model: MODEL,
      capability: { ...nativeRecord, cache_posture: "flat" },
      eligibility: ELIGIBLE,
      enabled: true,
    }),
    "flat cache",
  );
  assert.equal(flat.reason, "cache-posture-flat");
  assert.deepEqual(flat.degradations, [], "a measured posture owes no degradation");
});

test("the phase count is the smallest of the model's ceiling and what remains", () => {
  assert.equal(recommend().phases_per_context, 4);
  assert.equal(recommend({ eligibility: { ...ELIGIBLE, phases_remaining: 2 } }).phases_per_context, 2);
  assert.equal(recommend({ eligibility: { ...ELIGIBLE, phases_remaining: 9 } }).phases_per_context, 4, "the ceiling wins");
  const single = assertValid(recommend({ eligibility: { ...ELIGIBLE, phases_remaining: 1 } }), "single phase");
  assert.equal(single.reason, "single-phase");
  assert.equal(single.phases_per_context, 1);
  assert.equal(single.decision, "one-phase-per-turn");
});

test("the eligible answer is batched phases, and it validates", () => {
  const doc = assertValid(recommend(), "eligible");
  assert.equal(doc.decision, "batched-phases");
  assert.equal(doc.reason, "phases-batched");
  assert.equal(doc.phases_per_context, 4);
  assert.equal(doc.contract, "agentic-workflow/phase-batching");
  assert.equal(doc.schema, "phase-batching@1");
  assert.deepEqual(doc.capability, NAN_MODEL_CAPABILITIES["glm5.3-flash"]);
});

test("the policy is deterministic: the same inputs answer the same document", () => {
  const first = recommend();
  const second = recommend();
  assert.deepEqual(first, second);
  assert.notEqual(first, second, "a fresh document every call, never a shared mutable one");
});

test("every document the policy can emit validates, across the whole matrix", () => {
  const models = [...Object.keys(NAN_MODELS).map((slug) => `${PROVIDER}/${slug}`), "other/glm5.3-flash"];
  const eligibilities = [
    ELIGIBLE,
    { ...ELIGIBLE, risk_tier: "high" },
    { ...ELIGIBLE, risk_tier: "passive", size_tier: "prose" },
    { ...ELIGIBLE, size_tier: "large" },
    { ...ELIGIBLE, relay_in_flow: true },
    { ...ELIGIBLE, phases_remaining: 1 },
    { ...ELIGIBLE, phases_remaining: 2 },
  ];
  for (const enabled of [true, false]) {
    for (const model of models) {
      for (const eligibility of eligibilities) {
        assertValid(
          recommendPhaseBatching({ model, eligibility, enabled }),
          `${model} ${enabled ? "on" : "off"} ${JSON.stringify(eligibility)}`,
        );
      }
    }
  }
});

// ── The routing data is untouched (S8) ───────────────────────────────────

test("the policy touches no route: the shipped ladders are byte-identical", () => {
  assert.deepEqual(resolvePresetProfile({ tierRouting: false, profile: "balanced" }), PUBLISHED_LADDER);
  assert.deepEqual(resolvePresetProfile({ tierRouting: false, profile: "economy" }), PROFILE_LADDERS.economy);
  assert.equal(PUBLISHED_LADDER, PROFILE_LADDERS.balanced, "the reference ladder is still the same object");
});

// ── The command that prints the recommendation ───────────────────────────

const CONFIG_OFF = { phaseBatching: { enabled: false } };
const CONFIG_ON = { phaseBatching: { enabled: true } };

test("the command names itself in the preset's namespace", () => {
  assert.equal(PHASE_BATCHING_COMMAND, "nan-phase-batching");
});

test("the command refuses to invent the facts it was not given, naming every missing flag", () => {
  const result = phaseBatchingCommand({ args: "", config: CONFIG_ON, sessionModel: undefined });
  assert.equal(result.ok, false);
  for (const flag of ["--model", "--risk-tier", "--size-tier", "--phases"]) {
    assert.ok(result.error.includes(flag), `the refusal names ${flag}: ${result.error}`);
  }
});

test("the command refuses an unknown flag and an out-of-vocabulary value", () => {
  const unknown = phaseBatchingCommand({
    args: `--model ${MODEL} --risk-tier standard --size-tier small --phases 3 --wat 1`,
    config: CONFIG_ON,
  });
  assert.equal(unknown.ok, false);
  assert.match(unknown.error, /--wat/u);

  const badTier = phaseBatchingCommand({
    args: `--model ${MODEL} --risk-tier extreme --size-tier small --phases 3`,
    config: CONFIG_ON,
  });
  assert.equal(badTier.ok, false);
  assert.match(badTier.error, /risk-tier/u);

  const badSize = phaseBatchingCommand({
    args: `--model ${MODEL} --risk-tier standard --size-tier enormous --phases 3`,
    config: CONFIG_ON,
  });
  assert.equal(badSize.ok, false);
  assert.match(badSize.error, /size-tier/u);

  const badPhases = phaseBatchingCommand({
    args: `--model ${MODEL} --risk-tier standard --size-tier small --phases 0`,
    config: CONFIG_ON,
  });
  assert.equal(badPhases.ok, false);
  assert.match(badPhases.error, /phases/u);
});

test("the command prints the typed document, and it is the policy's own answer", () => {
  const result = phaseBatchingCommand({
    args: "--risk-tier standard --size-tier small --phases 3",
    config: CONFIG_ON,
    sessionModel: MODEL,
  });
  assert.equal(result.ok, true, result.error);
  const doc = JSON.parse(result.output);
  assertValid(doc, "command output");
  assert.deepEqual(doc, recommend({ eligibility: { ...ELIGIBLE, phases_remaining: 3 } }));
});

test("the command reads the config switch: off is the shipped posture, on is the recommendation", () => {
  const args = "--risk-tier standard --size-tier small --phases 3";
  assert.equal(JSON.parse(phaseBatchingCommand({ args, config: CONFIG_OFF, sessionModel: MODEL }).output).reason, "config-off");
  assert.equal(
    JSON.parse(phaseBatchingCommand({ args, config: CONFIG_ON, sessionModel: MODEL }).output).decision,
    "batched-phases",
  );
  assert.equal(
    JSON.parse(phaseBatchingCommand({ args, config: {}, sessionModel: MODEL }).output).reason,
    "config-off",
    "an absent section is the shipped OFF",
  );
});

test("the command takes `--relay` as a flag and `--model` over the session's model", () => {
  const relay = phaseBatchingCommand({
    args: `--model ${MODEL} --risk-tier standard --size-tier small --phases 3 --relay`,
    config: CONFIG_ON,
  });
  const relayDoc = JSON.parse(relay.output);
  assert.equal(relayDoc.reason, "relay-in-flow");
  assert.equal(relayDoc.eligibility.relay_in_flow, true);

  const override = phaseBatchingCommand({
    args: `--model ${PROVIDER}/qwen3.8-flash --risk-tier standard --size-tier small --phases 3`,
    config: CONFIG_ON,
    sessionModel: MODEL,
  });
  assert.equal(JSON.parse(override.output).model, `${PROVIDER}/qwen3.8-flash`, "an explicit model wins over the session's");
});

test("the README documents the capability record and the command", () => {
  const doc = readme();
  assert.match(doc, /nan-phase-batching/u, "the README names the command that prints the recommendation");
  assert.match(doc, /phases per context/iu, "the README names the phases-per-context cell");
  assert.match(doc, /phaseBatching/u, "the README names the config key the policy reads");
  for (const model of ["glm5.3-flash", "deepseek-v4-flash", "mimo-v2.6-flash", "glm5.3"]) {
    assert.ok(doc.includes(model), `the README names ${model} where the record's harness matters`);
  }
});
