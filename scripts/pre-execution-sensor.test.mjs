#!/usr/bin/env node

/**
 * Feature 28 — the snapshot sensor as a BLACK BOX (findings RS3(b), RS13, RS14).
 *
 * `scripts/pre-execution-snapshot.mjs` resolves its repository from its own
 * location, so every test here copies the script into a throwaway git repository
 * under `os.tmpdir()` and runs it there. That is what makes the three behaviours
 * under test provable at all: RS3(b) is a statement about what a NEW COMMIT does
 * to a digest, and no test may commit into the repository it is checking.
 *
 * What each block owns:
 *   RS3(b) — `sourceRevision`/`artifactRevisionId` default to the newest commit
 *            that touched a BOUND path, so recording a receipt (a `progress.md`
 *            write) and every unrelated commit stop invalidating it, while an
 *            explicit `--source-revision`/`--artifact-revision` still overrides.
 *   RS13   — `verify` names the drifted dimension (a code from the published
 *            `PRE_EXECUTION_FRESHNESS_CODES`) and the bound paths that moved,
 *            and keeps `missing-receipt-snapshot` for "no receipt / no digest".
 *   RS14   — a feature `plan` snapshot without `--parent` fails with the remedy,
 *            and a FIX unit's plan snapshot binds no parent at all.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { loadSchemaRuntime } from "./schema-runtime.mjs";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sensorScript = path.join(repoRoot, "scripts", "pre-execution-snapshot.mjs");
// Built runtime, with an actionable error instead of ERR_MODULE_NOT_FOUND when
// the gitignored dist/ has not been produced yet (see scripts/schema-runtime.mjs).
const schema = await loadSchemaRuntime();
const { PRE_EXECUTION_FRESHNESS_CODES, buildPreExecutionArtifactSnapshot, digestPreExecutionArtifactSnapshot } = schema;

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** The Product half the `spec-product-v1` selector binds, plus one engineering section. */
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
const ROADMAP = "# Roadmap\n\n| 99 | 99-toy | planned |\n";
const GUIDE = "# Project guide\n\nRules.\n";
const UNIT_DIR = "docs/features/99-toy";

/**
 * One fresh repository: planning artifacts, the four bound context files, and one
 * deliberately UNBOUND path (`src/code.ts`) that every RS3(b) test edits.
 */
function makeRepo(t, { unitKind = "feature", dir = UNIT_DIR, unit = "99-toy" } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pre-exec-sensor-"));
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
  write(`${dir}/SPEC.md`, specText());
  write(`${dir}/ACCEPTANCE.md`, ACCEPTANCE);
  write(`${dir}/PLAN.md`, "# Plan\n\nP1 ships it.\n");
  write(`${dir}/planning-evidence.md`, "# Evidence\n\n- PE-1 measured.\n");
  write(`${dir}/planning-obligations.md`, "# Obligations\n\n- OB-1.\n");
  write("docs/features/ROADMAP.md", ROADMAP);
  write("CLAUDE.md", GUIDE);
  write("src/code.ts", "export const a = 1;\n");
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  // fix/162: the receipts these fixtures record carry a hardcoded reached finish
  // (2026-08-31). Every commit is dated BEFORE that finish so the new
  // impossible-timeline guard (which requires a finish after the recorded
  // revision's commit date) never mis-flags the fixture as back-dated — the
  // fixture's own assertion is that the commit predates the review it enables.
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
  /** `build` and parse the JSON snapshot the CLI printed (digest on line 1). */
  const build = (...args) => {
    const r = run("build", ...args);
    assert.equal(r.status, 0, `build failed: ${r.stderr}`);
    const [observedDigest, ...rest] = r.stdout.split("\n");
    return { digest: observedDigest.trim(), snapshot: JSON.parse(rest.join("\n")), result: r };
  };
  return { root, write, commit, run, build, unitKind, dir, unit };
}

/** The receipt block format `review-spec`/`review-plan` publish (OUTPUT.md). */
function receiptBlock({ stage, unit, unitKind, digest, sourceRevision, artifactRevision, parent, policy = "v1", verdict }) {
  const parentLine = stage === "spec"
    ? `- Unit: ${unit} · Stage: ${stage} · Parent: null`
    : `- Unit: ${unit} · Stage: ${stage} · Unit kind: ${unitKind}\n- Parent SPEC snapshot: ${parent} · Parent Product receipt: rs-toy-001`;
  return `## Pre-execution review receipt v1 — ${stage}
- Review: rs-toy-001 · Snapshot: ${digest} · Verdict: ${verdict}
${parentLine}
- Source revision: ${sourceRevision} · Artifact revision: ${artifactRevision}
- Reviewer: reviewer-session · Session: s-1 · Role: reviewer · Author: author-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: ${policy}
- Started/finished: 2026-08-31T00:00:00Z/2026-08-31T00:05:00Z · Findings: 0 (material open: 0)
`;
}

