#!/usr/bin/env node

/**
 * Fix 224 / P1 — `scripts/unit-route.mjs`, the deterministic unit router.
 *
 * Red-first pins for the closed route table, the bounded read set, the
 * fail-closed exit contract, determinism/read-only behaviour, the committed
 * unit-37 dogfood fixture (SPEC PE-013) and the stdout sanitizer (AC12).
 *
 * The router is read-only; every fixture is either the committed tree at
 * `scripts/fixtures/unit-route/` or a copy of it under `os.tmpdir()`.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "unit-route.mjs");
const FIXTURE = path.join(repoRoot, "scripts", "fixtures", "unit-route");

const run = (args, { root = FIXTURE, cwd = repoRoot } = {}) => spawnSync(
  process.execPath,
  [SCRIPT, ...args],
  { cwd, encoding: "utf8", env: root ? { ...process.env, UNIT_ROUTE_REPO: root } : process.env },
);

const routeLine = (stdout) => /^route: (\S+)$/m.exec(stdout)?.[1] ?? null;
const routeNext = (stdout) => { const m = /^next: (.+)$/m.exec(stdout); return m ? m[1] : null; };
const rowLine = (stdout) => /^rows: (.*)$/m.exec(stdout)?.[1] ?? null;
const readSet = (stdout) => {
  const block = /read-set \((\d+)\):\n([\s\S]*?)\nfingerprint: /.exec(stdout);
  if (!block) return null;
  const entries = block[2].split("\n").filter((line) => line.startsWith("  ") && !line.startsWith("  …"));
  const remainder = /  … and (\d+) more/.exec(block[2]);
  return { count: Number(block[1]), entries: entries.map((line) => line.trim()), remainder: remainder ? Number(remainder[1]) : 0 };
};

// ===========================================================================
// AC1 — the closed route table, first match winning
// ===========================================================================

test("AC1: replan wins over a co-resident fold and decision row", () => {
  const result = run(["10-replan-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan");
  assert.equal(rowLine(result.stdout), "F1 F2 F3", "the router lists every open row without being told an id");
});

const statusLine = (stdout) => /^status: (.*)$/m.exec(stdout)?.[1] ?? null;
const nextLine = (stdout) => /^next: (.*)$/m.exec(stdout)?.[1] ?? null;

test("AC1/fix #224: a finished unit answers the terminal route, never the executor", () => {
  const result = run(["15-done-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "close-out");
  assert.equal(nextLine(result.stdout), "/audit-pr");
  assert.equal(rowLine(result.stdout), "none");
});

test("AC1/fix #224: the status field reads the bare token out of a decorated fix-index cell", () => {
  const result = run(["21-done-fix"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(statusLine(result.stdout), "done", "the markdown cell decoration never reaches the field");
  assert.equal(routeLine(result.stdout), "close-out");
});

test("AC1: decision fires when no row routes to the plan owner", () => {
  const result = run(["12-decision-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "decision");
});

test("AC1: a plain fix-now row routes to the fold", () => {
  const result = run(["11-fold-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "fold");
  assert.equal(readSet(result.stdout).count, 1, "the fold reads its own ledger");
});

// --- #293 AC1 — the product route (P1 pins, red before the router lands) ---

test("#293 AC1: a product-owned fix-now row routes to the product, never the fold", () => {
  const result = run(["18-product-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "product", "a `product owner — …` route cell never falls through to fold");
  assert.equal(nextLine(result.stdout), "/unit-lane 18-product-unit", "the next command is the lane hand-off, executable as typed");
  assert.equal(rowLine(result.stdout), "F1 F2", "both product spellings (`product owner`, `owned by product`) route");
});

test("#293 AC1: the product hand-off names the frozen --fix invocation for a fix unit", () => {
  const result = run(["24-product-fix"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "product");
  assert.equal(nextLine(result.stdout), "/unit-lane --fix 24");
});

test("#293 AC1: product loses to a co-resident replan row", () => {
  const result = run(["19-product-replan-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan", "a blocking replan row outranks the actionable product route");
});

test("#293 AC1: the fold cell spelling never over-matches the product vocabulary", () => {
  const result = run(["11-fold-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "fold", "`fold into phase` is not product vocabulary");
});

// --- #293 F9 — anchored `PRODUCT_ROUTE` never over-matches ---
test("#293 F9: an over-matched cell (‘not product owned — source fix’) still routes to fold", () => {
  const result = run(["99-overmatch1"], { root: FIXTURE });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "fold", "the word ‘product’ inside a source-fix cell must not route to product");
  assert.equal(rowLine(result.stdout), "F1");
});

test("#293 F9: a source cell mentioning the product owner stays in the fold", () => {
  const result = run(["99-overmatch2"], { root: FIXTURE });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "fold", "‘product owner’ inside a source description must not route to product");
  assert.equal(rowLine(result.stdout), "F2");
});

test("#293 F9: a cell that only mentions the product owner stays in the fold", () => {
  const result = run(["99-overmatch3"], { root: FIXTURE });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "fold", "‘product owner’ in a prose description must not route to product");
  assert.equal(rowLine(result.stdout), "F3");
});

test("AC1: a unit with no open row routes to execute", () => {
  for (const unit of ["13-execute-unit", "14-empty-unit"]) {
    const result = run([unit]);
    assert.equal(result.status, 0, `${unit}: ${result.stderr}`);
    assert.equal(routeLine(result.stdout), "execute", unit);
    assert.equal(rowLine(result.stdout), "none", unit);
  }
});

test("AC1: a tracked issue with no unit folder routes to plan-from-issue", () => {
  const result = run(["20"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "plan-from-issue");
  assert.match(result.stdout, /^next: \/unit-lane --fix 20$/m);
});

// ===========================================================================
// AC2 — the bounded read set is derived from the selected rows only
// ===========================================================================

test("AC2: the read set carries the unit surfaces and the selected rows' cited paths", () => {
  const result = run(["37-phase-lint-script"]);
  assert.equal(result.status, 0, result.stderr);
  const set = readSet(result.stdout);
  assert.deepEqual(set.entries, [
    "docs/features/37-phase-lint-script/ACCEPTANCE.md",
    "docs/features/37-phase-lint-script/SPEC.md",
    "docs/features/37-phase-lint-script/review-findings.md",
    "docs/features/38-workflow-status-sensor-script/PLAN.md",
    "docs/features/38-workflow-status-sensor-script/TASKS.md",
    "docs/fix/_TEMPLATE/SPEC.md",
    "scripts/phase-lint.mjs",
  ]);
  assert.ok(!set.entries.includes("docs/LOGS.md"), "a path cited only by a FOLDED row is not in the replan read set");
});

test("F14: a brace-composed citation resolves to every file it names", () => {
  // Row F92's file cell cites two artifacts in one composed citation
  // (`…/38-workflow-status-sensor-script/{PLAN.md:29,TASKS.md:55}`). The delimiter
  // classes stopped at the `{`, so only the composed directory was found and the
  // isDir guard dropped it — two cited paths silently missing from the set AC2
  // promises ("each cited repository path").
  const result = run(["37-phase-lint-script"]);
  assert.equal(result.status, 0, result.stderr);
  const set = readSet(result.stdout);
  for (const cited of [
    "docs/features/38-workflow-status-sensor-script/PLAN.md",
    "docs/features/38-workflow-status-sensor-script/TASKS.md",
  ]) {
    assert.ok(set.entries.includes(cited), `${cited} is on the read set`);
  }
});

test("AC2: the set is deduped, sorted and capped with an explicit remainder line", () => {
  const result = run(["40-cited-paths"]);
  assert.equal(result.status, 0, result.stderr);
  const set = readSet(result.stdout);
  assert.equal(set.count, 23, "3 unit surfaces + 20 distinct cited files");
  assert.equal(set.entries.length, 12, "the printed set is capped at 12");
  assert.equal(set.remainder, 11, "the remainder is explicit, never silently dropped");
  assert.deepEqual(set.entries, [...set.entries].sort(), "the set is sorted");
});

// ===========================================================================
// AC3 — failure states fail closed
// ===========================================================================

test("AC3: an unknown unit exits 1 and prints no route", () => {
  const result = run(["999"]);
  assert.equal(result.status, 1);
  assert.equal(routeLine(result.stdout), null);
  assert.match(result.stderr, /unknown unit: 999/);
});

test("AC3: extra arguments exit 1 and print no route", () => {
  const result = run(["10-replan-unit", "extra"]);
  assert.equal(result.status, 1);
  assert.equal(routeLine(result.stdout), null);
  assert.match(result.stderr, /exactly one argument/);
});

test("AC3: an ambiguous unit exits 2 and prints no route", () => {
  const result = run(["30"]);
  assert.equal(result.status, 2);
  assert.equal(routeLine(result.stdout), null);
  assert.match(result.stderr, /ambiguous unit: 30 matches/);
});

test("F6: --help and -h print the usage contract on stdout and exit 0", () => {
  // Both standard help flags used to be read as unit tokens and answered with a
  // misleading `unknown unit: --help` on stderr, exit 1 — a first-contact defect on
  // the unit's own entry point. Help is a request for the contract, not a failure.
  for (const flag of ["--help", "-h"]) {
    const result = run([flag]);
    assert.equal(result.status, 0, `${flag}: ${result.stderr}`);
    assert.match(result.stdout, /^usage: node scripts\/unit-route\.mjs/m, flag);
    assert.match(result.stdout, /Exit codes/i, `${flag}: the exit-code contract is named`);
    assert.match(result.stdout, /replan/, `${flag}: the closed route table is named`);
    assert.equal(result.stderr, "", `${flag}: help is not an error`);
    assert.equal(routeLine(result.stdout), null, `${flag}: help prints no route`);
  }
});

// ===========================================================================
// AC4 — deterministic and read-only
// ===========================================================================

test("AC4: two consecutive runs print byte-identical stdout", () => {
  const first = run(["224-deterministic-replan-routing"], { root: null });
  const second = run(["224-deterministic-replan-routing"], { root: null });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
});

test("AC4: a run leaves `git status --porcelain` unchanged", () => {
  const before = execFileSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" });
  const result = run(["224-deterministic-replan-routing"], { root: null });
  assert.equal(result.status, 0, result.stderr);
  const after = execFileSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(after, before, "the router writes nothing");
});

// ===========================================================================
// AC5 — the committed dogfood fixture
// ===========================================================================

test("AC5: the unit-37 fixture answers replan and lists the plan-routed ids", () => {
  const result = run(["37-phase-lint-script"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan");
  assert.equal(rowLine(result.stdout), "F83 F85 F88 F90 F92", "the plan-routed open rows, no id passed in");
  assert.match(result.stdout, /^open-rows: 5$/m);
});

// ===========================================================================
// AC12 — one sanitizer over every echoed value
// ===========================================================================

test("AC12/S7: long and shell-shaped cells are sanitized, never echoed as a ledger line", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "unit-route-hostile-"));
  fs.cpSync(FIXTURE, root, { recursive: true });
  const dir = path.join(root, "docs", "features", "90-hostile-unit");
  fs.mkdirSync(dir, { recursive: true });
  const longId = `F9-${"A".repeat(400)}`;
  const longRow = `| ${longId} | scripts/evil.mjs:1 | code | med | fix-now | replan-in-unit: plan owner re-cuts the phase | no |`;
  const shellRow = "| F10 | scripts/evil2.mjs:1 | code | med | fix-now | replan-in-unit: $(rm -rf /) `curl evil` <img src=x onerror=alert(1)> | no |";
  // F28: a C1 control (NEL) and a Unicode line separator inside an echoed cell —
  // neither is matched by `\s`, so the flatten class must cover them.
  const c1Row = "| F11\u0085X | scripts/evil3.mjs:1 | code | med | fix-now | replan-in-unit: plan owner re-cuts the phase | no |";
  // F33: a format character — a bidi override — is invisible to a reader and
  // structural to a parser that honours it, so the flatten class covers Cf too.
  const cfRow = "| F13\u202eX | scripts/evil5.mjs:1 | code | med | fix-now | replan-in-unit: plan owner re-cuts the phase | no |";
  const sepRow = "| F12\u2028Y | scripts/evil4.mjs:1 | code | med | fix-now | replan-in-unit: plan owner re-cuts the phase | no |";
  fs.writeFileSync(path.join(dir, "review-findings.md"), `| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n${longRow}\n${shellRow}\n${c1Row}\n${sepRow}\n${cfRow}\n`);

  const result = run(["90-hostile-unit"], { root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan");
  assert.ok(!result.stdout.includes(longRow), "no verbatim ledger line reaches stdout");
  assert.ok(!result.stdout.includes(shellRow), "no verbatim ledger line reaches stdout");
  assert.ok(!result.stdout.includes(longId), "the long id is truncated by the sanitizer");
  assert.match(result.stdout, /F9-AAAA/, "the id keeps its truncated prefix");
  assert.ok(!result.stdout.includes("\u0085"), "a C1 control never survives the sanitizer (F28)");
  assert.ok(!result.stdout.includes("\u2028"), "a Unicode line separator never survives the sanitizer (F28)");
  assert.match(result.stdout, /F11 X/, "the C1-prefixed id is flattened, not dropped");
  assert.ok(!result.stdout.includes("\u202e"), "a bidi override never survives the sanitizer (F33)");
  assert.match(result.stdout, /F13 X/, "the format-character-prefixed id is flattened too");
  assert.match(result.stdout, /…/, "truncation is visible, never silent");
  assert.ok(!result.stdout.includes("rm -rf"), "the route cell's shell-shaped text is never echoed at all");
  assert.match(result.stdout, /^rows: F9-AA.* F10 F11 X F12 Y F13 X$/m, "every open id is listed on one sanitized line");
});

// ===========================================================================
// Fold cycle 3 — the row parser and the issue surfaces (F29, F30, F31, F34)
// ===========================================================================

const hostileLedger = (rows) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "unit-route-fold3-"));
  fs.cpSync(FIXTURE, root, { recursive: true });
  const dir = path.join(root, "docs", "features", "90-fold3-unit");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "review-findings.md"),
    `| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n${rows.join("\n")}\n`,
  );
  return run(["90-fold3-unit"], { root });
};

test("F29: `folded` is the row's last cell, never a fixed index", () => {
  // An unescaped pipe inside the route cell splits the row past seven cells, so
  // the closed marking sits at the end instead of index 6.
  const result = hostileLedger([
    "| F20 | scripts/a.mjs:1 | code | med | fix-now | fold: tighten the | boundary handling | yes |",
    "| F21 | scripts/b.mjs:1 | code | med | fix-now | fold: tighten the | boundary handling | no |",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(rowLine(result.stdout), "F21", "only the row whose LAST cell is `no` is open");
  assert.equal(/^open-rows: 1$/m.exec(result.stdout)?.[0], "open-rows: 1");
});

test("F30: the ledger's annotated closed spellings are not open rows", () => {
  const result = hostileLedger([
    "| F22 | scripts/c.mjs:1 | code | med | fix-now | fold: x | yes · fold c95ff5b4 |",
    "| F23 | scripts/d.mjs:1 | code | med | fix-now | fold: y | yes ↳ folded by 942ab62 |",
    "| F24 | scripts/e.mjs:1 | code | med | fix-now | fold: z | no · pending |",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(rowLine(result.stdout), "F24", "the annotated `yes` spellings are closed; the annotated `no` is open");
});

test("F31/#291: the execute route names the frozen `--fix <n>` invocation, one phase and the tier", () => {
  const result = run(["22-execute-fix"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "execute");
  assert.equal(nextLine(result.stdout), "/execute-phase --fix 22 P2 (tier: cheap)");
});

test("F31/P6: a `defined` unit with all phases recorded refuses with exit 1 — not close-out", () => {
  // The close-out guard must require status === "done".  A unit whose roadmap
  // row reads `defined` (or any non-done token) with all phases recorded is an
  // ambiguous boundary: not finished (can't audit) and no unfinished phases
  // (can't execute).  The router must fail closed.
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f31-p6-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  // Set the roadmap row for unit 13 to `defined` (not `done`).
  const roadmapPath = path.join(fixture, "docs", "features", "ROADMAP.md");
  const roadmap = fs.readFileSync(roadmapPath, "utf8");
  fs.writeFileSync(
    roadmapPath,
    roadmap.replace(
      "| 13 | `execute-unit` | in-progress |",
      "| 13 | `execute-unit` | defined |"
    ),
  );
  // Record both phases done in the Progress log.
  const specPath = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const spec = fs.readFileSync(specPath, "utf8");
  fs.writeFileSync(
    specPath,
    spec.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — P2 implemented and verified → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 1, "exit 1 — not close-out");
    assert.equal(routeLine(result.stdout), null, "no route on stdout");
    assert.ok(result.stderr.includes("all phases recorded"), "the refusal cites the all-phases-recorded condition");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("F40/P6: a unit doc with no `## Tasks` section routes to P1 (untouched work)", () => {
  // The discriminated helper returns `null` for no-doc/no-Tasks (untouched work),
  // and the guard routes that to P1 instead of failing.
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f40-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  // Remove the `## Tasks` section so the doc has no Tasks section.
  const specPath = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const spec = fs.readFileSync(specPath, "utf8");
  const taskSection = /## Tasks\n[\s\S]*?(?=\n## |$)/.exec(spec);
  if (taskSection) {
    fs.writeFileSync(specPath, spec.slice(0, taskSection.index) + spec.slice(taskSection.index + taskSection[0].length));
  }
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, "exit 0 — untouched work routes to P1");
    assert.ok(routeLine(result.stdout).includes("execute"), "route: execute");
    assert.ok(routeNext(result.stdout).includes("P1"), "next: P1");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("F31/P6: a `done` unit with all phases recorded still routes to close-out", () => {
  // When status IS "done", close-out is correct even with all phases recorded.
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f31-done-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  // Set the roadmap row for unit 13 to `done`.
  const roadmapPath = path.join(fixture, "docs", "features", "ROADMAP.md");
  const roadmap = fs.readFileSync(roadmapPath, "utf8");
  fs.writeFileSync(
    roadmapPath,
    roadmap.replace(
      "| 13 | `execute-unit` | in-progress |",
      "| 13 | `execute-unit` | done |"
    ),
  );
  // Record both phases done in the Progress log.
  const specPath = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const spec = fs.readFileSync(specPath, "utf8");
  fs.writeFileSync(
    specPath,
    spec.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — P2 implemented and verified → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(routeLine(result.stdout), "close-out");
    assert.equal(nextLine(result.stdout), "/audit-pr");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 AC3: the feature execute route names exactly one phase and the execution tier", () => {
  const result = run(["13-execute-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "execute");
  // The unit's Progress log records P1; the first unfinished phase is P2.
  assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P2 (tier: cheap)");
});

test("#291 AC3: a planned unit with an untouched Progress log hands off P1", () => {
  const result = run(["14-empty-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "execute");
  assert.equal(nextLine(result.stdout), "/execute-phase 14-empty-unit P1 (tier: cheap)");
});

test("#291 AC3: the execute route fails closed when no phase is parseable — never a bare whole-unit command", () => {
  const result = run(["17-phaseless-unit"]);
  assert.equal(result.status, 1);
  assert.equal(routeLine(result.stdout), null, "no route block on stdout");
  assert.ok(result.stderr.includes("no parseable phase"), result.stderr);
  assert.ok(!/execute-phase/.test(result.stdout), "the bare whole-unit command is never emitted");
});

test("#291 F1: Progress log `next: P<k>` tail never marks k done — only entry heads count", () => {
  // F1 reproducer: a Progress entry whose only `P<k>` is in the `next:` tail.
  // Before the fix, `recordedPhases` matched the `next: P2` and would skip P1.
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f1-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  // Replace the Progress log so that P1 is ONLY in the `next:` tail.
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — design records written → deadbeef00000000000000000000000000000000 — next: P1 implement"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, result.stderr);
    // P1 was NOT recorded (only in `next:` tail), so the first unfinished is P1.
    assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P1 (tier: cheap)");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F4: Progress log entry head with mid-prose P<n> mention does NOT mark that phase done", () => {
  // F4 reproducer: an entry whose head mentions a later phase in prose
  // ("- ... diff-guard ... P1 and P2 are separate scoped commits ...").
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f4-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  // Tasks P1,P2,P3; Progress log: P1 done, then a prose entry mentioning P2.
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — reverted the P2 spike; nothing shipped → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, result.stderr);
    // The prose "reverted the P2 spike" must NOT mark P2 done, so the first
    // unfinished is P2 (P1 was the only recorded phase).
    assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P2 (tier: cheap)");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F4b: indented list-marker continuation line does NOT re-open an entry", () => {
  // F4b reproducer: an indented list marker after a blank line re-opened the
  // previous code path. Indented markers are continuation prose.
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f4b-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  // Tasks P1,P2,P3; Progress log: P1 done, then an indented list-marker
  // line that mentions P2 in prose.
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — note from review\n  - P2 spiked and reverted; nothing shipped"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, result.stderr);
    // The indented list marker must NOT re-open an entry, so P2 is NOT
    // recorded and the first unfinished is P2.
    assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P2 (tier: cheap)");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F7: long Progress-log line uses linear scan (not quadratic split)", () => {
  // F7 reproducer: a single very long Progress-log line must not trigger
  // quadratic backtracking from the split(/\s+next:.*$/i) pattern.
  // The fix replaces it with indexOf(" next:") which is O(n).
  // This test verifies correctness (no P<n> from the long whitespace run
  // is accidentally captured).
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f7-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  // Replace the Progress log with a P1-done entry followed by a line of
  // 50000 spaces (no " next:" at all).  A quadratic split would stall;
  // a linear scan should return instantly and not capture any phase id.
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n" + " ".repeat(50000) + "x"
    )
  );
  try {
    const t0 = Date.now();
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    const elapsed = Date.now() - t0;
    assert.equal(result.status, 0, result.stderr);
    // The long whitespace line must not capture any phase id.
    assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P2 (tier: cheap)");
    // Must complete in under 500ms (quadratic would take many seconds).
    assert.ok(elapsed < 500, `F7 linear scan took ${elapsed}ms (expected <500ms)`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

// ===========================================================================
// #291 F8: Progress log documents form — phase id in action prose is recorded
// ===========================================================================

test("#291 F8: `— P<n> — implemented` records the phase (formal shape)", () => {
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f8-formal-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  // P6: close-out requires status === "done"; set the roadmap accordingly.
  const roadmapPath = path.join(fixture, "docs", "features", "ROADMAP.md");
  const roadmap = fs.readFileSync(roadmapPath, "utf8");
  fs.writeFileSync(roadmapPath, roadmap.replace(
    "| 13 | `execute-unit` | in-progress |",
    "| 13 | `execute-unit` | done |"
  ));
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — P2 — implemented and verified → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, "every phase is recorded — routes to close-out");
    assert.ok(result.stdout.includes("close-out"), "all phases done, routes to /audit-pr");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F8: `— P<n> implemented` (no second dash) records the phase", () => {
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f8-simple-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const roadmapPath = path.join(fixture, "docs", "features", "ROADMAP.md");
  const roadmap = fs.readFileSync(roadmapPath, "utf8");
  fs.writeFileSync(roadmapPath, roadmap.replace(
    "| 13 | `execute-unit` | in-progress |",
    "| 13 | `execute-unit` | done |"
  ));
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — P2 implemented and verified → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, "every phase is recorded — routes to close-out");
    assert.ok(result.stdout.includes("close-out"), "all phases done, routes to /audit-pr");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F8: `— implement P2: ...` (action word before P) records the phase", () => {
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f8-action-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const roadmapPath = path.join(fixture, "docs", "features", "ROADMAP.md");
  const roadmap = fs.readFileSync(roadmapPath, "utf8");
  fs.writeFileSync(roadmapPath, roadmap.replace(
    "| 13 | `execute-unit` | in-progress |",
    "| 13 | `execute-unit` | done |"
  ));
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — implement P2: hunks landed → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, "every phase is recorded — routes to close-out");
    assert.ok(result.stdout.includes("close-out"), "all phases done, routes to /audit-pr");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F8: `— revert P2 spike` does NOT record P2 (not a known action)", () => {
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f8-revert-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — reverted the P2 spike; nothing shipped → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, result.stderr);
    // P2 was NOT recorded (revert is not a known action), so first unfinished is P2.
    assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P2 (tier: cheap)");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("#291 F8: `— diff guard after P1: ...` records P1 via action keyword", () => {
  const tmpDir = os.tmpdir();
  const fixture = path.join(tmpDir, `unit-route-f8-diffguard-${Date.now()}`);
  fs.cpSync(FIXTURE, fixture, { recursive: true });
  const spec = path.join(fixture, "docs/features/13-execute-unit/SPEC.md");
  const before = fs.readFileSync(spec, "utf8");
  fs.writeFileSync(
    spec,
    before.replace(
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement",
      "- 2026-09-01 10:00 — P1 implemented and verified → 0123456789abcdef0123456789abcdef01234567 — next: P2 implement\n- 2026-09-02 10:00 — diff guard after P1: pass → deadbeef00000000000000000000000000000000"
    )
  );
  try {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "13-execute-unit"],
      { cwd: repoRoot, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: fixture } },
    );
    assert.equal(result.status, 0, result.stderr);
    // P1 recorded via diff guard, P2 is first unfinished.
    assert.equal(nextLine(result.stdout), "/execute-phase 13-execute-unit P2 (tier: cheap)");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("F34: a roadmap row's own issue number resolves instead of dead-ending", () => {
  const result = run(["140"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "plan-from-issue");
  assert.equal(nextLine(result.stdout), "/unit-lane --from-issue 140");
});

test("F32/OB-17: an archived unit (no status source, no open row) answers `historical`", () => {
  // A fix unit whose index row was removed after the merge, and a feature whose
  // roadmap row is gone: both are archived, never sent to the executor.
  const fix = run(["23-merged-fix"]);
  assert.equal(fix.status, 0, fix.stderr);
  assert.equal(routeLine(fix.stdout), "historical");
  assert.equal(statusLine(fix.stdout), "absent");
  assert.match(nextLine(fix.stdout), /^nothing to do — the unit is archived/);

  const feature = run(["16-merged-unit"]);
  assert.equal(feature.status, 0, feature.stderr);
  assert.equal(routeLine(feature.stdout), "historical");
  assert.equal(rowLine(feature.stdout), "none");
});

// ---------------------------------------------------------------------------
// #308 — both document shapes route
//
// A migrated unit doc carries `## Specs` / `## Findings` / `## Log` instead of
// `## Evidence` / `## Progress log` / `review-findings.md`. The router reads both:
// the triage section check accepts either set, done phases come from `## Log`
// (`P<n>` progress lines) when the doc has no `## Progress log`, and OPEN rows
// come from `## Findings` when the doc has no side ledger. The legacy fixtures
// above are the proof the second shape changed nothing.
// ---------------------------------------------------------------------------
const SPEC_REF_FIXTURE = path.join(repoRoot, "scripts", "fixtures", "spec-by-reference", "tree");
const routeSpecRef = (args) => spawnSync(process.execPath, [SCRIPT, ...args], {
  cwd: repoRoot,
  encoding: "utf8",
  env: { ...process.env, UNIT_ROUTE_REPO: SPEC_REF_FIXTURE },
});

test("#308 a migrated unit triages from the re-cut section set", () => {
  const result = routeSpecRef(["--triage", "21-migrated-shape"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^TRIAGE — 21-migrated-shape \(feature\)$/m);
  assert.match(result.stdout, /^Steps: research, design, plan, implement, tests, evidence, review, docs$/m, result.stdout);
});

test("#308 triage still refuses a doc missing a shared section, in either shape", () => {
  const result = routeSpecRef(["--triage", "90-missing-shared"]);
  assert.notEqual(result.status, 0, "a migrated doc that drops ## Impact is still a missing mandatory section");
  assert.match(result.stderr, /missing mandatory sections:.*Impact/);
});

test("#308 done phases come from ## Log when the doc carries no ## Progress log", () => {
  const result = routeSpecRef(["21-migrated-shape"]);
  assert.equal(result.status, 0, result.stderr);
  // `P1` is logged and `P2` is not: a legacy doc with an empty `## Progress log`
  // answers `P1`, so `P2` is only reachable by reading `## Log`.
  assert.match(result.stdout, /^next: \/execute-phase 21-migrated-shape P2 \(tier: /m, result.stdout);
});

test("#308 OPEN rows come from ## Findings when the doc carries no review-findings.md", () => {
  const result = routeSpecRef(["24-migrated-open"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(rowLine(result.stdout), "F7");
  assert.match(routeLine(result.stdout), /^(fold|replan|decision|product)$/);
  assert.match(result.stdout, /^read-set/m);
});

test("#308 the legacy shape is untouched: no ## Log, no ## Findings, same routes", () => {
  const result = routeSpecRef(["20-legacy-shape"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^next: \/execute-phase 20-legacy-shape P2 \(tier: /m, result.stdout);
  const triage = routeSpecRef(["--triage", "20-legacy-shape"]);
  assert.equal(triage.status, 0, triage.stderr);
});
