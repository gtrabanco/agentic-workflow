// catalog-parity.test.mjs — the recorded catalog snapshot cannot drift from
// the code or the prose that restate it (issue #388 amendment 2).
//
// `catalog/nan-catalog-2026-11.jsonc` is the captured NaN tariff/catalog
// record (provenance in its header). The runtime's source of truth stays
// `src/preset.ts`; this suite pins the three against each other so a provider
// change becomes a mechanical walk: update the snapshot, then fix what the
// failures name — the billing tier map, and the README rows that quote it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageRoot = new URL("../", import.meta.url);
const readme = () => readFileSync(new URL("../README.md", import.meta.url), "utf8");

/** Strings-aware JSONC cleaner — comments removed, `//` inside string values
 *  (URLs) untouched, bare object keys quoted (the recorded snapshot carries
 *  `base_url:` style keys verbatim). */
function parseJsoncText(text) {
  let out = "";
  let inString = false;
  let escaped = false;
  let token = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      token += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      token += ch;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      const end = text.indexOf("\n", i);
      i = end === -1 ? text.length : end - 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    token += ch;
  }
  out = token.replace(/(^|[,{\n])(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):/gu, (m, lead, space, key, tail) => `${lead}${space}"${key}"${tail}:`);
  return JSON.parse(out);
}

const catalog = parseJsoncText(readFileSync(new URL("../catalog/nan-catalog-2026-11.jsonc", import.meta.url), "utf8"));

const CHAT_MODELS = catalog.models.filter((m) => m.type === "chat");

/** The tier the snapshot itself implies for a chat model. Free quota absent
 *  and token-cost zero → the unlimited cluster pair; a monthly allowance →
 *  quota; billed from token one → paid. */
function impliedTier(model) {
  if (typeof model.cost === "string") return "paid";
  if (model.free_quota === undefined) return "free";
  return "quota";
}

test("catalog snapshot: every chat model maps onto the preset's billing tier data", async () => {
  const { NAN_MODELS } = await import("../dist/preset.js");
  const slugs = CHAT_MODELS.map((m) => m.slug);
  assert.equal(new Set(slugs).size, slugs.length, "the snapshot names each chat model once");
  for (const model of CHAT_MODELS) {
    assert.equal(
      NAN_MODELS[model.slug],
      impliedTier(model),
      `${model.slug}: the tier map and the snapshot disagree (${NAN_MODELS[model.slug]} vs ${impliedTier(model)})`,
    );
  }
  for (const slug of Object.keys(NAN_MODELS)) {
    assert.ok(slugs.includes(slug), `the tier map names ${slug}, which the snapshot does not carry`);
  }
});

test("catalog snapshot: the README quotes each free allowance and premium gate, humanized", () => {
  const doc = readme();
  const short = (tokens) => {
    if (tokens >= 1_000_000_000) return `${tokens / 1_000_000_000}B`;
    if (tokens >= 1_000_000) return `${tokens / 1_000_000}M`;
    return String(tokens);
  };
  for (const model of CHAT_MODELS) {
    if (impliedTier(model) !== "quota") continue;
    assert.ok(
      doc.includes(`${short(model.free_quota)} free/mo`),
      `the README does not quote ${model.slug}'s ${short(model.free_quota)} monthly allowance`,
    );
  }
  const premium = CHAT_MODELS.find((m) => m.premium_required);
  assert.ok(premium, "the snapshot records the premium-required model");
  assert.ok(doc.includes("premium plan required"), "the README flags the premium gate");
  const rolling = premium.rolling_4h_limit;
  assert.ok(
    doc.includes(`${short(rolling)}/4h`) || doc.includes(`${short(rolling)} per rolling 4`),
    "the README quotes the rolling-4h window",
  );
});

