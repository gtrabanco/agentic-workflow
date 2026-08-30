// lockfile-policy.test.mjs — this package is bun-managed
//
// bun.lock is the sole lockfile and stays committed; CI installs with
// `bun install --frozen-lockfile` (publish-schema.yml) and uses the npm CLI
// only for the publish step (Trusted Publishing + --provenance are
// npm-CLI-specific). The npm package-lock.json was dropped at 1.0.1,
// resurrected once (feature 26's F70 dual-lock sync, superseded on
// 2026-08-30 by the repo-wide bun-only decision), and is now rejected by this
// test and by the package's .gitignore. Lock-vs-manifest agreement is pinned
// in verification-gates.test.mjs; this file pins the one-lockfile policy.

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
    /"@gtrabanco\/agentic-workflow-schema"/,
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
