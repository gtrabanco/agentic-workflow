#!/usr/bin/env node

/**
 * quality-metrics — the project-quality sensor (feature 558, issue #565).
 *
 * `workflow-status` measures workflow *state*; this measures workflow *quality*:
 * the DORA four keys plus the reversion ratio, read from git history and forge
 * data and printed as one `quality-metrics@1` document (the contract, its
 * vocabularies and its JSON Schema live in the schema package; the definitions'
 * one home is the crate README's `quality-metrics@1` block).
 *
 * Three disciplines the shape enforces:
 *
 *   * **Read-only.** Every git and forge call is a read. The only write this
 *     module can perform is the CLI's `--out`, and nothing else in the process
 *     opens a file for writing.
 *   * **Fail closed, declared.** A metric that cannot be computed is
 *     `unavailable` with a reason, and that reason is also listed in
 *     `degraded`. A zero is only ever a measurement when it *is* one:
 *     `no-commits-in-window` and `no-reviews-in-window` say so instead of
 *     reporting `0`.
 *   * **One owner per fact.** The findings corpus is read through the crate's
 *     existing `findingsRows`/`openRows` parsers (the fold queue's own readers),
 *     the document is validated by the schema package's validator before it
 *     leaves this module, and the metric definitions live in exactly one
 *     document.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  QUALITY_METRICS_CONTRACT_ID,
  QUALITY_METRICS_LIMITS,
  QUALITY_METRICS_SCHEMA,
  QUALITY_METRICS_VERSION,
  validateQualityMetrics,
} from "@gtrabanco/agentic-workflow-schema";

// The fold queue's own readers: a second parser would let the same findings row
// answer "open" to one consumer and "folded" to the other (#224's defect class).
import { findingsRows, openRows } from "../unit-route.mjs";

/** The trailing window the issue names as the default (S6). */
export const DEFAULT_WINDOW_DAYS = 90;

/**
 * How many merged pulls the lead-time read samples. `gh pr list --json commits`
 * builds a GraphQL query whose `authors` connection explodes past GitHub's
 * 500,000-node ceiling at ~100 pulls (measured: 40 answers, 100 fails), so the
 * first-commit read is a bounded sample and a reader is told so.
 */
export const FORGE_SAMPLE_PULLS = 25;

/** How many merged pulls the deploy read asks for before declaring truncation. */
export const MERGED_PULLS_CAP = 1000;

/** How many created pulls the volume/latency read asks for before declaring truncation. */
export const CREATED_PULLS_CAP = 1000;

/** Bound for one git subprocess, in milliseconds. */
export const COMMAND_TIMEOUT_MS = 15_000;

/** Bound for one forge (`gh`) read, in milliseconds. */
export const FORGE_TIMEOUT_MS = 10_000;

/** Bound for the whole forge dimension: three reads share it. */
export const FORGE_DIMENSION_MS = 30_000;

/** A refused invocation (bad flag, bad value): nothing was measured. */
export const REFUSAL_EXIT_CODE = 2;

/** A fatal, unexpected read: the sensor failed, and says so on stderr. */
export const FATAL_EXIT_CODE = 1;

/**
 * The degradation codes this collector can emit — the closed set the definitions
 * document, so a consumer switches on a known vocabulary instead of prose.
 */
export const DEGRADATION_CODES = Object.freeze([
  "unavailable-forge-auth",
  "unavailable-forge-malformed-answer",
  "unavailable-forge-missing-cli",
  "unavailable-forge-no-network",
  "unavailable-forge-timeout",
  "unavailable-findings-corpus",
  "unavailable-history-not-a-repository",
  "unavailable-history-shallow",
  "unavailable-history-unreadable",
]);

