// embed-profile.test.mjs — the provider preset's doc-index embedding profile
// (issue #541 S2, S4, S7, S9).
//
// The seam carries the profile as data; this suite owns the *materialization*:
// the per-key precedence plan (a value the project wrote always wins), the
// validation the crate owns, the write, and the origin report an operator reads.
// The fixture provider is deliberately fake — the main package must not know a
// vendor's name (S5).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { clearProviderPresets, getEmbedProfiles, registerProviderPreset } from "../dist/config/presets.js";
import {
  EMBED_PROFILE_ORIGINS,
  applyEmbedProfile,
  planEmbedProfile,
  renderEmbedProfileReport,
} from "../dist/config/embed-profile.js";

const PROVIDER = "acme";
const FIXTURE_PROFILE = {
  baseUrl: "https://acme.example/v1",
  model: "acme-embed-1",
  envVar: "ACME_API_KEY",
  chunk_limit: 6000,
  pacing: { batchSize: 6, requestsPerMinute: 60 },
};

const entry = { provider: PROVIDER, profile: FIXTURE_PROFILE };

/** A throwaway repo root carrying an optional `index.json` body text. */
function rootWith(text) {
  const root = mkdtempSync(join(tmpdir(), "embed-profile-"));
  mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
  if (text !== undefined) writeFileSync(join(root, ".agentic-workflow", "index.json"), text);
  return root;
}

