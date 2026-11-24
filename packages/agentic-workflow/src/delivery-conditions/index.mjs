/**
 * delivery-conditions — the machine half of "a delivery condition names a
 * carrier" (issue #704).
 *
 * The defect class is measured, not imagined: #301 documented the repair-receipt
 * gap and closed with `Reabrir #301 cuando #260 lande` inside a **comment**.
 * #260 landed CLOSED, nobody reopened, and two consumer units later the same gap
 * was hit again (fix-101, fix-334). A condition recorded as prose has no carrier
 * and no watcher, so it lives only until the session that wrote it dies.
 *
 * Two mechanisms answer that, and they are the two this module owns:
 *
 *   guard  `--close-check <n>` judges the issue it is about to close. A coverage
 *          claim against an issue that is still OPEN is refused, because it is
 *          wrong by construction — the cover must be delivered, or the issue
 *          stays open with a native `blocked-by` link. The refusal names that
 *          route, because a refusal without a move is a dead end.
 *   sweep  `--sweep` re-judges every recorded condition against the cited
 *          issues' states and reports the ones whose follow-up came due. It is
 *          the backstop for prose already written: report-only, no write, no
 *          forge mutation, no third-party text in its output.
 *
 * Standing constraints, enforced mechanically:
 *   - the recognisable phrasings are one table (`CONDITION_PATTERNS`), and the
 *     issue process's `delivery-condition@1` block mirrors it — the parity case
 *     in `scripts/delivery-conditions.test.mjs` refuses drift in both directions;
 *   - the table is bilingual because the canonical reproducer is written in
 *     Spanish, and an English-only table would not find the defect this exists
 *     for;
 *   - a condition-shaped sentence that cites no issue is reported
 *     (`condition-uncarried`) as an advisory, never dropped and never a refusal;
 *   - the roadmap's `## Fixes` rows are a second corpus read through the table's
 *     own parser (`index-document.mjs`), never a fifth column;
 *   - the output is a byte-stable block: no clock, no path, no hash, so two runs
 *     over one corpus print the same bytes. Diagnostics go to stderr.
 *
 * Read-only: it reads the forge (guarded by degradation, never by invention) and
 * the roadmap, and it writes nothing. The one thing it may not do is print third
 * party text — a finding carries issue numbers, kinds, verdicts and fixed
 * sentences only — which is why the content-guard discipline declares this file
 * exempt *with that reason* rather than routing the corpus through the sanitizer
 * (the sanitizer would delete the very sentence the extraction needs).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  DELIVERY_CONDITION_FINDINGS,
  DELIVERY_CONDITION_KINDS,
  DELIVERY_CONDITION_REFUSALS,
  DELIVERY_CONDITION_VERDICTS,
} from "@gtrabanco/agentic-workflow-schema";

import { readRoadmapIndex, roadmapTableRows } from "../index-document.mjs";
import { createFeedback, parseFeedbackArgs } from "../feedback/index.mjs";

// The module's own names for the four published sets: the schema package owns the
// tokens, this file owns the readable handle, and `vocabulary-parity` refuses a
// second copy of any token list.
export const CONDITION_KINDS = DELIVERY_CONDITION_KINDS;
export const CONDITION_VERDICTS = DELIVERY_CONDITION_VERDICTS;
export const CONDITION_FINDINGS = DELIVERY_CONDITION_FINDINGS;
export const CONDITION_REFUSALS = DELIVERY_CONDITION_REFUSALS;

/** The block's own identity, so a consumer can pin the grammar it reads. */
export const CONTRACT_ID = "delivery-conditions@1";

/** The closed set of report verdicts. `PASS` alone exits 0. */
export const VERDICTS = Object.freeze(["PASS", "VIOLATION", "UNRESOLVED"]);

/** How many issues one live read may scan; a hit at the limit is declared. */
export const DEFAULT_LIMIT = 500;
/** How many comment-carrier hits the live read resolves per sweep. */
export const DEFAULT_COMMENT_LIMIT = 50;

/**
 * The recognisable phrasings, one row per (kind, language, phrase).
 *
 * `phrase` is the human-readable form the issue process's block mirrors;
 * `anchor` is the regex source the extractor matches. The citation is never part
 * of the anchor: it is read from the clause that follows the phrase, which is
 * what makes "a condition citing no issue" observable instead of invisible.
 */
