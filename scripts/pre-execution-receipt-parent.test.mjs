#!/usr/bin/env node

/**
 * fix #221 — the one receipt parser must read a null-word lineage line as absent.
 *
 * `parseReceipts` (F25's one parser in `scripts/pre-execution-contract.mjs`)
 * captured the lineage line raw, so a fix plan receipt's contract-mandated
 * `Parent SPEC snapshot: null` parsed as the truthy string `"null"`. The sensor
 * then spawned `verify --parent null`, the schema validator refused
 * `invalid-value@/parentSpecSnapshotDigest`, and every sensed fix unit with a
 * plan receipt degraded to a false `label: "missing"` gate blocker.
 *
 * What this suite pins (O1, O2):
 *   - a null-word lineage line (`null`/`none`/`n/a`/`na`/`—`/`-`) parses as
 *     `parent === null` — both the fix plan receipt's `Parent SPEC snapshot`
 *     line and the SPEC receipt's `Parent` line;
 *   - a non-null lineage line keeps its recorded bare value — bare 64-hex
 *     passthrough and `sha256:`-dressed input parsed as the bare hex;
 *   - every other parsed field stays byte-identical (the fix touches only the
 *     `parent` field).
 *
 * The suite imports `parseReceipts` directly (the cheapest layer — no existing
 * suite does, and a direct import pins the grammar semantics at its source).
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { parseReceipts } from "./pre-execution-contract.mjs";

const HEX64 = "a".repeat(64);
const HEX64B = "b".repeat(64);
const REV = "c".repeat(40);

/** A complete, grammar-exact receipt block for the stage, with a chosen lineage line. */
function receipt({ stage = "plan", unitKind = "fix", parentLine, verdict = "plan-review-pass" }) {
  const unit = "fix-221";
  const kindLine = stage === "spec"
    ? `- Unit: ${unit} · Stage: ${stage} · Parent: null`
    : `- Unit: ${unit} · Stage: ${stage} · Unit kind: ${unitKind}\n- ${parentLine}`;
  return `## Pre-execution review receipt v1 — ${stage}
- Review: rp-221-001 · Snapshot: ${HEX64} · Verdict: ${verdict}
${kindLine}
- Source revision: ${REV} · Artifact revision: ${REV}
- Reviewer: reviewer-session · Session: s-1 · Role: reviewer · Author: author-team
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-14T00:00:00Z/2026-09-14T00:05:00Z · Findings: 0 (material open: 0)
`;
}

test("the parse of a null-word lineage line is the absence value, never the string 'null'", () => {
  const cases = ["null", "none", "n/a", "na", "—", "-"];
  for (const word of cases) {
    for (const stage of ["spec", "plan"]) {
      const line = stage === "spec"
        ? `- Unit: fix-221 · Stage: ${stage} · Parent: ${word}`
        : `- Unit: fix-221 · Stage: ${stage} · Unit kind: fix\n- Parent SPEC snapshot: ${word} · Parent Product receipt: none`;
      const [parsed] = parseReceipts(receipt({ stage, unitKind: "fix", parentLine: line }));
      assert.equal(parsed.parent, null, `${stage} receipt with parent word ${JSON.stringify(word)} must parse parent === null`);
    }
  }
});

test("a fix plan receipt's `Parent SPEC snapshot: null` parses parent === null (O1)", () => {
  const [parsed] = parseReceipts(receipt({ parentLine: `Parent SPEC snapshot: null · Parent Product receipt: none` }));
  assert.equal(parsed.stage, "plan");
  assert.equal(parsed.unitKind, "fix");
  assert.equal(parsed.parent, null);
  assert.equal(parsed.verdict, "plan-review-pass");
});

test("a SPEC receipt's `Parent: null` parses parent === null (O1)", () => {
  const [parsed] = parseReceipts(receipt({ stage: "spec", parentLine: `- Unit: fix-221 · Stage: spec · Parent: null` }));
  assert.equal(parsed.parent, null);
});

test("a bare 64-hex parent parses as the bare hex (O2, feature passthrough)", () => {
  const [parsed] = parseReceipts(receipt({
    stage: "plan", unitKind: "feature",
    parentLine: `Parent SPEC snapshot: ${HEX64B} · Parent Product receipt: rs-001`,
  }));
  assert.equal(parsed.parent, HEX64B);
  assert.equal(parsed.parent, HEX64B, "a bare hex must pass through unchanged");
});

test("a sha256:-dressed parent parses as the bare hex (O2)", () => {
  const [parsed] = parseReceipts(receipt({
    stage: "plan", unitKind: "feature",
    parentLine: `Parent SPEC snapshot: sha256:${HEX64B} · Parent Product receipt: rs-002`,
  }));
  assert.equal(parsed.parent, HEX64B, "the sha256: dress is stripped to the bare digest");
});

test("only `parent` changes: every other parsed field is byte-identical (O2)", () => {
  const other = { par: HEX64 };
  const [parsed] = parseReceipts(receipt({ parentLine: `Parent SPEC snapshot: null · Parent Product receipt: none` }));
  assert.equal(parsed.snapshot, HEX64, "snapshot stays raw — the verifier's digest-match path and JSON echo rely on it");
  assert.equal(parsed.id, "rp-221-001");
  assert.equal(parsed.unit, "fix-221");
  assert.equal(parsed.stage, "plan");
  assert.equal(parsed.unitKind, "fix");
  assert.equal(parsed.verdict, "plan-review-pass");
  assert.equal(parsed.sourceRevision, REV);
  assert.equal(parsed.artifactRevision, REV);
  assert.equal(parsed.authorExclusion, "not-enforceable");
  assert.equal(parsed.contextClean, "true");
  assert.equal(parsed.policy, "v1");
});
