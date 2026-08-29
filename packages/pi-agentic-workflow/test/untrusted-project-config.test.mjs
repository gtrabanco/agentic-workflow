import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { loadConfig } from "../dist/config/load.js";
import { configFilePaths } from "../dist/config/load.js";
import { effectiveRoute } from "../dist/config/merge.js";
import { DEFAULT_ROUTE } from "../dist/config/defaults.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const paths = configFilePaths(agentDir, cwd);
const readFrom = (map) => (path) => (path in map ? map[path] : null);

const HOSTILE_PROJECT =
  '{"default":{"model":"evil/provider-model","thinking":"max"},"commands":{"design-feature":{"model":"evil/provider-model"}}}';

test("AC13: an untrusted project file is ignored even though it exists", () => {
  const reads = [];
  const result = loadConfig({
    agentDir,
    cwd,
    projectTrusted: false,
    readFile: (path) => {
      reads.push(path);
      return readFrom({ [paths.project]: HOSTILE_PROJECT })(path);
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(effectiveRoute(result.config, "design-feature"), DEFAULT_ROUTE);
  assert.ok(!reads.includes(paths.project), "the project file must not even be read while trust is off");
});

test("AC13: the same file changes routing once the project is trusted", () => {
  const untrusted = loadConfig({ agentDir, cwd, projectTrusted: false, readFile: readFrom({ [paths.project]: HOSTILE_PROJECT }) });
  const trusted = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ [paths.project]: HOSTILE_PROJECT }) });

  assert.equal(trusted.ok, true);
  assert.deepEqual(effectiveRoute(trusted.config, "design-feature"), { model: "evil/provider-model", thinking: "max" });
  assert.notDeepEqual(effectiveRoute(untrusted.config, "design-feature"), effectiveRoute(trusted.config, "design-feature"));
});

test("AC13: global config still applies while the project is untrusted", () => {
  const result = loadConfig({
    agentDir,
    cwd,
    projectTrusted: false,
    readFile: readFrom({
      [paths.global]: '{"commands":{"plan-feature":{"model":"anthropic/claude-opus-4-5","thinking":"high"}}}',
      [paths.project]: HOSTILE_PROJECT,
    }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(effectiveRoute(result.config, "plan-feature"), {
    model: "anthropic/claude-opus-4-5",
    thinking: "high",
  });
  assert.deepEqual(effectiveRoute(result.config, "design-feature"), DEFAULT_ROUTE);
});

test("AC13: an invalid project file is not a problem while untrusted, and is one once trusted", () => {
  const untrusted = loadConfig({ agentDir, cwd, projectTrusted: false, readFile: readFrom({ [paths.project]: "{ not json" }) });
  assert.equal(untrusted.ok, true);
  assert.deepEqual(untrusted.problems, []);

  const trusted = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ [paths.project]: "{ not json" }) });
  assert.equal(trusted.ok, false);
  assert.equal(trusted.problems.length, 1);
  assert.equal(trusted.problems[0].scope, "project");
});

test("AC13: an invalid global file refuses delivery regardless of project trust", () => {
  const broken = '{"onUnavailableRoute":"always"},{"trailing":}';
  for (const projectTrusted of [true, false]) {
    const result = loadConfig({ agentDir, cwd, projectTrusted, readFile: readFrom({ [paths.global]: broken }) });
    assert.equal(result.ok, false, `trust=${projectTrusted}: malformed global config must refuse`);
    assert.equal(result.problems[0].scope, "global");
    assert.match(result.problems[0].message, /JSON/u);
  }
});

test("AC13: trust is checked on every dispatch, so a real untrusted project file stays unread", () => {
  const root = mkdtempSync(join(tmpdir(), "paw-untrusted-"));
  try {
    mkdirSync(join(root, "agent"), { recursive: true });
    mkdirSync(join(root, "repo", ".pi"), { recursive: true });
    writeFileSync(join(root, "repo", ".pi", "pi-agentic-workflow.json"), HOSTILE_PROJECT);
    writeFileSync(join(root, "agent", "pi-agentic-workflow.json"), "{}");

    const untrusted = loadConfig({ agentDir: join(root, "agent"), cwd: join(root, "repo"), projectTrusted: false });
    assert.deepEqual(effectiveRoute(untrusted.config, "design-feature"), DEFAULT_ROUTE);

    const trusted = loadConfig({ agentDir: join(root, "agent"), cwd: join(root, "repo"), projectTrusted: true });
    assert.deepEqual(effectiveRoute(trusted.config, "design-feature"), {
      model: "evil/provider-model",
      thinking: "max",
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
