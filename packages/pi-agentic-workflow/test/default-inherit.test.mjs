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
