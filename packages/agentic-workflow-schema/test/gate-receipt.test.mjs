/**
 * gate-receipt.test.mjs — the `gate-receipt@1` contract (issue #409, unit
 * docs/features/108-machine-gate-receipts/).
 *
 * The corpus was observed RED before `src/gate-receipt.ts` existed. The contract
 * it pins:
 *
 *  - **One closed document.** Contract id, version and the convenience `schema`
 *    token; an unknown key anywhere is refused.
 *  - **Validity is the content manifest.** `manifest.entries` is the declared
 *    closure (`{path, sha256}`) and `manifest.digest` is the canonical digest of
 *    those entries; the HEAD sha lives under `provenance` and is never a
 *    validity test (S12/S13).
 *  - **Bounded by construction.** ≤64 checks, ≤8 fragments of ≤240 chars each,
 *    ≤4096 manifest entries and a whole-receipt byte budget (S2).
 *  - **Verdicts are consistent.** `pass` means every check passed, `fail` means
 *    at least one failed, `degraded` names at least one declared degradation and
 *    never passes (S11).
 *  - **The JSON Schema and the validator agree.** Everything the validator
 *    accepts validates under strict Ajv; the malformed matrix is refused by both.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import Ajv from "ajv";

import {
  GATE_CHECK_STATUSES,
  GATE_MANIFEST_PATTERNS,
  GATE_RECEIPT_CONTRACT_ID,
  GATE_RECEIPT_FRESHNESS_CODES,
  GATE_RECEIPT_LIMITS,
  GATE_RECEIPT_SCHEMA,
  GATE_RECEIPT_VERSION,
  GATE_RECEIPT_VERDICTS,
  compareGateReceiptToCurrent,
  digestGateManifest,
  digestGateReceipt,
  validateGateReceipt,
} from "../dist/index.js";

const packageRoot = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(readFileSync(`${packageRoot}/gate-receipt.schema.json`, "utf8"));
const ajv = new Ajv({ strict: true });
const schemaValidates = ajv.compile(schema);

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const HEAD = "0123456789abcdef0123456789abcdef01234567";
const GENERATED_AT = "2026-11-09T12:00:00Z";

/** The canonical vector: a green two-check run over a two-entry manifest. */
const CANONICAL = {
  contract: GATE_RECEIPT_CONTRACT_ID,
  version: GATE_RECEIPT_VERSION,
  schema: GATE_RECEIPT_SCHEMA,
  verdict: "pass",
  degraded: [],
  provenance: {
    head_sha: HEAD,
    generated_at: GENERATED_AT,
    gate_command: ["bun", "scripts/local-gate.mjs", "--skip-network"],
  },
  manifest: {
    digest: digestGateManifest([
      { path: "bun.lock", sha256: SHA_A },
      { path: "scripts/local-gate.mjs", sha256: SHA_B },
    ]),
    entries: [
      { path: "bun.lock", sha256: SHA_A },
      { path: "scripts/local-gate.mjs", sha256: SHA_B },
    ],
  },
  gate: { exit_code: 0, duration_ms: 12_000, log_ref: ".agentic-workflow/gate/gate-receipt.log" },
  checks: [
    { id: "workspace-install", status: "passed", exit_code: 0, duration_ms: 4_000, fragments: [] },
    { id: "root-suite", status: "passed", exit_code: 0, duration_ms: 8_000, fragments: [] },
  ],
};

/** A deep clone so one case can mutate without touching another. */
const clone = (value) => JSON.parse(JSON.stringify(value));

test("gate-receipt: the canonical vector validates and is the fixed key set", () => {
  const result = validateGateReceipt(CANONICAL);
  assert.deepEqual(result, { ok: true, receipt: CANONICAL });
  assert.deepEqual(Object.keys(result.receipt).sort(), [
    "checks", "contract", "degraded", "gate", "manifest", "provenance", "schema", "verdict", "version",
  ]);
});

test("gate-receipt: the canonical vector validates under strict Ajv", () => {
  assert.equal(schemaValidates(CANONICAL), true, ajv.errorsText(schemaValidates.errors));
});

test("gate-receipt: contract id, version and schema token agree", () => {
  assert.equal(GATE_RECEIPT_CONTRACT_ID, "agentic-workflow/gate-receipt");
  assert.equal(GATE_RECEIPT_VERSION, 1);
  assert.equal(GATE_RECEIPT_SCHEMA, "gate-receipt@1");
});

test("gate-receipt: the closed vocabularies are exactly the published sets", () => {
  assert.deepEqual([...GATE_RECEIPT_VERDICTS], ["pass", "fail", "degraded"]);
  assert.deepEqual([...GATE_CHECK_STATUSES], ["passed", "failed", "skipped"]);
  assert.deepEqual([...GATE_RECEIPT_FRESHNESS_CODES], ["current", "missing", "invalid", "stale-manifest"]);
});

test("gate-receipt: an unknown top-level key is refused (core is closed)", () => {
  const bad = { ...clone(CANONICAL), metadata: {} };
  const result = validateGateReceipt(bad);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /unknown key metadata/u);
  assert.equal(schemaValidates(bad), false);
});

