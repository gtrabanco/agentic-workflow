/**
 * version-parity-gate.test.mjs — offline, deterministic suite for
 * scripts/version-parity-gate.mjs (feature 75, issue #292).
 *
 * Covers the AC1/AC2 content matrix (trigger paths × version bumped ×
 * CHANGELOG companion row), the AC1 dependency-pin drift matrix, the AC3
 * degraded-when-unreachable behaviour, and the semver comparator. No network:
 * the registry fetcher is injected. No fixture repo: the content evaluator
 * takes the changed-file list and both versions as data.
 *
 * Run: node --test scripts/version-parity-gate.test.mjs
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  changedFilesSince,
  evaluateContent,
  evaluatePins,
  isExactSemver,
  semverGt,
  PACKAGE_DIR,
  TRIGGER_PREFIXES,
} from "./version-parity-gate.mjs";

const PKG = "@gtrabanco/pi-agentic-workflow";
const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

/** `git status --porcelain` entries of this repository — the dirty-tree fixture. */
function gitPorcelain() {
  const r = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return r.stdout.split("\n").filter(Boolean);
}

/** The committed range alone, read independently of the module under test. */
function gitCommittedSince(ref) {
  const r = spawnSync("git", ["diff", "--name-only", `${ref}...HEAD`], { cwd: REPO_ROOT, encoding: "utf8" });
  return r.stdout.split("\n").filter(Boolean);
}

// ---------------------------------------------------------------------------
// semver comparator
// ---------------------------------------------------------------------------

test("semverGt: major/minor/patch ordering", () => {
  assert.equal(semverGt("4.6.0", "4.5.0"), true);
  assert.equal(semverGt("4.5.0", "4.6.0"), false);
  assert.equal(semverGt("5.0.0", "4.99.99"), true);
  assert.equal(semverGt("0.19.1", "0.19.1"), false);
  assert.equal(semverGt("0.19.2", "0.19.1"), true);
});

test("semverGt: prerelease sorts below its release", () => {
  assert.equal(semverGt("4.6.0", "4.6.0-rc.1"), true);
  assert.equal(semverGt("4.6.0-rc.1", "4.6.0"), false);
  assert.equal(semverGt("4.6.0-rc.2", "4.6.0-rc.1"), true);
});

// ---------------------------------------------------------------------------
// exact-pin detection
// ---------------------------------------------------------------------------

test("isExactSemver accepts bare versions, rejects ranges and tags", () => {
  assert.equal(isExactSemver("4.5.0"), true);
  assert.equal(isExactSemver("0.19.1"), true);
  assert.equal(isExactSemver("4.6.0-beta.1"), true);
  assert.equal(isExactSemver("^4.5.0"), false);
  assert.equal(isExactSemver("~4.5.0"), false);
  assert.equal(isExactSemver(">=4.5.0"), false);
  assert.equal(isExactSemver("*"), false);
  assert.equal(isExactSemver("latest"), false);
  assert.equal(isExactSemver("file:../agentic-workflow"), false);
  assert.equal(isExactSemver("github:gtrabanco/agentic-workflow"), false);
});

// ---------------------------------------------------------------------------
// content mode (AC1, AC2, O1, O5)
// ---------------------------------------------------------------------------

const BASE_VERSION = "0.19.1";

function content(changedFiles, headVersion, changelogRowCount) {
  return evaluateContent({
    packageName: PKG,
    packageJsonPath: "packages/pi-agentic-workflow/package.json",
    triggerPrefixes: TRIGGER_PREFIXES,
    changedFiles,
    baseVersion: BASE_VERSION,
    headVersion,
    changelogRowCount,
  });
}

test("content: skills change without a version bump fails, naming the package and the CHANGELOG row", () => {
  const r = content(["skills/unit-lane/SKILL.md"], BASE_VERSION, 0);
  assert.equal(r.ok, false);
  assert.match(r.message, new RegExp(PKG.replaceAll(".", "\\.")));
  assert.match(r.message, /CHANGELOG/);
  assert.match(r.message, /version/);
});

test("content: package-tree change without a version bump fails (the #164 trigger set)", () => {
  const r = content(
    ["packages/pi-agentic-workflow/src/extension/index.ts"],
    BASE_VERSION,
    0,
  );
  assert.equal(r.ok, false);
  assert.match(r.message, new RegExp(PKG.replaceAll(".", "\\.")));
});

test("content: lockfile change under the package tree triggers the gate", () => {
  const r = content(["packages/pi-agentic-workflow/bun.lock"], BASE_VERSION, 0);
  assert.equal(r.ok, false);
});