test("catalog snapshot: the README's tariff columns match the recorded credits-per-1M rates", () => {
  const doc = readme();
  const trim = (n) => String(n).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  for (const model of CHAT_MODELS) {
    // free-tier-overflow models carry `credits_when_exceeded`, the paid four carry `rates`.
    const source = model.credits_when_exceeded ?? model.rates;
    if (!source) continue;
    const trio = `${trim(source.input.credits_per_1m)} / ${trim(source.cached.credits_per_1m)} / ${trim(source.output.credits_per_1m)}`;
    assert.ok(doc.includes(trio), `the README's tariff table does not quote ${model.slug}'s "${trio}" columns`);
  }
});

test("catalog snapshot: the README quotes the plan and pack economics", () => {
  const doc = readme();
  const withCommas = (n) => n.toLocaleString("en-US");
  for (const plan of catalog.subscriptions) {
    assert.ok(
      doc.includes(`€${plan.price_eur}`) && doc.includes(`${withCommas(plan.credits_per_month)} credits`),
      `the README does not quote the €${plan.price_eur} → ${withCommas(plan.credits_per_month)} credits plan`,
    );
  }
  for (const pack of catalog.credit_packs) {
    assert.ok(
      doc.includes(`€${pack.price_eur}`),
      `the README does not quote the ${withCommas(pack.amount)}-credit pack at €${pack.price_eur}`,
    );
  }
  assert.ok(doc.includes(String(catalog.rate_limits.requests_per_minute)), "the README quotes the rpm cap");
});

test("catalog snapshot: the file carries its provenance header", () => {
  const raw = readFileSync(new URL("../catalog/nan-catalog-2026-11.jsonc", import.meta.url), "utf8");
  for (const marker of ["PROVENANCE", "https://nan.builders/docs/models", "2026-11-10", "Helmcode S.L."]) {
    assert.ok(raw.includes(marker), `the provenance header is missing "${marker}"`);
  }
});

// ── The doc-index embedding profile (issue #541) ─────────────────────────

test("catalog snapshot: the embedding profile's values are the catalog's facts", async () => {
  const { NAN_EMBED_PROFILE } = await import("../dist/embed-profile.js");
  const embedding = catalog.models.find((model) => model.type === "embedding");
  assert.ok(embedding, "the snapshot records an embedding model");
  assert.equal(NAN_EMBED_PROFILE.model, embedding.slug, "the profile pins the snapshot's embedding slug");
  assert.equal(NAN_EMBED_PROFILE.baseUrl, catalog.base_url, "the profile's endpoint is the snapshot's base_url");
  assert.equal(
    NAN_EMBED_PROFILE.pacing.requestsPerMinute,
    catalog.rate_limits.requests_per_minute,
    "the profile's pace is the snapshot's per-key request cap",
  );
  assert.equal(embedding.cost, 0, "the embedding model bills no credits — the pace is a rate limit, not a spend guard");
  const requestChars = NAN_EMBED_PROFILE.chunk_limit * NAN_EMBED_PROFILE.pacing.batchSize;
  assert.ok(
    requestChars / 4 < embedding.max_input,
    `one request (${requestChars} chars ≈ ${requestChars / 4} tokens) must stay inside max_input ${embedding.max_input}`,
  );
});

test("catalog snapshot: the README documents the embedding profile and its key-global caveat", async () => {
  const { NAN_EMBED_PROFILE } = await import("../dist/embed-profile.js");
  const doc = readme();
  assert.ok(doc.includes("qwen3-embedding"), "the README names the embedding model");
  assert.ok(doc.includes(String(NAN_EMBED_PROFILE.envVar)), "the README names the key variable");
  assert.ok(doc.includes(`${NAN_EMBED_PROFILE.chunk_limit}`), "the README quotes the chunk limit");
  assert.match(doc, /per (API )?key|key-global/iu, "the README states that the 60 rpm cap is key-global");
  assert.match(doc, /shared with|chat traffic/iu, "and that chat traffic shares it");
});

