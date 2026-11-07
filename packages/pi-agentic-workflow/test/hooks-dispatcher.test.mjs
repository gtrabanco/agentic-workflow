// hooks-dispatcher.test.mjs — runSeam orchestration: consent × enabled gates,
// degradation, teaching messages, auto flags, and the S8 fixture proof on a git
// sandbox (unit 413, O3/O4/O5/O8/O11/O12/O13).
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSeam } from "../dist/hooks/dispatcher.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";

const consentFile = (path = cwd) =>
  JSON.stringify({ projects: { [path]: { consented: true, consentedAt: "2026-11-08T00:00:00Z" } } });

const projectHooks = (hooks) => JSON.stringify({ hooks });

const enabledPreCommit = projectHooks({
  "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "check pass" }] }],
});

function deps(overrides = {}) {
  const spawns = [];
  return {
    spawns,
    base: {
      agentDir,
      cwd,
      projectTrusted: true,
      readConsent: () => true,
      spawnHook: (argv, options) => {
        spawns.push([argv, options]);
        return Promise.resolve({ exitCode: 0, output: "", truncated: false, timedOut: false });
      },
      runGit: (argv) => {
        spawns.push([argv, {}]);
        return Promise.resolve({ exitCode: 0, output: "", truncated: false, timedOut: false });
      },
      ...overrides,
    },
  };
}

const readProject = (text) => (path) => (path === join(cwd, ".pi", "hooks.json") ? text : null);

test("O3: without consent nothing spawns — off by default", async () => {
  const { base, spawns } = deps({ readConsent: () => false });
  const result = await runSeam("pre:commit", { ...base, readFile: readProject(enabledPreCommit) });
  assert.deepEqual(spawns, []);
  assert.equal(result.verdict, "allow");
  assert.equal(result.ran.length, 0);
});

test("O4: with consent but no enabled flag nothing spawns", async () => {
  const { base, spawns } = deps();
  const disabled = projectHooks({
    "pre:commit": [{ hooks: [{ type: "command", command: "check pass" }] }],
  });
  const result = await runSeam("pre:commit", { ...base, readFile: readProject(disabled) });
  assert.deepEqual(spawns, []);
  assert.equal(result.verdict, "allow");
});

