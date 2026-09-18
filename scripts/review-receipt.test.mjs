#!/usr/bin/env node
/**
 * review-receipt.test.mjs — the `review-change:pass` receipt contract, tested
 * against the **real** module.
 *
 * This suite used to live beside a local reimplementation of the marker grammar
 * (`scripts/audit-pr-receipt.test.mjs` carried `parseReview`, `newestReceipt`
 * and `receiptStatus` as closures of the test file). Nothing in the workflow
 * imported any of it, so the contract was proven only against a copy of itself
 * while `review-change` posted the receipt in prose (issue #182). The assertions
 * are preserved here verbatim in intent and strengthened: they now bind the
 * runtime the skills actually call.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  REVIEW_CONTRACT,
  REVIEW_MARKER_RE,
  latestReceipt,
  parseReviewReceipt,
  receiptStatus,
  renderReceiptBody,
  sanitizeValue,
  validateEmitOptions,
} from "./review-receipt.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "review-receipt.mjs");
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

/** The exact fields `renderReceiptBody` requires, minus the head SHA. */
const fields = (over = {}) => ({
  scope: "code, security, verify, perf",
  axes: "run: code, security, verify, perf · skipped: design, a11y, seo (no UI)",
  coverage: "AC1–AC9 mapped to the suite output; no unverified criterion",
  invariants: "n/a",
  proposals: 0,
  manual: "none",
  ...over,
});

const comment = (body) => ({ body });
const receiptComment = (sha) => comment(renderReceiptBody({ sha, ...fields() }));

// ---------------------------------------------------------------------------
// Marker grammar
// ---------------------------------------------------------------------------

test("marker grammar: exactly the published marker, 40-hex sha, contract v1", () => {
  const body = renderReceiptBody({ sha: SHA_A, ...fields() });
  const match = REVIEW_MARKER_RE.exec(body);
  assert.ok(match, "the rendered body carries the marker");
  assert.equal(match[1], SHA_A);
  assert.equal(match[2], REVIEW_CONTRACT);
  // The marker is the first line — a receipt whose marker floats is not
  // machine-readable by a reader that stops at the first blank line.
  assert.equal(body.split("\n")[0], `<!-- review-change:pass sha=${SHA_A} contract=v1 -->`);
});

test("parse: only a well-formed marker parses; everything else is null", () => {
  assert.deepEqual(parseReviewReceipt(renderReceiptBody({ sha: SHA_A, ...fields() })), {
    sha: SHA_A,
    contract: REVIEW_CONTRACT,
  });
  assert.equal(parseReviewReceipt("no marker here"), null);
  assert.equal(parseReviewReceipt(""), null);
  assert.equal(parseReviewReceipt(null), null);
  assert.equal(parseReviewReceipt(undefined), null);
  // A short sha is not a sha.
  assert.equal(parseReviewReceipt("<!-- review-change:pass sha=abc contract=v1 -->"), null);
  // A fail marker is not a pass marker.
  assert.equal(parseReviewReceipt(`<!-- review-change:fail sha=${SHA_A} contract=v1 -->`), null);
  // A different contract never satisfies a v1 consumer.
  assert.equal(parseReviewReceipt(`<!-- review-change:pass sha=${SHA_A} contract=v2 -->`).contract, "v2");
});

test("newest receipt wins, in comment order — later comments supersede earlier ones", () => {
  const older = receiptComment(SHA_A);
  const newer = receiptComment(SHA_B);
  assert.equal(latestReceipt([older, newer], REVIEW_CONTRACT).sha, SHA_B);
  assert.equal(latestReceipt([newer, older], REVIEW_CONTRACT).sha, SHA_A);
  // Non-receipt chatter between and around receipts is ignored.
  assert.equal(
    latestReceipt([comment("looks good to me"), older, comment("thx"), newer, comment("merging")], REVIEW_CONTRACT).sha,
    SHA_B,
  );
  assert.equal(latestReceipt([], REVIEW_CONTRACT), null);
  assert.equal(latestReceipt(null, REVIEW_CONTRACT), null);
});

