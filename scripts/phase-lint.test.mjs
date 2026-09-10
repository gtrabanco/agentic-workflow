#!/usr/bin/env node
/**
 * Corpus for `scripts/phase-lint.mjs` — the behavioural contract of the
 * phase-lint tool. Fixtures are embedded strings written to a temporary
 * directory at run time: no network, no committed fixtures directory.
 *
 * Every assertion is at the CLI boundary (exit code + stdout block), because
 * that is the contract the three consumer skills paste.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const LINTER = fileURLToPath(new URL("./phase-lint.mjs", import.meta.url));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "phase-lint-corpus-"));

/** Write one fixture and return its path. */
function fixture(name, content) {
  const file = path.join(TMP, name);
  fs.writeFileSync(file, content);
  return file;
}

/** Run the linter with a given runtime; returns { status, stdout, stderr }. */
function run(runtime, ...args) {
  const result = spawnSync(runtime, [LINTER, ...args], { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") return null;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const bunAvailable = spawnSync("bun", ["--version"], { encoding: "utf8" }).status === 0;

function nodeRun(...args) {
  const result = run(process.execPath, ...args);
  assert.ok(result, "node must run the linter");
  return result;
}

const VALID_PLAN = `# Valid plan

### P1 — Add the tokenizer

Layer: config/infra. Done-when: \`node --test scripts/tokenizer.test.mjs\` → exit 0.

- [ ] Create \`scripts/tokenizer.mjs\` with the tokenizer
- [ ] Add unit tests in \`scripts/tokenizer.test.mjs\`

### P2 — Document the tokenizer

Layer: docs. Done-when: \`grep -n "tokenizer" docs/tokenizer.md\` → matches.

- [ ] Create \`docs/tokenizer.md\` describing the interface
`;

const INVALID_PLAN = `# Invalid plan

### P1 — Tokenizer + CLI

Layer: config/infra. Done-when: \`node --test scripts/tokenizer.test.mjs\` → exit 0.

- [ ] Create \`scripts/tokenizer.mjs\` → parse input → emit tokens
- [ ] Decide whether to add \`scripts/cli.mjs\` or keep the parser only
`;

const AMBIGUOUS_LAYER_PLAN = `# Ambiguous layer

### P1 — Do the thing

Done-when: \`node --test scripts/thing.test.mjs\` → exit 0.

- [ ] Create \`scripts/thing.mjs\`
`;

const NO_PHASES_PLAN = `# A plan without phases

Some prose and nothing else.
`;

const THRESHOLD_PLAN = `# Threshold plan

### P1 — Too many tasks

Layer: config/infra. Done-when: \`node --test scripts/a.test.mjs\` → exit 0.

${Array.from({ length: 9 }, (_, i) => `- [ ] Create \`scripts/t${i + 1}.mjs\``).join("\n")}
`;

const ENUMERATED_CASES_PLAN = `# Enumerated cases

### P1 — Handle the input modes

Layer: config/infra. Done-when: \`node --test scripts/modes.test.mjs\` → exit 0.

- [ ] Create \`scripts/modes.mjs\` covering (1) stdin, (2) file, (3) dir, (4) url
`;

const FINGERPRINT_LINE = /^fingerprint: [a-f0-9]{64}$/m;

test("a valid plan exits 0 with one PASS line per phase and a fingerprint line", () => {
  const file = fixture("valid.md", VALID_PLAN);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 0);
  assert.match(stdout, /^P1 Phase-lint: PASS \(8\/8\) · fingerprint P1:config\/infra:2:add-tokenizer$/m);
  assert.match(stdout, /^P2 Phase-lint: PASS \(8\/8\) · fingerprint P2:docs:1:document-tokenizer$/m);
  assert.match(stdout, /^verdict PASS$/m);
  assert.match(stdout, FINGERPRINT_LINE);
});

test("an invalid plan exits 1, reports every failing rule, and blocks at the first", () => {
  const file = fixture("invalid.md", INVALID_PLAN);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 1);
  assert.match(stdout, /^P1 box-1: /m);
  assert.match(stdout, /^P1 box-4: /m);
  assert.match(stdout, /^P1 box-5: /m);
  assert.match(stdout, /^P1 Phase-lint: BLOCKED — box 1: /m);
  assert.match(stdout, /^verdict BLOCKED: lint-blocked$/m);
  assert.match(stdout, FINGERPRINT_LINE);
});

