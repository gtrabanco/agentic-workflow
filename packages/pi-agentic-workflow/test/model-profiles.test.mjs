// model-profiles.test.mjs — AC1–AC7, AC9, AC13, AC15 (feature 63)

import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeConfigs, effectiveRoute } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { effectiveProfileOrder, resolveProfileChain } from "../dist/config/profiles.js";
import { RECOMMENDED_PROFILES } from "../dist/config/recommended.js";

const valid = (json, label) => {
  const result = parseConfigFile(json);
  assert.equal(
    result.ok,
    true,
    `${label}: expected valid config, got ${JSON.stringify(result.issues)}`,
  );
  return result.config;
};

// ---------------------------------------------------------------------------
// Schema validation (AC15)
// ---------------------------------------------------------------------------

test("AC15: recommendedModels=true parses as boolean true", () => {
  const result = parseConfigFile('{"recommendedModels": true}');
  assert.equal(result.ok, true);
  assert.equal(result.config.recommendedModels, true);
});

test("AC15: recommendedModels=string is rejected", () => {
  const result = parseConfigFile('{"recommendedModels": "yes"}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.recommendedModels"]);
});

test("AC15: valid profile with default command parses", () => {
  const cfg = valid(
    '{"profiles":{"work":{"default":{"model":"nan/deepseek-v4-flash","thinking":"high"}}}}',
  );
  assert.equal(cfg.profiles.work.default.model, "nan/deepseek-v4-flash");
});

test("AC15: profiles=string is rejected", () => {
  const result = parseConfigFile('{"profiles": "x"}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profiles"]);
});

test("AC15: profiles.work=string is rejected", () => {
  const result = parseConfigFile('{"profiles": {"work": "x"}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profiles.work"]);
});

test("AC15: profiles.work.bogus is rejected", () => {
  const result = parseConfigFile('{"profiles": {"work": {"bogus": 1}}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profiles.work.bogus"]);
});

test("AC15: profileOrder with values is ok", () => {
  const result = parseConfigFile('{"profileOrder": ["work", "default"]}');
  assert.equal(result.ok, true);
  assert.deepEqual(result.config.profileOrder, ["work", "default"]);
});

test("AC15: profileOrder empty array is rejected", () => {
  const result = parseConfigFile('{"profileOrder": []}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileOrder"]);
});

test("AC15: profileOrder with empty string is rejected", () => {
  const result = parseConfigFile('{"profileOrder": ["work", ""]}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileOrder"]);
});

test("AC15: profileFallback valid parses", () => {
  const cfg = valid(
    '{"profileFallback":{"applyTo":"flow","resume":"continue","retryAfterSeconds":86400}}',
  );
  assert.equal(cfg.profileFallback.applyTo, "flow");
  assert.equal(cfg.profileFallback.resume, "continue");
  assert.equal(cfg.profileFallback.retryAfterSeconds, 86400);
});

test("AC15: profileFallback.applyTo=invalid is rejected", () => {
  const result = parseConfigFile('{"profileFallback":{"applyTo":"nope"}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileFallback.applyTo"]);
});

test("AC15: profileFallback.resume=invalid is rejected", () => {
  const result = parseConfigFile('{"profileFallback":{"resume":"nope"}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileFallback.resume"]);
});

test("AC15: profileFallback.retryAfterSeconds=0 is rejected", () => {
  const result = parseConfigFile('{"profileFallback":{"retryAfterSeconds":0}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileFallback.retryAfterSeconds"]);
});

test("AC15: profileFallback.retryAfterSeconds=1.5 is rejected", () => {
  const result = parseConfigFile('{"profileFallback":{"retryAfterSeconds":1.5}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileFallback.retryAfterSeconds"]);
});

test("AC15: profileFallback.bogus is rejected", () => {
  const result = parseConfigFile('{"profileFallback":{"bogus":1}}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileFallback.bogus"]);
});

test("AC15: profileFallback=string is rejected", () => {
  const result = parseConfigFile('{"profileFallback": "x"}');
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((i) => i.path), ["$.profileFallback"]);
});

// ---------------------------------------------------------------------------
// Merge (AC5, AC6, AC13)
// ---------------------------------------------------------------------------

test("AC13: mergeConfigs({}, {}) deepEquals DEFAULT_CONFIG", () => {
  const merged = mergeConfigs({}, {});
  assert.deepEqual(merged, DEFAULT_CONFIG);
});

test("AC13: effectiveRoute({}, {}) returns inherit route", () => {
  const merged = mergeConfigs({}, {});
  assert.deepEqual(effectiveRoute(merged, "anything"), {
    model: "inherit",
    thinking: "inherit",
  });
});

test("AC13: user default route survives merge", () => {
  const cfg = mergeConfigs(
    {},
    valid('{"default":{"model":"openai/gpt-5.2","thinking":"medium"}}'),
  );
  assert.deepEqual(effectiveRoute(cfg, "unit-lane"), {
    model: "openai/gpt-5.2",
    thinking: "medium",
  });
});

test("AC5: profile commands merge key-by-key", () => {
  const a = valid(
    '{"profiles":{"work":{"commands":{"execute-phase":{"model":"a/1"}}}}}',
  );
  const b = valid(
    '{"profiles":{"work":{"commands":{"execute-phase":{"thinking":"high"}}}}}',
  );
  const merged = mergeConfigs(a, b);
  assert.deepEqual(
    merged.profiles.work.commands["execute-phase"],
    { model: "a/1", thinking: "high" },
  );
});

test("AC6: profileOrder is merged", () => {
  const merged = mergeConfigs({}, valid('{"profileOrder":["work","default"]}'));
  assert.deepEqual(merged.profileOrder, ["work", "default"]);
});

test("AC6: recommendedModels project overrides global", () => {
  const merged = mergeConfigs(valid('{"recommendedModels":false}'), {});
  assert.equal(merged.recommendedModels, false);
  assert.equal(mergeConfigs({}, {}).recommendedModels, true);
});

test("AC13: empty merge has empty profiles, empty profileOrder, default profileFallback", () => {
  const merged = mergeConfigs({}, {});
  assert.deepEqual(merged.profileOrder, []);
  assert.deepEqual(merged.profileFallback, {
    applyTo: "flow",
    resume: "continue",
    retryAfterSeconds: 86400,
  });
  assert.deepEqual(merged.profiles, {});
});

test("AC5: profileFallback merges key-by-key", () => {
  const globalCfg = valid('{"profileFallback":{"applyTo":"command"}}');
  const projectCfg = valid('{"profileFallback":{"retryAfterSeconds":60}}');
  const merged = mergeConfigs(globalCfg, projectCfg);
  assert.deepEqual(merged.profileFallback, {
    applyTo: "command",
    resume: "continue",
    retryAfterSeconds: 60,
  });
});

// ---------------------------------------------------------------------------
// Resolution (AC1, AC2, AC3, AC4, AC5, AC6, AC7)
// ---------------------------------------------------------------------------

const nanUp = { providerAvailable: (p) => p === "nan" };
const nanDown = { providerAvailable: () => false };

test("AC1: effectiveProfileOrder with nan up returns default then nan", () => {
  const order = effectiveProfileOrder(DEFAULT_CONFIG, nanUp);
  assert.deepEqual(order, ["default", "nan"]);
});

test("AC3: effectiveProfileOrder with nan down returns only default", () => {
  const order = effectiveProfileOrder(DEFAULT_CONFIG, nanDown);
  assert.deepEqual(order, ["default"]);
});

test("AC1: recommendedModels=false disables nan", () => {
  const config = { ...DEFAULT_CONFIG, recommendedModels: false };
  const order = effectiveProfileOrder(config, nanUp);
  assert.deepEqual(order, ["default"]);
});

test("AC5: custom profileOrder prepends to base", () => {
  const cfg = mergeConfigs(
    valid('{"profileOrder":["work","default"]}'),
    {},
  );
  const order = effectiveProfileOrder(cfg, nanUp);
  assert.deepEqual(order, ["work", "default", "nan"]);
});

test("AC5: custom profileOrder no duplicate nan", () => {
  const cfg = mergeConfigs(
    valid('{"profileOrder":["work","default","nan"]}'),
    {},
  );
  const order = effectiveProfileOrder(cfg, nanUp);
  assert.deepEqual(order, ["work", "default", "nan"]);
});

test("AC2: resolveProfileChain execute-phase returns nan profile with expected route", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "execute-phase", nanUp);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].profile, "nan");
  assert.deepEqual(candidates[0].route.model, [
    "nan/deepseek-v4-flash",
    "nan/glm5.3-flash",
  ]);
  assert.equal(candidates[0].declared.model, true);
});

test("AC2: resolveProfileChain product-audit returns nan with 3-model chain and high thinking", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "product-audit", nanUp);
  assert.deepEqual(candidates[0].route.model, [
    "nan/glm5.3",
    "nan/mimo-v2.5",
    "nan/deepseek-v4-flash",
  ]);
  assert.equal(candidates[0].route.thinking, "high");
});

test("AC2: resolveProfileChain audit-pr returns expected route", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "audit-pr", nanUp);
  assert.deepEqual(candidates[0].route, {
    model: ["nan/mimo-v2.5", "nan/deepseek-v4-flash"],
    thinking: "high",
  });
});

test("AC2: resolveProfileChain review-change returns expected route", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "review-change", nanUp);
  assert.deepEqual(candidates[0].route, {
    model: ["nan/mimo-v2.5", "nan/glm5.3-flash", "nan/deepseek-v4-flash"],
    thinking: "high",
  });
});