test("content: skills change with a version bump and no CHANGELOG row fails on the row", () => {
  const r = content(["skills/audit-pr/SKILL.md"], "0.20.0", 0);
  assert.equal(r.ok, false);
  assert.match(r.message, /CHANGELOG/);
  assert.match(r.message, /0\.20\.0/);
});

test("content: skills change + version bump + CHANGELOG row passes", () => {
  const r = content(["skills/audit-pr/SKILL.md"], "0.20.0", 1);
  assert.equal(r.ok, true);
});

test("content: version bump with no triggered change passes without demanding a row", () => {
  const r = content(["AGENTS.md"], "0.20.0", 0);
  assert.equal(r.ok, true);
});

test("content: unrelated root script change passes", () => {
  const r = content(["scripts/phase-lint.mjs"], BASE_VERSION, 0);
  assert.equal(r.ok, true);
});

test("content: empty change set passes", () => {
  const r = content([], BASE_VERSION, 0);
  assert.equal(r.ok, true);
});

test("content: nested paths under both prefixes trigger", () => {
  assert.equal(
    content(["skills/unit-lane/references/IMPLEMENT.md"], BASE_VERSION, 0).ok,
    false,
  );
  assert.equal(
    content(
      ["packages/pi-agentic-workflow/test/alias-coverage.test.mjs"],
      BASE_VERSION,
      0,
    ).ok,
    false,
  );
});

test("content: similarly-named paths outside the trigger set do not trigger", () => {
  assert.equal(
    content(["packages/agentic-workflow-schema/src/index.ts"], BASE_VERSION, 0)
      .ok,
    true,
  );
  assert.equal(content(["docs/features/75-x/SPEC.md"], BASE_VERSION, 0).ok, true);
});

// The CLI half must see the work in progress, not only the work already
// committed: `git diff <base>...HEAD` is blind to an uncommitted tree, so a PR
// whose skills/package edits are still unstaged read as "no triggered change"
// and the gate passed exactly where it exists to enforce the bump.
test("changedFilesSince unions the uncommitted tree into the committed range", () => {
  const head = changedFilesSince("HEAD");
  const main = changedFilesSince("main");
  // The committed range against the current commit is empty by definition, so
  // anything `HEAD` names is working-tree work — the list a `...HEAD`-only diff
  // could never return.
  const dirty = gitPorcelain().map((entry) => entry.slice(3));
  assert.deepEqual(
    [...head].sort(),
    dirty.sort(),
    "changedFilesSince(HEAD) must equal the dirty tree, not an empty list",
  );
  assert.deepEqual(
    [...main].sort(),
    [...new Set([...gitCommittedSince("main"), ...dirty])].sort(),
    "the committed range and the working tree are unioned, never one instead of the other",
  );
});

// ---------------------------------------------------------------------------
// pins mode (AC1 registry half, AC3 degradation, O2, O3, D5)
// ---------------------------------------------------------------------------

function pins(deps, fetchLatest) {
  return evaluatePins({ packageName: PKG, dependencies: deps, fetchLatest });
}

test("pins: registry latest above the pin is a violation with the fix message", () => {
  const r = pins(
    { "@gtrabanco/agentic-workflow-schema": "4.5.0" },
    () => "4.6.0",
  );
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].message, /4\.5\.0/);
  assert.match(r.violations[0].message, /4\.6\.0/);
  assert.match(r.violations[0].message, /bump the pin \+ the package version in the same PR/);
});

test("pins: registry equal to the pin passes", () => {
  const r = pins(
    { "@gtrabanco/agentic-workflow-schema": "4.6.0" },
    () => "4.6.0",
  );
  assert.equal(r.violations.length, 0);
  assert.equal(r.degraded.length, 0);
});

test("pins: registry below the pin (unpublished rollback) is not a violation", () => {
  const r = pins({ "@gtrabanco/agentic-workflow-schema": "4.6.0" }, () => "4.5.0");
  assert.equal(r.violations.length, 0);
});

test("pins: fetch failure degrades with a visible notice, never a violation", () => {
  const r = pins(
    { "@gtrabanco/agentic-workflow-schema": "4.5.0" },
    () => {
      throw new Error("network ECONNREFUSED");
    },
  );
  assert.equal(r.violations.length, 0);
  assert.equal(r.degraded.length, 1);
  assert.match(r.degraded[0].message, /network ECONNREFUSED/);
  assert.match(r.degraded[0].message, /@gtrabanco\/agentic-workflow-schema/);
});

