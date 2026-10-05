#!/usr/bin/env node

/**
 * fix/285 — the pre-execution lineage gate is satisfiable for lane-era units.
 *
 * Feature 61's P8b re-homed the planning ledgers into the unit doc and retired
 * the spec/plan receipt stages, but the plan-stage snapshot table still required
 * the retired `ACCEPTANCE.md` — so `pre-execution-snapshot.mjs` exited 1
 * (`required artifact(s) absent`) for every unit the lane-era pipeline
 * structurally never writes that file for (issue #285, reproduced on
 * `65-doc-toolchain` as PR #282 audit finding F54).
 *
 * This suite proves, black box over the CLI in a throwaway git repository:
 *   · a lane-era fix unit (SPEC.md only — no ACCEPTANCE.md, no progress.md)
 *     builds a plan-stage snapshot: digest, exit 0 (AC1);
 *   · a unit that does carry `ACCEPTANCE.md` still binds the `acceptance`
 *     artifact row — legacy behaviour preserved, not removed (AC2).
 * Plus content pins over the lane-era surfaces this fix aligns:
 *   · `audit-pr`'s closure gate reads the unit doc (triage-block currency +
 *     unit-doc obligations) and keeps the legacy verify path (AC3);
 *   · the producer exists: unit-doc templates carry the two ledger sections and
 *     `unit-lane`'s plan step instructs cutting them per LEDGERS.md (AC4).
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");
const sensorScript = path.join(repoRoot, "scripts", "pre-execution-snapshot.mjs");

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** A fix unit doc with the lane-era mandatory sections (triage-parseable shape). */
const fixSpecText = () => `# fix/2999-lane-era

> One-line: toy lane-era fix unit.

## Issue

\`#2999\` — fixture issue.

## Objective

Make the toy thing work again (2 lines of objective,
because the lane-era fix pipeline never writes retired artifacts).

## Why

The toy broke when the contract moved to the unit doc.

## User outcome

Users observe the toy working.

## Acceptance criteria

1. The toy works (command-verified).
2. The toy does not regress (command-verified).

## Non-goals

- Not the other toy.

## Future cost

None.

## Applicable tests

- Unit tests.

## Known pre-existing issues

None.

## Tasks

P1 — Fix the toy (validator: \`node --test scripts/toy.test.mjs\` exits 0).

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Triaged steps

\`\`\`text
TRIAGE — 2999-lane-era (fix)
Steps: plan, implement, tests, evidence, review, docs
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
\`\`\`

## Progress log

- 2026-10-05 12:00 — fixture created → evidence — next: implement

## Next

Ship it.

## References

#2999

## Branch

fix/2999-lane-era

## Depends on

None.

## Regression scope

n/a
`;

const GUIDE = "# Project guide\n\nRules.\n";
const UNIT_DIR = "docs/fix/2999-lane-era";

function makeRepo(t, { acceptance = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lane-era-lineage-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  fs.symlinkSync(path.join(repoRoot, "packages"), path.join(root, "packages"));
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.copyFileSync(sensorScript, path.join(root, "scripts", "pre-execution-snapshot.mjs"));
  // The verifier's contract-shape module (F24/F25): the sandbox mirrors its real
  // import graph, so the assertions below stay untouched.
  fs.copyFileSync(path.join(repoRoot, "scripts", "pre-execution-contract.mjs"), path.join(root, "scripts", "pre-execution-contract.mjs"));
  write(`${UNIT_DIR}/SPEC.md`, fixSpecText());
  if (acceptance) write(`${UNIT_DIR}/ACCEPTANCE.md`, "# Acceptance\n\n- A1 the toy works.\n");
  write("AGENTS.md", GUIDE);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  git(root, "add", "-A", "--", ".");
  git(root, "commit", "-qm", "fixture: lane-era fix unit");
  const run = (...args) => spawnSync(process.execPath, ["scripts/pre-execution-snapshot.mjs", ...args], {
    cwd: root, encoding: "utf8", timeout: 120000,
  });
  return { root, run };
}

test("plan snapshot builds for a lane-era fix unit with no ACCEPTANCE.md and no progress.md (AC1)", (t) => {
  const { root, run } = makeRepo(t, { acceptance: false });
  const r = run("build", "--stage", "plan", "--unit", "fix-2999-lane-era", "--root", root);
  assert.equal(r.status, 0, `build must exit 0, got ${r.status}: ${r.stderr}`);
  const digest = r.stdout.split("\n")[0].trim();
  assert.match(digest, /^[a-f0-9]{64}$/, `stdout must open with a 64-hex digest, got: ${digest}`);
  // the bound artifacts are exactly the lane-era surface: the unit doc, no retired file
  const snapshot = JSON.parse(r.stdout.split("\n").slice(1).join("\n"));
  const boundKinds = snapshot.artifacts.map((row) => row.kind);
  assert.ok(boundKinds.includes("spec"), "the unit doc (kind spec) is bound");
  assert.ok(!boundKinds.includes("acceptance"), "no acceptance manifest exists in a lane-era unit, none may be bound");
});

test("legacy acceptance manifest still binds when present (AC2)", (t) => {
  const { root, run } = makeRepo(t, { acceptance: true });
  const r = run("build", "--stage", "plan", "--unit", "fix-2999-lane-era", "--root", root);
  assert.equal(r.status, 0, `build must exit 0, got ${r.status}: ${r.stderr}`);
  const snapshot = JSON.parse(r.stdout.split("\n").slice(1).join("\n"));
  const acceptanceRow = snapshot.artifacts.find((row) => row.kind === "acceptance");
  assert.ok(acceptanceRow, "a present ACCEPTANCE.md must still bind as the acceptance artifact");
  assert.equal(acceptanceRow.path, `${UNIT_DIR}/ACCEPTANCE.md`);
});

test("audit-pr's closure gate reads the lane-era surfaces (AC3)", () => {
  const gates = read("skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md");
  // lane-era lineage: triage-block currency re-derived from the doc's own facts
  assert.match(gates, /unit-route\.mjs --triage/, "the lane-era currency check must name the triage re-derivation");
  // obligations are read from the unit doc (embedded shape) or the separate ledger file
  assert.match(gates, /`### Obligations`/, "the unit-doc embedded obligations ledger must be named");
  assert.match(gates, /planning-obligations\.md/, "the separate-file obligations ledger must be named");
  // the legacy verify path stays for units that carry progress.md receipts
  assert.match(gates, /pre-execution-snapshot\.mjs verify --stage/, "the legacy verify recipe must remain named");
  // never a git blob id where a snapshot digest is meant (F1 fold regression)
  assert.ok(!/git hash-object/.test(gates), "the gate must not instruct git hash-object for snapshot digests");
});

test("the producer writes the ledgers: templates and unit-lane plan step (AC4)", () => {
  for (const template of ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"]) {
    const text = read(template);
    assert.match(text, /### Planning evidence/, `${template} must carry the planning-evidence section`);
    assert.match(text, /### Obligations/, `${template} must carry the obligations section`);
  }
  const plan = read("skills/unit-lane/references/PLAN.md");
  assert.match(plan, /Planning evidence/, "unit-lane's plan step must instruct cutting the planning-evidence ledger");
  assert.match(plan, /Obligations/, "unit-lane's plan step must instruct cutting the obligations ledger");
  assert.match(plan, /LEDGERS\.md/, "the sizing rule (embedded XS/S, separate files M/L) stays owned by LEDGERS.md");
});
