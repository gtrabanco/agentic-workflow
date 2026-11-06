#!/usr/bin/env node

/**
 * risk-tier-classifier.test.mjs — the computed risk-tier classifier (issue #360).
 *
 * The issue's own reproducer corpus, frozen before the module existed:
 *
 *   F1  no script computes a tier      — `import('./scripts/risk-tiers.mjs')` fails
 *                                        `ERR_MODULE_NOT_FOUND` at the base commit
 *   F2  prose-only change pays full ceremony — a docs-only change must classify
 *                                        `passive`, a comment-only edit included
 *   F3  an auth change hides behind the same ceremony — it must classify `high`
 *                                        and carry a *named* high-risk item
 *   F4  a mixed change falls to the cheap tier — it must fail closed upward
 *   F5  file counts decide — a 400-file prose change and a 1-file auth change
 *                                        must classify `passive` and `high`
 *   F6  a model could invent a token — every emitted token must be a member of
 *                                        the published vocabulary
 *
 * Nothing here reads the model's opinion: `classifyTier()` takes paths and file
 * contents, and every expectation is a repo fact. `RISK_TIER_BASE` re-points the
 * F1 case at a base-commit tree so the red half is reproducible without editing
 * this file.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULE = path.join(ROOT, "scripts", "risk-tiers.mjs");

/**
 * The classifier under test, loaded once; F1 owns the case where it is absent.
 * The closed vocabulary is read from its one home — the schema package's
 * published consts — never from the classifier's own re-export, so a drifted
 * second copy could not pass by agreeing with itself.
 */
const load = async () => import(pathToFileURL(MODULE).href);
const published = (name) =>
  import(pathToFileURL(path.join(ROOT, "packages", "agentic-workflow-schema", "src", "vocabularies.ts")).href).then((m) => m[name]);

const { classifyTier, taskSizeOf } = await load().catch(() => ({}));
const RISK_TIER_KINDS = await published("RISK_TIER_KINDS").catch(() => []);
const RISK_TIER_SIGNAL_KINDS = await published("RISK_TIER_SIGNAL_KINDS").catch(() => []);
const RISK_TIER_REASONS = await published("RISK_TIER_REASONS").catch(() => []);

/**
 * A working tree of `{path → contents}` with no git and no index. The classifier
 * takes the `Map` or a plain object alike; `treeOf` keeps fixtures terse.
 */
function treeOf(files) {
  return new Map(Object.entries(files));
}

const prose = (n = 20) => Array.from({ length: n }, (_, i) => `Line ${i + 1} of prose with no executable effect.`).join("\n");

// ---------------------------------------------------------------------------
// F1 — the frozen failure: no script computed a tier at the base commit
// ---------------------------------------------------------------------------

test("F1 frozen corpus: the classifier module exists and loads (base commit: ERR_MODULE_NOT_FOUND)", () => {
  const base = process.env.RISK_TIER_BASE ? path.resolve(process.env.RISK_TIER_BASE) : null;
  if (base) {
    const probe = spawnSync(process.execPath, ["-e", "import('./scripts/risk-tiers.mjs').then(() => console.log('present'))"], {
      cwd: base,
      encoding: "utf8",
    });
    assert.notEqual(probe.status, 0, "at the base commit the module must be absent");
    assert.match(probe.stderr, /ERR_MODULE_NOT_FOUND/, "the base-commit failure is the issue's own reproducer");
    return;
  }
  assert.ok(fs.existsSync(MODULE), "scripts/risk-tiers.mjs is the classifier's one home");
  assert.equal(typeof classifyTier, "function", "classifyTier is exported");
  assert.equal(typeof taskSizeOf, "function", "taskSizeOf is exported");
});

// ---------------------------------------------------------------------------
// F2 / S5 — passive: documentation, images, comments, prose with no effect
// ---------------------------------------------------------------------------

test("F2 a docs-only change classifies passive with no ceremony owed", () => {
  const verdict = classifyTier(treeOf({
    "docs/workflow/SETUP.md": prose(),
    "README.md": "# Project\n\nUsage prose.\n",
  }));
  assert.equal(verdict.tier, "passive", "prose-only files carry no executable effect");
  assert.deepEqual(verdict.signals, [], "a passive change names no high-risk item");
  assert.equal(verdict.task_size.ceremony, "none", "the passive task size owes no unit-doc ceremony");
  assert.equal(verdict.task_size.verification, "readback", "passive verification is a structural readback");
});

test("F2b an image and a comment-only source edit are still passive", () => {
  const verdict = classifyTier(treeOf({
    "docs/diagrams/lane-flow.png": "\u0089PNG\r\n\u001a\n\u0000",
    "scripts/unit-route.mjs": "// Only the comment changed.\n// And this line.\n",
  }));
  assert.equal(verdict.tier, "passive", "a comment-only edit has no executable effect even in a script");
  assert.match(verdict.reason, /no executable effect/, "the reason states why the executable-extension file is passive");
});

