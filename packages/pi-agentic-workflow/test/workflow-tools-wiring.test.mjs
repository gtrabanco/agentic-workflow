// workflow-tools-wiring.test.mjs — issue #678: the host's call convention.
//
// `workflow-tools.test.mjs` drives the Pi-free seam (`spec.execute(params, cwd)`),
// which is not the seam that broke: the extension registered that spec object
// with `pi.registerTool` directly, while pi calls a tool as
// `execute(toolCallId, params, signal, onUpdate, ctx)`. The first argument — a
// string — arrived as `params`, so five of six tools threw their own
// `requireString` before spawning anything, and the sixth forwarded a non-path
// second argument as its cwd.
//
// This suite therefore calls every tool the way the host does, off the object
// the extension registers, so a future signature regression turns red here
// instead of shipping.

import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { join } from "node:path";

const PKG_ROOT = path.resolve(import.meta.dirname, "..");

/** Every scratch dir this file creates, removed when the file finishes. */
const SCRATCH = [];
function scratchDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  SCRATCH.push(dir);
  return dir;
}
after(() => {
  for (const dir of SCRATCH) fs.rmSync(dir, { recursive: true, force: true });
});

/**
 * The tools exactly as the extension registers them. The factory's
 * `toolRegistrar` seam is what the shipped adapter passes to `pi.registerTool`,
 * so a recorder here observes the same objects a host receives.
 */
async function registeredTools(workflowTools = {}) {
  const { createExtension } = await import("../dist/extension/factory.js");
  const registered = [];
  createExtension({
    registrar: { registerCommand: () => {} },
    toolRegistrar: { registerTool: (tool) => registered.push(tool) },
    surface: () => ({}),
    skillsDir: join(PKG_ROOT, "skills"),
    agentDir: path.join(os.tmpdir(), "paw-wiring-agentdir"),
    hint: { shouldShow: () => false, markShown: () => {} },
    settings: () => {},
    workflowTools,
  });
  return registered;
}

/** A valid Envelope v2 fixture (the shape the sensor suite's makeValidEnv builds). */
function makeValidEnv() {
  return {
    skill: "workflow-status",
    state: "OK",
    summary: "ready",
    unit: { type: "feature", id: "62", issue: 233, branch: "feat/62" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "abc123def456", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [],
    dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null },
    needs_input: null,
    next: { recommended: "/discover-repository-state", alternatives: [], tier: "strong" },
    detail: { repository_state: { status: "frozen", source_revision: "abc123" } },
  };
}

/** The arguments pi hands a tool, in pi's order. */
function hostCall(args, cwd) {
  const signal = new AbortController().signal;
  const ctx = { cwd, sessionManager: {}, ui: { notify: () => {} } };
  return ["call-01HX", args, signal, () => {}, ctx];
}

const ARGS_BY_TOOL = {
  agentic_workflow_status: {},
  agentic_workflow_diff_guard: { base: "HEAD" },
  agentic_workflow_phase_lint: { path: "docs/fix/678-deferred-tools-signature-bug/SPEC.md" },
  agentic_workflow_audit_pr_gate: {},
  agentic_workflow_snapshot_verify: { stage: "spec", unit: "678-deferred-tools-signature-bug" },
  agentic_workflow_run: { subcommand: "setup-env", args: ["--check"] },
};

/** The message a tool throws when `params` is not the object it expects. */
const ARGUMENT_CHECK = "is required and must be a non-empty string";

// ---------------------------------------------------------------------------
// O4 — every registered tool answers the host's 5-arg call
// ---------------------------------------------------------------------------

test("every tool runs through the host's 5-arg convention", async () => {
  const registered = await registeredTools();
  assert.equal(registered.length, 6, "the six deferred tools register");
  for (const tool of registered) {
    assert.equal(
      tool.execute.length,
      5,
      `${tool.name} must declare (toolCallId, params, signal, onUpdate, ctx), not (params, cwd)`,
    );
  }
});

