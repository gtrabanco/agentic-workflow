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
 *   push → REMOVED (owner decision 2026-11-03): the workflow runs only on
 *       `workflow_dispatch`, because the push side spent the whole gate chain
 *       to publish nothing whenever the committed version was already on the
 *       registry. `mode: publish` publishes the committed versions as latest,
 *       in dependency order, each idempotent through the exact-version gate;
 *       `cut` requests that mode for the commit it just pushed.
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
const ROOT_SUITE = ".github/workflows/root-suite.yml";
const LOCAL_GATE = "scripts/local-gate.mjs";

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
  assert.match(block, /release\.mjs release-notes > release-notes\.txt/,
    "the release body is the custom-rendered changesets, not GitHub's diff notes");
  assert.doesNotMatch(block, /--generate-notes/, "no generated diff notes: the renderer owns the body");
  assert.match(block, /gh release create "v\$VERSION" --title "v\$VERSION" --notes-file release-notes\.txt/);
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

// The canary release body is the rendered changesets (release.mjs
// release-notes), uploaded with the pre-release — never GitHub's diff notes.
test("cut + canary opens the GitHub pre-release with the rendered notes", () => {
  const block = jobBlock(read(PUBLISH), "cut-prerelease");
  assert.match(block, /gh release create "v\$V" --prerelease --verify-tag --title "v\$V" --notes-file release-notes\.txt/);
  assert.match(block, /release\.mjs release-notes/);
  assert.doesNotMatch(block, /--generate-notes/);
  const create = block.indexOf("gh release create");
  assert.ok(create !== -1, "opens the pre-release");
});

test("the publish jobs run only on mode: publish (no push publishes anything)", () => {
  const text = read(PUBLISH);
  assert.doesNotMatch(text, /^\s{2}push:/m, "the workflow must not trigger on push");
  for (const job of ["schema-publish", "crate-publish", "pi-publish"]) {
    const block = jobBlock(text, job);
    assert.match(
      block,
      /if: github\.event_name == 'workflow_dispatch' && inputs\.mode == 'publish'/,
      `${job} must answer to the publish mode and nothing else`,
    );
  }
});

