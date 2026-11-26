// test-obligation: protects=scripts/gate-producer-drift.mjs,skills/pre-execution-review/references/LEDGERS.md obligations=contract,failure-path,convention

/**
 * gate-producer-drift.test.mjs — the producer's routing pin (issue #728, unit
 * `docs/features/728-gate-receipt-producer/`).
 *
 * The corpus is the field failure the issue measured: the gate receipt had
 * consumers and no producer, and the four step owners that do run a gate
 * (`execute-phase`, `fold-findings`, `unit-lane`, `review-change`) cited
 * `gate-receipt` **zero** times, so every unit started stale by construction.
 *
 * The mechanic itself — a run through the producer leaves a `current` + `pass`
 * receipt, a signed byte flips it stale, a gate that writes no result document
 * degrades — belongs to `scripts/gate-receipt.test.mjs` and is untouched here.
 * This suite pins the routing that makes that mechanic reachable from the lane,
 * and the declared precondition a project must satisfy for it to be reachable.
 *
 * Cases, and the independent obligation each carries:
 *
 *  - the owner block publishes the producer's six fields — the rule's own
 *    grammar, so a caller cites fields instead of re-deriving them;
 *  - every gate-running step owner cites the producer's command and the block —
 *    the defect the issue measured is literally a zero-citation tree;
 *  - the template guide declares the handshake a project must have, so a project
 *    is never routed into a producer its gate cannot satisfy;
 *  - a tree that cites nothing, and a tree without the declared gate, are named
 *    findings: the gate fails closed on absence instead of passing;
 *  - the producer's default gate is this repository's real gate and it publishes
 *    the same handshake token the receipt consumes — a rename there breaks the
 *    default silently;
 *  - the CLI's block is byte-stable, so a caller reads one shape.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CALLER_TOKENS,
  PRODUCER_BLOCK,
  PRODUCER_CALLERS,
  PRODUCER_FIELDS,
  PRODUCER_OWNER,
  TEMPLATE_GUIDE,
  TEMPLATE_TOKENS,
  audit,
  render,
} from "./gate-producer-drift.mjs";
import { GATE_DEFAULT_SCRIPT, GATE_RESULT_SCHEMA } from "./gate-receipt.mjs";
import { GATE_RESULT_SCHEMA as GATE_HANDSHAKE } from "./local-gate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmpBase = process.env.TMPDIR || os.tmpdir();
const fixtures = [];

process.on("exit", () => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

const write = (root, relative, body) => {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
};

const OWNER_BLOCK = [
  "### The gate-run mark",
  "",
  "```text",
  PRODUCER_BLOCK,
  "field | rule",
  "owner | every step that runs a verification gate",
  "command | runner gate-receipt run",
  "mark-slot | manifest <sha>",
  "ordering | the last signed-byte write of the step",
  "precondition | a gate script that writes local-gate-result@1",
  "absent | run the declared gate command directly",
  "```",
  "",
].join("\n");

/**
 * A throwaway tree carrying the four surfaces the gate reads, all citing what
 * the owner requires. Each case mutates one surface, so the finding it earns
 * names the surface rather than the fixture.
 */
const toyRoot = (overrides = {}) => {
  const dir = fs.mkdtempSync(path.join(tmpBase, "gate-producer-drift-"));
  fixtures.push(dir);
  const base = {
    [PRODUCER_OWNER]: `# Ledgers\n\n${OWNER_BLOCK}`,
    [TEMPLATE_GUIDE]: `# AGENTS\n\n\`\`\`text\ngate receipt | <the gate script that writes a \`local-gate-result@1\` document, or none>\n\`\`\`\n\nRun the gate as \`runner gate-receipt run\`.\n`,
    [GATE_DEFAULT_SCRIPT]: `export const GATE_RESULT_SCHEMA = "${GATE_RESULT_SCHEMA}";\n`,
    ...overrides,
  };
  for (const caller of PRODUCER_CALLERS) {
    base[`skills/${caller}/SKILL.md`] = `# ${caller}\n\nRun the gate as \`runner gate-receipt run\`; the producer's rule is the \`${PRODUCER_BLOCK}\` block.\n`;
  }
  for (const [relative, body] of Object.entries(base)) write(dir, relative, body);
  return dir;
};

