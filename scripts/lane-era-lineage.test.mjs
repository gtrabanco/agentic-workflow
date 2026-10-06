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
 *
 * Cycle-4 fold (findings F9–F13) adds the machine surface those findings
 * demanded: `scripts/unit-lineage.mjs` is the runtime of `audit-pr` gate 1, and
 * the tests below drive it over fixture repos instead of pinning its prose:
 *   · a lane-era unit whose triage block re-derives and whose obligation ledger
 *     is closed passes (F12 — behavioral re-derivation, not substring pins);
 *   · a tampered `Steps:` line, an absent ledger, an empty ledger, and an open
 *     obligation row each answer BLOCKED (F11 — the prose rules gain a reader);
 *   · a planted `progress.md` cannot select a weaker gate: the discriminator is
 *     a verifying receipt, not file presence (F10);
 *   · a verifying plan receipt takes the legacy path, and a stale one falls
 *     through to the lane-era checks instead of deadlocking the gate.
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

/** A fix unit doc with the lane-era mandatory sections (triage-parseable shape).
 *
 * The objective is four non-empty lines so `unit-route.mjs` re-derives a
 * `standard` scope from the doc's own facts — the pasted triage block below must
 * be truthful for the behavioral lineage assertions (a trivial scope would
 * re-derive different `Steps:` and the currency tests could not pass).
 *
 * `obligations` controls the `### Obligations` ledger subsection of `## Evidence`:
 * "verified" | "na" | "open" | "empty" | null (section absent — producer defect).
 */
const fixSpecText = ({ obligations = null } = {}) => `# fix/2999-lane-era

> One-line: toy lane-era fix unit.

## Issue

\`#2999\` — fixture issue.

## Objective

Make the toy thing work again (four lines of objective,
so the lane-era fix pipeline re-derives a standard scope
from the doc's own facts, and the pasted triage block
is truthful for the behavioral lineage assertions below).

## Why

The toy broke when the contract moved to the unit doc.

## User outcome

Users observe the toy working.

## Acceptance criteria

1. The toy works (command-verified).
2. The toy does not regress (command-verified).
3. The toy's fix is auditable (lineage-verified).

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
${obligationsBlock(obligations)}
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

const OBLIGATION_HEADER = "| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |";

/** The `### Obligations` ledger subsection, in the shape the templates carry. */
const obligationsBlock = (kind) => {
  if (kind === null) return "";
  if (kind === "empty") {
    return `\n### Obligations\n\n${OBLIGATION_HEADER}\n|---|---|---|---|---|---|---|---|---|\n`;
  }
  const row = kind === "open"
    ? `| O1 | AC1 | the toy works after the fix | P1 | P1 | unit-lane:implement | \`node --test scripts/toy.test.mjs\` | gate output in Evidence | planned |`
    : kind === "na"
      ? `| n/a | none | no normative behaviour in this fix | — | — | — | — | — | n/a: truly no obligations |`
      : `| O1 | AC1 | the toy works after the fix | P1 | P1 | unit-lane:implement | \`node --test scripts/toy.test.mjs\` | gate output in Evidence | verified |`;
  return `\n### Obligations\n\n${OBLIGATION_HEADER}\n|---|---|---|---|---|---|---|---|---|\n${row}\n`;
};

const GUIDE = "# Project guide\n\nRules.\n";
const UNIT_DIR = "docs/fix/2999-lane-era";