test("the release entry point is manual: no push trigger, and `mode` offers publish", () => {
  const text = read(PUBLISH);
  const on = text.slice(text.indexOf("\non:"), text.indexOf("\npermissions:"));
  assert.ok(!/^\s{2}push:/m.test(on), "a push trigger means a merge can publish a release nobody asked for");
  assert.match(on, /^\s{2}workflow_dispatch:/m, "the operator's dispatch is the only entry");
  const modes = [...on.matchAll(/^\s{10}- (\w+)$/gm)].map((m) => m[1]);
  assert.ok(modes.includes("suggest") && modes.includes("cut") && modes.includes("publish"), `mode must offer suggest, cut and publish (got ${modes.join(", ")})`);
  assert.doesNotMatch(on, /skills\//, "skills/ is package content, never a trigger path (AC-08)");
});

test("the stable cut requests the publish of the commit it pushed", () => {
  const block = jobBlock(read(PUBLISH), "cut");
  assert.match(block, /gh workflow run publish\.yml --ref main -f mode=publish/, "one dispatch must release: the cut asks for its own publish run");
  assert.match(block, /actions: write/, "the request needs the actions scope");
  const push = block.indexOf("git push");
  const request = block.indexOf("gh workflow run");
  assert.ok(push !== -1 && request !== -1 && push < request, "the commit must be pushed before its publish is requested");
});

test("publish jobs chain in dependency order: pi waits for schema AND crate (D-40-10)", () => {
  const text = read(PUBLISH);
  const piBlock = jobBlock(text, "pi-publish");
  assert.match(piBlock, /needs:\s*\[schema-publish, crate-publish\]/);
});

test("each package has its own node-compat leg and version gate (never publish red)", () => {
  const text = read(PUBLISH);
  // The runtime legs validate the tree, not the release, so they live with the
  // rest of the gate — now one local-first step list (owner decision
  // 2026-11-04: the remote workflow delegates instead of transcribing it).
  const localGate = read(LOCAL_GATE);
  for (const id of ["schema-node-compat", "crate-suite-node", "pi-node-compat"]) {
    assert.match(localGate, new RegExp(`id: "${id}"`), `${id} belongs to the local gate`);
    assert.doesNotMatch(text, new RegExp(`^\\s{2}${id}:`, "m"), `${id} must not stay in the release workflow`);
  }
  assert.equal([...text.matchAll(/npm-version-gate\.mjs/g)].length, 4, "3 publish jobs + the cut-prerelease loop");
});

test("the release workflow's trigger names no package tree, because it has none", () => {
  const text = read(PUBLISH);
  const on = text.slice(text.indexOf("\non:"), text.indexOf("\npermissions:"));
  assert.doesNotMatch(on, /paths:/, "a release is dispatched, never inferred from a path");
  assert.doesNotMatch(on, /packages\//, "no package tree triggers the release workflow");
});

test("the pi job keeps its mutation and tarball gates (the #164 publish-time guards)", () => {
  const block = jobBlock(read(PUBLISH), "pi-publish");
  assert.match(block, /bun run mutation/);
  assert.match(block, /Tarball carries the skill bundle/);
});

// The workflow renders the release body itself (release.mjs release-notes —
// the changesets, grouped and headed) and uploads it with --notes-file;
// GitHub's diff-generated "What's Changed" is gone.
test("the cut job renders the release body from the changesets", () => {
  const cut = jobBlock(read(PUBLISH), "cut");
  assert.match(cut, /node scripts\/release\.mjs release-notes > release-notes\.txt/);
  assert.doesNotMatch(cut, /release-notes --channel/);
  assert.doesNotMatch(cut, /--generate-notes/);
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
  // The runtime legs validate the tree rather than publishing, and they live in
  // the local-first gate now: still read-only there, and still no OIDC token.
  const gateText = read(LOCAL_GATE);
  for (const id of ["schema-node-compat", "crate-suite-node", "pi-node-compat"]) {
    const step = gateText.slice(gateText.indexOf(`id: "${id}"`), gateText.indexOf("},", gateText.indexOf(`id: "${id}"`)));
    assert.ok(step.length > 0, `${id} is a local-gate step`);
    assert.doesNotMatch(step, /npm publish|id-token/, `${id} is a test gate, not a publisher`);
  }
  // The workflow itself keeps the least-privilege baseline it had as five jobs.
  const gateWorkflow = read(ROOT_SUITE);
  assert.match(gateWorkflow, /^permissions:\n  contents: read$/m, "the manual gate reads the tree and nothing else");
  assert.doesNotMatch(gateWorkflow, /id-token/, "the gate never carries an OIDC identity");
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
// The root gate's trigger — the same contract class, one workflow over.
// Owner decision 2026-11-04: the gate is local-first, so the workflow carries
// no push and no pull-request trigger and no path filter, and it delegates to
// `scripts/local-gate.mjs` instead of transcribing the step list. The cases
// below bind the two facts that matter: nothing runs on a push, and no check
// that a job used to carry disappears with it. The rule itself lives in
// `AGENTS.md` → Verification → "Where the gate runs".
// ---------------------------------------------------------------------------

test("the root gate is manual-only: nothing here runs on a push or a pull request", () => {
  const on = read(ROOT_SUITE).slice(read(ROOT_SUITE).indexOf("\non:"), read(ROOT_SUITE).indexOf("\npermissions:"));
  assert.match(on, /workflow_dispatch:/, "a branch is checked by dispatching the gate on it");
  assert.doesNotMatch(on, /^\s{2}(push|pull_request):/m, "a push/PR trigger spends runner minutes on a tree the author could check for free");
  assert.doesNotMatch(on, /paths-ignore|paths:/, "a manual dispatch has no path filter to keep in sync");
});

test("the remote gate delegates to the local one instead of transcribing it", () => {
  const gate = read(ROOT_SUITE);
  assert.match(gate, /node scripts\/local-gate\.mjs/, "the job runs the same script a contributor runs");
  // A second copy of the step list is the drift the decision exists to prevent.
  const job = jobBlock(gate, "local-gate");
  assert.doesNotMatch(job, /bun run test|run-root-suite\.mjs|version-parity-gate\.mjs|dependency-advisory-pass\.mjs/,
    "the workflow carries no step of its own — it calls the local gate");
});

test("every former remote check survives as a step of the local gate", () => {
  const local = read(LOCAL_GATE);
  const ids = [...local.matchAll(/^\s{4}id: "([a-z-]+)",$/gm)].map((match) => match[1]);
  assert.deepEqual(ids, [
    "workspace-install",
    "schema-build",
    "crate-suite-bun",
    "crate-suite-node",
    "root-suite",
    "version-parity-content",
    "docs-generated-projection",
    "journal-carrier-check",
    "temp-hygiene",
    "tmp-gc",
    "worktree-guard",
    "schema-node-compat",
    "pi-node-compat",
    "pi-compat-guard",
    "dependency-pin-gate",
    "dependency-advisories",
  ], "a check that disappears with the job that carried it is the defect this list prevents");
  for (const needle of ["--frozen-lockfile", "run-root-suite.mjs", "version-parity-gate.mjs", "--content", "--pins", "dependency-advisory-pass.mjs"]) {
    assert.ok(local.includes(needle), `${LOCAL_GATE} still runs ${needle}`);
  }
});

test("the local-first decision names its owner in the workflow and the guide", () => {
  const header = read(ROOT_SUITE).slice(0, read(ROOT_SUITE).indexOf("\non:"));
  assert.match(header, /AGENTS\.md/, "the rule's owner is named where the wiring lives");
  assert.match(header, /pre-push|local-gate\.mjs/, "the header says how a branch is checked before a merge");
  assert.match(read("AGENTS.md"), /### Where the gate runs/, "the guide owns the rule");
});
