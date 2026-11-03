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
  assert.match(block, /release\.mjs publish-stage --channel/);
  assert.match(block, /npm-version-gate\.mjs/, "the exact-version gate guards every publish");
  assert.match(block, /npm publish --ignore-scripts --access public --provenance --tag "\$tag"/);
  assert.match(block, /git checkout -- packages\/\*\/package\.json/, "the repo is restored after the temp version");
  assert.match(block, /git tag "v\$V"/, "the tag is the canary counter's input");
});

// The canary job runs the same never-publish-red gate a push publish runs, but
// over the COMMITTED tree: the suites are not there to bless a derived
// prerelease. release.mjs then stages the temp channel versions (the npm
// lifecycle scripts stay off during publish so the gate is not re-run against
// them) and the job restores the worktree. A per-package `npm version` reached
// `npm publish` with no dependency tree at all.
test("cut + canary installs the workspace, gates the commit, stages and restores", () => {
  const block = jobBlock(read(PUBLISH), "cut-prerelease");
  assert.match(block, /bun install --frozen-lockfile/, "the publish gate needs the real dependency tree");
  assert.match(block, /npm install -g npm@latest/, "Trusted Publishing needs npm >= 11.21 for publish + dist-tag");
  assert.match(block, /\( cd "packages\/\$dir" && bun run test \)/, "each declared package is gated before staging");
  assert.match(block, /release\.mjs publish-stage --channel/);
  assert.match(block, /CUT_DATE=\$\(date -u \+%F\)/, "the cut date is pinned once");
  assert.doesNotMatch(block, /--date "\$\(date/, "plan and stage read the pinned date, never a second clock read");
  assert.doesNotMatch(block, /npm version/, "no per-package npm version: the stage step owns the temp state");
  assert.match(block, /npm publish --ignore-scripts/, "lifecycle scripts never re-run the gate against the staged version");
  assert.match(block, /if: always\(\)[\s\S]{0,120}git checkout -- packages\/\*\/package\.json/);
  assert.match(block, /gh release create "v\$V"[^\n]*--prerelease/, "the channel cut is visible as a GitHub pre-release");
});

test("cut + canary accepts the version input as the canary base (a variable, never a literal)", () => {
  const text = read(PUBLISH);
  const block = jobBlock(text, "cut-prerelease");
  assert.match(block, /VERSION: \$\{\{ inputs\.version \}\}/);
  assert.match(block, /publish-plan --channel "\$CHANNEL" --date "\$CUT_DATE" "\$\{args\[@\]\}"/, "the plan receives the forced base");
  assert.match(block, /publish-stage --channel "\$CHANNEL" --date "\$CUT_DATE" "\$\{args\[@\]\}"/, "the stage receives the same forced base");
  assert.doesNotMatch(block, /Reject a forced version/, "the canary base is a supported override, not a rejected input");
  const suggest = jobBlock(text, "suggest");
  assert.match(suggest, /plan --channel canary[\s\S]{0,80}"\$\{args\[@\]\}"/, "the canary suggestion receives the same base");
});

// A stable release is what `@canary` installs until the next canary cut: every
// stable publish job moves the dist-tag to the version it just published.
test("each stable publish job points the canary dist-tag at the stable release", () => {
  const text = read(PUBLISH);
  assert.equal([...text.matchAll(/npm dist-tag add "\$NAME@\$VERSION" canary/g)].length, 3, "one per publishable package");
  for (const job of ["schema-publish", "crate-publish", "pi-publish"]) {
    assert.match(jobBlock(text, job), /npm dist-tag add/, `${job} promotes canary`);
  }
});

// The promotion is only honest when the run actually published. Before this
// guard, a push run whose gate skipped (committed version already on the
// registry) still executed `npm dist-tag add … canary`: run 41547545135
// (2026-11-02T23:43Z) rewrote `canary` from 5.0.0-canary.20261102.1 back to
// 4.10.0 on all three packages, orphaning the canary build.
test("the canary promotion is gated on the publish decision", () => {
  const text = read(PUBLISH);
  for (const job of ["schema-publish", "crate-publish", "pi-publish"]) {
    const block = jobBlock(text, job);
    const step = block.slice(block.indexOf("- name: Point the canary dist-tag at the stable release"));
    assert.ok(step, `${job} must carry the promotion step`);
    assert.match(
      step.slice(0, 200),
      /\n\s+if: steps\.version\.outputs\.publish == 'true'/,
      `${job} moves the tag on a skipped publish — a run that published nothing must never rewrite \`canary\``,
    );
  }
});

// The canary release body is the BACKLOG: the pending changeset bodies — the
// same ones the next stable cut consumes — so the pre-release says what it
// carries. Canaries are grouped by the operator; the pre-release is where the
// group is readable.
test("cut + canary opens the GitHub pre-release with the changeset backlog as notes", () => {
  const block = jobBlock(read(PUBLISH), "cut-prerelease");
  assert.match(block, /release\.mjs release-notes --channel "\$CHANNEL" --date "\$CUT_DATE"/, "the same renderer, naming the channel and the pinned cut date");
  assert.match(block, /--date "\$CUT_DATE"/, "the body names the exact tag this cut publishes — the same pinned date the stage reads");
  assert.match(block, /--notes-file "\$RUNNER_TEMP\/canary-notes\.txt"/);
  const notes = block.indexOf("release-notes");
  const create = block.indexOf("gh release create");
  assert.ok(notes !== -1 && create !== -1 && notes < create, "the backlog is assembled before the release opens");
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
  const notes = cut.indexOf("release-notes --channel stable");
  const apply = cut.indexOf("release.mjs apply");
  assert.ok(notes !== -1, "the cut job assembles the notes file");
  assert.ok(apply !== -1, "the cut job applies the train");
  assert.ok(notes < apply, "notes must be assembled before apply deletes the consumed changesets");
  // the notes file lives outside the worktree — git add -A must never commit it
  // (the command names its channel: the same renderer serves both channels and
  // renders the install block and the version the channel is about to ship)
  assert.match(cut, /release-notes --channel stable[^\n]*> "\$RUNNER_TEMP\/release-notes\.txt"/);
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


test("the dispatch version input is shape-checked and never expanded unquoted into the shell", () => {
  // F12: the operator-supplied `version` input reached the command line through
  // an intermediate string variable (`ARGS="--version $FORCE_VERSION"` then
  // `... $ARGS`), so the shell split/globbed it BEFORE release.mjs's own
  // semver check ran. The contract now: validate the shape in the job, and pass
  // the value as one quoted argument.
  const text = read(PUBLISH);
  for (const job of ["suggest", "cut"]) {
    const block = jobBlock(text, job);
    assert.match(
      block,
      /\[\[ ! "\$FORCE_VERSION" =~ \^\[0-9\]\+\\.\[0-9\]\+\\.\[0-9\]\+\$ \]\]/,
      `${job} checks the version shape before running the script`,
    );
    assert.doesNotMatch(block, /ARGS="--version \$FORCE_VERSION"/, `${job} builds no interpolated argument string`);
    assert.doesNotMatch(block, /release\.mjs \w+ \$ARGS/, `${job} never expands an argument string unquoted`);
    assert.match(block, /--version "\$FORCE_VERSION"/, `${job} passes the value as one quoted argument`);
  }
});

// ---------------------------------------------------------------------------
// The root gate's trigger — the same contract class, one workflow over:
// `paths-ignore` decides whether ANY of the root suites run, so an entry there
// is a claim that no suite reads that path from this checkout. On 2026-11-03
// the claim was false (`docs/fix/**`, `docs/features/**`, `.claude-plugin/**`
// were ignored while `ledger-ownership`, `residue-dimensions` and
// `pre-execution-quality` read them), so the drift gates were skipped exactly
// when the surfaces they police changed.
// ---------------------------------------------------------------------------

const ROOT_SUITE = ".github/workflows/root-suite.yml";

/** Journal, notes, prose, toolchain state, changeset intents — no real-tree reader. */
const ROOT_SUITE_IGNORED = Object.freeze([
  ".changeset/**",
  ".engram/**",
  ".pi-web/**",
  ".pi/**",
  ".serena/**",
  "LICENSE",
  "README.md",
  "docs/LOGS.md",
  "docs/design/**",
  "docs/research/**",
]);

/** A path a root suite reads from THIS checkout, with the reader that reads it. */
const ROOT_SUITE_TRIGGERING = Object.freeze([
  { glob: "docs/features/**", reader: "scripts/ledger-ownership.test.mjs", needle: "docs/features/" },
  { glob: "docs/fix/**", reader: "scripts/residue-dimensions.test.mjs", needle: "docs/fix/" },
  { glob: ".claude-plugin/**", reader: "scripts/pre-execution-quality.test.mjs", needle: ".claude-plugin/" },
  { glob: ".node-version", reader: ROOT_SUITE, needle: ".node-version" },
  { glob: ".bun-version", reader: "scripts/setup-env.test.mjs", needle: ".bun-version" },
]);

/** The list one trigger block carries, as GitHub reads it. */
function ignoredBy(event) {
  const on = read(ROOT_SUITE).slice(read(ROOT_SUITE).indexOf("\non:"), read(ROOT_SUITE).indexOf("\npermissions:"));
  const rest = on.slice(on.indexOf(`${event}:`) + event.length + 1);
  const next = rest.slice(1).search(/\n {2}[a-z_]+:/);
  const block = next === -1 ? rest : rest.slice(0, next + 1);
  return [...block.slice(block.indexOf("paths-ignore:")).matchAll(/^\s+- '([^']+)'/gm)].map((m) => m[1]);
}

test("the root gate's ignore list is closed, and both trigger blocks carry it", () => {
  const push = ignoredBy("push");
  assert.deepEqual([...push].sort(), [...ROOT_SUITE_IGNORED].sort(), "the ignored set changed — decide, then update this list and the workflow's rule");
  assert.deepEqual(ignoredBy("pull_request"), push, "a push-only prune leaves the PR red and the merge green (or the reverse)");
});

test("no path a root suite reads from this checkout is ignored", () => {
  for (const { glob, reader, needle } of ROOT_SUITE_TRIGGERING) {
    assert.ok(read(reader).includes(needle), `${reader} no longer reads ${needle} — retire the exemption or restore the read`);
    assert.ok(!ROOT_SUITE_IGNORED.includes(glob), `${glob} is ignored, so ${reader} would be skipped exactly when its subject changes`);
  }
});

test("the root gate's workflow states the rule its ignore list obeys", () => {
  const header = read(ROOT_SUITE).slice(0, read(ROOT_SUITE).indexOf("\non:"));
  assert.match(header, /no root suite reads it from this tree/i, "the rule that bounds the list must be written where the list lives");
  assert.match(header, /release-workflows\.test\.mjs/, "the header names the suite that pins it");
});
