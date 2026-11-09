// config-schema-stateflow.test.mjs — issue #174: the `stateFlow` config key.
//
// The strict-validator contract is unchanged: only the documented keys, only
// the documented value shapes, no coercion. The block is optional — absent
// resolves to the shipped default (enabled `false`, backend `pi-state-flow`,
// the two-command allowlist, `command_settled`, `noop` on a missing backend);
// a present-but-invalid declaration must produce issues rather than a silent
// fallback, because an execution-state mode that is silently dropped (or
// silently enabled) breaks the operator's model of what the session did.
// Written red-first (issue #174 P1).

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";

test("a fully-declared stateFlow key is accepted", () => {
  const result = parseConfigFile(
    '{"stateFlow":{"enabled":true,"backend":"pi-state-flow","commands":["execute-phase","fold-findings"],"stopOn":"command_settled","onBackendMissing":"refuse"}}',
  );
  assert.equal(result.ok, true, JSON.stringify(result.issues ?? []));
  assert.deepEqual(result.config.stateFlow, {
    enabled: true,
    backend: "pi-state-flow",
    commands: ["execute-phase", "fold-findings"],
    stopOn: "command_settled",
    onBackendMissing: "refuse",
  });
});

test("a partial stateFlow key keeps only what the file declares", () => {
  const result = parseConfigFile('{"stateFlow":{"enabled":true}}');
  assert.equal(result.ok, true, JSON.stringify(result.issues ?? []));
  assert.deepEqual(result.config.stateFlow, { enabled: true });
});

test("an absent stateFlow key parses to absent — the default lives in defaults.ts", () => {
  const result = parseConfigFile('{"default":{"model":"inherit","thinking":"inherit"}}');
  assert.equal(result.ok, true, JSON.stringify(result.issues ?? []));
  assert.equal(result.config.stateFlow, undefined);
});

test("an unknown stateFlow key is rejected at $.stateFlow.<key>", () => {
  const result = parseConfigFile('{"stateFlow":{"enabled":true,"mode":"aggressive"}}');
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some((i) => i.path === "$.stateFlow.mode" && /unknown stateFlow key/.test(i.message)),
    JSON.stringify(result.issues ?? []),
  );
});

test("backend accepts only the documented vocabulary", () => {
  const result = parseConfigFile('{"stateFlow":{"backend":"skillstate-native"}}');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.path === "$.stateFlow.backend"), JSON.stringify(result.issues ?? []));
});

test("stopOn accepts only the documented vocabulary", () => {
  const result = parseConfigFile('{"stateFlow":{"stopOn":"phase_receipt"}}');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.path === "$.stateFlow.stopOn"), JSON.stringify(result.issues ?? []));
});

test("onBackendMissing accepts only the documented vocabulary", () => {
  const result = parseConfigFile('{"stateFlow":{"onBackendMissing":"warn"}}');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.path === "$.stateFlow.onBackendMissing"), JSON.stringify(result.issues ?? []));
});

test("enabled must be a boolean — no coercion", () => {
  for (const value of ["true", 1, null]) {
    const result = parseConfigFile(`{"stateFlow":{"enabled":${JSON.stringify(value)}}}`);
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(value)}`);
    assert.ok(
      result.issues.some((i) => i.path === "$.stateFlow.enabled"),
      `${JSON.stringify(value)}: ${JSON.stringify(result.issues ?? [])}`,
    );
  }
});

test("commands must be an array of non-empty command names", () => {
  const result = parseConfigFile('{"stateFlow":{"commands":["execute-phase",""]}}');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.path === "$.stateFlow.commands"), JSON.stringify(result.issues ?? []));

  const notArray = parseConfigFile('{"stateFlow":{"commands":"execute-phase"}}');
  assert.equal(notArray.ok, false);
  assert.ok(notArray.issues.some((i) => i.path === "$.stateFlow.commands"), JSON.stringify(notArray.issues ?? []));
});

test("the stateFlow block itself must be an object", () => {
  const result = parseConfigFile('{"stateFlow":true}');
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.path === "$.stateFlow"), JSON.stringify(result.issues ?? []));
});
