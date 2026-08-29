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
