// tool-choice-guard.test.mjs — the command-time carrier (issue #610).
//
// Two layers of certainty, in the order they can rot:
//
//   * the decision module (`dist/guards/tool-choice.js`), driven with injected
//     availability and config — every posture, both directions, no session;
//   * the shipped entry (`dist/extension/index.js`), driven through the real
//     `tool_call` handler, because a carrier nothing calls is a decoy. The
//     availability answer is controlled by pointing `PATH` at a scratch bin
//     directory holding stubs, so the same case proves "preferred tool present →
//     enforced" and "preferred tool absent → stood down" on any machine.
//
// Cases are named `F<n>` so the unit doc's obligation rows cite them.

import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { enforceToolChoice } from "../dist/guards/tool-choice.js";
import { DEFAULT_TOOL_CHOICE } from "../dist/config/types.js";

const BOTH = { rg: true, bun: true };
const NONE = { rg: false, bun: false };
const BLOCK = { ...DEFAULT_TOOL_CHOICE };

/* ── the decision module ─────────────────────────────────────────────── */

test("F20 — a grep-as-search command is blocked and the reason names the rg equivalent", () => {
  const decision = enforceToolChoice("grep -n 'x' file", { config: BLOCK, availability: BOTH });
  assert.equal(decision.block, true);
  assert.match(decision.reason, /rg -n 'x' file/);
  assert.match(decision.reason, /AGENTS\.md/);
  assert.equal(decision.command, undefined, "a block never carries a rewritten command");
});

test("F21 — a node-as-default command is blocked with the bun equivalent, and several violations are summarised", () => {
  const single = enforceToolChoice("node -e 'console.log(1)'", { config: BLOCK, availability: BOTH });
  assert.equal(single.block, true);
  assert.match(single.reason, /bun -e 'console\.log\(1\)'/);
  const several = enforceToolChoice("node -p '1' && grep -n x file", { config: BLOCK, availability: BOTH });
  assert.equal(several.block, true);
  assert.match(several.reason, /1 more in this command/);
});

test("F22 — sanctioned forms and filters pass untouched in block mode", () => {
  const commands = [
    "node --test scripts/x.test.mjs",
    "node scripts/run-root-suite.mjs --jobs 1",
    "node scripts/setup-env.mjs --check",
    "rg -l foo . | grep -v bar",
    "ls -la && git status --porcelain",
  ];
  for (const command of commands) {
    assert.deepEqual(enforceToolChoice(command, { config: BLOCK, availability: BOTH }), { block: false }, command);
  }
});

test("F23 — rewrite mode forwards when the translation is exact and blocks when it is not", () => {
  const rewritten = enforceToolChoice("cd /repo && grep -rn 'x' scripts/ | head -5", {
    config: { enabled: true, mode: "rewrite" },
    availability: BOTH,
  });
  assert.equal(rewritten.block, false);
  assert.equal(rewritten.command, "cd /repo && rg -n 'x' scripts/ | head -5");
  const nodeRewrite = enforceToolChoice("node -p '1'", { config: { enabled: true, mode: "rewrite" }, availability: BOTH });
  assert.equal(nodeRewrite.command, "bun -p '1'");
  const refused = enforceToolChoice("grep --exclude-from=list -n x .", {
    config: { enabled: true, mode: "rewrite" },
    availability: BOTH,
  });
  assert.equal(refused.block, true, "an inexact translation is never run as a different command");
  assert.match(refused.reason, /adjust/i);
});

test("F24 — a missing preferred tool stands the carrier down for that class only", () => {
  assert.deepEqual(enforceToolChoice("grep -n 'x' file", { config: BLOCK, availability: { rg: false, bun: true } }), {
    block: false,
  });
  assert.equal(enforceToolChoice("node -e '1'", { config: BLOCK, availability: { rg: false, bun: true } }).block, true);
  assert.equal(enforceToolChoice("node -e '1'", { config: BLOCK, availability: { rg: true, bun: false } }).block, false);
  assert.equal(enforceToolChoice("grep -n 'x' file", { config: BLOCK, availability: { rg: true, bun: false } }).block, true);
  assert.deepEqual(enforceToolChoice("grep -n 'x' file && node -e '1'", { config: BLOCK, availability: NONE }), {
    block: false,
  });
});

