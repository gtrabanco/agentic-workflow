// runner-citation.test.mjs — the shell form becomes one lesson, not one 127
// (issue #696, AC6).
//
// The mapping's delivery (the injected block) is the primary path; this suite is
// the second-best path. A session that skimmed both the skill and the block still
// reaches bash with `runner <subcommand>`, which cannot work: no `runner`
// executable exists to call. The `tool_call` seam therefore refuses the shell
// form and states the same canon block the bundle carries, naming the subcommand
// the session tried — one failure becomes one lesson, deterministically.
//
// The classifier is pure and separate from the seam, so the cases below split in
// two: the classifier's own decisions (head, arguments, boundaries), and the
// shipped handler's wiring, driven through the real `tool_call` handler because a
// classifier nothing calls is a decoy.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const PKG_DIR = resolve(import.meta.dirname, "..");
const RUNNER_MD = resolve(PKG_DIR, "..", "..", "skills", "runner-contract", "references", "RUNNER.md");

const guard = () => import("../dist/guards/runner-citation.js");

/** The canon block's own text, read from the owner file — never re-typed here. */
function ownerMapping() {
  const text = readFileSync(RUNNER_MD, "utf8");
  const at = text.indexOf("```text\nrunner-mapping@1\n");
  assert.ok(at > 0, "RUNNER.md publishes the mapping block");
  const end = text.indexOf("\n```", at + 8);
  return text.slice(at, end + 4);
}

test("C1 — the classifier reads a runner head and preserves its arguments", async () => {
  const { parseRunnerCitation } = await guard();
  assert.deepEqual(parseRunnerCitation("runner batch-scheduler"), { subcommand: "batch-scheduler", args: [] });
  assert.deepEqual(parseRunnerCitation("runner batch-scheduler --json --root /tmp/x"), {
    subcommand: "batch-scheduler",
    args: ["--json", "--root", "/tmp/x"],
  });
  assert.deepEqual(parseRunnerCitation("cd /tmp && runner workflow-status"), { subcommand: "workflow-status", args: [] }, "any segment, not only the first");
  assert.deepEqual(parseRunnerCitation("FOO=1 runner needs-input docs/fix/x"), { subcommand: "needs-input", args: ["docs/fix/x"] }, "an assignment prefix is not the head");
  assert.deepEqual(parseRunnerCitation("runner"), { subcommand: null, args: [] }, "a bare runner is still not a shell command");
});

test("C2 — the refusal names the subcommand and states the canon block", async () => {
  const { parseRunnerCitation, runnerCitationRefusal } = await guard();
  const mapping = ownerMapping();
  const refusal = runnerCitationRefusal(parseRunnerCitation("runner batch-scheduler --json"), mapping);
  assert.match(refusal, /`runner batch-scheduler --json`/u, "it quotes the command it refused");
  assert.match(refusal, /batch-scheduler/u, "it names the subcommand");
  assert.match(refusal, /agentic_workflow_run/u, "it names the tool");
  assert.match(refusal, /tool_search/u, "it names the discovery path");
  assert.ok(refusal.includes(mapping), "it states the canon block, byte for byte");

  // A missing owner text still refuses, pointing at the contract instead of
  // pretending the mapping is unknown: the shell form can never work.
  const fallback = runnerCitationRefusal(parseRunnerCitation("runner workflow-status"), null);
  assert.match(fallback, /agentic_workflow_run/u);
  assert.match(fallback, /RUNNER\.md/u);
});

test("C3 — non-runner and path-qualified commands are untouched", async () => {
  const { parseRunnerCitation } = await guard();
  for (const command of [
    "ls -la",
    "git status --porcelain",
    "rg -n 'runner' skills",
    "bun scripts/batch-scheduler.mjs --json",
    "bunx @gtrabanco/agentic-workflow batch-scheduler",
    "./runner workflow-status",
    "/usr/local/bin/runner workflow-status",
    "echo 'runner workflow-status'",
  ]) {
    assert.equal(parseRunnerCitation(command), null, `${command} is not a symbolic citation`);
  }
});

/* ── the shipped handler ─────────────────────────────────────────────── */

function piDouble() {
  const handlers = new Map();
  return {
    handlers,
    api: {
      registerCommand: () => {},
      sendUserMessage: () => {},
      setModel: async () => true,
      getThinkingLevel: () => "medium",
      setThinkingLevel: () => {},
      on: (type, handler) => handlers.set(type, handler),
    },
  };
}

function context(cwd) {
  return {
    cwd,
    model: { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => true,
    isProjectTrusted: () => true,
    hasUI: false,
    ui: { notify: () => {}, select: () => undefined, input: () => undefined, confirm: () => false },
    modelRegistry: { find: () => undefined, hasConfiguredAuth: () => false, getAll: () => [] },
  };
}

async function shippedEntry(project) {
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  const previousPath = process.env.PATH;
  process.env.PI_CODING_AGENT_DIR = project.agentDir;
  process.env.PATH = project.bin;
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    const double = piDouble();
    extension(double.api);
    return double;
  } finally {
    if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    process.env.PATH = previousPath;
  }
}

function scratch(name) {
  const root = mkdtempSync(join(tmpdir(), `paw-runner-citation-${name}-`));
  const cwd = join(root, "repo");
  const agentDir = join(root, "agent");
  const bin = join(root, "bin");
  for (const dir of [cwd, agentDir, bin, join(cwd, ".pi")]) mkdirSync(dir, { recursive: true });
  for (const tool of ["rg", "bun"]) {
    writeFileSync(join(bin, tool), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  }
  return { root, cwd, agentDir, bin };
}

test("C4 — the shipped handler refuses the shell form before anything runs", async () => {
  const project = scratch("seam");
  try {
    const entry = await shippedEntry(project);
    const mapping = ownerMapping();
    const call = { toolName: "bash", input: { command: "runner batch-scheduler --json" } };
    const blocked = await entry.handlers.get("tool_call")(call, context(project.cwd));
    assert.equal(blocked.block, true, "the shell form is refused");
    assert.match(blocked.reason, /batch-scheduler/u);
    assert.ok(blocked.reason.includes(mapping), "the refusal carries the canon block the bundle carries");
    assert.equal(call.input.command, "runner batch-scheduler --json", "a refusal never mutates the call it refused");

    const allowed = await entry.handlers.get("tool_call")({ toolName: "bash", input: { command: "ls -la" } }, context(project.cwd));
    assert.equal(allowed?.block ?? false, false, "an ordinary command passes");

    const pathQualified = await entry.handlers.get("tool_call")({ toolName: "bash", input: { command: "./runner x" } }, context(project.cwd));
    assert.equal(pathQualified?.block ?? false, false, "a path-qualified binary is a real command, never the citation");

    const readTool = await entry.handlers.get("tool_call")({ toolName: "read", input: { path: "runner" } }, context(project.cwd));
    assert.equal(readTool?.block ?? false, false, "a non-bash tool is never judged here");
  } finally {
    rmSync(project.root, { recursive: true, force: true });
  }
});
