#!/usr/bin/env node
// test-obligation: protects=skills/audit-docs/references/RESTATEMENT.md,AGENTS.md obligations=convention,failure-path

/**
 * restatement-sweep.test.mjs — the durable detector for the restatement class
 * (issue #646 A6/S3b).
 *
 * The class regrows: TESTS.md restated the red-first mechanism twice *inside one
 * file*, one copy silently dropping the E-lines requirement, and no sweep owned
 * it — audits 1 and 2 missed every finding of the unit that filed this issue.
 * `scripts/residue-dimensions.test.mjs` refuses only the rule names it is seeded
 * with, and `scripts/normative-drift.test.mjs` reads versioned grammars, not
 * prose; the corpus in `skills/audit-docs/references/RESTATEMENT.md` is the seed
 * set the gap needs.
 *
 * The corpus below is built from the pre-fix bytes (`8fc204abb`), so the fixtures
 * reproduce the real defects before the sweep exists: a docs page restating the
 * one-PR rule without its owner (B1's lost inline-batch exception), the TESTS.md
 * intra-file duplicate (D1), and a reference asserting "never restated" while a
 * sibling restates the rule it claims to cite (TEST_IMPACT's false claim).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { CORPUS_MARKER, FINDING_CODES, corpusRows, sweep } from "./restatement-sweep.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "restatement-sweep.mjs");
const CORPUS_FILE = "skills/audit-docs/references/RESTATEMENT.md";

/** One throwaway tree per case, cleaned by its own `try/finally`. */
function toyRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aw646-sweep-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, "utf8");
  }
  return dir;
}

const CORPUS = `# Restatement corpus

\`\`\`text
${CORPUS_MARKER}
# claim-scope: skills/**
rule | owner | phrase | scope | allow | claim
one-pr-per-unit | AGENTS.md | One PR per unit | docs/** | template/AGENTS.md | -
red-first | AGENTS.md | Red-first commits | skills/** | - | -
\`\`\`
`;

/** The pre-fix bytes of the D1 duplicate: one file, the mechanism twice. */
const PREFIX_TESTS = `# Tests

## Checklist

- [ ] A new script+suite pair this unit introduces landed red-first: the
      suite committed alone and observed failing (the red commit), the
      implementation committed after, observed green

## Red-first commits

A new script+suite pair lands red-first: the suite commits alone, observed
failing on the missing module or the failing assertion (the red commit), the
implementation commits after, observed green.
`;

const OWNER = `# AGENTS.md

One PR per unit of work, always against \`main\`. Red-first commits: the suite lands
first, observed failing.
`;

const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

// ── the frozen-failure corpus ───────────────────────────────────────────────

