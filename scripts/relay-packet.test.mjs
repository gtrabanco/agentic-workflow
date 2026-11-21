#!/usr/bin/env node
// test-obligation: protects=scripts/relay-packet.mjs obligations=contract,failure-path

/**
 * relay-packet.test.mjs — the packet checker's suite (red-first, issue #294).
 *
 * The contract under test (unit 82 `## Specs` S4, S5, S6, S7, S9, S11, S12, S25):
 *   - a packet is pi-web's three documents, validated with pi-web's own bounds;
 *   - the charter is a pointer (it names an existing unit doc and restates no
 *     plan, gate or step);
 *   - the baton is a state + a leg cursor + a phase cursor + evidence pointers,
 *     never a second copy of the unit doc's evidence table;
 *   - `decisions.md` is optional, never required;
 *   - the leg tier comes from the runner's bundled catalog only;
 *   - the coherence verdict matches the `REVIEW-VERDICT` grammar owned by
 *     `skills/unit-lane/references/REVIEW.md`;
 *   - the handover (charter + baton) measures under the declared ceiling.
 *
 * The corpus lives in `scripts/fixtures/relay-packet/`: one accepted packet and
 * one rejected document per fault class, so a regression names the document that
 * caught it. Every run copies the corpus into a throwaway tree, so no test can
 * mutate a committed fixture.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { RELAY_MODES } from "../packages/agentic-workflow/src/relay/Packet.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "relay-packet.mjs");
const CORPUS = path.join(ROOT, "scripts", "fixtures", "relay-packet");
const CATALOG = path.join(ROOT, "packages", "agentic-workflow", "src", "runner", "catalog.json");
const BUDGETS = path.join(ROOT, "docs", "workflow", "SKILL_CONTEXT_BUDGETS.json");

const UNIT = "20-relay-unit";
const PACKET = ".pi-web/relays/20-relay-unit";

let scratch;

before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), "relay-packet-"));
});

after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

/** A throwaway copy of the corpus, so a mutation never touches the committed tree. */
let copies = 0;
const tree = () => {
  const dir = path.join(scratch, `tree-${++copies}`);
  fs.cpSync(CORPUS, dir, { recursive: true });
  return dir;
};

const run = (args, { root = CORPUS, catalog = CATALOG, budgets = BUDGETS, env = {} } = {}) => spawnSync(
  process.execPath,
  [SCRIPT, ...args],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      RELAY_PACKET_REPO: root,
      RELAY_PACKET_CATALOG: catalog,
      RELAY_PACKET_BUDGETS: budgets,
      ...env,
    },
  },
);

const write = (root, relative, body) => {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
};

/** Swap one packet document for its rejected corpus twin. */
const swap = (root, document, fixture) => {
  fs.copyFileSync(path.join(CORPUS, "rejected", fixture), path.join(root, PACKET, document));
};

const copyCatalog = (mutate) => {
  const copy = path.join(scratch, `catalog-${++copies}.json`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  mutate(catalog);
  fs.writeFileSync(copy, JSON.stringify(catalog, null, 2));
  return copy;
};

const copyBudgets = (mutate) => {
  const copy = path.join(scratch, `budgets-${++copies}.json`);
  const budgets = JSON.parse(fs.readFileSync(BUDGETS, "utf8"));
  mutate(budgets);
  fs.writeFileSync(copy, JSON.stringify(budgets, null, 2));
  return copy;
};

const line = (stdout, name) => new RegExp(`^${name}: (.+)$`, "m").exec(stdout)?.[1] ?? null;

/* --------------------------------------------------------------- check: PASS */

test("check: the accepted packet passes with the fixed block", () => {
  const result = run(["check", UNIT]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /^RELAY-PACKET — 20-relay-unit$/m);
  assert.equal(line(result.stdout, "packet"), PACKET);
  assert.equal(line(result.stdout, "state"), "Active");
  assert.equal(line(result.stdout, "legs"), "1 → 2");
  assert.equal(line(result.stdout, "phase"), "P2");
  assert.equal(line(result.stdout, "verdict"), "PASS");
  assert.match(line(result.stdout, "fingerprint") ?? "", /^[0-9a-f]{16}$/);
});

test("check: two runs print byte-identical blocks", () => {
  const first = run(["check", UNIT]);
  const second = run(["check", UNIT]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
});

test("check: the packet is accepted without decisions.md — the document is optional", () => {
  assert.equal(fs.existsSync(path.join(CORPUS, PACKET, "decisions.md")), false);
  const result = run(["check", UNIT]);
  assert.equal(result.status, 0, result.stderr);
});

test("check: a decisions.md beside the packet is accepted when it carries text", () => {
  const root = tree();
  write(root, `${PACKET}/decisions.md`, "# Decisions\n\n- D1 — keep the packet pointer-only.\n");
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 0, result.stderr);
});

test("check: an empty decisions.md is refused, never silently ignored", () => {
  const root = tree();
  write(root, `${PACKET}/decisions.md`, "   \n\n");
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /decisions\.md must contain saved text/);
});

