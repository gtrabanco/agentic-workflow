// lockfile-policy.test.mjs — this package is bun-managed
//
// bun.lock is the sole lockfile and stays committed; CI installs with
// `bun install --frozen-lockfile` and uses the npm CLI only for the publish
// step (Trusted Publishing + --provenance are npm-CLI-specific). An npm
// package-lock.json on disk is drift: it rots silently next to bun.lock, and
// this exact file resurrected on main once already (the #150 merge) despite
// the schema package dropping its own at 1.0.1. The policy lives in
// CLAUDE.md → Packages; the .gitignore rejects the file; this test fails the
// suite if one ever appears again.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

test("bun.lock is committed and names this package", () => {
  const lock = join(PKG_DIR, "bun.lock");
  assert.equal(existsSync(lock), true, "bun.lock missing — run `bun install` and commit it");
  const text = readFileSync(lock, "utf8");
  assert.match(
    text,
    /"@gtrabanco\/pi-agentic-workflow"/,
    "bun.lock does not declare this package's workspace",
  );
});

test("package-lock.json must not exist (bun is the sole package manager)", () => {
  assert.equal(
    existsSync(join(PKG_DIR, "package-lock.json")),
    false,
    "package-lock.json resurrected — delete it; bun.lock is the sole lockfile (CLAUDE.md → Packages)",
  );
});
