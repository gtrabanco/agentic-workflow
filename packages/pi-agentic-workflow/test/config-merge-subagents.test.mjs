// config-merge-subagents.test.mjs — issue #260 AC5: `subagents` merges
// project-over-global at key granularity, the same rule the routes and the
// `passes` entries follow. Written red-first.

import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeConfigs } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid config, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

test("subagents merges per key, project over global", () => {
  const globalCfg = valid('{"subagents":{"parallelism":"auto","memoryCap":"12 of 64 GB"}}', "global");
  const projectCfg = valid('{"subagents":{"parallelism":"serial"}}', "project");

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.subagents, { parallelism: "serial", memoryCap: "12 of 64 GB" });
});

test("a subagents key declared only in the project is added; one only in global survives", () => {
  const merged = mergeConfigs(
    valid('{"subagents":{"parallelism":"auto"}}', "global"),
    valid('{"subagents":{"threadCap":"2 of 80 threads"}}', "project"),
  );
  assert.deepEqual(merged.subagents, { parallelism: "auto", threadCap: "2 of 80 threads" });
});

test("with no subagents declared anywhere the effective config carries an empty record", () => {
  const merged = mergeConfigs(valid("{}", "global"), valid("{}", "project"));
  assert.deepEqual(merged.subagents, {});
  assert.deepEqual(DEFAULT_CONFIG.subagents, {});
});