test("check: a well-formed REVIEW-VERDICT in the unit doc passes", () => {
  const root = tree();
  fs.appendFileSync(path.join(root, "docs", "features", UNIT, "SPEC.md"), [
    "",
    "REVIEW-VERDICT: PASS",
    "- Findings: 0 material, 1 report-notes",
    "- Evidence reproduced: yes",
    "- AC integrity: unchanged from triage",
    "",
  ].join("\n"));
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

/* -------------------------------------------------------------- check: FAULT */

const faults = [
  ["a charter that restates the plan's tasks", "charter.md", "charter-restates-tasks.md", /charter restates the plan/],
  ["a charter that names a unit doc that does not exist", "charter.md", "charter-missing-unit-doc.md", /names no existing unit doc/],
  ["a baton whose state is outside the closed set", "status.md", "status-unknown-state.md", /state must be one of/],
  ["a baton that duplicates an evidence row", "status.md", "status-duplicates-evidence.md", /baton duplicates the unit doc's evidence/],
  ["a baton whose leg cursor is malformed", "status.md", "status-bad-cursor.md", /leg cursor/],
  ["a baton with no phase cursor", "status.md", "status-no-phase.md", /phase cursor/],
  ["a log with no leg entry", "log.md", "log-no-legs.md", /carries no leg entry/],
];

for (const [what, document, fixture, expected] of faults) {
  test(`check: refuses ${what}`, () => {
    const root = tree();
    swap(root, document, fixture);
    const result = run(["check", UNIT], { root });
    assert.equal(result.status, 1, result.stdout);
    assert.equal(line(result.stdout, "verdict"), "FAIL");
    assert.match(result.stdout, expected);
    assert.match(result.stdout, new RegExp(`rejected/${fixture.replace(".", "\\.")}|${document.replace(".", "\\.")}`));
  });
}

test("check: refuses a malformed REVIEW-VERDICT block", () => {
  const root = tree();
  fs.copyFileSync(path.join(CORPUS, "rejected", "verdict-malformed.md"), path.join(root, "docs", "features", UNIT, "SPEC.md"));
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /REVIEW-VERDICT/);
});

test("check: refuses a missing document", () => {
  const root = tree();
  fs.rmSync(path.join(root, PACKET, "status.md"));
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /status\.md is missing/);
});

test("check: refuses an empty document", () => {
  const root = tree();
  write(root, `${PACKET}/charter.md`, "\n\n");
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /charter\.md must contain saved text/);
});

test("check: refuses a document above pi-web's 256 KiB bound", () => {
  const root = tree();
  write(root, `${PACKET}/log.md`, `# Log\n\n## Leg 1\n\n${"x".repeat(256 * 1024)}\n`);
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /log\.md must be at most 262144 bytes/);
});

test("check: refuses a packet that is not a directory", () => {
  const root = tree();
  fs.rmSync(path.join(root, PACKET), { recursive: true, force: true });
  write(root, `${PACKET}/charter.md`, "# not a packet\n");
  const result = run(["check", UNIT, "--packet", `${PACKET}/charter.md`], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /packet must be a directory/);
});

