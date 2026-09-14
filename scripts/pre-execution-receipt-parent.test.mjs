#!/usr/bin/env node

/**
 * Fix #221 — pre-execution-receipt-parent
 *
 * Proves that `parseReceipts` normalizes the `parent` field through
 * `recordedValue` so that null-word lineage lines parse as JS `null`
 * and non-null ones pass through (bare hex or `sha256:`-dress stripped).
 *
 * Three lineage shapes:
 *  - Fix plan:  `Parent SPEC snapshot: null`  → `parent === null`
 *  - SPEC:      `Parent: null`                → `parent === null`
 *  - Feature:   `Parent SPEC snapshot: <64-hex>` → `parent === <64-hex>` bare
 *               `Parent SPEC snapshot: sha256:<64-hex>` → `parent === <64-hex>` bare
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseReceipts } from "./pre-execution-contract.mjs";

// ===========================================================================
// O1: null-word lineage lines must parse as JS `null`
// ===========================================================================

test("O1: fix plan `Parent SPEC snapshot: null` → parent is null", () => {
  const text = [
    "## Pre-execution review receipt v1 — plan",
    "- Review: rp-001 · Snapshot: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Verdict: plan-review-pass",
    "- Unit: fix-001 · Stage: plan · Unit kind: fix",
    "- Parent SPEC snapshot: null · Parent Product receipt: none",
    "- Source revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Artifact revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Policy: v1",
  ].join("\n");

  const receipts = parseReceipts(text);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].parent, null, "null-word must parse as JS null, not the string 'null'");
  assert.equal(receipts[0].unitKind, "fix");
  assert.equal(receipts[0].stage, "plan");
});

test("O1: SPEC `Parent: null` → parent is null", () => {
  const text = [
    "## Pre-execution review receipt v1 — spec",
    "- Review: rp-002 · Snapshot: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Verdict: spec-review-pass",
    "- Unit: 90-alpha · Stage: spec",
    "- Parent: null",
    "- Source revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Artifact revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Policy: v1",
  ].join("\n");

  const receipts = parseReceipts(text);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].parent, null, "null-word must parse as JS null");
});

// ===========================================================================
// O2: non-null parent values must pass through (bare hex passthrough)
// ===========================================================================

test("O2: feature receipt bare-hex parent → bare hex passthrough", () => {
  const parentHex = "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
  const text = [
    "## Pre-execution review receipt v1 — spec",
    `- Review: rp-003 · Snapshot: ${parentHex}`,
    "- Verdict: spec-review-pass",
    "- Unit: 91-beta · Stage: spec",
    `- Parent: ${parentHex} · Parent SPEC snapshot: ${parentHex}`,
    "- Source revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Artifact revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Policy: v1",
  ].join("\n");

  const receipts = parseReceipts(text);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].parent, parentHex, "bare hex must pass through unchanged");
});

test("O2: feature receipt `sha256:`-dress → stripped bare hex", () => {
  const parentHex = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
  const dressed = `sha256:${parentHex}`;
  const text = [
    "## Pre-execution review receipt v1 — spec",
    `- Review: rp-004 · Snapshot: ${parentHex}`,
    "- Verdict: spec-review-pass",
    "- Unit: 92-gamma · Stage: spec",
    `- Parent: ${dressed} · Parent SPEC snapshot: ${dressed}`,
    "- Source revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Artifact revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Policy: v1",
  ].join("\n");

  const receipts = parseReceipts(text);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].parent, parentHex, "sha256: dress must be stripped");
});

// ===========================================================================
// O3: all other fields must remain byte-identical (regression guard)
// ===========================================================================

test("O3: no other field is changed by the normalization", () => {
  const text = [
    "## Pre-execution review receipt v1 — plan",
    "- Review: rp-005 · Snapshot: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Verdict: plan-review-pass",
    "- Unit: fix-002 · Stage: plan · Unit kind: fix",
    "- Parent SPEC snapshot: null · Parent Product receipt: none",
    "- Source revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Artifact revision: abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "- Author exclusion: not-enforceable",
    "- Context clean: true",
    "- Policy: v1",
    "- Started/finished: 2026-09-14T18:57:53Z/2026-09-14T19:01:30Z · Findings: 0",
  ].join("\n");

  const receipts = parseReceipts(text);
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].parent, null);
  assert.equal(receipts[0].id, "rp-005");
  assert.equal(receipts[0].unit, "fix-002");
  assert.equal(receipts[0].unitKind, "fix");
  assert.equal(receipts[0].snapshot, "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab");
  assert.equal(receipts[0].verdict, "plan-review-pass");
  assert.equal(receipts[0].sourceRevision, "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab");
  assert.equal(receipts[0].artifactRevision, "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab");
  assert.equal(receipts[0].authorExclusion, "not-enforceable");
  assert.equal(receipts[0].contextClean, "true");
  assert.equal(receipts[0].policy, "v1");
});