test("AC2: resolveProfileChain unit-lane returns expected route", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "unit-lane", nanUp);
  assert.deepEqual(candidates[0].route, {
    model: ["nan/mimo-v2.5", "nan/glm5.3-flash", "nan/deepseek-v4-flash"],
    thinking: "high",
  });
});

test("AC2: resolveProfileChain advance returns expected route", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "advance", nanUp);
  assert.deepEqual(candidates[0].route, {
    model: ["nan/glm5.3-flash", "nan/deepseek-v4-flash"],
    thinking: "inherit",
  });
});

test("AC2: resolveProfileChain log-session returns expected route", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "log-session", nanUp);
  assert.deepEqual(candidates[0].route, {
    model: ["nan/deepseek-v4-flash", "nan/glm5.3-flash"],
    thinking: "inherit",
  });
});

test("AC2: resolveProfileChain unknown command returns nan default route", () => {
  const candidates = resolveProfileChain(
    DEFAULT_CONFIG,
    "anything-else",
    nanUp,
  );
  assert.equal(candidates[0].profile, "nan");
  assert.deepEqual(candidates[0].route.model, [
    "nan/deepseek-v4-flash",
    "nan/glm5.3-flash",
  ]);
});

test("AC3: resolveProfileChain with nan down returns empty array", () => {
  const candidates = resolveProfileChain(DEFAULT_CONFIG, "execute-phase", nanDown);
  assert.deepEqual(candidates, []);
});