test("pins: a violation and a degradation can coexist; only violations fail the gate", () => {
  const r = pins(
    {
      "@gtrabanco/agentic-workflow-schema": "4.5.0",
      "@gtrabanco/agentic-workflow": "0.2.0",
    },
    (name) => {
      if (name === "@gtrabanco/agentic-workflow-schema") {
        throw new Error("ETIMEDOUT");
      }
      return "0.3.0";
    },
  );
  assert.equal(r.violations.length, 1);
  assert.equal(r.degraded.length, 1);
});

test("pins: non-exact specs are skipped with a notice (D5), not failed", () => {
  const r = pins({ "@earendil-works/pi-coding-agent": ">=0.99.1" }, () => "1.2.0");
  assert.equal(r.violations.length, 0);
  assert.equal(r.skipped.length, 1);
  assert.match(r.skipped[0].message, /not an exact pin/);
});

test("pins: an empty dependencies map passes", () => {
  const r = pins({}, () => "1.0.0");
  assert.equal(r.violations.length, 0);
});

// ---------------------------------------------------------------------------
// wiring constants
// ---------------------------------------------------------------------------

test("the trigger set is the closed AC2 list and the package dir is the Pi package", () => {
  assert.deepEqual(TRIGGER_PREFIXES, ["skills/", "packages/pi-agentic-workflow/"]);
  assert.equal(PACKAGE_DIR, "packages/pi-agentic-workflow");
});

// --- local-authority rule (the registry-vs-local bind): a pin whose target has
// --- a local package under packages/ is verified against the LOCAL version —
// --- the one this merge will publish — not only against npmjs.

function pinsLocal(deps, fetchLatest, localVersions) {
  return evaluatePins({ packageName: PKG, dependencies: deps, fetchLatest, localVersions });
}

test("pins: pin equal to the local version passes even when the registry is behind (same-PR release)", () => {
  const r = pinsLocal(
    { "@gtrabanco/agentic-workflow": "0.5.0" },
    () => "0.4.0",
    { "@gtrabanco/agentic-workflow": "0.5.0" },
  );
  assert.equal(r.violations.length, 0);
  assert.ok(r.notices.some((n) => /local package version/.test(n.message)));
});

test("pins: pin below the registry fails even when it matches the local version (local behind registry)", () => {
  const r = pinsLocal(
    { "@gtrabanco/agentic-workflow": "0.4.0" },
    () => "0.5.0",
    { "@gtrabanco/agentic-workflow": "0.4.0" },
  );
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].message, /registry published 0\.5\.0/);
});

test("pins: crate bumped in the same PR without the pin fails offline — the same-PR coupling is enforced", () => {
  const r = pinsLocal(
    { "@gtrabanco/agentic-workflow": "0.4.0" },
    () => "0.4.0",
    { "@gtrabanco/agentic-workflow": "0.5.0" },
  );
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].message, /local package version is 0\.5\.0/);
});

test("pins: pin ahead of the registry that matches no local version fails (points at a version that will never exist)", () => {
  const r = pinsLocal(
    { "@gtrabanco/agentic-workflow": "0.9.9" },
    () => "0.4.0",
    { "@gtrabanco/agentic-workflow": "0.5.0" },
  );
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].message, /neither published nor the local package version/);
});

test("pins: registry unreachable + pin != local version still fails (the local check is offline-deterministic)", () => {
  const r = pinsLocal(
    { "@gtrabanco/agentic-workflow": "0.4.0" },
    () => {
      throw new Error("network ECONNREFUSED");
    },
    { "@gtrabanco/agentic-workflow": "0.5.0" },
  );
  assert.equal(r.violations.length, 1);
  assert.equal(r.degraded.length, 1);
});

test("pins: registry unreachable + pin == local version is the degraded pass (AC3 preserved)", () => {
  const r = pinsLocal(
    { "@gtrabanco/agentic-workflow": "0.5.0" },
    () => {
      throw new Error("network ECONNREFUSED");
    },
    { "@gtrabanco/agentic-workflow": "0.5.0" },
  );
  assert.equal(r.violations.length, 0);
  assert.equal(r.degraded.length, 1);
});

test("pins: a dependency with no local sibling keeps the registry-only rule", () => {
  const r = pinsLocal(
    { "external-dep": "1.0.0" },
    () => "1.1.0",
    {},
  );
  assert.equal(r.violations.length, 1);
  assert.match(r.violations[0].message, /registry published 1\.1\.0/);
});
