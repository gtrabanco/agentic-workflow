// config-schema-passes.test.mjs — issue #201 AC1/O1: the `passes` config key.
//
// The strict-validator contract is unchanged: only the documented keys, only
// the documented value shapes, no coercion — a PRESENT-but-invalid file must
// produce issues, because silently falling back to `inherit` would let an
// operator believe a strong model ran when it did not. Written red-first.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseConfigFile } from "../dist/config/schema.js";
import { MAX_MODEL_CHAIN } from "../dist/config/types.js";
import { PASS_NAMES } from "@gtrabanco/agentic-workflow-schema";

const chain = (n) =>
  JSON.stringify(
    Object.fromEntries([
      ...PASS_NAMES.map((name, i) => [name, { model: `prov/m${i}` }]),
      ["default", { model: "inherit", thinking: "low" }],
    ]),
  );

test("every published pass name plus passes.default is accepted with pinned references", () => {
  const result = parseConfigFile(`{"passes":${chain(PASS_NAMES.length)}}`);
  assert.deepEqual(
    result.issues,
    [],
    `expected a valid config, got ${JSON.stringify(result.issues)}`,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.config.passes["review-code"], { model: "prov/m0" });
  assert.deepEqual(result.config.passes.default, { model: "inherit", thinking: "low" });
});

test('"auto" is accepted — the operator\'s explicit delegation (issue #201 S1)', () => {
  const result = parseConfigFile('{"passes":{"verify":{"model":"auto"}}}');
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.deepEqual(result.config.passes.verify, { model: "auto" });
});

test("a reference chain (1 to MAX_MODEL_CHAIN entries) is accepted", () => {
  const refs = ["a/m1", "b/m2", "c/m3", "d/m4"].slice(0, MAX_MODEL_CHAIN);
  const result = parseConfigFile(
    `{"passes":{"review-code":{"model":${JSON.stringify(refs)}}}}`,
  );
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.deepEqual(result.config.passes["review-code"].model, refs);
});

test("a chain beyond the cap is rejected with the cap message", () => {
  const refs = ["a/m1", "b/m2", "c/m3", "d/m4", "e/m5"];
  const result = parseConfigFile(`{"passes":{"review-code":{"model":${JSON.stringify(refs)}}}}`);
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].path, "$.passes.review-code.model");
  assert.match(result.issues[0].message, /4 is the maximum/);
});

test("an invalid model reference reports $.passes.<name>.model (issue #201 Tests-first)", () => {
  const result = parseConfigFile('{"passes":{"classify":{"model":"nan no-slash"}}}');
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].path, "$.passes.classify.model");
  assert.match(result.issues[0].message, /must be "inherit", "auto", "provider\/modelId", or a chain/);
});

test("an unknown pass name is rejected per the strict-validator rule", () => {
  const result = parseConfigFile('{"passes":{"review-notreal":{"model":"inherit"}}}');
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].path, "$.passes.review-notreal");
  assert.match(result.issues[0].message, /unknown pass name/);
});

test("an unknown entry key is rejected with the allowed keys named", () => {
  const result = parseConfigFile('{"passes":{"verify":{"model":"auto","tier":"cheap"}}}');
  assert.equal(result.ok, false);
  assert.equal(result.issues[0].path, "$.passes.verify.tier");
  assert.match(result.issues[0].message, /unknown pass key "tier" \(allowed: model, thinking\)/);
});

test("an invalid thinking setting reports $.passes.<name>.thinking", () => {
  const result = parseConfigFile('{"passes":{"verify":{"model":"auto","thinking":"ultra"}}}');
  assert.equal(result.ok, false);
  assert.equal(result.issues[0].path, "$.passes.verify.thinking");
});

test("a non-record passes value and a non-record entry are issues, never coercion", () => {
  assert.equal(parseConfigFile('{"passes":["review-code"]}').ok, false);
  assert.equal(parseConfigFile('{"passes":{"verify":"auto"}}').ok, false);
});

test("an absent passes key behaves exactly as today (AC1/O1 compatibility)", () => {
  const result = parseConfigFile('{"default":{"model":"nan/qwen3.6"}}');
  assert.equal(result.ok, true);
  assert.equal(result.config.passes, undefined);
});
