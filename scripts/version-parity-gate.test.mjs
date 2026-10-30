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
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  changedFilesSince,
  evaluateContent,
  evaluateContentAll,
  evaluatePins,
  isExactSemver,
  semverGt,
  changelogRowCount,
  contentTriggerPrefixes,
  packageDirs,
  localPackageVersions,
  PACKAGE_DIR,
  TRIGGER_PREFIXES,
} from "./version-parity-gate.mjs";

const PKG = "@gtrabanco/pi-agentic-workflow";
const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.resolve(REPO_ROOT, "..");

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
  const r = content(["packages/pi-agentic-workflow/package.json"], BASE_VERSION, 0);
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

// ---------------------------------------------------------------------------
// changeset route (feature 40, issue #180 / O23)
// ---------------------------------------------------------------------------

const INTENT = { file: ".changeset/the-change.md", ok: true, entries: [{ pkg: PKG, level: "minor" }], error: null };

function contentWithIntent(changedFiles, intent) {
  return evaluateContent({
    packageName: PKG,
    packageJsonPath: "packages/pi-agentic-workflow/package.json",
    triggerPrefixes: TRIGGER_PREFIXES,
    changedFiles,
    baseVersion: BASE_VERSION,
    headVersion: BASE_VERSION,
    changelogRowCount: 0,
    changesetIntent: intent,
  });
}

test("content: a changeset file declaring the package satisfies the content half (feature 40)", () => {
  const r = contentWithIntent(["skills/unit-lane/SKILL.md", ".changeset/the-change.md"], [INTENT]);
  assert.equal(r.ok, true);
  assert.equal(r.code, "changeset-intent");
  assert.match(r.message, /release\.mjs/);
});

test("content: a changeset file declaring a different package does NOT satisfy the gate", () => {
  const other = { ...INTENT, entries: [{ pkg: "@gtrabanco/agentic-workflow-schema", level: "patch" }] };
  const r = contentWithIntent(["skills/unit-lane/SKILL.md", ".changeset/the-change.md"], [other]);
  assert.equal(r.ok, false);
  assert.equal(r.code, "shipped-content-version");
});

test("content: a malformed changeset file fails closed (AC-16)", () => {
  const bad = { file: ".changeset/bad.md", ok: false, entries: [], error: "empty body — a release note needs words" };
  const r = contentWithIntent(["skills/unit-lane/SKILL.md", ".changeset/bad.md"], [bad]);
  assert.equal(r.ok, false);
  assert.equal(r.code, "changeset-invalid");
  assert.match(r.message, /bad\.md/);
});

test("content: no changeset intent keeps the historical rejection verbatim", () => {
  const r = contentWithIntent(["skills/unit-lane/SKILL.md"], []);
  assert.equal(r.ok, false);
  assert.equal(r.code, "shipped-content-version");
  assert.match(r.message, /Companion npm packages/);
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

test("the trigger set names the skills content source and the wiring constants stay pinned", () => {
  assert.deepEqual(TRIGGER_PREFIXES, ["skills/", "packages/pi-agentic-workflow/"]);
  assert.equal(PACKAGE_DIR, "packages/pi-agentic-workflow");
});

// ---------------------------------------------------------------------------
// multi-package content half — the gate covers EVERY package under packages/
// (derived from the tree at runtime, so a new package inherits the gate by
// existing); root skills/ is the content source of the Pi package only.
// ---------------------------------------------------------------------------

const SCHEMA = "@gtrabanco/agentic-workflow-schema";
const CRATE = "@gtrabanco/agentic-workflow";

function threePackages({ schema = {}, crate = {}, pi = {} } = {}) {
  const def = (name, dir, o) => ({
    packageName: name,
    packageJsonPath: `packages/${dir}/package.json`,
    triggerPrefixes: contentTriggerPrefixes(`packages/${dir}`),
    baseVersion: "1.0.0",
    headVersion: o.head ?? "1.0.0",
    changelogRowCount: o.rows ?? 0,
  });
  return [def(CRATE, "agentic-workflow", crate), def(SCHEMA, "agentic-workflow-schema", schema), def(PKG, "pi-agentic-workflow", pi)];
}

const declaring = (name, file = ".changeset/the-change.md") => ({
  file,
  ok: true,
  entries: [{ pkg: name, level: "patch" }],
  error: null,
});

function failing(r, name) {
  return r.results.find((x) => x.packageName === name);
}

test("content-all: a schema-only change without bump or changeset fails — the gate covers every package", () => {
  const r = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["packages/agentic-workflow-schema/src/index.ts"],
    changesetIntent: [],
  });
  assert.equal(r.ok, false);
  const schema = failing(r, SCHEMA);
  assert.equal(schema.code, "shipped-content-version");
  assert.match(schema.message, new RegExp(SCHEMA.replaceAll(".", "\\.")));
  assert.equal(failing(r, PKG).code, "no-triggered-change");
  assert.equal(failing(r, CRATE).code, "no-triggered-change");
});

