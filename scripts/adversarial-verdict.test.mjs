#!/usr/bin/env node

/**
 * adversarial-verdict.test.mjs — the kill mandate, the diff-only reflector and
 * the stability check, tested against the record a `review-change --adversarial N`
 * pass produces (issue #358).
 *
 * The three acceptance fixtures are the corpus: a weak finding killed with
 * falsifying evidence next to a real one confirmed (S8), a hallucinated comment
 * the reflector cannot ground in the diff (S9), and a reproducer that also fires
 * on untouched adjacent code, which is re-scoped before it persists (S10).
 * Nothing else is padded in: the anti-invention case (S1), the reflector's
 * diff-only input (S2) and the CLI's fixed block are the parts of those
 * requirements the fixtures cannot express as data.
 *
 * The verdicts are checked against the **published** sets (the built schema
 * runtime), never against a local list, so a token the package does not export
 * cannot be accepted by the checker.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const fixtures = path.join(here, "fixtures", "adversarial-verdict");
const script = path.join(here, "adversarial-verdict.mjs");

const { validateRecord, formatReport } = await import("./adversarial-verdict.mjs");

const fixture = (name) => path.join(fixtures, name);
const record = (name) => JSON.parse(fs.readFileSync(fixture(`${name}.json`), "utf8"));
const diff = (name) => fs.readFileSync(fixture(`${name}.patch`), "utf8");

const codes = (result) => result.violations.map((violation) => violation.code);

/** The published machine, read from the built package — never a hand-kept list. */
const runtime = await import("./schema-runtime.mjs").then((module) => module.loadSchemaRuntime());

const HEAD = "c8b64d0b7a1f4c2e9d3b5a6f8c0e2d4b6a8c1e3f";

/** A minimal valid row, so each case varies exactly the field it is about. */
const row = (overrides = {}) => ({
  id: "F1",
  file: "scripts/review-state.mjs",
  line: 19,
  axis: "code",
  origin: "finder",
  verdict: "confirm",
  evidence_kind: "supporting",
  evidence: "attempted to falsify: an empty state file still throws, so the guard is real",
  stability: "stable",
  scope: "as-reported",
  reflector: { verdict: "keep", reason: "the cited line is one this diff adds" },
  ...overrides,
});

const recordOf = (findings, overrides = {}) => ({
  contract: "adversarial-verdict@1", head: HEAD, cycle: 1, findings, ...overrides,
});

/* --------------------------------------------------------------- S1 / S2 / S3 */

test("the verdicts the checker accepts are the published sets, not a local copy", () => {
  assert.deepEqual(runtime.ADVERSARIAL_VERDICTS, ["kill", "confirm"], "the mandate's closed set is published");
  assert.deepEqual(runtime.ADVERSARIAL_REFLECTOR_VERDICTS, ["keep", "drop"], "the reflector's closed set is published");
  assert.deepEqual(runtime.ADVERSARIAL_STABILITY_VERDICTS, ["stable", "unstable"], "the stability set is published");

  const invented = validateRecord(recordOf([row({ verdict: "maybe" })]), diff("diff-review-state"));
  assert.deepEqual(codes(invented), ["unknown-verdict"], "a verdict outside the published set is refused");
  assert.equal(invented.verdict, "FAIL");

  const inventedReflector = validateRecord(
    recordOf([row({ reflector: { verdict: "ok", reason: "sure" } })]), diff("diff-review-state"));
  assert.deepEqual(codes(inventedReflector), ["unknown-reflector-verdict"]);

  const inventedStability = validateRecord(
    recordOf([row({ stability: "probably" })]), diff("diff-review-state"));
  assert.deepEqual(codes(inventedStability), ["unknown-stability"]);
});

test("an empty record is a violation, so a pass cannot pass by returning nothing", () => {
  const result = validateRecord(recordOf([]), diff("diff-review-state"));
  assert.deepEqual(codes(result), ["empty-record"]);
  assert.equal(result.verdict, "FAIL");
});

