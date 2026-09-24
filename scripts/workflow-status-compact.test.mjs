#!/usr/bin/env node

/**
 * `workflow-status --compact` — the reduced envelope.
 *
 * `--compact` exists because the complete envelope is mostly repository history:
 * on a repository with dozens of shipped units, `detail.features` and the
 * findings' multi-paragraph `route` memos dominate the document, and a poll loop
 * pays for them in context on every read while no consumer of "what can I do now"
 * reads them. The flag drops that history and keeps every decision.
 *
 * The load-bearing claim is what it must NOT drop, so that is what these tests
 * pin: an unmerged `done` row is live work at the merge gate and survives, a
 * finding keeps its identity, observations are untouched, and the
 * `--last-envelope` guard's divergence note — which the skill's turn contract
 * requires an envelope to carry — survives too.
 *
 * Fixtures are real git repositories under `os.tmpdir()` with a `gh` shim on
 * PATH: no network, no repository mutation, no shared state. A new file rather
 * than an edit to `workflow-status-sensor.test.mjs` because the path policy
 * treats a new-file create as authoring and a modification of an existing
 * protected test file as a recorded decision.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "workflow-status.mjs");

const { loadSchemaRuntime } = await import("./schema-runtime.mjs");
const { validateEnvelope } = await loadSchemaRuntime();

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const ROADMAP_HEADER = [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Depends on | Summary |",
  "|----|------|--------|------------|---------|",
].join("\n");

const FIX_INDEX = [
  "# Active fixes",
  "",
  "## Active",
  "",
  "| Issue | Topic | Status | Notes |",
  "|---|---|---|---|",
].join("\n");

const FROZEN_NRS = ["# Normalized repository state", "", "Status: frozen", "", "Snapshot: compact-1"].join("\n");

const LEDGER_HEADER = [
  "# Review findings",
  "",
  "| id | file:line | axis | severity | class | route | folded |",
  "|---|---|---|---|---|---|---|",
].join("\n");

const FIXTURE_DIRS = new Set();

after(() => {
  for (const dir of FIXTURE_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * A throwaway git repository carrying the substrate the sensor reads, plus a `gh`
 * shim whose canned JSON each test controls. `run()` spawns the sensor inside it
 * with the shim first on PATH.
 */
