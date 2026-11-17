// shell-write-guard.test.mjs — issue #567, the shell write surface (AC1/AC2/AC5).
//
// Red-first: this suite lands alone and fails while `guards/shell-path.ts` and
// its handler wiring do not exist. Two layers, both pure-or-shipped:
//
//   * the module — `analyzeShellWrite` (what the command text statically
//     exposes) and `decideShellWrite` (containment, the temp carve-out, the
//     approval/headless posture, injected Tier 2) with injected deps, no Pi;
//   * the shipped handler — the same `shippedEntry` harness
//     `path-protection.test.mjs` uses, driving the real
//     `dist/extension/index.js` so the bypass itself (bash out-of-root writes
//     running where `edit` is refused) is pinned end-to-end.
//
// Nothing here writes outside a temp dir: every "write" is a command string
// the guard must judge before execution.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { analyzeShellWrite, decideShellWrite, isScratchPath } from "../dist/guards/shell-path.js";

/* ── pure deps for decideShellWrite ────────────────────────────────────── */

const CWD = "/work/repo";
const REAL_ROOT = "/work/repo";
const TEMP_ROOTS = ["/tmp", "/var/tmp"];

function deps(overrides = {}) {
  return {
    cwd: CWD,
    realRoot: REAL_ROOT,
    tempRoots: TEMP_ROOTS,
    homedir: "/home/person",
    resolveTarget: (abs) => ({ ok: true, real: abs }),
    exists: () => false,
    readFile: () => null,
    interactive: false,
    confirm: () => undefined,
    ...overrides,
  };
}

const verdict = (command, overrides = {}) => decideShellWrite(command, deps(overrides));

/* ── analyzeShellWrite: what is statically visible ─────────────────────── */

test("an output redirect exposes its operand as a write target", () => {
  const analysis = analyzeShellWrite("echo hi > notes.txt", { cwd: CWD, homedir: "/home/person" });
  assert.equal(analysis.writeShaped, true);
  assert.deepEqual(analysis.targets, ["notes.txt"]);
  assert.equal(analysis.dynamic, false);
});

test("appends, quoted operands and compound segments are all visible", () => {
  const analysis = analyzeShellWrite("echo a >> 'out one.txt' && true", { cwd: CWD, homedir: "/home/person" });
  assert.deepEqual(analysis.targets, ["out one.txt"]);
});

test("cp/mv/tee/mkdir/touch destinations are visible; sources are not", () => {
  const cases = [
    ["cp src.txt /dest/out.txt", ["/dest/out.txt"]],
    ["mv build/report.json ./final/report.json", ["./final/report.json"]],
    ["echo x | tee /pipe/out.txt", ["/pipe/out.txt"]],
    ["mkdir -p ~/.config/aw-fixture", ["/home/person/.config/aw-fixture"]],
    ["touch notes.txt", ["notes.txt"]],
  ];
  for (const [command, expected] of cases) {
    const analysis = analyzeShellWrite(command, { cwd: CWD, homedir: "/home/person" });
    assert.deepEqual(analysis.targets, expected, command);
    assert.equal(analysis.writeShaped, true, command);
  }
});

test("inline writeFile literals are visible (node -e / bun -e forms)", () => {
  const analysis = analyzeShellWrite(
    `node -e "require('fs').writeFileSync('/opt/durable/target.md', 'x')"`,
    { cwd: CWD, homedir: "/home/person" },
  );
  assert.deepEqual(analysis.targets, ["/opt/durable/target.md"]);
  assert.equal(analysis.writeShaped, true);
});

test("a read-only command is not write-shaped at all", () => {
  for (const command of ["ls -la", "git status", "rg -n 'pattern' src/", "cat notes.txt | head -5"]) {
    const analysis = analyzeShellWrite(command, { cwd: CWD, homedir: "/home/person" });
    assert.equal(analysis.writeShaped, false, command);
    assert.deepEqual(analysis.targets, [], command);
  }
});

test("a computed target is write-shaped with no visible literal — the recorded boundary", () => {
  const analysis = analyzeShellWrite("echo hi > $DEST", { cwd: CWD, homedir: "/home/person" });
  assert.equal(analysis.writeShaped, true);
  assert.deepEqual(analysis.targets, []);
  assert.equal(analysis.dynamic, true);
});

test("a direct script execution scans the readable local script's own literals", () => {
  const source = [
    'import { writeFileSync } from "node:fs";',
    'writeFileSync("/durable/from-script.md", "x");',
    "export {};",
  ].join("\n");
  const analysis = analyzeShellWrite("bun /work/scan-me.mjs", {
    cwd: CWD,
    homedir: "/home/person",
    readFile: (p) => (p === "/work/scan-me.mjs" ? source : null),
  });
  assert.deepEqual(analysis.targets, ["/durable/from-script.md"]);
  assert.deepEqual(analysis.scanned, ["/work/scan-me.mjs"]);
  assert.equal(analysis.writeShaped, true);
});

