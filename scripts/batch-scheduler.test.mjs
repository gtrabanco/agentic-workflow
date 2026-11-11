#!/usr/bin/env node

/**
 * batch-scheduler — the deterministic batch planner's suite (issue #449).
 *
 * One test per requested rule (unit doc docs/fix/449-batch-scheduler-sensor/
 * SPEC.md S2–S9), plus determinism, degradation and the source-level pins that
 * keep the planner a planner (it never spawns, never creates worktrees). Every
 * test runs against a scratch repository root under the OS temp dir and an
 * injected issue fixture — never the live tree, never the forge.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./batch-scheduler.mjs", import.meta.url));
const {
  buildBatchPlan,
  collectIssues,
  collectLaunchEvidence,
  updateState,
  loadState,
  saveState,
  claimedKey,
  CLAIM_TTL_MS,
  extractSurfaces,
  extractProseDependencies,
  STATE_FILE_NAME,
} = await import(scriptPath);

const HEAD = "b8b1d8147b1ecb79ef92355a53309c2b82a3c3d2";

// ── fixture helpers ────────────────────────────────────────────────────────

/** A scratch repo root with a roadmap; removed by the caller (each test removes its own). */
function scratchRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "batch-scheduler-"));
}

/** Dependency-table block as real issue bodies carry it (issue #433's shape). */
function depsTable(rows) {
  const lines = rows.map(([dep, kind, why]) => `| ${dep} | ${kind} | ${why} |`);
  return ["## Dependencies", "", "| Depends on | Kind | Why |", "|---|---|---|", ...lines].join("\n");
}

/** Where/scope section as real issue bodies carry it. */
function whereSection(paths) {
  return ["## Where", "", paths.map((p) => `- \`${p}\``).join("\n")].join("\n");
}

function issue(number, title, body, blockedBy = [], labels = []) {
  return { number, title, body, blockedBy, labels };
}

/** Build the roadmap document a scratch root needs (canonical location). */
function roadmapDoc() {
  return [
    "# Roadmap",
    "",
    "## Features",
    "",
    "| NN | Slug | Status | Depends on | Summary |",
    "|----|------|--------|------------|---------|",
    "",
    "## Fixes",
    "",
    "| Issue | Topic | Status | Notes |",
    "|---|---|---|---|",
    "",
  ].join("\n");
}

/** Roadmap document with a `## Fixes` table carrying `rows` (issue/topic/status/notes). */
function roadmapDocWithFixes(rows) {
  return [
    "# Roadmap",
    "",
    "## Features",
    "",
    "| NN | Slug | Status | Depends on | Summary |",
    "|----|------|--------|------------|---------|",
    "",
    "## Fixes",
    "",
    "| Issue | Topic | Status | Notes |",
    "|---|---|---|---|",
    ...rows.map(([issue, topic, status, notes]) => `| [#${issue}](https://example.invalid/issues/${issue}) | ${topic} | ${status} | ${notes} |`),
    "",
  ].join("\n");
}

const baseInput = (issues, root, overrides = {}) => ({
  issues,
  root,
  head: HEAD,
  previous: null,
  ...overrides,
});

// ── S2/O1 — the envelope exists, is shaped, and is deterministic ───────────