/** Git's own revert subject (`git revert` writes it) — the primary heuristic. */
const REVERT_SUBJECT = /^Revert "/u;
/** The revert body's target oid — `git revert` writes `This reverts commit <oid>.` */
const REVERT_BODY = /\bThis reverts commit ([0-9a-f]{7,40})\b/u;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** A fatal collector error: the document itself is wrong, never a source's fault. */
export class QualityMetricsError extends Error {
  constructor(message) {
    super(message);
    this.name = "QualityMetricsError";
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Whether a commit is a revert, and which commit it names.
 *
 * Two shapes, both git's own: the subject `git revert` writes (`Revert "…"`)
 * and the body line it writes (`This reverts commit <oid>.`). A commit merely
 * *mentioning* reverts is not one — the definitions document states the
 * false-positive shape (a hand-written subject starting `Revert "`) and the
 * false-negative one (a revert committed by hand, or folded into another change).
 *
 * @param {string} subject
 * @param {string} body
 * @returns {{ isRevert: boolean, target: string | null }}
 */
export function revertTargetOf(subject, body) {
  const match = REVERT_BODY.exec(String(body ?? ""));
  return {
    isRevert: REVERT_SUBJECT.test(String(subject ?? "")) || match !== null,
    target: match === null ? null : match[1],
  };
}

/**
 * The median of a numeric set — `null` when it is empty, because there is no
 * centre of nothing and `0` would be a measurement nobody took.
 *
 * @param {number[]} values
 * @returns {number | null}
 */
export function median(values) {
  const sorted = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = (sorted.length - 1) / 2;
  const low = Math.floor(middle);
  const high = Math.ceil(middle);
  return (sorted[low] + sorted[high]) / 2;
}

/** A number with a fixed precision, so two runs of the same window are byte-equal. */
const rounded = (value, digits) => Number(value.toFixed(digits));

/** Hours between two ISO instants, or `null` when either is unusable. */
const hoursBetween = (from, to) => {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return (end - start) / HOUR_MS;
};

/** Whether an ISO instant falls inside `[since, until]`. */
const inWindow = (instant, since, until) => {
  const at = Date.parse(instant);
  return Number.isFinite(at) && at >= Date.parse(since) && at <= Date.parse(until);
};

// ---------------------------------------------------------------------------
// Process helpers — never throw, always bounded.
// ---------------------------------------------------------------------------

/** Run a command, bounded, and return a structured result. Never throws. */
function shell(command, args, { timeout = COMMAND_TIMEOUT_MS } = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout, maxBuffer: 64 * 1024 * 1024 });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    missing: result.error?.code === "ENOENT",
    timedOut: result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM",
  };
}

/**
 * The git reader: the window's commits, the head the report is anchored on, and
 * whether the window is fully covered.
 *
 * Coverage is asked of the history, not of a flag: a shallow clone whose oldest
 * available commit predates `since` covers the window completely, and refusing
 * to measure it would degrade a report that is in fact exact. The window is
 * truncated only when the repository is shallow **and** nothing predates `since`.
 *
 * @param {{ repo: string, since: string, until: string }} input
 * @returns {{ ok: true, head: string | null, commits: Array<{oid, committed_at, subject, body}>, coverage: "complete"|"truncated" }
 *   | { ok: false, code: string }}
 */
export function readGit({ repo, since, until }) {
  const probe = shell("git", ["-C", repo, "rev-parse", "--git-dir"]);
  // A missing `git` and a directory that is not a worktree are the same answer to
  // this reader: the history it was asked for does not exist here.
  if (!probe.ok) return { ok: false, code: "unavailable-history-not-a-repository" };
  const headResult = shell("git", ["-C", repo, "rev-parse", "HEAD"]);
  // An initialised repository with no commit yet: a real answer, not a failure.
  if (!headResult.ok) return { ok: true, head: null, commits: [], coverage: "complete" };
  const head = headResult.stdout.trim();

  const shallowResult = shell("git", ["-C", repo, "rev-parse", "--is-shallow-repository"]);
  if (!shallowResult.ok) return { ok: false, code: "unavailable-history-unreadable" };
  const shallow = shallowResult.stdout.trim() === "true";

  const logResult = shell("git", [
    "-C",
    repo,
    "log",
    `--since=${since}`,
    `--until=${until}`,
    "--format=%H%x1f%cI%x1f%s%x1f%b%x1e",
  ]);
  if (!logResult.ok) return { ok: false, code: "unavailable-history-unreadable" };

  let coverage = "complete";
  if (shallow) {
    const before = shell("git", ["-C", repo, "rev-list", "-1", `--before=${since}`, head]);
    if (!before.ok) return { ok: false, code: "unavailable-history-unreadable" };
    if (before.stdout.trim() === "") coverage = "truncated";
  }

  return { ok: true, head, commits: parseCommitLog(logResult.stdout), coverage };
}

