// hooks-runner.test.mjs — the no-shell tokenizer, bounded capture, verdicts and
// runtime-module spawning of the seam-hooks runner (unit 413, O6/O7/O8/O9).
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_HOOK_TIMEOUT_MS,
  HOOK_OUTPUT_CAP_BYTES,
  MAX_HOOK_TIMEOUT_MS,
  runHookCommand,
  seamBlockMessage,
  tokenizeHookCommand,
} from "../dist/hooks/runner.js";

test("O6: tokenization splits on whitespace and honours quotes as grouping", () => {
  assert.deepEqual(tokenizeHookCommand("bun run lint").argv, ["bun", "run", "lint"]);
  assert.deepEqual(tokenizeHookCommand("check --flag='a b'").argv, ["check", "--flag=a b"]);
  assert.deepEqual(tokenizeHookCommand('check "x  y" tail').argv, ["check", "x  y", "tail"]);
});

test("O6: unmatched quotes are refused", () => {
  const bad = tokenizeHookCommand("check 'unterminated");
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, "config-invalid");
});

test("O6: shell metacharacters are refused before any spawn — no interpolation, ever", () => {
  const commands = [
    "a | b",
    "a && b",
    "a; b",
    "a > file",
    "a < file",
    "echo $HOME",
    "echo `id`",
    "a & b",
    "rm -rf *",
    "ls ?",
    "echo [a-z]",
    "echo {a,b}",
    "echo ~",
    "a # comment",
    "multi\nline",
  ];
  for (const command of commands) {
    const result = tokenizeHookCommand(command);
    assert.equal(result.ok, false, command);
    assert.equal(result.reason, "config-invalid", command);
  }
  // Common safe forms survive: = in flags, . and / and - in paths, % in printf.
  for (const command of ["bun run check --flag=v", "./hooks/check.sh", "git commit -m ok"]) {
    assert.equal(tokenizeHookCommand(command).ok, true, command);
  }
});

test("O8: exit 0 is allow; non-zero is block with the captured output", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hooks-runner-"));
  try {
    writeFileSync(join(dir, "pass"), "#!/bin/sh\nexit 0\n");
    writeFileSync(join(dir, "fail"), "#!/bin/sh\necho boom\nexit 3\n");
    chmodSync(join(dir, "pass"), 0o755);
    chmodSync(join(dir, "fail"), 0o755);
    const allowed = await runHookCommand({ type: "command", command: join(dir, "pass") }, { cwd: dir });
    assert.equal(allowed.verdict, "allow");
    assert.equal(allowed.exitCode, 0);
    const blocked = await runHookCommand({ type: "command", command: join(dir, "fail") }, { cwd: dir });
    assert.equal(blocked.verdict, "block");
    assert.equal(blocked.exitCode, 3);
    assert.ok(blocked.output.includes("boom"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("O9: children spawn through the runtime module — shell:false and the runtime env are forced", async () => {
  const spawns = [];
  await runHookCommand(
    { type: "command", command: "bun check.mjs" },
    {
      cwd: "/fixture",
      spawnImpl: (argv, options) => {
        spawns.push([argv, options]);
        return fakeChild(0, "");
      },
    },
  );
  assert.equal(spawns.length, 1);
  const [argv, options] = spawns[0];
  assert.deepEqual(argv, ["bun", "check.mjs"]);
  assert.equal(options.shell, false);
  assert.ok(options.env.AGENTIC_WORKFLOW_RUNTIME === "bun" || options.env.AGENTIC_WORKFLOW_RUNTIME === "node");
});

test("O7: output is bounded at the cap with a truncation marker", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hooks-runner-"));
  try {
    const loud = writeLoudScript(dir, 4 * HOOK_OUTPUT_CAP_BYTES);
    const result = await runHookCommand({ type: "command", command: loud }, { cwd: dir });
    assert.ok(result.output.length <= HOOK_OUTPUT_CAP_BYTES + 200, `output length ${result.output.length}`);
    assert.equal(result.truncated, true);
    assert.ok(result.output.includes("[truncated]"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("O19: output volume never changes the verdict — a loud hook that exits 0 allows", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hooks-runner-"));
  try {
    const loud = writeLoudScript(dir, 4 * HOOK_OUTPUT_CAP_BYTES);
    const result = await runHookCommand({ type: "command", command: loud }, { cwd: dir });
    assert.equal(result.verdict, "allow");
    assert.equal(result.exitCode, 0);
    assert.equal(result.truncated, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("O15: a declared command that cannot spawn is a block, never an unhandled error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hooks-runner-"));
  try {
    const missing = await runHookCommand(
      { type: "command", command: "definitely-not-a-binary-xyz --check" },
      { cwd: dir },
    );
    assert.equal(missing.verdict, "block");
    assert.equal(missing.exitCode, null);
    assert.ok(/spawn|ENOENT|not found/i.test(missing.output), missing.output);

    // A present-but-not-executable declaration is the same failure class.
    writeFileSync(join(dir, "noexec"), "#!/bin/sh\nexit 0\n");
    const denied = await runHookCommand({ type: "command", command: join(dir, "noexec") }, { cwd: dir });
    assert.equal(denied.verdict, "block");
    assert.equal(denied.exitCode, null);
    assert.ok(/EACCES|permission/i.test(denied.output), denied.output);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("O7: a hanging hook is killed at its timeout and fails closed to block", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hooks-runner-"));
  try {
    writeFileSync(join(dir, "hang"), "#!/bin/sh\nsleep 30\n");
    chmodSync(join(dir, "hang"), 0o755);
    const result = await runHookCommand(
      { type: "command", command: join(dir, "hang"), timeout: 1 },
      { cwd: dir },
    );
    assert.equal(result.timedOut, true);
    assert.equal(result.verdict, "block");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("timeout bounds: default 60s, hard cap 600s", () => {
  assert.equal(DEFAULT_HOOK_TIMEOUT_MS, 60_000);
  assert.equal(MAX_HOOK_TIMEOUT_MS, 600_000);
});

test("O21: the teaching message quotes the declaration exactly as written", () => {
  const message = seamBlockMessage("pre:commit", 'node "my check.mjs" --strict', {
    exitCode: 1,
    output: "boom",
    truncated: false,
    timedOut: false,
  });
  // The declaration carries its own quoting; the message must not re-join an argv.
  assert.ok(message.includes('`node "my check.mjs" --strict`'), message);
});

test("O8: the teaching message quotes the declared requirement at the named seam", () => {
  const message = seamBlockMessage("pre:commit", "bun run lint", {
    exitCode: 1,
    output: "ESLint found 2 problems",
    truncated: false,
    timedOut: false,
  });
  assert.ok(message.includes("pre:commit"));
  assert.ok(message.includes("bun run lint"));
  assert.ok(message.includes("exit 1"));
  assert.ok(message.includes("ESLint found 2 problems"));
  // The declared requirement is quoted as declared, not paraphrased by a model.
  assert.ok(message.includes("declared requirement"));
});

/** A fixture script that writes `bytes` of output and exits 0. */
function writeLoudScript(dir, bytes) {
  const file = join(dir, "loud.mjs");
  // The pause makes the old kill-at-cap path deterministic: the signal lands
  // before the script's own exit, so a volume-driven kill is observable.
  writeFileSync(file, `process.stdout.write("z".repeat(${bytes})); setTimeout(() => process.exit(0), 400);\n`);
  return `${process.execPath} ${file}`;
}

function fakeChild(exitCode, output) {
  return {
    stdout: { on() {} },
    stderr: { on() {} },
    on(_event, handler) {
      setImmediate(() => handler(exitCode, null));
    },
    kill() {},
  };
}
