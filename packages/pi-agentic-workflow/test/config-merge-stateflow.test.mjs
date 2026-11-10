// config-merge-stateflow.test.mjs — issue #174: `stateFlow` project-over-global.
//
// The merge granularity is the individual field, matching every other scalar
// block in the file (`memory`, `telemetry`, `logSession`): a project that
// sets only `enabled` keeps the global allowlist, and a scope declaring no
// `stateFlow` at all contributes nothing. The allowlist array resolves whole —
// `project.commands ?? global.commands ?? shipped default` — because a
// half-merged allowlist would silently widen or narrow the command set the
// operator believes they chose. Written red-first (issue #174 P1).

import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { mergeConfigs } from "../dist/config/merge.js";

test("the shipped default is off, pi-state-flow, the two-command allowlist, command_settled, noop", () => {
  assert.deepEqual(DEFAULT_CONFIG.stateFlow, {
    enabled: false,
    backend: "pi-state-flow",
    commands: ["execute-phase", "fold-findings"],
    stopOn: "command_settled",
    onBackendMissing: "noop",
  });
});

test("no scope declaring stateFlow resolves to the shipped default", () => {
  const merged = mergeConfigs({}, {});
  assert.deepEqual(merged.stateFlow, DEFAULT_CONFIG.stateFlow);
});

test("project field wins over global field", () => {
  const merged = mergeConfigs(
    { stateFlow: { enabled: true, onBackendMissing: "refuse" } },
    { stateFlow: { enabled: false } },
  );
  assert.equal(merged.stateFlow.enabled, false);
  assert.equal(merged.stateFlow.onBackendMissing, "refuse");
  // Untouched fields stay at the shipped default.
  assert.deepEqual(merged.stateFlow.commands, ["execute-phase", "fold-findings"]);
});

test("global-only declarations survive a silent project", () => {
  const merged = mergeConfigs(
    { stateFlow: { enabled: true, commands: ["execute-phase"] } },
    {},
  );
  assert.deepEqual(merged.stateFlow, {
    enabled: true,
    backend: "pi-state-flow",
    commands: ["execute-phase"],
    stopOn: "command_settled",
    onBackendMissing: "noop",
  });
});

test("the allowlist resolves whole, never half-merged", () => {
  const merged = mergeConfigs(
    { stateFlow: { commands: ["execute-phase", "fold-findings", "ship-roadmap"] } },
    { stateFlow: { commands: ["fold-findings"] } },
  );
  assert.deepEqual(merged.stateFlow.commands, ["fold-findings"]);
});

test("an empty commands array is a deliberate disable, not a default refill", () => {
  const merged = mergeConfigs(
    { stateFlow: { commands: ["execute-phase"] } },
    { stateFlow: { commands: [] } },
  );
  assert.deepEqual(merged.stateFlow.commands, []);
});