test("S2: emits a batch-plan@3 envelope with batches, blocked and findings arrays", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.equal(plan.schema, "batch-plan@3");
    assert.equal(plan.source_revision, HEAD);
    assert.deepEqual(plan.degraded, []);
    assert.ok(Array.isArray(plan.batches));
    assert.ok(Array.isArray(plan.blocked));
    assert.ok(Array.isArray(plan.findings));
    assert.deepEqual(plan.summary, { open_issues: 1, batched: 1, blocked: 0, launched: 0, findings: 0, batches: 1, label_blocked: 0 });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S4/O6 — lane, worktree, command and reason per issue ───────────────────

test("S4: every batched issue carries lane, worktree, launch command and reason", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.number, 10);
    assert.equal(row.lane, "skills/alpha");
    assert.equal(row.worktree, "feat/10-alpha-skill-change");
    assert.equal(row.command, "/unit-lane --from-issue 10");
    assert.equal(row.reason.kind, "satisfied-inputs");
    assert.ok(row.reason.detail.length > 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("S4: bug-labelled issues derive a fix/ worktree prefix", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(20, "Sensor crashes on empty index", whereSection(["scripts/sensor.mjs"]), [], ["bug"])];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.equal(plan.batches[0].lanes[0].issues[0].worktree, "fix/20-sensor-crashes-on-empty-index");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S5/O2 — hard blockers gate ─────────────────────────────────────────────

test("S5: an issue with an open native blocked-by lands in a later batch, named in blocked", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(27, "Config schema", whereSection(["packages/config/src/index.ts"])),
      issue(444, "Panel", whereSection(["packages/pi-web/src/panel.ts"]), [27]),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const batchOf = (n) => plan.batches.find((b) => b.lanes.some((l) => l.issues.some((i) => i.number === n)))?.n;
    assert.equal(batchOf(27), 1);
    assert.equal(batchOf(444), 2);
    assert.deepEqual(plan.blocked, [{ number: 444, blockers: [27], reason: "blocked-by 27 (open)" }]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("S5: a blocker absent from the open set is satisfied (closed issues do not gate)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(444, "Panel", whereSection(["packages/pi-web/src/panel.ts"]), [27])];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.equal(plan.blocked.length, 0);
    assert.equal(plan.batches[0].lanes[0].issues[0].number, 444);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S5/O3 — soft dependencies order ────────────────────────────────────────

test("S5: a soft dep orders a same-surface pair inside one lane, never batches them apart", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "soft", "same area: the doc index consumes the emitter"]]);
    const issues = [
      issue(11, "Doc index queries", `${whereSection(["skills/doc-index/SKILL.md"])}\n\n${deps}`),
      issue(10, "Doc emitter", whereSection(["skills/doc-index/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const lane = plan.batches[0].lanes[0];
    assert.equal(lane.surface, "skills/doc-index");
    assert.deepEqual(
      lane.issues.map((i) => i.number),
      [10, 11],
      "the soft target precedes its dependent in the shared lane",
    );
    assert.equal(lane.issues[1].reason.kind, "soft-ordered");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("S5: a soft dep whose target is in a later batch pulls the dependent to a batch at or after it", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "soft", "order preference: design notes land first"]]);
    const issues = [
      issue(11, "Doc index queries", `${whereSection(["skills/alpha/SKILL.md"])}\n\n${deps}`),
      issue(10, "Design notes", whereSection(["docs/design/notes.md"]), [99]),
      issue(99, "Unrelated blocker of 10", whereSection(["packages/other/src/x.ts"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const batchOf = (n) => plan.batches.find((b) => b.lanes.some((l) => l.issues.some((i) => i.number === n)))?.n;
    assert.ok(batchOf(11) >= batchOf(10), "the soft-dependent never runs before its soft target");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S5/O4 — single-occupant-per-surface ────────────────────────────────────

test("S5: two issues sharing one surface share one lane; disjoint surfaces get disjoint lanes", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "Alpha one", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Alpha two", whereSection(["skills/alpha/references/A.md"])),
      issue(12, "Beta one", whereSection(["packages/beta/src/index.ts"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const lanesOf = (n) => plan.batches.flatMap((b) => b.lanes).filter((l) => l.issues.some((i) => i.number === n));
    assert.equal(lanesOf(10).length, 1, "each issue occupies exactly one lane");
    assert.equal(lanesOf(11).length, 1);
    assert.equal(lanesOf(10)[0], lanesOf(11)[0], "same surface, same lane");
    assert.notEqual(lanesOf(10)[0], lanesOf(12)[0], "disjoint surfaces, disjoint lanes");
    assert.deepEqual(
      lanesOf(10)[0].issues.map((i) => i.number),
      [10, 11],
      "the shared lane serializes its occupants",
    );
    assert.equal(lanesOf(11)[0].issues[1].reason.kind, "surface-conflict");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    }
});

// ── B3 — a tree-root token must never split a real surface across lanes ───
// Reproducer of external-verify B3: `skills/**` and `skills/alpha` landed in
// two lanes of the same batch, so two issues touching the same skill ran in
// parallel (S5: "one lane per surface … two skills twice if disjoint").

test("B3: a tree-root token expands over the declared children, never a sibling lane", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(30, "Whole-tree skill sweep", whereSection(["skills/**"])),
      issue(31, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const lanes = plan.batches.flatMap((b) => b.lanes);
    assert.deepEqual(lanes.map((l) => l.surface), ["skills/alpha"], "the root token joins the child lane, it does not open one");
    assert.deepEqual(lanes[0].issues.map((i) => i.number), [30, 31], "both serialize in the one real surface");
    assert.equal(lanes[0].issues[1].reason.kind, "surface-conflict");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("B3: a root token with no declared child keeps the tree-root key, never a wildcard", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const surfaces = extractSurfaces(`## In scope\n\n- \`skills/\`\n- \`packages/**\`\n- \`./scripts/batch-scheduler.mjs\`\n`);
    assert.deepEqual([...surfaces].sort(), ["packages", "scripts", "skills"], "no wildcard or trailing slash survives");
    const plan = buildBatchPlan(baseInput([issue(40, "Sweep", whereSection(["skills/**"]))], root));
    assert.deepEqual(plan.batches[0].lanes.map((l) => l.surface), ["skills"], "the documented tree-root key");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("B3: a body with no Where/In scope section still names its surfaces (the documented fallback)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const body = "Fixes the emitter at `packages/beta/src/index.ts`; the golden runs over `skills/**`.";
    const plan = buildBatchPlan(baseInput([issue(50, "No sections", body)], root));
    assert.deepEqual(plan.batches[0].lanes.map((l) => l.surface).sort(), ["packages/beta", "skills"], "the body is the fallback source");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S5/O5 — measured-size hints ────────────────────────────────────────────

test("S5: issues carry a size hint from their declared evidence and lanes an aggregate", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "Small fix (S)", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Large feature (L)", whereSection(["packages/pi-web/src/a.ts", "packages/pi-web/src/b.ts", "skills/alpha/SKILL.md", "skills/beta/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const all = plan.batches.flatMap((b) => b.lanes.flatMap((l) => l.issues));
    assert.equal(all.find((i) => i.number === 10).size_hint, "light");
    assert.equal(all.find((i) => i.number === 11).size_hint, "heavy");
    const alphaLane = plan.batches[0].lanes.find((l) => l.surface === "skills/alpha");
    assert.equal(alphaLane.size_hint, "heavy", "a lane's hint is the max of its issues'");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S3 — surfaces read from where they live ────────────────────────────────
// Issue #509 supersedes this file's original S3 assertion ("a unit doc on disk
// marks the issue launched"): unit-doc existence is precisely the signal the
// issue declares buggy, because a merged or parked unit doc persists on disk.
// The rule now starts at V1 below, over the same fixture shape.

// ── V — launch detection is evidence-based (issue #509, S3) ────────────────
// Reproducers of bug 2: a merged unit doc and a parked-but-open PR both read as
// "launched", and a live lane with no unit doc read as launchable.

/** The evidence map the CLI collects, built by hand for a pure-function test. */
function evidenceFor(entries) {
  const map = new Map();
  for (const [number, entry] of Object.entries(entries)) {
    map.set(Number(number), { branches: entry.branches ?? [], pr: entry.pr ?? null, worktree: entry.worktree ?? null, files: entry.files ?? [] });
  }
  return map;
}

test("V1: a unit doc on disk alone no longer marks an issue launched", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    withInFlightUnit(root, 10, "alpha-skill-change");
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.launched, [], "a unit doc is not evidence that the unit is still running");
    assert.equal(plan.summary.launched, 0);
    assert.ok(
      plan.batches.some((b) => b.lanes.some((l) => l.issues.some((i) => i.number === 10))),
      "a unit doc with no live branch or open PR is launchable",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("V2: an unmerged branch marks the issue in flight, naming the branch", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    withInFlightUnit(root, 10, "alpha-skill-change");
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"])),
      issue(12, "Alpha follow-up", whereSection(["skills/alpha/SKILL.md"])),
    ];
    const launchEvidence = evidenceFor({ 10: { branches: [{ name: "fix/10-alpha-skill-change", merged: false }] } });
    const plan = buildBatchPlan(baseInput(issues, root, { launchEvidence }));
    assert.deepEqual(plan.launched, [
      { number: 10, evidence: "branch fix/10-alpha-skill-change + unit-doc docs/fix/10-alpha-skill-change" },
    ]);
    assert.ok(!plan.batches.some((b) => b.lanes.some((l) => l.issues.some((i) => i.number === 10))), "in flight, never batched");
    const alpha = plan.batches[0].lanes.find((lane) => lane.surface === "skills/alpha");
    assert.equal(alpha.occupied_by, "branch fix/10-alpha-skill-change + unit-doc docs/fix/10-alpha-skill-change");
    assert.equal(plan.batches[0].lanes.find((lane) => lane.surface === "skills/beta").occupied_by, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("V3: a merged branch or a merged PR is terminal — the issue is launchable again", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    withInFlightUnit(root, 10, "alpha-skill-change");
    withInFlightUnit(root, 11, "beta-change");
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"])),
    ];
    const launchEvidence = evidenceFor({
      10: { branches: [{ name: "fix/10-alpha-skill-change", merged: true }] },
      11: { branches: [{ name: "fix/11-beta-change", merged: false }], pr: { number: 99, state: "MERGED" } },
    });
    const plan = buildBatchPlan(baseInput(issues, root, { launchEvidence }));
    assert.deepEqual(plan.launched, [], "a merged unit doc is a finished unit, not an in-flight one");
    assert.equal(plan.batches.flatMap((b) => b.lanes).flatMap((l) => l.issues).length, 2, "both are launchable");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("V4: an open forge PR marks the issue in flight; an unreadable forge degrades declared", async () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: root }).status, 0);
    assert.equal(spawnSync("git", ["remote", "add", "origin", "git@github.com:owner/repo.git"], { cwd: root }).status, 0);
    const shim = path.join(root, "gh");
    fs.writeFileSync(
      shim,
      [
        "#!/bin/sh",
        'if [ "$1" = "pr" ] && [ "$2" = "list" ]; then',
        '  printf %s \'[{"number":506,"headRefName":"feat/269-efficient-context-targeting","state":"OPEN"}]\'',
        "else",
        "  exit 5",
        "fi",
        "",
      ].join("\n"),
    );
    fs.chmodSync(shim, 0o755);

    const open = await collectLaunchEvidence({ root, ghBin: shim });
    assert.deepEqual(open.degradations, [], "the documented forge read must not degrade");
    assert.deepEqual(open.evidence.get(269).pr, { number: 506, state: "OPEN" }, "the PR is mapped back to its issue");
    const plan = buildBatchPlan(
      baseInput([issue(269, "Context targeting", whereSection(["skills/doc-index/SKILL.md"]))], root, {
        launchEvidence: open.evidence,
      }),
    );
    assert.deepEqual(plan.launched, [{ number: 269, evidence: "PR #506 open" }], "a parked open PR is in flight");

    const broken = await collectLaunchEvidence({ root, ghBin: "definitely-not-a-binary" });
    assert.ok(
      broken.degradations.some((d) => /^unavailable-forge-pr-list-/u.test(d)),
      "an unreadable forge is declared, never silent",
    );
    assert.equal(broken.evidence.size, 0, "no invented lifecycle evidence");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("V5: a directory that is not a git repository degrades declared instead of crashing", async () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const launch = await collectLaunchEvidence({ root });
    assert.equal(launch.evidence.size, 0);
    assert.ok(launch.degradations.includes("unavailable-launch-evidence-no-repository"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── W — file-level overlap between lanes (issue #509, S4) ──────────────────
// Reproducer of bug 3: #507 (lane scripts) and #269 (lane docs) both rewrite
// scripts/docs-generate.mjs and the plan calls them parallel-runnable.

test("W1: two issues of one batch on different lanes that touch one file are a file-overlap finding", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(507, "Driver write", whereSection(["scripts/local-gate.mjs"])),
      issue(269, "Context targeting", whereSection(["docs/workflow/README.md"])),
    ];
    const launchEvidence = evidenceFor({
      507: { branches: [{ name: "fix/507-driver-write", merged: false }], files: ["scripts/docs-generate.mjs", "scripts/local-gate.mjs"] },
      269: { branches: [{ name: "feat/269-efficient-context-targeting", merged: false }], files: ["scripts/docs-generate.mjs", "docs/workflow/README.md"] },
    });
    const plan = buildBatchPlan(baseInput(issues, root, { launchEvidence }));
    const overlap = plan.findings.filter((f) => f.code === "file-overlap");
    assert.equal(overlap.length, 1, "exactly one finding for the pair");
    assert.deepEqual(overlap[0].numbers, [269, 507], "both numbers, in issue order");
    assert.match(overlap[0].detail, /scripts\/docs-generate\.mjs/u);
    assert.doesNotMatch(overlap[0].detail, /local-gate/u, "only the shared files are named");
    assert.equal(plan.summary.launched, 2, "the overlap is a finding, never a re-batch");
    assert.equal(plan.summary.batches, 0, "both units are in flight, so nothing is batched behind them");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("W2: disjoint files and same-lane pairs emit no file-overlap", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "A", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "B", whereSection(["skills/beta/SKILL.md"])),
    ];
    const disjoint = evidenceFor({
      10: { branches: [{ name: "feat/10-a", merged: false }], files: ["skills/alpha/SKILL.md"] },
      11: { branches: [{ name: "feat/11-b", merged: false }], files: ["skills/beta/SKILL.md"] },
    });
    assert.deepEqual(buildBatchPlan(baseInput(issues, root, { launchEvidence: disjoint })).findings, []);

    const sameLane = evidenceFor({
      10: { branches: [{ name: "feat/10-a", merged: false }], files: ["scripts/local-gate.mjs"] },
      11: { branches: [{ name: "feat/11-b", merged: false }], files: ["scripts/local-gate.mjs"] },
    });
    const shared = [
      issue(10, "A", whereSection(["scripts/unit-route.mjs"])),
      issue(11, "B", whereSection(["scripts/unit-route.mjs"])),
    ];
    assert.deepEqual(
      buildBatchPlan(baseInput(shared, root, { launchEvidence: sameLane })).findings.filter((f) => f.code === "file-overlap"),
      [],
      "one lane already serializes the pair, so there is nothing to report",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("W3: an issue with no branch evidence claims no files, and the detail is bounded", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "A", whereSection(["scripts/local-gate.mjs"])),
      issue(11, "B", whereSection(["docs/workflow/README.md"])),
    ];
    // A's declared scripts/* token puts it in the scripts lane; only its branch
    // diff can name a file the lane derivation does not already cover.
    const onlyDiff = evidenceFor({
      10: { branches: [{ name: "feat/10-a", merged: false }], files: ["docs/workflow/README.md"] },
    });
    const plan = buildBatchPlan(baseInput(issues, root, { launchEvidence: onlyDiff }));
    const overlap = plan.findings.filter((f) => f.code === "file-overlap");
    assert.equal(overlap.length, 1, "the branch diff alone establishes the overlap");
    assert.deepEqual(overlap[0].numbers, [10, 11]);
    assert.ok(overlap[0].detail.length <= 1024, "the detail stays inside the envelope's bound");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── C — claims are per (number, lane) (issue #509, S2) ─────────────────────
// Reproducer of bug 1: #487 was claimed in lane `scripts` and reported claimed
// in `.github` and `docs` too on the next run.

test("C1: a claim made in one lane never marks the sibling lanes", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const first = [issue(487, "Secret scan gate", whereSection(["scripts/secret-scan.mjs"]))];
    const state = updateState(buildBatchPlan(baseInput(first, root)), null, { now: "2026-11-09T00:00:00.000Z", head: HEAD });
    const later = [
      issue(487, "Secret scan gate", whereSection(["scripts/secret-scan.mjs", "docs/workflow/GATE_INVENTORY.md", ".github/workflows/ci.yml"])),
    ];
    const plan = buildBatchPlan(baseInput(later, root, { previous: state, now: "2026-11-09T01:00:00.000Z" }));
    const rows = plan.batches.flatMap((b) => b.lanes).flatMap((l) => l.issues.map((row) => [row.lane, row.claimed]));
    assert.deepEqual(rows.sort(), [[".github", undefined], ["docs", undefined], ["scripts", true]]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("C2: the state keys claims by (number, lane), never by bare number", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md", "docs/ROADMAP.md"]))];
    const state = updateState(buildBatchPlan(baseInput(issues, root)), null, { now: "2026-11-09T00:00:00.000Z", head: HEAD });
    assert.deepEqual(Object.keys(state.claimed).sort(), ["10|docs", "10|skills/alpha"]);
    for (const [key, entry] of Object.entries(state.claimed)) {
      assert.match(key, /^\d+\|.+$/u, "every key names its lane");
      assert.equal(key, claimedKey(entry.batch === undefined ? 0 : 10, entry.lane), "the key is derived from the pair");
      assert.equal(state.claimed[key].lane, key.split("|")[1]);
    }
    const statePath = path.join(root, ".agentic-workflow", STATE_FILE_NAME);
    saveState(statePath, state);
    assert.deepEqual(loadState(statePath), state, "the pair keys round-trip");
    assert.equal(CLAIM_TTL_MS, 48 * 60 * 60 * 1000, "the published TTL is 48 hours");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("C3: --mark-launched records the operator's launch under the pair key", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const statePath = path.join(root, ".agentic-workflow", STATE_FILE_NAME);
    const run = spawnSync(process.execPath, [scriptPath, "--root", root, "--state", statePath, "--mark-launched", "5"], {
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.deepEqual(Object.keys(state.claimed), ["5|general"], "a manual mark names a lane too");
    assert.equal(state.version, 3);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── X — stale claims expire and are reported (issue #509, S5) ─────────────
// Reproducer of bug 4: claims from 2026-11-08 still active in the 2026-11-10
// plan, with no TTL and nothing reported.

const T0 = "2026-11-08T00:00:00.000Z";

/** A v3 previous state carrying the given claim entries. */
function previousState(claims, seen = {}) {
  return { version: 3, written_at: T0, source_revision: HEAD, claimed: claims, seen };
}

function claimOf(lane, lastSeen = T0, firstSeen = T0) {
  return { batch: 1, lane, first_seen: firstSeen, last_seen: lastSeen, worktree: `feat/10-${lane.replace(/[^a-z0-9]+/giu, "-")}` };
}

test("X1: a claim older than the 48h TTL expires and is reported as stale-claim", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))];
    const previous = previousState({ "10|skills/alpha": claimOf("skills/alpha") });
    const plan = buildBatchPlan(baseInput(issues, root, { previous, now: "2026-11-11T00:00:00.000Z" }));
    assert.equal(plan.batches[0].lanes[0].issues[0].claimed, undefined, "an expired claim never reads claimed");
    const stale = plan.findings.filter((f) => f.code === "stale-claim");
    assert.equal(stale.length, 1);
    assert.deepEqual(stale[0].numbers, [10]);
    assert.match(stale[0].detail, /10\|skills\/alpha/u, "the report names the claim key");
    assert.match(stale[0].detail, /48h/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("X2: a fresh claim stays claimed and reports nothing — no clock, no expiry", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))];
    const previous = previousState({ "10|skills/alpha": claimOf("skills/alpha", "2026-11-10T23:00:00.000Z") });
    const fresh = buildBatchPlan(baseInput(issues, root, { previous, now: "2026-11-11T00:00:00.000Z" }));
    assert.equal(fresh.batches[0].lanes[0].issues[0].claimed, true);
    assert.deepEqual(fresh.findings, []);
    const stateless = buildBatchPlan(baseInput(issues, root, { previous }));
    assert.equal(stateless.batches[0].lanes[0].issues[0].claimed, true, "with no run instant the age rule cannot fire");
    assert.deepEqual(stateless.findings, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("X3: terminal evidence expires a claim without waiting for the TTL", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))];
    const previous = previousState({ "10|skills/alpha": claimOf("skills/alpha", "2026-11-10T23:00:00.000Z") });
    const launchEvidence = evidenceFor({ 10: { branches: [{ name: "feat/10-alpha", merged: false }], pr: { number: 99, state: "MERGED" } } });
    const plan = buildBatchPlan(baseInput(issues, root, { previous, launchEvidence }));
    assert.equal(plan.batches[0].lanes[0].issues[0].claimed, undefined);
    const stale = plan.findings.filter((f) => f.code === "stale-claim");
    assert.equal(stale.length, 1);
    assert.match(stale[0].detail, /landed|MERGED/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("X4: the written state drops expired and closed claims and keeps a live claim's first_seen", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(11, "Beta", whereSection(["skills/beta/SKILL.md"]))];
    const now = "2026-11-11T00:00:00.000Z";
    const previous = previousState({
      "10|docs": claimOf("docs"),
      "11|skills/beta": claimOf("skills/beta", "2026-11-10T23:00:00.000Z", "2026-11-09T00:00:00.000Z"),
      "12|scripts": claimOf("scripts", "2026-11-10T23:00:00.000Z"),
    });
    const plan = buildBatchPlan(baseInput(issues, root, { previous, now }));
    const state = updateState(plan, previous, { now, head: HEAD, openIssues: [{ number: 10, title: "Alpha" }, { number: 11, title: "Beta" }] });
    assert.deepEqual(Object.keys(state.claimed), ["11|skills/beta"], "the aged lane and the closed issue are pruned");
    assert.equal(state.claimed["11|skills/beta"].first_seen, "2026-11-09T00:00:00.000Z", "a live claim keeps its first sighting");
    assert.equal(state.claimed["11|skills/beta"].last_seen, now);
    assert.equal(state.version, 3);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("X5: a pre-v3 bare-number claim is reported once and never honored", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))];
    const previous = { version: 2, written_at: T0, source_revision: HEAD, claimed: { 10: claimOf("skills/alpha") }, seen: {} };
    const plan = buildBatchPlan(baseInput(issues, root, { previous, now: "2026-11-11T00:00:00.000Z" }));
    assert.equal(plan.batches[0].lanes[0].issues[0].claimed, undefined, "a bare number cannot name a lane");
    const stale = plan.findings.filter((f) => f.code === "stale-claim");
    assert.equal(stale.length, 1);
    assert.match(stale[0].detail, /pre-v3|bare number/u);
    const state = updateState(plan, previous, { now: "2026-11-11T00:00:00.000Z", head: HEAD, openIssues: issues });
    assert.deepEqual(Object.keys(state.claimed).sort(), ["10|skills/alpha"], "only the fresh pair survives");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});


// ── S6/O7 — persistence across runs ────────────────────────────────────────

test("S6: a re-run recognizes lanes already claimed in the persisted state file", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"]))];
    const plan1 = buildBatchPlan(baseInput(issues, root));
    const state = updateState(plan1, null, { now: "2026-11-07T00:00:00Z", head: HEAD });
    const statePath = path.join(root, ".agentic-workflow", STATE_FILE_NAME);
    saveState(statePath, state);
    assert.deepEqual(loadState(statePath), state, "the state file round-trips");
    const plan2 = buildBatchPlan(baseInput(issues, root, { previous: state }));
    const row = plan2.batches[0].lanes[0].issues[0];
    assert.equal(row.claimed, true, "the previously planned lane is recognized as claimed");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S7/O8+O9 — findings, never silent omissions ────────────────────────────

test("S7: a cyclic blocker wait is a finding and the cycle members are excluded from batches", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "A", whereSection(["skills/alpha/SKILL.md"]), [11]),
      issue(11, "B", whereSection(["skills/beta/SKILL.md"]), [10]),
      issue(12, "C", whereSection(["skills/gamma/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.equal(plan.findings.length, 1);
    assert.equal(plan.findings[0].code, "cycle");
    assert.deepEqual([...plan.findings[0].numbers].sort(), [10, 11]);
    assert.ok(!plan.batches.some((b) => b.lanes.some((l) => l.issues.some((i) => [10, 11].includes(i.number)))));
    assert.equal(plan.summary.findings, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("S7: an orphaned soft dep (target missing) is a finding", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#999", "soft", "points at an issue that does not exist"]]);
    const issues = [issue(11, "Doc index queries", `${whereSection(["skills/doc-index/SKILL.md"])}\n\n${deps}`)];
    const plan = buildBatchPlan(baseInput(issues, root));
    const orphan = plan.findings.find((f) => f.code === "orphaned-soft-dep");
    assert.ok(orphan, "the orphaned soft dep is reported");
    assert.deepEqual(orphan.numbers, [11]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("S7: a prose row declared hard with no native blocked-by is a #442 agreement finding", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "hard", "shared surface"]]);
    const issues = [issue(11, "Doc index queries", `${whereSection(["skills/doc-index/SKILL.md"])}\n\n${deps}`)];
    const plan = buildBatchPlan(baseInput(issues, root));
    const mismatch = plan.findings.find((f) => f.code === "prose-native-mismatch");
    assert.ok(mismatch, "the prose/native disagreement is reported (the #442 contract)");
    assert.deepEqual(mismatch.numbers, [11]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── B4/B5 — an in-flight (launched) target is a state, not a defect ───────
// Reproducer of external-verify B4: an issue whose open native blocker has a
// unit doc on disk was emitted as a `cycle` finding ("no batch can ever
// satisfy it"). B5: a soft dep on the same in-flight issue was emitted as
// `orphaned-soft-dep` ("neither open nor in the location index").

function withInFlightUnit(root, number, slug) {
  const dir = path.join(root, "docs", "fix", `${number}-${slug}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SPEC.md"), "# unit\n");
}

test("B4: an in-flight blocker is blocked, never a cyclic wait", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    withInFlightUnit(root, 20, "in-flight");
    const issues = [
      issue(20, "In-flight blocker", whereSection(["skills/alpha/SKILL.md"])),
      issue(21, "Waits on the in-flight unit", whereSection(["skills/beta/SKILL.md"]), [20]),
    ];
    const launchEvidence = evidenceFor({ 20: { branches: [{ name: "fix/20-in-flight", merged: false }] } });
    const plan = buildBatchPlan(baseInput(issues, root, { launchEvidence }));
    assert.deepEqual(plan.findings, [], "an in-flight wait is a state, not an unresolvable spot");
    assert.deepEqual(plan.blocked, [{ number: 21, blockers: [20], reason: "blocked-by 20 (open, unit in flight)" }]);
    assert.ok(!plan.batches.some((b) => b.lanes.some((l) => l.issues.some((i) => i.number === 21))), "never batched while the blocker runs");
    assert.equal(plan.summary.blocked, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("B5: a soft dep on an in-flight unit is neither orphaned nor gating", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    withInFlightUnit(root, 20, "in-flight");
    const deps = depsTable([["#20", "soft", "shares the design notes"]]);
    const issues = [
      issue(20, "In-flight unit", whereSection(["skills/alpha/SKILL.md"])),
      issue(21, "Dependent", `${whereSection(["skills/beta/SKILL.md"])}\n\n${deps}`),
    ];
    const launchEvidence = evidenceFor({ 20: { branches: [{ name: "fix/20-in-flight", merged: false }] } });
    const plan = buildBatchPlan(baseInput(issues, root, { launchEvidence }));
    assert.deepEqual(plan.findings, [], "a target that is open and in flight is not an orphan");
    assert.deepEqual(plan.batches[0].lanes[0].issues.map((i) => i.number), [21], "a soft dep never gates");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── L1 — lifecycle delta vs the previous plan (issue #460, S2) ─────────────
// Reproducers of gap 1: the state persisted claimed lanes only, so issues
// closed since the last run vanished silently and new issues appeared unflagged.

test("L1: the state file persists the last-seen open-issue set (seen)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const state = updateState(plan, null, { now: "2026-11-09T00:00:00Z", head: HEAD });
    assert.deepEqual(Object.keys(state.seen).sort(), ["10", "11"], "every open issue is last-seen recorded");
    assert.equal(state.seen["10"].title, "Alpha skill change");
    assert.equal(state.seen["11"].last_seen, "2026-11-09T00:00:00Z");
    assert.equal(state.seen["10"].batch, 1, "a batched issue's seen entry carries its last batch");
    assert.equal(state.seen["10"].lane, "skills/alpha", "…and its last lane (the last known row)");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("L1: a re-run reports issues closed since the previous plan (closed_since, with their last known row)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const previous = {
      version: 2,
      written_at: "2026-11-08T00:00:00Z",
      source_revision: HEAD,
      claimed: {},
      seen: {
        "10": { title: "Alpha skill change", batch: 1, lane: "skills/alpha", last_seen: "2026-11-08T00:00:00Z" },
      },
    };
    const issues = [issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root, { previous }));
    assert.deepEqual(plan.closed_since, [
      { number: 10, title: "Alpha skill change", batch: 1, lane: "skills/alpha", last_seen: "2026-11-08T00:00:00Z" },
    ], "the closed issue is reported with its last known row, never silently dropped");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("L1: a re-run reports newly seen issues (new_issues)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const previous = {
      version: 2,
      written_at: "2026-11-08T00:00:00Z",
      source_revision: HEAD,
      claimed: {},
      seen: {
        "10": { title: "Alpha skill change", batch: 1, lane: "skills/alpha", last_seen: "2026-11-08T00:00:00Z" },
      },
    };
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Fresh issue", whereSection(["skills/beta/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root, { previous }));
    assert.deepEqual(plan.new_issues, [{ number: 11, title: "Fresh issue" }]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("L1: a first run (no previous state) reports every open issue as newly seen and nothing closed", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.new_issues, issues.map((i) => ({ number: i.number, title: i.title })));
    assert.deepEqual(plan.closed_since, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── T2 — triage-readiness flag per issue (issue #460, S3) ──────────────────
// Reproducer of gap 2: every observed issue sat at roadmap status `idea`, yet
// lane rows were emitted with `reason.kind: satisfied-inputs` as if launchable.

test("T2: a roadmap row at idea marks its issue untriaged — never plain satisfied-inputs", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDocWithFixes([[30, "untriaged-unit", "idea", "No triage yet"]]));
    const issues = [issue(30, "Untriaged unit", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.triaged, false, "the lane row carries the triage-readiness flag");
    assert.notEqual(row.reason.kind, "satisfied-inputs", "never presented as plain satisfied-inputs");
    assert.equal(row.reason.kind, "untriaged");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("T2: a roadmap row with triage-produced tasks (planned) is triaged and stays satisfied-inputs", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDocWithFixes([[31, "triaged-unit", "planned", "Tasks produced"]]));
    const issues = [issue(31, "Triaged unit", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.triaged, undefined, "no untriaged flag on a triaged issue");
    assert.equal(row.reason.kind, "satisfied-inputs");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("T2: the human summary states which issues are untriaged", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDocWithFixes([[30, "untriaged-unit", "idea", "No triage yet"]]));
    const issuesFile = path.join(root, "issues.json");
    fs.writeFileSync(issuesFile, JSON.stringify([issue(30, "Untriaged unit", whereSection(["skills/alpha/SKILL.md"]))]));
    const run = spawnSync(process.execPath, [scriptPath, "--root", root, "--issues-file", issuesFile, "--no-state"], {
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /untriaged/u, "the summary names the untriaged issues");
    assert.match(run.stdout, /#30/u);
    assert.match(run.stdout, /provisional/u, "co-scheduling is marked provisional");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("T2: a roadmap status carrying its PR annotation (done · #999) is triaged, not untriaged", () => {
  // The fix index renders a delivered unit as `done · [#<pr>](…)` (docs/ROADMAP.md's
  // own `#460` row is the live shape). Reading that annotation as a status value
  // would mark a delivered row untriaged and drop its `satisfied-inputs`.
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    const status = "done · [#999](https://example.invalid/pull/999)";
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDocWithFixes([[32, "delivered-unit", status, "PR open"]]));
    const issues = [issue(32, "Delivered unit", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.triaged, undefined, "a delivered row is triaged");
    assert.equal(row.reason.kind, "satisfied-inputs");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("T2: an issue with no roadmap fix row carries no triage signal (D4)", () => {
  // D4 (SPEC ## Log): a missing row is not an untriaged row — it carries no
  // signal at all. Only a row present with a status below `planned` marks.
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(33, "Unregistered unit", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.triaged, undefined, "no row, no triage flag");
    assert.equal(row.reason.kind, "satisfied-inputs");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── D3 — cross-lane soft-dep caveat (issue #460, S4) ───────────────────────
// Reproducer of gap 3: #441 appeared in batch 2 as `satisfied-inputs` while its
// declared soft deps #436/#438 sat in batch 2, other lanes — concurrent, not
// delivered — and the plan reported nothing.

test("D3: a same-batch cross-lane open soft dep yields a soft-deps-open caveat naming the dep and its batch", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "soft", "inputs land with this batch's other lane"]]);
    const issues = [
      issue(10, "Lane B work", whereSection(["skills/beta/SKILL.md"])),
      issue(11, "Lane A dependent", `${whereSection(["skills/alpha/SKILL.md"])}\n\n${deps}`),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches[0].lanes.find((l) => l.surface === "skills/alpha").issues[0];
    assert.equal(row.reason.kind, "soft-deps-open");
    assert.match(row.reason.detail, /#10/u, "the caveat names the open soft dep");
    assert.match(row.reason.detail, /batch 1/u, "the caveat names its batch");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("D3: a soft dep delivered by a strictly earlier batch does not caveat", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#20", "soft", "delivered by batch 1 before this issue launches"]]);
    const issues = [
      issue(19, "Hard blocker of 21", whereSection(["packages/other/src/x.ts"])),
      issue(20, "Batch 1 target", whereSection(["skills/beta/SKILL.md"])),
      issue(21, "Batch 2 dependent", `${whereSection(["skills/alpha/SKILL.md"])}\n\n${deps}`, [19]),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const row = plan.batches.flatMap((b) => b.lanes).find((l) => l.surface === "skills/alpha").issues[0];
    assert.equal(row.reason.kind, "satisfied-inputs", "an earlier-batch soft dep is a delivered input");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("D3: a same-lane soft-ordered dependent keeps soft-ordered (its target delivers first in the lane)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "soft", "same area: the doc index consumes the emitter"]]);
    const issues = [
      issue(11, "Doc index queries", `${whereSection(["skills/doc-index/SKILL.md"])}\n\n${deps}`),
      issue(10, "Doc emitter", whereSection(["skills/doc-index/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const lane = plan.batches[0].lanes[0];
    assert.equal(lane.issues[1].reason.kind, "soft-ordered", "same-lane ordering is unchanged");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── P4 — fail-closed prose parser (issue #460, S5) ─────────────────────────
// Reproducer of gap 4: issue #307's non-standard `| Feature | Issue |` tables
// made the parser emit false orphaned-soft-dep/prose-native-mismatch findings
// for twelve roadmap feature numbers.

const featureTableBody = [
  "## Dependencies",
  "",
  "| Feature | Issue |",
  "|---|---|",
  "| #68 | #260 |",
  "| #99 | #362 |",
  "| #41 | hard: #174 |",
  "",
].join("\n");

test("P4: a non-declared Dependencies table shape degrades declared, naming the issue, and harvests nothing", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(307, "Non-standard tables", `${whereSection(["skills/alpha/SKILL.md"])}\n\n${featureTableBody}`)];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.findings, [], "no false findings from non-conforming prose");
    assert.equal(plan.degraded.filter((d) => d.includes("307")).length, 1, "one declared degradation naming the issue");
    assert.match(plan.degraded.find((d) => d.includes("307")), /^unavailable-prose-dependencies-issue-307-/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("P4: extractProseDependencies parses the declared form and refuses every other shape", () => {
  const declared = extractProseDependencies(`## Dependencies\n\n| Depends on | Kind | Why |\n|---|---|---|\n| #10 | soft | order |\n| #11 | hard | blocks |\n`);
  assert.deepEqual(declared, { soft: [10], proseHard: [11], malformed: false }, "the declared form parses exactly as before");
  const nonDeclared = extractProseDependencies(featureTableBody);
  assert.deepEqual(nonDeclared, { soft: [], proseHard: [], malformed: true }, "any other shape is refused, never guessed");
  const noSection = extractProseDependencies("## Where\n\n- `skills/x`\n");
  assert.deepEqual(noSection, { soft: [], proseHard: [], malformed: false });
  const noTable = extractProseDependencies("## Dependencies\n\nProse bullets, no table.\n");
  assert.deepEqual(noTable, { soft: [], proseHard: [], malformed: false });
});

// ── S8 — no decision model anywhere in the path ────────────────────────────

test("S8: identical inputs produce byte-identical envelopes (no wall clock, no model)", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "soft", "same area"]]);
    const issues = [
      issue(11, "Doc index queries", `${whereSection(["skills/doc-index/SKILL.md"])}\n\n${deps}`),
      issue(10, "Doc emitter", whereSection(["skills/doc-index/SKILL.md"])),
      issue(12, "Panel", whereSection(["packages/pi-web/src/panel.ts"]), [10]),
    ];
    const a = JSON.stringify(buildBatchPlan(baseInput(issues, root)));
    const b = JSON.stringify(buildBatchPlan(baseInput(issues, root)));
    assert.equal(a, b);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S2/O13 — degradation is declared ───────────────────────────────────────

test("S2: an unavailable forge degrades declared, never a silent empty plan", async () => {
  const degraded = await collectIssues({ issuesFile: "/nonexistent/issues.json", ghBin: "definitely-not-a-binary" });
  assert.ok(Array.isArray(degraded.issues));
  assert.equal(degraded.issues.length, 0);
  assert.ok(degraded.degradations.length >= 1);
  assert.match(degraded.degradations[0], /^unavailable-/);
});

test("S7: a prose-hard mismatch is suppressed (declared) when the relations are unavailable", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#10", "hard", "shared surface"]]);
    const issues = [issue(11, "Doc index queries", `${whereSection(["skills/doc-index/SKILL.md"])}\n\n${deps}`)];
    const plan = buildBatchPlan(baseInput(issues, root, { relationsKnown: false }));
    assert.equal(plan.findings.filter((f) => f.code === "prose-native-mismatch").length, 0, "no native data, no mismatch claim");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── CLI — the script runs, prints the envelope last, exits 0 ───────────────

test("CLI: --issues-file --root --no-state --json-only prints the envelope and exits 0", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issuesFile = path.join(root, "issues.json");
    fs.writeFileSync(issuesFile, JSON.stringify([issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))]));
    const run = spawnSync(process.execPath, [scriptPath, "--root", root, "--issues-file", issuesFile, "--no-state", "--json-only"], {
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    const plan = JSON.parse(run.stdout);
    assert.equal(plan.schema, "batch-plan@3");
    assert.ok(!fs.existsSync(path.join(root, ".agentic-workflow", STATE_FILE_NAME)), "--no-state writes nothing");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("CLI: a run without --no-state persists the state file under the scratch root", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issuesFile = path.join(root, "issues.json");
    fs.writeFileSync(issuesFile, JSON.stringify([issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))]));
    const run = spawnSync(process.execPath, [scriptPath, "--root", root, "--issues-file", issuesFile, "--json-only"], {
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    assert.ok(fs.existsSync(path.join(root, ".agentic-workflow", STATE_FILE_NAME)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── B6/B8 — the documented option semantics ────────────────────────────────
// Reproducer of external-verify B6: `--mark-launched` wrote the state file
// even under `--no-state` ("pure read; writes nothing"). B8: `--remote` fed
// only the GraphQL call, so a scratch origin still degraded the issue list.

test("B6: --mark-launched with --no-state is a usage error, never a silent write", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const run = spawnSync(process.execPath, [scriptPath, "--root", root, "--mark-launched", "5", "--no-state"], { encoding: "utf8" });
    assert.equal(run.status, 2, run.stdout + run.stderr);
    assert.match(run.stderr, /--no-state/u);
    assert.ok(!fs.existsSync(path.join(root, ".agentic-workflow", STATE_FILE_NAME)), "nothing is written");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("B8: --remote names the forge on the issue list too", async () => {
  const root = scratchRoot();
  try {
    // A `gh` shim that refuses an issue list without -R: the scratch-origin
    // case the flag documents (gh cannot infer the repository from a local
    // path remote).
    const shim = path.join(root, "gh");
    fs.writeFileSync(
      shim,
      [
        "#!/bin/sh",
        'if [ "$1" = "issue" ] && [ "$2" = "list" ]; then',
        '  case " $* " in',
        "    *\" -R \"*) printf %s '[{\"number\":10,\"title\":\"Alpha\",\"body\":\"\",\"labels\":[]}]' ;;",
        '    *) echo "none of the git remotes work here" >&2; exit 4 ;;',
        "  esac",
        'elif [ "$1" = "api" ]; then',
        "  printf %s '{\"data\":{\"repository\":{\"issues\":{\"nodes\":[{\"number\":10,\"blockedBy\":{\"nodes\":[]}}]}}}}'",
        "else",
        "  exit 5",
        "fi",
        "",
      ].join("\n"),
    );
    fs.chmodSync(shim, 0o755);
    const collected = await collectIssues({ ghBin: shim, remote: "git@github.com:owner/repo.git" });
    assert.deepEqual(collected.degradations, [], "the documented scratch-origin case must not degrade");
    assert.deepEqual(collected.issues.map((i) => i.number), [10]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── S9 — source-level pins: a planner, not an orchestrator ─────────────────

test("parity: the plan grammar inventory matches the emitted envelope and the schema export", async () => {
  const planSource = fs.readFileSync(new URL("../skills/batch-scheduler/references/PLAN.md", import.meta.url), "utf8");
  const at = planSource.indexOf("batch-fields@1");
  const rows = [];
  for (const line of planSource.slice(at).split("\n").slice(1)) {
    if (/^\s*\|/.test(line)) rows.push(line.split("|").map((c) => c.trim()).filter(Boolean));
    else if (rows.length > 0) break;
  }
  const inventory = new Map();
  for (const [object, field] of rows.slice(2)) {
    if (!inventory.has(object)) inventory.set(object, new Set());
    inventory.get(object).add(field);
  }
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "Alpha (S)", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta (L)", whereSection(["packages/beta/src/a.ts", "packages/beta/src/b.ts", "skills/alpha/SKILL.md"]), [10]),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const emitted = new Map([
      ["batch-plan", Object.keys(plan)],
      ["batch", Object.keys(plan.batches[0])],
      ["lane", Object.keys(plan.batches[0].lanes[0])],
      ["issue", Object.keys(plan.batches[0].lanes[0].issues[0])],
      ["blocked", plan.blocked.length > 0 ? Object.keys(plan.blocked[0]) : []],
      ["launched", plan.launched.length > 0 ? Object.keys(plan.launched[0]) : []],
      ["finding", plan.findings.length > 0 ? Object.keys(plan.findings[0]) : []],
      ["summary", Object.keys(plan.summary)],
    ]);
    for (const [object, keys] of emitted) {
      const declared = inventory.get(object);
      assert.ok(declared, `the inventory declares the ${object} object`);
      for (const key of keys) {
        assert.ok(declared.has(key), `the inventory declares ${object}.${key}`);
      }
    }
    // Objects that appear only when populated must still be declared.
    for (const object of ["blocked", "finding"]) {
      assert.ok(inventory.has(object), `the inventory declares ${object} even when this plan emits none`);
    }
    // Nested objects are declared too: the union comparison cannot see a field
    // that only lives one level down.
    const declaredReason = inventory.get("reason");
    assert.ok(declaredReason, "the inventory declares the reason object");
    for (const key of Object.keys(plan.batches[0].lanes[0].issues[0].reason)) {
      assert.ok(declaredReason.has(key), `the inventory declares reason.${key}`);
    }
    const { BATCH_PLAN_FIELDS } = await import("../packages/agentic-workflow-schema/dist/index.js");
    const union = new Set([...inventory.values()].flatMap((s) => [...s]));
    assert.deepEqual([...union].sort(), [...BATCH_PLAN_FIELDS].sort(), "the schema package's field list is the inventory's union");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("envelope: no owned surface keeps a superseded batch-plan token", () => {
  // Every version bump rewrote the token; a sibling that keeps narrating an old
  // one asserts a contract the document no longer carries (issue #460's own
  // external-verify sibling sweep, extended to @2 by issue #509's bump). Only
  // the validator's wrong-value vectors may name one, and they are recognised by
  // their mutation, not by their line.
  const owned = [
    "scripts/batch-scheduler.mjs",
    "packages/agentic-workflow-schema/src/batch-plan.ts",
    "packages/agentic-workflow-schema/test/batch-plan.test.mjs",
    "skills/batch-scheduler/SKILL.md",
    "skills/batch-scheduler/references/PLAN.md",
    "README.md",
    "docs/workflow/SKILLS.md",
  ];
  const stale = [];
  for (const rel of owned) {
    const lines = fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!line.includes("batch-plan@1") && !line.includes("batch-plan@2")) return;
      if (line.includes('m.schema = "batch-plan@1"') || line.includes('"batch-plan@2"')) return;
      stale.push(`${rel}:${index + 1}`);
    });
  }
  assert.deepEqual(stale, [], "every owned surface names batch-plan@3");
});

// ── A — a launched claim whose worktree is gone expires (issue #509, S8) ──
// Reproducer of extended scope A: claims survived a deleted worktree and the
// operator had to diff `git worktree list` against `batches.json` by hand.

const LAUNCHED = "2026-11-10T22:00:00.000Z";

function launchedClaim(lane) {
  return { ...claimOf(lane, "2026-11-10T22:30:00.000Z"), launched_at: LAUNCHED };
}

test("A1: a launched claim with no worktree, branch or open PR left is evicted", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))];
    const previous = previousState({ "10|skills/alpha": launchedClaim("skills/alpha") });
    const plan = buildBatchPlan(baseInput(issues, root, { previous, now: "2026-11-11T00:00:00.000Z" }));
    const stale = plan.findings.filter((f) => f.code === "stale-claim");
    assert.equal(stale.length, 1);
    assert.match(stale[0].detail, /worktree|branch|PR/u, "the report names what disappeared");
    assert.equal(plan.batches[0].lanes[0].issues[0].claimed, undefined);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("A2: a launched claim backed by a worktree or a branch is not evicted", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"]))];
    const previous = previousState({ "10|skills/alpha": launchedClaim("skills/alpha") });
    const launchEvidence = evidenceFor({
      10: { branches: [{ name: "fix/10-alpha", merged: false }], worktree: "/repo/.worktrees/fix-10-alpha" },
    });
    const plan = buildBatchPlan(baseInput(issues, root, { previous, launchEvidence, now: "2026-11-11T00:00:00.000Z" }));
    assert.deepEqual(plan.findings.filter((f) => f.code === "stale-claim"), []);
    // The issue is in flight, so its claim is not read in a lane; a sibling lane
    // pair proves the claim itself still stands in the state.
    const state = updateState(plan, previous, { now: "2026-11-11T00:00:00.000Z", head: HEAD, openIssues: issues, evidence: launchEvidence });
    assert.deepEqual(Object.keys(state.claimed), ["10|skills/alpha"], "the launched claim is preserved");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── B — soft-dep resolution is a forge read (issue #509, S9) ───────────────
// Reproducer of extended scope B: the operator had to call `gh issue view` per
// soft-dep target because the plan only detected presence.

test("B1: a closed soft-dep target resolves and an open undelivered one is caveated", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([
      ["#10", "soft", "an issue that is still open"],
      ["#99", "soft", "an issue that closed weeks ago"],
    ]);
    const issues = [
      issue(11, "Beta", `${whereSection(["skills/beta/SKILL.md"])}\n\n${deps}`),
      issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"])),
    ];
    // #99 was open in the previous plan and is gone from the forge now: closed,
    // which is the resolution state S9 asks the plan to read.
    const previous = previousState({}, { "99": { title: "Long gone", batch: 2, lane: "docs", last_seen: "2026-11-08T00:00:00.000Z" } });
    const plan = buildBatchPlan(baseInput(issues, root, { previous }));
    assert.deepEqual(plan.findings.filter((f) => f.code === "orphaned-soft-dep"), [], "a closed target is resolved, not an orphan");
    assert.deepEqual(plan.closed_since.map((row) => row.number), [99], "the resolution is the lifecycle delta's own evidence");
    const row = plan.batches.flatMap((b) => b.lanes).flatMap((l) => l.issues).find((r) => r.number === 11);
    assert.match(row.reason.detail, /#10/u, "the open target is named");
    assert.doesNotMatch(row.reason.detail, /#99/u, "the resolved target is not caveated");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("B2: an unreadable open set is declared unknown, never resolved", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#99", "soft", "state unknown without the forge"]]);
    const issues = [issue(11, "Beta", `${whereSection(["skills/beta/SKILL.md"])}\n\n${deps}`)];
    const plan = buildBatchPlan(
      baseInput(issues, root, { degraded: ["unavailable-forge-issue-list-no-binary"], openSetKnown: false }),
    );
    assert.deepEqual(
      plan.findings.filter((f) => f.code === "orphaned-soft-dep"),
      [],
      "an unreadable open set cannot distinguish an orphan from a closed target",
    );
    const row = plan.batches[0].lanes[0].issues[0];
    assert.match(row.reason.detail, /unknown/u, "the target's state is declared unknown");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── C — partial dependency extraction (issue #509, S10) ───────────────────

test("C1: a non-declared table is partially parsed when a row names its kind", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const table = ["## Dependencies", "", "| Depends on | Kind |", "|---|---|", "| #10 | soft |", "| #12 | hard |"].join("\n");
    const issues = [
      issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta", `${whereSection(["skills/beta/SKILL.md"])}\n\n${table}`),
      issue(12, "Gamma", whereSection(["skills/gamma/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    const degraded = plan.degraded.find((d) => d.includes("prose-dependencies-issue-11"));
    assert.ok(degraded, "the shortfall is declared");
    assert.match(degraded, /2-of-2|2-of-2-rows/u, "what was parsed of what the table holds");
    const gamma = plan.findings.find((f) => f.code === "prose-native-mismatch" && f.numbers[0] === 11);
    assert.ok(gamma, "the hard row that was recovered feeds the #442 agreement check");
    const row = plan.batches.flatMap((b) => b.lanes).flatMap((l) => l.issues).find((r) => r.number === 11);
    assert.match(row.reason.detail, /#10/u, "the soft row that was recovered orders the issue after #10");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("C2: the #460 two-column corpus still yields nothing — recovery is not harvesting", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const table = ["## Dependencies", "", "| Feature | Issue |", "|---|---|", "| 28 | #307 |", "| 29 | #308 |"].join("\n");
    const issues = [issue(11, "Beta", `${whereSection(["skills/beta/SKILL.md"])}\n\n${table}`)];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.ok(
      plan.degraded.some((d) => d.includes("prose-dependencies-issue-11-0-of-2") || d.includes("prose-dependencies-issue-11")),
      "the shortfall is still declared",
    );
    assert.deepEqual(plan.findings, [], "no orphaned-soft-dep and no prose-native-mismatch from a Feature/Issue table");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── D — labelled issues are never launchable (issue #509, S11) ────────────

test("D1: postponed, backlog and human-revision-needed issues leave the launchable set", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [
      issue(10, "Alpha", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta", whereSection(["skills/beta/SKILL.md"]), [], ["postponed"]),
      issue(12, "Gamma", whereSection(["skills/gamma/SKILL.md"]), [], ["backlog"]),
      issue(13, "Delta", whereSection(["skills/delta/SKILL.md"]), [], ["human-revision-needed"]),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.label_blocked, [
      { number: 11, labels: ["postponed"] },
      { number: 12, labels: ["backlog"] },
      { number: 13, labels: ["human-revision-needed"] },
    ]);
    assert.deepEqual(plan.batches.flatMap((b) => b.lanes).flatMap((l) => l.issues.map((r) => r.number)), [10]);
    assert.deepEqual(plan.blocked, [], "a label block is a category of its own, not a blocked-by row");
    assert.equal(plan.summary.label_blocked, 3);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("D2: a soft dep on a label-blocked issue is not an orphan", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const deps = depsTable([["#11", "soft", "the postponed target"]]);
    const issues = [
      issue(10, "Alpha", `${whereSection(["skills/alpha/SKILL.md"])}\n\n${deps}`),
      issue(11, "Beta", whereSection(["skills/beta/SKILL.md"]), [], ["postponed"]),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.findings.filter((f) => f.code === "orphaned-soft-dep"), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("D3: the human summary names the label-blocked issues", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issuesFile = path.join(root, "issues.json");
    fs.writeFileSync(issuesFile, JSON.stringify([issue(11, "Beta", whereSection(["skills/beta/SKILL.md"]), [], ["postponed"])]));
    const run = spawnSync(process.execPath, [scriptPath, "--root", root, "--issues-file", issuesFile, "--no-state"], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /label-blocked: #11/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── E — a body triage verdict outranks a stale roadmap row (S12) ──────────

test("E1: a body carrying an explicit triage verdict marks the issue triaged", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDocWithFixes([[487, "secret-scan-gate", "pending", "—"]]));
    const body = `${whereSection(["scripts/secret-scan.mjs"])}\n\nDeterministic secret-scanning gate — **fix-now (high)** per the 2026-11-09 triage.`;
    const plan = buildBatchPlan(baseInput([issue(487, "Secret scan gate", body)], root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.reason.kind, "satisfied-inputs", "the body verdict is the more specific signal");
    assert.equal(row.triaged, undefined);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("E2: a body that only asks for triage stays untriaged", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDocWithFixes([[488, "needs-triage", "idea", "—"]]));
    const body = `${whereSection(["scripts/needs-triage.mjs"])}\n\nNeeds triage from triage-issue. No triage yet.`;
    const plan = buildBatchPlan(baseInput([issue(488, "Needs triage", body)], root));
    const row = plan.batches[0].lanes[0].issues[0];
    assert.equal(row.reason.kind, "untriaged");
    assert.equal(row.triaged, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("docs: PLAN.md and SKILL.md state the landed claim, launch and overlap contract", () => {
  // The surfaces the planner's consumer reads must narrate what the script now
  // does — the claim key shape (S2), the evidence-based launch rule (S3), the
  // file-overlap finding (S4), the claim TTL (S5) and the S6 limitation note.
  const planDoc = fs.readFileSync(new URL("../skills/batch-scheduler/references/PLAN.md", import.meta.url), "utf8");
  const skillDoc = fs.readFileSync(new URL("../skills/batch-scheduler/SKILL.md", import.meta.url), "utf8");
  assert.match(planDoc, /"\d+\|/u, "the state-file example carries the pair key");
  for (const token of ["file-overlap", "stale-claim", "48"])
    assert.ok(planDoc.includes(token), `PLAN.md states ${token}`);
  for (const token of ["file-overlap", "stale-claim"])
    assert.ok(skillDoc.includes(token), `SKILL.md names ${token}`);
  assert.ok(/unit doc/i.test(skillDoc) && /evidence|branch|PR/u.test(skillDoc), "SKILL.md states the launch rule");
  assert.ok(!/unit doc[^.\n]*is on disk[^.\n]*launched/iu.test(planDoc), "the superseded launch narration is gone");
});

test("S9: the script contains no session spawn, worktree creation or unit launch", async () => {
  const src = fs.readFileSync(scriptPath, "utf8");
  for (const banned of ["spawn(", "execFile(", "worktree add", "gh pr create", "gh pr merge", "gh pr edit", "gh pr close", "gh run"]) {
    const lines = src.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => l.includes(banned) && !l.trim().startsWith("//") && !l.trim().startsWith("*"));
    assert.deepEqual(lines, [], `no executable use of ${banned}`);
  }
  assert.ok(!/(fetch|XMLHttpRequest)\s*\(/.test(src), "no network call beyond the gh child process");
});
