// model-facts.test.mjs — the derived capability record (issue #695).
//
// The record the phase-batching policy reads is no longer hand-transcribed: it
// is `src/model-capabilities.generated.ts`, written by
// `scripts/derive-model-facts.mjs` from `@gtrabanco/pi-nan-provider`'s exported
// `NAN_MODEL_FACTS`. This suite owns the derivation's obligations — the cell
// contract, the mapping matrix, the materiality rule that keeps an immaterial
// provider release from lighting four packages, the provenance every cell
// inherits, and the equality between the shipped record and the artifact it
// claims to come from.
//
// The pure half is imported directly so the matrix runs on fixtures and under
// either runtime; the provider itself is only read by the generator's CLI half,
// which needs bun (the provider publishes TypeScript sources).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PHASE_BATCHING_CACHE_POSTURES,
  PHASE_BATCHING_TOOL_HARNESSES,
} from "@gtrabanco/agentic-workflow-schema";

import {
  ARTIFACT_PATH,
  RECORD_CELL_KEYS,
  cachePostureOf,
  deriveModelCapabilities,
  renderArtifact,
  toolHarnessOf,
} from "../scripts/derive-model-facts.mjs";

const PACKAGE_ROOT = new URL("../", import.meta.url);

/** One exported provider row, in the shape the generator passes to the core. */
const providerRow = (over = {}) => ({
  contextWindow: 1_048_576,
  toolCalling: "openai-tools",
  cacheMode: "automatic",
  provenance: { contextWindow: "override", toolCalling: "docs", cacheMode: "model-guide" },
  ...over,
});

/** A routed fleet of two, with every cell stated — the fixture every case
 *  varies one fact of. */
const FLEET = Object.freeze(["alpha", "beta"]);
const FACTS = Object.freeze({
  alpha: providerRow(),
  beta: providerRow({ toolCalling: "xml", cacheMode: "unmeasured", provenance: { contextWindow: "models.dev", toolCalling: "docs", cacheMode: "none" } }),
  gamma: providerRow(), // exported by the provider, not routed by the preset
});
const RATES = Object.freeze({
  alpha: { input: 10.5, cached: 0.21 },
  beta: { input: 7.5, cached: 0.8 },
});

const derive = (over = {}) =>
  deriveModelCapabilities({ facts: FACTS, routedModels: FLEET, creditRates: RATES, pin: "9.9.9", ...over });

const cellsOf = (result) =>
  Object.fromEntries(Object.entries(result.cells).map(([slug, cell]) => [slug, { ...cell, provenance: undefined }]));

// ── The cell contract ────────────────────────────────────────────────────

test("derive: the artifact carries the three cells the policy reads and nothing else", () => {
  const { cells } = derive();
  assert.deepEqual(Object.keys(cells).sort(), [...FLEET].sort(), "one row per routed model, no extra");
  for (const [slug, cell] of Object.entries(cells)) {
    assert.deepEqual(
      Object.keys(cell).sort(),
      ["cache_posture", "context_window", "provenance", "tool_harness"],
      `${slug}: the row is the three cells plus their provenance`,
    );
  }
  assert.deepEqual([...RECORD_CELL_KEYS], ["context_window", "tool_harness", "cache_posture"], "the cell set is the published contract");
});

test("derive: a provider fact this policy never reads changes nothing", () => {
  const lean = derive();
  const verbose = derive({
    facts: { alpha: providerRow({ billingClass: "credit-larger", maxTokensSemantics: "bounds-total", structuredOutput: true }), beta: FACTS.beta },
  });
  assert.deepEqual(cellsOf(verbose), cellsOf(lean), "an unread fact cannot move the record");
  assert.equal(verbose.verdict.status, lean.verdict.status, "and it cannot move the materiality verdict either");
});

// ── The mapping matrix ───────────────────────────────────────────────────

