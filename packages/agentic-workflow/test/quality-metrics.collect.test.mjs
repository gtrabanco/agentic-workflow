/**
 * quality-metrics.collect.test.mjs — the collector's corpus (feature 558,
 * issue #565, unit docs/features/558-quality-sensor/).
 *
 * Two layers, one contract:
 *
 *  - **The metric math over injected sources.** Every rule the issue asks for is
 *    pinned against a fake git/forge/corpus, so the assertions are the definition
 *    and no clock, network or repository decides them.
 *  - **The real readers.** The git reader parses a throwaway repository built
 *    with the shared fixture helpers, the corpus reader walks a throwaway
 *    unit-doc tree, and the forge reader is driven by a `gh` PATH-stub answering
 *    fixture JSON — the crate's established seam, because no suite contacts a
 *    forge.
 *
 * The failure states are the point of the corpus: a metric that cannot be
 * computed is `unavailable` with a declared reason and appears in `degraded`,
 * never a zero wearing a measurement's clothes.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { validateQualityMetrics } from "@gtrabanco/agentic-workflow-schema";
import {
  DEGRADATION_CODES,
  DEFAULT_WINDOW_DAYS,
  FORGE_SAMPLE_PULLS,
  collectQualityMetrics,
  median,
  readCorpus,
  readGit,
  revertTargetOf,
} from "../src/runner/sensors/quality-metrics.mjs";
import { commitFile, git, newRepo } from "./fixtures.mjs";

const UNTIL = "2026-11-16T00:00:00.000Z";
const SINCE = "2026-08-18T00:00:00.000Z";
const HEAD = "a".repeat(40);

/** An instant inside the window, `hour` hours after it started plus `day` days. */
const at = (day, hour = 0) => new Date(Date.parse(SINCE) + (day * 24 + hour) * 3_600_000).toISOString();

const commit = (oid, { at: instant = at(1), subject = "chore: work", body = "" } = {}) => ({
  oid,
  committed_at: instant,
  subject,
  body,
});

const revertOf = (oid, target, instant = at(2)) =>
  commit(oid, { at: instant, subject: `Revert "feat: ${target.slice(0, 7)}"`, body: `This reverts commit ${target}.` });

const pull = (number, { createdAt = at(10), mergedAt = at(12), mergeCommit = `m${number}`.padEnd(40, "0") } = {}) => ({
  number,
  created_at: createdAt,
  merged_at: mergedAt,
  merge_commit: mergeCommit,
});

const sample = (number, { mergedAt = at(12), firstCommitAt = at(2) } = {}) => ({
  number,
  merged_at: mergedAt,
  first_commit_at: firstCommitAt,
});

const createdPull = (number, { createdAt = at(10), firstReviewAt = null } = {}) => ({
  number,
  created_at: createdAt,
  first_review_at: firstReviewAt,
});

/** The default fake sources: an empty-but-readable project. */
const sources = (overrides = {}) => ({
  readGit: () => ({ ok: true, head: HEAD, commits: [], coverage: "complete" }),
  readForge: () => ({
    ok: true,
    merged: [],
    merged_truncated: false,
    commit_samples: [],
    samples_truncated: false,
    created: [],
    created_truncated: false,
  }),
  readCorpus: () => ({ ok: true, open_rows: 0, unit_docs: 0 }),
  ...overrides,
});

const collect = (overrides, options = {}) =>
  collectQualityMetrics({ repo: "/fixture", until: UNTIL, windowDays: DEFAULT_WINDOW_DAYS, sources: sources(overrides), ...options });

/** Every document this collector produces must satisfy its own contract. */
const collectValid = (overrides, options) => {
  const document = collect(overrides, options);
  const validation = validateQualityMetrics(document);
  assert.equal(validation.ok, true, validation.errors.join(" · "));
  return document;
};

// ---------------------------------------------------------------------------
// Window and provenance
// ---------------------------------------------------------------------------

test("the window is the trailing day count ending at the pinned instant", () => {
  const document = collectValid({});
  assert.deepEqual(document.window, { days: DEFAULT_WINDOW_DAYS, since: SINCE, until: UNTIL });
  assert.equal(DEFAULT_WINDOW_DAYS, 90);
});

test("a different window moves only its own since instant", () => {
  const document = collectValid({}, { windowDays: 7 });
  assert.equal(document.window.days, 7);
  assert.equal(document.window.since, "2026-11-09T00:00:00.000Z");
  assert.equal(document.window.until, UNTIL);
});