test("AC4: user override wins over nan profile", () => {
  const cfg = mergeConfigs(
    {},
    valid(
      '{"commands":{"execute-phase":{"model":"x/1","thinking":"low"}}}',
    ),
  );
  const candidates = resolveProfileChain(cfg, "execute-phase", nanUp);
  assert.equal(candidates[0].profile, "default");
  assert.deepEqual(candidates[0].route, { model: "x/1", thinking: "low" });
  assert.equal(candidates[1].profile, "nan");
});

test("AC4: an explicit command model:\"inherit\" is a declaration and stops the nan fallback", () => {
  const cfg = mergeConfigs(
    {},
    valid('{"commands":{"execute-phase":{"model":"inherit"}}}'),
  );
  const candidates = resolveProfileChain(cfg, "execute-phase", nanUp);
  assert.equal(candidates[0].profile, "default");
  assert.equal(candidates[0].declared.model, true);
  assert.equal(candidates[0].route.model, "inherit");
  assert.equal(candidates[1].profile, "nan");
});

test("AC4: an explicit top-level default model:\"inherit\" declares every command", () => {
  const cfg = mergeConfigs(
    {},
    valid('{"default":{"model":"inherit"}}'),
  );
  const candidates = resolveProfileChain(cfg, "anything", nanUp);
  assert.equal(candidates[0].profile, "default");
  assert.equal(candidates[0].declared.model, true);
});

test("AC4: an explicit thinking:\"inherit\" is a declaration", () => {
  const cfg = mergeConfigs(
    {},
    valid('{"commands":{"execute-phase":{"thinking":"inherit"}}}'),
  );
  const candidates = resolveProfileChain(cfg, "execute-phase", nanUp);
  assert.equal(candidates[0].profile, "default");
  assert.equal(candidates[0].declared.thinking, true);
  assert.equal(candidates[0].declared.model, false);
});

test("AC5/AC6: user profile command wins; other command falls through to nan", () => {
  const cfg = mergeConfigs(
    valid(
      '{"profileOrder":["work","default"],"profiles":{"work":{"commands":{"execute-phase":{"model":"w/1","thinking":"max"}}}}}',
    ),
    {},
  );
  const execCandidates = resolveProfileChain(cfg, "execute-phase", nanUp);
  assert.equal(execCandidates[0].profile, "work");
  assert.deepEqual(execCandidates[0].route, { model: "w/1", thinking: "max" });
  const otherCandidates = resolveProfileChain(cfg, "other", nanUp);
  assert.equal(otherCandidates[0].profile, "nan");
});

test("AC7: per-key independence — default declares thinking only, nan declares model", () => {
  const cfg = mergeConfigs(
    {},
    valid('{"commands":{"execute-phase":{"thinking":"max"}}}'),
  );
  const candidates = resolveProfileChain(cfg, "execute-phase", nanUp);
  // default candidate first, declares thinking only
  assert.equal(candidates[0].profile, "default");
  assert.equal(candidates[0].declared.model, false);
  assert.equal(candidates[0].declared.thinking, true);
  // nan candidate second, declares model
  assert.equal(candidates[1].profile, "nan");
  assert.equal(candidates[1].declared.model, true);
});

test("AC2: RECOMMENDED_PROFILES.nan.commands[execute-phase].model", () => {
  assert.deepEqual(
    RECOMMENDED_PROFILES.nan.commands["execute-phase"].model,
    ["nan/deepseek-v4-flash", "nan/glm5.3-flash"],
  );
});