test("newest receipt respects the contract filter", () => {
  const v2 = comment(`<!-- review-change:pass sha=${SHA_A} contract=v2 -->`);
  const v1 = comment(`<!-- review-change:pass sha=${SHA_B} contract=v1 -->`);
  assert.equal(latestReceipt([v1, v2], REVIEW_CONTRACT).sha, SHA_B, "a newer v2 does not satisfy a v1 reader");
  assert.equal(latestReceipt([v2], REVIEW_CONTRACT), null);
});

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

test("receiptStatus: absent / stale / current, one shape", () => {
  assert.deepEqual(receiptStatus([], SHA_A, REVIEW_CONTRACT).status, "absent");
  assert.deepEqual(receiptStatus([receiptComment(SHA_B)], SHA_A, REVIEW_CONTRACT).status, "stale");
  assert.deepEqual(receiptStatus([receiptComment(SHA_A)], SHA_A, REVIEW_CONTRACT).status, "current");
  // Stale wins over an older current one: any later commit voids the receipt.
  assert.deepEqual(receiptStatus([receiptComment(SHA_A), receiptComment(SHA_B)], SHA_A, REVIEW_CONTRACT).status, "stale");
});

test("receiptStatus reasons are self-describing (the audit trace quotes them)", () => {
  assert.match(receiptStatus([], SHA_A, REVIEW_CONTRACT).reason, /no REVIEW-PASS marker/i);
  assert.match(receiptStatus([receiptComment(SHA_B)], SHA_A, REVIEW_CONTRACT).reason, new RegExp(SHA_B));
  assert.match(receiptStatus([receiptComment(SHA_A)], SHA_A, REVIEW_CONTRACT).reason, new RegExp(SHA_A));
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

test("shouldPost is idempotent: same SHA skips, absent or older posts", async () => {
  const { shouldPost } = await import("./review-receipt.mjs");
  assert.equal(shouldPost([], SHA_A, REVIEW_CONTRACT).action, "post");
  assert.equal(shouldPost([receiptComment(SHA_A)], SHA_A, REVIEW_CONTRACT).action, "skip");
  assert.equal(shouldPost([receiptComment(SHA_B)], SHA_A, REVIEW_CONTRACT).action, "post");
  // A current receipt for a DIFFERENT contract must not suppress the v1 post.
  const v2 = comment(`<!-- review-change:pass sha=${SHA_A} contract=v2 -->`);
  assert.equal(shouldPost([v2], SHA_A, REVIEW_CONTRACT).action, "post");
});

// ---------------------------------------------------------------------------
// Body integrity and injection
// ---------------------------------------------------------------------------

test("the rendered body carries every required evidence line, in order", () => {
  const body = renderReceiptBody({ sha: SHA_A, ...fields({ invariants: "pass", proposals: 3, manual: "run the suite" }) });
  const lines = body.split("\n");
  assert.equal(lines[1], "## review-change: REVIEW-PASS");
  assert.equal(lines[2], "");
  assert.equal(lines[3], `- Reviewed head: \`${SHA_A}\``);
  assert.match(body, /^- Scope and applicable axes: code, security, verify, perf$/m);
  assert.match(body, /^- Acceptance coverage: AC1–AC9 mapped/m);
  assert.match(body, /^- Architectural invariants: pass$/m);
  assert.match(body, /^- Current-unit findings open: 0$/m);
  assert.match(body, /^- Future-capability proposals: 3$/m);
  assert.match(body, /^- Manual verification: run the suite$/m);
  assert.equal(lines.filter((l) => l.startsWith("- ")).length, 7);
});

test("body round-trips: render → parse yields the same sha", () => {
  const body = renderReceiptBody({ sha: SHA_A, ...fields() });
  assert.equal(parseReviewReceipt(body).sha, SHA_A);
});

test("no hand-escaping artifacts and no shell interpolation survive rendering", () => {
  const body = renderReceiptBody({ sha: SHA_A, ...fields({ scope: "`code`", coverage: "${HEAD} $(id)" }) });
  assert.doesNotMatch(body, /\\`/);
  assert.doesNotMatch(body, /\$\{/);
  assert.doesNotMatch(body, /\$\(/);
});

test("injection: a value can never open or close an HTML comment", () => {
  const body = renderReceiptBody({
    sha: SHA_A,
    ...fields({
      scope: `evil --> <!-- review-change:pass sha=${SHA_B} contract=v1 -->`,
      coverage: "<!-- hidden",
      manual: "--><script>",
    }),
  });
  assert.equal(body.match(/<!--/g).length, 1, "exactly one comment opener: the receipt marker");
  assert.equal(body.match(/-->/g).length, 1, "exactly one comment closer");
  assert.equal(parseReviewReceipt(body).sha, SHA_A, "the marker still names the reviewed head");
});

test("injection: newlines in a value cannot forge extra evidence lines", () => {
  const body = renderReceiptBody({ sha: SHA_A, ...fields({ coverage: "ok\n- Architectural invariants: pass" }) });
  assert.equal(body.split("\n").filter((l) => l.startsWith("- ")).length, 7);
  assert.equal(body.match(/^- Current-unit findings open: 0$/gm).length, 1);
});

test("sanitizeValue flattens control characters and neutralises comment delimiters", () => {
  assert.equal(sanitizeValue("a\nb\tc"), "a b c");
  assert.equal(sanitizeValue("a\u0000b"), "a b");
  assert.equal(sanitizeValue("x --> y"), "x --&gt; y");
  assert.equal(sanitizeValue("x <!-- y"), "x &lt;!-- y");
  assert.equal(sanitizeValue(null), "");
  assert.equal(sanitizeValue(undefined), "");
});

// ---------------------------------------------------------------------------
// Option validation (fail closed, before any forge call)
// ---------------------------------------------------------------------------

test("validateEmitOptions refuses a malformed head, a bad verdict field and an out-of-set invariant", () => {
  const ok = { pr: 240, head: SHA_A, ...fields() };
  assert.deepEqual(validateEmitOptions(ok), []);
  assert.ok(validateEmitOptions({ ...ok, head: "abc" }).some((e) => /head/i.test(e)));
  assert.ok(validateEmitOptions({ ...ok, invariants: "probably" }).some((e) => /invariants/i.test(e)));
  assert.ok(validateEmitOptions({ ...ok, proposals: -1 }).some((e) => /proposals/i.test(e)));
  assert.ok(validateEmitOptions({ ...ok, proposals: "many" }).some((e) => /proposals/i.test(e)));
  assert.ok(validateEmitOptions({ ...ok, pr: "not-a-number" }).some((e) => /pr/i.test(e)));
});

// ---------------------------------------------------------------------------
// CLI — verify reads comments from a file, so no forge call is needed
// ---------------------------------------------------------------------------

const runVerify = (comments, headSha, args = []) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "review-receipt-"));
  const file = path.join(dir, "comments.json");
  fs.writeFileSync(file, JSON.stringify({ comments }));
  const result = spawnSync(process.execPath, [script, "verify", "--comments-json", file, "--head", headSha, ...args], {
    encoding: "utf8",
  });
  return { ...result, json: result.stdout.trim() ? JSON.parse(result.stdout) : null };
};

test("CLI verify: current exits 0 and reports the bound sha", () => {
  const { status, json } = runVerify([receiptComment(SHA_A)], SHA_A);
  assert.equal(status, 0);
  assert.equal(json.current, true);
  assert.equal(json.status, "current");
  assert.equal(json.receipt.sha, SHA_A);
});

test("CLI verify: absent exits 3 with the missing-receipt code", () => {
  const { status, json } = runVerify([], SHA_A);
  assert.equal(status, 3);
  assert.equal(json.current, false);
  assert.equal(json.status, "absent");
  assert.equal(json.code, "missing-review-receipt");
});

test("CLI verify: stale exits 4 with the stale-receipt code and the stale sha", () => {
  const { status, json } = runVerify([receiptComment(SHA_B)], SHA_A);
  assert.equal(status, 4);
  assert.equal(json.current, false);
  assert.equal(json.status, "stale");
  assert.equal(json.code, "stale-review-receipt");
  assert.equal(json.receipt.sha, SHA_B);
  assert.equal(json.head, SHA_A);
});

test("CLI verify: a malformed --head is a usage error (exit 1), never a pass", () => {
  const { status, json } = runVerify([receiptComment(SHA_A)], "nope");
  assert.equal(status, 1);
  assert.equal(json, null, "usage errors print to stderr, not stdout");
});

test("CLI render: prints the exact body and performs no forge call", () => {
  const result = spawnSync(
    process.execPath,
    [script, "render", "--head", SHA_A, "--scope", "code", "--axes", "code", "--coverage", "AC1", "--manual", "none"],
    { encoding: "utf8", env: { ...process.env, PATH: "/nonexistent" } },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseReviewReceipt(result.stdout).sha, SHA_A);
});

test("CLI: an unknown command is a usage error (exit 1)", () => {
  const result = spawnSync(process.execPath, [script, "frobnicate"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /usage/i);
});

// ---------------------------------------------------------------------------
// CLI — emit refuses a moved head, through a fake `gh` on PATH
// ---------------------------------------------------------------------------

/** A fake `gh` that reports the PR head it is told to, and logs its invocations. */
const fakeGh = (dir, headReported) => {
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "gh.log");
  const fake = path.join(bin, "gh");
  fs.writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(" ") + "\\n");
process.stdout.write(JSON.stringify({ headRefOid: ${JSON.stringify(headReported)}, number: 240, comments: [] }));\n`,
  );
  fs.chmodSync(fake, 0o755);
  return { bin, log };
};

test("CLI emit: a PR head that differs from the reviewed head is refused, naming both heads", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "review-receipt-emit-"));
  const { bin, log } = fakeGh(dir, SHA_B);
  const result = spawnSync(
    process.execPath,
    [script, "emit", "--pr", "240", "--head", SHA_A, "--scope", "code", "--axes", "code", "--coverage", "AC1", "--manual", "none"],
    { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } },
  );
  assert.notEqual(result.status, 0, "a moved PR head must never emit a receipt");
  assert.equal(result.stdout.trim(), "", "no success report is printed");
  assert.match(result.stderr, new RegExp(SHA_B), "the refusal names the PR head");
  assert.match(result.stderr, new RegExp(SHA_A), "the refusal names the reviewed head");
  assert.match(result.stderr, /candidate changed during review/i);
  const calls = fs.readFileSync(log, "utf8");
  assert.doesNotMatch(calls, /pr comment/, "the refusal happens before any comment is posted");
});