/** Record the current bytes as a PASS receipt for `stage` and commit that write. */
function recordReceipt(f, { stage = "spec", unitKind = "feature", policy = "v1", parent } = {}) {
  const args = ["--stage", stage, "--dir", f.dir, "--unit", f.unit, "--unit-kind", unitKind];
  if (parent) args.push("--parent", parent);
  const built = f.build(...args);
  const progressPath = `${f.dir}/progress.md`;
  const previous = fs.existsSync(path.join(f.root, progressPath))
    ? fs.readFileSync(path.join(f.root, progressPath), "utf8") : "";
  f.write(progressPath, `${previous}${receiptBlock({
    stage, unit: f.unit, unitKind, digest: built.digest,
    sourceRevision: built.snapshot.sourceRevision, artifactRevision: built.snapshot.artifactRevisionId,
    parent: built.snapshot.parentSpecSnapshotDigest ?? "null", policy,
    verdict: stage === "spec" ? "spec-review-pass" : "plan-review-pass",
  })}\n`);
  const commit = f.commit(`docs(99): record ${stage} review receipt`);
  return { ...built, commit };
}

const verify = (f, stage, extra = []) => f.run("verify", "--stage", stage, "--dir", f.dir, "--unit", f.unit, ...extra);
const report = (result) => JSON.parse(result.stdout);

// ---------------------------------------------------------------------------
// RS3(b) — HEAD-defaulted identity must not decide whether a receipt is current
// ---------------------------------------------------------------------------

test("RS3b: the identity fields default to the newest commit that touched a bound path, not HEAD", (t) => {
  const f = makeRepo(t);
  f.write("src/code.ts", "export const a = 2;\n");
  const unbound = f.commit("chore: unrelated implementation commit");
  assert.notEqual(unbound, git(f.root, "rev-parse", "HEAD~1"), "the unbound commit is now HEAD");
  const { snapshot } = f.build("--stage", "spec", "--dir", f.dir, "--unit", f.unit);
  // ROADMAP.md is deliberately NOT a bound path (shared lifecycle ledger): the
  // identity covers the unit's artifacts plus the governing authorities only.
  const bound = git(f.root, "log", "-1", "--format=%H", "--", `${f.dir}/SPEC.md`, "CLAUDE.md");
  assert.equal(snapshot.sourceRevision, bound,
    "sourceRevision is the revision the bound bytes were actually read at");
  assert.equal(snapshot.artifactRevisionId, bound,
    "artifactRevisionId defaults to the same content-derived revision when the author pins none");
  assert.notEqual(snapshot.sourceRevision, unbound,
    "an unbound commit must NOT rotate the identity a receipt is bound to");
});

test("RS3b: an unbound commit leaves the snapshot digest byte-identical", (t) => {
  const f = makeRepo(t);
  const before = f.build("--stage", "spec", "--dir", f.dir, "--unit", f.unit);
  f.write("src/code.ts", "export const a = 3;\n");
  f.write("README.md", "implementation notes\n");
  f.commit("chore: unrelated work with no bound bytes");
  const after = f.build("--stage", "spec", "--dir", f.dir, "--unit", f.unit);
  assert.equal(after.digest, before.digest,
    "a commit that touches nothing bound stale-ifies every receipt (RS3b)");
  assert.equal(after.snapshot.sourceRevision, before.snapshot.sourceRevision);
});

test("RS3b: recording a receipt does not invalidate it", (t) => {
  const f = makeRepo(t);
  const recorded = recordReceipt(f, { stage: "spec" });
  // The only write between the review and the check is `progress.md`, which is
  // deliberately NOT bound: `execute-phase` must still find the receipt current.
  const result = verify(f, "spec");
  const r = report(result);
  assert.equal(r.digestMatches, true, `recording the receipt rotated its own digest: ${r.observedDigest} != ${recorded.digest}`);
  assert.equal(result.status, 0, `a freshly recorded receipt must admit the consumer, got exit ${result.status}: ${result.stdout}`);
  assert.equal(r.current, true);
});