test("the source revision is the head the git read answered, and null without one", () => {
  assert.equal(collectValid({}).source_revision, HEAD);
  assert.equal(
    collectValid({ readGit: () => ({ ok: false, code: "unavailable-history-not-a-repository" }) }).source_revision,
    null,
  );
});

test("the document names its contract, version and schema", () => {
  const document = collectValid({});
  assert.equal(document.contract, "agentic-workflow/quality-metrics");
  assert.equal(document.version, 1);
  assert.equal(document.schema, "quality-metrics@1");
});

// ---------------------------------------------------------------------------
// Reversion ratio (S1)
// ---------------------------------------------------------------------------

test("reversion ratio is revert commits over total commits in the window", () => {
  const document = collectValid({
    readGit: () => ({
      ok: true,
      head: HEAD,
      coverage: "complete",
      commits: [
        commit("1".repeat(40)),
        commit("2".repeat(40), { subject: 'Revert "feat: x"', body: `This reverts commit ${"9".repeat(40)}.` }),
        commit("3".repeat(40)),
        commit("4".repeat(40)),
      ],
    }),
  });
  const row = document.metrics.reversion_ratio;
  assert.equal(row.value, 0.25);
  assert.equal(row.unit, "ratio");
  assert.equal(row.confidence, "derived");
  assert.equal(row.reason, null);
  assert.deepEqual(row.components, { revert_commits: 1, total_commits: 4 });
  assert.match(row.detail, /revert commits? of 4 commits/u);
});

test("a ratio that does not terminate is rounded, never printed raw", () => {
  const document = collectValid({
    readGit: () => ({
      ok: true,
      head: HEAD,
      coverage: "complete",
      commits: [revertOf("1".repeat(40), "x".repeat(40)), commit("2".repeat(40)), commit("3".repeat(40))],
    }),
  });
  assert.equal(document.metrics.reversion_ratio.value, 0.3333);
});

test("the revert heuristic is the subject OR the body, and nothing else", () => {
  // The three shapes the definitions document: subject-only, body-only, neither.
  assert.deepEqual(revertTargetOf('Revert "feat: a"', ""), { isRevert: true, target: null });
  assert.deepEqual(revertTargetOf("chore: x", `This reverts commit ${"b".repeat(40)}.`), {
    isRevert: true,
    target: "b".repeat(40),
  });
  assert.deepEqual(revertTargetOf("docs: mention revert handling", "nothing to see"), { isRevert: false, target: null });
  assert.deepEqual(revertTargetOf("Reverted the feature", ""), { isRevert: false, target: null });

  const document = collectValid({
    readGit: () => ({
      ok: true,
      head: HEAD,
      coverage: "complete",
      commits: [
        commit("1".repeat(40), { subject: 'Revert "feat: a"' }),
        commit("2".repeat(40), { body: `This reverts commit ${"b".repeat(40)}.` }),
        commit("3".repeat(40), { subject: "docs: revert handling" }),
      ],
    }),
  });
  assert.deepEqual(document.metrics.reversion_ratio.components, { revert_commits: 2, total_commits: 3 });
});

test("a history that truncates the window makes the commit ratio unavailable, never smaller", () => {
  const document = collectValid({
    readGit: () => ({ ok: true, head: HEAD, coverage: "truncated", commits: [commit("1".repeat(40))] }),
  });
  const row = document.metrics.reversion_ratio;
  assert.equal(row.confidence, "unavailable");
  assert.equal(row.value, null);
  assert.equal(row.reason, "unavailable-history-shallow");
  assert.ok(document.degraded.includes("unavailable-history-shallow"));
});

test("a shallow clone whose history still covers the window is measured, not degraded", () => {
  const document = collectValid({
    readGit: () => ({ ok: true, head: HEAD, coverage: "complete", commits: [commit("1".repeat(40))] }),
  });
  assert.equal(document.metrics.reversion_ratio.confidence, "derived");
  assert.deepEqual(document.degraded, []);
});

test("no commits in the window is a declared reason, not a zero ratio", () => {
  const document = collectValid({});
  const row = document.metrics.reversion_ratio;
  assert.equal(row.confidence, "unavailable");
  assert.equal(row.value, null);
  assert.equal(row.reason, "no-commits-in-window");
  assert.deepEqual(row.components, { revert_commits: 0, total_commits: 0 });
});

