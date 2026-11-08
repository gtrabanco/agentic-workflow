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
const { buildBatchPlan, collectIssues, updateState, loadState, saveState, extractSurfaces, STATE_FILE_NAME } =
  await import(scriptPath);

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

const baseInput = (issues, root, overrides = {}) => ({
  issues,
  root,
  head: HEAD,
  previous: null,
  ...overrides,
});

// ── S2/O1 — the envelope exists, is shaped, and is deterministic ───────────

test("S2: emits a batch-plan@1 envelope with batches, blocked and findings arrays", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    const issues = [issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"]))];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.equal(plan.schema, "batch-plan@1");
    assert.equal(plan.source_revision, HEAD);
    assert.deepEqual(plan.degraded, []);
    assert.ok(Array.isArray(plan.batches));
    assert.ok(Array.isArray(plan.blocked));
    assert.ok(Array.isArray(plan.findings));
    assert.deepEqual(plan.summary, { open_issues: 1, batched: 1, blocked: 0, launched: 0, findings: 0, batches: 1 });
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

test("S3: an in-flight unit doc for an issue marks that issue launched, not batched", () => {
  const root = scratchRoot();
  try {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), roadmapDoc());
    fs.mkdirSync(path.join(root, "docs", "fix", "10-alpha-skill-change"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "fix", "10-alpha-skill-change", "SPEC.md"), "# unit\n");
    const issues = [
      issue(10, "Alpha skill change", whereSection(["skills/alpha/SKILL.md"])),
      issue(11, "Beta change", whereSection(["skills/beta/SKILL.md"])),
    ];
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.launched, [{ number: 10, evidence: "unit-doc docs/fix/10-alpha-skill-change" }]);
    assert.ok(!plan.batches.some((b) => b.lanes.some((l) => l.issues.some((i) => i.number === 10))));
    assert.equal(plan.summary.launched, 1);
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
    const plan = buildBatchPlan(baseInput(issues, root));
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
    const plan = buildBatchPlan(baseInput(issues, root));
    assert.deepEqual(plan.findings, [], "a target that is open and in flight is not an orphan");
    assert.deepEqual(plan.batches[0].lanes[0].issues.map((i) => i.number), [21], "a soft dep never gates");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
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
    assert.equal(plan.schema, "batch-plan@1");
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

test("S9: the script contains no session spawn, worktree creation or unit launch", async () => {
  const src = fs.readFileSync(scriptPath, "utf8");
  for (const banned of ["spawn(", "execFile(", "worktree add", "gh pr", "gh run"]) {
    const lines = src.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => l.includes(banned) && !l.trim().startsWith("//") && !l.trim().startsWith("*"));
    assert.deepEqual(lines, [], `no executable use of ${banned}`);
  }
  assert.ok(!/(fetch|XMLHttpRequest)\s*\(/.test(src), "no network call beyond the gh child process");
});
