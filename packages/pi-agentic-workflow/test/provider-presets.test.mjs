// provider-presets.test.mjs — the provider-preset contribution seam (issue #388).
//
// The main package is provider-neutral: vendor ladders arrive at runtime from
// installed companion packages through `registerProviderPreset`. With no preset
// registered, `recommendedModels: true` is a documented no-op (issue #388 AC2).

import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeConfigs } from "../dist/config/merge.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { effectiveProfileOrder, resolveProfileChain } from "../dist/config/profiles.js";
import {
  registerProviderPreset,
  unregisterProviderPreset,
  clearProviderPresets,
  getProviderPresets,
  findProviderPreset,
} from "../dist/config/presets.js";

/** A two-command fixture ladder standing in for a companion's data. */
const FIXTURE_PROFILE = {
  default: { model: ["acme/big", "acme/small"], thinking: "inherit" },
  commands: {
    "review-change": { model: ["acme/strong", "acme/big"], thinking: "high" },
    "log-session": { model: ["acme/small"], thinking: "inherit" },
  },
};

function registerFixture() {
  registerProviderPreset({
    provider: "acme",
    resolveProfile: ({ config }) => {
      // The seam hands the merged config over so a companion can honor
      // generic routing switches (e.g. tierRouting) without the main package
      // knowing about them.
      return config.tierRouting === false
        ? { ...FIXTURE_PROFILE, default: { model: ["acme/small"], thinking: "inherit" } }
        : FIXTURE_PROFILE;
    },
  });
}

export function isolate() {
  return () => clearProviderPresets();
}

test("seam: no preset registered — effectiveProfileOrder is just the base", () => {
  assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, { providerAvailable: () => true }), ["default"]);
});

test("seam: no preset registered — resolveProfileChain is empty (documented no-op)", () => {
  assert.deepEqual(resolveProfileChain(DEFAULT_CONFIG, "review-change", { providerAvailable: () => true }), []);
  assert.deepEqual(resolveProfileChain(DEFAULT_CONFIG, "anything-else", { providerAvailable: () => true }), []);
});

test("seam: a registered preset appends its provider when available and recommendedModels is on", () => {
  registerFixture();
  try {
    const order = effectiveProfileOrder(DEFAULT_CONFIG, { providerAvailable: (p) => p === "acme" });
    assert.deepEqual(order, ["default", "acme"]);
  } finally {
    clearProviderPresets();
  }
});

test("seam: recommendedModels=false disables a registered preset", () => {
  registerFixture();
  try {
    const config = { ...DEFAULT_CONFIG, recommendedModels: false };
    assert.deepEqual(effectiveProfileOrder(config, { providerAvailable: () => true }), ["default"]);
  } finally {
    clearProviderPresets();
  }
});

test("seam: provider down — the registered preset is not appended", () => {
  registerFixture();
  try {
    assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, { providerAvailable: () => false }), ["default"]);
  } finally {
    clearProviderPresets();
  }
});

test("seam: user profileOrder keeps its position — no duplicate", () => {
  registerFixture();
  try {
    const config = mergeConfigs({}, { profileOrder: ["work", "default", "acme"], profiles: {} });
    const order = effectiveProfileOrder(config, { providerAvailable: () => true });
    assert.deepEqual(order, ["work", "default", "acme"]);
  } finally {
    clearProviderPresets();
  }
});

test("seam: resolveProfileChain resolves the registered preset's ladder as built-in", () => {
  registerFixture();
  try {
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "log-session", { providerAvailable: () => true });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].profile, "acme");
    assert.equal(candidates[0].builtIn, true);
    assert.deepEqual(candidates[0].route.model, ["acme/small"]);
    assert.equal(candidates[0].declared.model, true);
    assert.equal(candidates[0].declared.thinking, true);
  } finally {
    clearProviderPresets();
  }
});

test("seam: unknown commands fall through to the preset's default route", () => {
  registerFixture();
  try {
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "not-a-command", { providerAvailable: () => true });
    assert.equal(candidates[0].profile, "acme");
    assert.deepEqual(candidates[0].route.model, ["acme/big", "acme/small"]);
  } finally {
    clearProviderPresets();
  }
});

test("seam: a user override wins over the registered preset", () => {
  registerFixture();
  try {
    const config = mergeConfigs({}, { commands: { "log-session": { model: "x/1", thinking: "low" } }, profiles: {} });
    const candidates = resolveProfileChain(config, "log-session", { providerAvailable: () => true });
    assert.equal(candidates[0].profile, "default");
    assert.deepEqual(candidates[0].route, { model: "x/1", thinking: "low" });
    assert.equal(candidates[1].profile, "acme");
  } finally {
    clearProviderPresets();
  }
});

test("seam: an explicit inherit declaration stops the preset fallback", () => {
  registerFixture();
  try {
    const config = mergeConfigs({}, { commands: { "log-session": { model: "inherit" } }, profiles: {} });
    const candidates = resolveProfileChain(config, "log-session", { providerAvailable: () => true });
    assert.equal(candidates[0].profile, "default");
    assert.equal(candidates[0].route.model, "inherit");
    assert.equal(candidates[1].profile, "acme");
  } finally {
    clearProviderPresets();
  }
});

test("seam: per-key independence — default declares thinking only, preset declares model", () => {
  registerFixture();
  try {
    const config = mergeConfigs({}, { commands: { "log-session": { thinking: "max" } }, profiles: {} });
    const candidates = resolveProfileChain(config, "log-session", { providerAvailable: () => true });
    assert.equal(candidates[0].profile, "default");
    assert.equal(candidates[0].declared.model, false);
    assert.equal(candidates[0].declared.thinking, true);
    assert.equal(candidates[1].profile, "acme");
    assert.equal(candidates[1].declared.model, true);
  } finally {
    clearProviderPresets();
  }
});

test("seam: a user-defined profile with the preset's name is not built-in", () => {
  registerFixture();
  try {
    const config = mergeConfigs({}, { profiles: { acme: { default: { model: "u/1", thinking: "low" } } }, profileOrder: ["acme", "default"] });
    const candidates = resolveProfileChain(config, "log-session", { providerAvailable: () => true });
    assert.equal(candidates[0].profile, "acme");
    assert.equal(candidates[0].builtIn, false);
    assert.deepEqual(candidates[0].route.model, "u/1");
  } finally {
    clearProviderPresets();
  }
});

test("seam: the merged config is handed to the preset's resolver", () => {
  let seen;
  registerProviderPreset({
    provider: "acme",
    resolveProfile: (input) => {
      seen = input.config;
      return FIXTURE_PROFILE;
    },
  });
  try {
    const config = mergeConfigs({}, { tierRouting: false, profiles: {} });
    resolveProfileChain(config, "log-session", { providerAvailable: () => true });
    assert.equal(seen.tierRouting, false);
    assert.equal(seen.recommendedModels, true);
  } finally {
    clearProviderPresets();
  }
});

test("seam: registry read/clear helpers", () => {
  assert.deepEqual(getProviderPresets(), []);
  assert.equal(findProviderPreset("acme"), undefined);
  registerFixture();
  assert.equal(findProviderPreset("acme")?.provider, "acme");
  unregisterProviderPreset("acme");
  assert.deepEqual(getProviderPresets(), []);
});
