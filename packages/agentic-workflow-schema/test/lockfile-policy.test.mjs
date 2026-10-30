// lockfile-policy.test.mjs — this package is bun-managed
//
// bun is the only package manager and the npm CLI is used for the publish step
// only (Trusted Publishing + --provenance are npm-CLI-specific). The workspace
// keeps ONE lockfile at the repository root — scripts/
// workspace-lock-policy.test.mjs owns its location and membership, and this
// package needs no lock of its own: a package-local lock would resolve the
// sibling packages from the registry instead of from the folder. The npm
// package-lock.json was dropped at 1.0.1, resurrected once (feature 26's F70
// dual-lock sync, superseded on 2026-08-30 by the repo-wide bun-only
// decision), and is now rejected by this test and by the package's .gitignore.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

test("package-lock.json must not exist (bun is the sole package manager)", () => {
  assert.equal(
    existsSync(join(PKG_DIR, "package-lock.json")),
    false,
    "package-lock.json resurrected — delete it; bun is the only package manager (AGENTS.md → Packages)",
  );
});
