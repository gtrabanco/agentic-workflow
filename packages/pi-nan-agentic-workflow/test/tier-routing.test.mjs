// tier-routing.test.mjs — issue #388 amendment 1: the NaN preset's tier policy.
//
// Tier facts are data (`NAN_MODELS`); ladders derive their order from tier +
// task class, never from a hand-ordered array that silently drifts from the
// tier facts. Routing off (global or per skill) restores today's published
// ladder byte-for-byte — no silent quality regression for users who disable it.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PROVIDER,
  NAN_MODELS,
  PUBLISHED_LADDER,
  STRENGTH_SENSITIVE_SKILLS,
  TASK_CLASSES,
  unlimitedChain,
  routingEnabledFor,
  resolvePresetProfile,
  resolveTaskRoute,
} from "../dist/preset.js";

const ref = (id) => `${PROVIDER}/${id}`;

test("tier facts: every published model declares a quota tier as data", () => {
  for (const id of ["qwen3.6", "gemma4", "glm5.3", "glm5.3-flash", "deepseek-v4-flash", "mimo-v2.6-flash"]) {
    assert.ok(NAN_MODELS[id] === "unlimited" || NAN_MODELS[id] === "limited", `${id} declares a tier`);
  }
  assert.equal(NAN_MODELS["qwen3.6"], "unlimited", "qwen3.6 is the unlimited tier");
  assert.equal(NAN_MODELS["gemma4"], "unlimited");
});

test("tier facts: the unlimited chain is derived from the tier map, in catalog order", () => {
  const expected = Object.entries(NAN_MODELS).filter(([, t]) => t === "unlimited").map(([m]) => ref(m));
  assert.deepEqual(unlimitedChain(), expected);
  assert.equal(unlimitedChain()[0], ref("qwen3.6"));
});

test("routing-off: the resolved profile byte-matches today's published ladder", () => {
  assert.deepEqual(resolvePresetProfile({ tierRouting: false }), PUBLISHED_LADDER);
  assert.deepEqual(resolvePresetProfile({ tierRouting: { enabled: false } }), PUBLISHED_LADDER);
});

test("routing-off per skill: only that skill keeps the published order", () => {
  const resolved = resolvePresetProfile({ tierRouting: { skills: { "log-session": false } } });
  assert.deepEqual(resolved.commands["log-session"], PUBLISHED_LADDER.commands["log-session"]);
  // every other routing-eligible skill still derives unlimited-first
  assert.deepEqual(resolved.commands["execute-phase"].model, unlimitedChain());
});

test("routing-on: unlimited-eligible skills list qwen3.6 first and carry no limited-tier model", () => {
  const resolved = resolvePresetProfile({ tierRouting: true });
  for (const [skill, route] of Object.entries(resolved.commands)) {
    if (STRENGTH_SENSITIVE_SKILLS.includes(skill)) continue;
    assert.equal(route.model[0], ref("qwen3.6"), `${skill} lists qwen3.6 first`);
    for (const modelRef of route.model) {
      const id = modelRef.split("/")[1];
      assert.equal(NAN_MODELS[id], "unlimited", `${skill}: ${id} is unlimited-tier only`);
    }
  }
});

test("routing-on: strength-sensitive skills keep the published (limited-first) ladder", () => {
  const resolved = resolvePresetProfile({ tierRouting: true });
  for (const skill of STRENGTH_SENSITIVE_SKILLS) {
    assert.deepEqual(resolved.commands[skill], PUBLISHED_LADDER.commands[skill], `${skill} keeps the published ladder`);
  }
});

test("routing-on: the default route (unclassified commands) derives unlimited-first", () => {
  const resolved = resolvePresetProfile({ tierRouting: true });
  assert.deepEqual(resolved.default.model, unlimitedChain());
});

test("routing-on: ladders derive from tier + classification, not a hand-ordered array", () => {
  // The derivation output for a non-strength skill must equal recomputing the
  // chain from the tier map alone — a per-skill hand order cannot exist.
  const resolved = resolvePresetProfile({ tierRouting: true });
  const derived = Object.entries(NAN_MODELS).filter(([, t]) => t === "unlimited").map(([m]) => ref(m));
  for (const skill of ["log-session", "execute-phase", "workflow-status"]) {
    assert.deepEqual(resolved.commands[skill]?.model ?? resolved.default.model, derived);
  }
});

test("classification: the judgment slots are explicitly declared strength-sensitive", () => {
  for (const skill of ["audit-pr", "product-audit", "review-change", "unit-lane"]) {
    assert.ok(STRENGTH_SENSITIVE_SKILLS.includes(skill), `${skill} is classified strength-sensitive`);
  }
});

test("routingEnabledFor: the opt-out matrix", () => {
  assert.equal(routingEnabledFor("log-session", undefined), true, "absent = on");
  assert.equal(routingEnabledFor("log-session", true), true);
  assert.equal(routingEnabledFor("log-session", false), false, "global off");
  assert.equal(routingEnabledFor("log-session", { enabled: false }), false);
  assert.equal(routingEnabledFor("log-session", { skills: { "log-session": false } }), false, "per-skill off");
  assert.equal(routingEnabledFor("review-change", { skills: { "log-session": false } }), true, "other skills unaffected");
  assert.equal(routingEnabledFor("log-session", { skills: { "log-session": false }, enabled: true }), false, "per-skill wins over global");
  assert.equal(routingEnabledFor("log-session", { skills: { "log-session": true }, enabled: false }), true, "per-skill on wins over global off");
});

test("task-class routing: a low-stakes spawned task resolves to the unlimited tier routing-on", () => {
  const route = resolveTaskRoute("summarization", { tierRouting: true });
  assert.equal(route.model[0], ref("qwen3.6"));
  assert.deepEqual(route.model, unlimitedChain());
});

test("task-class routing: the same task resolves to the non-routing ladder routing-off", () => {
  const route = resolveTaskRoute("summarization", { tierRouting: false });
  assert.deepEqual(route, PUBLISHED_LADDER.default);
});

test("task-class routing: strength-sensitive spawned tasks keep the limited tier routing-on", () => {
  const route = resolveTaskRoute("review-axis", { tierRouting: true });
  assert.notEqual(route.model[0], ref("qwen3.6"));
  assert.equal(NAN_MODELS[route.model[0].split("/")[1]], "limited");
});

test("task-class routing: the catalog is closed data with boolean classifications", () => {
  for (const cls of ["summarization", "triage", "mechanical-logging", "review-axis", "audit-verdict", "planning", "conduction"]) {
    assert.ok(TASK_CLASSES[cls] !== undefined, `${cls} is in the catalog`);
    assert.equal(typeof TASK_CLASSES[cls].strengthSensitive, "boolean");
  }
});
