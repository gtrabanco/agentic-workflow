/**
 * doctor.vehicle.test.mjs — the `dogfooding-vehicle` row (issue #611, S2).
 *
 * The row answers one question with evidence: does this authoring session run
 * the working tree, and if not, how far behind is the release it runs instead?
 * It is a **setup state**, never a code bug, so the suite pins the statuses the
 * issue names (`unarmed`, `stale`, `ok`), the two honest degradations
 * (`unreachable`, `not-applicable`), the exact instruction each one prints, and
 * the setup-defect decision the triage route reads.
 *
 * Read-only by construction: the module is handed a fake `ops`, the same seam
 * `doctor.checks.test.mjs` uses, and nothing here touches the machine.
 *
 * Written red-first (P2): `src/doctor/vehicle.mjs` does not exist before this
 * suite.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { runDoctor, renderDoctor } from "../src/doctor/doctor.mjs";
import { CHECK_PROBES } from "../src/doctor/checks.mjs";
import {
  VEHICLE_OVERRIDE,
  classifySetupState,
  compareCanaryTag,
  evaluateVehicle,
  parseCanaryTag,
  vehicleEvidence,
} from "../src/doctor/vehicle.mjs";

const README = readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8");
const VEHICLE_SOURCE = readFileSync(fileURLToPath(new URL("../src/doctor/vehicle.mjs", import.meta.url)), "utf8");

const ROOT = "/project";
const HOME = "/home/agent";
const BIN = `${ROOT}/packages/agentic-workflow/bin/agentic-workflow.mjs`;
const AGENT_DIR = `${HOME}/.pi/agent`;
const PINNED_PACKAGE = `${AGENT_DIR}/npm/node_modules/@gtrabanco/pi-agentic-workflow/package.json`;
const CANARY = "v5.0.0-canary.20261118.2";

/** The same injectable bundle the doctor suite uses, narrowed to what this row reads. */
function fakeOps({ env = {}, tags = null, tagsStatus = 0, installed = "5.0.0-canary.20261118.2", files = {}, dirs = {} } = {}) {
  const table = { ...files };
  if (installed !== null) table[PINNED_PACKAGE] = JSON.stringify({ name: "@gtrabanco/pi-agentic-workflow", version: installed });
  table[BIN] = "#!/usr/bin/env node\n";
  return {
    root: ROOT,
    home: HOME,
    platform: "linux",
    arch: "x64",
    nodeVersion: "26.13.0",
    env,
    binaryPath: (name) => (name === "bun" ? "/home/agent/.bun/bin/bun" : name === "node" ? "/usr/local/bin/node" : null),
    version: () => null,
    readText: (path) => (path in table ? table[path] : null),
    exists: (path) => path in table || path in dirs,
    listDir: () => [],
    git: (_root, args) => {
      if (args[0] === "tag") return { status: tagsStatus, stdout: tagsStatus === 0 ? (tags ?? [CANARY]).join("\n") : "" };
      return { status: 1, stdout: "" };
    },
    ghAuth: () => ({ authenticated: true, detail: "logged in" }),
    httpJson: async () => ({ ok: false, body: null }),
  };
}

/** The healthy host every other check already passes, plus the vehicle row's inputs. */
function healthyOps(overrides = {}) {
  return fakeOps({
    env: { [VEHICLE_OVERRIDE]: `bun ${BIN}` },
    files: {
      [`${ROOT}/.bun-version`]: "1.4.4\n",
      [`${ROOT}/.serena/project.yml`]: "language_servers:\n  - typescript\n",
      [`${ROOT}/.serena/project.local.yml`]: "language_servers:\n  - typescript\n",
      [`${ROOT}/.gitattributes`]: "",
      [`${ROOT}/scripts/local-gate.mjs`]: "//\n",
      [`${AGENT_DIR}/settings.json`]: JSON.stringify({ packages: ["npm:gentle-engram@latest"] }),
      [`${AGENT_DIR}/npm/node_modules/gentle-engram/package.json`]: JSON.stringify({ version: "0.8.0" }),
    },
    dirs: { [`${ROOT}/.git/hooks`]: ["pre-push"] },
    ...overrides,
  });
}

const row = (envelope) => envelope.rows.find((candidate) => candidate.id === "dogfooding-vehicle");

