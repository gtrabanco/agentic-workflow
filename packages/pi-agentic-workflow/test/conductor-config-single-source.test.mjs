// conductor-config-single-source.test.mjs — feature 62 F4: ONE shipped default.
//
// `loop.ts` declared its own copy of `DEFAULT_CONDUCTOR_CONFIG` while `types.ts`
// owned the deep-frozen one, so the package published two identically-named
// constants (the second under the `DEFAULT_CONDUCTOR_CONFIG_LOOP` alias) that
// could silently diverge — and the object the loop actually fell back to was
// mutable while the published one was frozen. Single source now: `loop.ts`
// re-exports `types.ts`'s object, so both names are one identity.
//
// A NEW file rather than a block in `conductor-config.test.mjs`: an existing
// `*.test.*` file is a protected path under the repository's path-protection
// policy, and a new-file create is authoring by that same policy (E-60-5).

import { test } from "node:test";
import assert from "node:assert/strict";

const { DEFAULT_CONDUCTOR_CONFIG, DEFAULT_CONDUCTOR_CONFIG_LOOP } = await import(
  "../dist/conductor/index.js"
);
const { DEFAULT_CONDUCTOR_CONFIG: TYPES_DEFAULT } = await import(
  "../dist/conductor/types.js"
);

test("F4: the published alias and the loop's fallback are one object, not two literals", () => {
  assert.strictEqual(
    DEFAULT_CONDUCTOR_CONFIG_LOOP,
    DEFAULT_CONDUCTOR_CONFIG,
    "two identically-named constants may silently diverge — the loop must fall back to the published one",
  );
  assert.strictEqual(
    DEFAULT_CONDUCTOR_CONFIG,
    TYPES_DEFAULT,
    "types.ts owns the shipped default; every other module must read it, not re-declare it",
  );
});

test("F4: the object the loop falls back to is deeply frozen", () => {
  assert.ok(Object.isFrozen(DEFAULT_CONDUCTOR_CONFIG_LOOP), "the loop's fallback must not be mutable");
  assert.ok(Object.isFrozen(DEFAULT_CONDUCTOR_CONFIG_LOOP.sensitivePaths));
  assert.ok(Object.isFrozen(DEFAULT_CONDUCTOR_CONFIG_LOOP.securityPaths));
});

test("F4: the shipped default's values are unchanged by the single-sourcing", () => {
  assert.equal(DEFAULT_CONDUCTOR_CONFIG_LOOP.iterationsCap, 12);
  assert.equal(DEFAULT_CONDUCTOR_CONFIG_LOOP.runLogPath, ".agentic-workflow/advance-run.log");
  assert.deepStrictEqual(DEFAULT_CONDUCTOR_CONFIG_LOOP.sensitivePaths, []);
  assert.deepStrictEqual(DEFAULT_CONDUCTOR_CONFIG_LOOP.securityPaths, []);
});