test("a record for another contract or without a head is refused", () => {
  assert.deepEqual(codes(validateRecord(recordOf([row()], { contract: "adversarial-verdict@0" }), diff("diff-review-state"))),
    ["unknown-contract"]);
  assert.deepEqual(codes(validateRecord(recordOf([row()], { head: "HEAD" }), diff("diff-review-state"))),
    ["invalid-head"]);
});

/* ------------------------------------------------------------------------ S8 */

test("S8 — the weak finding is killed with falsifying evidence and the real one confirmed", () => {
  const result = validateRecord(record("record-kill-confirm"), diff("diff-kill-confirm"));

  assert.deepEqual(result.violations, [], "the shipped run record is valid");
  assert.equal(result.verdict, "PASS");

  const byId = new Map(result.findings.map((finding) => [finding.id, finding]));
  assert.equal(byId.get("F1").verdict, "kill");
  assert.equal(byId.get("F1").evidenceKind, "falsifying");
  assert.equal(byId.get("F1").destination, "killed", "a killed finding is never persisted");
  assert.equal(byId.get("F2").verdict, "confirm");
  assert.equal(byId.get("F2").destination, `persist ${byId.get("F2").file}:${byId.get("F2").line}`,
    "a confirmed finding persists at its own location");

  assert.deepEqual(result.persist.map((finding) => finding.id), ["F2", "F3"],
    "only the surviving findings reach the persist set");
  assert.equal(result.killed, 1);

  const report = formatReport(result);
  assert.match(report, /^\| F1 \| skills\/review-change\/references\/ADVERSARIAL_SETUP\.md:41 \| kill \| falsifying \| stable \| drop \| killed \|$/m);
  assert.match(report, /^tally: 2 persist · 1 killed · 0 dropped · 0 violation\(s\)$/m);
  assert.match(report, /^verdict: PASS$/m);
});

test("S1 — a kill with supporting evidence is refused: the mandate needs a disproof attempt", () => {
  const result = validateRecord(
    recordOf([row({ verdict: "kill", evidence_kind: "supporting" })]), diff("diff-review-state"));
  assert.deepEqual(codes(result), ["wrong-evidence-kind"]);
  assert.equal(result.persist.length, 0, "an evidence-less kill is never honoured");
});

/* ------------------------------------------------------------------------ S9 */

test("grounding — a content line that looks like a header does not end the hunk walk", () => {
  // A markdown line whose text starts with `++ ` reaches the diff as a
  // `+++ …` content line. The walk must read the hunk's declared extents,
  // not scan for headers, or the rest of the hunk lands in a phantom file
  // and real added lines stop being grounded (a false ungrounded-keep).
  const patch = [
    "diff --git a/f.md b/f.md",
    "--- a/f.md",
    "+++ b/f.md",
    "@@ -1,2 +1,5 @@",
    " context",
    "-old two",
    "+line one",
    "+++ bold header line",
    "+line two",
    "@@ -10,1 +11,2 @@",
    " ctx",
    "+added ten",
  ].join("\n");
  const result = validateRecord(recordOf([
    row({ id: "F1", file: "f.md", line: 2 }),
    row({ id: "F2", file: "f.md", line: 3 }),
    row({ id: "F3", file: "f.md", line: 12 }),
  ]), patch);
  assert.deepEqual(codes(result), [], "added lines stay grounded even when their text starts with ++");
  assert.deepEqual(result.persist.map((f) => f.destination),
    ["persist f.md:2", "persist f.md:3", "persist f.md:12"]);
});

test("S9 — the diff-only reflector cannot keep a claim the diff does not ground", () => {
  const kept = validateRecord(record("record-hallucination-kept"), diff("diff-review-state"));
  assert.deepEqual(codes(kept), ["ungrounded-keep"]);
  assert.equal(kept.verdict, "FAIL");
  assert.equal(kept.persist.length, 0, "the ungrounded row never reaches the persist set");
  assert.match(formatReport(kept), /no hunk of this diff changes skills\/review-change\/SKILL\.md:88/);

  const dropped = validateRecord(record("record-hallucination-dropped"), diff("diff-review-state"));
  assert.deepEqual(dropped.violations, [], "dropping what the diff cannot ground is the correct answer");
  assert.equal(dropped.verdict, "PASS");
  assert.equal(dropped.killed, 0);
  assert.equal(dropped.dropped, 1, "the hallucinated comment leaves the table, counted as dropped");
  assert.deepEqual(dropped.persist, []);
});