export const CONDITION_PATTERNS = Object.freeze([
  { kind: "covered-by", language: "en", phrase: "closed as covered by #N", anchor: "closed\\s+as\\s+covered\\s+by" },
  { kind: "covered-by", language: "en", phrase: "covered by #N", anchor: "covered\\s+by" },
  { kind: "covered-by", language: "es", phrase: "cerrada como cubierta por #N", anchor: "cerrada\\s+como\\s+cubierta\\s+por" },
  { kind: "covered-by", language: "es", phrase: "cubierta por #N", anchor: "cubierta\\s+por" },
  { kind: "reopen-when", language: "en", phrase: "reopen when #N", anchor: "re-?open\\s+when" },
  { kind: "reopen-when", language: "en", phrase: "reopen once #N", anchor: "re-?open\\s+once" },
  { kind: "reopen-when", language: "es", phrase: "reabrir cuando #N", anchor: "re-?abrir\\b[^.\\n]{0,60}?cuando" },
  { kind: "proceeds-when", language: "en", phrase: "proceeds when #N", anchor: "proceeds\\s+when" },
  { kind: "proceeds-when", language: "en", phrase: "proceeds once #N", anchor: "proceeds\\s+once" },
  { kind: "proceeds-when", language: "es", phrase: "continúa cuando #N", anchor: "contin(?:u|ú)a\\s+cuando" },
  { kind: "waits-for", language: "en", phrase: "waits for #N", anchor: "wait(?:s)?\\s+for" },
  { kind: "waits-for", language: "en", phrase: "waiting for #N", anchor: "waiting\\s+for" },
  { kind: "waits-for", language: "es", phrase: "espera a #N", anchor: "espera\\s+a\\s" },
  { kind: "retire-when", language: "en", phrase: "retire when #N", anchor: "retire\\s+when" },
  { kind: "retire-when", language: "es", phrase: "retirar cuando #N", anchor: "retirar\\s+cuando" },
]);

/** The families whose close-time violation is a coverage claim. */
const DEPENDENCY_KINDS = new Set(["covered-by", "proceeds-when", "waits-for"]);

/** The sentence ends a clause may not cross: the citation lives with its phrase. */
const CLAUSE_END = /[.!?;)\n]/u;
const CITATION = /#(\d+)/gu;
const MAX_CITES = 3;

/* ------------------------------------------------------------------ extract */

/**
 * The conditions one text unit records.
 *
 * @param {string} text
 * @returns {Array<{kind: string, cites: number[], phrase: string, language: string}>}
 */
