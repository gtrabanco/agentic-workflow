#!/usr/bin/env node

/**
 * Feature 28 / fix-162 — the `impossible-timeline` freshness guard, black box.
 *
 * The schema publishes the code, the skew constant and the pure predicate; the
 * CLI's `verify` fetches the recorded revision's committer date and refuses a
 * back-dated receipt under its own reason code. This suite proves that end to
 * end over the CLI in a throwaway git repository, exactly as RS13/RS14 do for
 * the other dimensions:
 *   · a back-dated receipt (finish before its recorded revision's commit date by
 *     more than the skew) answers `impossible-timeline` at its own recorded
 *     revision with nothing moved — not mis-attributed staleness;
 *   · an honest receipt answers `current: true`;
 *   · fail-open: a legacy receipt with no `Started/finished:` line is unflagged,
 *     a finish within the skew before the commit date is unflagged, and a
 *     recorded source revision git cannot resolve is unflagged.
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

const git = (cwd, env, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", env }).trim();

const specText = (goal = "Ship the thing.") => `# Toy unit

## Goal

${goal}

## Branch

\`feat/toy\`

## Size

\`S\` — small.

## Dependencies

- none

## Product half

### Scope

- **S1:** the thing.

## Design status

\`designed\`

## Engineering half

Not part of the Product projection.
`;

const ACCEPTANCE = "# Acceptance\n\n- A1 the thing ships.\n";
const GUIDE = "# Project guide\n\nRules.\n";
const UNIT_DIR = "docs/features/99-toy";

function makeRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pre-exec-timeline-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  fs.symlinkSync(path.join(repoRoot, "packages"), path.join(root, "packages"));
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.copyFileSync(sensorScript, path.join(root, "scripts", "pre-execution-snapshot.mjs"));
  write(`${UNIT_DIR}/SPEC.md`, specText());
  write(`${UNIT_DIR}/ACCEPTANCE.md`, ACCEPTANCE);
  write("CLAUDE.md", GUIDE);
  git(root, process.env, "init", "-q", "-b", "main");
  git(root, process.env, "config", "user.email", "fixture@example.invalid");
  git(root, process.env, "config", "user.name", "Fixture");
  git(root, process.env, "config", "commit.gpgsign", "false");
  const commit = (message, dateIso) => {
    const env = { ...process.env, GIT_COMMITTER_DATE: dateIso, GIT_AUTHOR_DATE: dateIso };
    git(root, env, "add", "-A", "--", ".");
    git(root, env, "commit", "-qm", message);
    return git(root, env, "rev-parse", "HEAD");
  };
  const commitAt = (message, dateIso) => commit(message, dateIso);
  const run = (...args) => spawnSync(process.execPath, ["scripts/pre-execution-snapshot.mjs", ...args], {
    cwd: root, encoding: "utf8", timeout: 120000,
  });
  const build = (...args) => {
    const r = run("build", ...args);
    assert.equal(r.status, 0, `build failed: ${r.stderr}`);
    const [observedDigest, ...rest] = r.stdout.split("\n");
    return { digest: observedDigest.trim(), snapshot: JSON.parse(rest.join("\n")), result: r };
  };
  return { root, write, commitAt, run, build };
}

/** A receipt block whose `Started/finished:` line is the given pair (or absent). */
function receiptBlock({ stage, digest, sourceRevision, artifactRevision, verdict, started = "2026-08-31T00:00:00Z", finished = "2026-08-31T00:01:00Z", parent = "null", policy = "v1", unitKind = "feature", unit = "99-toy" }) {
  const parentLine = stage === "spec"
    ? `- Unit: ${unit} · Stage: ${stage} · Parent: null`
    : `- Unit: ${unit} · Stage: ${stage} · Unit kind: ${unitKind}\n- Parent SPEC snapshot: ${parent} · Parent Product receipt: rs-toy-001`;
  return `## Pre-execution review receipt v1 — ${stage}
- Review: rs-toy-timeline · Snapshot: ${digest} · Verdict: ${verdict}
${parentLine}
- Source revision: ${sourceRevision} · Artifact revision: ${artifactRevision}
- Reviewer: reviewer-session · Session: s-1 · Role: reviewer · Author: author-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: ${policy}
- Started/finished: ${started}/${finished} · Findings: 0 (material open: 0)
`;
}

