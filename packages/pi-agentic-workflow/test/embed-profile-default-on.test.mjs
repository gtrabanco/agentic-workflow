// embed-profile-default-on.test.mjs — issue #719 S1/S4: the NaN embedding
// profile resolves by default.
//
// A pi session that carries the preset and the provider's key variable but no
// `index.json` provider block used to answer keyword-only ("0 embedding tokens
// used") until an operator discovered the preset, materialized it and ran
// `/aw-index`. The resolver below removes that ceremony: at extension load it
// reads the project's real config and, from an **absent** provider block plus a
// present key, exports the three direct env vars the crate already resolves — so
// every spawned runner child inherits the provider without a crate change and
// without rewriting the committed file.
//
// Obligation tag:
//   test-obligation@1 surface=packages/pi-agentic-workflow/src/config/embed-profile #719
//   kinds=behavioral,contract,negative,integration
//   obligations=default-on-injection,withhold-on-explicit-block,withhold-without-key,
//               byte-identity,idempotent-wiring,tuning-parity
//
// Justification lines name the independent obligation each case covers, never
// the implementation under test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  EMBED_DIRECT_ENV,
  EMBED_MAX_REQUEST_CHARS_ENV,
  applyEmbedDefaultOn,
  planEmbedDefaultOn,
} from "../dist/config/embed-profile.js";

/** The NaN profile's shape, as the companion package donates it (issue #541 S3). */
const NAN_PROFILE = {
  baseUrl: "https://api.nan.builders/v1",
  model: "qwen3-embedding",
  envVar: "NAN_API_KEY",
  chunk_limit: 6000,
  pacing: { batchSize: 6, requestsPerMinute: 60 },
};

/** What the preset's measured 6000×6 pair is worth as a request budget. */
const NAN_MAX_REQUEST_CHARS = 36000;

const SCRATCH = [];
function scratch(prefix = "embed-default-on-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  SCRATCH.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of SCRATCH) rmSync(dir, { recursive: true, force: true });
});

/** A project whose `.agentic-workflow/index.json` is exactly `body` (null ⇒ absent). */
function projectWith(body) {
  const root = scratch();
  if (body !== null) {
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    writeFileSync(join(root, ".agentic-workflow", "index.json"), `${JSON.stringify(body, null, 2)}\n`);
  }
  return root;
}

function readFileOrNull(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

const entry = { provider: "nan", profile: NAN_PROFILE };

// ---------------------------------------------------------------------------
// Default-on: the absent-block + present-key case (S1, AC1)
// ---------------------------------------------------------------------------

test("default-on: an absent provider block with the key present exports the profile verbatim", () => {
  const root = projectWith(null);
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, readFile: readFileOrNull });

  assert.equal(plan.inject, true, "the default applies");
  assert.equal(plan.reason, "default-on", "the reason names the branch that decided");
  assert.deepEqual(plan.env, {
    [EMBED_DIRECT_ENV.baseUrl]: NAN_PROFILE.baseUrl,
    [EMBED_DIRECT_ENV.model]: NAN_PROFILE.model,
    [EMBED_DIRECT_ENV.apiKey]: "sk-nan",
    [EMBED_MAX_REQUEST_CHARS_ENV]: String(NAN_MAX_REQUEST_CHARS),
  });
});

test("default-on: an index.json carrying no `provider` key at all is the same absent block", () => {
  const root = projectWith({ version: 1, store: { path: ".agentic-workflow/index/index.db" } });
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, readFile: readFileOrNull });

  assert.equal(plan.inject, true, "a config file without a provider block leaves the provider unset");
  assert.equal(plan.env[EMBED_DIRECT_ENV.model], NAN_PROFILE.model);
});

test("default-on: a `provider: null` block is absent, not a declaration — the default applies", () => {
  const root = projectWith({ version: 1, provider: null });
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, readFile: readFileOrNull });

  assert.equal(plan.inject, true, "null is the shipped keyword-only default, never an operator block");
});

// ---------------------------------------------------------------------------
// Withhold: an explicit block always wins (S4, AC2)
// ---------------------------------------------------------------------------

test("withhold: an explicit provider block injects nothing and comes back as the reason", () => {
  const explicit = { baseUrl: "https://acme.example/v1", model: "acme-embed-1", envVar: "ACME_API_KEY" };
  const root = projectWith({ version: 1, provider: explicit });
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, readFile: readFileOrNull });

  assert.equal(plan.inject, false, "the operator's block is the instruction");
  assert.equal(plan.reason, "explicit-provider-block");
  assert.deepEqual(plan.env, {}, "not one variable is exported");
});

test("withhold: a partial block is still a block — the default never merges into it", () => {
  const root = projectWith({ version: 1, provider: { baseUrl: "https://acme.example/v1" } });
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, readFile: readFileOrNull });

  assert.equal(plan.inject, false, "a half-written block reads as operator intent, not as a gap to fill");
  assert.equal(plan.reason, "explicit-provider-block");
});

test("byte-identity: resolution reads the config and never writes it", () => {
  const root = projectWith({ version: 1, provider: { baseUrl: "https://acme.example/v1" } });
  const path = join(root, ".agentic-workflow", "index.json");
  const before = readFileSync(path);
  applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv: {} });
  const after = readFileSync(path);
  assert.ok(before.equals(after), "the committed file is byte-identical after the resolution ran");
});

