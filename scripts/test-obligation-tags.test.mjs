#!/usr/bin/env node

/**
 * test-obligation-tags.test.mjs — the sibling suite of the obligation-tag gate
 * (issue #596, S2/S3/S4).
 *
 * The gate answers one question per root suite: *which surface does this suite
 * protect, and what obligations do its assertions cover there?* The tag is the
 * answer, it lives beside the suite so it cannot rot away from what it
 * describes, and this suite is what makes the declaration checkable rather than
 * aspirational:
 *
 *   shape      one line at the suite head, `protects=` and `obligations=`, both
 *              non-empty and both parsed by the same grammar the live tree runs
 *              through;
 *   vocabulary the obligation values resolve against the published closed set
 *              (`TEST_OBLIGATION_KINDS`), read from committed source;
 *   surface    a protected path that no longer exists refuses the suite, which
 *              is how "the tagged surface disappears ⇒ the test disappears"
 *              becomes detectable without re-deriving it every audit;
 *   sweep      the clusters (one per protected surface) with their decisions and
 *              the declared deterministic suspect rule the selective kill-rate
 *              reads.
 *
 * Every refusal is a fixture: the injected trees are built under a temp root, so
 * the same pure functions the live tree runs through are asserted against a
 * defect rather than against a claim.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  COST_PER_OBLIGATION_LIMIT,
  SUSPECT_LIMIT,
  TAG_PREFIX,
  clusterRows,
  obligationBlockKinds,
  parseCostLog,
  parseTag,
  publishedObligationKinds,
  selectSuspects,
  tagFindings,
} from "./test-obligation-tags.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = path.join(ROOT, "scripts");
const CLI = path.join(SCRIPTS, "test-obligation-tags.mjs");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

/** The runtime that started this suite runs the CLI too — never a second guess. */
const run = (args, options = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", ...options });

/** A throwaway tree with a `scripts/` directory, removed when the case ends. */
function makeTree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tag-tree-"));
  fs.mkdirSync(path.join(root, "scripts"));
  for (const [rel, body] of Object.entries(files)) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  return root;
}

const suiteBody = (tag) => `${tag === null ? "" : `${tag}\n`}// a suite body\n`;

/* ------------------------------------------------------------------ shape */

