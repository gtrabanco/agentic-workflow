#!/usr/bin/env node
/**
 * workspace-lock-policy.test.mjs — one lockfile, at the workspace root.
 *
 * The packages under `packages/` are bun workspace members of a private root
 * `package.json`, and one `bun.lock` at the root is the install contract for
 * all of them. A lock inside a package directory is not a style choice: it
 * makes that package resolve its siblings from the registry instead of from
 * the folder, which is the deadlock this layout exists to remove — a sibling
 * pin cannot name a version that is not published yet, so a bump and its pin
 * move could never share a commit, and `bun install --frozen-lockfile` had to
 * wait for a publish that a merge was supposed to perform.
 *
 * The census is derived from the tree, so a new package inherits the rule by
 * existing. `packages/*\/test/lockfile-policy.test.mjs` keeps the policy that
 * is still per-package (no `package-lock.json`, and every published spec is an
 * exact registry version); this file owns the lock's location and membership.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { packageDirs } from "./version-parity-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
/** bun.lock is JSONC (trailing commas): strip them before parsing. */
const readLock = (rel) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/,(\s*[}\]])/g, "$1"));

test("the root manifest is private and covers every package under packages/", () => {
  const root = readJson("package.json");
  assert.equal(root.private, true, "the workspace root carries no published identity — keep it private");
  const globs = root.workspaces ?? [];
  assert.ok(globs.length > 0, "the root package.json declares no workspaces");
  const dirs = packageDirs();
  assert.ok(dirs.length > 0, "no package manifest under packages/");
  for (const dir of dirs) {
    assert.ok(
      globs.includes("packages/*") || globs.includes(dir),
      `${dir} is not a workspace member (declared: ${JSON.stringify(globs)})`,
    );
  }
});

test("one root lockfile declares every member, and no package carries its own", () => {
  const lock = readLock("bun.lock");
  const declared = Object.keys(lock.workspaces ?? {});
  for (const dir of packageDirs()) {
    assert.ok(
      declared.includes(dir),
      `bun.lock does not declare ${dir} (declared: ${declared.join(", ") || "nothing"})`,
    );
    assert.equal(
      fs.existsSync(path.join(ROOT, dir, "bun.lock")),
      false,
      `${dir}/bun.lock exists — one lock at the root; a package-local lock resolves that package's siblings from the registry`,
    );
    assert.equal(
      fs.existsSync(path.join(ROOT, dir, "package-lock.json")),
      false,
      `${dir}/package-lock.json resurrected — bun is the sole package manager`,
    );
  }
});