test("check: refuses an unknown unit", () => {
  const result = run(["check", "99-nope"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown unit/);
});

/* ---------------------------------------------------------------- budget gate */

test("budget: the accepted handover measures under the declared ceiling", () => {
  const result = run(["budget", UNIT]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const measured = Number(line(result.stdout, "measured")?.replace(" est", ""));
  const ceiling = Number(line(result.stdout, "ceiling")?.replace(" est", ""));
  assert.ok(Number.isFinite(measured) && measured > 0, result.stdout);
  assert.ok(measured < ceiling, `measured ${measured} must sit under ${ceiling}`);
  assert.equal(line(result.stdout, "verdict"), "PASS");
});

test("budget: a handover above the ceiling fails closed", () => {
  const root = tree();
  write(root, `${PACKET}/status.md`, `# Baton\n\nState: Active\nLegs: 1 → 2\nPhase: P2\n\n${"- filler line for the ceiling case\n".repeat(400)}`);
  const result = run(["budget", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.equal(line(result.stdout, "verdict"), "FAIL");
  assert.match(result.stdout, /measured .* > ceiling/);
});

test("budget: the ceiling is read from the budgets manifest, never a constant", () => {
  const budgets = copyBudgets((manifest) => {
    manifest.relays.legHandoverEstimateMax = 10;
  });
  const result = run(["budget", UNIT], { budgets });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /^ceiling: 10 est$/m);
});

test("budget: a manifest without the relays ceiling fails closed", () => {
  const budgets = copyBudgets((manifest) => {
    delete manifest.relays;
  });
  const result = run(["budget", UNIT], { budgets });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /relays\.legHandoverEstimateMax/);
});

/* ------------------------------------------------------------- tier mapping */

test("tiers: the leg tiers come from the catalog's budget_tier rows", () => {
  const result = run(["tiers", UNIT]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "execute"), "cheap");
  assert.equal(line(result.stdout, "coherence-review"), "strong");
  assert.equal(line(result.stdout, "source"), "packages/agentic-workflow/src/runner/catalog.json");
  assert.equal(line(result.stdout, "verdict"), "PASS");
});

test("tiers: a catalog that flips the implement tier flips the printed execute tier", () => {
  const catalog = copyCatalog((value) => {
    value.catalog.implement.budget_tier = "strong";
  });
  const result = run(["tiers", UNIT], { catalog });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "execute"), "strong", "the tier is read, never hardcoded");
});

test("tiers: a catalog with no relay mapping fails closed", () => {
  const catalog = copyCatalog((value) => {
    delete value.relay;
  });
  const result = run(["tiers", UNIT], { catalog });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /catalog: no relay leg mapping/);
});

/* ------------------------------------------------------------- obligations */

const obligations = (rows) => [
  "# Obligations",
  "",
  "| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |",
  "|---|---|---|---|---|---|---|---|---|",
  ...rows,
  "",
].join("\n");

test("obligations: every row verified passes with the tally", () => {
  const root = tree();
  write(root, "docs/features/82-obligation-unit/SPEC.md", "# 82 — obligation-unit\n\n## Tasks\n\n- P1 — work (validator: `true` exits 0)\n");
  write(root, "docs/features/82-obligation-unit/planning-obligations.md", obligations([
    "| O1 | S1 | one behaviour | P1 | P1 | execute-phase | `true` exits 0 | the run | verified |",
    "| O2 | S1 | a second behaviour | P1 | P1 | execute-phase | `true` exits 0 | covered by O1 at `docs/features/82-obligation-unit/SPEC.md:5` | n/a |",
  ]));
  const result = run(["obligations", "82-obligation-unit"], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "rows"), "2");
  assert.equal(line(result.stdout, "verified"), "1");
  assert.equal(line(result.stdout, "n/a"), "1");
  assert.equal(line(result.stdout, "open"), "0");
  assert.equal(line(result.stdout, "verdict"), "PASS");
});

test("obligations: a planned row blocks and is named", () => {
  const root = tree();
  write(root, "docs/features/83-open-unit/SPEC.md", "# 83 — open-unit\n\n## Tasks\n\n- P1 — work (validator: `true` exits 0)\n");
  write(root, "docs/features/83-open-unit/planning-obligations.md", obligations([
    "| O1 | S1 | one behaviour | P1 | P1 | execute-phase | `true` exits 0 | the run | verified |",
    "| O2 | S1 | a second behaviour | P1 | P1 | execute-phase | `true` exits 0 | the run | planned |",
  ]));
  const result = run(["obligations", "83-open-unit"], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.equal(line(result.stdout, "open"), "1");
  assert.match(result.stdout, /O2/);
  assert.equal(line(result.stdout, "verdict"), "FAIL");
});

test("obligations: an n/a row with no evidence is an open obligation", () => {
  const root = tree();
  write(root, "docs/features/84-empty-na-unit/SPEC.md", "# 84 — empty-na-unit\n\n## Tasks\n\n- P1 — work (validator: `true` exits 0)\n");
  write(root, "docs/features/84-empty-na-unit/planning-obligations.md", obligations([
    "| O1 | S1 | one behaviour | P1 | P1 | execute-phase | `true` exits 0 | — | n/a |",
  ]));
  const result = run(["obligations", "84-empty-na-unit"], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /n\/a without evidence/);
});

test("obligations: a unit with no ledger is a defect, never an empty pass", () => {
  const root = tree();
  const result = run(["obligations", UNIT], { root });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /planning-obligations\.md is missing/);
});