test("content-all: a schema-only change with a changeset declaring schema passes", () => {
  const r = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["packages/agentic-workflow-schema/src/index.ts", ".changeset/schema.md"],
    changesetIntent: [declaring(SCHEMA, ".changeset/schema.md")],
  });
  assert.equal(r.ok, true);
  assert.equal(failing(r, SCHEMA).code, "changeset-intent");
});

test("content-all: skills trigger only the Pi package — a changeset declaring schema does not cover a skills change", () => {
  const r = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["skills/unit-lane/SKILL.md", ".changeset/schema.md"],
    changesetIntent: [declaring(SCHEMA, ".changeset/schema.md")],
  });
  assert.equal(r.ok, false);
  assert.equal(failing(r, PKG).code, "shipped-content-version");
  assert.equal(failing(r, SCHEMA).code, "no-triggered-change");
});

test("content-all: each package is judged independently — one bumped, one declared, one untouched passes", () => {
  const r = evaluateContentAll({
    packages: threePackages({ pi: { head: "1.1.0", rows: 1 } }),
    changedFiles: ["packages/pi-agentic-workflow/src/x.ts", "packages/agentic-workflow-schema/src/y.ts", ".changeset/schema.md"],
    changesetIntent: [declaring(SCHEMA, ".changeset/schema.md")],
  });
  assert.equal(r.ok, true, JSON.stringify(r.results.map((x) => [x.packageName, x.code])));
});

test("content-all: one failing package fails the whole gate", () => {
  const r = evaluateContentAll({
    packages: threePackages({ pi: { head: "1.1.0", rows: 1 } }),
    changedFiles: ["packages/agentic-workflow/src/index.ts", "packages/pi-agentic-workflow/src/x.ts"],
    changesetIntent: [],
  });
  assert.equal(r.ok, false);
  assert.equal(failing(r, CRATE).code, "shipped-content-version");
});

test("content-all: a malformed changeset fails closed even when it declares another package", () => {
  const bad = { file: ".changeset/bad.md", ok: false, entries: [], error: "empty body — a release note needs words" };
  const r = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["packages/agentic-workflow-schema/src/index.ts", ".changeset/bad.md"],
    changesetIntent: [bad],
  });
  assert.equal(r.ok, false);
  assert.equal(failing(r, SCHEMA).code, "changeset-invalid");
});

test("content-all: nothing triggered anywhere passes", () => {
  const r = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["docs/workflow/FEATURE_WORKFLOW.md"],
    changesetIntent: [],
  });
  assert.equal(r.ok, true);
  assert.equal(r.code, "no-triggered-change");
});

