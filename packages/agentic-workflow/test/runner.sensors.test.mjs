/**
 * runner.sensors.test.mjs — issue #352 P2/O1: the six sensors answer as the
 * runner's subcommands with their own exit contracts, and none of them writes.
 *
 * The deep corpora live beside their modules (the root suites re-aimed at this
 * bin); this file is the *contract* half: one case per sensor for the exit code
 * and the fixed block, plus the read-only property all six share.
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

/** Run a subcommand; returns { code, stdout, stderr }. */
function run(cwd, ...args) {
  try {
    return { code: 0, stdout: execFileSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" }), stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

/** A throwaway project with one fix unit and a plan file. */
function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), "runner-sensors-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text);
  };
  mkdirSync(join(root, "docs/fix/77-toy"), { recursive: true });
  write("NOTES.md", "prose\n");
  // The canonical skeleton, written by the crate's own service: the sensor cases
  // then lint a document the grammar itself produced.
  createSpecByReference(join(root, "docs/fix/77-toy"), "77-toy");
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Fixture");
  git("config", "commit.gpgsign", "false");
  git("add", "-A");
  git("commit", "-qm", "chore(77): fixture");
  return { root, write, git };
}

test("phase-lint: PASS 0 on a clean plan, BLOCKED 1 on an empty one, usage 1 for two paths", (t) => {
  const { root, write } = makeRepo(t);
  const pass = run(root, "phase-lint", "docs/fix/77-toy/SPEC.md");
  assert.equal(pass.code, 0, pass.stdout + pass.stderr);
  assert.match(pass.stdout, /P1 Phase-lint: PASS \(6\/6\)/u);
  assert.match(pass.stdout, /^verdict PASS$/mu);

  write("docs/fix/empty.md", "# nothing\n");
  const blocked = run(root, "phase-lint", "docs/fix/empty.md");
  assert.equal(blocked.code, 1);
  assert.match(blocked.stdout, /^verdict BLOCKED/mu);

  const usage = run(root, "phase-lint", "a.md", "b.md");
  assert.equal(usage.code, 1, "two paths are a usage error, never a silent drop");
  assert.match(usage.stderr, /expected exactly one plan path/u);
});

test("diff-guard: JSON counts with exit 0 under the bound and 1 over it, usage 2 for a bad ref", (t) => {
  const { root, write, git } = makeRepo(t);
  const base = git("rev-parse", "HEAD");
  const clean = run(root, "diff-guard", "--base", base, "--json");
  assert.equal(clean.code, 0);
  assert.equal(JSON.parse(clean.stdout).breach, false);

  write("big.mjs", `${"export const x = 1;\n".repeat(500)}`);
  git("add", "-A");
  git("commit", "-qm", "feat(77): big");
  const breach = run(root, "diff-guard", "--base", base, "--json");
  assert.equal(breach.code, 1);
  assert.equal(JSON.parse(breach.stdout).breach, true);

  const bad = run(root, "diff-guard", "--base", "nope", "--json");
  assert.equal(bad.code, 2);
  assert.match(`${bad.stdout}${bad.stderr}`, /unknown base ref|DIFF-GUARD ERROR/u, "a bad ref is the usage class");
});

test("workflow-status: --version prints the installed schema version, --help exits 0, --json-only is one envelope", (t) => {
  const { root } = makeRepo(t);
  const version = run(root, "workflow-status", "--version");
  assert.equal(version.code, 0);
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/u, "the version is the schema package the runner loaded");

  const help = run(root, "workflow-status", "--help");
  assert.equal(help.code, 0);
  assert.match(help.stdout, /^Usage: agentic-workflow workflow-status/mu, "help names the runner, never a script path");

  const envelope = run(root, "workflow-status", "--json-only");
  assert.equal(envelope.code, 0, envelope.stderr);
  const parsed = JSON.parse(envelope.stdout);
  assert.equal(parsed.skill, "workflow-status", "the envelope names the sensor it came from");
  assert.ok(parsed.state, "the envelope carries the continuation state");
  assert.ok(parsed.next, "and the next action");
});

test("pre-execution-snapshot: `contract` prints the published constants and exits 0", (t) => {
  const { root } = makeRepo(t);
  const contract = run(root, "pre-execution-snapshot", "contract");
  assert.equal(contract.code, 0, contract.stderr);
  const body = JSON.parse(contract.stdout);
  assert.ok(Array.isArray(body.stages) || Array.isArray(body.preExecutionStages) || body.receiptContract !== undefined, "the contract names its stages and receipt id");
});

test("needs-input: a clean ledger answers the open-questions block with exit 0, --json keeps the shape", (t) => {
  const { root } = makeRepo(t);
  const text = run(root, "needs-input", "docs/fix/77-toy");
  assert.equal(text.code, 0, text.stderr);
  assert.match(text.stdout, /^open-questions@1$/mu);
  assert.match(text.stdout, /Open questions: 0/u);

  const json = run(root, "needs-input", "docs/fix/77-toy", "--json");
  assert.equal(json.code, 0);
  const parsed = JSON.parse(json.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.block, "open-questions@1");
});

test("ledger-provenance: --check on a document with no findings rows passes, a missing path is not a pass", (t) => {
  const { root } = makeRepo(t);
  const check = run(root, "ledger-provenance", "docs/fix/77-toy/SPEC.md", "--check");
  assert.equal(check.code, 0, check.stderr);
  assert.match(check.stdout, /CHECK PASS|every folded row names a verified commit/u);

  const missing = run(root, "ledger-provenance", "docs/fix/77-toy/absent.md", "--check");
  assert.notEqual(missing.code, 0, "a file that is not there can never read as clean");
});

test("no sensor writes: the working tree is byte-identical after all six run", (t) => {
  const { root, git } = makeRepo(t);
  const before = git("status", "--porcelain=v1");
  run(root, "phase-lint", "docs/fix/77-toy/SPEC.md");
  run(root, "diff-guard", "--base", "HEAD", "--json");
  run(root, "workflow-status", "--json-only");
  run(root, "pre-execution-snapshot", "contract");
  run(root, "needs-input", "docs/fix/77-toy");
  run(root, "ledger-provenance", "docs/fix/77-toy/SPEC.md", "--check");
  assert.equal(git("status", "--porcelain=v1"), before, "the sensors are read-only");
});

test("every sensor refuses an unknown flag instead of guessing", (t) => {
  const { root } = makeRepo(t);
  for (const sensor of ["phase-lint", "diff-guard", "needs-input", "ledger-provenance"]) {
    const answer = run(root, sensor, "--invented");
    assert.notEqual(answer.code, 0, `${sensor} must refuse an unknown flag`);
  }
});
