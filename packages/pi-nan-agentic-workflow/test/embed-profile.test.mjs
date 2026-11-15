// embed-profile.test.mjs — the NaN doc-index embedding profile (issue #541).
//
// The profile is the pack's data, and the crate is its judge. Three things are
// pinned here: the values (against the recorded catalog snapshot, in
// `catalog-parity.test.mjs`), the registration through the provider-preset seam,
// and the fact that the crate's own schema accepts the profile when the main
// package materializes it — a bad value would be refused there, not shipped.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  clearProviderPresets,
  findProviderPreset,
  getEmbedProfiles,
} from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";
import { applyEmbedProfile, planEmbedProfile } from "@gtrabanco/pi-agentic-workflow/dist/config/embed-profile.js";
import extension from "../dist/extension.js";
import { NAN_EMBED_PROFILE } from "../dist/embed-profile.js";
import { PROVIDER } from "../dist/preset.js";

const readOf = (root) => (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

test("the profile is the provider's block, literal: endpoint, model, key variable, limit and pacing", () => {
  assert.equal(NAN_EMBED_PROFILE.baseUrl, "https://api.nan.builders/v1");
  assert.equal(NAN_EMBED_PROFILE.model, "qwen3-embedding");
  assert.equal(NAN_EMBED_PROFILE.envVar, "NAN_API_KEY");
  assert.equal(NAN_EMBED_PROFILE.chunk_limit, 6000);
  assert.deepEqual(NAN_EMBED_PROFILE.pacing, { batchSize: 6, requestsPerMinute: 60 });
  // No value the crate would have to invent: the two budgets it owns stay unset
  // (the crate's 90,000-char request budget already sits inside the model's
  // 32,768-token window), so the profile carries only what the provider states.
  assert.equal(NAN_EMBED_PROFILE.max_request_chars, undefined);
});

test("the profile's request footprint stays inside the model's input window", () => {
  // The model publishes max_input 32768 tokens (catalog snapshot). At the
  // 4 chars/token assumption the crate's own budget uses, one request is
  // chunk_limit × batchSize characters — 36,000 ≈ 9,000 tokens, a third of the
  // window, so even dense prose cannot outgrow it.
  const requestChars = NAN_EMBED_PROFILE.chunk_limit * NAN_EMBED_PROFILE.pacing.batchSize;
  assert.equal(requestChars, 36000);
  assert.ok(requestChars / 4 < 32768, "one request stays well inside the 32,768-token input window");
  assert.ok(NAN_EMBED_PROFILE.pacing.requestsPerMinute <= 60, "never above the documented per-key cap");
});

test("registration: the extension registers the profile on the preset, and the seam exposes it", () => {
  try {
    extension({});
    assert.equal(findProviderPreset(PROVIDER)?.provider, PROVIDER);
    assert.deepEqual(findProviderPreset(PROVIDER)?.embedProfile, NAN_EMBED_PROFILE);
    const profiles = getEmbedProfiles();
    assert.deepEqual(profiles.map((entry) => entry.provider), [PROVIDER]);
    assert.deepEqual(profiles[0].profile, NAN_EMBED_PROFILE);
  } finally {
    clearProviderPresets();
  }
});

test("the crate's schema accepts the profile: materializing it writes the block verbatim", () => {
  const root = mkdtempSync(join(tmpdir(), "nan-embed-"));
  try {
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    const plan = planEmbedProfile({
      root,
      entry: { provider: PROVIDER, profile: NAN_EMBED_PROFILE },
      readFile: readOf(root),
    });
    let text = null;
    const result = applyEmbedProfile({ root, plan, writeFile: (_path, body) => (text = body) });
    assert.equal(result.wrote, true, "the crate accepted the candidate — a bad value would have refused here");
    assert.deepEqual(JSON.parse(text).provider, NAN_EMBED_PROFILE);
    assert.equal(JSON.parse(text).version, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a value the project already wrote survives the NaN profile's materialization", () => {
  const root = mkdtempSync(join(tmpdir(), "nan-embed-user-"));
  try {
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    const path = join(root, ".agentic-workflow", "index.json");
    const mine = { version: 1, provider: { chunk_limit: 4000, pacing: { batchSize: 4 } } };
    const readFile = () => JSON.stringify(mine);
    const plan = planEmbedProfile({ root, entry: { provider: PROVIDER, profile: NAN_EMBED_PROFILE }, readFile });
    let text = null;
    applyEmbedProfile({ root, plan, writeFile: (_path, body) => (text = body) });
    const written = JSON.parse(text);
    assert.equal(written.provider.chunk_limit, 4000, "the operator's limit wins");
    assert.equal(written.provider.pacing.batchSize, 4, "the operator's batch wins");
    assert.equal(written.provider.model, "qwen3-embedding", "the preset fills what was absent");
    assert.equal(path.endsWith(".agentic-workflow/index.json"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