test("byte-identity: the default-on path writes no file either", () => {
  const root = projectWith(null);
  const path = join(root, ".agentic-workflow", "index.json");
  applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv: {} });
  assert.equal(readFileOrNull(path), null, "no index.json is created — the write stays opt-in");
});

// ---------------------------------------------------------------------------
// Withhold: no key, nothing changes (S4, AC3)
// ---------------------------------------------------------------------------

test("withhold: without the key variable nothing is injected and the store stays keyword-only", () => {
  const root = projectWith(null);
  const plan = planEmbedDefaultOn({ root, entry, env: {}, readFile: readFileOrNull });

  assert.equal(plan.inject, false);
  assert.equal(plan.reason, "no-provider-key");
  assert.deepEqual(plan.env, {}, "keyword-only behaviour and its degradation are unchanged");
});

test("withhold: an empty key variable is an absent key, never a credential", () => {
  const root = projectWith(null);
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "   " }, readFile: readFileOrNull });

  assert.equal(plan.inject, false);
  assert.equal(plan.reason, "no-provider-key");
});

// ---------------------------------------------------------------------------
// Tuning parity (D3, AC4)
// ---------------------------------------------------------------------------

test("tuning: the default-on path exports the preset's measured pair as the request budget", () => {
  const root = projectWith(null);
  const plan = planEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, readFile: readFileOrNull });

  // 6000-char chunks × 6 texts per request is the pair the preset measured; the
  // crate adopts the request budget as the chunk limit when no explicit
  // `chunk_limit` is configured, so the tuning travels with the budget.
  const budget = Number(plan.env[EMBED_MAX_REQUEST_CHARS_ENV]);
  assert.equal(budget, NAN_PROFILE.chunk_limit * NAN_PROFILE.pacing.batchSize);
  assert.equal(budget, NAN_MAX_REQUEST_CHARS);
});

// ---------------------------------------------------------------------------
// Idempotence and the process seam (S1 wiring contract)
// ---------------------------------------------------------------------------

test("wiring: applying the plan twice writes the same environment and reports the second run as a no-op", () => {
  const root = projectWith(null);
  const processEnv = {};
  const first = applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv });
  const snapshot = { ...processEnv };
  const second = applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv });

  assert.equal(first.applied, true);
  assert.equal(second.applied, false, "a second load in the same process changes nothing");
  assert.deepEqual(processEnv, snapshot);
});

test("wiring: an operator's own exported value is never overwritten", () => {
  const root = projectWith(null);
  // An operator who exports the crate's own variables has already chosen a
  // provider; the default must not displace that choice.
  const processEnv = { [EMBED_DIRECT_ENV.model]: "hand-picked-model" };
  const result = applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv });

  assert.equal(result.applied, false);
  assert.equal(result.plan.reason, "operator-environment");
  assert.equal(processEnv[EMBED_DIRECT_ENV.model], "hand-picked-model");
  assert.equal(processEnv[EMBED_DIRECT_ENV.baseUrl], undefined, "and no half-injection either");
});

test("wiring: a broken index.json is reported, never thrown at the host", () => {
  const root = scratch();
  mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
  writeFileSync(join(root, ".agentic-workflow", "index.json"), "{ not json");
  const processEnv = {};
  const result = applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv });

  assert.equal(result.applied, false);
  assert.equal(result.plan.reason, "unreadable-config", "the loader's own refusal is what an operator needs to see");
  assert.deepEqual(processEnv, {});
});

// ---------------------------------------------------------------------------
// The resolved configuration the crate then sees (AC1's other half)
// ---------------------------------------------------------------------------

test("integration: the exported environment resolves the profile through the crate's own resolver", async () => {
  const { resolveEmbedConfig } = await import("@gtrabanco/agentic-workflow/src/doc/embeddings.mjs");
  const root = projectWith(null);
  const processEnv = {};
  applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan" }, processEnv });

  const resolved = resolveEmbedConfig({ config: {}, env: processEnv });
  assert.deepEqual(resolved, {
    configured: true,
    baseUrl: NAN_PROFILE.baseUrl,
    model: NAN_PROFILE.model,
    apiKey: "sk-nan",
  });
});

test("integration: with an explicit block the crate resolves the block, not the preset", async () => {
  const { resolveEmbedConfig } = await import("@gtrabanco/agentic-workflow/src/doc/embeddings.mjs");
  const explicit = { baseUrl: "https://acme.example/v1", model: "acme-embed-1", envVar: "ACME_API_KEY" };
  const root = projectWith({ version: 1, provider: explicit });
  const processEnv = {};
  applyEmbedDefaultOn({ root, entry, env: { NAN_API_KEY: "sk-nan", ACME_API_KEY: "acme-key" }, processEnv });

  const resolved = resolveEmbedConfig({ config: { provider: explicit }, env: { ...processEnv, ACME_API_KEY: "acme-key" } });
  assert.equal(resolved.model, explicit.model);
  assert.equal(resolved.baseUrl, explicit.baseUrl);
});

test("integration: with no key the crate reports keyword-only", async () => {
  const { resolveEmbedConfig } = await import("@gtrabanco/agentic-workflow/src/doc/embeddings.mjs");
  const root = projectWith(null);
  const processEnv = {};
  applyEmbedDefaultOn({ root, entry, env: {}, processEnv });

  assert.deepEqual(resolveEmbedConfig({ config: {}, env: processEnv }), { configured: false });
});