function makeRepo(t, { acceptance = false, obligations = null } = {}) {
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
  write(`${UNIT_DIR}/SPEC.md`, fixSpecText({ obligations }));
  if (acceptance) write(`${UNIT_DIR}/ACCEPTANCE.md`, "# Acceptance\n\n- A1 the toy works.\n");
  write("AGENTS.md", GUIDE);
  // The lineage gate's machine surface plus the router it re-derives the triage
  // block with, copied into the sandbox so the CLI runs against fixture bytes.
  for (const name of ["unit-lineage.mjs", "unit-route.mjs", "catalog.json"]) {
    fs.copyFileSync(path.join(repoRoot, "scripts", name), path.join(root, "scripts", name));
  }
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "commit.gpgsign", "false");
  // every fixture commit predates the receipt's recorded finish (2026-08-31), so
  // the verifier's impossible-timeline guard never mis-flags a legacy receipt
  const datedEnv = { ...process.env, GIT_COMMITTER_DATE: "2026-08-30T00:00:00Z", GIT_AUTHOR_DATE: "2026-08-30T00:00:00Z" };
  execFileSync("git", ["add", "-A", "--", "."], { cwd: root, env: datedEnv });
  execFileSync("git", ["commit", "-qm", "fixture: lane-era fix unit"], { cwd: root, env: datedEnv });
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

// ── unit-lineage: the machine surface of audit-pr gate 1 (fold F9–F13) ──────

/** Run the lineage check over a fixture repo. */
const lineage = (root, ...args) => spawnSync(process.execPath, ["scripts/unit-lineage.mjs", "--unit", "2999-lane-era", "--root", root, ...args], {
  cwd: root, encoding: "utf8", timeout: 120000,
});

/** A commit whose date precedes the fixture receipt's recorded finish (2026-08-31). */
const FIXTURE_DATE = "2026-08-30T00:00:00Z";
const datedCommit = (root, message) => {
  const env = { ...process.env, GIT_COMMITTER_DATE: FIXTURE_DATE, GIT_AUTHOR_DATE: FIXTURE_DATE };
  execFileSync("git", ["add", "-A", "--", "."], { cwd: root, env });
  execFileSync("git", ["commit", "-qm", message], { cwd: root, env });
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
};

/** The receipt block format `review-plan` publishes (OUTPUT.md) for a fix unit. */
const planReceiptBlock = ({ digest, sourceRevision, artifactRevision, policy = "v1" }) => `## Pre-execution review receipt v1 — plan
- Review: rs-2999-001 · Snapshot: sha256:${digest} · Verdict: plan-review-pass
- Unit: fix-2999-lane-era · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: rs-none
- Source revision: ${sourceRevision} · Artifact revision: ${artifactRevision}
- Reviewer: reviewer-session · Session: s-1 · Role: reviewer · Author: author-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: ${policy}
- Started/finished: 2026-08-31T00:00:00Z/2026-08-31T00:05:00Z · Findings: 0 (material open: 0)
`;

/** Build the plan snapshot and record its PASS receipt in `progress.md`, committed. */
const recordPlanReceipt = (root) => {
  const build = spawnSync(process.execPath, ["scripts/pre-execution-snapshot.mjs", "build", "--stage", "plan", "--unit", "fix-2999-lane-era", "--root", root], { cwd: root, encoding: "utf8", timeout: 120000 });
  assert.equal(build.status, 0, `receipt build failed: ${build.stderr}`);
  const digest = build.stdout.split("\n")[0].trim();
  const snapshot = JSON.parse(build.stdout.split("\n").slice(1).join("\n"));
  fs.writeFileSync(path.join(root, UNIT_DIR, "progress.md"), planReceiptBlock({
    digest, sourceRevision: snapshot.sourceRevision, artifactRevision: snapshot.artifactRevisionId,
  }));
  datedCommit(root, "fixture: record plan review receipt");
  return digest;
};

