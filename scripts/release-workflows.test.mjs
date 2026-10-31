#!/usr/bin/env node
/**
 * Workflow contract for the release pipeline (feature 40, issue #180).
 *
 * publish.yml is THE single release entry point (D-40-13, owner-directed):
 * everything runs through scripts/release.mjs in CI —
 *   dispatch mode: suggest → read-only plan (stable + canary) to the summary;
 *   dispatch mode: cut + channel: stable → apply the train, one commit, tag,
 *       stable, GitHub Release (never npm publish — the push fires the jobs);
 *   dispatch mode: cut + channel: canary → publish the declared packages at
 *       the canary version under that dist-tag (repo untouched);
 *   push → the publish jobs publish the committed versions as latest, in
 *       dependency order, each idempotent through the exact-version gate.
 * The channel set is CLOSED: stable + canary — nothing else (owner decision,
 * post-#180 follow-up; the npm dist-tag for stable remains `latest`).
 * release-plan.yml and release-train.yml are DELETED (folded into modes).
 * The npm Trusted Publisher records are bound to publish.yml (D-40-12).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISH = ".github/workflows/publish.yml";

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

/** The YAML block of one top-level job (from its key to the next at 2-space indent). */
function jobBlock(text, job) {
  const start = text.indexOf(`\n  ${job}:`);
  assert.ok(start !== -1, `job ${job} exists`);
  const rest = text.slice(start + 1);
  const next = rest.slice(1).search(/\n  \S/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

test("publish.yml is the single entry point; the mode workflows and the per-package trio are deleted", () => {
  assert.ok(fs.existsSync(path.join(repoRoot, PUBLISH)));
  for (const gone of [
    ".github/workflows/release-plan.yml",
    ".github/workflows/release-train.yml",
    // D-40-12: the consolidated publish.yml replaced the per-package trio too.
    ".github/workflows/publish-schema.yml",
    ".github/workflows/publish-agentic-workflow.yml",
    ".github/workflows/publish-pi-package.yml",
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, gone)), false, `${gone} must be gone`);
  }
});

test("the dispatch exposes mode (suggest|cut), a CLOSED channel choice and version inputs", () => {
  const text = read(PUBLISH);
  assert.match(text, /mode:\s*\n[\s\S]{0,300}?- suggest\n\s*- cut/);
  const channel = text.slice(text.indexOf("      channel:"), text.indexOf("      version:"));
  assert.match(channel, /type: choice/, "the channel is a closed set, not a free string");
  assert.match(channel, /- stable/);
  assert.match(channel, /- canary/);
  assert.doesNotMatch(channel, /- (latest|alpha|beta|rc)\b/, "no retired or manual channels on the menu");
  assert.match(text, /version:/);
});

test("the suggest mode is read-only: plan for stable + canary into the run summary", () => {
  const block = jobBlock(read(PUBLISH), "suggest");
  assert.match(block, /release\.mjs plan( --version)? --channel stable/);
  assert.match(block, /--channel canary/);
  assert.match(block, /GITHUB_STEP_SUMMARY/);
  assert.doesNotMatch(block, /npm publish/);
  assert.doesNotMatch(block, /release\.mjs apply/);
});

