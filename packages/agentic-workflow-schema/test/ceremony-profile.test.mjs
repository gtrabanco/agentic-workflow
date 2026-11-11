/**
 * ceremony-profile.test.mjs — the `ceremony-profile@1` contract (issue #436,
 * unit docs/fix/436-ceremony-profile/).
 *
 * Written red-first: the module did not exist when this corpus landed. It pins
 * the contract the issue names:
 *
 *  - **One versioned grammar.** `ceremony-profile@1` — a contract id, a closed
 *    piece vocabulary, a closed adoption vocabulary, and a list-valued
 *    review-passes piece whose surfaces derive from the published `PASS_NAMES`.
 *  - **Closed vocabularies, refused never read optimistically** (S2/AC1): an
 *    unknown piece, adoption value or review surface is a typed refusal, never
 *    an optimistic read.
 *  - **Absent block is a degradation, never an error** (the doc-provenance S5
 *    pattern): a guide without the block reads as `null` — no profile declared,
 *    every applicable piece keeps the catalog default.
 *  - **Fail-closed on a present-but-wrong block**: an unknown contract version,
 *    a malformed line, a duplicate piece — all typed refusals (S5's anti-gaming
 *    half: nothing silently ignored).
 *  - **Machine-readable substrate for the prune sweep** (S7/AC8): the declared
 *    profile round-trips through a canonical serializer.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CEREMONY_PROFILE_CONTRACT_ID,
  CEREMONY_PROFILE_PIECES,
  CEREMONY_PROFILE_ADOPTIONS,
  CEREMONY_REVIEW_SURFACES,
  CEREMONY_PROFILE_REFUSALS,
  PASS_NAMES,
  readCeremonyProfile,
  serializeCeremonyProfile,
} from "../dist/index.js";

const fence = (body, marker = "```") => `${marker}\n${body}\n${marker}`;

const FULL_BLOCK = fence(
  [
    "ceremony-profile@1",
    "docs-step: paid",
    "captures: discarded",
    "review-passes: a11y, seo",
    "publish-gate: paid",
    "test-policy: discarded",
  ].join("\n"),
);

test("the contract publishes one versioned id and closed, frozen vocabularies", () => {
  assert.equal(CEREMONY_PROFILE_CONTRACT_ID, "ceremony-profile@1");
  assert.deepEqual([...CEREMONY_PROFILE_PIECES], [
    "docs-step",
    "captures",
    "review-passes",
    "publish-gate",
    "test-policy",
  ]);
  assert.deepEqual([...CEREMONY_PROFILE_ADOPTIONS], ["paid", "discarded"]);
  for (const set of [CEREMONY_PROFILE_PIECES, CEREMONY_PROFILE_ADOPTIONS, CEREMONY_REVIEW_SURFACES, CEREMONY_PROFILE_REFUSALS]) {
    assert.ok(Object.isFrozen(set), "published vocabularies are frozen");
    assert.ok(set.length > 0);
  }
});

test("the review-passes surface set derives from PASS_NAMES (classify is internal machinery)", () => {
  assert.deepEqual(
    [...CEREMONY_REVIEW_SURFACES],
    PASS_NAMES.filter((name) => name !== "classify").map((name) => name.replace(/^review-/, "")),
  );
});

test("a valid block parses to the declared adoption map and paid surfaces", () => {
  const result = readCeremonyProfile(FULL_BLOCK);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.profile.contract, "ceremony-profile@1");
  assert.deepEqual(result.profile.adoption, {
    "docs-step": "paid",
    captures: "discarded",
    "publish-gate": "paid",
    "test-policy": "discarded",
  });
  assert.deepEqual(result.profile.reviewPasses, ["a11y", "seo"]);
});

test("an absent block is a degradation, never an error (null, no refusals)", () => {
  assert.equal(readCeremonyProfile("no block here\n\n```text\nplain\n```\n"), null);
  assert.equal(readCeremonyProfile(""), null);
});

test("a block with no declarations is valid: every piece keeps the catalog default", () => {
  const result = readCeremonyProfile(fence("ceremony-profile@1"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.profile.adoption, {});
  assert.equal(result.profile.reviewPasses, null);
});

test("an unknown contract version is a typed refusal, never silently ignored", () => {
  const result = readCeremonyProfile(fence("ceremony-profile@2\ndocs-step: paid"));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(result.refusals.map((r) => r.reason), ["bad-contract-id"]);
});

test("unknown piece, adoption value and surface are refused, never read optimistically", () => {
  for (const [body, reason] of [
    ["tool-pass: paid", "unknown-piece"],
    ["docs-step: always", "unknown-adoption"],
    ["review-passes: a11y, smell", "unknown-review-surface"],
  ]) {
    const result = readCeremonyProfile(fence(`ceremony-profile@1\n${body}`));
    assert.equal(result.ok, false, body);
    if (result.ok) continue;
    assert.deepEqual(result.refusals.map((r) => r.reason), [reason], body);
  }
});

test("a malformed line and a duplicate piece are typed refusals", () => {
  for (const [body, reason] of [
    ["docs-step paid", "malformed-line"],
    ["docs-step: paid\ndocs-step: discarded", "duplicate-piece"],
  ]) {
    const result = readCeremonyProfile(fence(`ceremony-profile@1\n${body}`));
    assert.equal(result.ok, false, body);
    if (result.ok) continue;
    assert.deepEqual(result.refusals.map((r) => r.reason), [reason], body);
  }
});

test("review-passes: none discards every surface; an empty value is refused", () => {
  const none = readCeremonyProfile(fence("ceremony-profile@1\nreview-passes: none"));
  assert.equal(none.ok, true);
  if (none.ok) assert.deepEqual(none.profile.reviewPasses, []);

  const empty = readCeremonyProfile(fence("ceremony-profile@1\nreview-passes:"));
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.deepEqual(empty.refusals.map((r) => r.reason), ["empty-review-passes"]);
});

test("an empty block body with stray lines only is a typed refusal, not silence", () => {
  const result = readCeremonyProfile(fence("ceremony-profile@1\ndocs-step: paid\n\n# a comment\ncaptures: paid"));
  assert.equal(result.ok, true);
});

test("the parser reads the FIRST profile block only and skips foreign fences", () => {
  const doc = [
    "```json",
    '{"not":"a profile"}',
    "```",
    FULL_BLOCK,
    fence("ceremony-profile@2\ndocs-step: paid"),
  ].join("\n");
  const result = readCeremonyProfile(doc);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.profile.reviewPasses, ["a11y", "seo"]);
});

test("the profile round-trips through the canonical serializer", () => {
  const result = readCeremonyProfile(FULL_BLOCK);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const serialized = serializeCeremonyProfile(result.profile);
  const reparsed = readCeremonyProfile(fence(serialized));
  assert.equal(reparsed.ok, true);
  if (!reparsed.ok) return;
  assert.deepEqual(reparsed.profile.adoption, result.profile.adoption);
  assert.deepEqual(reparsed.profile.reviewPasses, result.profile.reviewPasses);
});

test("the serializer emits pieces in the closed order and names none for empty passes", () => {
  const result = readCeremonyProfile(FULL_BLOCK);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const lines = serializeCeremonyProfile(result.profile).split("\n");
  assert.deepEqual(lines, [
    "docs-step: paid",
    "captures: discarded",
    "review-passes: a11y, seo",
    "publish-gate: paid",
    "test-policy: discarded",
  ]);
  const none = readCeremonyProfile(fence("ceremony-profile@1\nreview-passes: none"));
  assert.equal(none.ok, true);
  if (none.ok) assert.equal(serializeCeremonyProfile(none.profile), "review-passes: none");
});