test("F25 — a disabled carrier, and a command that is not a command, pass untouched", () => {
  const disabled = { enabled: false, mode: "block" };
  assert.deepEqual(enforceToolChoice("grep -n 'x' file", { config: disabled, availability: BOTH }), { block: false });
  assert.deepEqual(enforceToolChoice("", { config: BLOCK, availability: BOTH }), { block: false });
  assert.deepEqual(enforceToolChoice("grep -n 'unterminated", { config: BLOCK, availability: BOTH }), { block: false });
  assert.deepEqual(enforceToolChoice("grep -n 'x' file", { availability: BOTH }), enforceToolChoice("grep -n 'x' file", { config: DEFAULT_TOOL_CHOICE, availability: BOTH }), "an absent config means the shipped default");
});

/* ── the shipped entry ───────────────────────────────────────────────── */

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

/** A scratch project: a cwd, an isolated agent dir and a `PATH` we control. */
function scratch(name, { tools = ["rg", "bun"], config } = {}) {
  const root = mkdtempSync(join(tmpdir(), `paw-tool-choice-${name}-`));
  const cwd = join(root, "repo");
  const agentDir = join(root, "agent");
  const bin = join(root, "bin");
  for (const dir of [cwd, agentDir, bin, join(cwd, ".pi")]) mkdirSync(dir, { recursive: true });
  for (const tool of tools) {
    const stub = join(bin, tool);
    writeFileSync(stub, "#!/bin/sh\nexit 0\n");
    chmodSync(stub, 0o755);
  }
  if (config !== undefined) writeFileSync(join(cwd, ".pi", "pi-agentic-workflow.json"), JSON.stringify(config));
  return { root, cwd, agentDir, bin };
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

/**
 * Call the shipped handler with the project's own `PATH` in place, since the
 * availability answer is resolved on first use (the doctor's resolver, never a
 * second probe).
 */
async function callInProcess(project, entry, event) {
  const previousPath = process.env.PATH;
  process.env.PATH = project.bin;
  try {
    return await entry.handlers.get("tool_call")(event, context(project.cwd));
  } finally {
    process.env.PATH = previousPath;
  }
}

test("F26 — the shipped handler refuses a default-tool command and leaves sanctioned forms alone", async () => {
  const project = scratch("block");
  try {
    const entry = await shippedEntry(project);
    const grepCall = { toolName: "bash", input: { command: "grep -n 'x' README.md" } };
    const blocked = await callInProcess(project, entry, grepCall);
    assert.equal(blocked.block, true);
    assert.match(blocked.reason, /rg -n 'x' README.md/);
    assert.equal(grepCall.input.command, "grep -n 'x' README.md", "a block never mutates the call it refused");

    const node = await callInProcess(project, entry, { toolName: "bash", input: { command: "node -e '1'" } });
    assert.equal(node.block, true);
    assert.match(node.reason, /bun -e '1'/);

    const sanctioned = await callInProcess(project, entry, { toolName: "bash", input: { command: "node --test scripts/x.test.mjs" } });
    assert.equal(sanctioned?.block ?? false, false);
    const read = await callInProcess(project, entry, { toolName: "read", input: { path: "README.md" } });
    assert.equal(read?.block ?? false, false, "a non-bash tool is never judged by the carrier");
  } finally {
    rmSync(project.root, { recursive: true, force: true });
  }
});

test("F27 — the shipped handler rewrites in place when the posture says rewrite", async () => {
  const project = scratch("rewrite", { config: { toolChoice: { mode: "rewrite" } } });
  try {
    const entry = await shippedEntry(project);
    const call = { toolName: "bash", input: { command: "grep -rn 'x' scripts/ | head -3" } };
    const decision = await callInProcess(project, entry, call);
    assert.equal(decision?.block ?? false, false);
    assert.equal(call.input.command, "rg -n 'x' scripts/ | head -3");
  } finally {
    rmSync(project.root, { recursive: true, force: true });
  }
});

test("F28 — the shipped handler stands down when the preferred tool is absent or the key is off", async () => {
  const absent = scratch("absent", { tools: [] });
  const off = scratch("off", { config: { toolChoice: { enabled: false } } });
  try {
    for (const project of [absent, off]) {
      const entry = await shippedEntry(project);
      const call = { toolName: "bash", input: { command: "grep -n 'x' README.md" } };
      const decision = await callInProcess(project, entry, call);
      assert.equal(decision?.block ?? false, false, project.cwd);
      assert.equal(call.input.command, "grep -n 'x' README.md");
    }
  } finally {
    rmSync(absent.root, { recursive: true, force: true });
    rmSync(off.root, { recursive: true, force: true });
  }
});
