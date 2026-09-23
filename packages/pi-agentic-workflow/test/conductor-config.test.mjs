// conductor-config.test.mjs — AC8: DEFAULT_CONDUCTOR_CONFIG + mergeAdvanceConfig

import { test } from "node:test";
import assert from "node:assert/strict";

const { DEFAULT_CONDUCTOR_CONFIG, mergeAdvanceConfig } = await import("../dist/conductor/index.js");

test("AC8: DEFAULT_CONDUCTOR_CONFIG has cap 12, empty arrays, default runLogPath", () => {
  assert.ok(typeof DEFAULT_CONDUCTOR_CONFIG === "object" && DEFAULT_CONDUCTOR_CONFIG !== null);
  assert.equal(DEFAULT_CONDUCTOR_CONFIG.iterationsCap, 12);
  assert.deepStrictEqual(DEFAULT_CONDUCTOR_CONFIG.sensitivePaths, []);
  assert.deepStrictEqual(DEFAULT_CONDUCTOR_CONFIG.securityPaths, []);
  assert.equal(DEFAULT_CONDUCTOR_CONFIG.runLogPath, ".agentic-workflow/advance-run.log");
});

test("AC8: DEFAULT_CONDUCTOR_CONFIG is deeply frozen", () => {
  assert.ok(Object.isFrozen(DEFAULT_CONDUCTOR_CONFIG));
  assert.ok(Object.isFrozen(DEFAULT_CONDUCTOR_CONFIG.sensitivePaths));
  assert.ok(Object.isFrozen(DEFAULT_CONDUCTOR_CONFIG.securityPaths));
});

test("AC8: mergeAdvanceConfig combines user override with defaults", () => {
  const merged = mergeAdvanceConfig({}, { iterationsCap: 5 });
  assert.equal(merged.iterationsCap, 5);
  assert.deepStrictEqual(merged.sensitivePaths, []);
});

test("AC8: mergeAdvanceConfig merges all fields", () => {
  const merged = mergeAdvanceConfig({}, { iterationsCap: 20, sensitivePaths: ["src/auth/**"], securityPaths: ["src/crypto/**"], runLogPath: "/tmp/run.log" });
  assert.equal(merged.iterationsCap, 20);
  assert.deepStrictEqual(merged.sensitivePaths, ["src/auth/**"]);
  assert.deepStrictEqual(merged.securityPaths, ["src/crypto/**"]);
  assert.equal(merged.runLogPath, "/tmp/run.log");
});

test("AC8: mergeAdvanceConfig ignores unknown keys", () => {
  const merged = mergeAdvanceConfig({}, { iterationsCap: 8, __unknown__: true });
  assert.equal(Object.keys(merged).length, 4);
});

test("AC8: mergeAdvanceConfig returns a new object each call", () => {
  const a = mergeAdvanceConfig({}, {});
  const b = mergeAdvanceConfig({}, { iterationsCap: 99 });
  assert.notEqual(a, b);
  assert.notEqual(a.iterationsCap, b.iterationsCap);
});