test("a tilde target expands with the homedir before judgement", () => {
  const analysis = analyzeShellWrite("echo pwned > ~/.pi/agent/prompts/target.md", {
    cwd: CWD,
    homedir: "/home/person",
  });
  assert.deepEqual(analysis.targets, ["/home/person/.pi/agent/prompts/target.md"]);
});

/* ── decideShellWrite: containment, carve-out, posture ─────────────────── */

test("a scratch target under the temp roots passes without friction", () => {
  assert.equal(isScratchPath("/tmp/aw-fixture/x.txt", TEMP_ROOTS), true);
  assert.equal(isScratchPath("/var/tmp/x.txt", TEMP_ROOTS), true);
  assert.equal(isScratchPath("/work/repo/x.txt", TEMP_ROOTS), false);
  const result = verdict("echo x > /tmp/aw-scratch-fixture.txt");
  assert.equal(result.block, false);
});

test("read-only and dynamic commands pass (the recorded boundary)", () => {
  assert.equal(verdict("ls -la").block, false);
  assert.equal(verdict("echo hi > $DEST").block, false);
});

test("headless, a durable out-of-root target blocks with the edit-parity reason", () => {
  const target = "/home/person/.pi/agent/prompts/aw-fixture.md";
  const result = verdict(`echo pwned > ${target}`);
  assert.equal(result.block, true);
  assert.match(result.reason, /resolves outside the project root/);
  assert.match(result.reason, /bash write is blocked/);
});

test("interactive: the owner is asked, approval passes and a decline blocks", () => {
  const target = "/home/person/.aw-fixture/target.md";
  const asked = [];
  const approved = verdict(`echo x > ${target}`, {
    interactive: true,
    confirm: (question) => (asked.push(question), true),
  });
  assert.equal(approved.block, false);
  assert.equal(asked.length, 1);
  assert.match(asked[0], /outside the project root/);
  const declined = verdict(`echo x > ${target}`, { interactive: true, confirm: () => false });
  assert.equal(declined.block, true);
  assert.match(declined.reason, /not confirmed|declined/);
});

test("an unresolvable target fails closed like edit does", () => {
  const result = verdict("echo x > /work/repo/broken-link-target", {
    resolveTarget: () => ({ ok: false, reason: "ELOOP: too many symbolic links" }),
  });
  assert.equal(result.block, true);
  assert.match(result.reason, /could not be resolved/);
  assert.match(result.reason, /bash write is blocked/);
});

test("an in-root target hands the existing protected path to the injected Tier 2 decision", () => {
  const seen = [];
  const pass = verdict("echo v2 > tests/a.mjs", {
    exists: () => true,
    tier2: (rel, exists) => (seen.push([rel, exists]), { block: false }),
  });
  assert.equal(pass.block, false);
  assert.deepEqual(seen, [["tests/a.mjs", true]]);
  const blocked = verdict("echo v2 > tests/a.mjs", {
    exists: () => true,
    tier2: () => ({ block: true, reason: "protected parity reason" }),
  });
  assert.equal(blocked.block, true);
  assert.equal(blocked.reason, "protected parity reason");
});

test("a new or unprotected in-root write passes untouched", () => {
  assert.equal(verdict("echo fresh > new-file.txt").block, false);
});

/* ── decideShellWrite: virtual device sinks (issue #606) ──────────────── */
//
// The three reproducers the issue lists, the named set it orders skipped, and
// the failure state its `Expected` section keeps: a real durable out-of-root
// target in the same command still blocks. Every case is a command string the
// guard judges before execution; nothing here writes to a device node.

test("F1 a device-sink redirect passes headless — the `> /dev/null 2>&1` reproducer", () => {
  const command = "bun run build > /dev/null 2>&1";
  const analysis = analyzeShellWrite(command, { cwd: CWD, homedir: "/home/person" });
  assert.deepEqual(analysis.targets, ["/dev/null"], "the analysis layer keeps reporting the operand");
  assert.equal(verdict(command).block, false);
});

test("F2 a sink-only command asks nothing in a UI session", () => {
  const asked = [];
  const commands = [
    "bun run build > /dev/null 2>&1",
    "gh pr view 604 --json body -q .body > body.md 2>/dev/null",
  ];
  for (const command of commands) {
    const result = verdict(command, { interactive: true, confirm: (question) => (asked.push(question), true) });
    assert.equal(result.block, false, command);
  }
  assert.deepEqual(asked, [], "no approval prompt for a sink, whose durable target is in-root");
});