test("gate-receipt: an unknown key inside a check, the manifest and the provenance is refused", () => {
  for (const mutate of [
    (doc) => { doc.checks[0].stdout = "raw"; },
    (doc) => { doc.manifest.entries[0].mode = "100644"; },
    (doc) => { doc.provenance.branch = "main"; },
    (doc) => { doc.gate.env = {}; },
  ]) {
    const bad = clone(CANONICAL);
    mutate(bad);
    const result = validateGateReceipt(bad);
    assert.equal(result.ok, false);
    assert.equal(schemaValidates(bad), false);
  }
});

test("gate-receipt: a non-object is refused with one named error", () => {
  assert.deepEqual(validateGateReceipt("gate-receipt@1"), { ok: false, errors: ["gate receipt is not a JSON object"] });
});

test("gate-receipt: a pass with a failed or skipped check is refused, and a fail with no red is refused", () => {
  const failedButPass = clone(CANONICAL);
  failedButPass.checks[1].status = "failed";
  assert.equal(validateGateReceipt(failedButPass).ok, false);
  assert.equal(schemaValidates(failedButPass), false);

  const skippedButPass = clone(CANONICAL);
  skippedButPass.checks[1].status = "skipped";
  assert.equal(validateGateReceipt(skippedButPass).ok, false);

  const failNoRed = clone(CANONICAL);
  failNoRed.verdict = "fail";
  assert.equal(validateGateReceipt(failNoRed).ok, false);
});

test("gate-receipt: degraded requires a declared degradation and never passes", () => {
  const degraded = clone(CANONICAL);
  degraded.verdict = "degraded";
  degraded.degraded = ["unrecognized-gate-output"];
  degraded.checks = [];
  assert.equal(validateGateReceipt(degraded).ok, true);
  assert.equal(schemaValidates(degraded), true);

  const silent = clone(degraded);
  silent.degraded = [];
  assert.equal(validateGateReceipt(silent).ok, false);

  const passWithNote = clone(CANONICAL);
  passWithNote.degraded = ["gate-step-skipped"];
  assert.equal(validateGateReceipt(passWithNote).ok, false);
});

test("gate-receipt: the manifest digest must match its own entries", () => {
  const bad = clone(CANONICAL);
  bad.manifest.digest = "f".repeat(64);
  const result = validateGateReceipt(bad);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /manifest digest/u);
});

test("gate-receipt: manifest entries are path-ordered, unique and relative", () => {
  const unsorted = clone(CANONICAL);
  unsorted.manifest.entries = [...unsorted.manifest.entries].reverse();
  unsorted.manifest.digest = digestGateManifest(unsorted.manifest.entries);
  assert.equal(validateGateReceipt(unsorted).ok, false);

  const duplicate = clone(CANONICAL);
  duplicate.manifest.entries = [duplicate.manifest.entries[0], duplicate.manifest.entries[0]];
  duplicate.manifest.digest = digestGateManifest(duplicate.manifest.entries);
  assert.equal(validateGateReceipt(duplicate).ok, false);

  for (const path of ["../escape", "/etc/passwd", "a/../../b"]) {
    const bad = clone(CANONICAL);
    bad.manifest.entries = [...bad.manifest.entries, { path, sha256: SHA_A }].sort((left, right) => left.path.localeCompare(right.path));
    bad.manifest.digest = digestGateManifest(bad.manifest.entries);
    assert.equal(validateGateReceipt(bad).ok, false, path);
  }
});

test("gate-receipt: the declared limits refuse an over-wide document", () => {
  const tooManyChecks = clone(CANONICAL);
  tooManyChecks.checks = Array.from({ length: GATE_RECEIPT_LIMITS.checks + 1 }, (_, index) => ({
    id: `check-${index}`,
    status: "passed",
    exit_code: 0,
    duration_ms: 1,
    fragments: [],
  }));
  assert.equal(validateGateReceipt(tooManyChecks).ok, false);
  assert.equal(schemaValidates(tooManyChecks), false);

  const tooManyFragments = clone(CANONICAL);
  tooManyFragments.checks[0].status = "failed";
  tooManyFragments.verdict = "fail";
  tooManyFragments.checks[0].fragments = Array.from({ length: GATE_RECEIPT_LIMITS.fragments + 1 }, () => "not ok 1 - case");
  assert.equal(validateGateReceipt(tooManyFragments).ok, false);

  const oversizedFragment = clone(CANONICAL);
  oversizedFragment.checks[0].status = "failed";
  oversizedFragment.verdict = "fail";
  oversizedFragment.checks[0].fragments = ["x".repeat(GATE_RECEIPT_LIMITS.fragmentChars + 1)];
  assert.equal(validateGateReceipt(oversizedFragment).ok, false);
});

