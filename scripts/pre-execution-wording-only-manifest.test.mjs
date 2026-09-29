#!/usr/bin/env node

/**
 * Feature 31 F8 / D-31-11 — the wording-only exemption never certifies a
 * movement of the unit's own frozen acceptance manifest.
 *
 * The recorded acceptance fingerprint is `git hash-object <unit>/ACCEPTANCE.md`
 * taken at verification time, so a determination written AFTER a manifest rewrite
 * self-certifies the very movement it is attesting to (RFC 9334: the target
 * environment cannot forge evidence about itself). SPEC E6's fifth condition —
 * "the moved bound artifact is not the unit's own acceptance manifest" — is what
 * closes it, and this file is its regression check.
 *
 * `ACCEPTANCE.md` is a bound artifact of the PLAN stage only (`STAGE_ARTIFACTS`),
 * so the attack and its controls are plan-stage.
 *
 * Why its own file rather than a block in `scripts/pre-execution-sensor.test.mjs`:
 * that suite is a protected path under the repository's path-protection policy
 * (an existing `*.test.*` file may only change behind a recorded justification),
 * and a new-file create is authoring by that same policy (E-60-5). The harness
 * below mirrors `scripts/pre-execution-sensor.test.mjs` on purpose — the sensor
 * suite runs its fixture through a COPY of the CLI in a throwaway repository, and
 * nothing here may commit into the repository it is checking. It also supersedes
 * the reviewer's recorded reproducer `/tmp/verify-launder.test.mjs`, whose fixture
 * SPEC shape is refused by the current selector
 * (`invalid-selector@/files/0/content`); the attack it proved is the attack
 * proved here.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sensorScript = path.join(repoRoot, "scripts", "pre-execution-snapshot.mjs");
const contractScript = path.join(repoRoot, "scripts", "pre-execution-contract.mjs");

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** A unit doc the `spec-product-v1` selector accepts (13-section, feature 61). */
const specText = (objective = "Ship the thing.") => `# Toy unit

## Objective

${objective}

## Why

Because the customer needs it.

## User outcome

Users can do X.

## Acceptance criteria

- [x] S1 is done.

## Non-goals

- Not S2.

## Future cost

None known.

## Applicable tests

- Unit tests.

## Known pre-existing issues

None.

## Tasks

- [x] Implement S1.

## Evidence

No external evidence.

## Progress log

- P1 done.

## Next

Ship it.

## References

[Link](https://example.com)
`;

const ACCEPTANCE = "# Acceptance\n\n- A1 the thing ships.\n";
const REWRITTEN_ACCEPTANCE =
  "# Acceptance\n\n- A1 the thing ships.\n- A2 a brand new obligation was added by the author.\n";
const ROADMAP = "# Roadmap\n\n| 99 | 99-toy | planned |\n";
const GUIDE = "# Project guide\n\nRules.\n";
const UNIT_DIR = "docs/features/99-toy";

function makeRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wording-manifest-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  // The sensor resolves the schema through <repoRoot>/packages/.../dist: link the
  // real build output, never a copy, so the CLI exercises the shipped contract.
  fs.symlinkSync(path.join(repoRoot, "packages"), path.join(root, "packages"));
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.copyFileSync(sensorScript, path.join(root, "scripts", "pre-execution-snapshot.mjs"));
  fs.copyFileSync(contractScript, path.join(root, "scripts", "pre-execution-contract.mjs"));
  write(`${UNIT_DIR}/SPEC.md`, specText());
  write(`${UNIT_DIR}/ACCEPTANCE.md`, ACCEPTANCE);
  write(`${UNIT_DIR}/PLAN.md`, "# Plan\n\nP1 ships it.\n");
  write(`${UNIT_DIR}/planning-evidence.md`, "# Evidence\n\n- PE-1 measured.\n");
  write(`${UNIT_DIR}/planning-obligations.md`, "# Obligations\n\n- OB-1.\n");
  write("docs/features/ROADMAP.md", ROADMAP);
  write("AGENTS.md", GUIDE);
  write("src/code.ts", "export const a = 1;\n");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  // Every commit is dated BEFORE the receipts' recorded finish (2026-08-31) so the
  // impossible-timeline guard never mis-flags the fixture as back-dated.
  const FIXTURE_DATE = "2026-08-30T00:00:00Z";
  const gitDate = (...args) => execFileSync("git", args, {
    cwd: root, encoding: "utf8",
    env: { ...process.env, GIT_COMMITTER_DATE: FIXTURE_DATE, GIT_AUTHOR_DATE: FIXTURE_DATE },
  }).trim();
  const commit = (message) => {
    gitDate("add", "-A", "--", ".");
    gitDate("commit", "-qm", message);
    return gitDate("rev-parse", "HEAD");
  };
  commit("planning artifacts frozen");
  const run = (...args) =>
    spawnSync(process.execPath, ["scripts/pre-execution-snapshot.mjs", ...args], {
      cwd: root, encoding: "utf8", timeout: 120000,
    });
  const build = (...args) => {
    const r = run("build", ...args);
    assert.equal(r.status, 0, `build failed: ${r.stderr}`);
    const [observedDigest, ...rest] = r.stdout.split("\n");
    return { digest: observedDigest.trim(), snapshot: JSON.parse(rest.join("\n")), result: r };
  };
  return { root, write, commit, run, build, dir: UNIT_DIR, unit: "99-toy" };
}

function receiptBlock({ stage, unit, unitKind, digest, sourceRevision, artifactRevision, parent, verdict }) {
  const parentLine = stage === "spec"
    ? `- Unit: ${unit} · Stage: ${stage} · Parent: null`
    : `- Unit: ${unit} · Stage: ${stage} · Unit kind: ${unitKind}\n- Parent SPEC snapshot: ${parent} · Parent Product receipt: rs-toy-001`;
  return `## Pre-execution review receipt v1 — ${stage}
- Review: rs-toy-001 · Snapshot: ${digest} · Verdict: ${verdict}
${parentLine}
- Source revision: ${sourceRevision} · Artifact revision: ${artifactRevision}
- Reviewer: reviewer-session · Session: s-1 · Role: reviewer · Author: author-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-08-31T00:00:00Z/2026-08-31T00:05:00Z · Findings: 0 (material open: 0)
`;
}

/** Record the current bytes as a PASS receipt for `stage` and commit that write. */
function recordReceipt(f, { stage, unitKind = "feature", parent } = {}) {
  const args = ["--stage", stage, "--dir", f.dir, "--unit", f.unit, "--unit-kind", unitKind];
  if (parent) args.push("--parent", parent);
  const built = f.build(...args);
  const progressPath = `${f.dir}/progress.md`;
  const previous = fs.existsSync(path.join(f.root, progressPath))
    ? fs.readFileSync(path.join(f.root, progressPath), "utf8") : "";
  f.write(progressPath, `${previous}${receiptBlock({
    stage, unit: f.unit, unitKind, digest: built.digest,
    sourceRevision: built.snapshot.sourceRevision, artifactRevision: built.snapshot.artifactRevisionId,
    parent: built.snapshot.parentSpecSnapshotDigest ?? "null",
    verdict: stage === "spec" ? "spec-review-pass" : "plan-review-pass",
  })}\n`);
  const commit = f.commit(`docs(99): record ${stage} review receipt`);
  return { ...built, commit };
}

function determinationBlock({ stage, id, revision, fingerprint }) {
  return `## Wording-only determination v1 — ${stage}
- Determination: ${id}
- Artifact revision: ${revision}
- Acceptance fingerprint: ${fingerprint}
- Intent and authority unchanged: yes
`;
}

const recordDetermination = (f, { stage, id, revision, fingerprint }) => {
  const progressPath = `${f.dir}/progress.md`;
  const previous = fs.existsSync(path.join(f.root, progressPath))
    ? fs.readFileSync(path.join(f.root, progressPath), "utf8") : "";
  f.write(progressPath, `${previous}${determinationBlock({ stage, id, revision, fingerprint })}\n`);
  return f.commit("docs(99): record the wording-only determination");
};