test("RS3b: a bound edit invalidates the receipt exactly once", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  f.write(`${f.dir}/SPEC.md`, specText("Ship the other thing."));
  f.commit("docs(99): repair the Goal");
  const first = report(verify(f, "spec"));
  assert.equal(first.digestMatches, false, "a bound Product edit must stale the receipt");
  const second = report(verify(f, "spec"));
  assert.equal(second.observedDigest, first.observedDigest,
    "re-running the sensor on an unchanged tree must not move the digest again");
});

test("RS3b: explicit --source-revision/--artifact-revision still override the default", (t) => {
  const f = makeRepo(t);
  const pinnedRevision = git(f.root, "rev-parse", "HEAD");
  const built = f.build("--stage", "spec", "--dir", f.dir, "--unit", f.unit,
    "--source-revision", pinnedRevision, "--artifact-revision", "99-spec-repair-toy");
  assert.equal(built.snapshot.sourceRevision, pinnedRevision);
  assert.equal(built.snapshot.artifactRevisionId, "99-spec-repair-toy",
    "an authoring-event id stays a free-form id when the author supplies one");
  // The receipt recorded under that id re-verifies when the same id is passed.
  f.write(`${f.dir}/progress.md`, receiptBlock({
    stage: "spec", unit: f.unit, unitKind: "feature", digest: built.digest,
    sourceRevision: pinnedRevision, artifactRevision: "99-spec-repair-toy", parent: "null",
    verdict: "spec-review-pass",
  }));
  f.commit("docs(99): record pinned receipt");
  const pinned = report(verify(f, "spec", ["--source-revision", pinnedRevision, "--artifact-revision", "99-spec-repair-toy"]));
  assert.equal(pinned.digestMatches, true, "an explicit pin must be reproducible by the consumer");
  const unpinned = report(verify(f, "spec"));
  assert.equal(unpinned.digestMatches, false,
    "and a sensor that silently derived a different identity says so instead of pretending");
});

// ---------------------------------------------------------------------------
// RS13 — verify must name the dimension that drifted
// ---------------------------------------------------------------------------

test("RS13: a committed bound edit reports a specific dimension with the changed path", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  f.write(`${f.dir}/SPEC.md`, specText("Ship the other thing."));
  f.commit("docs(99): repair the Goal");
  const result = verify(f, "spec");
  const r = report(result);
  assert.equal(result.status, 4, "a stale receipt exits 4");
  assert.equal(r.structural.fresh, false);
  assert.notEqual(r.structural.reasonCode, "missing-receipt-snapshot",
    "the receipt DOES bind a snapshot — the sensor must say what moved, not that nothing is bound");
  assert.ok(PRE_EXECUTION_FRESHNESS_CODES.includes(r.structural.reasonCode),
    `reason code ${r.structural.reasonCode} is outside the published vocabulary`);
  assert.ok(Array.isArray(r.structural.changedPaths), "the report must name the bound paths");
  assert.ok(r.structural.changedPaths.includes(`${f.dir}/SPEC.md`),
    `SPEC.md moved and is not named: ${JSON.stringify(r.structural)}`);
  assert.match(typeof r.structural.detail === "string" ? r.structural.detail : "", /./,
    "one line of prose has to say which dimension differs");
});

test("RS13: an uncommitted bound edit is attributed to artifact content", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  f.write(`${f.dir}/SPEC.md`, specText("Ship the other thing."));
  const r = report(verify(f, "spec"));
  assert.equal(r.structural.reasonCode, "stale-artifact-content", JSON.stringify(r.structural));
  assert.deepEqual(r.structural.changedPaths, [`${f.dir}/SPEC.md`]);
});

test("RS13: a moved authority outranks artifact content (contract precedence)", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  f.write(`${f.dir}/SPEC.md`, specText("Ship the other thing."));
  f.write("CLAUDE.md", "# Project guide\n\nRules that the reviewer never read.\n");
  const r = report(verify(f, "spec"));
  assert.equal(r.structural.reasonCode, "stale-context",
    "the schema comparator answers stale-context before content; the CLI must not drift from it");
  assert.ok(r.structural.changedPaths.includes("CLAUDE.md"));
});

test("RS13: a moved policy is its own dimension", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  const r = report(verify(f, "spec", ["--policy", "v2"]));
  assert.equal(r.structural.reasonCode, "stale-policy", JSON.stringify(r.structural));
});