test("an unreadable git repository degrades the git-derived rows and names the cause", () => {
  const document = collectValid({
    readGit: () => ({ ok: false, code: "unavailable-history-not-a-repository" }),
    readForge: () => ({
      ok: true,
      merged: [pull(1), pull(2)],
      merged_truncated: false,
      commit_samples: [sample(1)],
      samples_truncated: false,
      created: [createdPull(1)],
      created_truncated: false,
    }),
  });
  assert.equal(document.metrics.reversion_ratio.reason, "unavailable-history-not-a-repository");
  assert.equal(document.metrics.change_failure_rate.reason, "unavailable-history-not-a-repository");
  assert.ok(document.degraded.includes("unavailable-history-not-a-repository"));
  // The forge rows are independent and stay measured.
  assert.equal(document.metrics.pr_volume.value, 1);
});

// ---------------------------------------------------------------------------
// Change-failure rate (S2)
// ---------------------------------------------------------------------------

test("change-failure rate links a revert's target oid to a merged pull's merge commit", () => {
  const reverted = "c".repeat(40);
  const document = collectValid({
    readGit: () => ({
      ok: true,
      head: HEAD,
      coverage: "complete",
      commits: [revertOf("1".repeat(40), reverted), commit("2".repeat(40))],
    }),
    readForge: () => ({
      ok: true,
      merged: [pull(1, { mergeCommit: reverted }), pull(2)],
      merged_truncated: false,
      commit_samples: [sample(1)],
      samples_truncated: false,
      created: [createdPull(1), createdPull(2)],
      created_truncated: false,
    }),
  });
  const row = document.metrics.change_failure_rate;
  assert.equal(row.value, 0.5);
  assert.equal(row.confidence, "derived");
  assert.deepEqual(row.components, { reverted_deploys: 1, deploys: 2 });
  assert.match(row.detail, /merge commit/u);
});

test("a revert whose target is no merged pull's merge commit is not linked, and the row says so", () => {
  const document = collectValid({
    readGit: () => ({
      ok: true,
      head: HEAD,
      coverage: "complete",
      commits: [revertOf("1".repeat(40), "d".repeat(40))],
    }),
    readForge: () => ({
      ok: true,
      merged: [pull(1), pull(2)],
      merged_truncated: false,
      commit_samples: [],
      samples_truncated: false,
      created: [],
      created_truncated: false,
    }),
  });
  const row = document.metrics.change_failure_rate;
  assert.equal(row.value, 0);
  assert.equal(row.confidence, "derived");
  assert.deepEqual(row.components, { reverted_deploys: 0, deploys: 2 });
});

test("deploys merged outside the window are not in the denominator", () => {
  const document = collectValid({
    readGit: () => ({ ok: true, head: HEAD, coverage: "complete", commits: [commit("1".repeat(40))] }),
    readForge: () => ({
      ok: true,
      merged: [pull(1, { mergedAt: at(2) }), pull(2, { mergedAt: "2026-11-17T00:00:00.000Z" })],
      merged_truncated: false,
      commit_samples: [],
      samples_truncated: false,
      created: [],
      created_truncated: false,
    }),
  });
  assert.deepEqual(document.metrics.change_failure_rate.components, { reverted_deploys: 0, deploys: 1 });
});

test("no deploys in the window is declared, never a zero rate", () => {
  const document = collectValid({ readGit: () => ({ ok: true, head: HEAD, coverage: "complete", commits: [commit("1".repeat(40))] }) });
  const row = document.metrics.change_failure_rate;
  assert.equal(row.confidence, "unavailable");
  assert.equal(row.value, null);
  assert.equal(row.reason, "no-deploys-in-window");
});

// ---------------------------------------------------------------------------
// Lead time for change (S3)
// ---------------------------------------------------------------------------

test("lead time is the median of merge minus first commit, in hours", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [pull(1), pull(2), pull(3)],
      merged_truncated: false,
      commit_samples: [
        sample(1, { mergedAt: at(0, 12), firstCommitAt: at(0, 10) }),
        sample(2, { mergedAt: at(0, 12), firstCommitAt: at(0, 2) }),
        sample(3, { mergedAt: at(0, 12), firstCommitAt: at(0, 6) }),
      ],
      samples_truncated: false,
      created: [],
      created_truncated: false,
    }),
  });
  const row = document.metrics.lead_time_for_change;
  assert.equal(row.value, 6);
  assert.equal(row.unit, "hours");
  assert.equal(row.confidence, "measured");
  assert.deepEqual(row.components, { merged_pulls: 3, sampled_pulls: 3 });
  assert.match(row.detail, /median/u);
});

