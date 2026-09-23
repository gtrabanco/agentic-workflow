// conductor-invoke.test.mjs — AC2 verbatim mapping; AC6 adversarial flags

import { test } from "node:test";
import assert from "node:assert/strict";

const { invocationFromDecision } = await import("../dist/conductor/index.js");

function makeDecision(kind, overrides = {}) {
  return { kind, intent: "discover-repository-state", targets: ["unit-62"], reasonCode: "invoke-proven-transition", evidenceRefs: ["snap@roadmap:1"], detail: "", ...overrides };
}

function makeDeps(overrides = {}) {
  return {
    commandNames: new Set(["plan-feature", "execute-phase", "review-change", "audit-pr", "triage-issue", "design-feature", "plan-fix", "init-workspace", "discover-repository-state", "resolve-repository-state"]),
    attended: true, unitScope: { type: "feature", id: "62" }, sensitive: false, security: false, ...overrides,
  };
}

// AC2: verbatim mapping
test("AC2: invoke decision → /skill:<verb> <args>", () => {
  const decision = makeDecision("invoke", { intent: "discover-repository-state", targets: [] });
  const result = invocationFromDecision(decision, makeDeps());
  assert.ok(result.ok); assert.equal(result.invocation, "/skill:discover-repository-state");
});

test("AC2: invoke with targets → /skill:<verb> <targets>", () => {
  const decision = makeDecision("invoke", { intent: "execute-phase", targets: ["unit-62"] });
  const result = invocationFromDecision(decision, makeDeps());
  assert.ok(result.ok); assert.equal(result.invocation, "/skill:execute-phase unit-62");
});

test("AC2: targets flow verbatim into invocation", () => {
  const decision = makeDecision("invoke", { intent: "plan-feature", targets: ["arg with spaces", "another"] });
  const result = invocationFromDecision(decision, makeDeps());
  assert.ok(result.ok); assert.ok(result.invocation.includes("arg with spaces"), "verbatim args preserved");
});

// AC6: adversarial flags
test("AC6: attended → no adversarial flag", () => {
  const decision = makeDecision("invoke", { intent: "review-change", targets: ["candidate"] });
  const result = invocationFromDecision(decision, makeDeps({ attended: true }));
  assert.ok(result.ok); assert.ok(!result.invocation.includes("--adversarial"));
});

test("AC6: unattended + L/sensitive → --adversarial 2", () => {
  const decision = makeDecision("invoke", { intent: "review-change", targets: ["candidate"] });
  const result = invocationFromDecision(decision, makeDeps({ attended: false, sensitive: true }));
  assert.ok(result.ok); assert.ok(result.invocation.includes("--adversarial 2"));
});

test("AC6: unattended + security → --adversarial 3", () => {
  const decision = makeDecision("invoke", { intent: "review-change", targets: ["candidate"] });
  const result = invocationFromDecision(decision, makeDeps({ attended: false, security: true }));
  assert.ok(result.ok); assert.ok(result.invocation.includes("--adversarial 3"));
});

test("AC6: unattended + security overrides sensitive → --adversarial 3", () => {
  const decision = makeDecision("invoke", { intent: "review-change", targets: ["candidate"] });
  const result = invocationFromDecision(decision, makeDeps({ attended: false, sensitive: true, security: true }));
  assert.ok(result.ok); assert.ok(result.invocation.includes("--adversarial 3"));
});

test("AC6: unattended non-review intent → no adversarial", () => {
  const decision = makeDecision("invoke", { intent: "execute-phase", targets: ["P3"] });
  const result = invocationFromDecision(decision, makeDeps({ attended: false, sensitive: true }));
  assert.ok(result.ok); assert.ok(!result.invocation.includes("--adversarial"));
});

// Refusal codes
test("AC2/AC4: unknown verb → no-decision-available", () => {
  const decision = makeDecision("invoke", { intent: "bogus-verb", targets: [] });
  const result = invocationFromDecision(decision, makeDeps({ commandNames: new Set(["plan-feature"]) }));
  assert.equal(result.ok, false); assert.equal(result.refusal, "no-decision-available");
});

test("AC2: ok=false returns refusal string", () => {
  const decision = makeDecision("invoke", { intent: "nonexistent", targets: [] });
  const result = invocationFromDecision(decision, makeDeps());
  assert.equal(result.ok, false);
  assert.ok(["no-decision-available", "precondition-uncheckable", "rendering-failed"].includes(result.refusal));
});
