// auto-log-session-config.test.mjs — the `logSession` switch (issue #427,
// absorbing #394): its boolean-like vocabulary, its strict publisher block and
// its resolution across the two config files.
//
// The switch now lives in the base `agentic-workflow.json` (feature config,
// cross-tool), while the pi file keeps routing. This suite pins the loader's
// half: the base file is read and normalized into the effective shape.

import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { configFilePaths, loadConfig } from "../dist/config/load.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const paths = configFilePaths(agentDir, cwd);
const readFrom = (map) => (path) => (path in map ? map[path] : null);
const load = (map) => loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom(map) });

test("ACFG-01 the shipped default is disabled and declares no publisher", () => {
  assert.deepEqual(DEFAULT_CONFIG.logSession, { enabled: false, publisher: null });
});

test("ACFG-02 an absent block is off; the boolean-like values switch it", () => {
  assert.deepEqual(load({}).config.logSession, { enabled: false, publisher: null });
  for (const value of [true, 1, "on"]) {
    assert.deepEqual(load({ [paths.globalBase]: JSON.stringify({ logSession: value }) }).config.logSession, { enabled: true, publisher: null });
  }
  for (const value of [false, 0, "off"]) {
    assert.deepEqual(load({ [paths.globalBase]: JSON.stringify({ logSession: value }) }).config.logSession, { enabled: false, publisher: null });
  }
});

test("ACFG-03 the project base file wins over the global base file, field by field", () => {
  const result = load({
    [paths.globalBase]: JSON.stringify({ logSession: { enabled: true, publisher: { command: ["global-publisher"] } } }),
    [paths.projectBase]: JSON.stringify({ logSession: { enabled: false } }),
  });
  assert.equal(result.ok, true, JSON.stringify(result.problems));
  // The switch is the project's; the publisher the project never mentions is
  // still the global one.
  assert.deepEqual(result.config.logSession, {
    enabled: false,
    publisher: { command: ["global-publisher"], timeoutMs: 5000 },
  });
});

test("ACFG-04 the vocabulary is closed: the old mode string is refused", () => {
  const refused = load({ [paths.globalBase]: JSON.stringify({ logSession: "mechanical" }) });
  assert.equal(refused.ok, false);
  assert.match(refused.problems[0].message, /does not match any allowed shape/);
});

test("ACFG-05 the block is strict: unknown keys and bad values are refused", () => {
  for (const value of [{ publisher: { nope: 1 } }, { enabled: "yes" }, []]) {
    const result = load({ [paths.globalBase]: JSON.stringify({ logSession: value }) });
    assert.equal(result.ok, false, `${JSON.stringify(value)} must be refused`);
  }
  const empty = load({ [paths.globalBase]: JSON.stringify({ logSession: {} }) });
  assert.equal(empty.ok, true, JSON.stringify(empty.problems));
  assert.deepEqual(empty.config.logSession, { enabled: false, publisher: null });
});

test("ACFG-06 the declared publisher's argv and timeout are validated", () => {
  const good = { logSession: { enabled: true, publisher: { command: ["curl", "-sS", "@-", "https://example.test/hook"], timeoutMs: 2500 } } };
  const parsed = load({ [paths.globalBase]: JSON.stringify(good) });
  assert.equal(parsed.ok, true, JSON.stringify(parsed.problems));
  assert.deepEqual(parsed.config.logSession.publisher, { command: ["curl", "-sS", "@-", "https://example.test/hook"], timeoutMs: 2500 });

  const bad = [
    { command: [] },
    { command: [""] },
    { command: "curl https://example.test" },
    { command: ["curl", 42] },
    { command: ["curl"], timeoutMs: 0 },
    { command: ["curl"], timeoutMs: 60_001 },
    { command: ["curl"], timeoutMs: 1.5 },
    { timeoutMs: 1000 },
  ];
  for (const publisher of bad) {
    const result = load({ [paths.globalBase]: JSON.stringify({ logSession: { publisher } }) });
    assert.equal(result.ok, false, `${JSON.stringify(publisher)} must be refused`);
  }
});

test("ACFG-07 a publisher declared while the log is off is kept, not an error", () => {
  const result = load({
    [paths.globalBase]: JSON.stringify({ logSession: { publisher: { command: ["sink"] } } }),
    [paths.projectBase]: JSON.stringify({ logSession: { enabled: false } }),
  });
  assert.equal(result.ok, true, JSON.stringify(result.problems));
  assert.deepEqual(result.config.logSession, { enabled: false, publisher: { command: ["sink"], timeoutMs: 5000 } });
});