/** Split `--format=%H%x1f%cI%x1f%s%x1f%b%x1e` output into commit records. */
function parseCommitLog(stdout) {
  const commits = [];
  for (const record of String(stdout).split("\u001e")) {
    const text = record.replace(/^\n+/u, "");
    if (text.trim() === "") continue;
    const [oid, committedAt, subject, body = ""] = text.split("\u001f");
    if (!oid) continue;
    commits.push({
      oid: oid.trim(),
      committed_at: (committedAt ?? "").trim(),
      subject: (subject ?? "").trim(),
      body: body.trim(),
    });
  }
  return commits;
}

/** Why a forge read failed, as the published degradation vocabulary names it. */
function forgeDegradation(failure, malformed) {
  if (malformed) return "unavailable-forge-malformed-answer";
  if (failure.missing) return "unavailable-forge-missing-cli";
  if (failure.timedOut) return "unavailable-forge-timeout";
  if (/authenticat|401|credential|bad credentials/iu.test(failure.stderr ?? "")) return "unavailable-forge-auth";
  return "unavailable-forge-no-network";
}

/**
 * The forge reader: three bounded `gh` reads, one shared wall-clock budget.
 *
 * A read that fails for any reason answers `{ ok: false, code }` — never a
 * partial list, which would turn an unreadable forge into a smaller rate. The
 * lists carry raw rows; the metric builders apply the window, so a caller can
 * see what was read before it is judged.
 *
 * @param {{ repo: string, since: string }} input
 * @returns {{ ok: true, merged: object[], merged_truncated: boolean, commit_samples: object[],
 *   samples_truncated: boolean, created: object[], created_truncated: boolean } | { ok: false, code: string }}
 */
export function readForge({ repo, since }) {
  const budget = { remaining: FORGE_DIMENSION_MS };
  const readList = (args) => {
    if (budget.remaining <= 0) {
      return { ok: false, failure: { timedOut: true }, malformed: false };
    }
    const started = Date.now();
    const result = shell("gh", args, { timeout: Math.min(FORGE_TIMEOUT_MS, budget.remaining) });
    budget.remaining -= Date.now() - started;
    if (!result.ok) return { ok: false, failure: result, malformed: false };
    let parsed;
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      return { ok: false, failure: result, malformed: true };
    }
    if (!Array.isArray(parsed)) return { ok: false, failure: result, malformed: true };
    return { ok: true, data: parsed };
  };

  const merged = readList([
    "pr", "list", "--state", "merged", "--limit", String(MERGED_PULLS_CAP),
    "--json", "number,createdAt,mergedAt,mergeCommit",
  ]);
  if (!merged.ok) return { ok: false, code: forgeDegradation(merged.failure, merged.malformed) };

  const samples = readList([
    "pr", "list", "--state", "merged", "--limit", String(FORGE_SAMPLE_PULLS),
    "--json", "number,mergedAt,commits",
  ]);
  if (!samples.ok) return { ok: false, code: forgeDegradation(samples.failure, samples.malformed) };

  const created = readList([
    "pr", "list", "--state", "all", "--search", `created:>=${since.slice(0, 10)}`, "--limit", String(CREATED_PULLS_CAP),
    "--json", "number,createdAt,reviews",
  ]);
  if (!created.ok) return { ok: false, code: forgeDegradation(created.failure, created.malformed) };

  return {
    ok: true,
    merged: merged.data.map((pull) => ({
      number: pull.number,
      created_at: pull.createdAt ?? null,
      merged_at: pull.mergedAt ?? null,
      merge_commit: pull.mergeCommit?.oid ?? null,
    })),
    merged_truncated: merged.data.length >= MERGED_PULLS_CAP,
    commit_samples: samples.data.map((pull) => ({
      number: pull.number,
      merged_at: pull.mergedAt ?? null,
      first_commit_at: earliestCommitOf(pull.commits),
    })),
    samples_truncated: samples.data.length >= FORGE_SAMPLE_PULLS,
    created: created.data.map((pull) => ({
      number: pull.number,
      created_at: pull.createdAt ?? null,
      first_review_at: earliestReviewOf(pull.reviews),
    })),
    created_truncated: created.data.length >= CREATED_PULLS_CAP,
  };
}