test("a truncated sample demotes the lead time to derived", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [pull(1), pull(2), pull(3)],
      merged_truncated: false,
      commit_samples: [sample(1, { mergedAt: at(12), firstCommitAt: at(2) })],
      samples_truncated: true,
      created: [],
      created_truncated: false,
    }),
  });
  assert.equal(document.metrics.lead_time_for_change.confidence, "derived");
  assert.equal(document.metrics.lead_time_for_change.components.sampled_pulls, 1);
  assert.match(document.metrics.lead_time_for_change.detail, /sampled/u);
});

test("the sample bound is published, so a reader can tell a sample from the population", () => {
  assert.ok(Number.isInteger(FORGE_SAMPLE_PULLS) && FORGE_SAMPLE_PULLS > 0 && FORGE_SAMPLE_PULLS <= 100);
});

test("a sample row without a usable first commit is not counted as zero hours", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [pull(1)],
      merged_truncated: false,
      commit_samples: [sample(1, { firstCommitAt: null, mergedAt: at(12) })],
      samples_truncated: false,
      created: [],
      created_truncated: false,
    }),
  });
  const row = document.metrics.lead_time_for_change;
  assert.equal(row.confidence, "unavailable");
  assert.equal(row.value, null);
  assert.equal(row.reason, "no-pulls-in-window");
  assert.deepEqual(row.components, { merged_pulls: 1, sampled_pulls: 0 });
});

// ---------------------------------------------------------------------------
// PR volume and review latency (S4)
// ---------------------------------------------------------------------------

test("PR volume reports the pulls opened in the window with merged beside it", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [pull(1), pull(2)],
      merged_truncated: false,
      commit_samples: [],
      samples_truncated: false,
      created: [createdPull(1), createdPull(2), createdPull(3)],
      created_truncated: false,
    }),
  });
  const row = document.metrics.pr_volume;
  assert.equal(row.value, 3);
  assert.equal(row.unit, "count");
  assert.equal(row.confidence, "measured");
  assert.deepEqual(row.components, { opened_pulls: 3, merged_pulls: 2 });
});

test("a capped deploy read demotes every row whose denominator it truncates", () => {
  const document = collectValid({
    readGit: () => ({ ok: true, head: HEAD, coverage: "complete", commits: [commit("1".repeat(40))] }),
    readForge: () => ({
      ok: true,
      merged: [pull(1), pull(2)],
      merged_truncated: true,
      commit_samples: [sample(1, { mergedAt: at(12), firstCommitAt: at(2) })],
      samples_truncated: false,
      created: [createdPull(1)],
      created_truncated: false,
    }),
  });
  // The deploy list is a subset of the window's merges, so no row resting on it
  // may still call itself a measurement.
  assert.equal(document.metrics.pr_volume.confidence, "derived");
  assert.equal(document.metrics.lead_time_for_change.confidence, "derived");
  assert.match(document.metrics.pr_volume.detail, /capped/u);
  assert.match(document.metrics.change_failure_rate.detail, /capped/u);
});

test("a truncated created list demotes the volume to derived", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [],
      merged_truncated: false,
      commit_samples: [],
      samples_truncated: false,
      created: [createdPull(1)],
      created_truncated: true,
    }),
  });
  assert.equal(document.metrics.pr_volume.confidence, "derived");
});

test("review latency is the median open-to-first-review delay", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [],
      merged_truncated: false,
      commit_samples: [],
      samples_truncated: false,
      created: [
        createdPull(1, { createdAt: at(1), firstReviewAt: at(1, 2) }),
        createdPull(2, { createdAt: at(1), firstReviewAt: at(1, 4) }),
        createdPull(3, { createdAt: at(1), firstReviewAt: null }),
      ],
      created_truncated: false,
    }),
  });
  const row = document.metrics.review_latency;
  assert.equal(row.value, 3);
  assert.equal(row.unit, "hours");
  assert.deepEqual(row.components, { reviewed_pulls: 2, opened_pulls: 3 });
});

