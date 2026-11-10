// config-jsonc.test.mjs — JSONC parsing (issue #427, S3).
//
// JSONC is JSON plus `//` and `/* */` comments and trailing commas. The parser
// must not treat comment markers inside strings as comments, must report the
// line and column of a real syntax error, and must accept an empty file as an
// empty object (a freshly created config file is not an error).

import assert from "node:assert/strict";
import test from "node:test";

import { parseJsonc, stringifyJsoncValue } from "../dist/index.js";

test("parses JSON with line and block comments", () => {
  const result = parseJsonc(`{
    // a line comment
    "logSession": true, /* a block comment */
    "memory": { "engram": false }
  }`);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { logSession: true, memory: { engram: false } });
});

test("keeps comment markers inside strings", () => {
  const result = parseJsonc('{ "url": "https://example.test/a//b", "text": "/* not a comment */" }');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { url: "https://example.test/a//b", text: "/* not a comment */" });
});

test("accepts trailing commas in objects and arrays", () => {
  const result = parseJsonc('{ "a": [1, 2, 3,], "b": { "c": true, }, }');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: [1, 2, 3], b: { c: true } });
});

test("accepts a byte-order mark", () => {
  const result = parseJsonc('\uFEFF{ "a": 1 }');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: 1 });
});

test("an empty or comment-only file is an empty object", () => {
  assert.deepEqual(parseJsonc("").value, {});
  assert.deepEqual(parseJsonc("// nothing here\n").value, {});
});

test("a syntax error carries line and column", () => {
  const result = parseJsonc('{\n  "a": 1,\n  "b" 2\n}');
  assert.equal(result.ok, false);
  assert.equal(result.error.line, 3);
  assert.match(result.error.message, /colon|property|JSON/i);
});

test("a non-object root is an error for a config file", () => {
  const result = parseJsonc("[1, 2]");
  assert.equal(result.ok, false);
  assert.match(result.error.message, /object/i);
});

test("stringifyJsoncValue renders stable JSON", () => {
  assert.equal(stringifyJsoncValue({ b: 1, a: [true, null] }), '{\n  "b": 1,\n  "a": [\n    true,\n    null\n  ]\n}\n');
});
