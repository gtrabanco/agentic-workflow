/**
 * runner.ceremony-p0.test.mjs — issue #352 P3/O5, O8: the eight P0 ceremony
 * modules answer from the crate.
 *
 * One case per module over a throwaway project, plus the two properties the map
 * makes of the whole set: the annotator never rewrites a legacy side ledger, and
 * a write operation refuses an unknown flag instead of swallowing it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSpecByReference } from "../src/edit/UnitDoc.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

function ceremony(cwd, ...args) {
  try {
    return { code: 0, stdout: execFileSync(process.execPath, [BIN, "ceremony", ...args], { cwd, encoding: "utf8" }), stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

const json = (result) => { try { return JSON.parse(result.stdout); } catch { return null; } };

function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), "ceremony-p0-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text);
  };
  // The canonical skeleton the crate itself writes, so the plan cases lint a
  // document the grammar produced rather than one this test invented.
  mkdirSync(join(root, "docs/fix/77-toy"), { recursive: true });
  createSpecByReference(join(root, "docs/fix/77-toy"), "77-toy");
  const GIT_ID = ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false"];
  const git = (...args) => execFileSync("git", [...GIT_ID, ...args], { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
    git("add", "-A");
  git("commit", "-qm", "chore(77): fixture");
  write("NOTES.md", "the fixture's second commit gives the range cases a parent\n");
  git("add", "-A");
  git("commit", "-qm", "docs(77): notes");
  return { root, write, git };
}

test("workspace: status is the git porcelain, clean-check answers the same question read-only", (t) => {
  const { root, write } = makeRepo(t);
  const clean = ceremony(root, "workspace", "clean-check");
  assert.equal(json(clean).clean, true);

  write("NOTES.md", "x\n");
  const dirty = ceremony(root, "workspace", "clean-check");
  assert.equal(json(dirty).clean, false, "a dirty tree is reported, never repaired");
  assert.deepEqual(json(dirty)["dirty-files"], ["NOTES.md"]);

  const status = ceremony(root, "workspace", "status");
  assert.ok(json(status).status.some((row) => row.file === "NOTES.md"));
});

test("docs: check-commit-format passes on the fixture history; phase labels are checked", (t) => {
  const { root } = makeRepo(t);
  const format = ceremony(root, "docs", "check-commit-format", "HEAD~1..HEAD");
  assert.equal(format.code, 0, format.stdout + format.stderr);
  assert.equal(json(format).valid, true);

  const phases = ceremony(root, "docs", "check-phase-labels", "--slug", "77-toy");
  assert.ok(json(phases), "the answer is JSON even when a check passes");
});

test("findings: append writes an F row, update flips it, summarize groups by axis", (t) => {
  const { root } = makeRepo(t);
  const appended = ceremony(root, "findings", "append", "--slug", "77-toy", "--file", "src/a.mjs", "--line", "3", "--axis", "code", "--severity", "BLOCKER", "--impact", "blocking", "--class", "source", "--route", "fold");
  assert.equal(appended.code, 0, appended.stdout + appended.stderr);

  const read = ceremony(root, "findings", "read", "--slug", "77-toy");
  assert.equal(json(read).findings.length, 1, JSON.stringify(json(read)));

  const summary = ceremony(root, "findings", "summarize", "--slug", "77-toy");
  const grouped = json(summary);
  assert.equal(grouped.byAxis.code, 1, "the axis the row was written with is the one it is grouped by");
  assert.equal(grouped.bySeverity.BLOCKER, 1);
  assert.equal(grouped.byClass.source, 1);
});

test("ledger: append writes a mark, count groups it, verify answers presence", (t) => {
  const { root, git } = makeRepo(t);
  const sha = git("rev-parse", "HEAD");
  const appended = ceremony(root, "ledger", "append", "--slug", "77-toy", "--mark", "REVIEW-RAN", "--sha", sha, "--detail", "cycle 1");
  assert.equal(appended.code, 0, appended.stdout + appended.stderr);

  const counts = ceremony(root, "ledger", "count", "--slug", "77-toy");
  // On the unit-doc carrier a mark is its `log-kind@1` token: a review run is `R`.
  assert.equal(json(counts).counts.R, 1, "the mark is counted under its log token");

  const verify = ceremony(root, "ledger", "verify", "--slug", "77-toy", "--required-mark", "R");
  assert.equal(json(verify).verified, true);
});

test("unit + plan: read answers the doc, list answers the tree, plan lint delegates to phase-lint", (t) => {
  const { root } = makeRepo(t);
  const read = ceremony(root, "unit", "read", "--slug", "77-toy");
  assert.equal(read.code, 0, read.stdout + read.stderr);

  const list = ceremony(root, "unit", "list");
  assert.ok(json(list).units.some((unit) => unit.slug === "77-toy"));

  const lint = ceremony(root, "plan", "lint", "--slug", "77-toy");
  assert.ok(lint.code === 0 || lint.code === 2, "the plan answers a verdict, never a stack trace");
  assert.match(`${lint.stdout}`, /verdict|blocked/u, "the plan lints through the same bin's phase-lint");
});

test("tier: classify reads the change, and a model-supplied --tier is refused", (t) => {
  const { root, write, git } = makeRepo(t);
  write("NOTES.md", "prose only\n");
  git("add", "-A");
  git("commit", "-qm", "docs(77): notes");
  const classified = ceremony(root, "tier", "classify", "--base", "HEAD~1");
  assert.equal(json(classified).tier, "passive", "a prose-only change owes the passive ceremony");

  const refused = ceremony(root, "tier", "classify", "--tier", "high");
  assert.equal(refused.code, 1, "the tier is never an input");
});

test("passive: add records the passive readback, and an unknown op refuses", (t) => {
  const { root, write } = makeRepo(t);
  write("NOTES.md", "prose\n");
  const added = ceremony(root, "passive", "add", "--id", "2026-11-12-77-toy", "--paths", "NOTES.md", "--readback", "prose only, no executable effect", "--gate", "the deterministic gate is the whole verification", "--gate-exit", "0");
  assert.equal(added.code, 0, added.stdout + added.stderr);

  const unknown = ceremony(root, "passive", "teleport");
  assert.equal(unknown.code, 1);
});

test("a legacy side ledger is read, never rewritten (the annotator stays the only writer)", (t) => {
  const { root, write } = makeRepo(t);
  write("docs/fix/77-toy/review-findings.md", "# Findings\n\n| id | file | route | folded |\n| --- | --- | --- | --- |\n| F1 | a.mjs | fold | no |\n");
  const before = readFileSync(join(root, "docs/fix/77-toy/review-findings.md"), "utf8");
  const read = ceremony(root, "findings", "read", "--slug", "77-toy");
  assert.equal(read.code, 0, "a legacy carrier is readable");
  assert.equal(readFileSync(join(root, "docs/fix/77-toy/review-findings.md"), "utf8"), before, "and is never written by a ceremony op");
});

test("every P0 object refuses an unknown operation with the closed-world usage error", (t) => {
  const { root } = makeRepo(t);
  for (const object of ["workspace", "docs", "findings", "ledger", "unit", "plan", "tier", "passive"]) {
    const answer = ceremony(root, object, "teleport");
    assert.equal(answer.code, 1, `${object} refuses an unknown op`);
    // The ported P0 modules answer `unknown-subcommand` and the later ones
    // `unknown-op`; the contract both satisfy is a JSON usage error with a code.
    assert.equal(typeof json(answer).error, "string", `${object} names the closed-world reason`);
  }
});
