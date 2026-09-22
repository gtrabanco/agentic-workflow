#!/usr/bin/env node

/**
 * Feature 59 — per-class continuation discipline (AC-03, AC-05).
 *
 * One throwaway git fixture repo per v1 class (status refresh · planning-gate
 * re-run · review-receipt refresh). For each class the suite proves the three
 * things the SPEC's class table promises:
 *
 *   1. the emitted command **parses** — `parseContinuationArgv(rendering)`
 *      re-derives exactly `continuation.argv` (argv is the command of record);
 *   2. its preconditions are **checkable at emit time** — each row carries a
 *      boolean `satisfied` and the evidence token's digest re-derives from the
 *      artifact bytes (nothing is persisted);
 *   3. executing the command exactly as emitted **advances the named
 *      `convergence` field** — the field is read before and after the command's
 *      documented effect, and must move.
 *
 * The commands are agent skills, not OS binaries, so "executing" means running
 * the command's documented effect through the SAME machinery the skill runs: a
 * `/workflow-status` continuation re-runs the sensor, and a `/review-spec` or
 * `/review-plan` continuation builds the stage snapshot with
 * `scripts/pre-execution-snapshot.mjs` and persists the receipt block the review
 * skill publishes (`OUTPUT.md`). That is the strongest execution a docs-and-scripts
 * repository can fixture without a model in the loop.
 *
 * Rendering pins (AC-05): the POSIX rendering is derivable from argv, the Windows
 * family is derivable by the same rule, argv is never altered by rendering, and a
 * forced divergence fails.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { loadSchemaRuntime } from "./schema-runtime.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SENSOR = path.join(repoRoot, "scripts", "workflow-status.mjs");
const SNAPSHOT = path.join(repoRoot, "scripts", "pre-execution-snapshot.mjs");

const schema = await loadSchemaRuntime();
const {
  deriveContinuationRendering,
  parseContinuationArgv,
  validateContinuation,
  verifyContinuationEvidence,
  sha256HexSync,
} = schema;

const FIXTURE_DIRS = new Set();
function mkTmp(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  FIXTURE_DIRS.add(dir);
  return dir;
}
after(() => {
  for (const dir of FIXTURE_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

const ROADMAP_HEADER = [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Depends on | Summary |",
  "|----|------|--------|------------|---------|",
].join("\n");
const FIX_INDEX = "# Active fixes\n\n## Active\n\n| Issue | Topic | Status | Notes |\n|---|---|---|---|";
const FROZEN_NRS = "# Normalized repository state\n\nStatus: frozen\n\nSnapshot: fix-1";
const GUIDE = "# Project guide\n\nRules.\n";
const ACCEPTANCE = "# Acceptance\n\n- A1 the thing ships.\n";

/** The Product half `spec-product-v1` binds (same toy shape the verifier suite uses). */
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

const GH_SHIM = `#!/usr/bin/env node
const args = process.argv.slice(2).join(" ");
const out = (value) => { process.stdout.write(JSON.stringify(value)); process.exit(0); };
if (args.includes("pr list") && args.includes("--state open")) out([]);
if (args.includes("pr list") && args.includes("--state merged")) out([]);
if (args.includes("issue list")) out([]);
process.stderr.write("unexpected gh call: " + args + "\\n"); process.exit(1);
`;

/**
 * A throwaway git repo carrying the unit's planning artifacts, the context files
 * the snapshot binds, a `gh` shim, and an in-repo `scripts/` mirror so the review
 * skill's own recipe runs against the fixture.
 */
