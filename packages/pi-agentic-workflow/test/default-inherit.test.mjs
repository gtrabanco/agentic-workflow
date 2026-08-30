// default-inherit.test.mjs — AC6 (SPEC S6, D-P6)
//
// Zero-config is the normal path: no files on disk resolve to the shipped
// `inherit` route, and an empty override list is `inherit`, not an error. The
// dispatch half of AC6 (a routed command running without any `setModel` call)
// is asserted in `test/dispatch-refusals.test.mjs` once the command surface
// exists in P3.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadConfig, configFilePaths } from "../dist/config/load.js";
import { effectiveRoute } from "../dist/config/merge.js";
import { DEFAULT_CONFIG, DEFAULT_ROUTE } from "../dist/config/defaults.js";
import { SETTINGS_COMMAND } from "../dist/routing/types.js";
import { createSession } from "./helpers/session.mjs";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const paths = configFilePaths(agentDir, cwd);

/** Loader over an in-memory filesystem; a path that is absent reads as null. */
const readFrom = (map) => (path) => (path in map ? map[path] : null);

test("AC6: no config files anywhere resolve to the shipped inherit default", () => {
  const result = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({}) });

  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.config, DEFAULT_CONFIG);
  assert.deepEqual(effectiveRoute(result.config, "design-feature"), { model: "inherit", thinking: "inherit" });
});

test("AC6: the shipped default is inherit/inherit with the fail-closed fallback", () => {
  assert.deepEqual(DEFAULT_ROUTE, { model: "inherit", thinking: "inherit" });
  assert.deepEqual(DEFAULT_CONFIG, {
    default: { model: "inherit", thinking: "inherit" },
    commands: {},
    onUnavailableRoute: "stop",
  });
});

test("AC6: an empty commands map is inherit, not an error", () => {
  const result = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.global]: '{"commands":{}}' }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(effectiveRoute(result.config, "execute-phase"), DEFAULT_ROUTE);
});

test("AC6: an explicit inherit route is honoured", () => {
  const result = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.project]: '{"commands":{"plan-feature":{"model":"inherit","thinking":"inherit"}}}' }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(effectiveRoute(result.config, "plan-feature"), DEFAULT_ROUTE);
});

test("AC6: a global-only file applies to every command the project never mentions", () => {
  const result = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({
      [paths.global]:
        '{"default":{"model":"openai/gpt-5.2","thinking":"medium"},"commands":{"plan-feature":{"model":"anthropic/claude-opus-4-5"}}}',
    }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(effectiveRoute(result.config, "plan-feature"), { model: "anthropic/claude-opus-4-5", thinking: "medium" });
  assert.deepEqual(effectiveRoute(result.config, "review-change"), { model: "openai/gpt-5.2", thinking: "medium" });
});

test("AC6: a blank file behaves like an absent file", () => {
  for (const blank of ["", "   ", "\n"]) {
    const result = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ [paths.global]: blank }) });
    assert.equal(result.ok, true, `blank input ${JSON.stringify(blank)} must not fail the loader`);
    assert.deepEqual(result.config, DEFAULT_CONFIG);
  }
});

test("AC6: the loader reads the two documented files, and real absence is zero-config", () => {
  const root = mkdtempSync(join(tmpdir(), "paw-zero-config-"));
  try {
    assert.deepEqual(configFilePaths("/x/agent", "/y/repo"), {
      global: join("/x/agent", "pi-agentic-workflow.json"),
      project: join("/y/repo", ".pi", "pi-agentic-workflow.json"),
    });

    // No injected reader: the loader's own filesystem read must report the
    // zero-config state instead of failing on missing files.
    const result = loadConfig({ agentDir: join(root, "agent"), cwd: join(root, "repo"), projectTrusted: true });
    assert.equal(result.ok, true);
    assert.deepEqual(result.problems, []);
    assert.deepEqual(result.config, DEFAULT_CONFIG);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC6: a real global file on disk is picked up without an injected reader", () => {
  const root = mkdtempSync(join(tmpdir(), "paw-global-file-"));
  try {
    mkdirSync(join(root, "agent"), { recursive: true });
    writeFileSync(
      join(root, "agent", "pi-agentic-workflow.json"),
      '{"commands":{"design-feature":{"model":"openai/gpt-5.2","thinking":"low"}}}',
    );

    const result = loadConfig({ agentDir: join(root, "agent"), cwd: root, projectTrusted: true });
    assert.equal(result.ok, true);
    assert.deepEqual(effectiveRoute(result.config, "design-feature"), { model: "openai/gpt-5.2", thinking: "low" });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// The dispatch leg of AC6: with nothing configured, running a command must not
// touch the session at all. The resolution half lives above; this is the part
// that needed the dispatcher, which is why it was sequenced into P3.

function zeroConfigRouter(root) {
  const session = createSession({
    loadConfig: () => loadConfig({ agentDir: join(root, "agent"), cwd: join(root, "repo"), projectTrusted: true }),
    knownCommands: ["plan-feature", SETTINGS_COMMAND],
  });
  return session;
}

test("AC6: a zero-config dispatch never calls setModel or setThinkingLevel", async () => {
  const root = mkdtempSync(join(tmpdir(), "paw-zero-dispatch-"));
  try {
    const session = zeroConfigRouter(root);
    const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "27-pi-agentic-workflow");

    assert.equal(outcome.status, "dispatched");
    assert.equal(outcome.routed, false, "nothing was routed, so nothing can be restored");
    assert.deepEqual(session.log.setModel, []);
    assert.deepEqual(session.log.setThinkingLevel, []);
    assert.deepEqual(session.log.sendUserMessage.map((entry) => entry.content), [
      "/skill:plan-feature 27-pi-agentic-workflow",
    ]);

    // Settling an unrouted turn changes nothing either.
    await session.settle();
    assert.deepEqual(session.log.setModel, []);
    assert.deepEqual(session.log.setThinkingLevel, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC6: the shipped default really does come from the loader, not from a test fixture", () => {
  assert.deepEqual(effectiveRoute(DEFAULT_CONFIG, "plan-feature"), DEFAULT_ROUTE);
});