test("no reviewed pull in the window is declared, never a zero latency", () => {
  const document = collectValid({
    readForge: () => ({
      ok: true,
      merged: [],
      merged_truncated: false,
      commit_samples: [],
      samples_truncated: false,
      created: [createdPull(1), createdPull(2)],
      created_truncated: false,
    }),
  });
  const row = document.metrics.review_latency;
  assert.equal(row.confidence, "unavailable");
  assert.equal(row.value, null);
  assert.equal(row.reason, "no-reviews-in-window");
  assert.deepEqual(row.components, { reviewed_pulls: 0, opened_pulls: 2 });
});

// ---------------------------------------------------------------------------
// Escaped-defect slot (S5)
// ---------------------------------------------------------------------------

test("the escaped-defect slot reports the corpus' open rows with the document count", () => {
  const document = collectValid({ readCorpus: () => ({ ok: true, open_rows: 2, unit_docs: 3 }) });
  const row = document.metrics.escaped_defects;
  assert.equal(row.value, 2);
  assert.equal(row.confidence, "measured");
  assert.deepEqual(row.components, { open_findings: 2, unit_docs: 3 });
  assert.match(row.detail, /corpus/u);
});

test("an absent corpus is unavailable, never zero escaped defects", () => {
  const document = collectValid({ readCorpus: () => ({ ok: false, code: "unavailable-findings-corpus" }) });
  const row = document.metrics.escaped_defects;
  assert.equal(row.confidence, "unavailable");
  assert.equal(row.value, null);
  assert.equal(row.reason, "unavailable-findings-corpus");
  assert.ok(document.degraded.includes("unavailable-findings-corpus"));
});

// ---------------------------------------------------------------------------
// The fail-closed matrix (S12)
// ---------------------------------------------------------------------------

test("every forge failure code degrades the four forge rows and nothing else", () => {
  const gitSide = { ok: true, head: HEAD, coverage: "complete", commits: [commit("1".repeat(40))] };
  for (const code of ["unavailable-forge-missing-cli", "unavailable-forge-timeout", "unavailable-forge-auth", "unavailable-forge-no-network", "unavailable-forge-malformed-answer"]) {
    const document = collectValid({ readGit: () => gitSide, readForge: () => ({ ok: false, code }) });
    for (const name of ["change_failure_rate", "lead_time_for_change", "pr_volume", "review_latency"]) {
      const row = document.metrics[name];
      assert.equal(row.confidence, "unavailable", `${name} degrades on ${code}`);
      assert.equal(row.value, null, `${name} carries no value on ${code}`);
      assert.equal(row.reason, code, `${name} names ${code}`);
    }
    assert.deepEqual(document.degraded, [code]);
    // The git-derived rows are unaffected by a forge failure.
    assert.equal(document.metrics.reversion_ratio.confidence, "derived");
  }
});

test("the published degradation codes are exactly the ones the collector can emit", () => {
  assert.deepEqual([...DEGRADATION_CODES].sort(), [
    "unavailable-findings-corpus",
    "unavailable-forge-auth",
    "unavailable-forge-malformed-answer",
    "unavailable-forge-missing-cli",
    "unavailable-forge-no-network",
    "unavailable-forge-timeout",
    "unavailable-history-not-a-repository",
    "unavailable-history-shallow",
    "unavailable-history-unreadable",
  ]);
});

test("degraded is deduplicated and ordered, so two runs agree", () => {
  const document = collectValid({
    readGit: () => ({ ok: false, code: "unavailable-history-unreadable" }),
    readForge: () => ({ ok: false, code: "unavailable-forge-missing-cli" }),
    readCorpus: () => ({ ok: false, code: "unavailable-findings-corpus" }),
  });
  assert.deepEqual(document.degraded, [
    "unavailable-findings-corpus",
    "unavailable-forge-missing-cli",
    "unavailable-history-unreadable",
  ]);
});

test("the same sources and the same window produce byte-identical documents", () => {
  const overrides = {
    readGit: () => ({ ok: true, head: HEAD, coverage: "complete", commits: [revertOf("1".repeat(40), "e".repeat(40)), commit("2".repeat(40))] }),
    readForge: () => ({
      ok: true,
      merged: [pull(1, { mergeCommit: "e".repeat(40) })],
      merged_truncated: false,
      commit_samples: [sample(1, { mergedAt: at(12), firstCommitAt: at(3) })],
      samples_truncated: false,
      created: [createdPull(1, { createdAt: at(1), firstReviewAt: at(1, 2) })],
      created_truncated: false,
    }),
    readCorpus: () => ({ ok: true, open_rows: 1, unit_docs: 4 }),
  };
  const first = JSON.stringify(collect(overrides));
  const second = JSON.stringify(collect(overrides));
  assert.equal(first, second);
});

