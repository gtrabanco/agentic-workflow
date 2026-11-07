// hooks-wiring.test.mjs — the extension adapter's seam triggers: session
// lifecycle, git commit/push interception, and the degradation startup notice
// (unit 413, O12).
import { mkdtempSync, rmSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { createHooksWiring } from "../dist/extension/hooks-wiring.js";

function fixtureProject({ hooks, consent, failing }) {
  const dir = mkdtempSync(join(tmpdir(), "hooks-wiring-"));
  const agentDir = join(dir, "agent");
  mkdirSync(join(dir, ".pi"), { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  if (hooks) writeFileSync(join(dir, ".pi", "hooks.json"), hooks);
  if (consent) {
    writeFileSync(
      join(agentDir, "seam-hooks-consent.json"),
      JSON.stringify({ projects: { [dir]: { consented: true } } }),
    );
  }
  if (failing) {
    writeFileSync(join(dir, "check.sh"), "#!/bin/sh\necho check failed\nexit 1\n");
    chmodSync(join(dir, "check.sh"), 0o755);
  }
  return {
    dir,
    agentDir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const enabledPreCommit = (command) =>
  JSON.stringify({ hooks: { "pre:commit": [{ enabled: true, hooks: [{ type: "command", command }] }] } });

function makeCtx(dir, agentDir) {
  const notices = [];
  return {
    dir,
    agentDir,
    notices,
    ctx: {
      cwd: dir,
      isProjectTrusted: () => true,
      ui: { notify: (message) => notices.push(message) },
    },
  };
}

const bashEvent = (command) => ({ toolName: "bash", input: { command } });

test("O12 (S8): an intercepted `git commit` runs the declared pre:commit check and blocks on failure", async () => {
  const fixture = fixtureProject({ consent: true, failing: true });
  const { ctx, notices } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(join(fixture.dir, ".pi", "hooks.json"), enabledPreCommit(join(fixture.dir, "check.sh")));
    const decision = await wiring.onToolCall(bashEvent("git commit -m x"), ctx);
    assert.equal(decision?.block, true);
    assert.ok(decision.reason.includes("pre:commit"));
    assert.ok(decision.reason.includes("declared requirement"));
    assert.ok(decision.reason.includes("check failed"));
    assert.deepEqual(notices, []);
  } finally {
    fixture.cleanup();
  }
});

test("a passing pre:commit seam lets the commit through and post:commit runs after the result", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx, notices } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(
      join(fixture.dir, ".pi", "hooks.json"),
      JSON.stringify({
        hooks: {
          "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "git --version" }] }],
          "post:commit": [{ enabled: true, hooks: [{ type: "command", command: "git --version" }] }],
        },
      }),
    );
    const decision = await wiring.onToolCall(bashEvent("git commit -m x"), ctx);
    assert.equal(decision, undefined);
    await wiring.onToolResult(
      { toolName: "bash", input: { command: "git commit -m x" }, isError: false },
      ctx,
    );
    assert.deepEqual(notices, []);
  } finally {
    fixture.cleanup();
  }
});

test("O5: a broken hook config announces the degradation once at session start and never blocks", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx, notices } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(join(fixture.dir, ".pi", "hooks.json"), "{oops");
    await wiring.onSessionStart(ctx);
    assert.equal(notices.length, 1);
    assert.ok(notices[0].includes("hooks.json"));
    await wiring.onSessionStart(ctx); // latched
    assert.equal(notices.length, 1);
    const decision = await wiring.onToolCall(bashEvent("git commit -m x"), ctx);
    assert.equal(decision, undefined); // declared no-op, not a block
  } finally {
    fixture.cleanup();
  }
});

test("non-git and status-only commands never trigger a seam", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(join(fixture.dir, ".pi", "hooks.json"), enabledPreCommit("git --version"));
    assert.equal(await wiring.onToolCall(bashEvent("git status"), ctx), undefined);
    assert.equal(await wiring.onToolCall(bashEvent("echo git commit"), ctx), undefined);
    assert.equal(await wiring.onToolCall({ toolName: "read", input: { path: "x" } }, ctx), undefined);
  } finally {
    fixture.cleanup();
  }
});