test("gate-receipt: the whole document is bounded by a declared byte budget", () => {
  const wide = clone(CANONICAL);
  wide.checks[0].status = "failed";
  wide.verdict = "fail";
  wide.checks[0].fragments = Array.from({ length: GATE_RECEIPT_LIMITS.fragments }, () => "x".repeat(GATE_RECEIPT_LIMITS.fragmentChars));
  wide.checks = Array.from({ length: 40 }, (_, index) => ({ ...wide.checks[0], id: `check-${index}` }));
  const result = validateGateReceipt(wide);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /byte budget/u);
});

test("gate-receipt: the digest is canonical — order-insensitive at the input and stable across runs", () => {
  const forward = digestGateManifest([
    { path: "bun.lock", sha256: SHA_A },
    { path: "scripts/local-gate.mjs", sha256: SHA_B },
  ]);
  const reverse = digestGateManifest([
    { path: "scripts/local-gate.mjs", sha256: SHA_B },
    { path: "bun.lock", sha256: SHA_A },
  ]);
  assert.equal(forward, reverse);
  assert.match(forward, /^[0-9a-f]{64}$/u);
  assert.equal(digestGateManifest([]), digestGateManifest([]));
  assert.notEqual(digestGateManifest([{ path: "bun.lock", sha256: SHA_A }]), forward);
});

test("gate-receipt: the receipt digest covers the whole document", async () => {
  const first = await digestGateReceipt(CANONICAL);
  const second = await digestGateReceipt({ ...CANONICAL, verdict: "pass", degraded: [] });
  assert.equal(first, second);
  const changed = await digestGateReceipt({ ...CANONICAL, gate: { ...CANONICAL.gate, duration_ms: 13_000 } });
  assert.notEqual(first, changed);
});

test("gate-receipt: freshness is the manifest, never the HEAD sha", async () => {
  const entries = [
    { path: "bun.lock", sha256: SHA_A },
    { path: "scripts/local-gate.mjs", sha256: SHA_B },
  ];
  assert.deepEqual(await compareGateReceiptToCurrent(CANONICAL, entries), { fresh: true });

  // An unrelated commit (provenance moves, bytes do not) keeps the receipt current.
  const laterHead = { ...CANONICAL, provenance: { ...CANONICAL.provenance, head_sha: "f".repeat(40) } };
  assert.deepEqual(await compareGateReceiptToCurrent(laterHead, entries), { fresh: true });

  // One signed byte changes: stale, and the changed path is named.
  const changed = [{ path: "bun.lock", sha256: SHA_B }, { path: "scripts/local-gate.mjs", sha256: SHA_B }];
  assert.deepEqual(await compareGateReceiptToCurrent(CANONICAL, changed), {
    fresh: false,
    reasonCode: "stale-manifest",
    changedPaths: ["bun.lock"],
  });
});

test("gate-receipt: freshness refuses an invalid receipt without throwing", async () => {
  assert.deepEqual(await compareGateReceiptToCurrent({ contract: "nope" }, []), {
    fresh: false,
    reasonCode: "invalid",
    changedPaths: [],
  });
});

test("gate-receipt: the declared manifest closure names the gate's inputs and excludes build output", () => {
  const patterns = [...GATE_MANIFEST_PATTERNS];
  for (const required of ["bun.lock", "package.json", "scripts/**", "skills/**", "docs/**", "packages/*/src/**", "packages/*/test/**"]) {
    assert.ok(patterns.includes(required), `closure names ${required}`);
  }
  for (const pattern of patterns) {
    assert.doesNotMatch(pattern, /(^|\/)(dist|node_modules)(\/|$)/u, `closure never signs build output: ${pattern}`);
  }
});

test("gate-receipt: the schema and the validator agree on the malformed matrix", () => {
  const matrix = [
    { ...clone(CANONICAL), version: 2 },
    { ...clone(CANONICAL), schema: "gate-receipt@2" },
    { ...clone(CANONICAL), verdict: "green" },
    { ...clone(CANONICAL), degraded: ["Unrecognized"] },
    (() => { const doc = clone(CANONICAL); doc.checks[0].id = "Not A Slug"; return doc; })(),
    (() => { const doc = clone(CANONICAL); doc.checks[0].fragments = [""]; doc.checks[0].status = "failed"; doc.verdict = "fail"; return doc; })(),
    (() => { const doc = clone(CANONICAL); doc.provenance.head_sha = "not-a-sha"; return doc; })(),
    (() => { const doc = clone(CANONICAL); doc.gate.exit_code = "0"; return doc; })(),
  ];
  for (const [index, doc] of matrix.entries()) {
    const result = validateGateReceipt(doc);
    assert.equal(result.ok, false, `validator refuses matrix row ${index}`);
    assert.equal(schemaValidates(doc), false, `schema refuses matrix row ${index}`);
  }
});

test("gate-receipt: the receipt validator never returns the submitted reference", () => {
  const submitted = clone(CANONICAL);
  const result = validateGateReceipt(submitted);
  assert.equal(result.ok, true);
  assert.notEqual(result.receipt, submitted);
  submitted.checks[0].id = "mutated-after-validation";
  assert.equal(result.receipt.checks[0].id, "workspace-install");
});