test("median is the middle of an odd set and the mean of the middle pair of an even one", () => {
  assert.equal(median([3]), 3);
  assert.equal(median([1, 3, 5]), 3);
  assert.equal(median([1, 3, 5, 9]), 4);
  assert.equal(median([]), null);
});

// ---------------------------------------------------------------------------
// The real git reader
// ---------------------------------------------------------------------------

function gitFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "qm-git-"));
  const dir = newRepo(root, "repo", "main");
  const clean = () => rmSync(root, { recursive: true, force: true });
  return { root, dir, clean };
}

/** A window wide enough to be independent of the fixture's wall-clock commits. */
const REAL_SINCE = "2020-01-01T00:00:00.000Z";
const REAL_UNTIL = "2030-01-01T00:00:00.000Z";

test("the git reader returns the window's commits with their revert targets", () => {
  const { dir, clean } = gitFixture();
  try {
    commitFile(dir, "feature.txt", "one\n");
    const reverted = git(dir, "rev-parse", "HEAD");
    git(dir, "revert", "--no-edit", "HEAD");
    commitFile(dir, "other.txt", "two\n");

    const result = readGit({ repo: dir, since: REAL_SINCE, until: REAL_UNTIL });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.coverage, "complete");
    assert.equal(result.head, git(dir, "rev-parse", "HEAD"));
    assert.equal(result.commits.length, 4);
    const reverts = result.commits.filter((entry) => revertTargetOf(entry.subject, entry.body).isRevert);
    assert.equal(reverts.length, 1);
    assert.equal(revertTargetOf(reverts[0].subject, reverts[0].body).target, reverted);
  } finally {
    clean();
  }
});

test("the git reader reports a truncated coverage only when a shallow cut could fall inside the window", () => {
  const { root, dir, clean } = gitFixture();
  try {
    commitFile(dir, "only.txt", "one\n");
    // A complete history covers any window, even one that starts before the
    // repository's first commit: nothing was cut off.
    const complete = readGit({ repo: dir, since: REAL_SINCE, until: REAL_UNTIL });
    assert.equal(complete.ok, true, JSON.stringify(complete));
    assert.equal(complete.coverage, "complete");

    // The same window on a depth-1 clone: the cut may fall inside it.
    const clone = path.join(root, "shallow");
    git(root, "clone", "--depth", "1", `file://${dir}`, clone);
    assert.equal(git(clone, "rev-parse", "--is-shallow-repository"), "true");
    const truncated = readGit({ repo: clone, since: REAL_SINCE, until: REAL_UNTIL });
    assert.equal(truncated.ok, true, JSON.stringify(truncated));
    assert.equal(truncated.coverage, "truncated");
    assert.ok(truncated.commits.length >= 1);
  } finally {
    clean();
  }
});

test("the git reader refuses a directory that is not a repository", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "qm-notrepo-"));
  try {
    const result = readGit({ repo: root, since: SINCE, until: UNTIL });
    assert.equal(result.ok, false);
    assert.equal(result.code, "unavailable-history-not-a-repository");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// The real corpus reader
// ---------------------------------------------------------------------------

test("the corpus reader counts the open rows of the unit docs it can see", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "qm-corpus-"));
  try {
    const doc = (slug, rows) => {
      const dir = path.join(root, "docs", "features", slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(dir, "SPEC.md"),
        [
          "# unit",
          "",
          "## Findings",
          "",
          "| id | S# / file:line | axis | severity | impact | class | route |",
          "|---|---|---|---|---|---|---|",
          ...rows,
          "",
          "## Log",
          "",
        ].join("\n"),
      );
    };
    doc("100-one", ["| F1 | S1 · a.mjs:1 | code | WARNING | blocking | source | fold |"]);
    doc("101-two", [
      "| F2 | S2 · b.mjs:2 | code | BLOCKER | blocking | source | fold |",
      "| F3 | S3 · c.mjs:3 | docs | SUGGESTION | docs-only | source | fold |",
    ]);
    doc("102-three", []);

    const result = readCorpus({ repo: root });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.unit_docs, 3);
    assert.equal(result.open_rows, 3);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the corpus reader refuses a tree with no unit-doc corpus", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "qm-nocorpus-"));
  try {
    const result = readCorpus({ repo: root });
    assert.equal(result.ok, false);
    assert.equal(result.code, "unavailable-findings-corpus");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