test("cut + stable applies the train, adds one commit, tags and releases — never npm publish", () => {
  const block = jobBlock(read(PUBLISH), "cut");
  assert.match(block, /inputs\.channel == 'stable'/, "the train cuts on the stable channel");
  assert.match(block, /release\.mjs apply( --version)?/);
  assert.match(block, /bun install/, "lockfiles refresh after the pins moved");
  assert.match(block, /git commit -m "chore\(release\)/);
  assert.match(block, /git tag "v\$VERSION"/);
  assert.match(block, /refs\/heads\/stable/);
  assert.match(block, /gh release create "v\$VERSION" --generate-notes/);
  assert.doesNotMatch(block, /npm publish/, "the push fires the publish jobs, this job never touches npm");
});

test("cut + canary publishes the declared packages at the canary version, gated and tagged", () => {
  const block = jobBlock(read(PUBLISH), "cut-prerelease");
  assert.match(block, /inputs\.channel == 'canary'/, "the canary channel is the only prerelease route");
  assert.match(block, /release\.mjs publish-plan --channel/);
  assert.match(block, /npm-version-gate\.mjs/, "the exact-version gate guards every publish");
  assert.match(block, /npm publish --access public --provenance --tag "\$tag"/);
  assert.match(block, /git checkout -- package\.json/, "the repo is restored after the temp version");
  assert.match(block, /git tag "v\$V"/, "the tag is the canary counter's input");
});

test("the publish jobs run only on push events (a dispatch run never publishes stale checkouts)", () => {
  const text = read(PUBLISH);
  for (const job of ["schema-publish", "crate-publish", "pi-publish", "schema-node-compat", "crate-node-compat", "pi-node-compat"]) {
    const block = jobBlock(text, job);
    assert.match(block, /if: github\.event_name == 'push'/, `${job} is push-only`);
  }
});

test("publish jobs chain in dependency order: pi waits for schema AND crate (D-40-10)", () => {
  const text = read(PUBLISH);
  const piBlock = jobBlock(text, "pi-publish");
  assert.match(piBlock, /needs:\s*\[schema-publish, crate-publish\]/);
});

test("each package has its own node-compat job and version gate (never publish red)", () => {
  const text = read(PUBLISH);
  for (const job of ["schema-node-compat", "crate-node-compat", "pi-node-compat"]) {
    assert.match(text, new RegExp(`^\\s{2}${job}:`, "m"));
  }
  assert.equal([...text.matchAll(/npm-version-gate\.mjs/g)].length, 4, "3 publish jobs + the cut-prerelease loop");
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

test("the pi job keeps its mutation and tarball gates (the #164 publish-time guards)", () => {
  const block = jobBlock(read(PUBLISH), "pi-publish");
  assert.match(block, /bun run mutation/);
  assert.match(block, /Tarball carries the skill bundle/);
});

// The notes are assembled from the accumulated changeset bodies — and apply
// CONSUMES those files (the release commit records the consumption), so a
// notes file generated after apply is empty and the release body loses them.
test("the release notes are assembled BEFORE apply consumes the changesets, outside the commit", () => {
  const cut = jobBlock(read(PUBLISH), "cut");
  const notes = cut.indexOf("release-notes >");
  const apply = cut.indexOf("release.mjs apply");
  assert.ok(notes !== -1, "the cut job assembles the notes file");
  assert.ok(apply !== -1, "the cut job applies the train");
  assert.ok(notes < apply, "notes must be assembled before apply deletes the consumed changesets");
  // the notes file lives outside the worktree — git add -A must never commit it
  assert.match(cut, /release-notes > "\$RUNNER_TEMP\/release-notes\.txt"/);
  assert.match(cut, /--notes-file "\$RUNNER_TEMP\/release-notes\.txt"/);
});

// Least privilege: the workflow baseline is contents: read and each job
// elevates only what it needs — the read-only suggest job and the node-compat
// gates never carry contents: write or the npm OIDC identity.
test("least privilege: each job elevates only the permissions it needs", () => {
  const text = read(PUBLISH);
  assert.match(text.slice(text.indexOf("permissions:"), text.indexOf("concurrency:")), /contents: read/);
  const suggest = jobBlock(text, "suggest");
  assert.doesNotMatch(suggest, /id-token/);
  assert.doesNotMatch(suggest, /contents: write/);
  const cut = jobBlock(text, "cut");
  assert.match(cut, /contents: write/, "the cut job commits, tags and opens the release");
  assert.doesNotMatch(cut, /id-token/, "the cut job never publishes to npm");
  const pre = jobBlock(text, "cut-prerelease");
  assert.match(pre, /contents: write/, "the channel cut is recorded as a tag");
  assert.match(pre, /id-token: write/, "the channel publish needs npm OIDC");
  for (const job of ["schema-publish", "crate-publish", "pi-publish"]) {
    const b = jobBlock(text, job);
    assert.match(b, /id-token: write/, `${job} publishes via Trusted Publishing`);
    assert.match(b, /contents: read/);
    assert.doesNotMatch(b, /contents: write/, `${job} never mutates the repo`);
  }
  for (const job of ["schema-node-compat", "crate-node-compat", "pi-node-compat"]) {
    const b = jobBlock(text, job);
    assert.doesNotMatch(b, /id-token/, `${job} is a test gate, not a publisher`);
    assert.match(b, /contents: read/);
  }
});