test("more than three enumerated cases fails box 4", () => {
  const file = fixture("enumerated.md", ENUMERATED_CASES_PLAN);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 1);
  assert.match(stdout, /^P1 box-4: /m);
  assert.match(stdout, /^P1 Phase-lint: BLOCKED — box 4: /m);
});

test("a phase with more than eight tasks fails box 3", () => {
  const file = fixture("threshold.md", THRESHOLD_PLAN);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 1);
  assert.match(stdout, /^P1 box-3: /m);
  assert.match(stdout, /^P1 Phase-lint: BLOCKED — box 3: /m);
});

test("a P<n> phase without a Layer line is unparseable", () => {
  const file = fixture("ambiguous-layer.md", AMBIGUOUS_LAYER_PLAN);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 1);
  assert.match(stdout, /^verdict BLOCKED: unparseable$/m);
});

test("a parsed plan with zero phase headings answers no-phases", () => {
  const file = fixture("no-phases.md", NO_PHASES_PLAN);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 1);
  assert.match(stdout, /^verdict BLOCKED: no-phases$/m);
});

test("a nonexistent file and a missing argument both answer missing-plan", () => {
  const missing = nodeRun(path.join(TMP, "does-not-exist.md"));
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /^verdict BLOCKED: missing-plan$/m);

  const noArg = nodeRun();
  assert.equal(noArg.status, 1);
  assert.match(noArg.stdout, /^verdict BLOCKED: missing-plan$/m);
});

test("an unreadable file is unparseable (permission denied)", () => {
  const file = fixture("unreadable.md", VALID_PLAN);
  fs.chmodSync(file, 0o000);
  try {
    const { status, stdout } = nodeRun(file);
    assert.equal(status, 1);
    assert.match(stdout, /^verdict BLOCKED: unparseable$/m);
  } finally {
    fs.chmodSync(file, 0o644);
  }
});

test("an oversized plan is read whole and keeps its content verdict", () => {
  const filler = `${"filler ".repeat(40)}\n`.repeat(12_000); // ~1.2 MB
  const padded = fixture("oversized.md", `${VALID_PLAN}\n${filler}`);
  const plain = fixture("oversized-plain.md", VALID_PLAN);
  const big = nodeRun(padded);
  const small = nodeRun(plain);
  assert.equal(big.status, 0);
  assert.equal(big.stdout, small.stdout);
});

test("a Done-when split across a paragraph is read whole", () => {
  const plan = `# Multiline done-when

### P1 — Wrap the long command

Layer: docs · Done-when: \`grep -n "phase-lint"\nskills/example/SKILL.md\` -> matches in the file.

- [ ] Create \`docs/example.md\` describing the wrap
`;
  const file = fixture("multiline-done.md", plan);
  const { status, stdout } = nodeRun(file);
  assert.equal(status, 0);
  assert.match(stdout, /^P1 Phase-lint: PASS \(8\/8\) · fingerprint P1:docs:1:wrap-long-command$/m);
});

test("two consecutive runs are byte-identical (determinism)", () => {
  const file = fixture("determinism.md", INVALID_PLAN);
  const first = nodeRun(file);
  const second = nodeRun(file);
  assert.equal(first.status, second.status);
  assert.equal(first.stdout, second.stdout);
});

test("concurrent runs on the same plan agree byte for byte", () => {
  const file = fixture("concurrent.md", VALID_PLAN);
  const runs = [nodeRun(file), nodeRun(file), nodeRun(file)];
  for (const one of runs) {
    assert.equal(one.status, runs[0].status);
    assert.equal(one.stdout, runs[0].stdout);
  }
});

test("the node fallback matches the bun first-class run", { skip: bunAvailable ? false : "bun not installed" }, () => {
  const file = fixture("parity.md", VALID_PLAN);
  const bun = run("bun", file);
  const node = nodeRun(file);
  assert.equal(bun.status, node.status);
  assert.equal(bun.stdout, node.stdout);
});
