// auto-log-session-config.test.mjs — the `autoLogSession` switch (feature #394,
// S1/S3), its strict schema and its resolution order.
//
// Three rules this suite pins, all of them S1's and S3's own words:
//
//  - **`off` by default.** An absent block resolves to `off`, and an install that
//    never mentions the switch writes nothing.
//  - **Project → global.** The same order every routed model already follows:
//    the project file wins, the global file is the fallback, the shipped default
//    is the floor.
//  - **The declared publisher is validated here, not at shutdown.** A malformed
//    argv is a config problem the operator can see; discovering it while a
//    session tears down would be the worst possible moment.

import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_CONFIG } from "../dist/config/defaults.js";
import { mergeConfigs } from "../dist/config/merge.js";
import { parseConfigFile } from "../dist/config/schema.js";
import { AUTO_LOG_SESSION_MODES } from "../dist/config/types.js";

const parse = (value) => parseConfigFile(JSON.stringify(value));

test("ACFG-01 the shipped default is off and declares no publisher", () => {
  assert.deepEqual(DEFAULT_CONFIG.autoLogSession, { mode: "off", publisher: null });
  assert.deepEqual([...AUTO_LOG_SESSION_MODES], ["off", "mechanical"]);
});

test("ACFG-02 an absent block resolves to off; a declared one is taken", () => {
  assert.deepEqual(mergeConfigs({}, {}).autoLogSession, { mode: "off", publisher: null });
  const merged = mergeConfigs({}, { autoLogSession: { mode: "mechanical" } });
  assert.equal(merged.autoLogSession.mode, "mechanical");
  assert.equal(merged.autoLogSession.publisher, null);
});

test("ACFG-03 the project file wins over the global file, field by field", () => {
  const global = { autoLogSession: { mode: "mechanical", publisher: { command: ["global-publisher"] } } };
  const project = { autoLogSession: { mode: "off" } };
  const merged = mergeConfigs(global, project);
  // The mode is the project's, and the publisher the project never mentions is
  // still the global one: one switch, resolved per field, never wholesale.
  assert.equal(merged.autoLogSession.mode, "off");
  assert.deepEqual(merged.autoLogSession.publisher, { command: ["global-publisher"], timeoutMs: 5000 });
  const flipped = mergeConfigs(global, {});
  assert.equal(flipped.autoLogSession.mode, "mechanical");
});

test("ACFG-04 the mode vocabulary is closed", () => {
  for (const mode of ["mechanical", "off"]) {
    assert.equal(parse({ autoLogSession: { mode } }).ok, true, mode);
  }
  for (const mode of ["rich", "on", "true", ""]) {
    const result = parse({ autoLogSession: { mode } });
    assert.equal(result.ok, false, `${mode} must be refused`);
    assert.match(result.ok ? "" : result.issues[0].message, /must be one of off, mechanical/u);
  }
});

test("ACFG-05 the block is strict: unknown keys and non-objects are refused", () => {
  assert.equal(parse({ autoLogSession: { mode: "mechanical", capture: true } }).ok, false);
  assert.equal(parse({ autoLogSession: "mechanical" }).ok, false);
  assert.equal(parse({ autoLogSession: [] }).ok, false);
  assert.equal(parse({ autoLogSession: { publisher: { nope: 1 } } }).ok, false);
  assert.equal(parse({ autoLogSession: {} }).ok, true, "an empty block is the default, not an error");
});

test("ACFG-06 the declared publisher's argv and timeout are validated", () => {
  const good = { autoLogSession: { mode: "mechanical", publisher: { command: ["curl", "-sS", "-d", "@-", "https://example.test/hook"], timeoutMs: 2500 } } };
  const parsed = parse(good);
  assert.equal(parsed.ok, true, parsed.ok ? "" : parsed.issues.map((issue) => issue.message).join("; "));
  assert.deepEqual(parsed.config.autoLogSession.publisher, { command: ["curl", "-sS", "-d", "@-", "https://example.test/hook"], timeoutMs: 2500 });

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
    const result = parse({ autoLogSession: { publisher } });
    assert.equal(result.ok, false, `${JSON.stringify(publisher)} must be refused`);
  }
});

test("ACFG-07 a publisher declared while the log is off is kept, not an error", () => {
  // Two files, one decision each: the project turns logging off while the global
  // file names a publisher. Nothing runs (the mode is off) and nothing is
  // rewritten — the operator's global declaration is not ours to drop.
  const merged = mergeConfigs({ autoLogSession: { publisher: { command: ["sink"] } } }, { autoLogSession: { mode: "off" } });
  assert.equal(merged.autoLogSession.mode, "off");
  assert.deepEqual(merged.autoLogSession.publisher, { command: ["sink"], timeoutMs: 5000 });
});