test("unit-lineage: lane-era unit with a current triage block and closed obligations passes (F12 behavioral)", (t) => {
  const { root } = makeRepo(t, { obligations: "verified" });
  const r = lineage(root);
  assert.equal(r.status, 0, `must pass, got ${r.status}: ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /LINEAGE OK — lane-era/, "the verdict names the path that applied");
  assert.match(r.stdout, /obligations closed \(1\)/, "the verdict counts the closed obligation rows");
});

test("unit-lineage: a tampered Steps line is BLOCKED — behavioral re-derivation, not substring pins (F12)", (t) => {
  const { root } = makeRepo(t, { obligations: "verified" });
  const specPath = path.join(root, UNIT_DIR, "SPEC.md");
  fs.writeFileSync(specPath, fs.readFileSync(specPath, "utf8").replace("Steps: plan, implement, tests, evidence, review, docs", "Steps: implement, evidence"));
  const r = lineage(root);
  assert.equal(r.status, 1, `must BLOCK, got ${r.status}: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /Steps:/, "the verdict names the differing line");
  assert.match(r.stdout, /--retriage/, "the route back is the lane's re-triage");
});

test("unit-lineage: tampering the doc's own facts (Applicable tests) breaks currency the same way (F12)", (t) => {
  const { root } = makeRepo(t, { obligations: "verified" });
  const specPath = path.join(root, UNIT_DIR, "SPEC.md");
  fs.writeFileSync(specPath, fs.readFileSync(specPath, "utf8").replace(/^- Unit tests\.$/m, "n/a — no tests for this fixture"));
  const r = lineage(root);
  assert.equal(r.status, 1, `tampering the facts must change the re-derived block: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
});

test("unit-lineage: a missing triage block is BLOCKED with the retriage route", (t) => {
  const { root } = makeRepo(t, { obligations: "verified" });
  const specPath = path.join(root, UNIT_DIR, "SPEC.md");
  fs.writeFileSync(specPath, fs.readFileSync(specPath, "utf8").replace(/[\s\S]*?## Triaged steps/, "## Triaged steps"));
  const r = lineage(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /--retriage/);
});

test("unit-lineage: an absent obligations ledger is BLOCKED (F11)", (t) => {
  const { root } = makeRepo(t, { obligations: null });
  const r = lineage(root);
  assert.equal(r.status, 1, `must BLOCK, got ${r.status}: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /obligation/i);
});

test("unit-lineage: an empty obligations table is BLOCKED (F11)", (t) => {
  const { root } = makeRepo(t, { obligations: "empty" });
  const r = lineage(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /empty/i);
});

test("unit-lineage: an open obligation row is BLOCKED, naming the id", (t) => {
  const { root } = makeRepo(t, { obligations: "open" });
  const r = lineage(root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /O1/, "the verdict names the open obligation id");
});

test("unit-lineage: an explicit n/a obligations row passes", (t) => {
  const { root } = makeRepo(t, { obligations: "na" });
  const r = lineage(root);
  assert.equal(r.status, 0, `must pass, got ${r.status}: ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /LINEAGE OK — lane-era/);
});

// F14 — `n/a` in the obligation-id column must not close a `planned` row
// (only the status column determines closure per LEDGERS.md)
test("unit-lineage: n/a in obligation-id column + planned status is BLOCKED (F14)", (t) => {
  const { root } = makeRepo(t, { obligations: "na" });
  // replace the n/a row with an n/a-id + planned row
  const specPath = path.join(root, UNIT_DIR, "SPEC.md");
  const spec = fs.readFileSync(specPath, "utf8");
  const replaced = spec.replace(
    `| n/a | none | no normative behaviour in this fix | — | — | — | — | — | n/a: truly no obligations |`,
    `| n/a: not applicable | AC1 | fallback use | P1 | task | unit-lane | cmd | evidence | planned |`
  );
  fs.writeFileSync(specPath, replaced);
  const r = lineage(root);
  assert.equal(r.status, 1, `n/a-id + planned must BLOCK: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /n\/a: not applicable/, "the verdict names the open obligation id");
});

