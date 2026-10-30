// lockfile-policy.test.mjs — every published spec must resolve outside this repo
//
// The workspace keeps ONE lockfile at the repository root (scripts/
// workspace-lock-policy.test.mjs owns its location and membership), so this
// file keeps the two policies that are still per-package: no npm
// package-lock.json on disk, and no local-only or floating spec in the manifest
// that npm ships verbatim.
//
// A `file:`/`link:`/`git+`/`workspace:` spec is a local-dev choice that cannot
// resolve outside this repository: every consumer's install fails on it (pi
// 0.15.0 shipped `@gtrabanco/agentic-workflow: file:../agentic-workflow` and
// broke every `pi update --all`). The workspace links the local package WITHOUT
// changing the spec — `npm publish` does not rewrite the `workspace:` protocol
// either — so the version below is both what CI installs locally and what every
// consumer receives. A partial pin (`6`, `6.0`) is allowed and is a decision a
// reviewer weighs; `^`, `~`, `*`, `latest`, dist-tags and `x` ranges are not,
// because they let a fresh resolution install code nobody reviewed
// (AGENTS.md → Packages).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

/** A full release or a deliberate partial pin (`6`, `6.0`). */
const PINNED_SPEC = /^\d+(?:\.\d+){0,2}(?:[-+][0-9A-Za-z.-]+)?$/;

test("package-lock.json must not exist (bun is the sole package manager)", () => {
  assert.equal(
    existsSync(join(PKG_DIR, "package-lock.json")),
    false,
    "package-lock.json resurrected — delete it; bun is the only package manager (AGENTS.md → Packages)",
  );
});

test("dependency specs are pinned registry versions (publish-safe)", () => {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  // A full release or a deliberate partial pin (`6`, `6.0`) resolves anywhere;
  // a floating spec (`^`, `~`, `*`, `latest`, `6.x`) or a local protocol ships
  // verbatim and either breaks a consumer or installs unreviewed bytes.
  const offenders = [];
  for (const section of ["dependencies", "devDependencies"]) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (!PINNED_SPEC.test(spec)) offenders.push(`${name}: ${spec} (${section})`);
    }
  }
  assert.ok(
    Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length > 0,
    "the manifest declares no dependency — the assertion above would pass vacuously",
  );
  assert.deepEqual(
    offenders,
    [],
    "floating and local-only specs reach npm verbatim — pin a full release or a deliberate partial " +
      "pin with its reason in review; `^`/`~`/`*`/`latest`/`x`/`file:`/`link:`/`workspace:`/`git+` " +
      "never ship in dependencies or devDependencies (AGENTS.md → Packages: versions are pinned)",
  );
});

test("the pinned-spec rule separates deliberate pins from floating and local ones", () => {
  for (const spec of ["6", "6.0", "6.0.3", "6.0.3-rc.1"]) {
    assert.ok(PINNED_SPEC.test(spec), `refused a deliberate pin: ${spec}`);
  }
  for (const spec of ["^6.0.3", "~6.0.3", "*", "latest", "next", "6.x", "file:../crate", "workspace:*", "link:../x", "git+https://example/x"]) {
    assert.ok(!PINNED_SPEC.test(spec), `accepted a floating or local spec: ${spec}`);
  }
});
