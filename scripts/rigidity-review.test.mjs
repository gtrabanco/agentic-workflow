#!/usr/bin/env node
/**
 * rigidity-review.test.mjs — the gate step that audits the guards themselves
 * (issue #546 S10).
 *
 * The guards this workflow ships lost their flexibility one literal at a time:
 * a forge binary named inline, a `/tmp` fallback, `origin/HEAD` hard-coded as the
 * mainline. Nobody notices until an external contributor hits the wall. This
 * suite pins the step that notices: the real tree must pass, and each way the
 * rigidity comes back must fail with the file, the line and the rule.
 *
 * Every failing case runs against a throwaway copy under `mktemp -d`; the copy
 * is mutated and removed, never the tree.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRIPT = path.join(HERE, "rigidity-review.mjs");

/** A copy of the two trees the inventory reads, in a throwaway directory. */
function sandbox(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rigidity-review-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const sub of [
    path.join("template", ".agentic-workflow", "hooks"),
    "scripts",
  ]) {
    fs.cpSync(path.join(ROOT, sub), path.join(dir, sub), {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}node_modules`) && !source.endsWith(".test.mjs"),
    });
  }
  return dir;
}

const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
const hooksOf = (dir) => path.join(dir, "template", ".agentic-workflow", "hooks");

/** Append a line to a guard file and return the edit's 1-based line number. */
function appendLine(file, line) {
  const before = fs.readFileSync(file, "utf8").split("\n").length;
  fs.appendFileSync(file, `${line}\n`);
  return before;
}

test("the real tree passes, and the ok line names what was audited", () => {
  const result = run([]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /RIGIDITY-REVIEW — ok: \d+ guard file\(s\), \d+ rule\(s\)/);
});

test("a forge binary named inline outside the adapter is a finding", (t) => {
  const dir = sandbox(t);
  const file = path.join(hooksOf(dir), "turn-contract.sh");
  const line = appendLine(file, 'pr_json=$(gh pr list --head "$current_branch")');
  const result = run(["--root", dir]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /RIGIDITY-REVIEW — failed: /);
  assert.match(result.stdout, new RegExp(`turn-contract\\.sh:${line} hardcoded-forge-cli`));
});

test("a private temp fallback in a hook is a finding", (t) => {
  const dir = sandbox(t);
  const file = path.join(hooksOf(dir), "turn-contract.sh");
  const line = appendLine(file, 'scratch=$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow.XXXXXX")');
  const result = run(["--root", dir]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`turn-contract\\.sh:${line} hardcoded-temp-fallback`));
});

test("a mainline ref hard-coded in a hook is a finding", (t) => {
  const dir = sandbox(t);
  const file = path.join(hooksOf(dir), "fullauto-merge.sh");
  const line = appendLine(file, 'default_ref=$(git rev-parse refs/remotes/origin/HEAD)');
  const result = run(["--root", dir]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`fullauto-merge\\.sh:${line} hardcoded-remote`));
});

test("a guard file the inventory does not name is a finding", (t) => {
  const dir = sandbox(t);
  const file = path.join(hooksOf(dir), "new-guard.sh");
  fs.writeFileSync(file, "#!/usr/bin/env bash\nexit 0\n");
  const result = run(["--root", dir]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /new-guard\.sh unregistered-guard/);
});

test("a registered guard file that disappeared is a finding", (t) => {
  const dir = sandbox(t);
  fs.rmSync(path.join(hooksOf(dir), "index-sync.sh"));
  const result = run(["--root", dir]);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /index-sync\.sh missing-guard/);
});

test("the adapter and the temp helper are the declared homes, not findings", (t) => {
  const dir = sandbox(t);
  // The two libraries are where the literals belong: naming a forge binary or a
  // temp root there is the design, so the audit must not flag them.
  const result = run(["--root", dir]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /homes: lib\/forge\.sh, lib\/temp\.sh/);
});

test("usage errors exit 2 and name the flag", () => {
  const result = run(["--nope"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--nope/);
});