test("canary tags: the stamp is date-then-counter, and a stable tag is not a canary", () => {
  assert.deepEqual(parseCanaryTag(CANARY), { tag: CANARY, version: "5.0.0", date: "20261118", serial: 2 });
  assert.deepEqual(parseCanaryTag("v5.0.0-canary.20261117.3").date, "20261117");
  assert.equal(parseCanaryTag("v4.10.0"), null, "a stable tag names no canary stamp");
  assert.equal(parseCanaryTag("canary"), null, "a tag without a stamp is not a canary");
  assert.equal(compareCanaryTag(CANARY, "v5.0.0-canary.20261118.1"), 1);
  assert.equal(compareCanaryTag("v5.0.0-canary.20261117.3", CANARY), -1);
  assert.equal(compareCanaryTag(CANARY, CANARY), 0);
  assert.equal(compareCanaryTag("v5.0.1-canary.20261118.2", CANARY), 1, "a newer line wins the same day");
});

test("unarmed: the override is unset, the release is behind the newest canary, and the instruction is the arming line (AC3)", () => {
  const evidence = vehicleEvidence(fakeOps({ env: {}, installed: "5.0.0-canary.20261113.1" }));
  assert.equal(evidence.source, "unset");
  assert.equal(evidence.behind, true);
  const verdict = evaluateVehicle(evidence);
  assert.equal(verdict.status, "unarmed");
  assert.match(verdict.advisory, /20261113\.1/u, "the installed version is named");
  assert.match(verdict.advisory, /v5\.0\.0-canary\.20261118\.2/u, "the newest canary tag is named");
  assert.equal(verdict.instruction, `export ${VEHICLE_OVERRIDE}='bun ${BIN}'`);
  assert.match(verdict.advisory, /bun scripts\/release\.mjs apply --channel canary/u, "the canary cut is named");
  assert.match(verdict.advisory, /pi install npm:@gtrabanco\/pi-agentic-workflow@canary/u, "the refresh is named");
});

test("unarmed without a visible canary tag: the comparison degrades honestly and never reports ok", () => {
  const evidence = vehicleEvidence(fakeOps({ env: {}, tags: [] }));
  assert.equal(evidence.canary, null);
  assert.equal(evidence.tagsVisible, 0);
  const verdict = evaluateVehicle(evidence);
  assert.notEqual(verdict.status, "ok");
  assert.equal(verdict.status, "unarmed");
  assert.match(verdict.advisory, /no canary tag is visible/u);
  assert.match(verdict.instruction, /git fetch --tags/u);
});

test("ok: the override reaches this checkout's bin, and the installed/release facts stay in the evidence (AC3)", () => {
  const evidence = vehicleEvidence(fakeOps({ env: { [VEHICLE_OVERRIDE]: `bun ${BIN}` } }));
  const verdict = evaluateVehicle(evidence);
  assert.equal(verdict.status, "ok");
  assert.equal(verdict.instruction, null);
  assert.equal(evidence.target, BIN);
  assert.equal(evidence.targetExists, true);
  assert.equal(evidence.installed.version, "5.0.0-canary.20261118.2");
  assert.equal(evidence.canary.tag, CANARY);
});

test("ok with a behind release: the row stays ok — the tree is the newer half — and still surfaces both versions (S2, O13)", () => {
  const evidence = vehicleEvidence(fakeOps({ env: { [VEHICLE_OVERRIDE]: `bun ${BIN}` }, installed: "5.0.0-canary.20261113.1" }));
  assert.equal(evidence.behind, true);
  const verdict = evaluateVehicle(evidence);
  assert.equal(verdict.status, "ok");
  assert.match(verdict.advisory, /5\.0\.0-canary\.20261113\.1/u);
  assert.match(verdict.advisory, CANARY);
});

test("stale: the override is applied but does not reach this checkout, so the vehicle in force is a release", () => {
  const evidence = vehicleEvidence(fakeOps({ env: { [VEHICLE_OVERRIDE]: "bunx @gtrabanco/agentic-workflow@4.10.0" } }));
  assert.equal(evidence.source, VEHICLE_OVERRIDE);
  assert.equal(evidence.targetInCheckout, false);
  const verdict = evaluateVehicle(evidence);
  assert.equal(verdict.status, "stale");
  assert.equal(verdict.instruction, `export ${VEHICLE_OVERRIDE}='bun ${BIN}'`);
});

