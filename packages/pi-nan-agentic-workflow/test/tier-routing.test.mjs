// tier-routing.test.mjs — the NaN preset's tier policy and its profile
// catalog (issue #388 amendments 1 + 2).
//
// Billing facts are data (`NAN_MODELS`); a profile's ladders are data too
// (`PROFILE_LADDERS`). Tier routing (on by default) demotes only the mechanical
// one-way passes to the zero-credit chain; everything else — judgment slots
// included — keeps its profile's published ladder. `tierRouting: false`
// restores the selected profile's ladder byte-for-byte.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PROVIDER,
  PROFILES,
  DEFAULT_PROFILE,
  NAN_MODELS,
  PROFILE_LADDERS,
  PUBLISHED_LADDER,
  ROUTING_DEMOTE_COMMANDS,
  ROUTED_COMMANDS,
  TASK_CLASSES,
  freeChain,
  routingEnabledFor,
  deriveCommandRoute,
  resolvePresetProfile,
  resolveTaskRoute,
} from "../dist/preset.js";

const ref = (id) => `${PROVIDER}/${id}`;

test("billing facts: every model the preset routes declares a tier", () => {
  for (const id of [
    "qwen3.6",
    "gemma4",
    "deepseek-v4-flash",
    "glm5.3-flash",
    "qwen3.8-flash",
    "mimo-v2.6-flash",
    "glm5.3",
    "kimi-k3.1-pro",
    "qwen3.8-max",
    "deepseek-v4-pro",
    "hy4",
  ]) {
    assert.ok(["free", "quota", "paid"].includes(NAN_MODELS[id]), `${id} declares a billing tier`);
  }
  assert.equal(NAN_MODELS["qwen3.6"], "free", "qwen3.6 costs no credits, ever");
  assert.equal(NAN_MODELS["gemma4"], "free");
  for (const id of ["deepseek-v4-flash", "glm5.3-flash", "qwen3.8-flash", "mimo-v2.6-flash", "glm5.3"]) {
    assert.equal(NAN_MODELS[id], "quota", `${id} carries a monthly free allowance`);
  }
  for (const id of ["kimi-k3.1-pro", "qwen3.8-max", "deepseek-v4-pro", "hy4"]) {
    assert.equal(NAN_MODELS[id], "paid", `${id} burns credits from token one`);
  }
});

test("the zero-credit chain is derived from the billed tier map, in catalog order", () => {
  const expected = Object.entries(NAN_MODELS)
    .filter(([, t]) => t === "free")
    .map(([m]) => ref(m));
  assert.deepEqual(freeChain(), expected);
  assert.equal(freeChain()[0], ref("qwen3.6"));
});

test("profile catalog: the four approved postures are declared, economy is the default", () => {
  assert.deepEqual([...PROFILES], ["quality", "balanced", "economy", "no-credits-continue-working"]);
  assert.equal(DEFAULT_PROFILE, "economy");
});

test("every profile publishes a ladder for every routed command", () => {
  for (const name of PROFILES) {
    const ladder = PROFILE_LADDERS[name];
    assert.ok(ladder, `${name} publishes a ladder`);
    assert.deepEqual(Object.keys(ladder.commands).sort(), [...ROUTED_COMMANDS].sort());
    for (const [skill, route] of Object.entries(ladder.commands)) {
      assert.ok(route.model.length >= 1 && route.model.length <= 4, `${name}/${skill} carries a 1-4 chain`);
      for (const modelRef of route.model) {
        assert.ok(modelRef.startsWith(`${PROVIDER}/`), `${name}/${skill} routes only ${PROVIDER} models`);
        const id = modelRef.split("/")[1];
        assert.ok(NAN_MODELS[id] !== undefined, `${name}/${skill} rung ${id} is a published catalog model`);
      }
    }
  }
});

test("low-stakes routes (routing on) never name a paid model", () => {
  for (const name of PROFILES) {
    for (const skill of ROUTING_DEMOTE_COMMANDS) {
      for (const modelRef of deriveCommandRoute(skill, { tierRouting: true, profile: name }).model) {
        assert.equal(NAN_MODELS[modelRef.split("/")[1]], "free", `${name}/${skill}: ${modelRef} is free-tier only`);
      }
    }
  }
});

test("demotion set: only the mechanical one-way passes demote", () => {
  assert.deepEqual([...ROUTING_DEMOTE_COMMANDS].sort(), ["audit-docs", "log-session", "workflow-status"]);
});