test("chained commands fire the seam once: `git add -A && git commit -m x`", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const runs = [];
  const wiring = createHooksWiring({
    agentDir: fixture.agentDir,
    spawnHook: async (argv) => {
      runs.push(argv.join(" "));
      return { exitCode: 0, output: "", truncated: false, timedOut: false };
    },
  });
  try {
    writeFileSync(join(fixture.dir, ".pi", "hooks.json"), enabledPreCommit("check pre"));
    const decision = await wiring.onToolCall(bashEvent("git add -A && git commit -m x"), ctx);
    assert.equal(decision, undefined);
    assert.deepEqual(runs, ["check pre"]);
  } finally {
    fixture.cleanup();
  }
});

test("pre:push intercepts `git push` and blocks a failing check", async () => {
  const fixture = fixtureProject({ consent: true, failing: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(
      join(fixture.dir, ".pi", "hooks.json"),
      JSON.stringify({ hooks: { "pre:push": [{ enabled: true, hooks: [{ type: "command", command: join(fixture.dir, "check.sh") }] }] } }),
    );
    const decision = await wiring.onToolCall(bashEvent("git push origin main"), ctx);
    assert.equal(decision?.block, true);
    assert.ok(decision.reason.includes("pre:push"));
  } finally {
    fixture.cleanup();
  }
});

test("session:start/session:end run their declared seams through the same gates", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const runs = [];
  const wiring = createHooksWiring({
    agentDir: fixture.agentDir,
    spawnHook: async (argv) => {
      runs.push(argv.join(" "));
      return { exitCode: 0, output: "", truncated: false, timedOut: false };
    },
  });
  try {
    writeFileSync(
      join(fixture.dir, ".pi", "hooks.json"),
      JSON.stringify({
        hooks: {
          "session:start": [{ enabled: true, hooks: [{ type: "command", command: "start check" }] }],
          SessionEnd: [{ enabled: true, hooks: [{ type: "command", command: "end check" }] }],
        },
      }),
    );
    await wiring.onSessionStart(ctx);
    await wiring.onSessionShutdown(ctx);
    assert.deepEqual(runs, ["start check", "end check"]);
  } finally {
    fixture.cleanup();
  }
});

test("no consent: the wiring never spawns and never blocks", async () => {
  const fixture = fixtureProject({ failing: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(join(fixture.dir, ".pi", "hooks.json"), enabledPreCommit(join(fixture.dir, "check.sh")));
    assert.equal(await wiring.onToolCall(bashEvent("git commit -m x"), ctx), undefined);
  } finally {
    fixture.cleanup();
  }
});

test("O16: a failing session:start hook reports its teaching message — a session seam cannot block, never silent", async () => {
  const fixture = fixtureProject({ consent: true, failing: true });
  const { ctx, notices } = makeCtx(fixture.dir, fixture.agentDir);
  const wiring = createHooksWiring({ agentDir: fixture.agentDir });
  try {
    writeFileSync(
      join(fixture.dir, ".pi", "hooks.json"),
      JSON.stringify({
        hooks: {
          "session:start": [{ enabled: true, hooks: [{ type: "command", command: join(fixture.dir, "check.sh") }] }],
          "session:end": [{ enabled: true, hooks: [{ type: "command", command: join(fixture.dir, "check.sh") }] }],
        },
      }),
    );
    await wiring.onSessionStart(ctx);
    await wiring.onSessionShutdown(ctx);
    assert.equal(notices.length, 2);
    assert.ok(notices[0].includes("session:start"));
    assert.ok(notices[0].includes("declared requirement"));
    assert.ok(notices[1].includes("session:end"));
  } finally {
    fixture.cleanup();
  }
});

test("O17: the git matcher sees option values and environment prefixes, and only real git calls", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const runs = [];
  const wiring = createHooksWiring({
    agentDir: fixture.agentDir,
    spawnHook: async (argv) => {
      runs.push(argv.join(" "));
      return { exitCode: 0, output: "", truncated: false, timedOut: false };
    },
  });
  try {
    writeFileSync(
      join(fixture.dir, ".pi", "hooks.json"),
      JSON.stringify({
        hooks: {
          "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "commit-check" }] }],
          "pre:push": [{ enabled: true, hooks: [{ type: "command", command: "push-check" }] }],
        },
      }),
    );
    const firing = {
      "git commit -m x": ["commit-check"],
      "git -C . commit -m x": ["commit-check"],
      "git -C /abs/path commit -m x": ["commit-check"],
      "git -c user.email=a@b commit -m x": ["commit-check"],
      "git -c core.hooksPath=/dev/null commit -m x": ["commit-check"],
      "git --git-dir=.git commit -m x": ["commit-check"],
      "git --git-dir .git commit -m x": ["commit-check"],
      "GIT_DIR=.git GIT_WORK_TREE=. git commit -m x": ["commit-check"],
      "cd sub && git commit -m x": ["commit-check"],
      "git --no-pager -C . commit -m x": ["commit-check"],
      "git -C . push origin main": ["push-check"],
      "git push origin main": ["push-check"],
    };
    for (const [command, expected] of Object.entries(firing)) {
      runs.length = 0;
      await wiring.onToolCall(bashEvent(command), ctx);
      assert.deepEqual(runs, expected, command);
    }
    const quiet = [
      "git status",
      "git log --grep commit",
      "git -C . status",
      "git commit-tree abc",
      "echo git commit",
      "ls -C . commit",
    ];
    for (const command of quiet) {
      runs.length = 0;
      assert.equal(await wiring.onToolCall(bashEvent(command), ctx), undefined, command);
      assert.deepEqual(runs, [], command);
    }
  } finally {
    fixture.cleanup();
  }
});