/** Commit the planning artifacts at `dateIso` and return the snapshot/revision. */
function setup(t, dateIso) {
  const f = makeRepo(t);
  const revision = f.commitAt("planning artifacts frozen", dateIso);
  const built = f.build("--stage", "spec", "--dir", UNIT_DIR, "--unit", "99-toy");
  assert.equal(built.snapshot.sourceRevision, revision, "the artifact commit is the recorded revision");
  return { f, revision, built };
}

/** Record a PASS receipt with the given finished timestamp and commit its write. */
function record(f, built, finished, { sourceRevision = built.snapshot.sourceRevision, artifactRevision = built.snapshot.artifactRevisionId } = {}) {
  const block = receiptBlock({
    stage: "spec", digest: built.digest, sourceRevision, artifactRevision,
    verdict: "spec-review-pass", started: "2026-09-05T07:50:00Z", finished,
  });
  f.write(`${UNIT_DIR}/progress.md`, block);
  f.commitAt("docs(99): record spec review receipt", "2026-09-06T10:00:00Z");
}

const verify = (f, extra = []) => f.run("verify", "--stage", "spec", "--dir", UNIT_DIR, "--unit", "99-toy", ...extra);
const report = (r) => JSON.parse(r.stdout);

test("a back-dated receipt returns impossible-timeline at its own recorded revision", (t) => {
  // Source commit committed at 2026-09-06T09:00:00Z; finish ~25h earlier.
  const { f, built } = setup(t, "2026-09-06T09:00:00Z");
  record(f, built, "2026-09-05T08:00:00Z");
  const r = report(verify(f));
  console.error("BACKDATED STRUCTURAL:", JSON.stringify(r.structural));
  assert.equal(r.structural.fresh, false);
  assert.equal(r.structural.reasonCode, "impossible-timeline", JSON.stringify(r.structural));
  // Nothing moved: the refusal is the receipt's own timeline, not mis-attributed
  // staleness of a bound artifact.
  assert.deepEqual(r.structural.changedPaths, []);
  assert.match(r.structural.detail ?? "", /before.*commit date|skew/i, JSON.stringify(r.structural));
});

test("an honest receipt answers current: true", (t) => {
  const { f, built } = setup(t, "2026-09-06T09:00:00Z");
  record(f, built, "2026-09-06T10:00:00Z");
  const r = report(verify(f));
  assert.equal(r.current, true, JSON.stringify(r.structural));
  assert.equal(r.structural.fresh, true);
});

test("fail-open: a legacy receipt with no parsable timeline is unflagged", (t) => {
  const { f, built } = setup(t, "2026-09-06T09:00:00Z");
  // A block with NO `Started/finished:` line at all.
  const block = receiptBlock({
    stage: "spec", digest: built.digest, sourceRevision: built.snapshot.sourceRevision,
    artifactRevision: built.snapshot.artifactRevisionId, verdict: "spec-review-pass",
  }).replace(/- Started\/finished:[^\n]*/, "");
  f.write(`${UNIT_DIR}/progress.md`, block);
  f.commitAt("docs(99): record legacy receipt without timeline", "2026-09-06T10:00:00Z");
  const r = report(verify(f));
  assert.equal(r.current, true, "a legacy receipt without a timeline must stay unflagged");
});

test("fail-open: a finish within the skew before the commit date is unflagged", (t) => {
  const { f, built } = setup(t, "2026-09-06T09:00:00Z");
  // 2 minutes before the commit — inside the 5-minute published skew.
  record(f, built, "2026-09-06T08:58:00Z");
  const r = report(verify(f));
  assert.equal(r.current, true, "a finish within the clock-drift skew must not refuse");
});

test("fail-open: a recorded source revision git cannot resolve is unflagged", (t) => {
  // Build AND verify under the same unresolvable 40-hex revision so the recorded
  // source revision equals the snapshot's (no stale-source-revision); git cannot
  // date it, so the sensor's timeline fetch answers null and the check fails open.
  const f = makeRepo(t);
  f.commitAt("planning artifacts frozen", "2026-09-06T09:00:00Z");
  const unresolvable = "f".repeat(40);
  const built = f.build("--stage", "spec", "--dir", UNIT_DIR, "--unit", "99-toy", "--source-revision", unresolvable);
  assert.equal(built.snapshot.sourceRevision, unresolvable);
  record(f, built, "2026-09-05T08:00:00Z");
  const r = report(verify(f, ["--source-revision", unresolvable]));
  assert.equal(r.structural.fresh, true,
    "an unresolvable revision must fail open rather than invent a timeline flag");
});
