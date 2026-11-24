#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/delivery-conditions/index.mjs,scripts/delivery-conditions.mjs obligations=contract,failure-path,boundary

/**
 * delivery-conditions.test.mjs — a delivery condition is re-checked by a machine
 * (issue #704).
 *
 * The defect class is not hypothetical: #301 documented the repair-receipt gap
 * and closed with the reopen condition `Reabrir #301 cuando #260 lande`, written
 * in a **comment**. #260 landed CLOSED, nobody reopened, and two consumer units
 * later (fix-101, fix-334) hit the same gap. The condition lived only until the
 * session that wrote it died. This suite is the frozen-failure corpus of that
 * defect plus the two mechanisms the unit ships:
 *
 *   guard   `--close-check <n>` refuses closing an issue as covered by an issue
 *           that is still open — the cover must be delivered, or the issue stays
 *           open with a native `blocked-by` link;
 *   sweep   `--sweep` re-checks every recorded condition against the cited
 *           issues' states and reports the ones whose follow-up came due.
 *
 * Fixtures are in-memory corpora in the shapes the forge read produces
 * (`{number, state, body, comments}`) plus one throwaway directory for the
 * filesystem cases, which is removed before the suite ends. Nothing here reads
 * the live forge, so the cases are deterministic and offline.
 *
 * Usage
 *   bun test scripts/delivery-conditions.test.mjs
 *   node --test scripts/delivery-conditions.test.mjs     (fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const MODULE_REL = "packages/agentic-workflow/src/delivery-conditions/index.mjs";
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

// The module is imported at the suite's head so the red commit fails on the
// missing module — the red-first obligation names this exact failure — and every
// later case judges the module a target project installs, never a copy.
const dc = await import("../packages/agentic-workflow/src/delivery-conditions/index.mjs");

/** One corpus entry, in the shape the guarded forge read produces. */
const issue = (number, state, body = "", comments = []) => ({ number, state, body, comments });

/** The #301 bytes, verbatim from the comment that carried them (PE-003). */
const S301 = {
  body: "",
  comments: [
    "Cerrada como cubierta por #260 (subagent-first execution)\n\nEl `REPAIR-RECEIPT` que `fold-findings` imprime para lotes docs-only no tiene receptor en la máquina.\n\nReabrir #301 cuando #260 lande",
  ],
};

/** A throwaway directory, removed before the suite ends. */
function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-conditions-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Run `fn` with stdout/stderr captured, so the exit contract is observable. */
async function capture(fn) {
  const out = [];
  const err = [];
  const stdout = process.stdout.write.bind(process.stdout);
  const stderr = process.stderr.write.bind(process.stderr);
  process.stdout.write = (chunk) => { out.push(String(chunk)); return true; };
  process.stderr.write = (chunk) => { err.push(String(chunk)); return true; };
  try {
    const code = await fn();
    return { code, stdout: out.join(""), stderr: err.join("") };
  } finally {
    process.stdout.write = stdout;
    process.stderr.write = stderr;
  }
}

/* ------------------------------------------------------------------ the corpus */

test("#301: an issue closed with \"reopen when #260 lands\", whose #260 has since closed, is reported condition-stalled", () => {
  // The frozen failure, in the language it was written in. #301 is CLOSED, #260
  // landed CLOSED, and the recorded follow-up ("reopen #301") is due and unrun.
  const report = dc.evaluate({
    issues: [issue(301, "CLOSED", S301.body, S301.comments), issue(260, "CLOSED")],
  });

  const condition = report.conditions.find((row) => row.issue === 301);
  assert.ok(condition, "the #301 comment's condition is extracted, not skipped");
  assert.equal(condition.kind, "reopen-when");
  assert.deepEqual(condition.cites, [260]);
  assert.equal(condition.verdict, "stalled");
  assert.equal(condition.via, "comment");

  const finding = report.findings.find((row) => row.issue === 301);
  assert.ok(finding, "a due follow-up is a finding");
  assert.equal(finding.code, "condition-stalled");
  assert.equal(report.verdict, "VIOLATION");
});

test("the same shape in English is the same stall", () => {
  // The English spelling of S2's own words, so the pattern table is not one
  // language's table with a second bolted on for one issue.
  const report = dc.evaluate({
    issues: [issue(301, "CLOSED", "Reopen when #260 lands."), issue(260, "CLOSED")],
  });
  assert.equal(report.conditions.find((row) => row.issue === 301)?.verdict, "stalled");
  assert.equal(report.findings.find((row) => row.issue === 301)?.code, "condition-stalled");
});