const verify = (f, stage, extra = []) =>
  f.run("verify", "--stage", stage, "--dir", f.dir, "--unit", f.unit, ...extra);

const report = (result) => {
  assert.equal(result.status === 0 || result.status === 4, true,
    `verify must answer a freshness exit code: ${result.stderr}`);
  return JSON.parse(result.stdout);
};

/** The plan-stage receipt every case below verifies against. */
function seedPlanReceipt(t) {
  const f = makeRepo(t);
  const spec = recordReceipt(f, { stage: "spec" });
  recordReceipt(f, { stage: "plan", parent: spec.digest });
  return { f, parent: spec.digest };
}

// ATTACK — a "repair" rewrites the frozen manifest beside a bound artifact, then
// records the POST-edit revision with the POST-edit hash. Before D-31-11 this
// answered `fresh: true` / exit 0: the branch self-compared two values that both
// describe the post-edit world.
test("ATTACK: a determination recorded after rewriting ACCEPTANCE.md must never certify it", (t) => {
  const { f, parent } = seedPlanReceipt(t);
  f.write(`${f.dir}/ACCEPTANCE.md`, REWRITTEN_ACCEPTANCE);
  f.write(`${f.dir}/SPEC.md`, specText("Ship the thing, worded differently."));
  const rotated = f.commit("fix(99): rewrite the frozen acceptance manifest");
  const postEditFingerprint = git(f.root, "hash-object", `${f.dir}/ACCEPTANCE.md`);
  recordDetermination(f, { stage: "plan", id: "wording-launder", revision: rotated, fingerprint: postEditFingerprint });

  const result = verify(f, "plan", ["--parent", parent]);
  const r = report(result);
  assert.equal(r.structural.fresh, false,
    `the manifest's own movement must never be self-certified: ${JSON.stringify(r.structural)}`);
  assert.equal(result.status, 4, `a manifest movement exits 4: ${result.stdout}`);
  assert.equal(r.current, false);
  assert.equal(r.structural.reasonCode, "stale-source-revision",
    "the branch is skipped and the existing precedence answers — the code E6 and frozen AC4 record");
  assert.equal(r.digestMatches, false,
    "the manifest is a bound plan artifact, so its movement rotates the digest as well");
});

// NEGATIVE — the same movement with no determination at all: the fall-through
// answer the ATTACK must converge on, so the two share one reason code.
test("NEGATIVE: ACCEPTANCE.md rewritten with no determination falls through unchanged", (t) => {
  const { f, parent } = seedPlanReceipt(t);
  f.write(`${f.dir}/ACCEPTANCE.md`, REWRITTEN_ACCEPTANCE);
  f.commit("fix(99): rewrite the frozen acceptance manifest");

  const result = verify(f, "plan", ["--parent", parent]);
  const r = report(result);
  assert.equal(result.status, 4, `a stale receipt exits 4: ${result.stdout}`);
  assert.equal(r.structural.fresh, false);
  assert.equal(r.structural.reasonCode, "stale-source-revision");
});

// CONTROL — only a NON-manifest bound artifact moves. The exclusion must not
// swallow the legitimate exemption, or the route dies for every wording repair.
test("CONTROL: an untouched manifest keeps the wording-only route open", (t) => {
  const { f, parent } = seedPlanReceipt(t);
  f.write(`${f.dir}/PLAN.md`, "# Plan\n\nP1 ships it, worded differently.\n");
  const rotated = f.commit("docs(99): wording-only plan repair");
  const fingerprint = git(f.root, "hash-object", `${f.dir}/ACCEPTANCE.md`);
  recordDetermination(f, { stage: "plan", id: "wording-control", revision: rotated, fingerprint });

  const result = verify(f, "plan", ["--parent", parent]);
  const r = report(result);
  assert.equal(result.status, 0, `a recorded wording-only move must stay current: ${result.stdout}`);
  assert.equal(r.current, true, JSON.stringify(r.structural));
  assert.equal(r.structural.fresh, true);
  assert.match(r.structural.detail, /wording-control/);
  assert.deepEqual(r.structural.changedPaths, []);
});