test("default resolution (no config at all) is the economy ladder with routing on", () => {
  const resolved = resolvePresetProfile({});
  for (const skill of ROUTING_DEMOTE_COMMANDS) {
    assert.deepEqual(resolved.commands[skill].model, freeChain(), `${skill} rides the zero-credit chain`);
  }
  // Judgment and execution slots keep the economy ladder verbatim.
  assert.deepEqual(resolved.commands["audit-pr"], PROFILE_LADDERS.economy.commands["audit-pr"]);
  assert.deepEqual(resolved.commands["execute-phase"], PROFILE_LADDERS.economy.commands["execute-phase"]);
});

test("profile selection: each name resolves its own ladder; an unknown name falls back to the default", () => {
  assert.deepEqual(resolvePresetProfile({ tierRouting: false, profile: "quality" }), PROFILE_LADDERS.quality);
  assert.deepEqual(resolvePresetProfile({ tierRouting: false, profile: "balanced" }), PROFILE_LADDERS.balanced);
  assert.deepEqual(resolvePresetProfile({ tierRouting: false, profile: "economy" }), PROFILE_LADDERS.economy);
  assert.deepEqual(
    resolvePresetProfile({ tierRouting: false, profile: "no-credits-continue-working" }),
    PROFILE_LADDERS["no-credits-continue-working"],
  );
  assert.deepEqual(
    resolvePresetProfile({ tierRouting: false, profile: "not-a-profile" }),
    PROFILE_LADDERS[DEFAULT_PROFILE],
    "an unknown profile name falls back to the default posture, never to a crash",
  );
});

test("routing-off byte-match: the selected profile's ladder is returned unmodified", () => {
  assert.deepEqual(resolvePresetProfile({ tierRouting: false, profile: "balanced" }), PUBLISHED_LADDER);
  assert.deepEqual(resolvePresetProfile({ tierRouting: { enabled: false }, profile: "balanced" }), PUBLISHED_LADDER);
});

test("PUBLISHED_LADDER is the balanced posture's reference ladder", () => {
  assert.equal(PUBLISHED_LADDER, PROFILE_LADDERS.balanced);
});

test("routing-off per skill: only that skill keeps the published order", () => {
  const resolved = resolvePresetProfile({ tierRouting: { skills: { "execute-phase": false } } });
  assert.deepEqual(resolved.commands["execute-phase"], PROFILE_LADDERS.economy.commands["execute-phase"]);
  // the rest still derives with routing on
  assert.deepEqual(resolved.commands["workflow-status"].model, freeChain());
});

test("routingEnabledFor: the opt-out matrix", () => {
  assert.equal(routingEnabledFor("log-session", undefined), true, "absent = on");
  assert.equal(routingEnabledFor("log-session", true), true);
  assert.equal(routingEnabledFor("log-session", false), false, "global off");
  assert.equal(routingEnabledFor("log-session", { enabled: false }), false);
  assert.equal(routingEnabledFor("log-session", { skills: { "log-session": false } }), false, "per-skill off");
  assert.equal(routingEnabledFor("execute-phase", { skills: { "log-session": false } }), true, "other skills unaffected");
  assert.equal(routingEnabledFor("log-session", { skills: { "log-session": false }, enabled: true }), false, "per-skill wins over global");
  assert.equal(routingEnabledFor("log-session", { skills: { "log-session": true }, enabled: false }), true, "per-skill on wins over global off");
});

test("task-class routing: strength-sensitive spawned tasks keep the profile ladder", () => {
  const route = resolveTaskRoute("review-axis", { tierRouting: true, profile: "balanced" });
  assert.deepEqual(route, PUBLISHED_LADDER.default);
});

test("task-class routing: a low-stakes spawned task resolves to the zero-credit chain routing-on", () => {
  const route = resolveTaskRoute("summarization", { tierRouting: true, profile: "balanced" });
  assert.deepEqual(route.model, freeChain());
});

test("task-class routing: routing-off gives a low-stakes task the profile ladder", () => {
  const route = resolveTaskRoute("summarization", { tierRouting: false, profile: "balanced" });
  assert.deepEqual(route, PUBLISHED_LADDER.default);
});

test("task-class routing: an unknown class resolves like the unclassified command", () => {
  assert.deepEqual(
    resolveTaskRoute("something-new", { tierRouting: false, profile: "economy" }),
    PROFILE_LADDERS.economy.default,
  );
});

test("the task-class catalog is closed data with boolean classifications", () => {
  for (const cls of ["summarization", "triage", "mechanical-logging", "review-axis", "audit-verdict", "planning", "conduction"]) {
    assert.ok(TASK_CLASSES[cls], `${cls} is classified`);
    assert.equal(typeof TASK_CLASSES[cls].strengthSensitive, "boolean");
  }
});