test("every params-reading tool answers when the host calls it with the 5-arg convention", async () => {
  // The pre-fix failure was the argument check throwing before any spawn: a
  // correctly shaped call reached `requireString` with the toolCallId as
  // `params`. Each of the five is called here exactly as the host calls it.
  const project = scratchDir("paw-wiring-project-");
  const registered = await registeredTools({
    bin: () => "bun",
    spawnScript: () => Promise.resolve({ code: 0, stdout: "{}", stderr: "" }),
    runSensor: () => Promise.resolve({ ok: true, envelope: makeValidEnv() }),
  });
  const paramsReading = registered.filter((tool) => tool.name !== "agentic_workflow_status");
  assert.equal(paramsReading.length, 5, "five of the six tools read params");
  for (const tool of paramsReading) {
    const result = await tool.execute(...hostCall(ARGS_BY_TOOL[tool.name], project));
    assert.equal(typeof result, "object", `${tool.name} resolved instead of throwing`);
    assert.ok(
      !String(result?.text ?? "").includes(ARGUMENT_CHECK),
      `${tool.name} never answers "${ARGUMENT_CHECK}" for correctly shaped params`,
    );
  }
});

// ---------------------------------------------------------------------------
// O2 / O5 — the cwd is the one the host handed over
// ---------------------------------------------------------------------------

test("status: the host's ctx.cwd is the project the sensor samples", async () => {
  const calls = [];
  const project = scratchDir("paw-wiring-status-");
  const registered = await registeredTools({
    bin: () => "bun",
    runSensor: (cwd) => {
      calls.push(cwd);
      return Promise.resolve({ ok: true, envelope: makeValidEnv() });
    },
  });
  const status = registered.find((tool) => tool.name === "agentic_workflow_status");
  const result = await status.execute(...hostCall({}, project));
  assert.deepEqual(calls, [project], "the sensor samples the cwd the host handed over");
  assert.notEqual(calls[0], process.cwd(), "and never the process cwd as a stand-in");
  assert.equal(result.isError, undefined);
});

test("a gate tool spawns in the host's ctx.cwd", async () => {
  const requests = [];
  const project = scratchDir("paw-wiring-gate-");
  const registered = await registeredTools({
    bin: () => "bun",
    spawnScript: (request) => {
      requests.push(request);
      return Promise.resolve({ code: 0, stdout: JSON.stringify({ lines: 0, files: 0, additions: 0, deletions: 0, maxLines: 400, maxFiles: 10, breach: false, base: "HEAD" }), stderr: "" });
    },
  });
  const guard = registered.find((tool) => tool.name === "agentic_workflow_diff_guard");
  await guard.execute(...hostCall({ base: "HEAD" }, project));
  assert.equal(requests.length, 1, "the gate spawned once");
  assert.equal(requests[0].cwd, project, "the spawn cwd is the host's ctx.cwd");
});

test("agentic_workflow_run answers the issue's quoted reproducer", async () => {
  const requests = [];
  const project = scratchDir("paw-wiring-run-");
  const registered = await registeredTools({
    bin: () => "bun",
    spawnScript: (request) => {
      requests.push(request);
      return Promise.resolve({ code: 0, stdout: "setup-env: ok\n", stderr: "" });
    },
  });
  const runner = registered.find((tool) => tool.name === "agentic_workflow_run");
  const result = await runner.execute(...hostCall({ subcommand: "setup-env", args: ["--check"] }, project));
  assert.equal(requests.length, 1, "the subcommand spawned once");
  const { subcommand, stdout, stderr, exitCode } = result.structuredContent;
  assert.deepEqual(
    { subcommand, stdout, stderr, exitCode },
    { subcommand: "setup-env", stdout: "setup-env: ok\n", stderr: "", exitCode: 0 },
    "the call answers `{ subcommand, stdout, stderr, exitCode }`",
  );
  assert.ok(!String(result.text).includes(ARGUMENT_CHECK), "the argument check never fires on shaped params");
});