test("#301 while #260 is still open stays pending: the follow-up is simply not due yet", () => {
  const report = dc.evaluate({
    issues: [issue(301, "CLOSED", S301.body, S301.comments), issue(260, "OPEN")],
  });
  assert.equal(report.conditions.find((row) => row.issue === 301)?.verdict, "pending");
  assert.deepEqual(report.findings, []);
  assert.equal(report.verdict, "PASS");
});

test("the sweep extracts covered-by, reopen-when, proceeds-when, waits-for and retire-when from a corpus", () => {
  const corpus = [
    issue(1, "OPEN", "Closed as covered by #11."),
    issue(2, "OPEN", "Reopen when #12 lands."),
    issue(3, "OPEN", "This proceeds when #13 is live."),
    issue(4, "OPEN", "It waits for #14 to land."),
    issue(5, "OPEN", "Retire when #15 closes."),
    issue(11, "OPEN"),
    issue(12, "OPEN"),
    issue(13, "OPEN"),
    issue(14, "OPEN"),
    issue(15, "OPEN"),
  ];
  const report = dc.evaluate({ issues: corpus });
  assert.deepEqual(
    report.conditions.map((row) => row.kind).sort(),
    ["covered-by", "proceeds-when", "reopen-when", "retire-when", "waits-for"],
  );
  assert.deepEqual(report.conditions.map((row) => row.issue).sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test("the #301 comment's Spanish form is extracted", () => {
  const extracted = dc.extractConditions(S301.comments[0]);
  const kinds = extracted.map((row) => row.kind);
  assert.ok(kinds.includes("covered-by"), "cerrada como cubierta por #N is a coverage condition");
  assert.ok(kinds.includes("reopen-when"), "reabrir … cuando #N is a reopen condition");
  assert.deepEqual(extracted.find((row) => row.kind === "reopen-when").cites, [260]);
});

test("one case per published verdict, and no row left unjudged", () => {
  // `satisfied` — the delivery the condition waits for has landed, and the issue
  // is still open, so the work can proceed.
  assert.equal(
    dc.judgeCondition({ kind: "waits-for", cites: [20], citing: "OPEN", states: { 20: "CLOSED" } }),
    "satisfied",
  );
  // `pending` — the cited subject has not landed yet.
  assert.equal(
    dc.judgeCondition({ kind: "reopen-when", cites: [20], citing: "CLOSED", states: { 20: "OPEN" } }),
    "pending",
  );
  // `stalled` — the follow-up is due (the #301 shape).
  assert.equal(
    dc.judgeCondition({ kind: "reopen-when", cites: [20], citing: "CLOSED", states: { 20: "CLOSED" } }),
    "stalled",
  );
  // `unresolved` — the machine cannot read the cited issue's state.
  assert.equal(
    dc.judgeCondition({ kind: "covered-by", cites: [20], citing: "CLOSED", states: {} }),
    "unresolved",
  );
  assert.deepEqual([...dc.CONDITION_VERDICTS], ["satisfied", "pending", "stalled", "unresolved"]);
});

test("a condition citing no issue number is condition-uncarried, never a silent skip", () => {
  const report = dc.evaluate({ issues: [issue(7, "OPEN", "This waits for the forge team.")] });
  const advisory = report.advisories.find((row) => row.issue === 7);
  assert.ok(advisory, "an uncarried condition is printed, never dropped");
  assert.equal(advisory.code, "condition-uncarried");
  assert.deepEqual(report.findings, [], "an uncarried phrasing is advisory, never a stall");
  assert.equal(report.verdict, "PASS");
});

/* ------------------------------------------------------------- close-time guard */

test("close-check refuses covered-by against an OPEN cited issue, naming the blocked-by route", async () => {
  const report = dc.closeCheck({
    issue: issue(704, "OPEN", "Closed as covered by #710, which carries the repair."),
    states: { 704: "OPEN", 710: "OPEN" },
  });
  assert.equal(report.refusals.length, 1);
  assert.equal(report.refusals[0].code, "covered-by-open");
  assert.equal(report.refusals[0].issue, 704);
  assert.deepEqual(report.refusals[0].cites, [710]);
  assert.match(report.refusals[0].detail, /blocked-by/u);
  assert.equal(dc.render({ ...report, mode: "close-check 704" }).includes("verdict VIOLATION"), true);
});

test("close-check passes when the cover is already delivered", () => {
  const report = dc.closeCheck({
    issue: issue(704, "OPEN", "Closed as covered by #710."),
    states: { 704: "OPEN", 710: "CLOSED" },
  });
  assert.deepEqual(report.refusals, []);
});

test("close-check passes an issue carrying no delivery condition", () => {
  const report = dc.closeCheck({ issue: issue(704, "OPEN", "A plain issue body."), states: { 704: "OPEN" } });
  assert.deepEqual(report.refusals, []);
  assert.deepEqual(report.conditions, []);
});

/* ------------------------------------------------------------------- the corpus */

test("the roadmap corpus is evaluated: a done fix row citing an open issue is a finding", () => {
  const report = dc.evaluate({
    issues: [issue(710, "OPEN")],
    roadmapRows: [{ issue: 667, status: "done · [#682](https://example.test/682)", notes: "closed as covered by #710" }],
  });
  const finding = report.findings.find((row) => row.issue === 667);
  assert.ok(finding, "a done roadmap row is judged CLOSED");
  assert.equal(finding.code, "covered-by-open");
  assert.equal(finding.via, "roadmap");
});

test("a roadmap row still in flight is judged open, so its coverage claim is only pending", () => {
  const report = dc.evaluate({
    issues: [issue(710, "OPEN")],
    roadmapRows: [{ issue: 667, status: "in-progress", notes: "closed as covered by #710" }],
  });
  assert.deepEqual(report.findings, []);
  assert.equal(report.conditions.find((row) => row.issue === 667)?.verdict, "pending");
});

test("a cache file is deterministic; a failed forge read degrades by name and never reads as an empty corpus", async (t) => {
  const dir = scratch(t);
  const cache = path.join(dir, "issues.json");
  fs.writeFileSync(
    cache,
    JSON.stringify([issue(301, "CLOSED", S301.body, S301.comments), issue(260, "CLOSED")]),
    "utf8",
  );

  const first = await dc.readCorpus({ issuesFile: cache });
  const second = await dc.readCorpus({ issuesFile: cache });
  assert.deepEqual(first, second, "the cache path is a pure read");
  assert.deepEqual(first.degradations, []);
  assert.equal(first.truncated, false);
  assert.equal(first.issues.length, 2);

  const broken = await dc.readCorpus({ issuesFile: path.join(dir, "absent.json") });
  assert.deepEqual(broken.issues, []);
  assert.equal(broken.degradations.length, 1);
  assert.match(broken.degradations[0], /^unavailable-forge-issues-file-/u);

  const missingCli = await dc.readCorpus({ ghBin: path.join(dir, "no-such-gh") });
  assert.deepEqual(missingCli.issues, [], "an unreachable forge is not an empty corpus presented as truth");
  assert.match(missingCli.degradations[0] ?? "", /^unavailable-forge-issue-list-/u);
});

test("a corpus read that hits its limit declares the truncation", () => {
  const report = dc.evaluate({
    issues: [issue(1, "OPEN", "Reopen when #2 lands."), issue(2, "OPEN")],
    limit: 2,
  });
  assert.equal(report.corpus.truncated, true);
  assert.ok(
    report.degradations.includes("corpus-truncated-at-limit"),
    "a truncated corpus says so instead of reading as complete",
  );
});

/* --------------------------------------------------------------- output contract */

test("two runs over one corpus print identical bytes, and --json carries the same facts", () => {
  const input = {
    issues: [issue(301, "CLOSED", S301.body, S301.comments), issue(260, "CLOSED")],
  };
  const once = dc.render(dc.evaluate(input));
  const twice = dc.render(dc.evaluate(input));
  assert.equal(once, twice, "no clock, no path, no hash: the same corpus prints the same block");
  assert.doesNotMatch(once, /\/(?:home|tmp|Users)\//u, "no absolute path reaches the receipt");

  const json = JSON.parse(JSON.stringify(dc.evaluate(input)));
  assert.equal(json.verdict, "VIOLATION");
  assert.equal(json.conditions[0].issue, 301);
  assert.equal(json.findings[0].code, "condition-stalled");
  assert.equal(json.mode, "sweep");
});

test("the sweep writes nothing and prints no text from the corpus", async (t) => {
  const dir = scratch(t);
  const cache = path.join(dir, "issues.json");
  fs.writeFileSync(
    cache,
    JSON.stringify([
      issue(301, "CLOSED", "UNIQUE-CORPUS-MARKER-42", [`UNIQUE-CORPUS-MARKER-42\n\nReabrir #301 cuando #260 lande`]),
      issue(260, "CLOSED"),
    ]),
    "utf8",
  );
  const before = fs.readdirSync(dir).sort();

  const run = await capture(() => dc.main(["--sweep", "--issues-file", cache]));
  assert.equal(run.code, 1, "the sweep reports and exits non-zero on findings");
  assert.equal(fs.readdirSync(dir).sort().join(","), before.join(","), "the sweep creates no file");
  assert.ok(!run.stdout.includes("UNIQUE-CORPUS-MARKER-42"), "no third-party text reaches the receipt");

  const source = read(MODULE_REL);
  assert.doesNotMatch(source, /writeFileSync|appendFileSync|unlinkSync|rmSync/u, "the module has no write path");
  assert.doesNotMatch(source, /"issue",\s*"close"|"issue",\s*"edit"|"issue",\s*"comment"/u, "the module mutates no forge state");
});

test("the exit contract is 0 clean, 1 findings, 2 usage, and stderr carries no receipt line", async () => {
  const clean = await capture(() => dc.main(["--close-check", "704", "--issues-file", "/nonexistent.json"]));
  assert.equal(clean.code, 2, "an unreadable cache cannot be mistaken for a clean answer");
  assert.match(clean.stderr, /^usage: /mu);
  assert.equal(clean.stdout, "");

  const usage = await capture(() => dc.main(["--close-check"]));
  assert.equal(usage.code, 2);

  const unknown = await capture(() => dc.main(["--nonsense"]));
  assert.equal(unknown.code, 2);
  assert.match(unknown.stderr, /unknown argument/u);
});

/* ------------------------------------------------------- the declared surfaces */

test("ISSUE_PROCESS.md states the condition lifecycle and its commands", () => {
  const text = read("skills/triage-issue/references/ISSUE_PROCESS.md");
  assert.match(text, /delivery-conditions --close-check/u, "the close path names the guard command");
  assert.match(text, /delivery-conditions --sweep/u, "the lifecycle names the sweep");
  assert.match(text, /delivery-condition@1/u, "the pattern table is declared where the process owns it");
});

test("the declared pattern table equals the module's table (both directions)", () => {
  const text = read("skills/triage-issue/references/ISSUE_PROCESS.md");
  const block = /```text\ndelivery-condition@1\n([\s\S]*?)```/u.exec(text);
  assert.ok(block, "the delivery-condition@1 block is fenced and versioned");

  const lines = block[1].split("\n").filter((line) => line.includes("|"));
  const [header, ...rows] = lines;
  const columns = header.split("|").map((cell) => cell.trim());
  const kindAt = columns.indexOf("kind");
  const phraseAt = columns.indexOf("phrase");
  assert.ok(kindAt > 0 && phraseAt > 0, "the block declares kind and phrase columns");

  const declared = new Set();
  for (const row of rows) {
    const cells = row.split("|").map((cell) => cell.trim());
    for (const phrase of (cells[phraseAt] ?? "").split("·")) {
      const clean = phrase.trim();
      if (clean !== "") declared.add(`${cells[kindAt]}::${clean}`);
    }
  }

  const expected = new Set(dc.CONDITION_PATTERNS.map((row) => `${row.kind}::${row.phrase}`));
  assert.deepEqual([...declared].sort(), [...expected].sort(), "the doc and the module state the same table");
});

test("the scheduled workflow runs the sweep on a cron and fails on findings", () => {
  const workflow = read(".github/workflows/delivery-conditions.yml");
  assert.match(workflow, /^on:\n(?:.*\n)*?\s+schedule:/mu, "the workflow is scheduled");
  assert.match(workflow, /cron:\s*"[^"]+"/u, "the schedule names a cron expression");
  assert.match(workflow, /workflow_dispatch/u, "and an operator can run it by hand");
  assert.match(workflow, /delivery-conditions --sweep/u, "it runs the sweep");
  assert.match(workflow, /GITHUB_STEP_SUMMARY/u, "the block lands in the run summary");
  assert.doesNotMatch(workflow, /continue-on-error/u, "a findings exit is never swallowed");
  assert.doesNotMatch(workflow, /delivery-conditions --sweep[^\n]*\|\|\s*true/u, "and never masked with a shell fallback");
});
