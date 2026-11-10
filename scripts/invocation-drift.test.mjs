#!/usr/bin/env node

/**
 * Issue #329 — the invocation-drift gate's own suite, plus the visible-skip pin.
 *
 * The gate (`scripts/invocation-drift.mjs`) is the enforcement half of the
 * bun-before-node / rg-before-grep discipline: it fails closed on a wrong-tool
 * usage string, a skill, template or tutorial literal that teaches the fallback
 * (script or test invocation), a missing guide sentence or turn box, and a
 * missing suite carve-out. This suite proves the gate red on one fixture per rule,
 * green on a compliant toy tree, and green on this checkout (the live case is
 * the frozen-failure corpus' exit condition).
 *
 * It also pins issue #329 S8: the deleted-skill guard in
 * `scripts/pre-execution-quality.test.mjs` must be a skip the runner counts,
 * never a silent green — under `node --test` and under `bun test`.
 *
 * Fixtures live in `os.tmpdir()` and are removed after the run.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { GUIDE_LINE, TURN_BOX, scan } from "./invocation-drift.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gate = path.join(repoRoot, "scripts", "invocation-drift.mjs");
const fixtures = fs.mkdtempSync(path.join(os.tmpdir(), "invocation-drift-"));

process.on("exit", () => fs.rmSync(fixtures, { recursive: true, force: true }));

const write = (root, rel, text) => {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text);
};

// Superseded by issue #493 (S4): the suite facts name the two external bounds
// and the 10s per-test budget with the annotated allowlist.
const CARVE_OUT =
  "The suite's rule extends to the gate: `bun test scripts/<file>.test.mjs` is the per-file runner, `node --test scripts/<file>.test.mjs` is its fallback, the whole gate runs under either runtime, the CI leg `node scripts/run-root-suite.mjs` wraps every suite process in two external bounds, and the per-test budget defaults to 10s per test with `scripts/test-timeout-allowlist.json` naming the measured exceptions.";

/** A tree every rule accepts, so each case below plants exactly one defect. */
function compliantTree(name) {
  const root = path.join(fixtures, name);
  write(root, "AGENTS.md", `# Guide\n\n**Tool choice.** ${GUIDE_LINE}; both stay the documented fallback.\n\n${CARVE_OUT}\n`);
  write(root, "template/AGENTS.md", `# Guide\n\n**Shell-tool discipline.** ${GUIDE_LINE}.\n`);
  write(root, "skills/unit-lane/SKILL.md", `# Lane\n\n\`\`\`\n${TURN_BOX}\n\`\`\`\n`);
  write(root, "skills/execute-phase/SKILL.md", `# Executor\n\n\`\`\`\n${TURN_BOX}\n\`\`\`\n`);
  write(root, "scripts/good.mjs", "// usage: bun scripts/good.mjs\n");
  // The declared bootstrap pair must exist in every tree the allowlist blesses.
  write(root, "scripts/setup-env.mjs", "// usage: node scripts/setup-env.mjs [--check]\n");
  write(root, "scripts/update-tools.mjs", "// usage: node scripts/update-tools.mjs [--dry-run]\n");
  write(root, "skills/execute-phase/references/PREFLIGHT.md", "run `bun scripts/phase-lint.mjs` (node fallback\n`node scripts/phase-lint.mjs`)\n");
  // The tutorial's instruction pages are gated too; the compliant tree carries
  // one in the bun form plus the two declared exemptions (the bootstrap pair in
  // prose, and the frozen-receipts document).
  write(root, "docs/workflow/FEATURE_WORKFLOW.md", "Invoke `bun scripts/unit-route.mjs --triage <NN>` to get the steps.\n");
  write(root, "docs/workflow/SETUP.md", "node scripts/setup-env.mjs --check    # verify only\nnode scripts/update-tools.mjs --dry-run\n");
  write(root, "docs/workflow/REPOSITORY_STATE.md", "| F005 | receipt | `node scripts/check-skill-context.mjs` | frozen |\n");
  return root;
}

