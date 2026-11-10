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