test("map: the provider's tool protocol maps onto the published harness ladder's three tokens", () => {
  assert.equal(toolHarnessOf("openai-tools"), "native");
  assert.equal(toolHarnessOf("xml"), "xml");
  assert.equal(toolHarnessOf("unmeasured"), "unmeasured");
  for (const value of ["openai-tools", "xml", "unmeasured"]) {
    assert.ok(PHASE_BATCHING_TOOL_HARNESSES.includes(toolHarnessOf(value)), `${value} maps onto a published token`);
  }
});

test("map: a tool protocol outside the provider's own union is refused by name, never guessed", () => {
  assert.throws(() => toolHarnessOf("grpc-native"), /grpc-native/u, "an unknown protocol is a defect the generator must see");
});

test("map: cache posture is the engagement fact crossed with this repository's credit pair", () => {
  const cases = [
    ["automatic", { input: 10, cached: 1 }, "discounted", "automatic caching at a lower cached rate saves money"],
    ["automatic", { input: 10, cached: 10 }, "flat", "automatic caching at the same rate saves nothing"],
    ["automatic", { input: 10, cached: 11 }, "flat", "a cached read billed above input is never a discount"],
    ["automatic", undefined, "unmeasured", "no published pair states no economics — never flat by default"],
    ["opt-in", { input: 10, cached: 1 }, "flat", "the executor path sends no cache key, so an opt-in cache never engages"],
    ["unsupported", { input: 10, cached: 1 }, "flat", "no cache at all means a prefix re-read costs the input rate"],
    ["unmeasured", { input: 10, cached: 1 }, "unmeasured", "an unmeasured engagement fact is a gap, not a saving"],
  ];
  for (const [mode, pair, expected, why] of cases) {
    assert.equal(cachePostureOf(mode, pair), expected, `${mode} + ${JSON.stringify(pair)}: ${why}`);
    assert.ok(PHASE_BATCHING_CACHE_POSTURES.includes(expected), `${expected} is a published posture`);
  }
  assert.throws(() => cachePostureOf("sometimes", undefined), /sometimes/u, "an unknown cache mode is refused by name");
});

test("derive: a cell the provider states as unmeasured arrives as the explicit token", () => {
  const { cells } = derive();
  assert.equal(cells.beta.tool_harness, "xml", "a stated harness is carried");
  assert.equal(cells.beta.cache_posture, "unmeasured", "an unmeasured cache mode is the token, never null and never flat");
  assert.notEqual(cells.beta.cache_posture, null, "null is not a value the policy can read");
});

// ── Provenance ───────────────────────────────────────────────────────────

test("derive: every cell inherits the provider's source id for the fact it came from", () => {
  const { cells } = derive();
  assert.deepEqual(cells.alpha.provenance, {
    context_window: "override",
    tool_harness: "docs",
    cache_posture: "model-guide",
  });
  assert.deepEqual(cells.beta.provenance, {
    context_window: "models.dev",
    tool_harness: "docs",
    cache_posture: "none",
  });
});

test("render: the artifact opens with the provenance block the vendored-data rule requires", () => {
  const text = renderArtifact({ pin: "1.6.1", cells: derive().cells });
  assert.match(text, /^\/\/ PROVENANCE$/mu, "the block is a fixed marker, not prose a reader has to find");
  for (const requirement of ["Source:", "Author:", "License:", "Version:"]) {
    assert.ok(text.includes(requirement), `the provenance block names ${requirement}`);
  }
  assert.ok(text.includes("@gtrabanco/pi-nan-provider"), "the provider package is named");
  assert.ok(text.includes("1.6.1"), "the exact version copied is named");
  assert.ok(text.includes("catalog/nan-catalog-2026-11.jsonc"), "the credit tariff the posture comparison reads is named");
  assert.ok(text.includes("GENERATED"), "the file announces that it is written, not edited");
});

// ── Materiality ──────────────────────────────────────────────────────────

test("materiality: the same cells and the same pin are identical", () => {
  const first = derive();
  const again = derive({
    pin: "9.9.9",
    recorded: first.cells,
    recordedPin: "9.9.9",
  });
  assert.equal(again.verdict.status, "identical");
  assert.equal(again.pin, "9.9.9");
});

