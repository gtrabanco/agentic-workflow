// config-schema-preset-profile.test.mjs — the `presetProfile` config key
// (issue #388 amendment 2).
//
// Generic selection surface for multi-profile presets: the profile names a
// companion contributes (`quality`, `economy`, …), as one string or an ordered
// array (first entry = most preferred; the chain probes them in order, so a
// profile whose routes fail demotes to the next). The parser is strict
// (fail-closed, same discipline as `tierRouting`); the values themselves are
// companion-defined — the main package validates the *shape* only, and the
// registry filters unknown names at chain build. Absent = each preset resolves
// its own default profile.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";
import { mergeConfigs } from "../dist/config/merge.js";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

test("presetProfile: a single profile name parses", () => {
  assert.equal(valid('{"presetProfile": "economy"}', "string").presetProfile, "economy");
});

test("presetProfile: an ordered array parses, order preserved", () => {
  const cfg = valid('{"presetProfile": ["quality", "economy"]}', "array");
  assert.deepEqual(cfg.presetProfile, ["quality", "economy"]);
});

test("presetProfile: an empty array is rejected (a declared selection must select)", () => {
  const result = parseConfigFile('{"presetProfile": []}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.presetProfile"]);
});

test("presetProfile: non-slug names are rejected", () => {
  for (const bad of ['{"presetProfile": "Economy"}', '{"presetProfile": "my profile"}', '{"presetProfile": ""}']) {
    const result = parseConfigFile(bad);
    assert.equal(result.ok, false, bad);
    assert.deepEqual(result.issues.map((i) => i.path), ["$.presetProfile"], bad);
  }
});

test("presetProfile: array entries must each be slugs; the bad entry is named", () => {
  const result = parseConfigFile('{"presetProfile": ["quality", "Bad Name"]}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.presetProfile.1"]);
});

test("presetProfile: number, boolean and object are rejected", () => {
  for (const bad of ['{"presetProfile": 3}', '{"presetProfile": true}', '{"presetProfile": {"name": "quality"}}']) {
    const result = parseConfigFile(bad);
    assert.equal(result.ok, false, bad);
    assert.deepEqual(result.issues.map((i) => i.path), ["$.presetProfile"], bad);
  }
});

test("presetProfile: shallow array nesting is rejected", () => {
  const result = parseConfigFile('{"presetProfile": [["quality"]]}');
  assert.equal(result.ok, false);
});

test("presetProfile merge: project wins over global wholesale (same rule as profileOrder)", () => {
  const merged = mergeConfigs({ presetProfile: ["quality", "balanced"] }, { presetProfile: ["economy"] });
  assert.deepEqual(merged.presetProfile, ["economy"]);
});

test("presetProfile merge: global is used when the project does not declare it", () => {
  const merged = mergeConfigs({ presetProfile: "balanced" }, {});
  assert.deepEqual(merged.presetProfile, "balanced");
});

test("presetProfile merge: absent in both scopes stays absent (resolved shape carries no undefined key)", () => {
  const merged = mergeConfigs({}, {});
  assert.equal("presetProfile" in merged, false);
});
