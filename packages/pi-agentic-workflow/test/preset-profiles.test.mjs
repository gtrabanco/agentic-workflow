// preset-profiles.test.mjs — the seam's multi-profile contribution (issue #388
// amendment 2).
//
// A companion preset may contribute SEVERAL named profiles (a per-posture
// catalog: e.g. quality / balanced / economy / no-credits-continue-working).
// The chain names each entry `<provider>.<profile>`; `presetProfile` selects
// one or an ordered list (first = most preferred; the profile-fallback policy
// demotes to the next entry when a route fails). A single-profile preset keeps
// today's exact bare-`<provider>` behavior — backward-compatible by shape.

import { test } from "node:test";
import assert from "node:assert/strict";

import { registerProviderPreset, clearProviderPresets, getProviderPresets } from "../dist/config/presets.js";
import { effectiveProfileOrder, resolveProfileChain } from "../dist/config/profiles.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { renderMergedConfig } from "../dist/settings/view.js";

/** A multi-profile fixture: two named profiles with distinct ladders. */
const LADDERS = {
  strong: {
    default: { model: ["acme/flagship", "acme/big"], thinking: "inherit" },
    commands: { "execute-phase": { model: ["acme/flagship"], thinking: "high" } },
  },
  frugal: {
    default: { model: ["acme/small"], thinking: "inherit" },
    commands: { "log-session": { model: ["acme/small"], thinking: "inherit" } },
  },
};

function registerMultiProfile() {
  registerProviderPreset({
    provider: "acme",
    profiles: ["strong", "frugal"],
    defaultProfile: "frugal",
    resolveProfile: ({ profile }) => LADDERS[profile ?? "frugal"],
  });
  return () => clearProviderPresets();
}

const avail = { providerAvailable: (p) => p === "acme" };

test("multi-profile: no presetProfile — the preset contributes its default profile entry", () => {
  const cleanup = registerMultiProfile();
  try {
    assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, avail), ["default", "acme.frugal"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: presetProfile as a string selects that profile", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, presetProfile: "strong" };
    assert.deepEqual(effectiveProfileOrder(config, avail), ["default", "acme.strong"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: presetProfile as an ordered array contributes entries in order", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, presetProfile: ["strong", "frugal"] };
    assert.deepEqual(effectiveProfileOrder(config, avail), ["default", "acme.strong", "acme.frugal"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: unknown profile names are skipped, in order, keeping the known ones", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, presetProfile: ["nope", "frugal", "strong"] };
    assert.deepEqual(effectiveProfileOrder(config, avail), ["default", "acme.frugal", "acme.strong"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: a selection with no known name falls back to the preset's default entry", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, presetProfile: ["nope", "also-nope"] };
    assert.deepEqual(effectiveProfileOrder(config, avail), ["default", "acme.frugal"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: profileOrder naming an entry pins it ahead of the appended selection", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, profileOrder: ["acme.strong"], presetProfile: ["frugal", "strong"] };
    assert.deepEqual(effectiveProfileOrder(config, avail), ["acme.strong", "acme.frugal"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: provider down — none of the profiles enters the chain", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, presetProfile: ["strong", "frugal"] };
    assert.deepEqual(effectiveProfileOrder(config, { providerAvailable: () => false }), ["default"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: the chain resolves the selected profile's ladder, with the profile name passed through", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, presetProfile: ["strong", "frugal"] };
    const candidates = resolveProfileChain(config, "execute-phase", avail);
    assert.equal(candidates[0].profile, "acme.strong");
    assert.equal(candidates[0].builtIn, true);
    assert.deepEqual(candidates[0].route, LADDERS.strong.commands["execute-phase"]);
    // The second entry is reachable: the same profile's own default route.
    assert.equal(candidates[1].profile, "acme.frugal");
    assert.deepEqual(candidates[1].route, LADDERS.frugal.default);
  } finally {
    cleanup();
  }
});

test("multi-profile: a user-defined profile shadows a preset profile by its chain name", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = {
      ...DEFAULT_CONFIG,
      presetProfile: "stronk".replace("k", "g"),
      profiles: { "acme.strong": { default: { model: ["acme/mine"], thinking: "low" }, commands: {} } },
    };
    const candidates = resolveProfileChain(config, "execute-phase", avail);
    assert.equal(candidates[0].profile, "acme.strong");
    assert.equal(candidates[0].builtIn, false, "a user override is not a built-in route");
    assert.deepEqual(candidates[0].route, { model: ["acme/mine"], thinking: "low" });
  } finally {
    cleanup();
  }
});

test("multi-profile: the bare provider name still resolves — to the preset's default profile", () => {
  const cleanup = registerMultiProfile();
  try {
    const config = { ...DEFAULT_CONFIG, profileOrder: ["acme"] };
    assert.deepEqual(effectiveProfileOrder(config, avail), ["acme", "acme.frugal"]);
    const candidates = resolveProfileChain(config, "log-session", avail);
    assert.equal(candidates[0].profile, "acme");
    assert.deepEqual(candidates[0].route, LADDERS.frugal.commands["log-session"]);
  } finally {
    cleanup();
  }
});

test("multi-profile: legacy single-profile presets keep today's bare-name behavior", () => {
  const cleanup = registerMultiProfile();
  registerProviderPreset({
    provider: "legacy",
    resolveProfile: () => ({ default: { model: ["legacy/one"], thinking: "inherit" }, commands: {} }),
  });
  try {
    // A selection naming nothing any catalog carries cannot match — the
    // multi-profile preset falls back to its default entry and the legacy
    // preset contributes its bare entry regardless.
    const config = { ...DEFAULT_CONFIG, presetProfile: ["does-not-exist"] };
    assert.deepEqual(effectiveProfileOrder(config, { providerAvailable: (p) => p === "legacy" || p === "acme" }), [
      "default",
      "acme.frugal",
      "legacy",
    ]);
  } finally {
    cleanup();
  }
});

test("multi-profile: the view hint names the contributed profiles, not just the provider", () => {
  const cleanup = registerMultiProfile();
  try {
    const lines = renderMergedConfig({ config: { ...DEFAULT_CONFIG, recommendedModels: true }, problems: [] }, [], {
      providerAvailable: () => true,
    });
    const hint = lines.find((line) => line.includes("recommended models: on"));
    assert.ok(hint, "the hint line exists");
    assert.ok(hint.includes("acme"), "the provider is named");
    assert.ok(hint.includes("strong") && hint.includes("frugal"), "the catalog is named");
  } finally {
    cleanup();
  }
});

test("multi-profile: getProviderPresets still yields one registration per provider (no profile duplicated keys)", () => {
  const cleanup = registerMultiProfile();
  try {
    assert.equal(getProviderPresets().length, 1);
  } finally {
    cleanup();
  }
});
