#!/usr/bin/env node
// test-obligation: protects=scripts/decision-promotion.mjs obligations=contract,failure-path,fixture-support

/**
 * decision-promotion.test.mjs — the promotion sweep's sibling suite (issue #650
 * S3/S4/S6/S7).
 *
 * Pins the deterministic half of the `Decision promotion` audit dimension:
 *
 *   1. the receipt's contract id and its closed finding-code set
 *   2. the one finding per unpromoted cross-unit decision, and none for a
 *      `unit-only` one
 *   3. the owner-doc citation: a cited path that exists is a promotion, a cited
 *      path that does not exist is `owner-doc-missing`
 *   4. the legacy row — a decision captured before the rule landed carries no
 *      scope cell and is counted, never refused
 *   5. the lookalike tail — a legacy row whose last cell merely looks like a
 *      scope token keeps it inside `discarded`
 *   6. the refusal — a ledger carrying an `open-questions@1` block with a
 *      malformed row is fatal; a ledger with no block is skipped, not refused
 *   7. the calibration pair — one finding per class on `seeded/`, none on `clean/`
 *   8. read-only — the tree's bytes are identical after a run, and two runs of
 *      the same tree render the same bytes
 *   9. the prose the dimension ships — the audit row and its pass-only-if
 *      section, the lane's `decision-scope@1` block, the scaffold's procedure,
 *      the three registrations that keep the grammar resolvable, and the
 *      schema's published const
 *
 * Run: `bun test scripts/decision-promotion.test.mjs`
 * (fallback `node --test scripts/decision-promotion.test.mjs`).
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MODULE_REL = "scripts/decision-promotion.mjs";
const FIXTURE_REL = "scripts/product-audit-promotion-fixture.mjs";
const RECEIPT = "decision-promotion@1";
const RULE_SINCE = "2026-11-19";

/** The producer, loaded lazily so the whole suite is red on the missing module. */
async function producer() {
  return import("./decision-promotion.mjs");
}

const TMP_DIRS = [];
process.on("exit", () => {
  for (const dir of TMP_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

const scaffold = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aw-decision-promotion-"));
  TMP_DIRS.push(dir);
  return dir;
};

/**
 * A unit folder with one `decisions.md` carrying the block plus the rows given.
 * `rows` are full ledger rows, so a case can be as hostile as it needs.
 */
function unit(root, slug, rows) {
  const dir = path.join(root, "docs", "features", slug);
  fs.mkdirSync(dir, { recursive: true });
  const ledger = [
    `# Decisions — ${slug}`,
    "",
    "```text",
    "open-questions@1",
    "id | date | type | question | blocks | search-receipt | options | route",
    "Q1 | 2026-11-20 | open-question | which owner doc carries it | nothing proceeds | `rg -n x docs/` → 0 hits | A — the guide \\| B — the architecture doc | design",
    ...rows,
    "```",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, "decisions.md"), ledger);
  return dir;
}

const decision = (id, date, tail, { scope } = {}) =>
  `D${id} | ${date} | decision | Q1 | human-owner | chat paste, 2026-11-20 | ${tail.chosen} | ${tail.discarded}${scope === undefined ? "" : ` | ${scope}`}`;

const emptyTree = () => {
  const dir = scaffold();
  fs.mkdirSync(path.join(dir, "docs", "features"), { recursive: true });
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Guide\n");
  fs.mkdirSync(path.join(dir, "docs", "architecture"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "architecture", "ARCHITECTURE.md"), "# Architecture\n");
  fs.writeFileSync(path.join(dir, "docs", "architecture", "ARCHITECTURAL_INVARIANTS.md"), "# Invariants\n");
  return dir;
};

/** Every file's digest under a tree, so "read-only" is a comparison, not a claim. */
function digestTree(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(`${path.relative(root, abs)}:${createHash("sha256").update(fs.readFileSync(abs)).digest("hex")}`);
    }
  };
  walk(root);
  return out;
}

test("the receipt declares its contract and a closed finding-code set", async () => {
  const { RECEIPT: declared, FINDING_CODES, OWNER_DOCS } = await producer();
  assert.equal(declared, RECEIPT);
  assert.deepEqual([...FINDING_CODES].sort(), ["owner-doc-missing", "scope-unrecorded", "unpromoted-decision"]);
  assert.deepEqual([...OWNER_DOCS].sort(), [
    "AGENTS.md",
    "docs/architecture/ARCHITECTURE.md",
    "docs/architecture/ARCHITECTURAL_INVARIANTS.md",
  ]);
});

