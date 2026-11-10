// registration.test.mjs — the companion registers its preset into the main
// package's seam (issue #388 AC3): installing the companion restores model
// routing without user config changes.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  registerProviderPreset,
  clearProviderPresets,
  findProviderPreset,
} from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";
import {
  effectiveProfileOrder,
  resolveProfileChain,
} from "@gtrabanco/pi-agentic-workflow/dist/config/profiles.js";
import { mergeConfigs } from "@gtrabanco/pi-agentic-workflow/dist/config/merge.js";
import { DEFAULT_CONFIG } from "@gtrabanco/pi-agentic-workflow/dist/config/defaults.js";
import extension from "../dist/extension.js";
import { PROVIDER, PUBLISHED_LADDER } from "../dist/preset.js";

test("extension: importing and invoking the extension registers the preset", () => {
  try {
    extension({});
    const preset = findProviderPreset(PROVIDER);
    assert.ok(preset, "the preset is registered");
    assert.equal(preset.provider, PROVIDER);
  } finally {
    clearProviderPresets();
  }
});

test("seam sharing: the registry the companion fills is the registry the main package reads", () => {
  // Same module instance across the package boundary (the workspace resolves
  // the peer from its folder), so a registration made through the companion's
  // import is visible through the main package's own import.
  try {
    extension({});
    assert.equal(findProviderPreset(PROVIDER)?.provider, PROVIDER);
  } finally {
    clearProviderPresets();
  }
});

test("AC3: with the preset registered, routing resolves without any user config change", () => {
  try {
    extension({});
    const available = (p) => p === PROVIDER;
    assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, { providerAvailable: available }), ["default", PROVIDER]);
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "log-session", { providerAvailable: available });
    assert.equal(candidates[0].profile, PROVIDER);
    assert.equal(candidates[0].builtIn, true);
    // tier routing on by default (amendment 1): unlimited-first for low-stakes work
    assert.equal(candidates[0].route.model[0], `${PROVIDER}/qwen3.6`);
  } finally {
    clearProviderPresets();
  }
});

test("tierRouting:false in the merged config restores the published ladder through the seam", () => {
  try {
    extension({});
    const config = mergeConfigs({ tierRouting: false }, {});
    const candidates = resolveProfileChain(config, "log-session", { providerAvailable: () => true });
    assert.deepEqual(candidates[0].route, PUBLISHED_LADDER.commands["log-session"]);
  } finally {
    clearProviderPresets();
  }
});
