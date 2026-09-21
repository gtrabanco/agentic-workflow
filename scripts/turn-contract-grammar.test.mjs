// Grammar conformance for the turn-contract receipt (AC8).
//
// The fenced `turn-contract-receipt@1` block in the canonical turn contract is
// the single grammar source (D-52-5). This test parses it, asserts the receipt
// surface is registered in AGENTS.md's normative-surfaces table, and runs the
// shared fixture matrix through BOTH engines checking every emitted line
// against the parsed grammar.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { makeContext, receiptCases, engineOnlyCases, REPO_ROOT } from "../packages/agentic-workflow/test/fixtures.mjs";

const CONTRACT = path.join(REPO_ROOT, "skills/orchestration-envelope/references/TURN_CONTRACT.md");
const GUIDE = path.join(REPO_ROOT, "AGENTS.md");
const MARKER = "turn-contract-receipt@1";

const EXPECTED_CODES = [
  "branch-default",
  "not-a-repo",
  "no-commits",
  "acceptance-missing",
  "phase-lint-failed",
  "pr-not-open",
  "pr-head-mismatch",
  "pr-unreachable",
  "dirty-tree",
  "ahead-of-remote",
];

function readBlock(text, marker) {
  const fence = /```[a-zA-Z]*\n([\s\S]*?)```/g;
  for (const m of text.matchAll(fence)) {
    const body = m[1].replace(/\n$/, "");
    const lines = body.split("\n");
    if (lines[0].trim() === marker) return lines;
  }
  return null;
}

function parseFields(lines) {
  const fields = {};
  let current = null;
  for (const raw of lines.slice(1)) {
    const m = /^([a-z-]+):\s*(.*)$/.exec(raw.trim());
    if (m) {
      current = m[1];
      fields[current] = m[2].trim();
    } else if (current) {
      fields[current] += ` ${raw.trim()}`;
    }
  }
  return fields;
}

const blockLines = readBlock(readFileSync(CONTRACT, "utf8"), MARKER);
assert.ok(blockLines, `${CONTRACT} declares a fenced ${MARKER} block`);

const fields = parseFields(blockLines);
const okLine = fields["ok-line"];
const codes = new Set(
  (fields.codes ?? "")
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean),
);
const FAIL = /^TURN-CONTRACT fail box([1-5]): ([a-z-]+)$/;

test("the declared grammar exposes the closed reason-code vocabulary", () => {
  assert.equal(okLine, "TURN-CONTRACT ok");
  assert.deepEqual([...codes].sort(), [...EXPECTED_CODES].sort());
});

test("the receipt surface is registered in the normative-surfaces table", () => {
  const guide = readFileSync(GUIDE, "utf8");
  const lines = readBlock(guide, "normative-surfaces@1");
  assert.ok(lines, "AGENTS.md declares the normative-surfaces@1 block");
  const row = lines.find((l) => l.split("|")[0].trim() === "turn-contract-receipt");
  assert.ok(row, "AGENTS.md registers the turn-contract-receipt surface");
  const cells = row.split("|").map((c) => c.trim());
  assert.equal(cells[1], "skills/orchestration-envelope/references/TURN_CONTRACT.md");
  assert.equal(cells[2], "block:turn-contract-receipt@1");
  assert.equal(cells[3], "n/a");
  assert.equal(cells[4], "no");
});

const ctx = makeContext();
test.after(() => ctx.cleanup());

function assertConforms(engineName, result, label) {
  const lines = result.stdout.split("\n").filter((l) => l !== "");
  assert.equal(lines.length, 1, `${engineName} prints exactly one line for "${label}"`);
  const line = lines[0];
  if (line === okLine) {
    assert.equal(result.code, 0, `${engineName} exits 0 on ok for "${label}"`);
    return;
  }
  const m = FAIL.exec(line);
  assert.ok(m, `${engineName} line conforms to the grammar for "${label}": ${line}`);
  assert.ok(codes.has(m[2]), `${engineName} code "${m[2]}" is in the declared vocabulary`);
  assert.equal(result.code, 1, `${engineName} exits 1 on a contract fail for "${label}"`);
}

for (const c of [...receiptCases(ctx), ...engineOnlyCases(ctx)]) {
  test(`engine output conforms: ${c.name}`, () => {
    assertConforms("engine", ctx.runEngine(c.dir, c.args ?? [], c.env ?? {}), c.name);
  });
  test(`shim output conforms: ${c.name}`, () => {
    assertConforms("shim", ctx.runShim(c.dir, c.args ?? [], c.env ?? {}), c.name);
  });
}
