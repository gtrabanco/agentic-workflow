// registration.test.mjs — the companion registers its preset into the main
// package's seam (issue #388 AC3), now carrying its named profile catalog
// (amendment 2): installing the companion restores model routing without user
// config changes — under the default `economy` posture when nothing is
// selected, and under the selected posture when `presetProfile` names one.

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
import { PROVIDER, DEFAULT_PROFILE, PROFILE_LADDERS, resolvePresetProfile } from "../dist/preset.js";

const defaultEntry = `${PROVIDER}.${DEFAULT_PROFILE}`;

test("extension: importing and invoking the extension registers the preset with its profile catalog", () => {
  try {
    extension({});
    const preset = findProviderPreset(PROVIDER);
    assert.ok(preset, "the preset is registered");
    assert.equal(preset.provider, PROVIDER);
    assert.deepEqual([...preset.profiles], ["quality", "balanced", "economy", "no-credits-continue-working"]);
    assert.equal(preset.defaultProfile, DEFAULT_PROFILE);
  } finally {
    clearProviderPresets();
  }
});

test("seam sharing: the registry the companion fills is the registry the main package reads", () => {
  try {
    extension({});
    assert.equal(findProviderPreset(PROVIDER)?.provider, PROVIDER);
  } finally {
    clearProviderPresets();
  }
});

test("AC3: with the preset registered, routing resolves without any user config change — economy by default", () => {
  try {
    extension({});
    const available = (p) => p === PROVIDER;
    assert.deepEqual(effectiveProfileOrder(DEFAULT_CONFIG, { providerAvailable: available }), ["default", defaultEntry]);
    const candidates = resolveProfileChain(DEFAULT_CONFIG, "log-session", { providerAvailable: available });
    assert.equal(candidates[0].profile, defaultEntry);
    assert.equal(candidates[0].builtIn, true);
    // tier routing on by default: the mechanical pass rides the zero-credit chain
    assert.equal(candidates[0].route.model[0], `${PROVIDER}/qwen3.6`);
  } finally {
    clearProviderPresets();
  }
});

test("presetProfile selection travels through the merged config to the preset's resolver", () => {
  try {
    extension({});
    const available = (p) => p === PROVIDER;
    const config = mergeConfigs({ presetProfile: ["quality", "economy"] }, {});
    assert.deepEqual(effectiveProfileOrder(config, { providerAvailable: available }), [
      "default",
      "nan.quality",
      defaultEntry,
    ]);
    const candidates = resolveProfileChain(config, "audit-pr", { providerAvailable: available });
    assert.equal(candidates[0].profile, "nan.quality");
    assert.deepEqual(candidates[0].route, PROFILE_LADDERS.quality.commands["audit-pr"]);
    // the fallback entry is right behind it, under the same provider
    assert.equal(candidates[1].profile, defaultEntry);
    assert.deepEqual(candidates[1].route, resolvePresetProfile({ tierRouting: true }).commands["audit-pr"]);
  } finally {
    clearProviderPresets();
  }
});

test("tierRouting:false in the merged config restores the selected profile's published ladder through the seam", () => {
  try {
    extension({});
    const config = mergeConfigs({ tierRouting: false, presetProfile: "balanced" }, {});
    const candidates = resolveProfileChain(config, "execute-phase", { providerAvailable: () => true });
    assert.deepEqual(candidates[0].route, PROFILE_LADDERS.balanced.commands["execute-phase"]);
  } finally {
    clearProviderPresets();
  }
});