test("a tag at line 1 (no shebang) and at line 2 (after the shebang) are both legal heads", () => {
  const plain = parseTag(`${TAG_PREFIX}protects=scripts/a.mjs obligations=contract`);
  assert.deepEqual(plain.faults, []);
  assert.deepEqual(plain.protects, ["scripts/a.mjs"]);
  assert.deepEqual(plain.obligations, ["contract"]);

  const kinds = publishedObligationKinds(read("packages/agentic-workflow-schema/src/vocabularies.ts"));
  const root = makeTree({
    "scripts/plain.test.mjs": suiteBody(`${TAG_PREFIX}protects=scripts/plain-missing.mjs obligations=contract`),
    "scripts/sibling.test.mjs": `#!/usr/bin/env node\n${TAG_PREFIX}protects=scripts/sibling-missing.mjs obligations=contract,failure-path\n`,
  });
  try {
    const findings = tagFindings({ root, kinds });
    assert.deepEqual(findings.filter((f) => f.code !== "tag-dead-surface"), [], "both head positions are accepted; only the deliberately absent surfaces refuse");
    assert.equal(findings.filter((f) => f.code === "tag-dead-surface").length, 2, "the absent protected surface is the one refusal each fixture earns");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a tag naming several protected surfaces and several obligations keeps both lists in declaration order", () => {
  const parsed = parseTag(`${TAG_PREFIX}protects=AGENTS.md,scripts/a.mjs obligations=contract,boundary,convention`);
  assert.deepEqual(parsed.faults, []);
  assert.deepEqual(parsed.protects, ["AGENTS.md", "scripts/a.mjs"]);
  assert.deepEqual(parsed.obligations, ["contract", "boundary", "convention"]);
});

test("tag-shape: an empty list, a missing half or an unknown word are refused as shape faults, never guessed", () => {
  for (const [line, fault] of [
    [`${TAG_PREFIX}protects= obligations=contract`, "empty-protects"],
    [`${TAG_PREFIX}protects=scripts/a.mjs obligations=`, "empty-obligations"],
    [`${TAG_PREFIX}protects=scripts/a.mjs`, "missing-obligations"],
    [`${TAG_PREFIX}obligations=contract`, "missing-protects"],
    [`${TAG_PREFIX}protects scripts/a.mjs obligations contract`, "unparsable"],
  ]) {
    const parsed = parseTag(line);
    assert.ok(parsed.faults.includes(fault), `${line} must fault ${fault}, got ${JSON.stringify(parsed.faults)}`);
  }
});

/* ------------------------------------------------------- the three refusals */

test("tag-missing: a suite with no tag at its head is refused by name", () => {
  const root = makeTree({ "scripts/untagged.test.mjs": "#!/usr/bin/env node\n\n// no declaration here\n" });
  try {
    const findings = tagFindings({ root, kinds: ["contract"] });
    assert.deepEqual(findings.map((f) => f.code), ["tag-missing"]);
    assert.match(findings[0].file, /untagged\.test\.mjs$/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("tag-misplaced: a tag below the head is refused — the declaration belongs beside the suite's first line", () => {
  const root = makeTree({
    "scripts/late.test.mjs": `#!/usr/bin/env node\n/** a docblock */\n${TAG_PREFIX}protects=scripts/ok.mjs obligations=contract\n`,
    "scripts/ok.mjs": "export const ok = true;\n",
  });
  try {
    const findings = tagFindings({ root, kinds: ["contract"] });
    assert.deepEqual(findings.map((f) => f.code), ["tag-misplaced"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("tag-unknown-obligation: a value outside the published closed set is refused, and the message names the set", () => {
  const root = makeTree({
    "scripts/a.test.mjs": suiteBody(`${TAG_PREFIX}protects=scripts/a-missing.mjs obligations=contract,nope`),
  });
  try {
    const findings = tagFindings({ root, kinds: ["contract", "failure-path"] });
    const unknown = findings.filter((f) => f.code === "tag-unknown-obligation");
    assert.equal(unknown.length, 1);
    assert.match(unknown[0].detail, /nope/);
    assert.match(unknown[0].detail, /contract \| failure-path/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("tag-dead-surface: a tag whose protected path is gone is refused — the surface is what the suite exists for", () => {
  const root = makeTree({
    "scripts/half.test.mjs": suiteBody(`${TAG_PREFIX}protects=scripts/still-here.mjs,scripts/gone.mjs obligations=contract`),
    "scripts/still-here.mjs": "export const here = true;\n",
  });
  try {
    const findings = tagFindings({ root, kinds: ["contract"] });
    assert.deepEqual(findings.map((f) => f.code), ["tag-dead-surface"]);
    assert.match(findings[0].detail, /scripts\/gone\.mjs/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------- the live tree */

test("the live tree: every root suite carries a tag whose obligations resolve and whose surfaces exist", () => {
  const kinds = publishedObligationKinds(read("packages/agentic-workflow-schema/src/vocabularies.ts"));
  assert.ok(kinds.length >= 6, `the published set is the six the issue lists, got ${kinds.join(", ")}`);
  const files = fs.readdirSync(SCRIPTS).filter((name) => name.endsWith(".test.mjs"));
  assert.ok(files.length >= 100, `the sweep covers the whole root suite set, got ${files.length}`);
  assert.deepEqual(tagFindings({ root: ROOT, kinds }), []);
});

/* ------------------------------------------------------------- the vocabulary */

test("the owner doc's block names every published obligation value, and nothing it does not publish", () => {
  const kinds = publishedObligationKinds(read("packages/agentic-workflow-schema/src/vocabularies.ts"));
  assert.deepEqual(kinds, ["contract", "failure-path", "boundary", "distribution-contract", "fixture-support", "convention"]);
  const named = obligationBlockKinds(read("skills/unit-lane/references/TESTS.md"));
  assert.deepEqual([...named].sort(), [...kinds].sort(), "the block and the const are the same closed set");
});

/* -------------------------------------------------------------------- sweep */

test("clusters: one row per protected surface, and identical obligation sets on a shared surface are the duplicate evidence", () => {
  const entries = [
    { file: "scripts/a.test.mjs", protects: ["scripts/a.mjs"], obligations: ["contract", "failure-path"] },
    { file: "scripts/b.test.mjs", protects: ["scripts/a.mjs"], obligations: ["failure-path", "contract"] },
    { file: "scripts/c.test.mjs", protects: ["scripts/c.mjs"], obligations: ["contract"] },
  ];
  const rows = clusterRows(entries, new Map());
  assert.deepEqual(rows.map((row) => row.surface), ["scripts/a.mjs", "scripts/c.mjs"]);
  const shared = rows.find((row) => row.surface === "scripts/a.mjs");
  assert.equal(shared.suites.length, 2);
  assert.equal(shared.decision, "duplicate", "same surface plus same obligations is the obligation-level duplicate candidate");
  assert.equal(rows.find((row) => row.surface === "scripts/c.mjs").decision, "keep");
});

test("the suspect rule is declared and deterministic: cost per obligation, duplicates always, at most five selected", () => {
  const entries = [
    { file: "scripts/slow.test.mjs", protects: ["scripts/slow.mjs"], obligations: ["contract"] },
    { file: "scripts/fast.test.mjs", protects: ["scripts/fast.mjs"], obligations: ["contract", "failure-path", "boundary", "convention"] },
  ];
  const costs = new Map([["scripts/slow.test.mjs", 30], ["scripts/fast.test.mjs", 1]]);
  const rows = selectSuspects(clusterRows(entries, costs));
  assert.equal(rows.find((row) => row.surface === "scripts/slow.mjs").suspect, true, "30 s for one obligation is over the declared ceiling");
  assert.equal(rows.find((row) => row.surface === "scripts/fast.mjs").suspect, false, "1 s for four obligations is under it");
  assert.equal(COST_PER_OBLIGATION_LIMIT > 0, true);
  assert.equal(SUSPECT_LIMIT, 5, "the sweep is never exhaustive");
});

test("the cost log the root gate already prints is the only cost input: `PASS <file> (N.Ns)` lines", () => {
  const log = [
    "PASS scripts/a.test.mjs (1.5s)",
    "PASS scripts/b.test.mjs (0.2s)",
    "FAIL scripts/c.test.mjs (12.0s)",
    "noise",
  ].join("\n");
  const costs = parseCostLog(log);
  assert.equal(costs.get("scripts/a.test.mjs"), 1.5);
  assert.equal(costs.get("scripts/b.test.mjs"), 0.2);
  assert.equal(costs.size, 2, "a FAIL line is not a cost measurement of a passing suite");
});

/* ---------------------------------------------------------------- the CLI */

test("the CLI: PASS on the live tree, one machine document under --json, and the exit code agrees with the verdict", () => {
  const live = run(["--json"]);
  assert.equal(live.status, 0, live.stderr);
  const document = JSON.parse(live.stdout);
  assert.equal(document.contract, "test-obligation-tags@1");
  assert.equal(document.verdict, "PASS");
  assert.equal(document.findings.length, 0);
  assert.ok(document.suites.length >= 100);

  const fixture = makeTree({ "scripts/untagged.test.mjs": "#!/usr/bin/env node\n" });
  try {
    const refused = run(["--root", fixture, "--json"]);
    assert.equal(refused.status, 1, "a tree with an untagged suite is a failing verdict");
    const refusedDocument = JSON.parse(refused.stdout);
    assert.equal(refusedDocument.verdict, "FAIL");
    assert.equal(refusedDocument.findings[0].code, "tag-missing");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("the CLI: --vocabulary prints the parity tally, --sweep prints the rule, and an unknown flag is a usage error", () => {
  const vocabulary = run(["--vocabulary"]);
  assert.equal(vocabulary.status, 0, vocabulary.stderr);
  assert.match(vocabulary.stdout, /6 of 6/);

  const sweep = run(["--sweep"]);
  assert.equal(sweep.status, 0, sweep.stderr);
  assert.match(sweep.stdout, /selection rule:/);
  assert.match(sweep.stdout, /suspects: \d+/);

  const usage = run(["--nope"]);
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage:/);
});

test("the report is deterministic: two runs of the same tree print the same bytes", () => {
  const first = run(["--json"]);
  const second = run(["--json"]);
  assert.equal(first.stdout, second.stdout);
});
