/**
 * gate-receipt.test.mjs — the runner and the consumption judgment (issue #409,
 * unit docs/features/108-machine-gate-receipts/).
 *
 * The corpus was observed RED before `scripts/gate-receipt.mjs` existed. It
 * pins the failure states the contract exists for:
 *
 *  - a green gate writes an envelope plus the full log, and the envelope never
 *    inlines that log;
 *  - a red gate names the failing check with bounded fragments;
 *  - an unrecognized gate output writes a `degraded` receipt, never a silent
 *    pass;
 *  - freshness is the declared closure: an unrelated commit (a moved HEAD) and
 *    an unsigned new file leave the receipt `current`, one signed byte flips it
 *    to `stale` and names the path;
 *  - a missing or stale receipt is a `fail` for the `audit-pr` gate, routed to
 *    a re-run.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  GATE_LOG_PATH,
  GATE_RECEIPT_PATH,
  GATE_RESULT_SCHEMA,
  GATE_VERIFY_EXITS,
  assembleReceipt,
  boundedFragments,
  buildManifest,
  judgeGateReceipt,
} from "./gate-receipt.mjs";

const SCRIPT = fileURLToPath(new URL("./gate-receipt.mjs", import.meta.url));
const tmpBase = process.env.TMPDIR || os.tmpdir();
const fixtures = [];

process.on("exit", () => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

/** A throwaway project root with the files the closure signs and two it must not. */
const toyProject = (files = {}) => {
  const dir = fs.mkdtempSync(path.join(tmpBase, "gate-receipt-"));
  fixtures.push(dir);
  const base = {
    "bun.lock": "lockfile\n",
    "package.json": '{"name":"toy"}\n',
    "scripts/local-gate.mjs": "// gate\n",
    "skills/demo/SKILL.md": "# demo\n",
    "docs/ROADMAP.md": "# roadmap\n",
    "packages/demo/package.json": '{"name":"demo"}\n',
    "packages/demo/src/index.js": "export const x = 1;\n",
    "packages/demo/test/index.test.mjs": "// test\n",
    "packages/demo/dist/index.js": "// build output\n",
    "node_modules/left-pad/index.js": "// dependency\n",
    ".agentic-workflow/note.txt": "runtime state\n",
    ...files,
  };
  for (const [relative, body] of Object.entries(base)) {
    const target = path.join(dir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  return dir;
};

/**
 * A gate script the runner can execute: it speaks the declared runner contract
 * (`--json <path>` → `local-gate-result@1`) and its output is driven by the
 * `steps` payload baked into the file.
 */
const writeGate = (root, steps, { garbage = false, noise = "gate log line\n" } = {}) => {
  const gate = path.join(root, "fixture-gate.mjs");
  fs.writeFileSync(gate, garbage
    ? `#!/usr/bin/env node\nprocess.stdout.write("this gate speaks no result document\\n");\n`
    : `#!/usr/bin/env node
import fs from "node:fs";
const argv = process.argv.slice(2);
const at = argv.indexOf("--json");
const out = at === -1 ? null : argv[at + 1];
const steps = ${JSON.stringify(steps)};
for (const step of steps) {
  process.stdout.write(\`[gate] \${step.id}: \${step.status}\\n\`);
  for (const line of step.stderr_lines ?? []) process.stderr.write(\`\${line}\\n\`);
}
process.stdout.write(${JSON.stringify(noise)});
if (out) {
  const failed = steps.some((step) => step.status === "failed");
  fs.writeFileSync(out, JSON.stringify({
    schema: "${GATE_RESULT_SCHEMA}",
    status: failed ? 1 : 0,
    bail: true,
    jobs: 1,
    duration_ms: 25,
    steps: steps.map((step, index) => ({
      id: step.id,
      title: step.id,
      status: step.status,
      exit_code: step.status === "passed" ? 0 : step.status === "failed" ? 1 : null,
      duration_ms: index + 1,
      stdout_tail: \`[gate] \${step.id}: \${step.status}\\n\`,
      stderr_tail: (step.stderr_lines ?? []).join("\\n") + ((step.stderr_lines ?? []).length ? "\\n" : ""),
    })),
  }));
}
process.exit(steps.some((step) => step.status === "failed") ? 1 : 0);
`);
  return gate;
};

const run = (root, argv) =>
  spawnSync(process.execPath, [SCRIPT, ...argv], { cwd: root, encoding: "utf8" });

const receiptOf = (root) => JSON.parse(fs.readFileSync(path.join(root, GATE_RECEIPT_PATH), "utf8"));

test("gate-receipt: the manifest closure signs gate inputs and never signs build output or dependencies", async () => {
  const root = toyProject();
  const entries = await buildManifest(root);
  const paths = entries.map((entry) => entry.path);
  for (const required of ["bun.lock", "package.json", "scripts/local-gate.mjs", "skills/demo/SKILL.md", "docs/ROADMAP.md", "packages/demo/src/index.js", "packages/demo/test/index.test.mjs"]) {
    assert.ok(paths.includes(required), `closure signs ${required}`);
  }
  for (const excluded of ["packages/demo/dist/index.js", "node_modules/left-pad/index.js", ".agentic-workflow/note.txt"]) {
    assert.ok(!paths.includes(excluded), `closure does not sign ${excluded}`);
  }
  assert.deepEqual(paths, [...paths].sort(), "entries are path-ordered");
  for (const entry of entries) assert.match(entry.sha256, /^[0-9a-f]{64}$/u);
});

test("gate-receipt: fragment bounding is deterministic, ANSI-free and capped", () => {
  const noisy = [
    "\u001b[31mnot ok 1 - imports the module\u001b[0m",
    "",
    "  Error: cannot find module './missing.mjs'",
    "      at file:///tmp/x.mjs:1:1",
    "not ok 2 - second",
  ].join("\n");
  const fragments = boundedFragments(noisy);
  assert.ok(fragments.length > 0 && fragments.length <= 8);
  for (const fragment of fragments) {
    assert.ok(fragment.length <= 240, "fragment fits the declared ceiling");
    assert.doesNotMatch(fragment, /\u001b\[/u, "ANSI is stripped");
    assert.ok(fragment.trim().length > 0, "no empty fragment");
  }
  assert.ok(fragments[0].includes("imports the module"), "the check name survives");
  assert.equal(boundedFragments("   \n\n  ").length, 0);
});

test("gate-receipt: assembleReceipt marks duration and timestamp as provenance and keeps the log out", async () => {
  const root = toyProject();
  const entries = await buildManifest(root);
  const receipt = await assembleReceipt({
    root,
    entries,
    argv: ["node", "gate.mjs"],
    headSha: "a".repeat(40),
    now: "2026-11-09T12:00:00Z",
    logRef: GATE_LOG_PATH,
    exitCode: 0,
    durationMs: 10,
    result: {
      schema: GATE_RESULT_SCHEMA,
      steps: [{ id: "root-suite", status: "passed", exit_code: 0, duration_ms: 5, stdout_tail: "", stderr_tail: "" }],
    },
  });
  assert.equal(receipt.verdict, "pass");
  assert.equal(receipt.provenance.generated_at, "2026-11-09T12:00:00Z");
  assert.equal(receipt.provenance.head_sha, "a".repeat(40));
  assert.equal(receipt.gate.log_ref, GATE_LOG_PATH);
  assert.equal(receipt.checks[0].id, "root-suite");
  assert.doesNotMatch(JSON.stringify(receipt), /node_modules/u, "no file body is inlined");
});

test("gate-receipt: a green run writes the envelope and the full log", () => {
  const root = toyProject();
  const gate = writeGate(root, [{ id: "root-suite", status: "passed" }, { id: "docs", status: "passed" }]);
  const result = run(root, ["run", "--gate", gate, "--root", root]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /GATE RECEIPT — wrote/u);

  const receipt = receiptOf(root);
  assert.equal(receipt.verdict, "pass");
  assert.deepEqual(receipt.checks.map((check) => check.status), ["passed", "passed"]);
  assert.ok(fs.existsSync(path.join(root, GATE_LOG_PATH)), "the full log is on disk");
  assert.match(fs.readFileSync(path.join(root, GATE_LOG_PATH), "utf8"), /this gate speaks no result document|gate log line/u);
  assert.doesNotMatch(JSON.stringify(receipt), /gate log line/u, "the log is referenced, never inlined");
});

test("gate-receipt: a red run names the failing check with bounded fragments", () => {
  const root = toyProject();
  const stderrLines = Array.from({ length: 30 }, (_, index) => `not ok ${index} - case ${index}: expected 1, got 2`);
  const gate = writeGate(root, [
    { id: "root-suite", status: "failed", stderr_lines: stderrLines },
    { id: "docs", status: "passed" },
  ]);
  const result = run(root, ["run", "--gate", gate, "--root", root]);
  assert.equal(result.status, 1);

  const receipt = receiptOf(root);
  assert.equal(receipt.verdict, "fail");
  const failed = receipt.checks.find((check) => check.status === "failed");
  assert.equal(failed.id, "root-suite");
  assert.ok(failed.fragments.length <= 8);
  assert.ok(failed.fragments.length > 0);
  for (const fragment of failed.fragments) assert.ok(fragment.length <= 240);
});

test("gate-receipt: an unrecognized gate output is degraded, never a silent pass", () => {
  const root = toyProject();
  const gate = writeGate(root, [], { garbage: true });
  const result = run(root, ["run", "--gate", gate, "--root", root]);
  assert.notEqual(result.status, 0);

  const receipt = receiptOf(root);
  assert.equal(receipt.verdict, "degraded");
  assert.deepEqual(receipt.degraded, ["unrecognized-gate-output"]);
  assert.equal(receipt.checks.length, 1);
  assert.equal(receipt.checks[0].id, "unrecognized-gate-output");
  assert.equal(receipt.checks[0].status, "skipped");
  assert.ok(receipt.checks[0].fragments.length > 0, "the bounded raw tail is recorded");
});

test("gate-receipt: freshness ignores the HEAD sha and unsigned files, and flips on a signed byte", () => {
  const root = toyProject();
  const gate = writeGate(root, [{ id: "root-suite", status: "passed" }]);
  assert.equal(run(root, ["run", "--gate", gate, "--root", root]).status, 0);

  assert.equal(run(root, ["verify", "--root", root]).status, GATE_VERIFY_EXITS.currentPass);

  // An unrelated commit: the provenance moves, the signed bytes do not.
  const receiptPath = path.join(root, GATE_RECEIPT_PATH);
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  receipt.provenance.head_sha = "f".repeat(40);
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  assert.equal(run(root, ["verify", "--root", root]).status, GATE_VERIFY_EXITS.currentPass);

  // A new file outside the declared closure is not part of the claim.
  fs.writeFileSync(path.join(root, ".agentic-workflow/note.txt"), "changed\n");
  assert.equal(run(root, ["verify", "--root", root]).status, GATE_VERIFY_EXITS.currentPass);

  // One signed byte changes: stale, and the path is named.
  fs.writeFileSync(path.join(root, "skills/demo/SKILL.md"), "# demo, edited\n");
  const stale = run(root, ["verify", "--root", root]);
  assert.equal(stale.status, GATE_VERIFY_EXITS.stale);
  assert.match(stale.stdout, /status: stale/u);
  assert.match(stale.stdout, /skills\/demo\/SKILL\.md/u);
  assert.match(stale.stdout, /route: re-run/u);
});

test("gate-receipt: a missing or invalid receipt is a blocker, not an assumption", async () => {
  const root = toyProject();
  const missing = run(root, ["verify", "--root", root]);
  assert.equal(missing.status, GATE_VERIFY_EXITS.missing);
  assert.match(missing.stdout, /status: missing/u);

  const judgement = await judgeGateReceipt({ root });
  assert.equal(judgement.status, "missing");
  assert.equal(judgement.consumed, false);
  assert.equal(judgement.verdict, "fail");
  assert.ok(judgement.blockers.length > 0);
  assert.match(judgement.route, /gate-receipt\.mjs run/u);

  fs.mkdirSync(path.join(root, path.dirname(GATE_RECEIPT_PATH)), { recursive: true });
  fs.writeFileSync(path.join(root, GATE_RECEIPT_PATH), '{"contract":"nope"}\n');
  const invalid = run(root, ["verify", "--root", root]);
  assert.equal(invalid.status, GATE_VERIFY_EXITS.invalid);
  assert.equal((await judgeGateReceipt({ root })).status, "invalid");
});

test("gate-receipt: the audit-pr gate blocks on a missing or stale receipt", async () => {
  const { GATE_NAMES, auditVerdict, gateReceiptGate } = await import("./audit-pr-gate.mjs");
  const { renderReceiptBody } = await import("./review-receipt.mjs");
  assert.ok(GATE_NAMES.includes("gate-receipt"), "the gate joins the closed audit set");

  const root = toyProject();
  const missing = await judgeGateReceipt({ root });
  assert.equal(missing.verdict, "fail");

  // The CLI helper reads the envelope and fails closed on the missing file.
  assert.equal(gateReceiptGate({ root, receipt: null }), "fail");

  const sha = "a".repeat(40);
  const receipt = renderReceiptBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" });
  const allPass = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const blocked = auditVerdict({
    comments: [{ body: receipt }],
    headSha: sha,
    gates: { ...allPass, "gate-receipt": missing.verdict },
  });
  assert.equal(blocked.verdict, "BLOCKED");
  assert.ok(blocked.blockers.some((blocker) => blocker.includes("gate-receipt")));

  // And a current, passing envelope is what lets the same gate pass.
  const root2 = toyProject();
  const gate = writeGate(root2, [{ id: "root-suite", status: "passed" }]);
  assert.equal(run(root2, ["run", "--gate", gate, "--root", root2]).status, 0);
  assert.equal(gateReceiptGate({ root: root2 }), "pass");
});
