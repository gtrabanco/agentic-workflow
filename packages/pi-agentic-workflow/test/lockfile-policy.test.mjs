// lockfile-policy.test.mjs — every published spec must resolve outside this repo
//
// The workspace keeps ONE lockfile at the repository root (scripts/
// workspace-lock-policy.test.mjs owns its location and membership), so this
// file keeps the two policies that are still per-package: no npm
// package-lock.json on disk, and no local-only spec in the manifest that npm
// ships verbatim.
//
// A `file:`/`workspace:`/range spec in dependencies or devDependencies is a
// local-dev choice that cannot resolve outside this repository: every
// consumer's install fails on it (pi 0.15.0 shipped
// `@gtrabanco/agentic-workflow: file:../agentic-workflow` and broke every
// `pi update --all`). The workspace links the local package WITHOUT changing
// the spec — `npm publish` does not rewrite the `workspace:` protocol either —
// so the exact version below is both what CI installs locally and what every
// consumer receives. peerDependencies are excluded: they stay ranges by nature
// (AGENTS.md → Packages).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
