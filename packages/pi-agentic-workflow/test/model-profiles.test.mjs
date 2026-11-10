// model-profiles.test.mjs — AC1–AC7, AC9, AC13, AC15 (feature 63)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { mergeConfigs, effectiveRoute } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { effectiveProfileOrder, resolveProfileChain } from "../dist/config/profiles.js";
import { registerProviderPreset, clearProviderPresets } from "../dist/config/presets.js";

// Issue #388: the built-in vendor profile is retired — ladders arrive from an
// installed companion preset through the seam. These tests register a fixture
// preset standing in for one (any provider name) and clean the global registry
// afterwards. The vendor's own ladder + its README parity live in the
// companion package now.
const FIXTURE = {
  provider: "acme",
  default: ["acme/big", "acme/small"],
  commands: {
    "review-change": { model: ["acme/strong", "acme/big"], thinking: "high" },
    "product-audit": { model: ["acme/strong", "acme/big", "acme/small"], thinking: "high" },
    "execute-phase": { model: ["acme/big", "acme/small"], thinking: "inherit" },
    "log-session": { model: ["acme/big", "acme/small"], thinking: "inherit" },
  },
};
function registerFixture() {
  registerProviderPreset({
    provider: FIXTURE.provider,
    resolveProfile: () => ({
      default: { model: FIXTURE.default, thinking: "inherit" },
      commands: Object.fromEntries(Object.entries(FIXTURE.commands).map(([k, v]) => [k, { ...v }])),
    }),
  });
  return () => clearProviderPresets();
}

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

const fixtureUp = () => {
  const done = registerFixture();
  return { opts: { providerAvailable: (p) => p === FIXTURE.provider }, done };
};
const fixtureDown = { providerAvailable: () => false };

test("AC1: effectiveProfileOrder with the preset provider up returns default then the preset", () => {
  const { opts, done } = fixtureUp();
  try {
    assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, opts), ["default", FIXTURE.provider]);
  } finally { done(); }
});

test("AC3: effectiveProfileOrder with the provider down returns only default", () => {
  assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, fixtureDown), ["default"]);
});

test("AC1: recommendedModels=false disables the preset", () => {
  const { done } = fixtureUp();
  try {
    const config = { ...DEFAULT_CONFIG, recommendedModels: false };
    assert.deepEqual(effectiveProfileOrder(config, { providerAvailable: () => true }), ["default"]);
  } finally { done(); }
});

test("AC5: custom profileOrder prepends to base", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs(valid('{"profileOrder":["work","default"]}'), {});
    assert.deepEqual(effectiveProfileOrder(cfg, opts), ["work", "default", FIXTURE.provider]);
  } finally { done(); }
});

test("AC5: custom profileOrder no duplicate preset", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs(valid(`{"profileOrder":["work","default","${FIXTURE.provider}"]}`), {});
    assert.deepEqual(effectiveProfileOrder(cfg, opts), ["work", "default", FIXTURE.provider]);
  } finally { done(); }
});

test("AC2: resolveProfileChain returns the preset's ladder with expected route", () => {
  const { opts, done } = fixtureUp();
  try {
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "execute-phase", opts);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].profile, FIXTURE.provider);
    assert.deepEqual(candidates[0].route.model, ["acme/big", "acme/small"]);
    assert.equal(candidates[0].declared.model, true);
    assert.equal(candidates[0].builtIn, true);
  } finally { done(); }
});

test("AC2: resolveProfileChain judgment slot returns the declared thinking", () => {
  const { opts, done } = fixtureUp();
  try {
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "review-change", opts);
    assert.deepEqual(candidates[0].route.model, ["acme/strong", "acme/big"]);
    assert.equal(candidates[0].route.thinking, "high");
  } finally { done(); }
});

