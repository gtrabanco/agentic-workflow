#!/usr/bin/env node

/**
 * #318 S16 — per-file review state is script-written, so a review cannot claim
 * a file it never re-read.
 *
 * The review loop's honest question is "which files did this cycle actually
 * look at?", and a model's self-report answers it only by assertion. This script
 * is the single writer: each file in the affecting-path inventory ends a cycle
 * either `reviewed@<sha>` or `skipped@<sha>` with a recorded reason, a skip
 * auto-invalidates as soon as a later diff touches that file, and coverage
 * closure (`inventory − reviewed − skipped = 0`) is a mechanical receipt rather
 * than a claim. Model passes read the file; they never write it.
 *
 * Every assertion here is black-box over the CLI in a throwaway git repository,
 * because the contract that matters is the exit code a caller branches on.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "review-state.mjs");

const git = (root, ...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

/** A throwaway repository with two commits, so a base..head diff exists. */
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "review-state-"));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "a.mjs"), "export const a = 1;\n");
  fs.writeFileSync(path.join(root, "src", "b.mjs"), "export const b = 1;\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "base");
  fs.writeFileSync(path.join(root, "src", "a.mjs"), "export const a = 2;\n");
  fs.writeFileSync(path.join(root, "src", "b.mjs"), "export const b = 2;\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "head");
  return root;
}

const run = (root, ...args) => spawnSync(process.execPath, [SCRIPT, ...args], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, REVIEW_STATE_REPO: root },
});

const statePath = (root) => path.join(root, ".review-state", "review-state.json");
const readState = (root) => JSON.parse(fs.readFileSync(statePath(root), "utf8"));

test("#318 S16: record writes the inventory and the state file is the script's", () => {
  const root = fixture();
  try {
    const result = run(root, "record", "--unit", "318-unit", "--head", "HEAD", "--base", "HEAD~1");
    assert.equal(result.status, 0, result.stderr);
    const state = readState(root);
    assert.equal(state.unit, "318-unit");
    assert.deepEqual(state.inventory.map((entry) => entry.path).sort(), ["src/a.mjs", "src/b.mjs"]);
    for (const entry of state.inventory) {
      assert.equal(entry.status, "pending", "a file starts unresolved, never assumed reviewed");
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("#318 S16: mark records a review or a skip, and a skip without a reason is refused", () => {
  const root = fixture();
  try {
    assert.equal(run(root, "record", "--unit", "u", "--head", "HEAD", "--base", "HEAD~1").status, 0);
    assert.equal(run(root, "mark", "--unit", "u", "--path", "src/a.mjs", "--status", "reviewed").status, 0);
    assert.notEqual(run(root, "mark", "--unit", "u", "--path", "src/b.mjs", "--status", "skipped").status, 0,
      "a skip must be refused when it carries no reason");
    const result = run(root, "mark", "--unit", "u", "--path", "src/b.mjs", "--status", "skipped", "--reason", "docs-only batch");
    assert.equal(result.status, 0, result.stderr);
    const state = readState(root);
    const a = state.inventory.find((entry) => entry.path === "src/a.mjs");
    const b = state.inventory.find((entry) => entry.path === "src/b.mjs");
    assert.match(a.mark, /^reviewed@[0-9a-f]{40}$/);
    assert.match(b.mark, /^skipped@[0-9a-f]{40}$/);
    assert.equal(b.reason, "docs-only batch");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("#318 S16: coverage closure is mechanical — pending rows fail the check", () => {
  const root = fixture();
  try {
    run(root, "record", "--unit", "u", "--head", "HEAD", "--base", "HEAD~1");
    run(root, "mark", "--unit", "u", "--path", "src/a.mjs", "--status", "reviewed");
    const open = run(root, "check", "--unit", "u");
    assert.notEqual(open.status, 0, "one unreviewed file must fail the check");
    assert.match(open.stdout, /^closure: open\(1\)$/m);
    assert.match(open.stdout, /src\/b\.mjs/);

    run(root, "mark", "--unit", "u", "--path", "src/b.mjs", "--status", "reviewed");
    const closed = run(root, "check", "--unit", "u");
    assert.equal(closed.status, 0, closed.stdout);
    assert.match(closed.stdout, /^closure: complete$/m);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("#318 S16: a later diff invalidates a skip that touched the same file", () => {
  const root = fixture();
  try {
    run(root, "record", "--unit", "u", "--head", "HEAD", "--base", "HEAD~1");
    run(root, "mark", "--unit", "u", "--path", "src/a.mjs", "--status", "reviewed");
    run(root, "mark", "--unit", "u", "--path", "src/b.mjs", "--status", "skipped", "--reason", "unrelated");
    assert.equal(run(root, "check", "--unit", "u").status, 0, "closed before the new touch");

    // A commit that touches b.mjs: the skip is a lie from here on.
    fs.writeFileSync(path.join(root, "src", "b.mjs"), "export const b = 3;\n");
    git(root, "add", "-A");
    git(root, "commit", "-qm", "touch b");
    const result = run(root, "check", "--unit", "u");
    assert.notEqual(result.status, 0, "the stale skip must reopen");
    assert.match(result.stdout, /^closure: open\(1\)$/m);
    assert.match(result.stdout, /stale skip/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("#318 S16: the state file is derived, never a second source of truth", () => {
  const root = fixture();
  try {
    run(root, "record", "--unit", "u", "--head", "HEAD", "--base", "HEAD~1");
    const state = readState(root);
    // Rebuildable: recording again reproduces the inventory from git alone.
    run(root, "mark", "--unit", "u", "--path", "src/a.mjs", "--status", "reviewed");
    run(root, "record", "--unit", "u", "--head", "HEAD", "--base", "HEAD~1", "--reset");
    const rebuilt = readState(root);
    assert.deepEqual(rebuilt.inventory.map((entry) => entry.path), state.inventory.map((entry) => entry.path));
    assert.ok(rebuilt.inventory.every((entry) => entry.status === "pending"), "--reset drops the marks");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("#318 S16: an unknown status, a foreign path and a missing unit are refused", () => {
  const root = fixture();
  try {
    run(root, "record", "--unit", "u", "--head", "HEAD", "--base", "HEAD~1");
    assert.notEqual(run(root, "mark", "--unit", "u", "--path", "src/a.mjs", "--status", "looked-at").status, 0);
    const foreign = run(root, "mark", "--unit", "u", "--path", "src/nope.mjs", "--status", "reviewed");
    assert.notEqual(foreign.status, 0, "a path outside the inventory cannot be marked");
    assert.match(foreign.stderr, /not in the inventory/);
    assert.notEqual(run(root, "check", "--unit", "absent").status, 0, "an unknown unit fails closed");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