const configOf = (root) => join(root, ".agentic-workflow", "index.json");
const readOf = (root) => (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

/** The plan for one body text, against the fixture preset. */
function planFor(text) {
  const root = rootWith(text);
  try {
    return planEmbedProfile({ root, entry, readFile: readOf(root) });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const rowOf = (plan, key) => plan.rows.find((row) => row.key === key);

test("seam: getEmbedProfiles lists the presets that carry a profile and skips the rest", () => {
  try {
    registerProviderPreset({ provider: "plain", resolveProfile: () => ({ default: { model: "x/1", thinking: "inherit" } }) });
    registerProviderPreset({ provider: PROVIDER, embedProfile: FIXTURE_PROFILE, resolveProfile: () => ({ default: { model: "x/1", thinking: "inherit" } }) });
    const profiles = getEmbedProfiles();
    assert.deepEqual(profiles.map((p) => p.provider), [PROVIDER]);
    assert.deepEqual(profiles[0].profile, FIXTURE_PROFILE);
  } finally {
    clearProviderPresets();
  }
});

test("seam: a preset whose profile the crate would refuse is refused at registration, not at write time", () => {
  for (const [label, profile] of [
    ["chunk_limit", { ...FIXTURE_PROFILE, chunk_limit: 0 }],
    ["pacing", { ...FIXTURE_PROFILE, pacing: { batchSize: 0 } }],
    ["baseUrl", { ...FIXTURE_PROFILE, baseUrl: "" }],
  ]) {
    assert.throws(
      () => registerProviderPreset({ provider: "broken", embedProfile: profile, resolveProfile: () => ({ default: { model: "x/1", thinking: "inherit" } }) }),
      /acme|chunk_limit|pacing|baseUrl/u,
      `a bad ${label} in a preset must not register silently`,
    );
  }
  assert.deepEqual(getEmbedProfiles(), [], "nothing half-registered survives the refusal");
  clearProviderPresets();
});

test("plan: an absent index.json makes every preset key a default the write would fill", () => {
  const plan = planFor(undefined);
  assert.equal(plan.present, false);
  assert.equal(plan.path.endsWith(".agentic-workflow/index.json"), true);
  const keys = plan.rows.map((row) => row.key);
  assert.deepEqual(keys, [
    "provider.baseUrl",
    "provider.model",
    "provider.envVar",
    "provider.chunk_limit",
    "provider.pacing.batchSize",
    "provider.pacing.requestsPerMinute",
  ]);
  for (const row of plan.rows) {
    assert.equal(row.origin, "default", `${row.key} came from no file`);
    assert.equal(row.willWrite, true, `${row.key} is filled`);
  }
  assert.equal(rowOf(plan, "provider.model").presetValue, "acme-embed-1");
  assert.deepEqual(plan.fills, keys);
  assert.deepEqual(plan.next, FIXTURE_PROFILE);
});

test("precedence: a user-written provider value wins over the preset, per key", () => {
  const plan = planFor(
    JSON.stringify({
      version: 1,
      provider: { baseUrl: "https://mine.example/v1", model: "mine-embed", envVar: "MY_KEY", chunk_limit: 4000 },
    }),
  );
  for (const key of ["provider.baseUrl", "provider.model", "provider.envVar", "provider.chunk_limit"]) {
    assert.equal(rowOf(plan, key).origin, "user", `${key} is the operator's`);
    assert.equal(rowOf(plan, key).willWrite, false, `${key} is never rewritten`);
  }
  assert.equal(rowOf(plan, "provider.model").inForce, "mine-embed");
  assert.equal(rowOf(plan, "provider.model").presetValue, "acme-embed-1", "the preset's value stays visible");
  // the absent ones are still filled, from the preset
  assert.deepEqual(plan.fills, ["provider.pacing.batchSize", "provider.pacing.requestsPerMinute"]);
  assert.deepEqual(plan.next, {
    baseUrl: "https://mine.example/v1",
    model: "mine-embed",
    envVar: "MY_KEY",
    chunk_limit: 4000,
    pacing: { batchSize: 6, requestsPerMinute: 60 },
  });
});

test("precedence: a value the operator wrote and the preset agrees with is reported as the preset's and never rewritten", () => {
  const plan = planFor(JSON.stringify({ version: 1, provider: { model: "acme-embed-1" } }));
  const row = rowOf(plan, "provider.model");
  assert.equal(row.origin, "preset", "the value in force is the preset's");
  assert.equal(row.willWrite, false, "nothing to fill");
  assert.equal(row.inForce, "acme-embed-1");
});

test("precedence: pacing precedence is per knob, not per block", () => {
  const plan = planFor(JSON.stringify({ version: 1, provider: { pacing: { batchSize: 4 } } }));
  assert.equal(rowOf(plan, "provider.pacing.batchSize").origin, "user");
  assert.equal(rowOf(plan, "provider.pacing.batchSize").inForce, "4");
  assert.equal(rowOf(plan, "provider.pacing.requestsPerMinute").origin, "default");
  assert.deepEqual(plan.next.pacing, { batchSize: 4, requestsPerMinute: 60 });
});

test("plan: a key the operator wrote that the preset does not declare is reported as theirs, never dropped", () => {
  const plan = planFor(JSON.stringify({ version: 1, provider: { max_request_chars: 40000, pacing: { maxAttempts: 5 } } }));
  assert.equal(rowOf(plan, "provider.max_request_chars").origin, "user");
  assert.equal(rowOf(plan, "provider.max_request_chars").presetValue, null);
  assert.equal(rowOf(plan, "provider.pacing.maxAttempts").origin, "user");
  assert.deepEqual(plan.next, { ...FIXTURE_PROFILE, max_request_chars: 40000, pacing: { batchSize: 6, requestsPerMinute: 60, maxAttempts: 5 } });
});

test("write: the profile lands in .agentic-workflow/index.json, 2-space JSON with a trailing newline, other keys untouched", () => {
  const root = rootWith(JSON.stringify({ version: 1, store: { path: ".agentic-workflow/custom/store.sqlite" }, index: { excludes: null } }, null, 2));
  try {
    const readFile = readOf(root);
    const written = [];
    const plan = planEmbedProfile({ root, entry, readFile });
    const result = applyEmbedProfile({ root, plan, writeFile: (path, text) => written.push({ path, text }) });
    assert.equal(result.wrote, true);
    assert.equal(written.length, 1);
    assert.equal(written[0].path, configOf(root));
    assert.equal(written[0].text.endsWith("\n"), true);
    const parsed = JSON.parse(written[0].text);
    assert.deepEqual(parsed.provider, FIXTURE_PROFILE);
    assert.deepEqual(parsed.store, { path: ".agentic-workflow/custom/store.sqlite" }, "an unrelated block is preserved");
    assert.equal(parsed.index.excludes, null);
    assert.equal(written[0].text.includes('\n  "provider"'), true, "2-space indentation");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("write: a brand-new file states its config version", () => {
  const root = rootWith(undefined);
  try {
    const plan = planEmbedProfile({ root, entry, readFile: readOf(root) });
    let text = null;
    applyEmbedProfile({ root, plan, writeFile: (_path, body) => (text = body) });
    assert.equal(JSON.parse(text).version, 1, "the committed contract's version, never an absent one");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("write: a second run writes nothing — materialization is idempotent", () => {
  const root = rootWith(undefined);
  try {
    let writes = 0;
    const writeFile = (_path, text) => {
      writes += 1;
      writeFileSync(configOf(root), text);
    };
    const first = planEmbedProfile({ root, entry, readFile: readOf(root) });
    applyEmbedProfile({ root, plan: first, writeFile });
    const second = planEmbedProfile({ root, entry, readFile: readOf(root) });
    const again = applyEmbedProfile({ root, plan: second, writeFile });
    assert.equal(writes, 1, "the second run's plan has nothing to fill");
    assert.equal(again.wrote, false);
    assert.equal(second.present, true);
    assert.deepEqual(second.fills, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refusal: an unparseable index.json is named as such and nothing is written", () => {
  const root = rootWith('{"version": 1, "provider": {');
  try {
    assert.throws(
      () => planEmbedProfile({ root, entry, readFile: readOf(root) }),
      (error) => error.name === "EmbedProfileRefusal" && error.reason === "invalid-index-config" && /index\.json/u.test(error.message),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refusal: a candidate the crate refuses is refused by name, and the file is left untouched", () => {
  // A hand-edited value the crate rejects — the write must not launder it into
  // a file the loader can no longer read.
  const root = rootWith(JSON.stringify({ version: 1, provider: { pacing: { requestsPerMinute: 0 } } }));
  try {
    const plan = planEmbedProfile({ root, entry, readFile: readOf(root) });
    let writes = 0;
    assert.throws(
      () => applyEmbedProfile({ root, plan, writeFile: () => (writes += 1) }),
      (error) =>
        error.name === "EmbedProfileRefusal" &&
        error.reason === "invalid-profile" &&
        /provider\.pacing\.requestsPerMinute/u.test(error.message),
    );
    assert.equal(writes, 0, "nothing reached the file");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refusal: an invalid preset profile is refused with the crate's own message, never passed through", () => {
  for (const [label, profile] of [
    ["chunk_limit", { ...FIXTURE_PROFILE, chunk_limit: 0 }],
    ["pacing", { ...FIXTURE_PROFILE, pacing: { batchSize: 0 } }],
  ]) {
    const root = rootWith(undefined);
    try {
      const plan = planEmbedProfile({ root, entry: { provider: PROVIDER, profile }, readFile: readOf(root) });
      let writes = 0;
      assert.throws(
        () => applyEmbedProfile({ root, plan, writeFile: () => (writes += 1) }),
        (error) => error.reason === "invalid-profile" && /chunk_limit|pacing/u.test(error.message),
        `a bad preset ${label} must be refused`,
      );
      assert.equal(writes, 0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("report: every key is named with the value in force and where it came from", () => {
  const plan = planFor(JSON.stringify({ version: 1, provider: { model: "mine-embed", pacing: { batchSize: 4 } } }));
  const text = renderEmbedProfileReport(plan).join("\n");
  assert.match(text, /acme/u, "the provider is named");
  assert.match(text, /provider\.model = mine-embed · user \(preset: acme-embed-1\)/u);
  assert.match(text, /provider\.baseUrl = \(none — keyword-only\) · default \(preset: https:\/\/acme\.example\/v1\)/u);
  assert.match(text, /provider\.pacing\.batchSize = 4 · user/u);
  assert.match(text, /4 key\(s\) to fill from the preset · 2 kept as written/u);
  assert.deepEqual([...EMBED_PROFILE_ORIGINS], ["preset", "user", "default"]);
});

test("report: a fully materialized index reads as the preset's, with nothing to fill", () => {
  const plan = planFor(JSON.stringify({ version: 1, provider: FIXTURE_PROFILE }));
  const text = renderEmbedProfileReport(plan).join("\n");
  assert.match(text, /nothing to fill/u);
  assert.doesNotMatch(text, /default/u, "every value is either the preset's or the operator's");
});

test("refusal: a provider block that is not an object is refused where the reason is visible", () => {
  for (const bad of ["acme", true, [1, 2]]) {
    const root = rootWith(JSON.stringify({ version: 1, provider: bad }));
    try {
      assert.throws(
        () => planEmbedProfile({ root, entry, readFile: readOf(root) }),
        (error) =>
          error.name === "EmbedProfileRefusal" &&
          error.reason === "invalid-index-config" &&
          /provider block that is not an object/u.test(error.message),
        `accepted provider=${JSON.stringify(bad)}`,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("refusal: the operator's smaller request budget wins — the fill is refused instead of writing an impossible limit", () => {
  // The project lowered max_request_chars below the preset's chunk_limit. No
  // value may be rewritten (precedence), so the only honest answer is the
  // crate's own refusal naming both keys — never a silently invalid file.
  const root = rootWith(JSON.stringify({ version: 1, provider: { max_request_chars: 4000 } }));
  try {
    const plan = planEmbedProfile({ root, entry, readFile: readOf(root) });
    assert.equal(plan.fills.includes("provider.chunk_limit"), true, "the preset's limit is what would be filled");
    let writes = 0;
    assert.throws(
      () => applyEmbedProfile({ root, plan, writeFile: () => (writes += 1) }),
      (error) =>
        error.reason === "invalid-profile" &&
        /chunk_limit/u.test(error.message) &&
        /max_request_chars/u.test(error.message),
    );
    assert.equal(writes, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