test("AC2: resolveProfileChain unknown command returns the preset default route", () => {
  const { opts, done } = fixtureUp();
  try {
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "anything-else", opts);
    assert.equal(candidates[0].profile, FIXTURE.provider);
    assert.deepEqual(candidates[0].route.model, ["acme/big", "acme/small"]);
  } finally { done(); }
});

test("AC3: resolveProfileChain with provider down returns empty array", () => {
  const { done } = fixtureUp();
  try {
    assert.deepEqual(resolveProfileChain(DEFAULT_CONFIG, "execute-phase", fixtureDown), []);
  } finally { done(); }
});

test("AC4: user override wins over the preset profile", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs({}, valid('{"commands":{"execute-phase":{"model":"x/1","thinking":"low"}}}'));
    const candidates = resolveProfileChain(cfg, "execute-phase", opts);
    assert.equal(candidates[0].profile, "default");
    assert.deepEqual(candidates[0].route, { model: "x/1", thinking: "low" });
    assert.equal(candidates[1].profile, FIXTURE.provider);
  } finally { done(); }
});

test("AC4: an explicit command model:'inherit' is a declaration and stops the preset fallback", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs({}, valid('{"commands":{"execute-phase":{"model":"inherit"}}}'));
    const candidates = resolveProfileChain(cfg, "execute-phase", opts);
    assert.equal(candidates[0].profile, "default");
    assert.equal(candidates[0].declared.model, true);
    assert.equal(candidates[0].route.model, "inherit");
    assert.equal(candidates[1].profile, FIXTURE.provider);
  } finally { done(); }
});

test("AC4: an explicit top-level default model:\"inherit\" declares every command", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs(
      {},
      valid('{"default":{"model":"inherit"}}'),
    );
    const candidates = resolveProfileChain(cfg, "anything", opts);
    assert.equal(candidates[0].profile, "default");
    assert.equal(candidates[0].declared.model, true);
  } finally { done(); }
});

test("AC4: an explicit thinking:\"inherit\" is a declaration", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs(
      {},
      valid('{"commands":{"execute-phase":{"thinking":"inherit"}}}'),
    );
    const candidates = resolveProfileChain(cfg, "execute-phase", opts);
    assert.equal(candidates[0].profile, "default");
    assert.equal(candidates[0].declared.thinking, true);
    assert.equal(candidates[0].declared.model, false);
  } finally { done(); }
});

test("AC5/AC6: user profile command wins; other command falls through to the preset", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs(
      valid(
        '{"profileOrder":["work","default"],"profiles":{"work":{"commands":{"execute-phase":{"model":"w/1","thinking":"max"}}}}}',
      ),
      {},
    );
    const execCandidates = resolveProfileChain(cfg, "execute-phase", opts);
    assert.equal(execCandidates[0].profile, "work");
    assert.deepEqual(execCandidates[0].route, { model: "w/1", thinking: "max" });
    const otherCandidates = resolveProfileChain(cfg, "other", opts);
    assert.equal(otherCandidates[0].profile, FIXTURE.provider);
  } finally { done(); }
});

test("AC7: per-key independence — default declares thinking only, the preset declares model", () => {
  const { opts, done } = fixtureUp();
  try {
    const cfg = mergeConfigs(
      {},
      valid('{"commands":{"execute-phase":{"thinking":"max"}}}'),
    );
    const candidates = resolveProfileChain(cfg, "execute-phase", opts);
    // default candidate first, declares thinking only
    assert.equal(candidates[0].profile, "default");
    assert.equal(candidates[0].declared.model, false);
    assert.equal(candidates[0].declared.thinking, true);
    // preset candidate second, declares model
    assert.equal(candidates[1].profile, FIXTURE.provider);
    assert.equal(candidates[1].declared.model, true);
  } finally { done(); }
});

// The docs-parity tests that pinned the built-in profile against the root
// README's NaN guidance moved to the companion package (issue #388): the
// vendor's ladder and its human-facing source of truth are the companion's
// surfaces now.