test("a cross-unit decision with no owner doc is one finding", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "700-gap", [decision(1, "2026-11-20", { chosen: "the rule", discarded: "the alternative" }, { scope: "cross-unit" })]);
  const result = buildPromotion(root, { since: RULE_SINCE });
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, "unpromoted-decision");
  assert.equal(result.findings[0].unit, "docs/features/700-gap");
  assert.equal(result.verdict, "findings 1");
});

test("a cross-unit decision naming an owner doc is a promotion, not a finding", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "701-promoted", [
    decision(1, "2026-11-20", { chosen: "the rule, promoted to `AGENTS.md`", discarded: "nothing" }, { scope: "cross-unit" }),
  ]);
  const result = buildPromotion(root, { since: RULE_SINCE });
  assert.deepEqual(result.findings, []);
  assert.equal(result.verdict, "clean");
  const promoted = result.rows.find((row) => row.status === "promoted");
  assert.equal(promoted.ownerDoc, "AGENTS.md");
});

test("a unit-only decision is never a finding", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "702-unit", [decision(1, "2026-11-20", { chosen: "local only", discarded: "nothing" }, { scope: "unit-only" })]);
  const result = buildPromotion(root, { since: RULE_SINCE });
  assert.deepEqual(result.findings, []);
  assert.equal(result.rows[0].status, "unit-only");
});

test("a cited owner doc that does not exist is owner-doc-missing", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "703-gone", [
    decision(1, "2026-11-20", { chosen: "the rule, promoted to `docs/architecture/GONE.md`", discarded: "nothing" }, { scope: "cross-unit" }),
  ]);
  const result = buildPromotion(root, { since: RULE_SINCE });
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, "owner-doc-missing");
  assert.match(result.findings[0].detail, /docs\/architecture\/GONE\.md/);
});

test("a legacy decision row is counted and never refused", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "704-legacy", [decision(1, "2026-01-05", { chosen: "old rule", discarded: "old alternative" })]);
  const result = buildPromotion(root, { since: RULE_SINCE });
  assert.deepEqual(result.findings, []);
  assert.equal(result.rows[0].status, "legacy");
  assert.equal(result.rows[0].scope, null);
});

test("a legacy row whose tail looks like a scope token keeps it in discarded", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "705-lookalike", [decision(1, "2026-01-05", { chosen: "old rule", discarded: "the alternative" }, { scope: "cross-unit" })]);
  const result = buildPromotion(root, { since: "2027-01-01" });
  assert.deepEqual(result.findings, []);
  assert.equal(result.rows[0].scope, "cross-unit");
});

test("a decision captured after the rule landed with no scope cell is scope-unrecorded", async () => {
  const { buildPromotion } = await producer();
  const root = emptyTree();
  unit(root, "706-new-noscope", [decision(1, "2026-12-01", { chosen: "new rule", discarded: "the alternative" })]);
  const result = buildPromotion(root, { since: RULE_SINCE });
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].code, "scope-unrecorded");
});

test("a malformed ledger carrying the block is refused, one without the block is skipped", async () => {
  const { buildPromotion, DecisionPromotionRefusal } = await producer();
  const root = emptyTree();
  const broken = unit(root, "707-broken", ["D1 | not-a-date | decision | Q1 | human-owner | x | y | z | unit-only"]);
  fs.writeFileSync(
    path.join(broken, "decisions.md"),
    ["```text", "open-questions@1", "id | date | type | question | blocks | search-receipt | options | route", "D1 | nope", "```", ""].join("\n"),
  );
  assert.throws(() => buildPromotion(root, { since: RULE_SINCE }), (error) => {
    assert.ok(error instanceof DecisionPromotionRefusal);
    assert.match(error.message, /707-broken/);
    return true;
  });

  const clean = emptyTree();
  fs.mkdirSync(path.join(clean, "docs", "features", "708-records"), { recursive: true });
  fs.writeFileSync(
    path.join(clean, "docs", "features", "708-records", "decisions.md"),
    ["```text", "path-protection-records@1", "kind | paths | phase | date | authority | justification", "```", ""].join("\n"),
  );
  assert.deepEqual(buildPromotion(clean, { since: RULE_SINCE }).findings, []);
});