test("RS13: a rotated authoring revision with identical bytes is its own dimension", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  const r = report(verify(f, "spec", ["--artifact-revision", "99-rotated-after-a-revert"]));
  assert.equal(r.structural.reasonCode, "stale-artifact-revision", JSON.stringify(r.structural));
  assert.deepEqual(r.structural.changedPaths, [], "no bound byte moved, so none may be named");
});

test("RS13: a plan receipt whose Product lineage moved is attributed to the parent", (t) => {
  const f = makeRepo(t);
  const spec = recordReceipt(f, { stage: "spec" });
  const plan = recordReceipt(f, { stage: "plan", parent: spec.digest });
  assert.equal(plan.result.status, 0);
  assert.equal(verify(f, "plan", ["--parent", spec.digest]).status, 0,
    JSON.stringify(report(verify(f, "plan", ["--parent", spec.digest]))));
  // An UNCOMMITTED Product edit moves the parent digest without moving any revision,
  // which is what makes this dimension separable from content and source.
  f.write(`${f.dir}/SPEC.md`, specText("Ship the other thing."));
  const movedParent = f.build("--stage", "spec", "--dir", f.dir, "--unit", f.unit).digest;
  assert.notEqual(movedParent, spec.digest);
  const lineage = report(verify(f, "plan", ["--parent", movedParent]));
  assert.equal(lineage.structural.reasonCode, "stale-parent", JSON.stringify(lineage.structural));
  assert.equal(lineage.structural.changedPaths.length, 0,
    "the parent moved, not a plan-bound byte: naming a path here would be a lie");
  const bytes = report(verify(f, "plan", ["--parent", spec.digest]));
  assert.equal(bytes.structural.reasonCode, "stale-artifact-content",
    "with the lineage held constant, the same edit is content drift");
});

test("RS13: missing-receipt-snapshot keeps its true meaning", (t) => {
  const f = makeRepo(t);
  const none = verify(f, "spec");
  assert.equal(none.status, 3, "no receipt block for the stage");
  assert.equal(report(none).code, "missing-receipt-snapshot");
  // A block whose Snapshot line is prose binds no digest: still precedence 1.
  f.write(`${f.dir}/progress.md`, receiptBlock({
    stage: "spec", unit: f.unit, unitKind: "feature", digest: "not-a-digest-yet",
    sourceRevision: git(f.root, "rev-parse", "HEAD"), artifactRevision: "rev-1", parent: "null",
    verdict: "spec-review-pass",
  }));
  f.commit("docs(99): record a block that binds nothing");
  const prose = verify(f, "spec");
  assert.equal(report(prose).structural.reasonCode, "missing-receipt-snapshot",
    "a receipt with no parsable digest is exactly what this code means");
  assert.equal(prose.status, 4, "a receipt exists but is not current");
});

test("RS13: the report keeps every key the consumers already read", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  const r = report(verify(f, "spec"));
  for (const key of ["current", "stage", "unit", "receipt", "observedDigest", "digestMatches", "verdictIsPass", "structural"]) {
    assert.ok(key in r, `report loses the ${key} key`);
  }
  assert.equal(typeof r.structural.fresh, "boolean");
});

// ---------------------------------------------------------------------------
// RS14 — the documented recipe must be reachable
// ---------------------------------------------------------------------------

test("RS14: a feature plan snapshot without --parent names the remedy", (t) => {
  const f = makeRepo(t);
  const r = f.run("build", "--stage", "plan", "--dir", f.dir, "--unit", f.unit);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /parent/i, `the refusal must name the missing parent, got: ${r.stderr}`);
  assert.match(r.stderr, /--parent/);
  assert.match(r.stderr, /--stage spec/, "and point at the command that produces the digest");
  const v = f.run("verify", "--stage", "plan", "--dir", f.dir, "--unit", f.unit);
  assert.equal(v.status, 1);
  assert.match(v.stderr, /--parent/, "verify shares the builder and must explain the same thing");
});