test("F3 `/dev/stdout` and `/dev/stderr` pass on a resolver that cannot canonicalize /proc/self/fd", () => {
  const uncanonicalizable = () => ({ ok: false, reason: "ENOENT: /proc/self/fd/1" });
  const command = "bun run build > /dev/stdout 2>/dev/stderr";
  assert.equal(verdict(command, { resolveTarget: uncanonicalizable }).block, false);
  const asked = [];
  const interactive = verdict(command, {
    interactive: true,
    resolveTarget: uncanonicalizable,
    confirm: (question) => (asked.push(question), true),
  });
  assert.equal(interactive.block, false);
  assert.deepEqual(asked, []);
});

test("F4 a durable out-of-root target in the same command still blocks headless, and is the one named", () => {
  const result = verdict("echo x > /dev/null 2>/home/person/durable.md");
  assert.equal(result.block, true);
  assert.match(result.reason, /\/home\/person\/durable\.md/);
  assert.doesNotMatch(result.reason, /"\/dev\/null"/);
});

test("F5 the same command asks once interactively, for the durable target", () => {
  const command = "echo x > /dev/null 2>/home/person/durable.md";
  const asked = [];
  const approved = verdict(command, { interactive: true, confirm: (question) => (asked.push(question), true) });
  assert.equal(approved.block, false);
  assert.equal(asked.length, 1);
  assert.match(asked[0], /\/home\/person\/durable\.md/);
  assert.doesNotMatch(asked[0], /dev\/null/);
  assert.equal(verdict(command, { interactive: true, confirm: () => false }).block, true);
});

test("F6 every named device sink is skipped", () => {
  const sinks = ["/dev/null", "/dev/zero", "/dev/full", "/dev/stdin", "/dev/stdout", "/dev/stderr", "/dev/tty", "/dev/fd/3"];
  for (const sink of sinks) {
    const asked = [];
    const result = verdict(`echo x > ${sink}`, { interactive: true, confirm: (question) => (asked.push(question), true) });
    assert.equal(result.block, false, sink);
    assert.deepEqual(asked, [], sink);
  }
});

test("F7 the skip runs before resolution — the resolver is never called for a sink", () => {
  let calls = 0;
  const sinkOnly = verdict("echo x > /dev/stdout", {
    resolveTarget: () => {
      calls += 1;
      throw new Error("the resolver must not run for a device sink");
    },
  });
  assert.equal(sinkOnly.block, false);
  assert.equal(calls, 0);
  calls = 0;
  const mixed = verdict("echo x > /dev/null 2>/home/person/durable.md", {
    resolveTarget: (absolute) => (calls += 1, { ok: true, real: absolute }),
  });
  assert.equal(mixed.block, true, "the durable target is still resolved and judged");
  assert.equal(calls, 1, "only the non-sink target reaches the resolver");
});

test("F8 the carve-out is exact — a lookalike, a relative form and the /dev/fd directory are still judged", () => {
  assert.equal(verdict("echo x > /dev/nullx").block, true);
  assert.equal(verdict("echo x > ../dev/null").block, true);
  assert.equal(verdict("echo x > /dev/fd").block, true);
  const resolved = [];
  const record = (absolute) => (resolved.push(absolute), { ok: true, real: absolute });
  verdict("echo x > /dev/nullx", { resolveTarget: record });
  verdict("echo x > dev/null", { resolveTarget: record });
  assert.deepEqual(resolved, ["/dev/nullx", "/work/repo/dev/null"], "a relative name resolves against cwd and is judged");
});

/* ── the shipped handler: the bypass pinned end-to-end ─────────────────── */

/** A Pi-shaped API that records event handlers instead of registering them. */
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

function context(cwd, { hasUI = false, confirmResult = undefined } = {}) {
  return {
    cwd,
    model: { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => true,
    isProjectTrusted: () => true,
    hasUI,
    ui: {
      notify: () => {},
      select: () => undefined,
      input: () => undefined,
      confirm: () => confirmResult,
    },
    modelRegistry: { find: () => undefined, hasConfiguredAuth: () => false, getAll: () => [] },
  };
}

/** Load the shipped entry once against an isolated agent dir and repo cwd. */
async function shippedEntry(cwd, agentDir) {
  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    const double = piDouble();
    extension(double.api);
    return double;
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
  }
}

