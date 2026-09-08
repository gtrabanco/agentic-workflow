// picker-filter.test.mjs — OB-2 (SPEC P4 task 4)
// The in-package token/subsequence, slash-aware reference filter. Written
// red-first: the picker module did not exist when this landed. The filter is the
// one place the vendor-agnostic package owns the "type to narrow" semantics; Pi
// does not export its fuzzy filter (PE-004), so the same behaviour lives here.

import { test } from "node:test";
import assert from "node:assert/strict";

import { filterReferences } from "../dist/settings/picker.js";

const REFS = [
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-opus-4-5",
  "nan/grok",
  "nan/flash",
  "openai/gpt-5.2",
  "openai/o3-mini-flash",
];

test("OB-2: an empty query returns every reference", () => {
  assert.deepEqual(filterReferences("", REFS), REFS);
  assert.deepEqual(filterReferences("   ", REFS), REFS);
});

test("OB-2: a bare token matches every reference containing it as a subsequence", () => {
  // `flash` appears as a contiguous run in two references; the others lack an
  // `f`/`l`/`a`/`s`/`h` run.
  assert.deepEqual(filterReferences("flash", REFS), ["nan/flash", "openai/o3-mini-flash"]);
});

test("OB-2: a trailing-slash token constrains to the provider only", () => {
  const nanOnly = filterReferences("nan/", REFS);
  assert.deepEqual(nanOnly, ["nan/grok", "nan/flash"]);
  assert.ok(nanOnly.every((ref) => ref.startsWith("nan/")), "every match is a provider-nan reference");
  assert.ok(
    filterReferences("nan/", REFS).every((ref) => !ref.startsWith("anthropic/") && !ref.startsWith("openai/")),
    "a model id that merely contains nan is not a provider-nan match",
  );
});

test("OB-2: subsequence tokens match in order across provider/modelId", () => {
  // `a/c` is a subsequence of `anthropic/claude-…` but not of `openai/gpt-…`.
  assert.deepEqual(filterReferences("a/c", REFS), ["anthropic/claude-sonnet-4-5", "anthropic/claude-opus-4-5"]);
  assert.ok(filterReferences("claude", REFS).length >= 2, "a model substring narrows to the right references");
});

test("OB-2: multiple tokens each narrow the list", () => {
  assert.deepEqual(filterReferences("claude sonnet", REFS), ["anthropic/claude-sonnet-4-5"]);
  assert.deepEqual(filterReferences("nan grok", REFS), ["nan/grok"]);
});

test("OB-2: a token matching no reference yields an empty list, never the whole registry", () => {
  assert.deepEqual(filterReferences("zzzz-not-a-model", REFS), []);
  assert.deepEqual(filterReferences("nan zzzz", REFS), []);
});
