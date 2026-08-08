#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const gitBlobSha = (content) => {
  const body = Buffer.from(content, "utf8");
  const head = Buffer.from(`blob ${body.length}\0`, "utf8");
  return crypto.createHash("sha1").update(head).update(body).digest("hex");
};

const dependencyFingerprint = ({ specDependsLine, roadmapRows }) =>
  gitBlobSha([specDependsLine, ...roadmapRows].join("\n"));

const VERSION = "v1";

const fastPathEligible = (receipt, localFingerprint, forceRecords) => {
  if (!receipt) return { eligible: false, reason: "missing receipt" };
  if (receipt.version !== VERSION) return { eligible: false, reason: "older-version receipt" };
  if (typeof receipt.fingerprint !== "string" || receipt.fingerprint.length === 0)
    return { eligible: false, reason: "ambiguous receipt" };
  if (receipt.fingerprint !== localFingerprint) return { eligible: false, reason: "fingerprint mismatch" };
  if (receipt.fullyMerged !== true) return { eligible: false, reason: "unmet dependency" };
  const recv = Date.parse(receipt.verified);
  if (!receipt.verified || !Number.isFinite(recv)) return { eligible: false, reason: "ambiguous receipt" };
  const laterForce = forceRecords.some((f) => {
    const fd = Date.parse(f.date);
    return !f.date || !Number.isFinite(fd) || fd > recv;
  });
  if (laterForce) return { eligible: false, reason: "prior --force" };
  return { eligible: true, reason: "receipt current and fully merged" };
};

test("fingerprint primitive matches git hash-object", () => {
  const input = "Depends on: 22-other\n22-other #7 @ a1b2c3 merged\n";
  const local = spawnSync("git", ["hash-object", "--stdin"], { input, encoding: "utf8" });
  assert.equal(local.status, 0, local.stderr);
  assert.equal(gitBlobSha(input), local.stdout.trim());
});

test("full gate pass records a receipt that later phases fast-path", () => {
  const fingerprint = dependencyFingerprint({
    specDependsLine: "Depends on: 22-other",
    roadmapRows: ["22-other #7 @ a1b2c3 merged"],
  });
  const receipt = { version: VERSION, fingerprint, fullyMerged: true, verified: "2026-08-04", mergedPrs: ["22-other #7 @ a1b2c3"] };
  const result = fastPathEligible(receipt, dependencyFingerprint({
    specDependsLine: "Depends on: 22-other",
    roadmapRows: ["22-other #7 @ a1b2c3 merged"],
  }), []);
  assert.equal(result.eligible, true, result.reason);
});

test("dependency amendment (SPEC or roadmap change) invalidates via fingerprint mismatch", () => {
  const fingerprint = dependencyFingerprint({
    specDependsLine: "Depends on: 22-other",
    roadmapRows: ["22-other #7 @ a1b2c3 merged"],
  });
  const receipt = { version: VERSION, fingerprint, fullyMerged: true, verified: "2026-08-04" };
  const amended = dependencyFingerprint({
    specDependsLine: "Depends on: 22-other, 23-another",
    roadmapRows: ["22-other #7 @ a1b2c3 merged", "23-another pending"],
  });
  const result = fastPathEligible(receipt, amended, []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "fingerprint mismatch");
});

test("missing receipt fails closed to the full gate", () => {
  const result = fastPathEligible(null, "any-fingerprint", []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "missing receipt");
});

test("older-version receipt (format drift) fails closed", () => {
  const result = fastPathEligible({ version: "v0", fingerprint: "x", fullyMerged: true, verified: "2026-08-04" }, "x", []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "older-version receipt");
});

test("prior --force after the receipt date fails closed", () => {
  const receipt = { version: VERSION, fingerprint: "x", fullyMerged: true, verified: "2026-08-04" };
  const result = fastPathEligible(receipt, "x", [{ date: "2026-08-05" }]);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "prior --force");
});

test("--force predating the receipt does not invalidate it", () => {
  const receipt = { version: VERSION, fingerprint: "x", fullyMerged: true, verified: "2026-08-04" };
  const result = fastPathEligible(receipt, "x", [{ date: "2026-08-01" }]);
  assert.equal(result.eligible, true, result.reason);
});

test("unmet dependency (receipt not fully merged) fails closed", () => {
  const result = fastPathEligible({ version: VERSION, fingerprint: "x", fullyMerged: false, verified: "2026-08-04" }, "x", []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "unmet dependency");
});

test("ambiguous receipt (no fingerprint) never skips the forge", () => {
  const result = fastPathEligible({ version: VERSION, fullyMerged: true, verified: "2026-08-04" }, "x", []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "ambiguous receipt");
});

test("malformed or missing verified date on receipt fails closed as ambiguous", () => {
  const badDate = { version: VERSION, fingerprint: "x", fullyMerged: true, verified: "2026-08-0x" };
  let result = fastPathEligible(badDate, "x", []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "ambiguous receipt");
  const noDate = { version: VERSION, fingerprint: "x", fullyMerged: true };
  result = fastPathEligible(noDate, "x", []);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "ambiguous receipt");
});

test("malformed force date invalidates (fails closed)", () => {
  const receipt = { version: VERSION, fingerprint: "x", fullyMerged: true, verified: "2026-08-04" };
  const result = fastPathEligible(receipt, "x", [{ date: "not-a-date" }]);
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "prior --force");
});

test("every invalidation case is covered by the fixture matrix", () => {
  const cases = ["missing receipt", "older-version receipt", "ambiguous receipt", "fingerprint mismatch", "prior --force", "unmet dependency"];
  const receipt = { version: VERSION, fingerprint: "x", fullyMerged: true, verified: "2026-08-04" };
  const scenarios = [
    fastPathEligible(null, "x", []),
    fastPathEligible({ version: "v0", fingerprint: "x", fullyMerged: true, verified: "2026-08-04" }, "x", []),
    fastPathEligible({ version: VERSION, fingerprint: "x", fullyMerged: true, verified: "bad-date" }, "x", []),
    fastPathEligible(receipt, "y", []),
    fastPathEligible(receipt, "x", [{ date: "2026-08-05" }]),
    fastPathEligible({ version: VERSION, fingerprint: "x", fullyMerged: false, verified: "2026-08-04" }, "x", []),
  ];
  for (const scenario of scenarios) {
    assert.equal(scenario.eligible, false, scenario.reason);
    assert.ok(cases.includes(scenario.reason), `unexpected reason: ${scenario.reason}`);
  }
  assert.deepEqual(scenarios.map((s) => s.reason).sort(), [...cases].sort(), "exactly the documented invalidation cases");
});

console.log("PASS dependency receipt: fast path and every invalidation case");