function runGate(root) {
  const result = spawnSync(process.execPath, [gate, "--root", root], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const violationIds = (root) => scan(root).violations.map((row) => row.id);

test("a compliant tree passes with no violations (S1, S2, S3, S10)", () => {
  const root = compliantTree("compliant");
  const result = runGate(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /^verdict: PASS$/m);
  assert.doesNotMatch(result.stdout, /^violation:/m);
  assert.equal(scan(root).allowed.length, 2, "both bootstrap literals are declared, not silently ignored");
});

test("a planted wrong-tool usage string is the mechanical pin the sweep must satisfy (S3, S6)", () => {
  const root = compliantTree("usage-node");
  write(root, "scripts/rogue.mjs", "export const USAGE = 'usage: node scripts/rogue.mjs';\n");
  const result = runGate(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^violation: usage-node \| scripts\/rogue\.mjs:1 \|/m);
});

test("the bootstrap pair's node literal stays legal, and a vanished bootstrap script fails closed", () => {
  const root = compliantTree("bootstrap");
  const ids = violationIds(root);
  assert.ok(!ids.includes("usage-node"), "setup-env/update-tools are declared, not drifted");
  fs.rmSync(path.join(root, "scripts", "setup-env.mjs"));
  assert.ok(violationIds(root).includes("bootstrap-allowlist"), "a stale allowlist row is a defect");
});

test("a skill literal teaches the fallback unless the fallback is declared beside it (S3, S4)", () => {
  const root = compliantTree("skill-literal");
  write(root, "skills/fold-findings/SKILL.md", "Run `node scripts/review-state.mjs check` and paste it.\n");
  const violation = scan(root).violations.find((row) => row.id === "node-command-literal");
  assert.ok(violation, "an undeclared node literal is a violation");
  assert.equal(violation.location, "skills/fold-findings/SKILL.md:1");

  const legal = compliantTree("skill-fallback");
  write(legal, "skills/fold-findings/SKILL.md", "Run `bun scripts/review-state.mjs check` (node fallback\n`node scripts/review-state.mjs check`).\n");
  assert.ok(!violationIds(legal).includes("node-command-literal"), "the declared fallback window is legal");
});

test("test invocations are bun-first too, in skills and in the scaffold templates (S11)", () => {
  const root = compliantTree("test-literal");
  write(root, "skills/fold-findings/SKILL.md", "Validate with `node --test scripts/fold-findings.test.mjs` and paste it.\n");
  const violation = scan(root).violations.find((row) => row.id === "node-command-literal");
  assert.ok(violation, "an undeclared node --test literal is a violation");
  assert.match(violation.location, /^skills\/fold-findings\/SKILL\.md:1$/);

  const template = compliantTree("template-literal");
  write(template, "template/docs/fix/_TEMPLATE/SPEC.md", "(validator: `node --test scripts/x.test.mjs` exits 0)\n");
  assert.ok(violationIds(template).includes("node-command-literal"), "the scaffold's validator example is the nearest literal a planner copies");

  const legal = compliantTree("test-fallback");
  write(legal, "skills/fold-findings/SKILL.md", "Validate with `bun test scripts/fold-findings.test.mjs` (node fallback\n`node --test scripts/fold-findings.test.mjs`).\n");
  assert.ok(!violationIds(legal).includes("node-command-literal"), "the declared test fallback is legal");
});

test("the tutorial's instruction pages are gated with the same fallback window (S3, S9)", () => {
  const root = compliantTree("docs-literal");
  write(root, "docs/workflow/LANE_FLOW.md", "Consume it with the dispatcher:\n\n```\nnode scripts/needs-input.mjs <unit-dir> [--json]\n```\n");
  const violation = scan(root).violations.find((row) => row.id === "node-command-literal");
  assert.ok(violation, "a tutorial page teaching node is the nearest literal the next session copies");
  assert.equal(violation.location, "docs/workflow/LANE_FLOW.md:4");

  const legal = compliantTree("docs-fallback");
  write(legal, "docs/workflow/LANE_FLOW.md", "run `bun scripts/needs-input.mjs <unit-dir>` (node fallback\n`node scripts/needs-input.mjs <unit-dir>` when bun is absent).\n");
  assert.ok(!violationIds(legal).includes("node-command-literal"), "the declared fallback window is legal in prose too");

  const bootstrap = compliantTree("docs-bootstrap");
  write(bootstrap, "docs/workflow/SETUP.md", "node scripts/setup-env.mjs --check    # verify only\n");
  assert.ok(!violationIds(bootstrap).includes("node-command-literal"), "the declared bootstrap pair stays legal in prose (D1)");

  const frozen = compliantTree("docs-frozen-receipts");
  write(frozen, "docs/workflow/REPOSITORY_STATE.md", "| F004 | receipt | `node scripts/check-skill-context.mjs` | frozen |\n| F005 | receipt | `node --test scripts/a.test.mjs` | frozen |\n");
  assert.ok(!violationIds(frozen).includes("node-command-literal"), "frozen receipts are evidence of what ran, never instructions");
});

test("a line-wrapped node literal is still caught (the drift's own shape)", () => {
  const root = compliantTree("wrapped");
  write(root, "skills/unit-lane/SKILL.md", "# Lane\n\nrun `node\nscripts/needs-input.mjs <unit-dir>`\n");
  assert.ok(violationIds(root).includes("node-command-literal"), "wrapping does not launder the literal");
});

test("the guide sentence is required in both guides (S1)", () => {
  const root = compliantTree("guide-line");
  write(root, "template/AGENTS.md", "# Guide\n\nTool choice is documented elsewhere.\n");
  const result = runGate(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^violation: guide-line \| template\/AGENTS\.md \|/m);
});

test("the per-turn box is required in both executor skills (S2)", () => {
  const root = compliantTree("turn-box");
  write(root, "skills/execute-phase/SKILL.md", "# Executor\n\nNo checklist here.\n");
  const result = runGate(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^violation: turn-box \| skills\/execute-phase\/SKILL\.md \|/m);
});

test("the suite carve-out is part of the surface, not advice (S10)", () => {
  const root = compliantTree("carve-out");
  write(root, "AGENTS.md", `# Guide\n\n**Tool choice.** ${GUIDE_LINE}.\n`);
  assert.ok(violationIds(root).includes("suite-carve-out"));
});

test("an unknown argument is a usage error, never a silent pass", () => {
  const result = spawnSync(process.execPath, [gate, "--nope"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: bun scripts\/invocation-drift\.mjs/);
});

test("this checkout is drift-free (the frozen-failure corpus' exit condition)", () => {
  const result = runGate(repoRoot);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /^verdict: PASS$/m);
  assert.match(result.stdout, /tutorial docs/, "the tutorial scope is part of the checked surface");
});

test("the deleted-skill guard is a visible skip under node --test and bun test (S8)", (t) => {
  const file = path.join(repoRoot, "scripts", "pre-execution-quality.test.mjs");

  // The root suite already runs under `node --test`; a nested run needs the
  // parent's test context cleared or node refuses to execute the child file.
  // `process.execPath` is bun when this suite runs under `bun test`, and the
  // node leg must stay the node binary the convention names.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const nodeBin = /(?:^|[\\/])bun(?:\.exe)?$/.test(process.execPath) ? "node" : process.execPath;
  const node = spawnSync(nodeBin, ["--test", file], { cwd: repoRoot, encoding: "utf8", env });
  assert.equal(node.status, 0, node.stdout + node.stderr);
  assert.match(`${node.stdout}\n${node.stderr}`, /skipped 1/, "the runner must count the skip, not report a bare green");

  const bunVersion = spawnSync("bun", ["--version"], { encoding: "utf8" });
  if (bunVersion.status !== 0) {
    t.skip("bun is not installed — the node leg above is asserted, the bun leg cannot run here");
    return;
  }
  const bun = spawnSync("bun", ["test", file], { cwd: repoRoot, encoding: "utf8", env });
  assert.equal(bun.status, 0, bun.stdout + bun.stderr);
  assert.match(`${bun.stdout}\n${bun.stderr}`, /1 skip/, "bun must report the skip instead of a false green");
  assert.match(`${bun.stdout}\n${bun.stderr}`, /0 fail/);
});