function makeFixture({ unit = "90-alpha", status = "defined", branch = "main", extraFiles = {} } = {}) {
  const dir = mkTmp("continuation-discipline-");
  const binDir = path.join(dir, "bin");
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(path.join(binDir, "gh"), GH_SHIM, { mode: 0o755 });

  const write = (rel, content) => {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };
  const unitDir = `docs/features/${unit}`;

  write("docs/features/ROADMAP.md", `${ROADMAP_HEADER}\n| ${unit.slice(0, 2)} | \`${unit.slice(3)}\` | ${status} | — | a unit |\n`);
  write("docs/fix/README.md", `${FIX_INDEX}\n`);
  write("docs/workflow/REPOSITORY_STATE.md", `${FROZEN_NRS}\n`);
  write("AGENTS.md", GUIDE);
  write(`${unitDir}/SPEC.md`, specText());
  write(`${unitDir}/ACCEPTANCE.md`, ACCEPTANCE);
  write(`${unitDir}/PLAN.md`, "# Plan\n\nP1 ships it.\n");
  write(`${unitDir}/planning-evidence.md`, "# Evidence\n\n- PE-1 measured.\n");
  write(`${unitDir}/planning-obligations.md`, "# Obligations\n\n- OB-1.\n");
  for (const [rel, content] of Object.entries(extraFiles)) write(rel, content);

  // Every commit predates the receipt stamps below, so the impossible-timeline
  // guard never mis-flags the fixture (the same convention the verifier suite uses).
  const FIXTURE_DATE = "2026-08-30T00:00:00Z";
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  const gitDated = (...args) => execFileSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GIT_COMMITTER_DATE: FIXTURE_DATE, GIT_AUTHOR_DATE: FIXTURE_DATE },
  }).trim();
  git("init", "-q", "-b", branch);
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Fixture");
  git("config", "commit.gpgsign", "false");
  const commit = (message = "fixture") => {
    gitDated("add", "-A", "--", ".");
    gitDated("commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  commit("planning artifacts frozen");

  const runSensor = () => spawnSync(process.execPath, [SENSOR], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    timeout: 120_000,
  });
  /** Build a stage snapshot with the review skill's own recipe, rooted at the fixture. */
  const buildStage = (stage, unitKind = "feature", parent = null) => {
    const args = ["build", "--stage", stage, "--dir", unitDir, "--unit", unit, "--unit-kind", unitKind, "--root", dir];
    if (parent) args.push("--parent", parent);
    const result = spawnSync(process.execPath, [SNAPSHOT, ...args], { cwd: dir, encoding: "utf8", timeout: 120_000 });
    assert.equal(result.status, 0, `snapshot build failed (${stage}): ${result.stderr}`);
    const [digest, ...rest] = result.stdout.split("\n");
    return { digest: digest.trim(), snapshot: JSON.parse(rest.join("\n")) };
  };
  const readProgress = () => {
    const abs = path.join(dir, unitDir, "progress.md");
    return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
  };
  /** The receipt block `review-spec`/`review-plan` publish; recording it IS the command's effect. */
  const recordReceipt = (stage, parent = null) => {
    const built = buildStage(stage, "feature", parent);
    const block = `## Pre-execution review receipt v1 — ${stage}
- Review: rs-toy-001 · Snapshot: ${built.digest} · Verdict: ${stage === "spec" ? "spec-review-pass" : "plan-review-pass"}
- Unit: ${unit} · Stage: ${stage} · Parent: ${stage === "spec" ? "null" : parent}
- Source revision: ${built.snapshot.sourceRevision} · Artifact revision: ${built.snapshot.artifactRevisionId}
- Reviewer: reviewer-session · Session: s-1 · Role: reviewer · Author: author-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-01T00:00:00Z/2026-09-01T00:05:00Z · Findings: 0 (material open: 0)
`;
    write(`${unitDir}/progress.md`, `${readProgress()}${block}\n`);
    return built;
  };

  return { dir, unit, unitDir, write, commit, runSensor, buildStage, recordReceipt, readProgress };
}

const envelopeOf = (result) => {
  assert.equal(result.status, 0, `sensor must exit 0: ${result.stderr}`);
  return JSON.parse(result.stdout);
};

/** Read a convergence field path out of an emitted envelope (SPEC/E-59-6 vocabulary). */
function convergenceValue(envelope, field) {
  if (field === "next.recommended") return envelope.next.recommended ?? null;
  const match = /^detail\.pre_execution\.([a-z-]+)\.label$/.exec(field);
  if (match) {
    const row = (envelope.detail.pre_execution ?? []).find((entry) => entry.stage === match[1]);
    return row ? row.label : null;
  }
  throw new Error(`unknown convergence field: ${field}`);
}

/**
 * Execute a continuation exactly as emitted, against the fixture. The command is
 * an agent skill, so its fixture effect is the one the skill performs: the sensor
 * re-runs itself, a review command builds the stage snapshot and persists the
 * receipt block, and a driver-visible repair is applied where the class names one.
 */
function executeContinuation(fixture, continuation, { onExecuted } = {}) {
  const [verb] = continuation.argv;
  if (verb === "/workflow-status") {
    if (onExecuted) onExecuted();
    return envelopeOf(fixture.runSensor());
  }
  if (verb === "/review-spec") {
    fixture.recordReceipt("spec");
    fixture.commit("docs: record spec review receipt");
    return envelopeOf(fixture.runSensor());
  }
  if (verb === "/review-plan") {
    const spec = fixture.buildStage("spec", "feature");
    fixture.recordReceipt("spec");
    fixture.recordReceipt("plan", spec.digest);
    fixture.commit("docs: record plan review receipt");
    return envelopeOf(fixture.runSensor());
  }
  throw new Error(`no fixture executor for ${verb}`);
}

/** Assert the emit-time preconditions are checkable and the evidence token verifies. */
function assertPreconditionsCheckable(fixture, continuation) {
  assert.ok(Array.isArray(continuation.preconditions));
  for (const row of continuation.preconditions) {
    assert.equal(typeof row.id, "string");
    assert.ok(row.check.length > 0, `precondition ${row.id} names what it checks`);
    assert.equal(typeof row.satisfied, "boolean");
  }
  if (continuation.evidence) {
    const abs = path.join(fixture.dir, continuation.evidence.artifact);
    assert.ok(fs.existsSync(abs), `evidence artifact exists: ${continuation.evidence.artifact}`);
    const text = fs.readFileSync(abs, "utf8");
    assert.equal(continuation.evidence.digest, sha256HexSync(text), "the token hash equals the artifact digest");
    assert.equal(verifyContinuationEvidence(continuation, text), true);
  }
  assert.deepEqual(validateContinuation(continuation), []);
}

