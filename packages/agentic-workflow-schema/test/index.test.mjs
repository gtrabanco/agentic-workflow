import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractLastJsonBlock,
  parseEnvelope,
  validateEnvelope,
  isTerminal,
  isRunHalt,
  ENVELOPE_STATES,
} from "../dist/index.js";

const VALID = {
  skill: "execute-phase",
  state: "READY_FOR_REVIEW",
  summary: "Fix 43 implemented, gate green, PR #14 opened.",
  unit: { type: "fix", id: "43-null-crash", issue: 43, branch: "fix/43-null-crash" },
  phase: { current: null, total: null, completed: null },
  pr: { number: 14, url: "https://github.com/o/r/pull/14", state: "open", head_sha: "abc123", merge_ready: null, ci: "pending" },
  gates: { verification: "green", review_pending: true, audit_pending: true },
  findings: { fix_now: [], issues_filed: [45, 46], untriaged: 0, decisions_recorded: 0 },
  blockers: [],
  dependencies: { unmet: [], build_order: [] },
  recommendations: { product_audit: false, reason: null },
  needs_input: null,
  next: { recommended: "/review-change", alternatives: [], tier: "strong" },
  detail: null,
};

const wrap = (obj) => "Some prose before.\n\n```json\n" + JSON.stringify(obj, null, 1) + "\n```\n";

test("extracts the LAST fenced json block", () => {
  const text = "```json\n{\"a\": 1}\n```\nmiddle text\n" + wrap(VALID);
  const raw = extractLastJsonBlock(text);
  assert.ok(raw.includes('"execute-phase"'));
});

test("returns null when no fenced json block exists", () => {
  assert.equal(extractLastJsonBlock("no blocks here"), null);
});

test("parses and validates a correct envelope end-to-end", () => {
  const result = parseEnvelope(wrap(VALID));
  assert.equal(result.ok, true);
  assert.equal(result.envelope.state, "READY_FOR_REVIEW");
  assert.deepEqual(result.envelope.findings.issues_filed, [45, 46]);
});

test("rejects an unknown state", () => {
  const bad = { ...VALID, state: "WHATEVER" };
  const result = validateEnvelope(bad);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith("state must be")));
});

test("rejects missing required keys", () => {
  const { pr, ...rest } = VALID;
  const result = validateEnvelope(rest);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("missing required key: pr"));
});

test("rejects non-integer issues_filed", () => {
  const bad = { ...VALID, findings: { ...VALID.findings, issues_filed: ["45"] } };
  const result = validateEnvelope(bad);
  assert.equal(result.ok, false);
});

test("accepts a populated findings.fix_now[] item", () => {
  const withFinding = {
    ...VALID,
    findings: {
      ...VALID.findings,
      fix_now: [
        {
          id: "F1",
          file: "src/export/handler.ts:88",
          axis: "security",
          severity: "high",
          class: "fix-now",
          route: "fold into phase",
          suggested_tier: "strong",
        },
      ],
    },
  };
  const result = validateEnvelope(withFinding);
  assert.equal(result.ok, true);
});

test("rejects a fix_now item with a bad severity or missing fields", () => {
  const cases = [
    { id: "F1", file: "a.ts:1", axis: "tests", severity: "critical", class: "fix-now", route: "r", suggested_tier: "cheap" },
    { id: "F1", file: "a.ts:1", axis: "tests", severity: "high", class: "fix-now", route: "r", suggested_tier: "medium" },
    { file: "a.ts:1", axis: "tests", severity: "high", class: "fix-now", route: "r", suggested_tier: "strong" },
  ];
  for (const item of cases) {
    const bad = { ...VALID, findings: { ...VALID.findings, fix_now: [item] } };
    const result = validateEnvelope(bad);
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(item)}`);
  }
});

test("accepts a populated next.suggested[]", () => {
  const withSuggested = {
    ...VALID,
    next: {
      ...VALID.next,
      suggested: [
        { command: "/review-change", trigger: "accumulation > 400 lines since last-reviewed sha", source_skill: "execute-phase" },
      ],
    },
  };
  const result = validateEnvelope(withSuggested);
  assert.equal(result.ok, true);
});

test("accepts an envelope with no next.suggested (optional field)", () => {
  const result = validateEnvelope(VALID);
  assert.equal(result.ok, true);
  assert.equal(VALID.next.suggested, undefined);
});

test("rejects a next.suggested item missing a required field", () => {
  const bad = {
    ...VALID,
    next: {
      ...VALID.next,
      suggested: [{ command: "/review-change", trigger: "…" }],
    },
  };
  const result = validateEnvelope(bad);
  assert.equal(result.ok, false);
});

test("reports invalid JSON in the last block", () => {
  const result = parseEnvelope("```json\n{not json}\n```");
  assert.equal(result.ok, false);
  assert.ok(result.errors[0].startsWith("invalid JSON"));
});

test("parseEnvelope rejects a structurally invalid envelope (not just invalid JSON)", () => {
  const bad = { ...VALID, unit: { ...VALID.unit, type: "nonsense" } };
  const result = parseEnvelope(wrap(bad));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith("unit.type must be")));
  assert.equal(result.raw !== null, true); // raw is still returned for debugging
});

test("extracts the last block across CRLF line endings", () => {
  const text = "```json\r\n" + JSON.stringify(VALID) + "\r\n```\r\n";
  const raw = extractLastJsonBlock(text);
  assert.ok(JSON.parse(raw).skill === "execute-phase");
});

test("rejects out-of-enum values throughout the envelope", () => {
  const cases = [
    { ...VALID, pr: { ...VALID.pr, state: "closed" } },
    { ...VALID, pr: { ...VALID.pr, ci: "purple" } },
    { ...VALID, gates: { ...VALID.gates, verification: "yellow" } },
    { ...VALID, blockers: [{ kind: "planet", id: "x", scope: "unit", detail: "d" }] },
    { ...VALID, blockers: [{ kind: "gate", id: "x", scope: "galaxy", detail: "d" }] },
    { ...VALID, dependencies: { unmet: [123], build_order: [] } },
  ];
  for (const bad of cases) {
    const result = validateEnvelope(bad);
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(bad)}`);
  }
});

test("accepts every documented enum value (no false positives)", () => {
  for (const state of ENVELOPE_STATES) {
    assert.equal(validateEnvelope({ ...VALID, state }).ok, true, state);
  }
});

test("terminal + run-halt helpers", () => {
  assert.equal(isTerminal("HALT"), true);
  assert.equal(isTerminal("CONTINUE"), false);
  assert.equal(isRunHalt({ ...VALID, state: "HALT" }), true);
  assert.equal(
    isRunHalt({ ...VALID, blockers: [{ kind: "substrate", id: "forge", scope: "run", detail: "down" }] }),
    true
  );
  assert.equal(isRunHalt(VALID), false);
});

test("enum export is complete (11 states)", () => {
  assert.equal(ENVELOPE_STATES.length, 11);
});
