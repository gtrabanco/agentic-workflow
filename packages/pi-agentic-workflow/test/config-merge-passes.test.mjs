// config-merge-passes.test.mjs — issue #201 AC2/O2: `passes` merges
// project-over-global at entry and per route-key granularity, the same
// transaction rule every other route scope uses. Written red-first.

import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeConfigs } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { PASS_NAMES } from "@gtrabanco/agentic-workflow-schema";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid config, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

test("a project pass entry that sets only model keeps the global thinking", () => {
  const globalCfg = valid(
    '{"passes":{"review-code":{"model":"anthropic/claude-opus-4-5","thinking":"high"}}}',
    "global",
  );
  const projectCfg = valid('{"passes":{"review-code":{"model":"nan/qwen3.6"}}}', "project");

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.passes["review-code"], { model: "nan/qwen3.6", thinking: "high" });
});

test("a pass entry declared only in the project is added; one only in global survives", () => {
  const globalCfg = valid('{"passes":{"classify":{"model":"nan/qwen3.6"}}}', "global");
  const projectCfg = valid('{"passes":{"verify":{"model":"auto"}}}', "project");

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.passes.classify, { model: "nan/qwen3.6" });
  assert.deepEqual(merged.passes.verify, { model: "auto" });
});

test("with no passes declared anywhere the effective config carries an empty map", () => {
  const merged = mergeConfigs(valid("{}", "global"), valid("{}", "project"));
  assert.deepEqual(merged.passes, {});
  assert.deepEqual(DEFAULT_CONFIG.passes, {});
});

test("the shipped default leaves every pass unresolved — the resolver owns the chain", () => {
  for (const name of PASS_NAMES) {
    assert.equal(DEFAULT_CONFIG.passes[name], undefined, `${name} has no shipped entry`);
  }
});
