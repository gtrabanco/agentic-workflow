// config-merge.test.mjs — AC5 + the AC12 loader leg (SPEC S5, S10, D-E5)
//
// Two contracts live here because they are the same transaction: read the two
// validated config files and produce one effective configuration. Project
// values override global values key by key, everything the project does not
// mention keeps the global (then shipped-default) value, and a file that is
// present but invalid yields an error object instead of a silently inherited
// route. Written red-first: the config modules did not exist when this landed.

import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeConfigs, effectiveRoute } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(result.ok, true, `${label}: expected valid config, got ${JSON.stringify(result.issues)}`);
  return result.config;
};

test("AC5: project command route overrides the global one", () => {
  const globalCfg = valid(
    '{"commands":{"design-feature":{"model":"anthropic/claude-sonnet-4-5","thinking":"low"}}}',
    "global",
  );
  const projectCfg = valid(
    '{"commands":{"design-feature":{"model":"openai/gpt-5.2","thinking":"high"}}}',
    "project",
  );

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.commands["design-feature"], { model: "openai/gpt-5.2", thinking: "high" });
});

test("AC5: unspecified keys keep the global value", () => {
  const globalCfg = valid(
    '{"default":{"model":"anthropic/claude-opus-4-5","thinking":"max"},' +
      '"commands":{"design-feature":{"model":"anthropic/claude-sonnet-4-5","thinking":"low"}},' +
      '"onUnavailableRoute":"inherit"}',
    "global",
  );
  // The project mentions only one command's model: that command's thinking
  // level, the default route, and the fallback policy must all survive global.
  const projectCfg = valid('{"commands":{"design-feature":{"model":"openai/gpt-5.2"}}}', "project");

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.commands["design-feature"], { model: "openai/gpt-5.2", thinking: "low" });
  assert.deepEqual(merged.default, { model: "anthropic/claude-opus-4-5", thinking: "max" });
  assert.equal(merged.onUnavailableRoute, "inherit");
});

test("AC5: commands neither scope mentions keep the global route; new project commands are added", () => {
  const globalCfg = valid(
    '{"commands":{"review-change":{"model":"anthropic/claude-opus-4-5","thinking":"high"}}}',
    "global",
  );
  const projectCfg = valid('{"commands":{"execute-phase":{"model":"openai/gpt-5.2"}}}', "project");

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(Object.keys(merged.commands).sort(), ["execute-phase", "review-change"]);
  assert.deepEqual(effectiveRoute(merged, "review-change"), { model: "anthropic/claude-opus-4-5", thinking: "high" });
  assert.deepEqual(effectiveRoute(merged, "execute-phase"), { model: "openai/gpt-5.2", thinking: "inherit" });
});

test("AC5: the keep-on-settle policy survives project-over-global merge with the shipped default", () => {
  const globalCfg = valid('{"onSettle":"restore"}', "global");
  const projectCfg = valid('{"onSettle":"keep"}', "project");

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.equal(merged.onSettle, "keep", "the project value wins");

  const onlyGlobal = mergeConfigs(globalCfg, {});
  assert.equal(onlyGlobal.onSettle, "restore", "an absent project keeps the global value");

  assert.equal(mergeConfigs({}, {}).onSettle, "keep", "the shipped default is keep");
});

test("AC5: a keep-on-settle route is round-tripped by the schema", () => {
  const kept = valid('{"onSettle":"keep"}', "global");
  assert.equal(kept.onSettle, "keep");

  const restored = valid('{"onSettle":"restore"}', "global");
  assert.equal(restored.onSettle, "restore");
});

test("AC5: an invalid settle policy is rejected naming the field", () => {
  const invalid = parseConfigFile('{"onSettle":"yolo"}');
  assert.equal(invalid.ok, false);
  assert.deepEqual(invalid.issues.map((issue) => issue.path), ["$.onSettle"]);
  assert.match(invalid.issues[0].message, /"keep" or "restore"/u);
});

test("AC5: an absent onSettle resolves to the shipped keep via the loader", () => {
  const merged = mergeConfigs({}, {});
  assert.equal(merged.onSettle, "keep");
});

test("AC5: a command with no route anywhere resolves to the effective default route", () => {
  const globalCfg = valid('{"default":{"model":"openai/gpt-5.2","thinking":"medium"}}', "global");
  const merged = mergeConfigs(globalCfg, {});
  assert.deepEqual(effectiveRoute(merged, "plan-feature"), { model: "openai/gpt-5.2", thinking: "medium" });
});

test("AC5: merging two empty files yields the shipped default exactly", () => {
  const merged = mergeConfigs({}, {});
  assert.deepEqual(merged, DEFAULT_CONFIG);
  assert.equal(merged.onUnavailableRoute, "stop");
  assert.deepEqual(effectiveRoute(merged, "anything"), { model: "inherit", thinking: "inherit" });
});

test("AC5: merge is a pure read — neither validated file is mutated", () => {
  const globalCfg = valid('{"commands":{"a":{"model":"openai/gpt-5.2","thinking":"high"}}}', "global");
  const projectCfg = valid('{"commands":{"a":{"thinking":"low"}}}', "project");
  const globalSnapshot = structuredClone(globalCfg);
  const projectSnapshot = structuredClone(projectCfg);

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(globalCfg, globalSnapshot);
  assert.deepEqual(projectCfg, projectSnapshot);
  // The result must not alias either input's route objects either.
  merged.commands["a"].model = "mutated/x";
  assert.equal(projectCfg.commands?.["a"]?.model, undefined);
});