test("F2c a deleted prose file is passive, and a rename of prose is passive", () => {
  assert.equal(classifyTier(treeOf({ "docs/OLD.md": prose() }), { deleted: ["docs/OLD.md"] }).tier, "passive");
  assert.equal(classifyTier(treeOf({ "docs/NEW.md": prose() }), { deleted: [], renamed: [{ from: "docs/OLD.md", to: "docs/NEW.md" }] }).tier, "passive");
});

// ---------------------------------------------------------------------------
// F3 / S5 — high: a *named* high-risk item, never a bare tier
// ---------------------------------------------------------------------------

test("F3 an auth change classifies high and names the high-risk item", () => {
  const verdict = classifyTier(treeOf({
    "skills/init-workspace/references/AUTH_POLICY.md": prose(6),
  }));
  assert.equal(verdict.tier, "high", "a path under an auth surface is high");
  assert.deepEqual(verdict.signals.map((s) => s.signal), ["auth"], "the high tier names its signal");
  assert.equal(verdict.signals[0].path, "skills/init-workspace/references/AUTH_POLICY.md", "the signal names the path that raised it");
  assert.equal(verdict.task_size.verification, "review-change");
});

test("F3b CI and publish surfaces, and a security floor, are each high", () => {
  const cases = [
    [{ ".github/workflows/root-suite.yml": "name: root-suite\non: push\n" }, "ci"],
    [{ "scripts/release.mjs": "export const x = 1;\n" }, "publish"],
    [{ "packages/agentic-workflow/src/path-policy.mjs": "export const GUARD = 1;\n" }, "security"],
    [{ "skills/init-workspace/references/AUTH.md": prose(4) }, "auth"],
  ];
  for (const [files, signal] of cases) {
    const verdict = classifyTier(treeOf(files));
    assert.equal(verdict.tier, "high", `${Object.keys(files)[0]} classifies high`);
    assert.deepEqual(verdict.signals.map((s) => s.signal), [signal], `${Object.keys(files)[0]} names '${signal}'`);
  }
});

test("F3d the destructive signal is a destructive operation, never a path name and never scratch cleanup", () => {
  const destructive = [
    `${"rmSync"}(buildDir);`,
    `${"rmdirSync"}(cacheDir, { recursive: true });`,
    `${"rm"} --recursive --force build/`,
    `DELETE ${"FROM"} users WHERE id = 7;`,
    `TRUNCATE ${"TABLE"} users;`,
  ];
  for (const source of destructive) {
    assert.deepEqual(classifyTier(treeOf({ "scripts/maintenance.mjs": source })).signals.map((s) => s.signal), ["destructive"],
      `${source} is destructive`);
  }
  const notDestructive = [
    `${"rmSync"}(scratch, { recursive: true, force: true });`,
    `${"rmSync"}(scratch, { force: true, recursive: true });`,
    "const label = 'delete a row from the docs';",
    "// page counts stay bounded: truncation is not a risk",
  ];
  for (const source of notDestructive) {
    const verdict = classifyTier(treeOf({ "scripts/maintenance.mjs": source }));
    assert.deepEqual(verdict.signals, [], `${source} is not a destructive operation`);
    // A comment-only edit is passive by the F2b rule; a source line is standard.
    const expected = /^\s*\/\//.test(source) ? "passive" : "standard";
    assert.equal(verdict.tier, expected, "no destructive signal, no raised tier");
  }
  assert.equal(classifyTier(treeOf({ "docs/delete-a-row.md": prose(3) })).tier, "passive",
    "a prose path named for deletion is prose");
  assert.equal(classifyTier(treeOf({ "AGENTS.md": "Never run a force push.\n" })).tier, "passive",
    "a doc is a doc: prose executes nothing, so description alone is not destructive");
});

test("F3e every named signal and reason is a member of the published vocabulary", () => {
  assert.deepEqual([...RISK_TIER_KINDS], ["passive", "standard", "high"]);
  assert.ok(RISK_TIER_SIGNAL_KINDS.length >= 5, "the signal vocabulary is closed and non-empty");
  for (const [files] of [[{ "scripts/release.mjs": "x\n" }], [{ "docs/a.md": prose() }], [{ "scripts/a.mjs": "export const a = 1;\n" }]]) {
    const verdict = classifyTier(treeOf(files));
    assert.ok(RISK_TIER_KINDS.includes(verdict.tier), `${verdict.tier} is a published tier`);
    assert.ok(RISK_TIER_REASONS.includes(verdict.reason_kind), `${verdict.reason_kind} is a published reason`);
    for (const s of verdict.signals) assert.ok(RISK_TIER_SIGNAL_KINDS.includes(s.signal), `${s.signal} is a published signal`);
  }
});

// ---------------------------------------------------------------------------
// F4 — fail closed upward
// ---------------------------------------------------------------------------

