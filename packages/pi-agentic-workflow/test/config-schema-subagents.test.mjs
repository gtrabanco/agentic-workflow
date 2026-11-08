// config-schema-subagents.test.mjs — issue #260 AC5: the `subagents` config
// key (owner decision 6, 2026-10-28 — optional resource-limit configuration).
//
// The strict-validator contract is unchanged: only the documented keys, only
// the documented value shapes, no coercion. The key is optional — absent is
// the automatic default (self-detected host envelope, conservative defaults);
// a present-but-invalid declaration must produce issues rather than a silent
// fallback, because a resource cap that is silently dropped lets a spawn run
// outside the envelope the operator believed it bounded. Written red-first.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";

test("a fully-declared subagents key is accepted", () => {
  const result = parseConfigFile(
    '{"subagents":{"parallelism":"auto","memoryCap":"12 of 64 GB","threadCap":"2 of 80 threads"}}',
  );
  assert.equal(result.ok, true, JSON.stringify(result.issues ?? []));
  assert.deepEqual(result.config.subagents, {
    parallelism: "auto",
    memoryCap: "12 of 64 GB",
    threadCap: "2 of 80 threads",
  });
});

test("every documented parallelism value is accepted", () => {
  for (const value of ["serial", "auto", 1, 4, 12]) {
    const result = parseConfigFile(`{"subagents":{"parallelism":${JSON.stringify(value)}}}`);
    assert.equal(result.ok, true, `${JSON.stringify(value)}: ${JSON.stringify(result.issues ?? [])}`);
  }
});

test("an invalid parallelism is rejected at $.subagents.parallelism", () => {
  for (const value of ["max", "PARALLEL", 0, -2, 1.5, true]) {
    const result = parseConfigFile(`{"subagents":{"parallelism":${JSON.stringify(value)}}}`);
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(value)}`);
    assert.ok(
      result.issues.some((i) => i.path === "$.subagents.parallelism"),
      JSON.stringify(result.issues),
    );
  }
});

test("cap strings must match the <n> of <m> <unit> shape", () => {
  const good = parseConfigFile('{"subagents":{"memoryCap":"12 of 64 GB","threadCap":"2 of 80 threads"}}');
  assert.equal(good.ok, true, JSON.stringify(good.issues ?? []));

  const badMemory = parseConfigFile('{"subagents":{"memoryCap":"12 GB"}}');
  assert.equal(badMemory.ok, false);
  // the shipped path convention quotes non-slug keys (displayKey)
  assert.ok(
    badMemory.issues.some((i) => i.path.startsWith("$.subagents.") && i.path.includes("memoryCap")),
    JSON.stringify(badMemory.issues),
  );

  const overOf = parseConfigFile('{"subagents":{"threadCap":"90 of 80 threads"}}');
  assert.equal(overOf.ok, false);
  assert.ok(
    overOf.issues.some((i) => i.path.startsWith("$.subagents.") && i.path.includes("threadCap")),
    JSON.stringify(overOf.issues),
  );
});

test("unknown inner keys are rejected; pre-existing keys stay byte-identical", () => {
  const unknown = parseConfigFile('{"subagents":{"parallelism":"auto","explode":true}}');
  assert.equal(unknown.ok, false);
  assert.ok(unknown.issues.some((i) => i.path.startsWith("$.subagents.explode")), JSON.stringify(unknown.issues));

  const absent = parseConfigFile('{"default":{"model":"inherit","thinking":"inherit"}}');
  assert.equal(absent.ok, true, JSON.stringify(absent.issues ?? []));
  assert.equal(absent.config.subagents, undefined);
});
