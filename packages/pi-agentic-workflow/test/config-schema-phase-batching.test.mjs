// config-schema-phase-batching.test.mjs — the `phaseBatching` config key (issue #632).
//
// The model-aware phase-batching policy's switch. One optional scalar and no
// coercion, the same discipline as `toolChoice`: it ships OFF, a misspelling is
// refused by name instead of silently resolving to the shipped default, and an
// install without the preset still parses it as a documented no-op.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";
import { mergeConfigs } from "../dist/config/merge.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { PI_CONFIG_EXTENSION } from "../dist/config/extension.js";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

const refused = (json, path, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, false, `${label}: expected a refusal`);
  assert.deepEqual(result.issues.map((issue) => issue.path), [path], label);
};

test("phaseBatching: the object form parses", () => {
  assert.deepEqual(valid('{"phaseBatching": {"enabled": true}}', "on").phaseBatching, { enabled: true });
  assert.deepEqual(valid('{"phaseBatching": {"enabled": false}}', "off").phaseBatching, { enabled: false });
  assert.deepEqual(valid('{"phaseBatching": {}}', "empty").phaseBatching, {});
});

test("phaseBatching: the shallow forms are refused instead of coerced", () => {
  refused('{"phaseBatching": true}', "$.phaseBatching", "boolean shorthand");
  refused('{"phaseBatching": "on"}', "$.phaseBatching", "string");
  refused('{"phaseBatching": []}', "$.phaseBatching", "array");
});

test("phaseBatching: a misspelled key is refused by name, never resolved to the shipped default", () => {
  refused('{"phaseBatching": {"enable": true}}', "$.phaseBatching.enable", "misspelled key");
  assert.equal(parseConfigFile('{"phaseBatching": {"enable": true}}').ok, false);
});

test("phaseBatching: a non-boolean value is refused at its own path", () => {
  refused('{"phaseBatching": {"enabled": "yes"}}', "$.phaseBatching.enabled", "string value");
  refused('{"phaseBatching": {"enabled": 1}}', "$.phaseBatching.enabled", "number value");
});

test("phaseBatching: the shipped default is OFF", () => {
  assert.deepEqual(DEFAULT_CONFIG.phaseBatching, { enabled: false });
  assert.equal(mergeConfigs({}, {}).phaseBatching.enabled, false, "an absent section resolves OFF, never on");
});

test("phaseBatching: project over global, and either scope alone resolves", () => {
  assert.equal(mergeConfigs({}, { phaseBatching: { enabled: true } }).phaseBatching.enabled, true, "project on");
  assert.equal(mergeConfigs({ phaseBatching: { enabled: true } }, {}).phaseBatching.enabled, true, "global on");
  assert.equal(
    mergeConfigs({ phaseBatching: { enabled: true } }, { phaseBatching: { enabled: false } }).phaseBatching.enabled,
    false,
    "project wins",
  );
});

test("phaseBatching: the published descriptor carries the key with its shipped default", () => {
  const properties = PI_CONFIG_EXTENSION.schema.properties ?? {};
  assert.ok(properties.phaseBatching, "the descriptor publishes the phaseBatching block");
  assert.equal(properties.phaseBatching.type, "object");
  assert.equal(properties.phaseBatching.additionalProperties, false);
  assert.deepEqual(Object.keys(properties.phaseBatching.properties ?? {}), ["enabled"]);
  assert.equal(properties.phaseBatching.properties.enabled.type, "boolean");
  assert.deepEqual(PI_CONFIG_EXTENSION.defaults.phaseBatching, { enabled: false });
});