test("materiality: a newer provider release with byte-identical cells lights nothing and keeps the pin", () => {
  const recorded = derive().cells;
  const newer = derive({ pin: "9.9.10", recorded, recordedPin: "9.9.9" });
  assert.equal(newer.verdict.status, "immaterial", "an immaterial release must not move four packages");
  assert.equal(newer.pin, "9.9.9", "the pin names the release that first asserted these facts");
  assert.deepEqual(newer.cells, recorded, "and the bytes it would write are the bytes already recorded");
});

test("materiality: a new model the preset does not route, or a dropped one, lights nothing", () => {
  const recorded = derive().cells;
  const grown = derive({ facts: { ...FACTS, delta: providerRow({ toolCalling: "xml" }) }, recorded, recordedPin: "9.9.9" });
  assert.equal(grown.verdict.status, "identical", "an unrouted model is not a record row");
  const shrunk = derive({ facts: { alpha: FACTS.alpha, beta: FACTS.beta }, recorded, recordedPin: "9.9.9" });
  assert.equal(shrunk.verdict.status, "identical", "dropping a model this preset never routed is immaterial");
});

test("materiality: a routed model the provider stops exporting is a hole, never a silent shrink", () => {
  const recorded = derive().cells;
  const shrunk = derive({ facts: { alpha: FACTS.alpha }, recorded, recordedPin: "9.9.9" });
  assert.equal(shrunk.verdict.status, "unexported");
  assert.deepEqual(shrunk.verdict.unexported, ["beta"], "the generator names the slug it cannot record");
});

test("materiality: a credit-rate move that does not cross the discount comparison lights nothing", () => {
  const recorded = derive().cells;
  const cheaper = derive({ creditRates: { ...RATES, alpha: { input: 10.5, cached: 0.19 } }, recorded, recordedPin: "9.9.9" });
  assert.equal(cheaper.verdict.status, "identical", "a price move inside the same posture is not a decision change");
  const crossed = derive({ creditRates: { ...RATES, alpha: { input: 10.5, cached: 10.5 } }, recorded, recordedPin: "9.9.9" });
  assert.equal(crossed.verdict.status, "material", "a crossing price move changes what a re-read costs");
  assert.deepEqual(crossed.verdict.changes, ["alpha.cache_posture: discounted → flat"]);
});

test("materiality: a moved cell is named, and the pin advances with it", () => {
  const recorded = derive().cells;
  const moved = derive({
    facts: { ...FACTS, alpha: providerRow({ contextWindow: 262_144 }) },
    recorded,
    recordedPin: "9.9.9",
    pin: "9.9.10",
  });
  assert.equal(moved.verdict.status, "material");
  assert.ok(moved.verdict.changes.includes("alpha.context_window: 1048576 → 262144"), "the change is named as old → new");
  assert.equal(moved.cells.alpha.context_window, 262_144, "the fresh derivation is what a write records");
  assert.equal(moved.pin, "9.9.10", "the pin moves with the facts it describes");
});

test("materiality: a first cut records the whole fleet and reports it as material", () => {
  const first = derive({ recorded: undefined, recordedPin: undefined });
  assert.equal(first.verdict.status, "material");
  assert.deepEqual(Object.keys(first.cells).sort(), [...FLEET].sort());
});

// ── Determinism ──────────────────────────────────────────────────────────

test("render: two derivations of the same facts produce byte-identical text", () => {
  const one = renderArtifact({ pin: "1.6.1", cells: derive().cells });
  const two = renderArtifact({ pin: "1.6.1", cells: derive({ facts: { ...FACTS } }).cells });
  assert.equal(one, two, "no timestamp, no ordering accident: the artifact is a function of the facts");
  assert.ok(one.endsWith("\n"), "the file ends with one newline");
});

// ── The shipped record ───────────────────────────────────────────────────