/** The earliest commit instant of a pull, or `null` when the pull carries none. */
function earliestCommitOf(commits) {
  const instants = (Array.isArray(commits) ? commits : [])
    .map((commit) => Date.parse(commit?.committedDate ?? ""))
    .filter((value) => Number.isFinite(value));
  return instants.length === 0 ? null : new Date(Math.min(...instants)).toISOString();
}

/** The earliest submitted review instant of a pull, or `null` when none was submitted. */
function earliestReviewOf(reviews) {
  const instants = (Array.isArray(reviews) ? reviews : [])
    .map((review) => Date.parse(review?.submittedAt ?? ""))
    .filter((value) => Number.isFinite(value));
  return instants.length === 0 ? null : new Date(Math.min(...instants)).toISOString();
}

/**
 * The findings-corpus reader — the escaped-defect slot's only source.
 *
 * It reuses the fold queue's parsers (`findingsRows` for a migrated unit doc's
 * `## Findings` table, `openRows` for a legacy `review-findings.md`) so the same
 * row cannot be open here and folded there. A tree with no corpus at all is a
 * declared degradation; the slot is never invented from nothing.
 *
 * @param {{ repo: string }} input
 * @returns {{ ok: true, open_rows: number, unit_docs: number } | { ok: false, code: string }}
 */
export function readCorpus({ repo }) {
  const roots = ["features", "fix"]
    .map((kind) => path.join(repo, "docs", kind))
    .filter((dir) => {
      try {
        return fs.statSync(dir).isDirectory();
      } catch {
        return false;
      }
    });
  if (roots.length === 0) return { ok: false, code: "unavailable-findings-corpus" };

  let unitDocs = 0;
  let openRowsCount = 0;
  for (const root of roots) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      // A symlinked unit folder is not a unit folder: the fold queue refuses a
      // path that escapes the project, and this read never widens that rule.
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, entry.name);
      const doc = readRegularFile(path.join(dir, "SPEC.md"));
      const ledger = readRegularFile(path.join(dir, "review-findings.md"));
      if (doc === null && ledger === null) continue;
      unitDocs += 1;
      if (doc !== null) openRowsCount += findingsRows(doc).length;
      if (ledger !== null) openRowsCount += openRows(ledger).length;
    }
  }
  return { ok: true, open_rows: openRowsCount, unit_docs: unitDocs };
}

/** Read a regular file (never through a symlink), or `null`. */
function readRegularFile(file) {
  try {
    if (!fs.lstatSync(file).isFile()) return null;
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The metric builders — one per row, each carrying its own confidence rule
// ---------------------------------------------------------------------------

/** The row shape every builder returns. */
const rowOf = ({ confidence, value = null, unit, reason = null, detail, components }) => ({
  confidence,
  value,
  unit,
  reason,
  detail,
  components,
});

/** Reversion ratio (S1): revert commits over total commits in the window. */
function reversionRatio(git) {
  const unit = "ratio";
  if (!git.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: git.code,
      detail: `git history is unreadable (${git.code}), so no commit ratio can be computed`,
      components: { revert_commits: null, total_commits: null },
    });
  }
  if (git.coverage === "truncated") {
    return rowOf({
      confidence: "unavailable", unit, reason: "unavailable-history-shallow",
      detail: "the shallow history is cut inside the window, so the commit count is a subset, not the window's total",
      components: { revert_commits: null, total_commits: null },
    });
  }
  const total = git.commits.length;
  const reverts = git.commits.filter((commit) => revertTargetOf(commit.subject, commit.body).isRevert).length;
  if (total === 0) {
    return rowOf({
      confidence: "unavailable", unit, reason: "no-commits-in-window",
      detail: "no commit landed inside the window, so a ratio over zero commits does not exist",
      components: { revert_commits: 0, total_commits: 0 },
    });
  }
  return rowOf({
    confidence: "derived",
    value: rounded(reverts / total, 4),
    unit,
    detail: `${reverts} revert commit${reverts === 1 ? "" : "s"} of ${total} commits in the window — a revert is a commit whose subject starts \`Revert "\` or whose body says \`This reverts commit <oid>\`; the identification is a message heuristic, so a hand-written revert is missed and a quoted subject is over-counted`,
    components: { revert_commits: reverts, total_commits: total },
  });
}

