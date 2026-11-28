// picker-filter.test.mjs — issue #694 S2: the picker's narrowing is the host's.
//
// Rewritten before the swap, deliberately: the previous corpus (feature 154,
// OB-2) pinned an in-package subsequence filter built on a premise that turned
// out to be false — pi-coding-agent keeps its fuzzy helper private, but
// `@earendil-works/pi-tui` publishes `fuzzyFilter`/`fuzzyMatch` (exported since
// pi-tui 1.1.0, verified against the pinned 1.4.0 and the installed 1.6.1). So
// the contract moves from "our filter" to "the host's filter, plus the one
// behaviour the host does not have": a trailing `/` still constrains the
// provider segment, because `fuzzyFilter` treats `/` as a token separator and
// `nan/` would otherwise match any reference whose letters appear in order.
//
// Deliberate deltas the rewrite locks (declared in issue #694):
//  - case-insensitive instead of `charCodeAt`-exact;
//  - results ordered by match quality instead of input order — except when the
//    query is only provider constraints, where no fuzzy ranking exists and the
//    offered order is kept (the open-time window must be stable, OB-3);
//  - match class is the host's subsequence + scoring, so an assertion never
//    pins a score or an order the two hosts disagree on (pi-tui 1.6 changed the
//    scoring; see the ordering case below).

import { test } from "node:test";
import assert from "node:assert/strict";

import { narrowReferences } from "../dist/settings/picker.js";

/**
 * A registry with the three shapes the constraint has to tell apart: two
 * references of one provider, one model id that *spells* that provider's
 * letters (`acme/nanite-7`), and providers whose ids differ in case.
 */
const REFS = [
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-opus-4-5",
  "nan/grok",
  "nan/flash",
  "openai/gpt-5.2",
  "openai/o3-mini-flash",
  "acme/nanite-7",
];

const sorted = (refs) => [...refs].sort();

test("an empty query returns every reference in the offered order", () => {
  assert.deepEqual(narrowReferences("", REFS), REFS);
  assert.deepEqual(narrowReferences("   ", REFS), REFS);
});

test("a bare token narrows through the host filter, case-insensitively", () => {
  assert.deepEqual(narrowReferences("flash", REFS), ["nan/flash", "openai/o3-mini-flash"]);
  assert.deepEqual(
    narrowReferences("FLASH", REFS),
    ["nan/flash", "openai/o3-mini-flash"],
    "the host filter lowercases the query; the retired in-package filter compared char codes",
  );
  assert.deepEqual(
    sorted(narrowReferences("Claude", REFS)),
    sorted(["anthropic/claude-sonnet-4-5", "anthropic/claude-opus-4-5"]),
  );
});

test("the better match comes first", () => {
  // `nan/flash` spells the token contiguously at index 4; `openai/o3-mini-flash`
  // spells it contiguously too but later in a longer string. Both hosts order
  // this pair the same way — the assertion is a property of the ranking (best
  // first), never a score.
  assert.deepEqual(narrowReferences("flash", REFS).slice(0, 2), ["nan/flash", "openai/o3-mini-flash"]);
  assert.ok(
    narrowReferences("grok", REFS)[0] === "nan/grok",
    "the single match of `grok` is the provider-nan reference",
  );
});

test("a trailing-slash token constrains to the provider segment", () => {
  const nanOnly = narrowReferences("nan/", REFS);
  assert.deepEqual(nanOnly, ["nan/grok", "nan/flash"], "the offered order is kept: no fuzzy ranking to apply");
  assert.ok(
    !nanOnly.includes("acme/nanite-7"),
    "a model id that spells the provider's letters is not a provider match — this is the behaviour `fuzzyFilter` alone loses",
  );
});

test("the provider constraint is case-insensitive, like the rest of the query", () => {
  assert.deepEqual(narrowReferences("NAN/", REFS), ["nan/grok", "nan/flash"]);
  assert.deepEqual(narrowReferences("OpenAI/", REFS), ["openai/gpt-5.2", "openai/o3-mini-flash"]);
});

test("a provider token and a model token combine", () => {
  assert.deepEqual(narrowReferences("nan/ flash", REFS), ["nan/flash"]);
  assert.deepEqual(narrowReferences("flash nan/", REFS), ["nan/flash"], "token order does not matter");
});

test("subsequence tokens match across provider and model id", () => {
  assert.deepEqual(narrowReferences("claude sonnet", REFS), ["anthropic/claude-sonnet-4-5"]);
  assert.deepEqual(narrowReferences("nan grok", REFS), ["nan/grok"]);
  assert.deepEqual(
    sorted(narrowReferences("a/c", REFS)),
    sorted(["anthropic/claude-sonnet-4-5", "anthropic/claude-opus-4-5", "acme/nanite-7"]),
    "`a/c` is a subsequence of the two anthropic references and of acme's provider/model split",
  );
});

test("a query matching nothing yields an empty list, never the whole registry", () => {
  assert.deepEqual(narrowReferences("zzzz-not-a-model", REFS), []);
  assert.deepEqual(narrowReferences("nan zzzz", REFS), []);
  assert.deepEqual(narrowReferences("zzz/", REFS), [], "a provider constraint that names nothing matches nothing");
});

test("every returned reference comes from the offered list", () => {
  for (const query of ["flash", "nan/", "a/c", "claude sonnet", "nan/ flash"]) {
    for (const ref of narrowReferences(query, REFS)) {
      assert.ok(REFS.includes(ref), `${JSON.stringify(query)} invented ${JSON.stringify(ref)}`);
    }
  }
});