// ── The phase-batching capability record (issue #632) ────────────────────
//
// The record is preset data — the runtime never reads this snapshot — so the
// same walk that pins the tier map and the ladders pins the record: every cell
// is a fact the snapshot states, re-derived here from the recorded fields the
// provider published. The *policy* numbers (how many phases a native harness
// earns) are the preset's declared thresholds and are pinned by
// `phase-batching.test.mjs`; this suite only refuses a record that disagrees
// with the catalog it claims to mirror.

/** The harness the snapshot documents: its own `capabilities[]` distinction. */
function impliedHarness(model) {
  const capabilities = model.capabilities ?? [];
  if (capabilities.includes("Tool calling (XML)")) return "xml";
  if (capabilities.includes("Tool calling")) return "native";
  return "unmeasured";
}

/** The cache posture the snapshot's own rate pair implies — never `flat` by
 *  default: a model that publishes no pair has stated no economics at all. */
function impliedCachePosture(model) {
  const source = model.credits_when_exceeded ?? model.rates;
  const input = source?.input?.credits_per_1m;
  const cached = source?.cached?.credits_per_1m;
  if (typeof input !== "number" || typeof cached !== "number") return "unmeasured";
  return cached < input ? "discounted" : "flat";
}

test("catalog snapshot: the capability record mirrors the context window the snapshot records", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  for (const model of CHAT_MODELS) {
    const capability = NAN_MODEL_CAPABILITIES[model.slug];
    assert.ok(capability, `${model.slug}: the record carries every chat model`);
    assert.equal(
      capability.context_window,
      model.context,
      `${model.slug}: the record's window must be the snapshot's recorded context`,
    );
  }
});

test("catalog snapshot: the capability record mirrors the tool harness the snapshot documents", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  for (const model of CHAT_MODELS) {
    assert.equal(
      NAN_MODEL_CAPABILITIES[model.slug].tool_harness,
      impliedHarness(model),
      `${model.slug}: the snapshot documents ${impliedHarness(model)} tool calling`,
    );
  }
});

test("catalog snapshot: the capability record mirrors the cache posture its rate pair implies", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  for (const model of CHAT_MODELS) {
    assert.equal(
      NAN_MODEL_CAPABILITIES[model.slug].cache_posture,
      impliedCachePosture(model),
      `${model.slug}: the snapshot's cached/input pair implies ${impliedCachePosture(model)}`,
    );
  }
});

test("catalog snapshot: the record names exactly the routed fleet, and no model without a harness batches", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  const { NAN_MODELS } = await import("../dist/preset.js");
  assert.deepEqual(Object.keys(NAN_MODEL_CAPABILITIES).sort(), Object.keys(NAN_MODELS).sort(), "one record per billed model");
  for (const [slug, capability] of Object.entries(NAN_MODEL_CAPABILITIES)) {
    assert.equal(capability.tool_harness === "native", capability.max_phases_per_context > 1, `${slug}: a model without the executor harness batches nothing`);
  }
});

test("catalog snapshot: the declared window thresholds are the fleet's own bounds", async () => {
  const { NAN_PHASE_THRESHOLDS } = await import("../dist/phase-batching.js");
  const contexts = CHAT_MODELS.map((model) => model.context);
  const largest = Math.max(...contexts);
  const smallest = Math.min(...contexts);
  // Re-cut by issue #695: the policy states a *band floor* ("a window of at
  // least one million tokens holds four phases"), so the claim is the rule the
  // constant's own doc states rather than equality with an exact 2^20 maximum
  // the policy never needed.
  assert.equal(NAN_PHASE_THRESHOLDS.smallContextWindow, smallest, "the small floor is the fleet's smallest window");
  assert.equal(
    NAN_PHASE_THRESHOLDS.largeContextWindow,
    Math.floor(largest / 1_000_000) * 1_000_000,
    "the large floor is the fleet's largest window rounded down to a whole million",
  );
  assert.ok(
    NAN_PHASE_THRESHOLDS.largeContextWindow > NAN_PHASE_THRESHOLDS.smallContextWindow,
    "and the two floors are ordered, so no window sits between them by accident",
  );
});
