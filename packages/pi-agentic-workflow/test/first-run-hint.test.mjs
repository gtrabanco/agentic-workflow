// first-run-hint.test.mjs — AC11 (SPEC S9, D-E7)
//
// The hint is the only place the package explains that routing exists at all, so
// it must show exactly once — not per command, not per session — and the
// acknowledgement must survive a restart. It lives in its own state file so
// showing a hint never rewrites the operator's configuration.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createHintStore, stateFilePath } from "../dist/routing/state.js";
import { createSession } from "./helpers/session.mjs";

const COMMAND = { name: "plan-feature", skill: "plan-feature" };

function tempAgentDir() {
  const root = mkdtempSync(join(tmpdir(), "paw-state-"));
  const agentDir = join(root, "agent");
  mkdirSync(agentDir, { recursive: true });
  return { root, agentDir };
}

/** A hint store over the real filesystem, exactly as the extension uses it. */
function storeIn(agentDir) {
  return createHintStore({ path: stateFilePath(agentDir) });
}

test("AC11: the first workflow-command dispatch shows the hint", async () => {
  const { root, agentDir } = tempAgentDir();
  try {
    const session = createSession({ hint: storeIn(agentDir) });
    const outcome = await session.dispatch(COMMAND, "x");

    assert.equal(outcome.status, "dispatched");
    assert.equal(outcome.hintShown, true);
    const hint = session.notifications().find((message) => /per-command models are optional/iu.test(message));
    assert.ok(hint, `expected the hint in ${JSON.stringify(session.notifications())}`);
    assert.match(hint, /\/agentic-workflow-settings/u);
    assert.match(hint, /pi-agentic-workflow\.json/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC11: the acknowledgement is persisted in the dedicated global state file", async () => {
  const { root, agentDir } = tempAgentDir();
  try {
    const session = createSession({ hint: storeIn(agentDir) });
    await session.dispatch(COMMAND, "x");

    const path = stateFilePath(agentDir);
    assert.equal(path, join(agentDir, "pi-agentic-workflow-state.json"));
    const stored = JSON.parse(readFileSync(path, "utf8"));
    assert.match(stored.firstRunHintShownAt, /^\d{4}-\d{2}-\d{2}T/u);
    assert.ok(
      !readFileSync(path, "utf8").includes("commands"),
      "state must not become configuration — the two files never mix",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC11: a later session does not repeat the hint", async () => {
  const { root, agentDir } = tempAgentDir();
  try {
    const firstSession = createSession({ hint: storeIn(agentDir) });
    await firstSession.dispatch(COMMAND, "one");

    // A new extension instance is a new Pi session; only the file carries over.
    const nextSession = createSession({ hint: storeIn(agentDir) });
    const outcome = await nextSession.dispatch(COMMAND, "two");
    assert.equal(outcome.status, "dispatched");
    assert.equal(nextSession.notifications().filter((message) => /per-command models are optional/iu.test(message)).length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC11: within one session the hint shows once even across several commands", async () => {
  const { root, agentDir } = tempAgentDir();
  try {
    const session = createSession({ hint: storeIn(agentDir) });
    const first = await session.dispatch(COMMAND, "one");
    await session.settle();
    const second = await session.dispatch({ name: "execute-phase", skill: "execute-phase" }, "two");

    assert.equal(first.hintShown, true);
    assert.equal(second.hintShown, false);
    assert.equal(
      session.notifications().filter((message) => /per-command models are optional/iu.test(message)).length,
      1,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC11: a refused dispatch does not consume the hint", async () => {
  const { root, agentDir } = tempAgentDir();
  try {
    const busy = createSession({ hint: storeIn(agentDir), idle: false });
    const refused = await busy.dispatch(COMMAND, "x", { isIdle: () => false });
    assert.equal(refused.status, "refused");
    assert.equal(refused.reason, "busy");
    assert.equal(busy.notifications().filter((message) => /per-command models are optional/iu.test(message)).length, 0);
    assert.throws(() => readFileSync(stateFilePath(agentDir), "utf8"), "no state file exists yet");

    const idle = createSession({ hint: storeIn(agentDir) });
    const dispatched = await idle.dispatch(COMMAND, "x");
    assert.equal(dispatched.hintShown, true, "the hint waited for a real dispatch");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC11: unreadable or corrupt state means the hint is shown again, never an error", async () => {
  const { root, agentDir } = tempAgentDir();
  try {
    writeFileSync(stateFilePath(agentDir), "{ this is not json");
    const session = createSession({ hint: storeIn(agentDir) });
    const outcome = await session.dispatch(COMMAND, "x");
    assert.equal(outcome.status, "dispatched");
    assert.equal(outcome.hintShown, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC11: an unpersistable acknowledgement is soft, and latched in memory", async () => {
  const hint = createHintStore({
    path: "/fixture/agent/pi-agentic-workflow-state.json",
    readFile: () => null,
    writeFile: () => {
      throw new Error("read-only agent directory");
    },
  });

  assert.equal(hint.acknowledge(), false, "a failed write is reported instead of thrown");
  assert.equal(hint.pending(), false, "the hint will not be re-shown for the rest of this session");

  const session = createSession({ hint });
  const outcome = await session.dispatch(COMMAND, "one");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.hintShown, false, "nothing to show once the latch is set");
});