function tempRoot(name) {
  const root = mkdtempSync(join(tmpdir(), `paw-shell-${name}-`));
  const cwd = join(root, "repo");
  const agentDir = join(root, "agent");
  mkdirSync(join(cwd, "tests"), { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(cwd, "tests", "a.mjs"), "v1\n");
  return { root, cwd, agentDir };
}

test("AC1 parity: edit refuses a durable out-of-root path and bash is refused the same way", async () => {
  const { root, cwd, agentDir } = tempRoot("parity");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    const durable = join(homedir(), ".aw-shell-guard-fixture", "target.md");
    const edit = await handle({ toolName: "edit", input: { path: durable } }, context(cwd));
    assert.equal(edit.block, true, "the parity side must refuse");
    assert.match(edit.reason, /resolves outside the project root/);
    const bash = await handle({ toolName: "bash", input: { command: `echo pwned > ${durable}` } }, context(cwd));
    assert.equal(bash.block, true, "the bash redirect must be refused where edit is");
    assert.match(bash.reason, /resolves outside the project root/);
    const tilde = await handle({ toolName: "bash", input: { command: "echo pwned > ~/.aw-shell-guard-fixture/t.md" } }, context(cwd));
    assert.equal(tilde.block, true, "the tilde redirect must be refused where edit is");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("incident choreography: a temp script writing a durable out-of-root path is blocked before execution", async () => {
  const { root, cwd, agentDir } = tempRoot("incident");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    const durable = join(homedir(), ".aw-shell-guard-fixture", "incident.md");
    const script = join(root, "patch.mjs");
    writeFileSync(
      script,
      `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(durable)}, "pwned");\n`,
    );
    const decision = await handle({ toolName: "bash", input: { command: `bun ${script}` } }, context(cwd));
    assert.equal(decision.block, true, "the exact live bypass must be refused");
    assert.match(decision.reason, /resolves outside the project root/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("in-root writes keep edit's Tier 2: an existing protected file blocks, a fresh one passes", async () => {
  const { root, cwd, agentDir } = tempRoot("tier2");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    const protectedWrite = await handle({ toolName: "bash", input: { command: "echo v2 > tests/a.mjs" } }, context(cwd));
    assert.equal(protectedWrite.block, true, "parity with edit on an existing protected path");
    const fresh = await handle({ toolName: "bash", input: { command: "echo fresh > brand-new.txt" } }, context(cwd));
    assert.equal(fresh?.block ?? false, false, "a fresh in-root create passes");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scratch writes through bash keep passing — the live-tree guard's mktemp mandate", async () => {
  const { root, cwd, agentDir } = tempRoot("scratch");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    const target = join(root, "scratch-out.txt");
    const decision = await handle({ toolName: "bash", input: { command: `echo fixture > ${target}` } }, context(cwd));
    assert.equal(decision?.block ?? false, false, "temp scratch writes are the workflow's own pattern");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("interactive approval: a session with UI may allow the durable out-of-root write once", async () => {
  const { root, cwd, agentDir } = tempRoot("approve");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    const durable = join(homedir(), ".aw-shell-guard-fixture", "approved.md");
    const allowed = await handle(
      { toolName: "bash", input: { command: `echo ok > ${durable}` } },
      context(cwd, { hasUI: true, confirmResult: true }),
    );
    assert.equal(allowed?.block ?? false, false, "approval lets the write through");
    const refused = await handle(
      { toolName: "bash", input: { command: `echo ok > ${durable}` } },
      context(cwd, { hasUI: true, confirmResult: false }),
    );
    assert.equal(refused.block, true, "a decline blocks");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("F9 the shipped handler passes a device-sink redirect and still blocks a durable target beside one", async () => {
  const { root, cwd, agentDir } = tempRoot("device-sinks");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    for (const command of ["bun run build > /dev/null 2>&1", "bun run build > /dev/stdout 2>/dev/stderr"]) {
      const headless = await handle({ toolName: "bash", input: { command } }, context(cwd));
      assert.equal(headless?.block ?? false, false, command);
    }
    const asked = [];
    const ui = context(cwd, { hasUI: true });
    ui.ui = { ...ui.ui, confirm: (question) => (asked.push(question), true) };
    const silent = await handle(
      { toolName: "bash", input: { command: "gh pr view 604 --json body -q .body > body.md 2>/dev/null" } },
      ui,
    );
    assert.equal(silent?.block ?? false, false);
    assert.deepEqual(asked, [], "no approval prompt for a sink in a real session with UI");
    const durable = join(homedir(), ".aw-shell-guard-fixture", "still-blocked.md");
    const blocked = await handle(
      { toolName: "bash", input: { command: `echo x > /dev/null 2>${durable}` } },
      context(cwd),
    );
    assert.equal(blocked.block, true, "a real durable target in the same command still blocks");
    assert.match(blocked.reason, /still-blocked\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("read-only bash and the existing receipt/git guards keep their behaviour", async () => {
  const { root, cwd, agentDir } = tempRoot("readonly");
  try {
    const entry = await shippedEntry(cwd, agentDir);
    const handle = entry.handlers.get("tool_call");
    const readonly = await handle({ toolName: "bash", input: { command: "ls -la && git status --porcelain" } }, context(cwd));
    assert.equal(readonly?.block ?? false, false, "read-only commands are untouched");
    const receipt = await handle({ toolName: "bash", input: { command: 'gh pr comment 1 --body "review-change:pass"' } }, context(cwd));
    assert.equal(receipt.block, true, "the receipt guard still leads for its own cases");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