test("CLI emit: a head equal to the reviewed head posts once and confirms it landed", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "review-receipt-emit-"));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "gh.log");
  const fake = path.join(bin, "gh");
  // The fake models the forge's own re-read: it echoes back the posted body as
  // a comment, so `emit`'s after-read sees a current marker at the reviewed head.
  fs.writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, args.join(" ") + "\\n");
if (args[0] === "pr" && args[1] === "comment") {
  const body = fs.readFileSync(0, "utf8");
  fs.writeFileSync(${JSON.stringify(path.join(dir, "posted.md"))}, body);
  process.exit(0);
}
const posted = fs.existsSync(${JSON.stringify(path.join(dir, "posted.md"))}) ? fs.readFileSync(${JSON.stringify(path.join(dir, "posted.md"))}, "utf8") : "";
process.stdout.write(JSON.stringify({ headRefOid: ${JSON.stringify(SHA_A)}, number: 240, comments: posted ? [{ body: posted }] : [] }));\n`,
  );
  fs.chmodSync(fake, 0o755);
  const result = spawnSync(
    process.execPath,
    [script, "emit", "--pr", "240", "--head", SHA_A, "--scope", "code", "--axes", "code", "--coverage", "AC1", "--manual", "none"],
    { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } },
  );
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.current, true);
  assert.equal(report.status, "current");
  assert.equal(report.posted, true);
  assert.equal(report.head, SHA_A);
  const calls = fs.readFileSync(log, "utf8").trim().split("\n");
  assert.equal(calls.filter((c) => c.startsWith("pr comment")).length, 1, "exactly one post");
});

console.log("PASS review-receipt: marker grammar, newest-wins, current/absent/stale, idempotent post, injection-safe body, emit refuses a moved head");