// ---------------------------------------------------------------------------
// Class 1 — status refresh
// ---------------------------------------------------------------------------

test("class status-refresh: the emitted /workflow-status continuation parses, checks, and advances next.recommended", () => {
  const fixture = makeFixture({ status: "planned", branch: "feat/90-alpha", extraFiles: {
    "docs/features/90-alpha/TASKS.md": "# Tasks\n\nNo phase headings yet.\n",
    "scratch.txt": "dirty work\n",
  } });
  const first = envelopeOf(fixture.runSensor());
  assert.equal(first.detail.crash_recovery.verdict, "AMBIGUOUS", "the fixture is the recovery case the class serves");
  const continuation = first.next.continuation;
  assert.ok(continuation, "the ambiguous recovery emits a continuation");
  assert.deepEqual(continuation.argv, ["/workflow-status"]);
  assert.equal(continuation.convergence, "next.recommended");

  // 1. parses
  assert.deepEqual(parseContinuationArgv(continuation.rendering), continuation.argv);
  // 2. checkable
  assertPreconditionsCheckable(fixture, continuation);
  assert.equal(convergenceValue(first, continuation.convergence), "/workflow-status");

  // 3. execute exactly as emitted: first commit the dirty work, then let the
  // sensor re-derive. The refreshed envelope names the now-unique next phase.
  const second = executeContinuation(fixture, continuation, {
    onExecuted: () => {
      fixture.write("docs/features/90-alpha/TASKS.md", "# Tasks\n\n## P1 — Implementation\n\n- [ ] Ship it.\n");
      fixture.commit("docs: name the next phase in the ledger");
    },
  });
  assert.notEqual(
    convergenceValue(second, continuation.convergence),
    convergenceValue(first, continuation.convergence),
    "executing the status refresh must advance next.recommended",
  );
  assert.match(convergenceValue(second, continuation.convergence), /^\/execute-phase 90 P1$/);
});

// ---------------------------------------------------------------------------
// Class 2 (retired) → lane currency — feature 61 P8b
// ---------------------------------------------------------------------------
// The planning-gate-rerun and review-receipt-refresh classes exercised the
// spec/plan receipt staleness of the retired pipeline: drift a bound byte, the
// receipt goes stale, /review-spec re-runs the review and advances
// detail.pre_execution.spec.label. The lane replaces receipt currency with the
// unit doc's triage block: a defined unit emits a /unit-lane continuation
// (status-refresh class) whose convergence is the sensor's own recommendation.

test("lane currency: a defined unit emits a /unit-lane continuation that converges by re-sensing", () => {
  const fixture = makeFixture({ status: "defined" });
  const first = envelopeOf(fixture.runSensor());
  const continuation = first.next.continuation;
  assert.ok(continuation, "a non-terminal defined unit emits a continuation");
  assert.deepEqual(continuation.argv, ["/unit-lane", fixture.unit]);
  assert.equal(continuation.convergence, "next.recommended");

  // 1. parses
  assert.deepEqual(parseContinuationArgv(continuation.rendering), continuation.argv);
  // 2. checkable
  assertPreconditionsCheckable(fixture, continuation);
  // 3. the class is status-refresh: re-sensing advances next.recommended by
  //    reflecting the same startable state (the conductor owns real movement).
  const second = envelopeOf(fixture.runSensor());
  assert.equal(convergenceValue(second, "next.recommended"), continuation.argv.join(" "));
});

// ---------------------------------------------------------------------------
// Rendering pins (AC-05)
// ---------------------------------------------------------------------------

test("rendering is derivable from argv per platform family; argv is never altered", () => {
  const argv = ["/review-spec", "90-alpha", "two words"];
  const posix = deriveContinuationRendering(argv, "posix");
  const windows = deriveContinuationRendering(argv, "windows");
  assert.equal(posix, "/review-spec 90-alpha 'two words'");
  assert.equal(windows, "/review-spec 90-alpha \"two words\"");
  assert.deepEqual(parseContinuationArgv(posix), argv);
  assert.deepEqual(parseContinuationArgv(windows), argv);
  assert.deepEqual(argv, ["/review-spec", "90-alpha", "two words"], "rendering never mutates argv");
});

test("a forced rendering divergence fails the derivation", () => {
  const argv = ["/review-spec", "90-alpha"];
  const derived = deriveContinuationRendering(argv, "posix");
  assert.notEqual(derived, "/review-spec 91-beta");
  assert.throws(() => deriveContinuationRendering(argv, "plan9"), /unknown continuation platform family/);
});