test("packageDirs derives every package under packages/ — a new package inherits the gate by existing", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gate-dirs-"));
  fs.mkdirSync(path.join(root, "packages/with-manifest"), { recursive: true });
  fs.writeFileSync(path.join(root, "packages/with-manifest/package.json"), "{}\n");
  fs.mkdirSync(path.join(root, "packages/without-manifest"), { recursive: true });
  fs.writeFileSync(path.join(root, "packages/loose-file.txt"), "x");
  assert.deepEqual(packageDirs(root), ["packages/with-manifest"]);
});

test("contentTriggerPrefixes: skills/ belongs only to the skills content source (the Pi package)", () => {
  assert.deepEqual(contentTriggerPrefixes("packages/pi-agentic-workflow"), ["skills/", "packages/pi-agentic-workflow/"]);
  assert.deepEqual(contentTriggerPrefixes("packages/agentic-workflow-schema"), ["packages/agentic-workflow-schema/"]);
  assert.deepEqual(contentTriggerPrefixes("packages/agentic-workflow"), ["packages/agentic-workflow/"]);
});

// The row count's heading must be scoped per package: "agentic-workflow" is a
// substring of both sibling package names, so a basename heading counts rows
// across all three companion tables.
test("changelogRowCount: the crate heading never counts the schema or pi tables", () => {
  assert.equal(changelogRowCount("4.8.0", "packages/agentic-workflow", CRATE), 0);
  assert.ok(changelogRowCount("4.8.0", "packages/agentic-workflow-schema", SCHEMA) >= 1);
  assert.equal(changelogRowCount("0.37.0", "packages/pi-agentic-workflow", PKG), 1);
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

// The rule is about the two manifests that actually ship, so the suite reads
// both sides from them: every exact pin a package under `packages/` declares on
// a sibling must name the version that sibling carries right now. A version
// typed into a test pins today's value and disagrees with the tree after the
// next release; this cannot, because it reads the manifests at run time.
test("pins: every exact pin on a local sibling names that sibling's current version", () => {
  const localVersions = localPackageVersions();
  assert.ok(Object.keys(localVersions).length > 0, "no package manifest was readable under packages/");
  // The registry is not this assertion's authority: a throwing fetcher keeps the
  // suite offline and pins the local half as the one under test (AC3's shape).
  const offline = () => {
    throw new Error("registry not consulted by this suite");
  };
  const results = packageDirs().map((dir) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(REPO_DIR, dir, "package.json"), "utf8"));
    return evaluatePins({
      packageName: manifest.name ?? dir,
      dependencies: manifest.dependencies ?? {},
      fetchLatest: offline,
      localVersions,
    });
  });
  assert.deepEqual(
    results.flatMap((r) => r.violations).map((v) => `${v.name}: pin ${v.pin} != local ${v.localVersion}`),
    [],
    "a shipped package pins a sibling at a version that package does not carry",
  );
  assert.ok(
    results.flatMap((r) => r.notices).length > 0,
    "no exact pin points at a local sibling — the assertion above would pass vacuously",
  );
});

// D-40-15: skills are the Pi package's shipped content — a changeset
// declaring a SKILL satisfies the Pi package's content half (and nothing else's).
test("content-all: a skill-declaring changeset satisfies the Pi package, not its siblings", () => {
  const intent = [{ file: ".changeset/skill.md", ok: true, entries: [{ pkg: "unit-lane", level: "patch", kind: "skill" }], error: null }];
  const r = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["skills/unit-lane/SKILL.md", ".changeset/skill.md"],
    changesetIntent: intent,
  });
  assert.equal(r.ok, true, JSON.stringify(r.results.map((x) => [x.packageName, x.code])));
  assert.equal(failing(r, PKG).code, "changeset-intent");
  assert.equal(failing(r, SCHEMA).code, "no-triggered-change");
  const schemaOnly = evaluateContentAll({
    packages: threePackages(),
    changedFiles: ["packages/agentic-workflow-schema/src/index.ts", ".changeset/skill.md"],
    changesetIntent: intent,
  });
  assert.equal(schemaOnly.ok, false, "a skill entry does not cover a schema-only change");
});
