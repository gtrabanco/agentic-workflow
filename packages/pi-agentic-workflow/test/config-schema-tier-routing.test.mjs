// config-schema-tier-routing.test.mjs — the `tierRouting` config key (issue #388 amendment 1).
//
// Generic opt-out surface for tier-aware presets: a global flag
// (`tierRouting: false`) or per-skill overrides (`tierRouting: { skills: { … } }`).
// The parser is strict (fail-closed, same discipline as `profileFallback`) and
// the merge is key-wise. Absent = routing on.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";
import { mergeConfigs } from "../dist/config/merge.js";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

test("tierRouting: boolean shorthand parses", () => {
  assert.equal(valid('{"tierRouting": true}', "true").tierRouting, true);
  assert.equal(valid('{"tierRouting": false}', "false").tierRouting, false);
});

test("tierRouting: object form parses", () => {
  const cfg = valid('{"tierRouting": {"enabled": false}}', "object");
  assert.deepEqual(cfg.tierRouting, { enabled: false });
  const cfg2 = valid('{"tierRouting": {"skills": {"review-change": false, "log-session": true}}}', "skills");
  assert.deepEqual(cfg2.tierRouting, { skills: { "review-change": false, "log-session": true } });
  const cfg3 = valid('{"tierRouting": {"enabled": true, "skills": {"log-session": false}}}', "both");
  assert.deepEqual(cfg3.tierRouting, { enabled: true, skills: { "log-session": false } });
});

test("tierRouting: string is rejected", () => {
  const result = parseConfigFile('{"tierRouting": "off"}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.tierRouting"]);
});

test("tierRouting: number is rejected", () => {
  const result = parseConfigFile('{"tierRouting": 1}');
  assert.equal(result.ok, false);
});

test("tierRouting: array is rejected", () => {
  const result = parseConfigFile('{"tierRouting": []}');
  assert.equal(result.ok, false);
});

test("tierRouting: unknown object key is rejected", () => {
  const result = parseConfigFile('{"tierRouting": {"bogus": 1}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.tierRouting.bogus"]);
});

test("tierRouting: non-boolean enabled is rejected", () => {
  const result = parseConfigFile('{"tierRouting": {"enabled": "no"}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.tierRouting.enabled"]);
});

test("tierRouting: non-boolean skill value is rejected", () => {
  const result = parseConfigFile('{"tierRouting": {"skills": {"log-session": "off"}}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.tierRouting.skills.log-session"]);
});

test("tierRouting: skills as array is rejected", () => {
  const result = parseConfigFile('{"tierRouting": {"skills": ["log-session"]}}');
  assert.equal(result.ok, false);
});

test("tierRouting: project overrides global (key-wise merge)", () => {
  const global = valid('{"tierRouting": {"enabled": true, "skills": {"review-change": true}}}', "global");
  const project = valid('{"tierRouting": {"skills": {"review-change": false}}}', "project");
  const merged = mergeConfigs(global, project);
  assert.deepEqual(merged.tierRouting, { enabled: true, skills: { "review-change": false } });
});

test("tierRouting: boolean overrides object wholesale", () => {
  const global = valid('{"tierRouting": {"enabled": true, "skills": {"review-change": false}}}', "global");
  const project = valid('{"tierRouting": false}', "project");
  const merged = mergeConfigs(global, project);
  assert.equal(merged.tierRouting, false);
});

test("tierRouting: absent stays absent (default is routing on)", () => {
  const merged = mergeConfigs({}, {});
  assert.equal(merged.tierRouting, undefined);
});