test("F-646-7 a restatement without its owner is refused, with the file and the rule named", () => {
  const repo = toyRepo({
    "AGENTS.md": OWNER,
    [CORPUS_FILE]: CORPUS,
    "docs/workflow/README.md": "Core principles\n\n4. **One PR per unit, against `main`.** Never stack PRs.\n",
  });
  try {
    const result = sweep(repo);
    assert.equal(result.findings.length, 1, JSON.stringify(result.findings));
    assert.equal(result.findings[0].code, "unowned-restatement");
    assert.equal(result.findings[0].rule, "one-pr-per-unit");
    assert.equal(result.findings[0].file, "docs/workflow/README.md");
    assert.equal(result.verdict, "FAIL");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-8 the same copy carrying its owner pointer is accepted, and the owner file is never flagged", () => {
  const repo = toyRepo({
    "AGENTS.md": OWNER,
    [CORPUS_FILE]: CORPUS,
    "docs/workflow/README.md": "4. **One PR per unit** — the rule is [`AGENTS.md`](../AGENTS.md) § Working rules.\n",
    "template/AGENTS.md": "One PR per unit of work, against the default branch.\n",
  });
  try {
    assert.deepEqual(sweep(repo).findings, []);
    assert.equal(sweep(repo).verdict, "PASS");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-9 the D1 intra-file duplicate is refused: two copies in one file is still two copies", () => {
  const repo = toyRepo({
    "AGENTS.md": OWNER,
    [CORPUS_FILE]: CORPUS,
    "skills/x/SKILL.md": `# X\n\nRed-first commits: the suite lands alone.\n`,
    "skills/y/references/TESTS.md": PREFIX_TESTS,
  });
  try {
    const findings = sweep(repo).findings;
    const restatements = findings.filter((finding) => finding.code === "unowned-restatement")
      .map((finding) => finding.file).sort();
    assert.deepEqual(restatements, ["skills/x/SKILL.md", "skills/y/references/TESTS.md"]);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-10 a claim of 'never restated' is machine-verified, never trusted", () => {
  // skills/x/SKILL.md claims the rule is cited, never restated; a sibling restates
  // it — the claim is false and the sweep must say so rather than read the sentence.
  const claiming = CORPUS.replace(
    "red-first | AGENTS.md | Red-first commits | skills/** | - | -",
    "red-first | AGENTS.md | Red-first commits | skills/** | - | skills/x/SKILL.md",
  );
  const repo = toyRepo({
    "AGENTS.md": OWNER,
    [CORPUS_FILE]: claiming,
    "skills/x/SKILL.md": "# X\n\nRed-first is cited from `AGENTS.md`, never restated here.\n",
    "skills/z/references/DEEP.md": "Red-first commits: the suite lands alone, then the implementation.\n",
  });
  try {
    const findings = sweep(repo).findings;
    assert.ok(findings.some((finding) => finding.code === "stale-claim" && finding.rule === "red-first"),
      `the false claim is refused: ${JSON.stringify(findings)}`);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-11 a 'never restated' claim naming no owner is refused, even with no restatement in sight", () => {
  const repo = toyRepo({
    "AGENTS.md": OWNER,
    [CORPUS_FILE]: CORPUS,
    "skills/w/references/MECH.md": "The mechanism is never restated; see the sibling section.\n",
  });
  try {
    const findings = sweep(repo).findings;
    assert.ok(findings.some((finding) => finding.code === "uncovered-claim" && finding.file === "skills/w/references/MECH.md"),
      `the unnamed claim is refused: ${JSON.stringify(findings)}`);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-12 a corpus that cannot be resolved refuses closed instead of passing", () => {
  const missingOwner = toyRepo({
    [CORPUS_FILE]: CORPUS.replace("one-pr-per-unit | AGENTS.md", "one-pr-per-unit | NO-SUCH-FILE.md"),
    "AGENTS.md": OWNER,
  });
  try {
    const result = sweep(missingOwner);
    assert.equal(result.verdict, "REFUSED");
    assert.ok(result.findings.some((finding) => finding.code === "unresolved-owner"));
    assert.equal(run(["--repo", missingOwner]).status, 1);
  } finally {
    fs.rmSync(missingOwner, { recursive: true, force: true });
  }

  const emptyCorpus = toyRepo({ [CORPUS_FILE]: `# Restatement corpus\n\n\`\`\`text\n${CORPUS_MARKER}\nrule | owner | phrase | scope | allow | claim\n\`\`\`\n`, "AGENTS.md": OWNER });
  try {
    assert.equal(sweep(emptyCorpus).verdict, "REFUSED", "an empty ledger is a defect, never a pass");
    assert.ok(sweep(emptyCorpus).findings.some((finding) => finding.code === "empty-corpus"));
  } finally {
    fs.rmSync(emptyCorpus, { recursive: true, force: true });
  }

  const malformed = toyRepo({ [CORPUS_FILE]: `# Restatement corpus\n\n\`\`\`text\n${CORPUS_MARKER}\nrule | owner | phrase | scope\none-pr-per-unit | AGENTS.md | One PR per unit | docs/**\n\`\`\`\n`, "AGENTS.md": OWNER });
  try {
    assert.ok(sweep(malformed).findings.some((finding) => finding.code === "malformed-corpus"));
  } finally {
    fs.rmSync(malformed, { recursive: true, force: true });
  }
});

test("the closed finding set is published and the sweep is deterministic", () => {
  assert.deepEqual([...FINDING_CODES], [
    "unowned-restatement",
    "stale-claim",
    "uncovered-claim",
    "unresolved-owner",
    "malformed-corpus",
    "empty-corpus",
  ]);
  const repo = toyRepo({
    "AGENTS.md": OWNER,
    [CORPUS_FILE]: CORPUS,
    "docs/workflow/README.md": "4. **One PR per unit, against `main`.**\n",
    "skills/x/SKILL.md": "Red-first commits: the suite lands alone.\n",
  });
  try {
    const first = run(["--repo", repo, "--json"]);
    const second = run(["--repo", repo, "--json"]);
    assert.equal(first.stdout, second.stdout, "the same tree prints the same block");
    assert.equal(first.status, 1);
    assert.match(first.stdout, /"verdict": "FAIL"/);
    const text = run(["--repo", repo]);
    assert.match(text.stdout, /^restatement-sweep — /m);
    assert.match(text.stdout, /^verdict: FAIL$/m);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

// ── the live tree ───────────────────────────────────────────────────────────

test("the live tree carries no unowned restatement and no unverified claim", () => {
  const result = sweep(ROOT);
  assert.deepEqual(result.findings, [],
    `restatements:\n${result.findings.map((f) => `  [${f.code}] ${f.rule}: ${f.file} — ${f.detail}`).join("\n")}`);
  assert.equal(result.verdict, "PASS");
  const rows = corpusRows(fs.readFileSync(path.join(ROOT, CORPUS_FILE), "utf8")).rows;
  assert.ok(rows.length >= 5, `the corpus is seeded from the B/D tables (${rows.length} rules)`);
  for (const rule of ["one-pr-per-unit", "red-first", "weaker-than-author", "no-slash-menu"]) {
    assert.ok(rows.some((row) => row.rule === rule), `the corpus declares ${rule}`);
  }
});

test("the detector is not vacuous: every corpus rule matches something in the tree", () => {
  const result = sweep(ROOT);
  assert.deepEqual(result.unmatchedRules, [], "a rule whose phrase matches nothing is a dead seed");
  assert.ok(result.matchedFiles >= 6, `the sweep reads the tree it judges (${result.matchedFiles} files matched)`);
});
