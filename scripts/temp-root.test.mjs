#!/usr/bin/env node
/**
 * temp-root.test.mjs — the contract for `scripts/temp-root.mjs`, the tracked
 * temp-root helper the temp-hygiene floor (issue #476) names as a cleanup
 * capability.
 *
 * The incident the helper exists for: a test suite creates temp dirs and
 * cleans them only on the happy path — or never — so a red run, a killed
 * runner or a hung process leaks. Every leak eventually saturates the shared
 * temp filesystem (494k files in one incident) and blocks everything that
 * shares it. The helper makes cleanup process-wide and unconditional: one
 * `tempRoot("prefix-")` call creates the dir and registers it for an
 * exit-hook `rmSync` that runs even when a test fails or a runner tears the
 * process down. The suite pins the helper's behaviour, not the leak — the
 * leak class itself is pinned by `scripts/temp-hygiene.mjs`.
 *
 * Usage
 *   bun test scripts/temp-root.test.mjs     (the per-file bun-first rule)
 *   node --test scripts/temp-root.test.mjs  (the guaranteed fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { tempRoot, disposeTempRoots, trackedTempRoots } from "./temp-root.mjs";

const PREFIX = "temp-root-spec-";

test("tempRoot creates an existing directory under the temp base, unique per call", () => {
  const a = tempRoot(PREFIX);
  const b = tempRoot(PREFIX);
  try {
    assert.ok(fs.existsSync(a) && fs.statSync(a).isDirectory(), "the root exists as a directory");
    assert.ok(path.basename(a).startsWith(PREFIX), `the basename carries the prefix (${a})`);
    assert.ok(path.dirname(a) === os.tmpdir() || process.env.TMPDIR, "the root sits under the temp base");
    assert.notEqual(a, b, "two calls never share a directory");
  } finally {
    disposeTempRoots();
  }
});

test("disposeTempRoots removes every tracked directory without an explicit rm", () => {
  const roots = [tempRoot(PREFIX), tempRoot(PREFIX)];
  for (const root of roots) fs.writeFileSync(path.join(root, "file.txt"), "x");
  assert.equal(trackedTempRoots().length >= 2, true, "the roots are tracked");
  const removed = disposeTempRoots();
  assert.equal(removed >= 2, true, "dispose reports the roots it removed");
  assert.equal(trackedTempRoots().length, 0, "the tracker empties");
  for (const root of roots) {
    assert.equal(fs.existsSync(root), false, `the root is gone: ${root}`);
  }
});

test("disposeTempRoots is idempotent and safe on an empty tracker", () => {
  assert.equal(disposeTempRoots(), 0);
  assert.equal(disposeTempRoots(), 0);
});

test("the exit hook is installed once, no matter how many roots are created", () => {
  const before = process.listenerCount("exit");
  tempRoot(PREFIX);
  tempRoot(PREFIX);
  tempRoot(PREFIX);
  assert.equal(process.listenerCount("exit"), before + 1, "exactly one exit hook for the whole process");
  disposeTempRoots();
});

test("a root created with an explicit base lands under that base", () => {
  const base = fs.mkdtempSync(path.join(process.env.TMPDIR || "/var/tmp", "temp-root-spec-base-"));
  try {
    const root = tempRoot(PREFIX, base);
    assert.ok(root.startsWith(base + path.sep), `the root sits under the explicit base (${root})`);
    assert.ok(fs.existsSync(root));
  } finally {
    disposeTempRoots();
    fs.rmSync(base, { recursive: true, force: true });
  }
});
