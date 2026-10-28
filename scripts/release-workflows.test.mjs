#!/usr/bin/env node
/**
 * Workflow contract for the release pipeline (feature 40, issue #180).
 *
 * publish.yml — ONE consolidated publish workflow (D-40-12, owner-directed):
 * three publish jobs chained in dependency order (schema → crate → pi via
 * needs:), a shared channel dispatch input, and idempotent version gates.
 * The old publish-schema.yml / publish-agentic-workflow.yml /
 * publish-pi-package.yml are DELETED; re-registering the npm Trusted
 * Publisher records to publish.yml is the owner's one-time step (D-40-12).
 *
 * AC-04/AC-06: the channel input reaches every publish step as --tag.
 * AC-08: a skills-only merge cuts no npm publish — push paths name package
 * trees and the workflow file only, never skills/.
 * AC-05/AC-09: push-triggered runs publish as latest (differential).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISH = ".github/workflows/publish.yml";

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

test("publish.yml exists and the three per-package files are deleted (D-40-12)", () => {
  assert.ok(fs.existsSync(path.join(repoRoot, PUBLISH)), "publish.yml exists");
  for (const gone of [
    ".github/workflows/publish-schema.yml",
    ".github/workflows/publish-agentic-workflow.yml",
    ".github/workflows/publish-pi-package.yml",
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, gone)), false, `${gone} must be gone`);
  }
});

test("publish.yml exposes the shared channel dispatch input defaulting to latest (AC-04)", () => {
  const text = read(PUBLISH);
  assert.match(text, /workflow_dispatch:/);
  assert.match(text, /inputs:\s*\n\s*channel:\s*\n[\s\S]{0,400}?default:\s*latest/);
});

test("every publish job passes the channel as the npm dist-tag (AC-05/AC-06)", () => {
  const text = read(PUBLISH);
  const tags = [...text.matchAll(/npm publish --access public --provenance --tag "\$\{\{ inputs\.channel \|\| 'latest' \}\}"/g)];
  assert.equal(tags.length, 3, `expected exactly 3 publish steps (schema, crate, pi), saw ${tags.length}`);
});

test("push paths name the three package trees + the workflow file, never skills/ (AC-08)", () => {
  const text = read(PUBLISH);
  const on = text.slice(text.indexOf("on:"), text.indexOf("permissions:"));
  const paths = [...on.matchAll(/-\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    paths.sort(),
    [
      ".github/workflows/publish.yml",
      "packages/agentic-workflow-schema/**",
      "packages/agentic-workflow/**",
      "packages/pi-agentic-workflow/**",
    ].sort(),
  );
});

test("publish jobs chain in dependency order: pi waits for schema AND crate (D-40-10)", () => {
  const text = read(PUBLISH);
  assert.match(text, /pi-publish:\s*\n\s*needs:\s*\[schema-publish, crate-publish\]/);
  for (const job of ["schema-publish", "crate-publish", "pi-publish"]) {
    assert.match(text, new RegExp(`^\\s{2}${job}:`, "m"), `${job} exists`);
  }
});

test("each package has its own node-compat job and version gate (never publish red)", () => {
  const text = read(PUBLISH);
  for (const job of ["schema-node-compat", "crate-node-compat", "pi-node-compat"]) {
    assert.match(text, new RegExp(`^\\s{2}${job}:`, "m"), `${job} exists`);
  }
  const gates = [...text.matchAll(/npm-version-gate\.mjs/g)];
  assert.equal(gates.length, 3, "each publish job runs the exact-version gate");
});

test("push-triggered runs publish as latest (differential: current behavior)", () => {
  const text = read(PUBLISH);
  assert.match(text, /inputs\.channel \|\| 'latest'/);
});

test("the pi job keeps its mutation and tarball gates (the #164 publish-time guards)", () => {
  const text = read(PUBLISH);
  assert.match(text, /bun run mutation/);
  assert.match(text, /Tarball carries the skill bundle/);
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