export function extractConditions(text) {
  const source = String(text ?? "");
  if (source.trim() === "") return [];
  const seen = new Set();
  const rows = [];
  for (const pattern of CONDITION_PATTERNS) {
    const matcher = new RegExp(`(?<![\\w-])(?:${pattern.anchor})(?![\\w-])`, "giu");
    for (const match of source.matchAll(matcher)) {
      const after = source.slice(match.index + match[0].length);
      const end = after.search(CLAUSE_END);
      const clause = end === -1 ? after : after.slice(0, end);
      const cites = [...clause.matchAll(CITATION)]
        .map((hit) => Number(hit[1]))
        .filter((value, index, all) => Number.isInteger(value) && all.indexOf(value) === index)
        .slice(0, MAX_CITES)
        .sort((a, b) => a - b);
      const key = `${pattern.kind}::${cites.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ kind: pattern.kind, cites, phrase: pattern.phrase, language: pattern.language });
    }
  }
  return rows;
}

/* -------------------------------------------------------------------- judge */

/** The state a citation resolves to, or `null` when the corpus cannot answer. */
const stateOf = (states, number) => states?.[number] ?? states?.[String(number)] ?? null;

/**
 * Judge one condition against the cited issues' states.
 *
 * @param {{kind: string, cites: number[], citing: "OPEN"|"CLOSED", states: Record<string, string>}} input
 * @returns {string} one of `DELIVERY_CONDITION_VERDICTS`
 */
export function judgeCondition({ kind, cites = [], citing, states = {} }) {
  if (!Array.isArray(cites) || cites.length === 0) return "unresolved";
  const cited = cites.map((number) => stateOf(states, number));
  if (cited.some((state) => state === null)) return "unresolved";
  const anyClosed = cited.includes("CLOSED");
  const allClosed = cited.every((state) => state === "CLOSED");
  if (DEPENDENCY_KINDS.has(kind)) {
    // Closed past an undelivered dependency is the violation; an open issue
    // waiting on an open issue is exactly the record's intent.
    if (citing === "CLOSED") return allClosed ? "satisfied" : "stalled";
    return allClosed ? "satisfied" : "pending";
  }
  if (kind === "reopen-when") {
    // The recorded follow-up: due the moment the cited landing happens.
    if (citing === "CLOSED") return anyClosed ? "stalled" : "pending";
    return allClosed ? "satisfied" : "pending";
  }
  if (kind === "retire-when") {
    // A retirement its own landing makes due, in either state of the citing issue.
    return anyClosed ? "stalled" : "pending";
  }
  return "unresolved";
}

/** The finding a stalled condition earns. */
const findingCodeFor = (kind) => (DEPENDENCY_KINDS.has(kind) ? "covered-by-open" : "condition-stalled");

/** The fixed sentence a finding carries — never corpus text. */
function detailFor(code, cites) {
  const first = cites[0];
  if (code === "covered-by-open") return `the cited #${first} is open`;
  if (code === "condition-stalled") return `the cited #${first} is closed; the recorded follow-up is due`;
  return "the condition names no issue; name one so the machine can re-check it";
}

/**
 * The rows that need action print first: a report is read top-down, so `stalled`
 * leads, then the rows the machine could not judge, then the consistent records.
 * The order is a rule, not an accident — the block stays byte-stable either way.
 */
const VERDICT_ORDER = Object.freeze({ stalled: 0, unresolved: 1, pending: 2, satisfied: 3 });

const byCondition = (a, b) =>
  a.issue - b.issue
  || (VERDICT_ORDER[a.verdict] ?? 9) - (VERDICT_ORDER[b.verdict] ?? 9)
  || a.kind.localeCompare(b.kind)
  || a.cites.join(",").localeCompare(b.cites.join(","))
  || a.via.localeCompare(b.via);

const byCode = (a, b) => a.code.localeCompare(b.code) || a.issue - b.issue;

/* ----------------------------------------------------------------- the sweep */

/** The text units one corpus entry records, each with where it came from. */
function unitsOf(entry) {
  const units = [];
  if (typeof entry.body === "string" && entry.body.trim() !== "") units.push({ via: "body", text: entry.body });
  for (const comment of entry.comments ?? []) {
    const text = typeof comment === "string" ? comment : comment?.body;
    if (typeof text === "string" && text.trim() !== "") units.push({ via: "comment", text });
  }
  return units;
}

/** The state map a corpus yields (latest entry wins). */
function statesOf(issues) {
  const states = {};
  for (const entry of issues) {
    if (typeof entry.number !== "number") continue;
    states[entry.number] = String(entry.state ?? "").toUpperCase() === "CLOSED" ? "CLOSED" : "OPEN";
  }
  return states;
}

/** The status a roadmap row declares, mapped onto the forge's two states. */
const rowState = (status) => (/^\s*(?:`?done`?)/u.test(String(status ?? "")) ? "CLOSED" : "OPEN");

/**
 * The sweep: every recorded condition, judged, with the ones whose follow-up came
 * due as findings and the uncarried ones as advisories.
 *
 * @param {{issues?: Array<object>, roadmapRows?: Array<{issue: number, status: string, notes: string}>,
 *          limit?: number, truncated?: boolean, degradations?: string[]}} input
 * @returns {object} the report `render` prints
 */
export function evaluate({ issues = [], roadmapRows = [], limit, truncated = false, degradations = [] } = {}) {
  const states = statesOf(issues);
  const conditions = [];
  let textUnits = 0;

  for (const entry of issues) {
    if (typeof entry.number !== "number") continue;
    const citing = states[entry.number];
    for (const unit of unitsOf(entry)) {
      textUnits += 1;
      for (const found of extractConditions(unit.text)) {
        conditions.push({
          issue: entry.number,
          via: unit.via,
          kind: found.kind,
          cites: found.cites,
          verdict: judgeCondition({ kind: found.kind, cites: found.cites, citing, states }),
        });
      }
    }
  }

  for (const row of roadmapRows) {
    if (typeof row.issue !== "number" || typeof row.notes !== "string" || row.notes.trim() === "") continue;
    textUnits += 1;
    const citing = rowState(row.status);
    for (const found of extractConditions(row.notes)) {
      conditions.push({
        issue: row.issue,
        via: "roadmap",
        kind: found.kind,
        cites: found.cites,
        verdict: judgeCondition({ kind: found.kind, cites: found.cites, citing, states }),
      });
    }
  }

  conditions.sort(byCondition);

  const findings = [];
  const advisories = [];
  for (const condition of conditions) {
    if (condition.cites.length === 0) {
      advisories.push({ code: "condition-uncarried", issue: condition.issue, via: condition.via, cites: [], detail: detailFor("condition-uncarried", []) });
      continue;
    }
    if (condition.verdict !== "stalled") continue;
    const code = findingCodeFor(condition.kind);
    findings.push({ code, issue: condition.issue, via: condition.via, cites: condition.cites, detail: detailFor(code, condition.cites) });
  }
  findings.sort(byCode);
  advisories.sort(byCode);

  const isTruncated = truncated === true || (Number.isInteger(limit) && issues.length >= limit);
  const named = [...new Set(degradations.map(String))];
  if (isTruncated) named.push("corpus-truncated-at-limit");
  named.sort();

  // An uncarried condition is already reported as an advisory: counting it as
  // unjudged too would report one gap twice and flip a corpus with no stall.
  const unjudged = conditions.filter((row) => row.cites.length > 0 && row.verdict === "unresolved").length;
  const verdict = findings.length > 0 ? "VIOLATION" : unjudged > 0 || named.some(isForgeFailure) ? "UNRESOLVED" : "PASS";

  return {
    contract: CONTRACT_ID,
    mode: "sweep",
    corpus: {
      issues: issues.length,
      "text-units": textUnits,
      conditions: conditions.length,
      findings: findings.length,
      advisories: advisories.length,
      unjudged,
      truncated: isTruncated === true,
    },
    conditions,
    findings,
    advisories,
    refusals: [],
    degradations: named,
    verdict,
  };
}

/** Whether a degradation names an unreachable source rather than a data defect. */
const isForgeFailure = (code) => /^unavailable-/u.test(code) || code === "corpus-missing-citing-issue" || code === "corpus-truncated-at-limit";

/* ----------------------------------------------------------------- the guard */

/**
 * The close-time guard: the refusals closing `issue` would earn now.
 *
 * @param {{issue: object, states: Record<string, string>}} input
 * @returns {object} the report `render` prints
 */
export function closeCheck({ issue, states = {} }) {
  const citing = String(issue?.state ?? "OPEN").toUpperCase() === "CLOSED" ? "CLOSED" : "OPEN";
  const conditions = [];
  let textUnits = 0;
  for (const unit of unitsOf(issue ?? {})) {
    textUnits += 1;
    for (const found of extractConditions(unit.text)) {
      conditions.push({
        issue: issue.number,
        via: unit.via,
        kind: found.kind,
        cites: found.cites,
        verdict: judgeCondition({
          kind: found.kind,
          cites: found.cites,
          // The guard judges the state the issue is about to reach.
          citing: "CLOSED",
          states,
        }),
      });
    }
  }
  conditions.sort(byCondition);

  const refusals = [];
  const advisories = [];
  for (const condition of conditions) {
    if (condition.cites.length === 0) {
      advisories.push({ code: "condition-uncarried", issue: issue.number, via: condition.via, cites: [], detail: detailFor("condition-uncarried", []) });
      continue;
    }
    if (condition.verdict !== "stalled" || !DEPENDENCY_KINDS.has(condition.kind)) continue;
    const open = condition.cites.find((number) => stateOf(states, number) === "OPEN");
    if (open === undefined) continue;
    refusals.push({
      code: "covered-by-open",
      issue: issue.number,
      via: condition.via,
      cites: condition.cites,
      detail: `cites #${open} (open) — the cover must be delivered, or the issue stays open with a blocked-by link to #${open}`,
    });
  }
  const unjudged = conditions.filter((row) => row.cites.length > 0 && row.verdict === "unresolved").length;

  return {
    contract: CONTRACT_ID,
    mode: `close-check ${issue.number}`,
    corpus: {
      issues: 1,
      "text-units": textUnits,
      conditions: conditions.length,
      findings: 0,
      advisories: advisories.length,
      unjudged,
      truncated: false,
    },
    conditions,
    findings: [],
    advisories,
    refusals,
    degradations: [],
    verdict: refusals.length > 0 ? "VIOLATION" : unjudged > 0 ? "UNRESOLVED" : "PASS",
  };
}

/* ---------------------------------------------------------------- the render */

/** The cites cell: `#12,#30`, or `none` when the condition names no issue. */
const citesCell = (cites) => (cites.length === 0 ? "none" : cites.map((number) => `#${number}`).join(","));

/**
 * The fixed block. Byte-stable for a given report: no clock, no path, no hash.
 *
 * @param {object} report
 * @returns {string}
 */
export function render(report) {
  const corpus = report.corpus ?? {};
  const lines = [
    `${CONTRACT_ID} ${report.mode ?? "sweep"}`,
    `corpus issues=${corpus.issues ?? 0} text-units=${corpus["text-units"] ?? 0} conditions=${corpus.conditions ?? 0}`
      + ` findings=${report.findings?.length ?? 0} advisories=${report.advisories?.length ?? 0}`
      + ` unjudged=${corpus.unjudged ?? 0} truncated=${corpus.truncated === true ? "yes" : "no"}`,
  ];
  for (const row of report.conditions ?? []) {
    lines.push(`CONDITION #${row.issue} · ${row.kind} · cites ${citesCell(row.cites)} · ${row.verdict} · via ${row.via}`);
  }
  for (const row of report.findings ?? []) {
    lines.push(`FINDING ${row.code} · #${row.issue} · ${row.detail}`);
  }
  for (const row of report.refusals ?? []) {
    lines.push(`REFUSAL ${row.code} · #${row.issue} · ${row.detail}`);
  }
  for (const row of report.advisories ?? []) {
    lines.push(`ADVISORY ${row.code} · #${row.issue} · ${row.detail}`);
  }
  for (const code of report.degradations ?? []) lines.push(`DEGRADED ${code}`);
  lines.push(`verdict ${report.verdict ?? "UNRESOLVED"}`);
  return `${lines.join("\n")}\n`;
}

/* ---------------------------------------------------------------- the corpus */

/** A lowercase, hyphenated cause for a degradation code. */
function sanitizeCause(cause) {
  const text = String(cause?.code ?? cause?.message ?? cause ?? "unknown");
  const clean = text.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
  return (clean || "unknown").slice(0, 40);
}

/** Normalize one cache entry into the corpus shape. */
function normalizeEntry(raw) {
  if (raw === null || typeof raw !== "object") return null;
  const number = typeof raw.number === "number" ? raw.number : Number(raw.number);
  if (!Number.isInteger(number) || number <= 0) return null;
  const comments = Array.isArray(raw.comments) ? raw.comments : [];
  return {
    number,
    state: String(raw.state ?? "OPEN").toUpperCase() === "CLOSED" ? "CLOSED" : "OPEN",
    body: typeof raw.body === "string" ? raw.body : "",
    comments: comments
      .map((comment) => (typeof comment === "string" ? comment : typeof comment?.body === "string" ? comment.body : ""))
      .filter((text) => text.trim() !== ""),
  };
}

/**
 * Read the corpus. Offline-first: `--issues-file <json>` injects a previously
 * fetched array (a cache, or a test fixture) and the read is pure. The live path
 * is one `gh issue list` for bodies and states plus a bounded
 * `gh search issues --match comments` per condition family, because the
 * canonical stall lived in a comment. Every failure degrades by name; an
 * unreachable forge never reads as an empty corpus presented as truth.
 *
 * @param {{issuesFile?: string|null, ghBin?: string, repo?: string|null, limit?: number,
 *          commentLimit?: number, cwd?: string}} [options]
 * @returns {{issues: Array<object>, degradations: string[], truncated: boolean}}
 */
export async function readCorpus({
  issuesFile = null,
  ghBin = "gh",
  repo = null,
  limit = DEFAULT_LIMIT,
  commentLimit = DEFAULT_COMMENT_LIMIT,
  cwd = process.cwd(),
} = {}) {
  const degradations = [];
  if (issuesFile) {
    let raw = null;
    try {
      raw = JSON.parse(fs.readFileSync(issuesFile, "utf8"));
      if (!Array.isArray(raw)) throw new Error("the issues cache is not a JSON array");
    } catch (cause) {
      degradations.push(`unavailable-forge-issues-file-${sanitizeCause(cause)}`);
      return { issues: [], degradations, truncated: false };
    }
    const issues = raw.map(normalizeEntry).filter((entry) => entry !== null);
    return { issues, degradations, truncated: false };
  }

  const repoArgs = repo ? ["-R", repo] : [];
  const list = spawnSync(
    ghBin,
    ["issue", "list", ...repoArgs, "--state", "all", "--limit", String(limit), "--json", "number,state,body"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120000, cwd },
  );
  if (list.error || list.status !== 0) {
    degradations.push(`unavailable-forge-issue-list-${sanitizeCause(list.error ?? list.stderr)}`);
    return { issues: [], degradations, truncated: false };
  }
  let listed = [];
  try {
    listed = JSON.parse(list.stdout);
  } catch (cause) {
    degradations.push(`unavailable-forge-issue-list-${sanitizeCause(cause)}`);
    return { issues: [], degradations, truncated: false };
  }
  const issues = listed.map(normalizeEntry).filter((entry) => entry !== null);
  const truncated = issues.length >= limit;

  // The comment carrier: the condition that started this unit was written in a
  // comment, so a body-only sweep would have missed it. One bounded search per
  // phrasing stem, then one view per hit.
  const stems = [...new Set(CONDITION_PATTERNS.map((row) => row.phrase.replace(/\s*#N$/u, "")))];
  const hits = new Set();
  for (const stem of stems) {
    const search = spawnSync(
      ghBin,
      ["search", "issues", ...repoArgs, "--match", "comments", "--state", "all", "--limit", String(commentLimit), "--json", "number", "--", stem],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 60000, cwd },
    );
    if (search.error || search.status !== 0) {
      degradations.push(`unavailable-forge-comment-scan-${sanitizeCause(search.error ?? search.stderr)}`);
      continue;
    }
    let found = [];
    try {
      found = JSON.parse(search.stdout);
    } catch (cause) {
      degradations.push(`unavailable-forge-comment-scan-${sanitizeCause(cause)}`);
      continue;
    }
    for (const hit of found) if (typeof hit.number === "number") hits.add(hit.number);
  }
  const resolved = [...hits].sort((a, b) => a - b).slice(0, commentLimit);
  for (const number of resolved) {
    const view = spawnSync(
      ghBin,
      ["issue", "view", String(number), ...repoArgs, "--json", "number,state,body,comments"],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 60000, cwd },
    );
    if (view.error || view.status !== 0) {
      degradations.push(`unavailable-forge-issue-view-${sanitizeCause(view.error ?? view.stderr)}`);
      continue;
    }
    let entry = null;
    try {
      entry = normalizeEntry(JSON.parse(view.stdout));
    } catch (cause) {
      degradations.push(`unavailable-forge-issue-view-${sanitizeCause(cause)}`);
      continue;
    }
    if (entry === null) continue;
    const at = issues.findIndex((candidate) => candidate.number === entry.number);
    if (at === -1) issues.push(entry);
    else issues[at] = entry;
  }
  if (hits.size > resolved.length) degradations.push("unavailable-forge-comment-scan-truncated");

  return { issues, degradations, truncated };
}

/**
 * The roadmap corpus: the `## Fixes` rows, read through the table's own parser.
 *
 * @param {string} root
 * @returns {{rows: Array<{issue: number, status: string, notes: string}>, degradations: string[]}}
 */
export function readRoadmapCorpus(root = process.cwd()) {
  const index = readRoadmapIndex(root);
  if (index === null) return { rows: [], degradations: ["unavailable-roadmap-index-absent"] };
  const table = roadmapTableRows(index.text, "fix");
  if (table.length < 2) return { rows: [], degradations: ["unavailable-roadmap-fixes-table-absent"] };

  const header = table[0].map((cell) => cell.toLowerCase());
  const keyAt = Math.max(0, header.findIndex((cell) => ["issue", "issues", "#"].includes(cell)));
  const statusAt = header.indexOf("status");
  const notesAt = header.indexOf("notes");
  const rows = [];
  for (const cells of table.slice(1)) {
    const key = /\[#(\d+)\]/u.exec(cells[keyAt] ?? "") ?? /^#?(\d+)$/u.exec((cells[keyAt] ?? "").trim());
    if (key === null) continue;
    rows.push({
      issue: Number(key[1]),
      status: statusAt >= 0 ? cells[statusAt] ?? "" : "",
      notes: notesAt >= 0 ? cells[notesAt] ?? "" : cells[cells.length - 1] ?? "",
    });
  }
  return { rows, degradations: [] };
}

/* --------------------------------------------------------------------- the CLI */

const USAGE =
  "usage: agentic-workflow delivery-conditions --close-check <issue> [--issues-file <json>] [--repo <owner/name>]\n"
  + "       agentic-workflow delivery-conditions --sweep [--issues-file <json>] [--repo <owner/name>] [--root <dir>] [--limit <n>] [--json]";

/** A usage error: the fixed exit 2 and the usage block, never a stack trace. */
function usage(message) {
  process.stderr.write(`${message}\n${USAGE}\n`);
  return 2;
}

/**
 * The CLI entry the runner's closed table dispatches.
 *
 * @param {string[]} argv
 * @param {{root?: string, feedback?: object}} [options]
 * @returns {Promise<number|void>}
 */
export async function main(argv = process.argv.slice(2), options = {}) {
  const root = options.root ?? process.cwd();
  const args = { closeCheck: null, sweep: false, issuesFile: null, repo: null, limit: DEFAULT_LIMIT, json: false };
  let feedbackArgs = null;
  try {
    feedbackArgs = parseFeedbackArgs(argv);
  } catch {
    feedbackArgs = null;
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      index += 1;
      return next;
    };
    try {
      if (arg === "--close-check") args.closeCheck = Number(value());
      else if (arg === "--sweep") args.sweep = true;
      else if (arg === "--issues-file") args.issuesFile = path.resolve(value());
      else if (arg === "--repo") args.repo = value();
      else if (arg === "--root") args.root = path.resolve(value());
      else if (arg === "--limit") args.limit = Number(value());
      else if (arg === "--json") args.json = true;
      else if (arg === "--debug" || arg === "--profile" || arg === "--quiet") continue;
      else return usage(`unknown argument: ${arg}`);
    } catch (cause) {
      return usage(cause.message);
    }
  }

  if (!args.sweep && args.closeCheck === null) return usage("delivery-conditions needs --sweep or --close-check <issue>");
  if (args.sweep && args.closeCheck !== null) return usage("--sweep and --close-check are one mode each");
  if (args.closeCheck !== null && (!Number.isInteger(args.closeCheck) || args.closeCheck <= 0)) {
    return usage("--close-check needs a positive issue number");
  }
  if (!Number.isInteger(args.limit) || args.limit <= 0) return usage("--limit needs a positive integer");

  const feedback = options.feedback ?? createFeedback({ ...(feedbackArgs ?? {}), subject: "delivery-conditions" });
  feedback.attach();

  if (args.issuesFile !== null && !fs.existsSync(args.issuesFile)) {
    // The input the caller named does not exist: that is a usage error, never a
    // "clean" answer the caller could mistake for a check that ran.
    return usage(`--issues-file not found: ${args.issuesFile}`);
  }

  const read = await feedback.stage("corpus", () =>
    readCorpus({ issuesFile: args.issuesFile, repo: args.repo, limit: args.limit, cwd: args.root }),
  );

  if (args.closeCheck !== null) {
    const issue = read.issues.find((entry) => entry.number === args.closeCheck);
    const degradations = [...read.degradations];
    if (issue === undefined) {
      degradations.push(read.issues.length === 0 ? "corpus-empty-nothing-checked" : "corpus-missing-citing-issue");
    }
    const states = statesOf(read.issues);
    const report = issue === undefined
      ? {
        contract: CONTRACT_ID,
        mode: `close-check ${args.closeCheck}`,
        corpus: { issues: read.issues.length, "text-units": 0, conditions: 0, findings: 0, advisories: 0, unjudged: 0, truncated: read.truncated },
        conditions: [],
        findings: [],
        advisories: [],
        refusals: [],
        degradations: [...new Set(degradations)].sort(),
        verdict: "UNRESOLVED",
      }
      : closeCheck({ issue, states });
    if (issue !== undefined) report.degradations = [...new Set([...report.degradations, ...degradations])].sort();
    process.stdout.write(args.json ? `${JSON.stringify(report, null, 2)}\n` : render(report));
    feedback.done(`verdict ${report.verdict}`);
    return report.verdict === "PASS" ? 0 : 1;
  }

  const roadmap = readRoadmapCorpus(args.root);
  const report = evaluate({
    issues: read.issues,
    roadmapRows: roadmap.rows,
    limit: args.issuesFile === null ? args.limit : undefined,
    truncated: read.truncated,
    degradations: [...read.degradations, ...roadmap.degradations],
  });
  process.stdout.write(args.json ? `${JSON.stringify(report, null, 2)}\n` : render(report));
  feedback.done(`verdict ${report.verdict}`);
  return report.verdict === "PASS" ? 0 : 1;
}

export default main;
