// lockfile-policy.test.mjs — this package is bun-managed
//
// bun.lock is the sole lockfile and stays committed; CI installs with
// `bun install --frozen-lockfile` and uses the npm CLI only for the publish
// step (Trusted Publishing + --provenance are npm-CLI-specific). An npm
// package-lock.json on disk is drift: it rots silently next to bun.lock, and
// this exact file resurrected on main once already (the #150 merge) despite
// the schema package dropping its own at 1.0.1. The policy lives in
// AGENTS.md → Packages; the .gitignore rejects the file; this test fails the
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
    "package-lock.json resurrected — delete it; bun.lock is the sole lockfile (AGENTS.md → Packages)",
  );
});

// The published package.json ships verbatim. A `file:`/`workspace:`/range spec
// in dependencies or devDependencies is a local-dev choice that cannot resolve
// outside this repository: every consumer's install fails on it (pi 0.15.0
// shipped `@gtrabanco/agentic-workflow: file:../agentic-workflow` and broke
// every `pi update --all`). peerDependencies are excluded — they stay ranges
// by nature (AGENTS.md → Packages).
test("dependency specs are exact registry versions (publish-safe)", () => {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  const offenders = [];
  for (const section of ["dependencies", "devDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(spec)) {
        offenders.push(`${name}: ${spec} (${section})`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "non-registry or non-exact specs reach npm verbatim and break every consumer's install — " +
      "pin the exact registry version; the file:/workspace:/range form must never ship in " +
      "dependencies or devDependencies (AGENTS.md → Packages: versions are pinned)",
  );
});