test("F4 a mixed change never collapses to passive; it escalates and names the path that forced it", () => {
  const verdict = classifyTier(treeOf({
    "docs/workflow/SETUP.md": prose(),
    "scripts/risk-tiers.mjs": "export function classifyTier() {}\n",
  }));
  assert.equal(verdict.tier, "standard", "an executable change beside prose is at least standard");
  assert.equal(verdict.reason_kind, "executable-content", "the reason names the executable content");
  assert.ok(verdict.paths.escalating.includes("scripts/risk-tiers.mjs"), "the escalating path is named");

  const high = classifyTier(treeOf({
    "docs/workflow/SETUP.md": prose(),
    "scripts/release.mjs": "export const x = 1;\n",
  }));
  assert.equal(high.tier, "high", "a high-risk path beside prose still wins");

  assert.equal(classifyTier(treeOf({})).tier, "standard", "an empty change never falls to the cheap tier");
  assert.equal(classifyTier(treeOf({}), { force: ["unknown-surface.xyz"] }).tier, "standard", "an unknown path never falls to passive");
});

// ---------------------------------------------------------------------------
// F5 / S2 — file counts never decide
// ---------------------------------------------------------------------------

test("F5 file counts never decide: 400 prose files are passive, 1 auth file is high", () => {
  const many = {};
  for (let i = 0; i < 400; i += 1) many[`docs/notes/note-${i}.md`] = prose(3);
  const wide = classifyTier(treeOf(many));
  assert.equal(wide.tier, "passive", "four hundred prose files are still prose");
  assert.equal(wide.paths.changed.length, 400, "the count is reported, never read");

  const narrow = classifyTier(treeOf({ "skills/init-workspace/references/AUTH_POLICY.md": prose(3) }));
  assert.equal(narrow.tier, "high", "one auth file outweighs four hundred prose files");
  assert.equal(narrow.paths.changed.length, 1);
});

test("F5b the Task Size carries all three signals the issue defines, derived from paths and contents", () => {
  const verdict = classifyTier(treeOf({ "scripts/risk-tiers.mjs": "export const a = 1;\n" }));
  assert.deepEqual(Object.keys(verdict.task_size).sort(), ["ceremony", "contained_risk", "resumable_from_diff", "understood", "verification"].sort(),
    "Task Size = Understood + Contained risk + Resumable-from-diff, each a field");
  assert.equal(verdict.task_size.understood, true);
  assert.equal(verdict.task_size.contained_risk, "contained");
  assert.equal(verdict.task_size.resumable_from_diff, true, "a path-level change is resumable from the diff");
  assert.equal(taskSizeOf("passive").ceremony, "none");
  assert.equal(taskSizeOf("standard").ceremony, "unit-doc");
  assert.equal(taskSizeOf("high").ceremony, "unit-doc+review-change");
  assert.throws(() => taskSizeOf("turbo"), /unknown risk tier/, "an off-vocabulary tier is refused, never guessed");
});

// ---------------------------------------------------------------------------
// F6 — determinism
// ---------------------------------------------------------------------------

test("F6 the same tree yields byte-identical output (the classifier is deterministic)", () => {
  const files = { "scripts/workflow-status.mjs": "export const x = 1;\n", "docs/a.md": prose() };
  const a = JSON.stringify(classifyTier(treeOf(files)));
  const b = JSON.stringify(classifyTier(treeOf(files)));
  assert.equal(a, b, "same input → same output");
  const reordered = treeOf(Object.fromEntries(Object.entries(files).reverse()));
  assert.equal(JSON.stringify(classifyTier(reordered)), a, "input order never changes the verdict");
});

/**
 * The dependency rule the classifier's purity rests on: every import is a
 * `node:` builtin or a repository-relative module, never a third-party package.
 *
 * The original form of this case asserted `node:` only, over *single-line*
 * imports — and the schema-vocabulary import is multi-line, so the rule held by
 * formatting rather than by the invariant it names (unit 384). It is checked in
 * both forms now, and a repository-relative module is allowed because the
 * capability analysis lives beside the classifier (issue #384 S3, S8).
 */
const FOREIGN_SPECIFIER = /from\s+"([^"]+)"/g;

function foreignSpecifiers(source) {
  return [...source.matchAll(FOREIGN_SPECIFIER)]
    .map((match) => match[1])
    .filter((specifier) => !specifier.startsWith("node:") && !specifier.startsWith("."));
}

test("F6b there is no wall-clock, no environment and no network in the verdict", () => {
  const source = fs.readFileSync(MODULE, "utf8");
  assert.deepEqual(foreignSpecifiers(source), [],
    "every import is a node: builtin or a repository-relative module");
  assert.doesNotMatch(source, /Date\.now|new Date\(|process\.env|fetch\(/, "no clock, environment read or network call");
  // Not vacuous: a third-party specifier is refused in either form.
  assert.deepEqual(foreignSpecifiers('import { x } from "lodash";\n'), ["lodash"]);
  assert.deepEqual(foreignSpecifiers('import {\n  y,\n} from "@scope/pkg";\n'), ["@scope/pkg"]);
});