test("gate-producer-drift: the owner block publishes every producer field and keeps the mark's manifest slot", () => {
  const owner = fs.readFileSync(path.join(REPO_ROOT, PRODUCER_OWNER), "utf8");
  assert.ok(owner.includes(PRODUCER_BLOCK), `${PRODUCER_OWNER} carries the ${PRODUCER_BLOCK} block`);
  for (const field of PRODUCER_FIELDS) {
    assert.match(owner, new RegExp(`^${field} \\| `, "mu"), `the block declares the ${field} field`);
  }
  assert.match(owner, /^mark-slot \| .*manifest <sha>/mu, "the reserved manifest slot stays filled by the producer");

  const result = audit({ root: REPO_ROOT });
  const ownerFindings = result.findings.filter((finding) => finding.path === PRODUCER_OWNER);
  assert.deepEqual(ownerFindings, [], "the real owner block reports no finding");
  assert.deepEqual(result.owner.missing, []);
});

test("gate-producer-drift: every gate-running step owner cites the producer's command and its block", () => {
  const result = audit({ root: REPO_ROOT });
  for (const caller of PRODUCER_CALLERS) {
    const surface = result.surfaces.find((entry) => entry.path === `skills/${caller}`);
    assert.ok(surface, `${caller} is read as a gate-running step owner`);
    assert.equal(surface.commandCited, true, `${caller} cites \`${CALLER_TOKENS[1]}\``);
    assert.equal(surface.ownerCited, true, `${caller} cites the \`${PRODUCER_BLOCK}\` block`);
  }
  assert.deepEqual(result.findings, [], "the shipped tree is clean");
  assert.equal(result.verdict, "PASS");
});

test("gate-producer-drift: the template guide declares the handshake and the producer command", () => {
  const guide = fs.readFileSync(path.join(REPO_ROOT, TEMPLATE_GUIDE), "utf8");
  for (const token of TEMPLATE_TOKENS) {
    assert.ok(guide.includes(token), `${TEMPLATE_GUIDE} declares \`${token}\``);
  }
  const surface = audit({ root: REPO_ROOT }).surfaces.find((entry) => entry.path === TEMPLATE_GUIDE);
  assert.deepEqual(surface.missing, [], "the shipped template declares every token");
});

test("gate-producer-drift: a tree that cites nothing is a named finding per surface", () => {
  const root = toyRoot({});
  for (const caller of PRODUCER_CALLERS) {
    write(root, `skills/${caller}/SKILL.md`, `# ${caller}\n\nRun the project's gate.\n`);
  }
  write(root, PRODUCER_OWNER, "# Ledgers\n\n### The gate-run mark\n\n```text\ngate-ran@1\n```\n");
  write(root, TEMPLATE_GUIDE, "# AGENTS\n\n## Commands\n");

  const result = audit({ root });
  assert.equal(result.verdict, "FAIL");
  assert.deepEqual(
    result.findings.map((finding) => finding.code).sort(),
    [
      ...PRODUCER_CALLERS.map(() => "caller-command-missing"),
      ...PRODUCER_CALLERS.map(() => "caller-owner-missing"),
      "owner-block-missing",
      "template-token-missing",
    ].sort(),
  );
  for (const complaint of result.findings) {
    assert.ok(complaint.path && complaint.detail, "a finding names its surface and what is missing");
  }
});

