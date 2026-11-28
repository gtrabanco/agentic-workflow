// config-jsonc.test.mjs — config parsing (issue #427 S3, widened by #740 S1).
//
// The dialect is JSON5: JSON plus `//` and `/* */` comments, trailing commas,
// ES5 identifier keys, single-quoted strings with the ES5 escapes, hex and
// leading/trailing-dot numbers, a leading `+`, and `Infinity`/`NaN`. The parser
// must not treat comment markers inside strings as comments, must report the
// line and column of a real syntax error, must still refuse bytes after the root
// value (#521 D1's strict EOF), and must accept an empty file as an empty object
// (a freshly created config file is not an error).

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

test("JSON5: ES5 identifier keys and single-quoted strings parse (issue #740 S1)", () => {
  const result = parseJsonc("{\n  logSession: { enabled: true, publisher: null },\n  /* a block comment */\n  'memory': { 'engram': false },\n}");
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.deepEqual(result.value, { logSession: { enabled: true, publisher: null }, memory: { engram: false } });
});

test("JSON5: reserved words and $-prefixed identifiers are legal keys", () => {
  const result = parseJsonc('{ default: 1, $ref: 2, _private: 3, if: 4 }');
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.deepEqual(result.value, { default: 1, $ref: 2, _private: 3, if: 4 });
});

test("JSON5: single-quoted strings carry the ES5 escapes", () => {
  const result = parseJsonc("{ a: '\\x41\\u0042', b: 'tab\\there', c: 'line\\\ncontinued', d: 'quote\\'s', e: '\\v' }");
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.deepEqual(result.value, { a: "AB", b: "tab\there", c: "linecontinued", d: "quote's", e: "\v" });
});

test("JSON5: hex, leading-dot, trailing-dot and signed numbers parse", () => {
  const result = parseJsonc("{ hex: 0x1f, hexSigned: -0x10, leading: .5, trailing: 5., signed: +3, exp: 1e+2, zero: 0 }");
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.deepEqual(result.value, { hex: 31, hexSigned: -16, leading: 0.5, trailing: 5, signed: 3, exp: 100, zero: 0 });
});

test("JSON5: Infinity and NaN parse to the non-finite values", () => {
  const result = parseJsonc("{ up: Infinity, down: -Infinity, plus: +Infinity, nan: NaN, negNan: -NaN }");
  assert.equal(result.ok, true, JSON.stringify(result.error));
  assert.equal(result.value.up, Infinity);
  assert.equal(result.value.down, -Infinity);
  assert.equal(result.value.plus, Infinity);
  assert.equal(Number.isNaN(result.value.nan), true);
  assert.equal(Number.isNaN(result.value.negNan), true);
});

test("JSON5: strict EOF stays the acceptance boundary (issue #521 D1)", () => {
  for (const text of ['{"a":1}{"b":2}', '{"a":1} garbage', '{a:1} // a comment after the root value']) {
    const result = parseJsonc(text);
    if (text.startsWith('{a:1}')) {
      assert.equal(result.ok, true, "a comment after the root value is not content");
      continue;
    }
    assert.equal(result.ok, false, `${text} must be refused`);
    assert.match(result.error.message, /after the root value/u);
  }
});

test("JSON5: an identifier that is not a JSON5 keyword is refused with a position", () => {
  const result = parseJsonc("{\n  a: 1,\n  b: nope\n}");
  assert.equal(result.ok, false);
  assert.equal(result.error.line, 3);
  assert.match(result.error.message, /nope/u);
});

test("stringifyJsoncValue renders stable JSON", () => {
  assert.equal(stringifyJsoncValue({ b: 1, a: [true, null] }), '{\n  "b": 1,\n  "a": [\n    true,\n    null\n  ]\n}\n');
});