test("unreachable: an armed path inside this checkout that does not exist is never treated as armed", () => {
  const evidence = vehicleEvidence(fakeOps({ env: { [VEHICLE_OVERRIDE]: `bun ${ROOT}/.worktrees/gone/packages/agentic-workflow/bin/agentic-workflow.mjs` } }));
  assert.equal(evidence.targetExists, false);
  const verdict = evaluateVehicle(evidence);
  assert.equal(verdict.status, "unreachable");
  assert.match(verdict.advisory, /does not exist/u);
});

test("not-applicable: a project without the crate source is not an authoring checkout", () => {
  const ops = fakeOps({ env: {} });
  ops.exists = () => false;
  const evidence = vehicleEvidence(ops);
  assert.equal(evidence.binPresent, false);
  assert.equal(evaluateVehicle(evidence).status, "not-applicable");
});

test("the override's empty value is the unset spelling (RUNNER.md's contract, not a second reading)", () => {
  for (const value of ["", "   ", "\t"]) {
    assert.equal(vehicleEvidence(fakeOps({ env: { [VEHICLE_OVERRIDE]: value } })).source, "unset");
  }
});

test("the setup-defect decision table: it fires on the issue's shape, and never on a genuinely missing subcommand (AC4)", () => {
  const cases = [
    { vehicleStatus: "stale", subcommandInTree: true, classification: "setup-defect" },
    { vehicleStatus: "unarmed", subcommandInTree: true, classification: "setup-defect" },
    { vehicleStatus: "stale", subcommandInTree: false, classification: "code-bug" },
    { vehicleStatus: "unarmed", subcommandInTree: false, classification: "code-bug" },
    { vehicleStatus: "ok", subcommandInTree: true, classification: "code-bug" },
    { vehicleStatus: "ok", subcommandInTree: false, classification: "code-bug" },
    { vehicleStatus: "unreachable", subcommandInTree: true, classification: "unresolved" },
    { vehicleStatus: "not-applicable", subcommandInTree: true, classification: "unresolved" },
  ];
  for (const expected of cases) {
    const decision = classifySetupState({ vehicleStatus: expected.vehicleStatus, subcommandInTree: expected.subcommandInTree });
    assert.equal(decision.classification, expected.classification, `${expected.vehicleStatus} + in-tree=${expected.subcommandInTree}`);
    assert.ok(decision.move.length > 10, `${expected.vehicleStatus}: the decision names its move`);
  }
  assert.match(classifySetupState({ vehicleStatus: "stale", subcommandInTree: true }).reason, /setup state, not a code defect/u);
});

test("the row rides the doctor envelope with its documented requirement, route and instruct-only move (AC3, AC5)", async () => {
  const envelope = await runDoctor({ ops: healthyOps() });
  const found = row(envelope);
  assert.ok(found, "the envelope carries the row");
  assert.equal(found.requirement, "optional");
  assert.equal(found.route, "instruct-only");
  assert.equal(found.status, "ok");
  assert.equal(found.move, "report-only", "a healthy row is report-only");
  assert.equal(CHECK_PROBES.filter((probe) => probe.id === "dogfooding-vehicle").length, 1);
  assert.match(README, /^dogfooding-vehicle \|/mu, "the inventory documents the row");
  assert.match(renderDoctor(envelope), /dogfooding-vehicle\s+vehicle /u);
  assert.equal(envelope.rows.length, 15, "one row per documented surface");
});

test("an unarmed row is instruct-only in the wizard's vocabulary, and prints the exact command", async () => {
  const envelope = await runDoctor({ ops: healthyOps({ env: {} }) });
  const found = row(envelope);
  assert.equal(found.status, "unarmed");
  assert.equal(found.move, "instruct-only");
  assert.match(found.instruction, /^export AGENTIC_WORKFLOW_RUNNER='bun \/project\//u);
  assert.equal(found.evidence.vehicle.arming, found.instruction, "the row prints the one arming string it derived");
});

test("the doctor writes nothing: the vehicle module carries no write or installer call", () => {
  assert.doesNotMatch(VEHICLE_SOURCE, /\b(?:writeFileSync|writeFile|appendFileSync|mkdirSync|rmSync|unlinkSync|execFileSync|spawnSync)\b/u);
  assert.doesNotMatch(VEHICLE_SOURCE, /git\([^)]*\[[^\]]*"(?:config|add|commit|push)"/u);
});
