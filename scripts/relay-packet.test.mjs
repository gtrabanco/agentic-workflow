#!/usr/bin/env node

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
