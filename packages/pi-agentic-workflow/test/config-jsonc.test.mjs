// config-jsonc.test.mjs — `pi-agentic-workflow.json` is JSONC (issue #521).
//
// `docs/workflow/CONFIG.md` and this package's README both declare the two
// config files JSONC, but the extension file was parsed with `JSON.parse`: a
// `//` comment or a trailing comma turned a valid file into "invalid JSON", the
// loader failed closed, and the operator was told the Engram consent could not
// be read. The base file went through the schema package's `parseJsonc`, so the
// two files disagreed about their own format.
//
// The corpus is the issue's own reproduction plus the behaviours that must not
// move: a plain-JSON file still parses to the same config, and a genuinely
// broken file is still refused at `$` with the parse error and its location.

import assert from "node:assert/strict";
import test from "node:test";

import { configFilePaths, loadConfig } from "../dist/config/load.js";
import { parseConfigFile } from "../dist/config/schema.js";

/** The paths `loadConfig` reads for one agent dir and one project root. */
function pathsFor(agentDir, cwd) {
  return configFilePaths(agentDir, cwd);
}

/** A reader over an in-memory path → text map; `null` is an absent file. */
function readerFor(files) {
  return (path) => files.get(path) ?? null;
}

test("J1: the issue's commented file parses (S3 — a line comment is not a syntax error)", () => {
  const result = parseConfigFile(`{
  // "default": { "model": "inherit" }
  "stateFlow": { "enabled": false }
}`);
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.deepEqual(result.config, { stateFlow: { enabled: false } });
});

test("J2: block comments and trailing commas parse (S5 — the declared JSONC surface)", () => {
  const result = parseConfigFile(`{
  /* routing stays on the shipped default */
  "onSettle": "restore",
  "profileOrder": ["work",],
}`);
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.deepEqual(result.config, { onSettle: "restore", profileOrder: ["work"] });
});

test("J3: a commented file loads end to end, consent included (S3 steps 3-5)", () => {
  const paths = pathsFor("/agent", "/repo");
  const files = new Map([
    [paths.globalBase, '{ /* opt in */ "memory": { "engram": true },\n}'],
    [paths.project, '{\n  // keep the session model\n  "onSettle": "restore",\n}'],
  ]);
  const loaded = loadConfig({
    agentDir: "/agent",
    cwd: "/repo",
    projectTrusted: true,
    readFile: readerFor(files),
  });
  assert.equal(loaded.ok, true, JSON.stringify(loaded.problems));
  assert.deepEqual(loaded.problems, []);
  assert.equal(loaded.config.memory.engram, true, "the base file's opt-in is read");
  assert.equal(loaded.config.onSettle, "restore", "the extension file's value is read");
});

test("J4: a plain-JSON file parses exactly as before (S5 — no behaviour change for JSON)", () => {
  const result = parseConfigFile(
    '{"default":{"model":"openai/gpt-5.2","thinking":"high"},"commands":{"unit-lane":{"thinking":"medium"}},"onUnavailableRoute":"stop","onSettle":"keep"}',
  );
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.deepEqual(result.config, {
    default: { model: "openai/gpt-5.2", thinking: "high" },
    commands: { "unit-lane": { thinking: "medium" } },
    onUnavailableRoute: "stop",
    onSettle: "keep",
  });
});

test("J5: a syntax error still fails at the root and now names its location (S4 + S6)", () => {
  const result = parseConfigFile(`{
  "default": { "model": "inherit" },
  "default" 2
}`);
  assert.equal(result.ok, false);
  assert.equal("config" in result, false, "a rejected file hands merge no config");
  assert.deepEqual(result.issues.map((issue) => issue.path), ["$"]);
  assert.match(result.issues[0].message, /invalid JSON: line 3:\d+: /u);
});

test("J6: a broken file still fails the load closed (S4 — invalid is never a silent default)", () => {
  const paths = pathsFor("/agent", "/repo");
  const files = new Map([[paths.global, '{"onSettle": }']]);
  const loaded = loadConfig({
    agentDir: "/agent",
    cwd: "/repo",
    projectTrusted: true,
    readFile: readerFor(files),
  });
  assert.equal(loaded.ok, false, "an unparsable file refuses dispatch");
  assert.equal(loaded.problems.length, 1);
  assert.deepEqual(loaded.problems.map((problem) => problem.path), ["$"]);
  assert.match(loaded.problems[0].message, /invalid JSON: line 1:\d+: /u);
});

test("J7: the native parser never widens what a config may contain (S5a)", () => {
  // Owner decision D1: Bun's parser reads first. It is not the acceptance
  // boundary — it also takes JavaScript spellings and silently ignores whatever
  // follows the first root value — so the schema package's parser still decides,
  // and both runtimes refuse the same bytes for the same stated reason.
  for (const [label, text] of [
    ["single-quoted string", "{'onSettle': 'restore'}"],
    ["hex number", '{"profileFallback":{"retryAfterSeconds":0xA}}'],
    ["a concatenated root", '{"onSettle":"keep"},{"onSettle":"restore"}'],
    ["a truncated tail", '{"onSettle":"keep"} garbage'],
  ]) {
    const result = parseConfigFile(text);
    assert.equal(result.ok, false, `${label} must be refused`);
    assert.equal("config" in result, false, `${label}: a refused file hands merge no config`);
    assert.deepEqual(result.issues.map((issue) => issue.path), ["$"], label);
    assert.match(result.issues[0].message, /invalid JSON: line \d+:\d+: /u, label);
  }
});

test("J8: the native parser is the first reader, never the authority (S5a)", (t) => {
  if (typeof globalThis.Bun?.JSONC?.parse !== "function") {
    return t.skip("this runtime has no native JSONC parser");
  }
  const original = globalThis.Bun.JSONC.parse;
  let calls = 0;
  try {
    globalThis.Bun.JSONC.parse = (text) => {
      calls += 1;
      return original(text);
    };
    assert.equal(parseConfigFile('{"onSettle":"restore"}').config.onSettle, "restore");
    assert.equal(calls, 1, "the native parser is consulted once per file");

    // A native result can never become the config: the schema parse decides.
    globalThis.Bun.JSONC.parse = () => ({ injected: true });
    const replaced = parseConfigFile('{"onSettle":"restore"}');
    assert.equal(replaced.ok, true);
    assert.deepEqual(replaced.config, { onSettle: "restore" }, "the schema parse supplies the value");

    // A native failure is not a refusal on its own: the strict parse answers.
    globalThis.Bun.JSONC.parse = () => {
      throw new Error("native failure");
    };
    assert.equal(parseConfigFile('{"onSettle":"restore"}').ok, true);
  } finally {
    globalThis.Bun.JSONC.parse = original;
  }
});