/** Deploys merged inside the window, from the forge's merged list. */
const deploysInWindow = (merged, since, until) =>
  merged.filter((pull) => pull.merged_at !== null && inWindow(pull.merged_at, since, until));

/** Change-failure rate (S2): reverted deploys over deploys merged in the window. */
function changeFailureRate(forge, git, since, until) {
  const unit = "ratio";
  if (!forge.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: forge.code,
      detail: `the forge is unreadable (${forge.code}), so no deploy can be counted`,
      components: { reverted_deploys: null, deploys: null },
    });
  }
  const deploys = deploysInWindow(forge.merged, since, until);
  if (!git.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: git.code,
      detail: `git history is unreadable (${git.code}), so a revert cannot be linked to a deploy`,
      components: { reverted_deploys: null, deploys: deploys.length },
    });
  }
  if (deploys.length === 0) {
    return rowOf({
      confidence: "unavailable", unit, reason: "no-deploys-in-window",
      detail: "no pull merged inside the window, so a failure rate over zero deploys does not exist",
      components: { reverted_deploys: 0, deploys: 0 },
    });
  }
  const targets = new Set(
    git.commits
      .map((commit) => revertTargetOf(commit.subject, commit.body).target)
      .filter((target) => target !== null),
  );
  const reverted = deploys.filter((pull) => pull.merge_commit !== null && targets.has(pull.merge_commit)).length;
  return rowOf({
    confidence: "derived",
    value: rounded(reverted / deploys.length, 4),
    unit,
    detail: `${reverted} of ${deploys.length} deploys merged in the window were named by a revert — linked by the revert's target oid matching the pull's merge commit; a deploy merged by hand or rebased after a direct push carries no merge commit and cannot be linked${forge.merged_truncated ? `; the deploy read is capped at ${MERGED_PULLS_CAP} pulls, so the denominator is a subset` : ""}`,
    components: { reverted_deploys: reverted, deploys: deploys.length },
  });
}

/** Lead time for change (S3): median first commit → merge over the sampled pulls. */
function leadTimeForChange(forge, since, until) {
  const unit = "hours";
  if (!forge.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: forge.code,
      detail: `the forge is unreadable (${forge.code}), so no pull's commits can be read`,
      components: { merged_pulls: null, sampled_pulls: null },
    });
  }
  const deploys = deploysInWindow(forge.merged, since, until);
  const sampled = forge.commit_samples.filter(
    (pull) => pull.first_commit_at !== null && pull.merged_at !== null && inWindow(pull.merged_at, since, until),
  );
  const hours = sampled
    .map((pull) => hoursBetween(pull.first_commit_at, pull.merged_at))
    .filter((value) => value !== null);
  const components = { merged_pulls: deploys.length, sampled_pulls: hours.length };
  if (hours.length === 0) {
    return rowOf({
      confidence: "unavailable", unit, reason: "no-pulls-in-window",
      detail: deploys.length === 0
        ? "no pull merged inside the window, so no lead time can be measured"
        : "no sampled pull inside the window carries both a first commit and a merge, so no lead time can be measured",
      components,
    });
  }
  const truncated = forge.merged_truncated || (forge.samples_truncated && deploys.length > sampled.length);
  return rowOf({
    confidence: truncated ? "derived" : "measured",
    value: rounded(median(hours), 2),
    unit,
    detail: `median first-commit→merge over ${hours.length} sampled pull${hours.length === 1 ? "" : "s"} of ${deploys.length} merged in the window${truncated ? ` (the reads behind it are bounded — ${FORGE_SAMPLE_PULLS} pulls for the first commit, ${MERGED_PULLS_CAP} for the deploy list — so this rests on a sample)` : ""}`,
    components,
  });
}