test("the calibration pair: one finding per class on seeded, none on clean", async () => {
  const { buildPromotion } = await producer();
  const dir = scaffold();
  const fixture = spawnSync(process.execPath, [path.join(ROOT, FIXTURE_REL), dir], { encoding: "utf8" });
  assert.equal(fixture.status, 0, fixture.stderr);

  const seeded = buildPromotion(path.join(dir, "seeded"), { since: fixture.stdout.trim().split("\n").find((line) => line.startsWith("since"))?.split("·").pop().trim() });
  const codes = seeded.findings.map((row) => row.code).sort();
  assert.deepEqual(codes, ["owner-doc-missing", "scope-unrecorded", "unpromoted-decision"]);

  const clean = buildPromotion(path.join(dir, "clean"), { since: RULE_SINCE });
  assert.deepEqual(clean.findings, []);
  assert.equal(clean.verdict, "clean");
});

test("the producer is read-only and deterministic", async () => {
  const { buildPromotion, renderReceipt } = await producer();
  const root = emptyTree();
  unit(root, "709-run", [decision(1, "2026-11-20", { chosen: "the rule", discarded: "nothing" }, { scope: "cross-unit" })]);
  const before = digestTree(root);
  const first = renderReceipt(buildPromotion(root, { since: RULE_SINCE }));
  const second = renderReceipt(buildPromotion(root, { since: RULE_SINCE }));
  assert.deepEqual(digestTree(root), before, "the sweep mutated the tree");
  assert.equal(first, second, "two runs of one tree rendered different bytes");
  assert.match(first, new RegExp(`^${RECEIPT}\\n`));
  assert.match(first, /^verdict \| findings 1$/m);
});

test("the CLI exits 0 on a clean tree and refuses a bad argument", () => {
  const root = emptyTree();
  unit(root, "710-cli", [decision(1, "2026-11-20", { chosen: "x, promoted to `AGENTS.md`", discarded: "y" }, { scope: "cross-unit" })]);
  const clean = spawnSync(process.execPath, [path.join(ROOT, MODULE_REL), "--root", root], { encoding: "utf8" });
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /^verdict \| clean$/m);

  const bad = spawnSync(process.execPath, [path.join(ROOT, MODULE_REL), "--nope"], { encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /usage/);
});

test("the schema publishes the scope vocabulary as a closed const", () => {
  const source = fs.readFileSync(path.join(ROOT, "packages/agentic-workflow-schema/src/vocabularies.ts"), "utf8");
  assert.match(source, /export const DECISION_SCOPES = Object\.freeze\(\[[\s\S]*?"unit-only"[\s\S]*?"cross-unit"[\s\S]*?\] as const\)/);
  const published = fs.readFileSync(path.join(ROOT, "packages/agentic-workflow-schema/src/index.ts"), "utf8");
  assert.match(published, /\bDECISION_SCOPES\b/);
});

test("the prose the dimension ships is where its pass-only-if says it is", () => {
  const dimensions = fs.readFileSync(path.join(ROOT, "skills/product-audit/references/AUDIT_DIMENSIONS.md"), "utf8");
  assert.match(dimensions, /^\| \*\*Decision promotion\*\* \|/m);
  assert.match(dimensions, /decision-promotion@1/);
  assert.match(dimensions, /## Decision-promotion sweep/);

  const design = fs.readFileSync(path.join(ROOT, "skills/unit-lane/references/DESIGN.md"), "utf8");
  assert.match(design, /^decision-scope@1$/m);
  assert.match(design, /ARCHITECTURE\.md/);

  const architecture = fs.readFileSync(path.join(ROOT, "template/docs/architecture/ARCHITECTURE.md"), "utf8");
  assert.match(architecture, /## Promoting a decision/);
  assert.match(architecture, /unit-only/);
  assert.match(architecture, /cross-unit/);

  const guide = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
  const markers = [...guide.matchAll(/^\| ([a-z0-9-]+) \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$/gm)].map((m) => m[1]);
  for (const surface of ["decision-scope-grammar", "decision-scope-vocabulary", "decision-promotion-grammar"]) {
    assert.ok(markers.includes(surface), `${surface} is not registered in normative-surfaces@1`);
  }
  assert.match(guide, /restates:decision-scope@1:decision-scope/);
});