test("obligations: a row that does not carry the nine declared columns fails closed", () => {
  const root = tree();
  write(root, "docs/features/85-malformed-unit/SPEC.md", "# 85 — malformed-unit\n\n## Tasks\n\n- P1 — work (validator: `true` exits 0)\n");
  write(root, "docs/features/85-malformed-unit/planning-obligations.md", obligations([
    "| O1 | S1 | one behaviour | P1 | P1 | execute-phase | `true` exits 0 | the run | verified |",
    "| O2 | S1 | a row whose validator cell carries an unescaped pipe | P1 | P1 | execute-phase | `rg -c 'a|b' x` matches 0 | the run | verified |",
  ]));
  const result = run(["obligations", "85-malformed-unit"], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /escape a literal pipe/);
});

test("obligations: an escaped pipe inside a cell is one cell, not a malformed row", () => {
  const root = tree();
  write(root, "docs/features/86-escaped-unit/SPEC.md", "# 86 — escaped-unit\n\n## Tasks\n\n- P1 — work (validator: `true` exits 0)\n");
  write(root, "docs/features/86-escaped-unit/planning-obligations.md", obligations([
    "| O1 | S1 | one behaviour | P1 | P1 | execute-phase | `rg -c 'a\\|b' x` matches 0 | the run | verified |",
  ]));
  const result = run(["obligations", "86-escaped-unit"], { root });
  assert.equal(result.status, 0, result.stdout);
  assert.equal(line(result.stdout, "rows"), "1");
});

/* ------------------------------------------------- check: receipt boundary */

/**
 * Issue #680. The coherence verdict is evidence, not a receipt: a `Complete`
 * baton whose PR carries no current `review-change:pass` receipt leaves the
 * whole review-receipt lane orphaned (`RELAY.md` §Receipt boundary). The checker
 * used to accept it — `state: Complete` / `verdict: PASS` / exit 0 — because the
 * baton grammar never parsed the `Review:` line it publishes.
 *
 * The corpus is the accepted packet with the baton moved to Complete; the
 * evidence is the baton's own `Review:` line, in the closed form the contract
 * publishes. No forge call: the checker stays offline (PE-009).
 */

const COMPLETE = "State: Complete";
const SHA = "0123456789abcdef0123456789abcdef01234567";

/** The accepted packet with its baton in the given state and review line. */
const completeTree = (reviewLine) => {
  const root = tree();
  const baton = path.join(root, PACKET, "status.md");
  const lines = fs.readFileSync(baton, "utf8").split("\n").map((entry) => (entry.startsWith("State: ") ? COMPLETE : entry));
  const kept = lines.filter((entry) => !entry.startsWith("Review:"));
  kept.splice(kept.length - 1, 0, ...(reviewLine === null ? [] : [`Review: ${reviewLine}`]));
  fs.writeFileSync(baton, kept.join("\n"));
  return root;
};

test("check CO1: a Complete baton with no current receipt is refused, naming the receipt", () => {
  const root = completeTree(`attempted 1 — REVIEW-VERDICT: PASS (evidence, not a receipt)`);
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.equal(line(result.stdout, "state"), "Complete");
  assert.equal(line(result.stdout, "verdict"), "FAIL");
  assert.match(result.stdout, /no current review receipt/i);
});

test("check CO2: a Complete baton with no Review line at all is refused — silence is never current", () => {
  const root = completeTree(null);
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /Review:/);
  assert.match(result.stdout, /no current review receipt/i);
});

test("check CO3: a Complete baton whose PR receipt is current passes", () => {
  const root = completeTree(`receipt current at ${SHA}`);
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "state"), "Complete");
  assert.equal(line(result.stdout, "verdict"), "PASS");
});

test("check CO4: a hand-authored receipt heading in the unit doc never clears the fault", () => {
  const root = completeTree("pending");
  fs.appendFileSync(path.join(root, "docs", "features", UNIT, "SPEC.md"), [
    "",
    "## Final review receipt",
    "",
    "REVIEW-VERDICT: PASS — coherence review done, awaiting owner decision, /audit-pr outside the relay.",
    "",
  ].join("\n"));
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /no current review receipt/i);
});

test("check CO5: a non-Complete baton is never asked for a receipt", () => {
  const root = tree();
  const baton = path.join(root, PACKET, "status.md");
  const lines = fs.readFileSync(baton, "utf8").split("\n").map((entry) => (entry.startsWith("State: ") ? "State: Active" : entry));
  lines.splice(lines.length - 1, 0, "Review: pending");
  fs.writeFileSync(baton, lines.join("\n"));
  const result = run(["check", UNIT], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "verdict"), "PASS");
});