// F15 — "never both" enforced: embedded closed ledger + separate open file = BLOCKED
test("unit-lineage: embedded+separate-file ledgers (never both) is BLOCKED (F15)", (t) => {
  const { root } = makeRepo(t, { obligations: "verified" });
  // add a separate-file ledger with an open row
  fs.writeFileSync(path.join(root, UNIT_DIR, "planning-obligations.md"),
    `| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |\n|---|---|---|---|---|---|---|---|---|\n| O2 | AC2 | secondary | P2 | task | unit-lane | cmd | evidence | planned |\n`);
  const r = lineage(root);
  assert.equal(r.status, 1, `never both must BLOCK: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /never both/i, "the reason cites the never-both rule");
});

test("unit-lineage: a planted progress.md cannot select a weaker gate (F10)", (t) => {
  const { root } = makeRepo(t, { obligations: "open" });
  // an author-planted receipt that does not re-derive (no bound digest at all):
  // the legacy path must not open, and the lane-era checks must still apply
  fs.writeFileSync(path.join(root, UNIT_DIR, "progress.md"), "## Pre-execution review receipt v1 — plan\n- Review: forged · Verdict: plan-review-pass\n");
  datedCommit(root, "fixture: plant a receipt");
  const r = lineage(root);
  assert.equal(r.status, 1, `the planted receipt must not dodge the obligations check: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
  assert.match(r.stdout, /O1/, "the lane-era obligations check still ran and names the open id");
});

test("unit-lineage: a verifying plan receipt takes the legacy path", (t) => {
  const { root } = makeRepo(t, { acceptance: true, obligations: "verified" });
  recordPlanReceipt(root);
  const r = lineage(root);
  assert.equal(r.status, 0, `must pass, got ${r.status}: ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /LINEAGE OK — legacy/, "a re-deriving receipt is the legacy path");
});

test("unit-lineage: a stale legacy receipt falls through to the lane-era checks, never deadlocks", (t) => {
  const { root } = makeRepo(t, { acceptance: true, obligations: "verified" });
  recordPlanReceipt(root);
  // move a bound artifact after the receipt: the receipt no longer re-derives
  fs.writeFileSync(path.join(root, UNIT_DIR, "ACCEPTANCE.md"), "# Acceptance\n\n- A1 the toy works.\n- A2 tampered after the receipt.\n");
  datedCommit(root, "fixture: tamper a bound artifact");
  const r = lineage(root);
  assert.equal(r.status, 0, `a genuinely lane-era-valid surface must not deadlock: ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /LINEAGE OK — lane-era/, "the fall-through re-judges the unit on its own surface");
});

test("unit-lineage: a stale legacy receipt on a doc without lane-era surface stays BLOCKED", (t) => {
  const { root } = makeRepo(t, { acceptance: true, obligations: "verified" });
  recordPlanReceipt(root);
  const specPath = path.join(root, UNIT_DIR, "SPEC.md");
  fs.writeFileSync(specPath, fs.readFileSync(specPath, "utf8").replace(/[\s\S]*?## Triaged steps/, "## Triaged steps"));
  fs.writeFileSync(path.join(root, UNIT_DIR, "ACCEPTANCE.md"), "# Acceptance\n\n- A1 tampered.\n");
  datedCommit(root, "fixture: tamper bound artifact and strip triage block");
  const r = lineage(root);
  assert.equal(r.status, 1, `the receipt no longer re-derives and no lane-era surface remains: ${r.stdout}`);
  assert.match(r.stdout, /LINEAGE BLOCKED/);
});

test("audit-pr gate 1 routes through the machine surface and retracts the phantom digest (F9)", () => {
  const gates = read("skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md");
  assert.match(gates, /unit-lineage\.mjs/, "gate 1 must name its machine surface");
  assert.match(gates, /LINEAGE OK/, "the fixed verdict vocabulary the gate reads must be named");
  assert.ok(!/digest of the triage block/.test(gates), "F9: the paragraph claiming a triage digest is retracted");
  assert.match(gates, /pre-execution-snapshot\.mjs verify --stage/, "the legacy verify recipe stays named (F1-fold regression pin)");
});
