#!/usr/bin/env node
// test-obligation: protects=docs/fix/646-docs-skills-reconciliation/second-read.md,scripts/reading-coverage.mjs obligations=convention,failure-path

/**
 * reading-coverage.test.mjs — the full-read claim, made checkable (issue #646
 * S5a/B).
 *
 * The issue's own evidence was that a keyword sweep passed for a full read: the
 * findings came from greps, and six named files had never been opened. A claim
 * of "I read every in-scope file" is worth nothing unless the file set is
 * derived from the tree and every member is accounted for, so the reader below
 * enumerates the scope, refuses a member with no row, and refuses a row that
 * points at nothing.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { COVERAGE_MARKER, DEPTHS, FINDING_CODES, coverage } from "./reading-coverage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "reading-coverage.mjs");
const LEDGER = "docs/fix/646-docs-skills-reconciliation/second-read.md";

function toyRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aw646-coverage-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, "utf8");
  }
  return dir;
}

const block = (rows, directives = "") => `# Second read

\`\`\`text
${COVERAGE_MARKER}
${directives}file | tier | depth | evidence
${rows.join("\n")}
\`\`\`
`;

const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

// ── the frozen-failure corpus ───────────────────────────────────────────────

test("F-646-13 an in-scope file with no row refuses the coverage claim", () => {
  const repo = toyRepo({
    "skills/x/SKILL.md": "# X\n",
    "skills/x/references/DEEP.md": "# Deep\n",
    [LEDGER]: block(["skills/x/SKILL.md | 1-on-demand | full | read end-to-end"]),
  });
  try {
    const result = coverage(repo, "docs-skills");
    assert.equal(result.verdict, "FAIL");
    assert.deepEqual(result.findings.map((finding) => [finding.code, finding.file]), [["unrowed", "skills/x/references/DEEP.md"]]);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-14 a row for a file that does not exist, or a depth outside the closed set, refuses", () => {
  const repo = toyRepo({
    "skills/x/SKILL.md": "# X\n",
    [LEDGER]: block([
      "skills/x/SKILL.md | 1-on-demand | skimmed | read end-to-end",
      "skills/gone/SKILL.md | 1-on-demand | full | read end-to-end",
    ]),
  });
  try {
    const codes = coverage(repo, "docs-skills").findings.map((finding) => finding.code).sort();
    assert.deepEqual(codes, ["bad-depth", "stale-row"]);
    assert.deepEqual([...DEPTHS], ["full", "scanned"]);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-15 a declared exclusion is honoured and a row with no evidence is refused", () => {
  const repo = toyRepo({
    "skills/x/SKILL.md": "# X\n",
    "docs/LOGS.md": "# frozen history\n",
    [LEDGER]: block(
      ["skills/x/SKILL.md | 1-on-demand | full | "],
      "# excluded: docs/LOGS.md — frozen history, never edited for currency\n",
    ),
  });
  try {
    const result = coverage(repo, "docs-skills");
    assert.deepEqual(result.findings.map((finding) => [finding.code, finding.file]), [["no-evidence", "skills/x/SKILL.md"]]);
    assert.ok(!result.findings.some((finding) => finding.code === "unrowed" && finding.file === "docs/LOGS.md"),
      "the declared exclusion is skipped, never silently uncovered");
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test("F-646-16 a missing ledger or a missing block refuses closed", () => {
  const noLedger = toyRepo({ "skills/x/SKILL.md": "# X\n" });
  try {
    assert.equal(coverage(noLedger, "docs-skills").verdict, "REFUSED");
    assert.equal(run(["--repo", noLedger]).status, 1);
  } finally {
    fs.rmSync(noLedger, { recursive: true, force: true });
  }
  const noBlock = toyRepo({ "skills/x/SKILL.md": "# X\n", [LEDGER]: "# Second read\n\nnothing\n" });
  try {
    const result = coverage(noBlock, "docs-skills");
    assert.equal(result.verdict, "REFUSED");
    assert.ok(result.findings.some((finding) => finding.code === "missing-block"));
  } finally {
    fs.rmSync(noBlock, { recursive: true, force: true });
  }
});

test("the clean twin is covered and the closed sets are published", () => {
  const repo = toyRepo({
    "skills/x/SKILL.md": "# X\n",
    "skills/x/references/DEEP.md": "# Deep\n",
    [LEDGER]: block([
      "skills/x/SKILL.md | 1-on-demand | full | read end-to-end",
      "skills/x/references/DEEP.md | 1-on-demand | scanned | headings + owner grep",
    ]),
  });
  try {
    const result = coverage(repo, "docs-skills");
    assert.equal(result.verdict, "covered");
    assert.deepEqual(result.findings, []);
    assert.equal(result.counts.full, 1);
    assert.equal(result.counts.scanned, 1);
    const cli = run(["--repo", repo]);
    assert.equal(cli.status, 0);
    assert.match(cli.stdout, /^verdict: covered$/m);
    assert.equal(run(["--repo", repo, "--json"]).stdout, run(["--repo", repo, "--json"]).stdout);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
  assert.deepEqual([...FINDING_CODES], ["unrowed", "stale-row", "bad-depth", "no-evidence", "missing-block", "missing-ledger"]);
});

// ── the live tree ───────────────────────────────────────────────────────────

test("every in-scope file of this repository is accounted for", () => {
  const result = coverage(ROOT, "docs-skills");
  assert.deepEqual(result.findings, [],
    `unaccounted:\n${result.findings.map((f) => `  [${f.code}] ${f.file}`).join("\n")}`);
  assert.equal(result.verdict, "covered");
  assert.ok(result.counts.files >= 200, `the scope is the tree, not a sample (${result.counts.files} files)`);
  assert.ok(result.counts.full >= 40, `the files this unit read end-to-end are declared (${result.counts.full})`);
  const cli = run(["--repo", ROOT, "--scope", "docs-skills"]);
  assert.equal(cli.status, 0, `${cli.stdout}${cli.stderr}`);
  assert.match(cli.stdout, /^verdict: covered$/m);
});