/* ---------------------------------------------------- closeout: the ladder */

/**
 * Issue #680 S2. The relay's last leg ends by running the close-out ladder and
 * printing the mandated `→ Next:` block: `/review-change <NN-slug>` while the
 * receipt is missing or stale, `/audit-pr <PR-url>` only once it is current —
 * and never "awaiting owner decision" as a substitute.
 */

const CLOSE = "closeout";

test("closeout CO6: an absent receipt routes the leg to /review-change and never names /audit-pr", () => {
  const root = completeTree("pending");
  const result = run([CLOSE, UNIT], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "receipt"), "absent");
  assert.match(result.stdout, /^→ Next: \/review-change 20-relay-unit$/m);
  assert.doesNotMatch(result.stdout, /\/audit-pr /);
});

test("closeout CO7: a current receipt routes the leg to /audit-pr with the PR url and states the precondition", () => {
  const root = completeTree(`receipt current at ${SHA} · pr https://github.com/o/r/pull/335`);
  const result = run([CLOSE, UNIT], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "receipt"), "current");
  assert.match(result.stdout, /^→ Next: \/audit-pr https:\/\/github\.com\/o\/r\/pull\/335$/m);
  assert.match(result.stdout, /^precondition: .*review receipt$/m);
});

test("closeout CO8: a stale receipt routes back to /review-change, never forward to the merge gate", () => {
  const root = completeTree(`receipt current at ${"f".repeat(40)}`);
  const result = run([CLOSE, UNIT], { root });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(line(result.stdout, "receipt"), "stale");
  assert.match(result.stdout, /^→ Next: \/review-change 20-relay-unit$/m);
  assert.doesNotMatch(result.stdout, /\/audit-pr /);
});

test("closeout CO9: an Active baton is refused — the ladder runs when the relay is complete", () => {
  const root = tree();
  const result = run([CLOSE, UNIT], { root });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /Complete/);
  assert.doesNotMatch(result.stdout, /^→ Next:/m);
});

test("closeout CO10: the mode is a member of the closed list on both entry points, and an unknown mode still refuses", () => {
  const help = run(["bogus", UNIT]);
  assert.equal(help.status, 2);
  assert.match(help.stderr, /names the mode/);
  assert.equal(RELAY_MODES.includes("closeout"), true, "the crate's closed mode list carries closeout");
});

test("closeout CO11: the crate entry point prints the identical close-out block", () => {
  const root = completeTree("pending");
  const scripted = run(["closeout", UNIT], { root });
  const crate = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "relay", "closeout", UNIT], {
    encoding: "utf8",
    cwd: root,
    env: { ...process.env, RELAY_PACKET_REPO: root },
  });
  assert.equal(crate.status, scripted.status, crate.stderr || crate.stdout);
  assert.equal(crate.stdout, scripted.stdout, "the two entry points print one block");
});

/* ------------------------------------------- closeout: the published grammar */

/**
 * #680 S5 — the close-out shape is a published machine grammar, not a sentence:
 * `block:relay-closeout@1` on the relay contract, and its `→ Next:` line uses
 * the same tokens the runtime prints.
 */
test("closeout CO12: relay-closeout@1 is published on the relay contract and its rows resolve", async () => {
  const relayDoc = fs.readFileSync(path.join(ROOT, "skills", "unit-lane", "references", "RELAY.md"), "utf8");
  assert.match(relayDoc, /^relay-closeout@1$/m, "the block id is published");
  const block = relayDoc.split("```text").map((chunk) => chunk.split("```")[0]).find((chunk) => chunk.includes("relay-closeout@1"));
  assert.ok(block, "the block is fenced");
  const rows = block.split("\n").filter((line) => line.trim() !== "" && !line.startsWith("relay-closeout@1") && !line.startsWith("#"));
  assert.ok(rows.length >= 3, "the block carries a header and its rows");
  const header = rows[0];
  assert.match(header, /^field \| shape \| what it orders$/);
  for (const field of ["receipt", "next", "precondition"]) {
    assert.ok(rows.some((row) => row.startsWith(`${field} |`)), `the block orders the \`${field}\` field`);
  }
  const { closeoutNext } = await import("../packages/agentic-workflow/src/relay/Packet.mjs");
  assert.equal(closeoutNext({ slug: UNIT, receipt: "absent", pr: null }), `→ Next: /review-change ${UNIT}`);
  assert.equal(closeoutNext({ slug: UNIT, receipt: "current", pr: "https://github.com/o/r/pull/335" }), "→ Next: /audit-pr https://github.com/o/r/pull/335");
});