test("RS14: a fix unit binds no parent and reaches the no-receipt path", (t) => {
  const f = makeRepo(t, { dir: "docs/fix/99-toy-fix", unit: "fix-99" });
  f.write("docs/fix/99-toy-fix/SPEC.md", [
    "# Fix 99 — the sensor", "## Goal", "", "Stop stale-ifying receipts.", "## Branch", "", "`fix/99`",
    "## Scope", "", "- the sensor", "## Acceptance", "", "- A1", "## Phases", "", "### P1", "", "- do it",
    "## Status", "", "`planned`", "",
  ].join("\n"));
  f.commit("docs(fix-99): the fix SPEC has no Product half");
  const built = f.build("--stage", "plan", "--dir", "docs/fix/99-toy-fix", "--unit", "fix-99", "--unit-kind", "fix");
  assert.equal(built.snapshot.unitKind, "fix");
  assert.equal(built.snapshot.parentSpecSnapshotDigest, null,
    "a fix unit has no Product snapshot to bind (D6, RS14)");
  const v = f.run("verify", "--stage", "plan", "--dir", "docs/fix/99-toy-fix", "--unit", "fix-99", "--unit-kind", "fix");
  assert.equal(v.status, 3, `a fix unit with no receipt must reach exit 3, got ${v.status}: ${v.stderr}`);
  assert.equal(report(v).code, "missing-receipt-snapshot");
});

test("RS14: a fix plan receipt recorded with a null parent verifies current", (t) => {
  const f = makeRepo(t, { dir: "docs/fix/99-toy-fix", unit: "fix-99" });
  const recorded = recordReceipt(f, { stage: "plan", unitKind: "fix" });
  assert.equal(recorded.snapshot.parentSpecSnapshotDigest, null);
  const v = f.run("verify", "--stage", "plan", "--dir", f.dir, "--unit", f.unit, "--unit-kind", "fix");
  assert.equal(v.status, 0, `fix receipt must survive its own recording commit: ${v.stdout}`);
});

// ---------------------------------------------------------------------------
// Roadmap scoping — the shared ROADMAP.md is lifecycle state, not bound authority
// ---------------------------------------------------------------------------

test("roadmap: an unrelated unit's row does not stale a recorded receipt", (t) => {
  const f = makeRepo(t);
  recordReceipt(f, { stage: "spec" });
  f.write("docs/features/ROADMAP.md", "# Roadmap\n\n| 99 | 99-toy | planned |\n| 100 | 100-other | planned |\n");
  const uncommitted = report(verify(f, "spec"));
  assert.equal(uncommitted.digestMatches, true, "an uncommitted roadmap edit binds none of this unit's bytes");
  assert.equal(uncommitted.current, true);
  f.commit("docs(roadmap): schedule another feature");
  const committed = report(verify(f, "spec"));
  assert.equal(committed.digestMatches, true, JSON.stringify(committed.structural));
  assert.equal(committed.current, true,
    "another unit's roadmap row never invalidates this unit's receipt");
});

test("roadmap: the unit's own sanctioned status transition does not stale its receipts", (t) => {
  const f = makeRepo(t);
  const spec = recordReceipt(f, { stage: "spec" });
  recordReceipt(f, { stage: "plan", parent: spec.digest });
  // execute-phase P1's mandated write: row → in-progress.
  f.write("docs/features/ROADMAP.md", "# Roadmap\n\n| 99 | 99-toy | in-progress |\n");
  f.commit("docs(roadmap): 99-toy in-progress (P1)");
  const v = verify(f, "plan", ["--parent", spec.digest]);
  const r = report(v);
  assert.equal(v.status, 0, `the status machine's own write must not force a re-review: ${JSON.stringify(r.structural)}`);
  assert.equal(r.current, true);
});

// ---------------------------------------------------------------------------
// The package contract the sensor prints must stay the sensor's only vocabulary
// ---------------------------------------------------------------------------

test("the sensor prints only published codes and refuses to invent a snapshot", async () => {
  // A guard on the framing of RS13: the CLI may not synthesize a fake "reviewed"
  // snapshot object to feed the comparator, because that is what produced the
  // always-firing precedence-1 answer.
  const source = fs.readFileSync(sensorScript, "utf8");
  assert.doesNotMatch(source, /comparePreExecutionReceiptToSnapshot\([\s\S]{0,400}?snapshot,\s*snapshot,\s*opts\.policy/,
    "the CLI may only compare a receipt to the snapshot it genuinely reviewed (the digest-matched case)");
  assert.ok(/PRE_EXECUTION_FRESHNESS_CODES/.test(source), "the CLI must keep importing the published vocabulary");
  const reviewedOnly = await buildPreExecutionArtifactSnapshot({
    stage: "spec", unitKind: "feature", unitId: "toy", sourceRevision: "0".repeat(40),
    artifactRevisionId: "rev-1", files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: specText() }],
  });
  assert.equal(reviewedOnly.ok, true);
  const digest = await digestPreExecutionArtifactSnapshot(reviewedOnly.snapshot);
  assert.match(digest, /^[a-f0-9]{64}$/);
});