test("O18: a separator inside a quoted argument never creates a phantom segment", async () => {
  const fixture = fixtureProject({ consent: true });
  const { ctx } = makeCtx(fixture.dir, fixture.agentDir);
  const runs = [];
  const wiring = createHooksWiring({
    agentDir: fixture.agentDir,
    spawnHook: async (argv) => {
      runs.push(argv.join(" "));
      return { exitCode: 0, output: "", truncated: false, timedOut: false };
    },
  });
  try {
    writeFileSync(
      join(fixture.dir, ".pi", "hooks.json"),
      JSON.stringify({
        hooks: {
          "pre:commit": [{ enabled: true, hooks: [{ type: "command", command: "commit-check" }] }],
          "pre:push": [{ enabled: true, hooks: [{ type: "command", command: "push-check" }] }],
        },
      }),
    );
    await wiring.onToolCall(bashEvent('git commit -m "docs: sync | git push next"'), ctx);
    assert.deepEqual(runs, ["commit-check"]);
    runs.length = 0;
    await wiring.onToolCall(bashEvent('git commit -m "a ; git push b" && git push'), ctx);
    assert.deepEqual(runs, ["commit-check", "push-check"]);
  } finally {
    fixture.cleanup();
  }
});

test("O20: enabled without consent announces itself once and still spawns nothing", async () => {
  const fixture = fixtureProject({ failing: true });
  const { ctx, notices } = makeCtx(fixture.dir, fixture.agentDir);
  const runs = [];
  const wiring = createHooksWiring({
    agentDir: fixture.agentDir,
    spawnHook: async (argv) => {
      runs.push(argv.join(" "));
      return { exitCode: 0, output: "", truncated: false, timedOut: false };
    },
  });
  try {
    writeFileSync(join(fixture.dir, ".pi", "hooks.json"), enabledPreCommit("check pass"));
    await wiring.onSessionStart(ctx);
    await wiring.onToolCall(bashEvent("git commit -m x"), ctx);
    assert.deepEqual(runs, []);
    assert.equal(notices.length, 1);
    assert.ok(notices[0].includes("inert"), notices[0]);
    assert.ok(notices[0].includes("seam-hooks-consent.json"), notices[0]);
    await wiring.onSessionStart(ctx); // latched: one announce per project session
    assert.equal(notices.length, 1);
  } finally {
    fixture.cleanup();
  }
});