function makeFixture({ roadmapRows = [], openPrs = [], mergedPrs = [], issues = [], extraFiles = {}, dirty = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-compact-"));
  FIXTURE_DIRS.add(dir);
  const binDir = path.join(dir, "bin");
  fs.mkdirSync(binDir, { recursive: true });

  const write = (rel, content) => {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  };

  write("docs/features/ROADMAP.md", `${ROADMAP_HEADER}\n${roadmapRows.join("\n")}\n`);
  write("docs/fix/README.md", `${FIX_INDEX}\n`);
  write("docs/workflow/REPOSITORY_STATE.md", FROZEN_NRS);
  for (const [rel, content] of Object.entries(extraFiles)) write(rel, content);

  fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env node
const args = process.argv.slice(2).join(" ");
const out = (value) => { process.stdout.write(JSON.stringify(value)); process.exit(0); };
if (args.includes("pr list") && args.includes("--state open")) out(${JSON.stringify(openPrs)});
if (args.includes("pr list") && args.includes("--state merged")) out(${JSON.stringify(mergedPrs)});
if (args.includes("issue list")) out(${JSON.stringify(issues)});
process.stderr.write("unexpected gh call: " + args + "\\n");
process.exit(1);
`, { mode: 0o755 });

  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "fixture@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "Fixture"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  execFileSync("git", ["commit", "-q", "-m", "fixture"], { cwd: dir });
  if (dirty) write(dirty, "uncommitted work\n");

  const run = (args = []) => spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
    timeout: 60_000,
  });

  return { dir, run };
}

const envelopeOf = (result) => {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};

/** A reviewer memo long enough that `--compact` must fingerprint it. */
const LONG_MEMO = "a reviewer memo that runs well past the fingerprint threshold and explains the whole root cause, the reproduction, the contradicting authority, and the reason the fix is not mechanical, which is exactly the kind of cell the envelope used to carry in full on every single poll of the sensor";

const LEDGER_ROW = (id, memo) => `| ${id} | src/a.mjs:1 | code | med | fix-now | ${memo} | no |`;

// ---------------------------------------------------------------------------
// AC1 — a done row is dropped only on positive proof its PR merged
// ---------------------------------------------------------------------------

test("compact: drops a proved-merged done row and keeps the unmerged one at the merge gate", () => {
  const { run } = makeFixture({
    roadmapRows: [
      "| 90 | `shipped` | done · [#10](https://example.test/pr/10) | — | merged unit |",
      "| 91 | `at-gate` | done · [#11](https://example.test/pr/11) | — | unmerged unit |",
      "| 92 | `queued` | planned | — | open unit |",
      "| 93 | `someday` | sparkly | — | unmapped status |",
    ],
    openPrs: [{ number: 11, title: "at gate", headRefName: "feat/91-at-gate", url: "https://example.test/pr/11", statusCheckRollup: [] }],
    mergedPrs: [{ number: 10, headRefName: "feat/90-shipped" }],
  });

  const full = envelopeOf(run());
  const compact = envelopeOf(run(["--compact"]));
  const ids = (envelope) => envelope.detail.features.map((row) => row.id).sort();

  assert.deepEqual(ids(full), ["90-shipped", "91-at-gate", "92-queued", "93-someday"], "the full envelope projects every roadmap row");
  assert.deepEqual(ids(compact), ["91-at-gate", "92-queued", "93-someday"], "compact drops only the proved-merged row");
  assert.deepEqual(compact.detail.startable_now, full.detail.startable_now, "startable_now is mode-independent");
  assert.deepEqual(compact.next, full.next, "the whole next object is mode-independent");
  assert.equal(compact.state, full.state);
  assert.ok(compact.detail.startable_now.includes("91-at-gate"), "the merge-gate unit is still startable in compact");
});

// ---------------------------------------------------------------------------
// AC2 — a finding keeps its identity; only the evidence memo is fingerprinted
// ---------------------------------------------------------------------------

test("compact: fingerprints a long finding memo, leaves a short one, and keeps every other key", () => {
  const { run } = makeFixture({
    roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"],
    extraFiles: {
      "docs/features/90-alpha/review-findings.md": [
        LEDGER_HEADER,
        LEDGER_ROW("F7", LONG_MEMO),
        LEDGER_ROW("F8", "short memo"),
      ].join("\n"),
    },
  });

  const full = envelopeOf(run()).findings.fix_now;
  const compact = envelopeOf(run(["--compact"])).findings.fix_now;

  const fullF7 = full.find((finding) => finding.id === "F7");
  const compactF7 = compact.find((finding) => finding.id === "F7");

  assert.equal(fullF7.route, LONG_MEMO, "the full envelope keeps the memo byte-identical");
  assert.equal(
    compactF7.route,
    `...(${LONG_MEMO.length} char evidence, see the unit review-findings.md)`,
    "compact replaces the memo with a fingerprint naming its length and its home",
  );
  assert.equal(compact.find((finding) => finding.id === "F8").route, "short memo", "a memo already short is left alone");
  assert.deepEqual(
    { ...compactF7, route: null },
    { ...fullF7, route: null },
    "compact changes only the route cell of a finding",
  );
  assert.equal(compact.length, full.length, "every open finding survives compact");
});

// ---------------------------------------------------------------------------
// AC3 — observations are a signal, and neither mode reduces them
// ---------------------------------------------------------------------------

test("compact: leaves workflow_observations byte-identical — every note is a signal", () => {
  const { run } = makeFixture({
    roadmapRows: [
      "| 90 | `alpha` | scheduled | — | unmapped status |",
      "| 91 | `beta` | planned | — | open unit |",
    ],
    dirty: "docs/features/90-alpha/WIP.md",
  });

  const full = envelopeOf(run()).detail.workflow_observations;
  const compact = envelopeOf(run(["--compact"])).detail.workflow_observations;

  // An unmapped roadmap status, the git state and any degradation are repository
  // facts, not history: dropping them would hide drift to save a kilobyte.
  assert.deepEqual(compact, full, "compact must not touch observations");
  assert.match(full.join("\n"), /scheduled/, "the raw unmapped status is named");
  assert.match(full.join("\n"), /uncommitted change/, "the git signal is present");
});

// ---------------------------------------------------------------------------
// AC4 — the turn contract's no-progress guard note survives compact
// ---------------------------------------------------------------------------

test("compact: keeps the --last-envelope guard's divergence note", () => {
  const { run } = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });
  const hint = JSON.stringify({ state: "BLOCKED", next: { recommended: "/workflow-status" } });

  const full = envelopeOf(run(["--last-envelope", hint]));
  const compact = envelopeOf(run(["--compact", "--last-envelope", hint]));

  for (const [mode, envelope] of [["full", full], ["compact", compact]]) {
    assert.match(
      envelope.detail.workflow_observations.join("\n"),
      /diverges from recomputed state/,
      `${mode} must carry the guard's note — the turn contract requires it in every mode`,
    );
  }
});

// ---------------------------------------------------------------------------
// AC5 — compact output stays schema-valid and is strictly smaller
// ---------------------------------------------------------------------------

test("compact: emits a schema-valid envelope and is smaller than the full one", () => {
  const { run } = makeFixture({
    roadmapRows: [
      "| 90 | `shipped` | done · [#10](https://example.test/pr/10) | — | merged unit |",
      "| 91 | `queued` | planned | — | open unit |",
      "| 92 | `someday` | scheduled | — | unmapped |",
    ],
    mergedPrs: [{ number: 10, headRefName: "feat/90-shipped" }],
    extraFiles: {
      "docs/features/91-queued/review-findings.md": `${LEDGER_HEADER}\n${LEDGER_ROW("F1", LONG_MEMO)}\n`,
    },
  });

  const full = run();
  const compact = run(["--compact"]);

  const validation = validateEnvelope(envelopeOf(compact));
  assert.equal(validation.ok, true, `schema errors: ${validation.errors?.join("; ")}`);
  assert.ok(
    compact.stdout.length < full.stdout.length,
    `compact must be smaller (${compact.stdout.length} < ${full.stdout.length})`,
  );
});

// ---------------------------------------------------------------------------
// AC6 — the flag composes with the existing ones
// ---------------------------------------------------------------------------

test("compact: composes with --json-only and repeats byte-identically", () => {
  const { run } = makeFixture({ roadmapRows: ["| 90 | `alpha` | planned | — | a unit |"] });

  const first = run(["--compact", "--json-only"]);
  const second = run(["--compact", "--json-only"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout, "two compact runs are byte-identical");
});

test("compact: an unknown flag is still the deliberate fatal exit", () => {
  const { run } = makeFixture();
  const result = run(["--compact", "--nope"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown flag: --nope/);
  assert.match(result.stderr, /--compact/, "usage documents the flag");
});
