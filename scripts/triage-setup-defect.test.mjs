// test-obligation: protects=skills/triage-issue/references/ISSUE_PROCESS.md,packages/agentic-workflow/src/doctor/vehicle.mjs obligations=contract,failure-path

/**
 * triage-setup-defect.test.mjs — the triage route for a setup state (issue #611, S3).
 *
 * The false-bug class this pins: a session hits a runner refusal for a subcommand
 * that **exists in the working tree**, because the vehicle it runs is the
 * installed release (stale) or the override was never armed. Today that report
 * routes to triage as a code bug; the rule this suite pins says a setup state is
 * not a defect.
 *
 * Three things are frozen here, in both directions:
 *
 *  1. the rule lives once, in the triage skill's own reference file, and cites
 *     its owners (`runner-contract/references/RUNNER.md`, the doctor's
 *     `dogfooding-vehicle` row) instead of restating the override;
 *  2. the `setup-defect-route@1` table is machine-readable and its four rows
 *     classify exactly what the shipped decision table
 *     (`classifySetupState`, `packages/agentic-workflow/src/doctor/vehicle.mjs`)
 *     answers — the prose and the code cannot drift apart;
 *  3. the route ends on a **published** verdict (`wontfix`): the triage
 *     vocabulary is closed, and a new one is not this rule's to invent.
 *
 * The suite reads committed bytes and imports the crate's source module directly,
 * so it runs offline in the root gate.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { classifySetupState } from "../packages/agentic-workflow/src/doctor/vehicle.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(ROOT, relative), "utf8");

const ISSUE_PROCESS = "skills/triage-issue/references/ISSUE_PROCESS.md";
const SKILL = "skills/triage-issue/SKILL.md";
const GUIDE = "AGENTS.md";

/** The block as written: marker line, header, then the declared rows. */
function parseRoute(text) {
  const lines = String(text).split("\n");
  const marker = lines.findIndex((line) => line.trim() === "setup-defect-route@1");
  if (marker === -1) return null;
  const header = lines[marker + 1]?.trim() ?? "";
  const rows = [];
  for (const line of lines.slice(marker + 2)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("```")) break;
    const cells = trimmed.split("|").map((cell) => cell.trim());
    if (cells.length !== 4 || cells[0] === "row") continue;
    rows.push({ id: cells[0], when: cells[1], classification: cells[2], move: cells[3] });
  }
  return { header, rows };
}

const processText = read(ISSUE_PROCESS);
const route = parseRoute(processText);

test("the route is declared once, in the triage skill's own reference file (S3)", () => {
  assert.ok(route, `${ISSUE_PROCESS} declares the setup-defect-route@1 block`);
  assert.equal(route.header, "row | when | classification | move");
  assert.deepEqual(route.rows.map((row) => row.id), ["R1", "R2", "R3", "R4"], "four rows, ordered");
  for (const row of route.rows) {
    assert.ok(row.when.length > 20, `${row.id} states a condition`);
    assert.ok(row.move.length > 10, `${row.id} states where it goes`);
  }
});

test("the classifications are the three the decision table answers, and none is a triage verdict", () => {
  const allowed = new Set(["setup-defect", "code-bug", "unresolved"]);
  for (const row of route.rows) assert.ok(allowed.has(row.classification), `${row.id}: ${row.classification}`);
  const verdictBlock = processText.slice(processText.indexOf("triage-verdict@1"));
  for (const row of route.rows) {
    assert.ok(
      !new RegExp(`^${row.classification} \\|`, "mu").test(verdictBlock),
      `${row.classification} is a route outcome, never a verdict row`,
    );
  }
});

test("the rule cites its owners instead of restating the override (S3, PE-002)", () => {
  const start = processText.indexOf("setup-defect-route@1");
  const section = processText.slice(Math.max(0, start - 3000), start + 2500);
  assert.match(section, /runner-contract\/references\/RUNNER\.md/u, "the override's owner is cited");
  assert.match(section, /`dogfooding-vehicle`/u, "the doctor row is cited");
  assert.match(section, /\bdoctor\b/u, "the row is read, not guessed");
  assert.doesNotMatch(processText, /AGENTIC_WORKFLOW_RUNNER\s*=/u, "the value shape stays in RUNNER.md");
  assert.doesNotMatch(processText, /bin\/agentic-workflow\.mjs/u, "the target path stays in the runner contract");
});

test("every declared row classifies what the shipped decision table answers (AC4)", () => {
  // The inputs each row's `when` names, encoded here so the prose is decided by
  // the code rather than trusted. `true`/`false` is "the subcommand/skill exists
  // in the working tree".
  const cases = {
    R1: [
      { vehicleStatus: "stale", subcommandInTree: true },
      { vehicleStatus: "unarmed", subcommandInTree: true },
    ],
    R2: [
      { vehicleStatus: "stale", subcommandInTree: false },
      { vehicleStatus: "unarmed", subcommandInTree: false },
    ],
    R3: [
      { vehicleStatus: "ok", subcommandInTree: true },
      { vehicleStatus: "ok", subcommandInTree: false },
    ],
    R4: [
      { vehicleStatus: "unreachable", subcommandInTree: true },
      { vehicleStatus: "not-applicable", subcommandInTree: true },
    ],
  };
  for (const row of route.rows) {
    for (const input of cases[row.id]) {
      const decision = classifySetupState(input);
      assert.equal(
        decision.classification,
        row.classification,
        `${row.id} (${input.vehicleStatus} + in-tree=${input.subcommandInTree}) → ${row.classification}`,
      );
      assert.ok(decision.reason.length > 20, `${row.id}: the decision carries its reason`);
    }
  }
});

test("a setup defect fires only on the issue's shape — refused, in-tree, stale or unarmed (AC4)", () => {
  const fires = (input) => classifySetupState(input).classification === "setup-defect";
  assert.equal(fires({ vehicleStatus: "stale", subcommandInTree: true }), true);
  assert.equal(fires({ vehicleStatus: "unarmed", subcommandInTree: true }), true);
  assert.equal(fires({ vehicleStatus: "stale", subcommandInTree: false }), false, "a genuine missing subcommand is never a setup state");
  assert.equal(fires({ vehicleStatus: "ok", subcommandInTree: true }), false, "a healthy vehicle refusing a shipped command is a real bug");
  assert.equal(fires({ vehicleStatus: "unreachable", subcommandInTree: true }), false, "an unreadable vehicle is not proof either way");
});

test("the route ends on a published verdict and hands the move, not an implementation (S3, PE-007)", () => {
  const start = processText.indexOf("setup-defect-route@1");
  const section = processText.slice(Math.max(0, start - 3000), start + 2500);
  assert.match(section, /`wontfix`/u, "the report ends as wontfix, an existing verdict");
  assert.match(section, /falls through to the ordinary classification/u, "a surviving symptom is triaged normally");
  assert.match(processText, /^remove \|/mu, "the published verdict table is still the one the row cites");
});

test("the surface is registered where the drift gate reads it, and the skill points at the paragraph (S3, S5)", () => {
  const guide = read(GUIDE);
  assert.match(guide, /^setup-defect-route \| skills\/triage-issue\/references\/ISSUE_PROCESS\.md \| block:setup-defect-route@1 \|/mu);
  assert.match(read(SKILL), /ISSUE_PROCESS\.md/u, "the skill still routes to the file that owns the rule");
});
