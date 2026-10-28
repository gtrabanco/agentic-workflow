#!/usr/bin/env node
/**
 * Workflow contract for the release pipeline (feature 40, issue #180).
 *
 * AC-04/AC-06: every publish workflow exposes a `channel` workflow_dispatch
 * input (default `latest`) and passes `--tag <channel>` to npm publish —
 * dist-tags without renaming any workflow file (the npm Trusted Publisher
 * records bind to the filenames, PE-008).
 * AC-08: a skills-only merge cuts no npm canary — the push triggers' paths
 * name package trees and the workflow file only, never `skills/`.
 * AC-05/AC-09 differential: push-triggered runs keep the current default
 * (`latest` at the repo version), so existing behavior is byte-preserved.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS = [
  ".github/workflows/publish-schema.yml",
  ".github/workflows/publish-pi-package.yml",
  ".github/workflows/publish-agentic-workflow.yml",
];

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

test("every publish workflow exposes a channel dispatch input defaulting to latest (AC-04)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    assert.match(text, /workflow_dispatch:/, `${rel} keeps workflow_dispatch`);
    const inputBlock = text.slice(text.indexOf("workflow_dispatch:"));
    assert.match(
      inputBlock,
      /inputs:\s*\n\s*channel:\s*\n[\s\S]{0,400}?default:\s*latest/,
      `${rel} declares a channel input with default latest`,
    );
  }
});

test("the publish step passes the channel as the npm dist-tag (AC-05/AC-06)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    assert.match(
      text,
      /npm publish --access public --provenance --tag "?\$\{\{[^}]*channel/,
      `${rel} passes --tag from the channel input`,
    );
  }
});

test("push triggers name package paths only — a skills-only merge cuts no npm release (AC-08)", () => {
  const text = read(WORKFLOWS[0]); // only the schema workflow still triggers on push
  const on = text.slice(text.indexOf("on:"), text.indexOf("permissions:"));
  const paths = [...on.matchAll(/-\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(paths.length > 0, "the schema workflow has push paths");
  for (const p of paths) {
    assert.doesNotMatch(p, /^skills\//, `push path "${p}" must not be a skills/ path`);
  }
});

// Dependency closure + publish order (owner-directed): pi pins the crate and
// the schema exactly, so its install needs both on the registry — the chain
// schema → crate → pi serializes publication without renaming any workflow
// (the npm Trusted Publisher records bind the filenames).
const CHAIN = [
  [".github/workflows/publish-agentic-workflow.yml", "Publish schema package"],
  [".github/workflows/publish-pi-package.yml", "Publish runner crate"],
];

test("the publish chain runs in dependency order: schema → crate → pi (workflow_run)", () => {
  for (const [rel, upstream] of CHAIN) {
    const text = read(rel);
    const on = text.slice(text.indexOf("on:"), text.indexOf("permissions:"));
    assert.match(on, /workflow_run:/, `${rel} triggers on its upstream`);
    assert.match(on, new RegExp(`workflows:\\s*(\\[|\\n\\s*-)\\s*"?${upstream}`), `${rel} waits for "${upstream}"`);
    assert.doesNotMatch(on, /\n\s+push:/, `${rel} no longer triggers on push (the chain orders it)`);
  }
});

test("workflow_run-triggered publishes only run after a successful upstream", () => {
  for (const [rel] of CHAIN) {
    const text = read(rel);
    assert.match(text, /workflow_run\.conclusion == 'success'/, `${rel} guards on the upstream conclusion`);
  }
});

test("the head of the chain (schema) keeps its push and dispatch triggers", () => {
  const text = read(WORKFLOWS[0]);
  const on = text.slice(text.indexOf("on:"), text.indexOf("permissions:"));
  assert.match(on, /push:/);
  assert.match(on, /workflow_dispatch:/);
});

test("push-triggered runs publish at the repo version as latest (differential: current behavior)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    // the tag falls back to latest when no dispatch input exists (push runs)
    assert.match(text, /inputs\.channel\s*\|\|\s*'latest'|inputs\.channel \|\| 'latest'/, `${rel} falls back to latest`);
  }
});

test("no publish workflow file is renamed (Trusted Publisher binding intact, S4/PE-008)", () => {
  for (const rel of WORKFLOWS) assert.ok(fs.existsSync(path.join(repoRoot, rel)), `${rel} exists`);
});

// ---------------------------------------------------------------------------
// release-plan.yml — the read-only suggestion GHA (feature 40 follow-up)
// ---------------------------------------------------------------------------

const PLAN_WORKFLOW = ".github/workflows/release-plan.yml";

test("release-plan.yml exists and is dispatch-only (the operator launches it)", () => {
  const text = read(PLAN_WORKFLOW);
  assert.match(text, /workflow_dispatch:/);
  assert.doesNotMatch(text, /\n\s+push:/, "the plan workflow never runs on push");
});

test("release-plan.yml is read-only: no publish, no apply, no git push (suggestion only)", () => {
  const text = read(PLAN_WORKFLOW);
  assert.doesNotMatch(text, /npm publish/);
  assert.doesNotMatch(text, /release\.mjs apply/);
  assert.doesNotMatch(text, /git push/);
  assert.doesNotMatch(text, /gh release create/);
});

test("release-plan.yml suggests both the stable train and the canary version", () => {
  const text = read(PLAN_WORKFLOW);
  assert.match(text, /release\.mjs plan(?! apply)/, "runs the plan");
  const canary = text.indexOf("--channel canary");
  const stable = text.search(/release\.mjs plan/);
  assert.ok(stable !== -1 && canary > stable, "both channels are planned");
  assert.match(text, /GITHUB_STEP_SUMMARY/, "the suggestion lands in the run summary");
});

test("release-plan.yml accepts a forced-version preview input (D-40-4 preview)", () => {
  const text = read(PLAN_WORKFLOW);
  assert.match(text, /inputs:\s*\n\s*version:/, "a version input exists");
  assert.match(text, /FORCE_VERSION/, "the input reaches the plan via env (no injection)");
});

// ---------------------------------------------------------------------------
// release-train.yml — the apply GHA: one launch = one release train
// ---------------------------------------------------------------------------

const TRAIN_WORKFLOW = ".github/workflows/release-train.yml";

test("release-train.yml is dispatch-only with a contents:write permission", () => {
  const text = read(TRAIN_WORKFLOW);
  assert.match(text, /workflow_dispatch:/);
  assert.doesNotMatch(text, /\n\s+push:/, "the train is never cut by a push");
  assert.match(text, /contents:\s*write/, "it commits, tags and opens the release");
});

test("release-train.yml applies the train (versions + pins + changelog), never publishes npm", () => {
  const text = read(TRAIN_WORKFLOW);
  assert.match(text, /release\.mjs apply/);
  assert.doesNotMatch(text, /npm publish/, "publishing stays in the publish chain");
});

test("release-train.yml refreshes the lockfiles after the pins moved", () => {
  const text = read(TRAIN_WORKFLOW);
  assert.match(text, /bun install/, "frozen lockfiles would fail CI otherwise");
});

test("release-train.yml adds exactly one release commit, pushes, tags and opens the release", () => {
  const text = read(TRAIN_WORKFLOW);
  assert.match(text, /git commit -m "chore\(release\)/);
  assert.match(text, /git push/);
  assert.match(text, /git tag "v\$/);
  assert.match(text, /refs\/heads\/stable/);
  assert.match(text, /gh release create "v\$VERSION" --generate-notes/);
  assert.match(text, /release-notes/, "the notes come from release.mjs release-notes");
});

test("release-train.yml accepts a forced-version input carried via env (D-40-4)", () => {
  const text = read(TRAIN_WORKFLOW);
  assert.match(text, /inputs:\s*\n\s*version:/);
  assert.match(text, /FORCE_VERSION/);
});