test("record: the shipped capability record is the generated artifact, cell for cell", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  const { MODEL_CAPABILITY_FACTS } = await import("../dist/model-capabilities.generated.js");
  const { NAN_MODELS } = await import("../dist/preset.js");
  assert.deepEqual(Object.keys(NAN_MODEL_CAPABILITIES).sort(), Object.keys(NAN_MODELS).sort(), "one record per routed model");
  assert.deepEqual(Object.keys(MODEL_CAPABILITY_FACTS).sort(), Object.keys(NAN_MODELS).sort(), "and the artifact carries the same fleet");
  for (const [slug, facts] of Object.entries(MODEL_CAPABILITY_FACTS)) {
    const capability = NAN_MODEL_CAPABILITIES[slug];
    assert.equal(capability.context_window, facts.context_window, `${slug}: the record's window is the artifact's`);
    assert.equal(capability.tool_harness, facts.tool_harness, `${slug}: the record's harness is the artifact's`);
    assert.equal(capability.cache_posture, facts.cache_posture, `${slug}: the record's posture is the artifact's`);
  }
});

test("record: the tool-harness residue closes by fact — the four paid entries carry the provider's harness", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  for (const slug of ["kimi-k3.1-pro", "qwen3.8-max", "deepseek-v4-pro", "hy4"]) {
    assert.equal(
      NAN_MODEL_CAPABILITIES[slug].tool_harness,
      "native",
      `${slug}: the provider documents OpenAI tools, so the record stops saying "not documented"`,
    );
    assert.ok(NAN_MODEL_CAPABILITIES[slug].max_phases_per_context > 1, `${slug}: and the executor harness earns more than one phase`);
  }
  for (const slug of ["qwen3.6", "gemma4", "qwen3.8-flash"]) {
    assert.equal(NAN_MODEL_CAPABILITIES[slug].tool_harness, "xml", `${slug}: the XML-only trio stays XML`);
  }
});

test("record: the artifact names the pin it was derived from, beside the cells", async () => {
  const { MODEL_CAPABILITY_PROVENANCE } = await import("../dist/model-capabilities.generated.js");
  assert.equal(MODEL_CAPABILITY_PROVENANCE.package, "@gtrabanco/pi-nan-provider");
  assert.match(MODEL_CAPABILITY_PROVENANCE.version, /^\d+\.\d+\.\d+$/u, "an exact version, so a parity check can pin it");
  assert.match(MODEL_CAPABILITY_PROVENANCE.license, /\w/u, "the license name is recorded");
  assert.match(MODEL_CAPABILITY_PROVENANCE.author, /\w/u, "the author is recorded");
  assert.match(MODEL_CAPABILITY_PROVENANCE.source, /https?:\/\//u, "the upstream source class carries its URL");
  assert.equal(ARTIFACT_PATH, "src/model-capabilities.generated.ts", "the artifact lives where the runtime compiles it");
});

// ── The prose the artifact serves ────────────────────────────────────────

test("docs: the README's capability table quotes the shipped record", async () => {
  const { NAN_MODEL_CAPABILITIES } = await import("../dist/phase-batching.js");
  const doc = readFileSync(new URL("README.md", PACKAGE_ROOT), "utf8");
  const window = (tokens) => (tokens >= 1_000_000 ? "1M" : `${Math.round(tokens / 1000)}K`);
  const harness = { native: "OpenAI `tools`", xml: "XML", unmeasured: "not documented" };
  for (const [slug, capability] of Object.entries(NAN_MODEL_CAPABILITIES)) {
    const row = new RegExp(`^\\| \\*\\*${slug.replace(/[.]/gu, "\\.")}\\*\\* \\|.*$`, "mu").exec(doc);
    assert.ok(row, `the README's capability table has no row for ${slug}`);
    const cells = row[0].split(" | ").map((cell) => cell.replace(/^\||\|$/gu, "").trim());
    assert.equal(cells[1], window(capability.context_window), `${slug}: window cell`);
    assert.equal(cells[2], harness[capability.tool_harness], `${slug}: harness cell`);
    assert.equal(cells[3], capability.cache_posture === "unmeasured" ? "not measured" : capability.cache_posture, `${slug}: posture cell`);
    assert.equal(cells[4], String(capability.max_phases_per_context), `${slug}: phases cell`);
  }
});