/** PR volume (S4): pulls opened in the window, with merged carried beside it. */
function prVolume(forge, since, until) {
  const unit = "count";
  if (!forge.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: forge.code,
      detail: `the forge is unreadable (${forge.code}), so no pull can be counted`,
      components: { opened_pulls: null, merged_pulls: null },
    });
  }
  const opened = forge.created.filter((pull) => pull.created_at !== null && inWindow(pull.created_at, since, until));
  const merged = deploysInWindow(forge.merged, since, until);
  const capped = forge.created_truncated || forge.merged_truncated;
  const caps = [
    forge.created_truncated ? `the created read is capped at ${CREATED_PULLS_CAP} pulls` : null,
    forge.merged_truncated ? `the deploy read is capped at ${MERGED_PULLS_CAP} pulls` : null,
  ].filter((entry) => entry !== null);
  return rowOf({
    confidence: capped ? "derived" : "measured",
    value: opened.length,
    unit,
    detail: `${opened.length} pull${opened.length === 1 ? "" : "s"} opened and ${merged.length} merged inside the window${capped ? ` (${caps.join("; ")})` : ""}`,
    components: { opened_pulls: opened.length, merged_pulls: merged.length },
  });
}

/** Review latency (S4): median open → first review over the in-window pulls. */
function reviewLatency(forge, since, until) {
  const unit = "hours";
  if (!forge.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: forge.code,
      detail: `the forge is unreadable (${forge.code}), so no review can be read`,
      components: { reviewed_pulls: null, opened_pulls: null },
    });
  }
  const opened = forge.created.filter((pull) => pull.created_at !== null && inWindow(pull.created_at, since, until));
  const hours = opened
    .map((pull) => (pull.first_review_at === null ? null : hoursBetween(pull.created_at, pull.first_review_at)))
    .filter((value) => value !== null);
  const components = { reviewed_pulls: hours.length, opened_pulls: opened.length };
  if (hours.length === 0) {
    return rowOf({
      confidence: "unavailable", unit, reason: "no-reviews-in-window",
      detail: `none of the ${opened.length} pulls opened inside the window carries a submitted review, so no latency can be measured`,
      components,
    });
  }
  return rowOf({
    confidence: forge.created_truncated ? "derived" : "measured",
    value: rounded(median(hours), 2),
    unit,
    detail: `median open→first-review over ${hours.length} reviewed pull${hours.length === 1 ? "" : "s"} of ${opened.length} opened in the window`,
    components,
  });
}

/** The escaped-defect slot (S5): the findings corpus' open rows. */
function escapedDefects(corpus) {
  const unit = "count";
  if (!corpus.ok) {
    return rowOf({
      confidence: "unavailable", unit, reason: corpus.code,
      detail: "this project carries no unit-doc findings corpus, so the slot is not invented",
      components: { open_findings: null, unit_docs: 0 },
    });
  }
  return rowOf({
    confidence: "measured",
    value: corpus.open_rows,
    unit,
    detail: `${corpus.open_rows} open findings row${corpus.open_rows === 1 ? "" : "s"} across ${corpus.unit_docs} unit document${corpus.unit_docs === 1 ? "" : "s"} — the corpus as the fold queue reads it: a migrated unit's \`## Findings\` table plus a legacy ledger's unticked rows, so on a mature project this counts ledger debt beside live escapes, and the corpus carries no per-row timestamp for the window to apply to`,
    components: { open_findings: corpus.open_rows, unit_docs: corpus.unit_docs },
  });
}

// ---------------------------------------------------------------------------
// The document
// ---------------------------------------------------------------------------

/** The three readers over one project — the seam a suite replaces. */
export function createSources() {
  return { readGit, readForge, readCorpus };
}