test("an enabled seam runs its hooks in order: global first, project second", async () => {
  const { base, spawns } = deps();
  const both = {
    readFile: (path) =>
      path === join(cwd, ".pi", "hooks.json")
        ? enabledPreCommit
        : path === join(agentDir, "hooks.json")
          ? projectHooks({ "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "global check" }] }] })
          : null,
  };
  const result = await runSeam("pre:commit", { ...base, ...both });
  assert.deepEqual(
    spawns.map(([argv]) => argv.join(" ")),
    ["global check", "check pass"],
  );
  assert.equal(result.verdict, "allow");
  assert.equal(result.ran.length, 2);
});

test("O8: a failing hook blocks the seam and the teaching message quotes the declared requirement", async () => {
  const { base } = deps({
    spawnHook: async () => ({ exitCode: 1, output: "2 problems", truncated: false, timedOut: false }),
  });
  const result = await runSeam("pre:commit", { ...base, readFile: readProject(enabledPreCommit) });
  assert.equal(result.verdict, "block");
  assert.equal(result.blocks.length, 1);
  assert.ok(result.blocks[0].includes("pre:commit"));
  assert.ok(result.blocks[0].includes("check pass"));
});

test("a block stops later hooks at the same seam", async () => {
  const spawns = [];
  const { base } = deps({
    spawnHook: async (argv) => {
      spawns.push(argv.join(" "));
      return { exitCode: spawns.length === 1 ? 1 : 0, output: "", truncated: false, timedOut: false };
    },
  });
  const two = projectHooks({
    "pre:commit": [
      { enabled: true, hooks: [{ type: "command", command: "first fails" }] },
      { enabled: true, hooks: [{ type: "command", command: "second never" }] },
    ],
  });
  const result = await runSeam("pre:commit", { ...base, readFile: readProject(two) });
  assert.deepEqual(spawns, ["first fails"]);
  assert.equal(result.verdict, "block");
});

test("O5: broken config degrades with a notice naming the file — declared, never silent, never thrown", async () => {
  const { base, spawns } = deps();
  const result = await runSeam("pre:commit", { ...base, readFile: readProject("{oops") });
  assert.equal(result.verdict, "degrade");
  assert.deepEqual(spawns, []);
  assert.equal(result.notices.length, 1);
  assert.ok(result.notices[0].message.includes("hooks.json"));
});

test("missing config is a quiet no-op (the startup notice is the wiring's one-time job)", async () => {
  const { base, spawns } = deps();
  const result = await runSeam("pre:commit", { ...base, readFile: () => null });
  assert.equal(result.verdict, "allow");
  assert.deepEqual(spawns, []);
  assert.deepEqual(result.notices, []);
});

test("O12 (S8 fixture proof): a git sandbox with a declared pre:commit check sees it run and block on failure", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hooks-sandbox-"));
  try {
    mkdirSync(join(dir, ".pi"), { recursive: true });
    writeFileSync(join(dir, "check.sh"), "#!/bin/sh\necho template check failed\nexit 1\n");
    chmodSync(join(dir, "check.sh"), 0o755);
    writeFileSync(
      join(dir, ".pi", "hooks.json"),
      projectHooks({ "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: join(dir, "check.sh") }] }] }),
    );
    const result = await runSeam("pre:commit", {
      agentDir: join(dir, "agent"),
      cwd: dir,
      projectTrusted: true,
      readFile: (path) => (path === join(dir, ".pi", "hooks.json") ? projectHooks({ "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: join(dir, "check.sh") }] }] }) : null),
      readConsent: (a, c) => c === dir,
    });
    assert.equal(result.verdict, "block");
    assert.ok(result.blocks[0].includes("template check failed"));
    assert.ok(result.blocks[0].includes("declared requirement"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("O11: phase:end autoCommit runs git add+commit with the declared message only when hooks allow", async () => {
  const { base, spawns } = deps();
  const auto = projectHooks({
    "phase:end": [{ enabled: true, autoCommit: true, commitMessage: "lane: auto commit", hooks: [{ type: "command", command: "check pass" }] }],
  });
  await runSeam("phase:end", { ...base, readFile: readProject(auto) });
  assert.deepEqual(
    spawns.map(([argv]) => argv),
    [["check", "pass"], ["git", "add", "-A"], ["git", "commit", "-m", "lane: auto commit"]],
  );
});

test("O11: autoPush requires autoCommit and appends git push", async () => {
  const { base, spawns } = deps();
  const auto = projectHooks({
    "unit:end": [{ enabled: true, autoCommit: true, autoPush: true, commitMessage: "m", hooks: [{ type: "command", command: "check pass" }] }],
  });
  await runSeam("unit:end", { ...base, readFile: readProject(auto) });
  assert.deepEqual(spawns.at(-1)[0], ["git", "push"]);
});

test("O11: a failed auto commit does not push and blocks the seam", async () => {
  const { base, spawns } = deps();
  base.runGit = async (argv) => {
    spawns.push([argv, {}]);
    return argv[1] === "commit"
      ? { exitCode: 128, output: "nothing to commit", truncated: false, timedOut: false }
      : { exitCode: 0, output: "", truncated: false, timedOut: false };
  };
  const auto = projectHooks({
    "phase:end": [{ enabled: true, autoCommit: true, autoPush: true, commitMessage: "m", hooks: [{ type: "command", command: "check pass" }] }],
  });
  const result = await runSeam("phase:end", { ...base, readFile: readProject(auto) });
  assert.equal(result.verdict, "block");
  assert.deepEqual(
    spawns.map(([argv]) => argv[1]),
    ["pass", "add", "commit"],
  );
});

test("hooks that block at the seam prevent the auto action", async () => {
  const { base, spawns } = deps();
  base.spawnHook = async (argv) => {
    spawns.push([argv, {}]);
    return { exitCode: 1, output: "", truncated: false, timedOut: false };
  };
  const auto = projectHooks({
    "phase:end": [{ enabled: true, autoCommit: true, commitMessage: "m", hooks: [{ type: "command", command: "check fails" }] }],
  });
  const result = await runSeam("phase:end", { ...base, readFile: readProject(auto) });
  assert.equal(result.verdict, "block");
  assert.equal(spawns.length, 1);
});

test("untrusted project: only the global file is read, the project file never, nothing spawns", async () => {
  const spawns = [];
  const reads = [];
  const result = await runSeam("pre:commit", {
    agentDir,
    cwd,
    projectTrusted: false,
    readFile: (path) => {
      reads.push(path);
      return path === join(cwd, ".pi", "hooks.json") ? enabledPreCommit : null;
    },
    readConsent: () => true,
    spawnHook: async (...args) => {
      spawns.push(args);
      return { exitCode: 0, output: "", truncated: false, timedOut: false };
    },
  });
  // The project hooks.json exists but is never read (O2); the global file is
  // the user's own and is honoured when consented.
  assert.deepEqual(reads, [join(agentDir, "hooks.json")]);
  assert.deepEqual(spawns, []);
  assert.equal(result.verdict, "allow");
});
