// P19 / F100 — AC8: the pre-feature-26 canonical exports keep their 3.3.0 bytes.
//
// Feature 26 replaced `canonicalJSONValue`'s `JSON.stringify` fallback with a named
// `unsupported leaf` TypeError. That core is the digest authority for the legacy
// contracts too, so the guard was an observable behaviour change on shipped exports
// — against AC8 ("all prior machine contracts and pre-feature-26 export meanings
// remain unchanged") and against the release's own "Additive release" record.
//
// Every vector here was captured by executing the merge-base build (see
// `scripts/capture-legacy-vectors.mjs`), so this suite holds the candidate to the
// released bytes rather than to an opinion about them. The mirror risk is pinned in
// the same file: the named guard must stay exactly where it is — the feature-26
// verification canonicalizers.
//
// Written RED FIRST against the P18 fold: there, 40 of the 48 vectors threw
// `canonical JSON: unsupported leaf` instead of returning the 3.3.0 bytes.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFICATION_CANONICAL_VECTORS,
  VERIFICATION_PLAN_CONTRACT_ID,
  canonicalizeCandidateSnapshot,
  canonicalizeReviewReceipt,
  canonicalizeVerificationPlan,
  computeAcceptanceFingerprint,
  digestCandidateSnapshot,
  digestReviewReceipt,
  digestVerificationPlan,
} from "../dist/index.js";
import { planVector } from "./fixtures/verification-vectors.mjs";
import {
  legacyCollisionPair,
  legacyCompatCases,
} from "./fixtures/canonical-legacy-corpus.mjs";
import {
  LEGACY_CANONICAL_COLLISION,
  LEGACY_CANONICAL_VECTORS,
} from "./fixtures/canonical-legacy-vectors.mjs";

/** The feature-26 refusal that must never surface on a legacy export. */
const GUARD_MESSAGE = /unsupported leaf/;

const SURFACES = {
  candidateSnapshot: {
    canonical: (value) => canonicalizeCandidateSnapshot(value),
    digest: (value) => digestCandidateSnapshot(value),
  },
  reviewReceipt: {
    canonical: (value) => canonicalizeReviewReceipt(value),
    digest: (value) => digestReviewReceipt(value),
  },
  acceptanceFingerprint: {
    canonical: null,
    digest: (value) => computeAcceptanceFingerprint(value),
  },
};

const vectorsByName = new Map(LEGACY_CANONICAL_VECTORS.map((vector) => [vector.name, vector]));

test("the corpus and the capture cover the same cases, in the same order", () => {
  const cases = legacyCompatCases();
  assert.equal(cases.length, LEGACY_CANONICAL_VECTORS.length, "a corpus change needs a re-capture");
  cases.forEach((entry, index) => {
    assert.equal(entry.name, LEGACY_CANONICAL_VECTORS[index].name);
    assert.equal(entry.surface, LEGACY_CANONICAL_VECTORS[index].surface);
  });
  assert.equal(vectorsByName.size, cases.length, "case names must be unique");
});

for (const entry of legacyCompatCases()) {
  const vector = vectorsByName.get(entry.name);
  const { canonical, digest } = SURFACES[entry.surface];

  if (vector.threw) {
    test(`F100: ${entry.name} keeps the 3.3.0 error, not the feature-26 guard`, async () => {
      // 3.3.0 never reached the guard: it let `JSON.stringify` answer, and for a
      // bigint that answer was the engine's own TypeError. The class is pinned;
      // the text belongs to V8, so it is compared loosely.
      const thrown = await digest(entry.value).then(
        () => null,
        (failure) => failure,
      );
      assert.ok(thrown instanceof TypeError, `expected a TypeError, got ${String(thrown)}`);
      assert.ok(
        !GUARD_MESSAGE.test(thrown.message),
        `a legacy export must not raise the feature-26 refusal: ${thrown.message}`,
      );
      assert.throws(() => canonical(entry.value), TypeError);
    });
    continue;
  }

  test(`F100: ${entry.name} digests to the released 3.3.0 bytes`, async () => {
    assert.equal(await digest(entry.value), vector.digest, "digest drifted from 3.3.0");
    if (vector.canonical !== undefined) {
      assert.equal(canonical(entry.value), vector.canonical, "canonical form drifted from 3.3.0");
      assert.throws(() => JSON.parse(vector.canonical), "the vector must be the malformed one");
    } else if (canonical) {
      assert.doesNotThrow(() => JSON.parse(canonical(entry.value)), "a clean vector must stay parseable");
    }
  });
}

test("F100: the 3.3.0 collision the guard closes is restored, and recorded", async () => {
  // An array whose only element is unrepresentable serialized as an EMPTY array in
  // 3.3.0, so two different receipts bound one digest. Byte-identity with the
  // released package means keeping that collision on the legacy path — the cost is
  // stated in decisions.md and pinned here rather than quietly widened away.
  const pair = legacyCollisionPair();
  const empty = await digestReviewReceipt(pair.empty);
  const unrepresentable = await digestReviewReceipt(pair.unrepresentable);
  assert.equal(empty, LEGACY_CANONICAL_COLLISION.empty);
  assert.equal(unrepresentable, LEGACY_CANONICAL_COLLISION.unrepresentable);
  assert.equal(empty, unrepresentable, "3.3.0 collided; the compat suite proves it still does");
});

test("F100: the verification canonicalizers keep refusing every unsupported leaf", () => {
  // The mirror risk: scoping the guard must not leak. The same leaf that the legacy
  // exports serialize away is refused by name on the feature-26 surface, so a
  // verification digest can never bind bytes two documents share.
  const planOf = (args) => ({
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      {
        id: "c1",
        stage: "fast",
        executable: "npm",
        args,
        workingDirectoryPolicy: "candidate-root",
        workingDirectory: null,
        timeoutMs: 30000,
        stopOnFailure: false,
        costClass: "cheap",
      },
    ],
  });
  for (const args of [["run", () => {}], [Symbol("s")], [42n], [undefined], [Number.NaN]]) {
    assert.throws(
      () => canonicalizeVerificationPlan(planOf(args)),
      (failure) => failure instanceof TypeError && GUARD_MESSAGE.test(failure.message),
      `a ${typeof args[0]} verification leaf must still be refused by name`,
    );
  }
});

test("F100: scoping the guard moves no verification digest (AC5 vectors hold)", async () => {
  // The two serialization domains agree on every document inside the JSON data
  // model, so restoring the 3.3.0 fallback for the legacy exports must leave the
  // frozen feature-26 vectors exactly where they are. A change here means the
  // scope leaked into the verification path.
  assert.equal(
    await digestVerificationPlan(planVector()),
    VERIFICATION_CANONICAL_VECTORS[0].digest,
    "the AC5 plan vector digest moved",
  );
});