/**
 * Collect the quality-metrics document for one project and one window.
 *
 * Pure over its seam: the window's `until` instant is handed in (never read from
 * the clock), so the same sources and the same window answer byte-identical
 * bytes. The document is validated against the published contract before it is
 * returned; a document that fails is a programming error, never a report.
 *
 * @param {{ repo?: string, windowDays?: number, until: string, sources?: object }} input
 * @returns {import("@gtrabanco/agentic-workflow-schema").QualityMetricsDocument}
 */
export function collectQualityMetrics({ repo = process.cwd(), windowDays = DEFAULT_WINDOW_DAYS, until, sources }) {
  if (typeof until !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(until)) {
    throw new QualityMetricsError(`the window needs a UTC instant as \`until\` (got ${JSON.stringify(until)})`);
  }
  if (!Number.isInteger(windowDays) || windowDays < QUALITY_METRICS_LIMITS.minWindowDays || windowDays > QUALITY_METRICS_LIMITS.maxWindowDays) {
    throw new QualityMetricsError(
      `the window must be ${QUALITY_METRICS_LIMITS.minWindowDays}..${QUALITY_METRICS_LIMITS.maxWindowDays} days (got ${JSON.stringify(windowDays)})`,
    );
  }
  const since = new Date(Date.parse(until) - windowDays * DAY_MS).toISOString();
  const seam = sources ?? createSources();

  const degraded = new Set();
  const git = seam.readGit({ repo, since, until });
  if (!git.ok) degraded.add(git.code);
  // A truncated window is a degradation like any other: it is not a read failure,
  // but a reader must see the cut named in the same list the rows cite.
  else if (git.coverage === "truncated") degraded.add("unavailable-history-shallow");
  const forge = seam.readForge({ repo, since, until });
  if (!forge.ok) degraded.add(forge.code);
  const corpus = seam.readCorpus({ repo });
  if (!corpus.ok) degraded.add(corpus.code);

  const document = {
    contract: QUALITY_METRICS_CONTRACT_ID,
    version: QUALITY_METRICS_VERSION,
    schema: QUALITY_METRICS_SCHEMA,
    source_revision: git.ok ? git.head : null,
    window: { days: windowDays, since, until },
    degraded: [...degraded].sort(),
    metrics: {
      reversion_ratio: reversionRatio(git),
      change_failure_rate: changeFailureRate(forge, git, since, until),
      lead_time_for_change: leadTimeForChange(forge, since, until),
      pr_volume: prVolume(forge, since, until),
      review_latency: reviewLatency(forge, since, until),
      escaped_defects: escapedDefects(corpus),
    },
  };

  const validation = validateQualityMetrics(document);
  if (!validation.ok) {
    throw new QualityMetricsError(`the collected document does not satisfy its own contract: ${validation.errors.join("; ")}`);
  }
  return document;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `Usage: agentic-workflow quality-metrics [OPTIONS]

Read-only project-quality sensor: compute DORA's four keys plus the reversion
ratio over a trailing window and print the fixed quality-metrics@1 document on
stdout. The metric definitions are the crate README's quality-metrics@1 block.

Options:
  --window <days>    trailing window, an integer in ${QUALITY_METRICS_LIMITS.minWindowDays}..${QUALITY_METRICS_LIMITS.maxWindowDays} (default ${DEFAULT_WINDOW_DAYS})
  --until <instant>  UTC ISO-8601 instant the window ends at (default: now), so a
                     report is reproducible when the caller pins it
  --repo <dir>       the project to measure (default: the working directory)
  --out <path>       also write the document to this file — the only byte this
                     command may write
  --help             print this usage and exit 0
  --version          print the schema package version and exit 0

Exit codes: 0 a validated document · 2 a refusal (bad flag or value; nothing was
measured) · 1 an unexpected failure. Diagnostics go to stderr, the document
alone to stdout.`;

/** The schema package's own version — the contract the document satisfies. */
function schemaPackageVersion() {
  try {
    const entry = fileURLToPath(import.meta.resolve("@gtrabanco/agentic-workflow-schema"));
    return JSON.parse(fs.readFileSync(path.join(path.dirname(path.dirname(entry)), "package.json"), "utf8")).version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function parseArgs(argv) {
  const opts = { windowDays: DEFAULT_WINDOW_DAYS, until: null, repo: null, out: null };
  const value = (index, flag) => {
    const next = argv[index + 1];
    return next === undefined ? { error: `${flag} requires a value` } : { value: next };
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") return { help: true };
    if (token === "--version") return { version: true };
    if (token === "--window" || token === "--until" || token === "--repo" || token === "--out") {
      const read = value(index, token);
      if (read.error) return read;
      index += 1;
      if (token === "--window") {
        if (!/^\d+$/u.test(read.value)) {
          return { error: `--window needs an integer day count in ${QUALITY_METRICS_LIMITS.minWindowDays}..${QUALITY_METRICS_LIMITS.maxWindowDays} (got "${read.value}")` };
        }
        opts.windowDays = Number(read.value);
      } else if (token === "--until") {
        const ms = Date.parse(read.value);
        if (Number.isNaN(ms)) return { error: `--until needs a UTC ISO-8601 instant (got "${read.value}")` };
        opts.until = new Date(ms).toISOString();
      } else if (token === "--repo") {
        opts.repo = read.value;
      } else {
        opts.out = read.value;
      }
      continue;
    }
    return { error: `unknown flag: ${token}` };
  }
  return { opts };
}

/** One refusal line on stderr, the usage after it: nothing was measured. */
function refuse(reason) {
  process.stderr.write(`QUALITY REFUSAL — ${reason}\n\n${USAGE}\n`);
  return REFUSAL_EXIT_CODE;
}

/**
 * CLI entry: the arguments after `agentic-workflow quality-metrics`.
 *
 * Returns the exit code synchronously — every read is a bounded `spawnSync`, so
 * there is nothing to await and the bin's `process.exitCode` is final.
 *
 * @param {string[]} argv
 * @param {{ feedback?: object }} [context] — the bin's feedback channel, when the
 *   CLI was invoked through it. The collection stages through it so a run that
 *   spends seconds in bounded subprocesses announces itself before it blocks.
 * @returns {number}
 */
export function run(argv = process.argv.slice(2), { feedback = null } = {}) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  if (parsed.version) {
    process.stdout.write(`${schemaPackageVersion()}\n`);
    return 0;
  }
  if (parsed.error) return refuse(parsed.error);

  const { windowDays, until, repo, out } = parsed.opts;
  if (!Number.isInteger(windowDays) || windowDays < QUALITY_METRICS_LIMITS.minWindowDays || windowDays > QUALITY_METRICS_LIMITS.maxWindowDays) {
    return refuse(`--window needs an integer day count in ${QUALITY_METRICS_LIMITS.minWindowDays}..${QUALITY_METRICS_LIMITS.maxWindowDays} (got ${windowDays})`);
  }

  let document;
  try {
    const collect = () =>
      collectQualityMetrics({
        repo: repo === null ? process.cwd() : path.resolve(repo),
        windowDays,
        until: until ?? new Date().toISOString(),
      });
    // The reads block the loop, so a channel that waited for its own timer would
    // stay silent for the whole run: the stage flushes the start line first.
    document = feedback === null ? collect() : feedback.stage("collect", collect);
  } catch (error) {
    if (error instanceof QualityMetricsError) return refuse(error.message);
    process.stderr.write(`quality-metrics failed: ${error?.message ?? error}\n`);
    return FATAL_EXIT_CODE;
  }

  const text = `${JSON.stringify(document, null, 2)}\n`;
  if (out !== null) {
    try {
      fs.writeFileSync(path.resolve(out), text);
    } catch (error) {
      process.stderr.write(`quality-metrics failed to write ${out}: ${error?.message ?? error}\n`);
      return FATAL_EXIT_CODE;
    }
  }
  if (feedback !== null) {
    const totals = Object.values(document.metrics);
    const unavailable = totals.filter((row) => row.confidence === "unavailable").length;
    feedback.done(`${totals.length - unavailable}/${totals.length} metrics usable · ${document.degraded.length} degraded`);
  }
  process.stdout.write(text);
  return 0;
}
