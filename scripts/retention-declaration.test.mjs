// test-obligation: protects=scripts/retention-declaration.mjs obligations=contract,failure-path

/**
 * retention-declaration.test.mjs — the trim ceremony declaration's gate
 * (issue #651 S9, decision D8).
 *
 * Every unit-doc template declares, beside itself, which carrier files a settle
 * trims and which it keeps. The declaration can drift from the published matrix
 * in exactly four ways — a missing row, a conflicting disposition, a row the
 * matrix does not publish, and a matrix file no declaration covers — and each is a
 * named refusal here. The live tree is checked once, at the end.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RECEIPT, TEMPLATES, checkTemplate, readDeclaration } from "./retention-declaration.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "retention-declaration.mjs");

const cleanup = [];
const tempTree = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "retention-declaration-"));
  cleanup.push(dir);
  return dir;
};
test.after(() => {
  for (const dir of cleanup) fs.rmSync(dir, { recursive: true, force: true });
  cleanup.length = 0;
});

const block = (rows) => ["```text", RECEIPT, "path | disposition", ...rows, "```", ""].join("\n");

const COMPLETE = [
  "TASKS.md | trimmable",
  "PLAN.md | trimmable",
  "progress.md | trimmable",
  "ACCEPTANCE.md | trimmable",
  "testing.md | trimmable",
  "CHECKLIST.md | trimmable",
  "BRIEF.md | trimmable",
  "pr-body.md | trimmable",
  "external-verify.md | trimmable",
  "review-findings.md | trimmable",
  "planning-findings.md | trimmable",
  "SPEC.md | kept",
  "decisions.md | kept",
  "known-issues.md | kept",
  "planning-obligations.md | kept",
  "planning-evidence.md | kept",
  "architecture-notes.md | kept",
  "sources.md | kept",
  "research.md | kept",
];

test("a complete declaration agrees with the matrix", () => {
  const parsed = readDeclaration(block(COMPLETE));
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 19);
  assert.deepEqual(checkTemplate("template", block(COMPLETE)).findings, []);
});

test("a missing matrix row is refused by name", () => {
  const rows = COMPLETE.filter((row) => !row.startsWith("progress.md"));
  const findings = checkTemplate("template", block(rows)).findings;
  assert.deepEqual(findings.map((finding) => finding.code), ["row-missing"]);
  assert.match(findings[0].detail, /progress\.md/u);
});

test("a conflicting disposition is refused", () => {
  const rows = COMPLETE.map((row) => (row === "decisions.md | kept" ? "decisions.md | trimmable" : row));
  const findings = checkTemplate("template", block(rows)).findings;
  assert.deepEqual(findings.map((finding) => finding.code), ["row-conflict"]);
});

test("a row the matrix does not publish is refused unless it is out-of-scope", () => {
  const extra = checkTemplate("template", block([...COMPLETE, "notes.md | kept"])).findings;
  assert.deepEqual(extra.map((finding) => finding.code), ["row-unknown"]);

  const declared = checkTemplate("template", block([...COMPLETE, "notes.md | out-of-scope"])).findings;
  assert.deepEqual(declared, [], "a project may declare its own out-of-scope path");
});

test("a duplicate row and a missing block are both refused", () => {
  const duplicate = checkTemplate("template", block([...COMPLETE, "TASKS.md | trimmable"])).findings;
  assert.deepEqual(duplicate.map((finding) => finding.code), ["row-duplicate"]);

  const missing = checkTemplate("template", "# no block here\n").findings;
  assert.deepEqual(missing.map((finding) => finding.code), ["block-missing"]);
});

test("the live tree: every unit-doc template declares the matrix and the CLI exits 0", () => {
  const result = spawnSync(process.execPath, [CLI, "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, new RegExp(`^${RECEIPT}$`, "mu"));
  assert.match(result.stdout, /^verdict \| PASS$/mu);
  for (const template of TEMPLATES) {
    assert.ok(fs.existsSync(path.join(ROOT, template)), `${template} exists`);
  }
});