/* ----------------------------------------------------------------------- S10 */

test("S10 — an unstable reproducer is never persisted as-is", () => {
  const asReported = validateRecord(record("record-unstable-as-reported"), diff("diff-review-state"));
  assert.deepEqual(codes(asReported), ["unstable-not-rescoped"]);
  assert.equal(asReported.persist.length, 0);

  const rescoped = validateRecord(record("record-unstable-rescoped"), diff("diff-review-state"));
  assert.deepEqual(rescoped.violations, [], "a re-scoped misattribution is accepted");
  const surviving = rescoped.findings[0];
  assert.equal(surviving.destination, "persist scripts/ledger-provenance.mjs:117",
    "the re-scoped location is what persists");
  assert.match(formatReport(rescoped),
    /^\| F1 \| scripts\/review-state\.mjs:19 \| confirm \| supporting \| unstable → scripts\/ledger-provenance\.mjs:117 \| keep \| persist scripts\/ledger-provenance\.mjs:117 \|$/m,
    "the report states where the finding was found and where it persists");
});

test("S10 — a re-scope target that is not a location is refused", () => {
  const malformed = validateRecord(
    recordOf([row({ stability: "unstable", scope: "rescoped:the adjacent module" })]), diff("diff-review-state"));
  assert.deepEqual(codes(malformed), ["malformed-rescope"]);
});

/* ------------------------------------------------------------------------ S1 */

test("S1 — a finding the pass raised itself needs its own falsifying evidence from cycle 1", () => {
  const missing = validateRecord(record("record-new-without-evidence"), diff("diff-review-state"));
  assert.deepEqual(codes(missing), ["new-finding-needs-falsifying-evidence"]);
  assert.equal(missing.record.cycle, 1, "the rule binds the pass's first cycle, not only later ones");
  assert.equal(missing.persist.length, 0);

  const grounded = validateRecord(
    recordOf([row({ origin: "new", evidence_kind: "falsifying" })]), diff("diff-review-state"));
  assert.deepEqual(grounded.violations, [], "the same self-raised finding passes once it carries its reproducer");
});

/* ------------------------------------------------------------------------ S2 */

test("S2 — the reflector input is diff-only and every reflector verdict carries a reason", () => {
  const leak = validateRecord(record("record-reflector-leak"), diff("diff-review-state"));
  assert.deepEqual(codes(leak).sort(), ["reflector-needs-reason", "reflector-not-diff-only"]);
  assert.match(formatReport(leak), /the reflector is handed a tool transcript/);
  assert.match(formatReport(leak), /a reflector verdict with no reason is an unexplained drop/);
});

/* ---------------------------------------------------------------- CLI contract */

const run = (args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

test("the conductor's command prints the fixed block and exits by verdict", () => {
  const ok = run(["--record", fixture("record-kill-confirm.json"), "--diff", fixture("diff-kill-confirm.patch")]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, new RegExp(`^adversarial-verdict — 3 finding\\(s\\) · cycle 1 · head ${HEAD}$`, "m"));
  assert.match(ok.stdout, /^verdict: PASS$/m);
  assert.equal(ok.stdout, run(["--record", fixture("record-kill-confirm.json"), "--diff", fixture("diff-kill-confirm.patch")]).stdout,
    "the block is byte-stable for the same record");

  const failed = run(["--record", fixture("record-hallucination-kept.json"), "--diff", fixture("diff-review-state.patch")]);
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /^VIOLATION ungrounded-keep F1 — /m);
  assert.match(failed.stdout, /^verdict: FAIL$/m);

  const usage = run(["--record", fixture("record-kill-confirm.json")]);
  assert.equal(usage.status, 2, "a record with no diff cannot be grounded, so the invocation is a usage error");
  assert.match(usage.stderr, /--diff/);
});