test("gate-producer-drift: a caller citing the command but not the owner block is still a finding", () => {
  const root = toyRoot({});
  write(root, "skills/fold-findings/SKILL.md", "# fold-findings\n\nRun `runner gate-receipt run` before the commit.\n");

  assert.deepEqual(audit({ root }).findings, [{
    code: "caller-owner-missing",
    path: "skills/fold-findings",
    detail: `the ${PRODUCER_BLOCK} block is not cited`,
  }]);
});

test("gate-producer-drift: a block missing one field is a finding naming the field", () => {
  const root = toyRoot({ [PRODUCER_OWNER]: `# Ledgers\n\n\`\`\`text\n${PRODUCER_BLOCK}\nfield | rule\nowner | a step\ncommand | runner gate-receipt run\n\`\`\`\n` });

  const result = audit({ root });
  assert.deepEqual(result.owner.missing, ["mark-slot", "ordering", "precondition", "absent"]);
  assert.deepEqual(result.findings.filter((finding) => finding.code === "owner-field-missing").map((finding) => finding.detail), [
    "the block declares no `mark-slot` field",
    "the block declares no `ordering` field",
    "the block declares no `precondition` field",
    "the block declares no `absent` field",
  ]);
});

test("gate-producer-drift: the producer's default gate is this repository's real handshake gate", () => {
  assert.equal(GATE_DEFAULT_SCRIPT, "scripts/local-gate.mjs");
  assert.equal(GATE_RESULT_SCHEMA, "local-gate-result@1");
  assert.equal(GATE_HANDSHAKE, GATE_RESULT_SCHEMA, "the gate publishes the token the receipt consumes");
  assert.ok(fs.existsSync(path.join(REPO_ROOT, GATE_DEFAULT_SCRIPT)), `${GATE_DEFAULT_SCRIPT} exists`);

  assert.deepEqual(
    audit({ root: REPO_ROOT }).findings.filter((finding) => finding.code.startsWith("default-gate-")),
    [],
    "the default target resolves and publishes the handshake",
  );
});

test("gate-producer-drift: a missing or silent default gate is a finding, never a silent pass", () => {
  const missing = toyRoot();
  fs.rmSync(path.join(missing, GATE_DEFAULT_SCRIPT));
  assert.deepEqual(audit({ root: missing }).findings.map((finding) => finding.code), ["default-gate-missing"]);

  const silent = toyRoot({ [GATE_DEFAULT_SCRIPT]: "// a gate that never writes a result document\n" });
  assert.deepEqual(audit({ root: silent }).findings.map((finding) => finding.code), ["default-gate-schema-missing"]);
});

test("gate-producer-drift: no call site inverts the ordering law the owner block states", () => {
  const result = audit({ root: REPO_ROOT });
  assert.deepEqual(result.orderingViolations, [], "every call site agrees the producer runs after the step's signed bytes settle");

  const root = toyRoot({ ["skills/fold-findings/SKILL.md"]: `# fold-findings\n\nRun \`runner gate-receipt run\` (\`${PRODUCER_BLOCK}\`) before this commit, because producing after it would leave the receipt stale.\n` });
  assert.deepEqual(audit({ root }).orderingViolations, [{ path: "skills/fold-findings", detail: "a call site claims producing after the step's signed bytes would stale the receipt" }]);
});

test("gate-producer-drift: the rendered block is fixed and byte-stable", () => {
  assert.equal(
    render(audit({ root: toyRoot() }), "toy-root"),
    "gate-producer-drift — toy-root · 4 callers · 1 owner block · 1 template guide · 0 findings\nverdict: PASS\n",
  );
  assert.equal(
    render(audit({ root: toyRoot({ [TEMPLATE_GUIDE]: "# AGENTS\n" }) }), "toy-root"),
    "gate-producer-drift — toy-root · 4 callers · 1 owner block · 1 template guide · 1 finding\n" +
      `FINDING template-token-missing — ${TEMPLATE_GUIDE}: missing ${TEMPLATE_TOKENS.join(", ")}\n` +
      "verdict: FAIL\n",
  );
});