// --- AC7 / OB-6 / OB-7: ordered model fallback chain (issue #154, root cause E) ---
// A route's `model` may be `"inherit"`, a single `provider/modelId`, or an
// ordered chain of 1–4 references. Written red-first: the schema did not accept
// an array when these landed.

test("AC7: a model chain merges project-over-global per key and round-trips its order", () => {
  const globalCfg = valid('{"commands":{"plan-feature":{"model":["global/m1","global/m2"]}}}', "global");
  const projectCfg = valid(
    '{"commands":{"plan-feature":{"model":["project/m1","project/m2","project/m3"],"thinking":"high"}}}',
    "project",
  );

  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.commands["plan-feature"].model, ["project/m1", "project/m2", "project/m3"]);
  assert.equal(merged.commands["plan-feature"].thinking, "high");
});

test("AC7: a chain declared only at global scope survives into the merged route", () => {
  const globalCfg = valid('{"commands":{"design-feature":{"model":["a/x","b/y"]}}}', "global");
  const merged = mergeConfigs(globalCfg, {});
  assert.deepEqual(merged.commands["design-feature"].model, ["a/x", "b/y"]);
});

test("AC7/OB-6: legacy `inherit` and single-string model files parse and merge unchanged", () => {
  const inheritCfg = valid('{"default":{"model":"inherit","thinking":"high"}}', "global");
  assert.equal(inheritCfg.default.model, "inherit");
  assert.deepEqual(mergeConfigs(inheritCfg, {}).default, { model: "inherit", thinking: "high" });

  const singleCfg = valid('{"commands":{"plan-feature":{"model":"openai/gpt-5.2"}}}', "global");
  const merged = mergeConfigs(singleCfg, {});
  assert.equal(merged.commands["plan-feature"].model, "openai/gpt-5.2");
  assert.equal(typeof merged.commands["plan-feature"].model, "string");
});

test("AC7/OB-11: a non-reference chain element is rejected naming the loaders model path", () => {
  const result = parseConfigFile('{"commands":{"plan-feature":{"model":["a/m1","not-a-reference"]}}}');
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.deepEqual(result.issues.map((issue) => issue.path), ["$.commands.plan-feature.model"]);
  assert.match(result.issues[0].message, /not-a-reference/u);
  assert.ok(result.issues[0].message.includes('provider/modelId'), `expected a reference hint: ${result.issues[0].message}`);
});

test("AC7/OB-6: a chain longer than 4 entries is rejected naming the limit", () => {
  const chain = ["a/m1", "a/m2", "a/m3", "a/m4", "a/m5"];
  const result = parseConfigFile(`{"commands":{"plan-feature":{"model":${JSON.stringify(chain)}}}}`);
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.deepEqual(result.issues.map((issue) => issue.path), ["$.commands.plan-feature.model"]);
  assert.match(result.issues[0].message, /4/u);
});

test("AC7/OB-6: an empty chain array is rejected", () => {
  const result = parseConfigFile('{"commands":{"plan-feature":{"model":[]}}}');
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.deepEqual(result.issues.map((issue) => issue.path), ["$.commands.plan-feature.model"]);
  assert.match(result.issues[0].message, /non-empty/u);
});

test("AC7/OB-11: a single invalid element inside a chain is still rejected with the schema path shape", () => {
  const result = parseConfigFile('{"default":{"model":["a/m1",42]}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((issue) => issue.path), ["$.default.model"]);
});

test("AC12 loader leg: malformed JSON is an error object, never a silent inherit", () => {
  const result = parseConfigFile('{"default": {"model": "openai/gpt-5.2",}');
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].path, "$");
  assert.match(result.issues[0].message, /JSON/u);
  assert.equal("config" in result, false);
});

test("AC12 loader leg: schema violations name the offending path", () => {
  const cases = [
    ['{"default":{"model":"not-a-provider-model"}}', "$.default.model"],
    ['{"default":{"model":42}}', "$.default.model"],
    ['{"default":{"thinking":"ultracode"}}', "$.default.thinking"],
    ['{"commands":{"plan-feature":{"thinking":"high","extra":1}}}', "$.commands.plan-feature.extra"],
    ['{"commands":{"plan-feature":"openai/gpt-5.2"}}', "$.commands.plan-feature"],
    ['{"onUnavailableRoute":"continue"}', "$.onUnavailableRoute"],
    ['{"onSettle":"restore-and-dance"}', "$.onSettle"],
    ['{"default":{"model":"inherit","thinking":"high"},"unknown":true}', "$.unknown"],
    ['[1,2,3]', "$"],
    ['null', "$"],
    ['{"commands":{}}', null],
  ];

  for (const [json, expectedPath] of cases) {
    const result = parseConfigFile(json);
    if (expectedPath === null) {
      assert.equal(result.ok, true, `${json} must be valid`);
      continue;
    }
    assert.equal(result.ok, false, `${json} must be rejected`);
    assert.deepEqual(
      result.issues.map((issue) => issue.path),
      [expectedPath],
      `${json} unexpected issue paths`,
    );
  }
});

test("AC12 loader leg: an invalid file carries no config, so nothing can merge it as if it were absent", () => {
  const invalid = parseConfigFile('{"onUnavailableRoute":"yolo"}');
  assert.equal(invalid.ok, false);
  assert.equal("config" in invalid, false, "a rejected file must not hand merge a usable config");
});
