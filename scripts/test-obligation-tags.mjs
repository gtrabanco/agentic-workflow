#!/usr/bin/env node
/**
 * test-obligation-tags.mjs — the justification half of test relevance (issue
 * #596, S2/S3/S4).
 *
 * The targeting half already answers "which tests can THIS change affect?"
 * (`scripts/test-impact.mjs`, #356). This is the other question: **which surface
 * does a suite protect, and what obligation do its assertions cover there?** A
 * repository that cannot answer it cannot justify a test's cost, and the only
 * cheap answer left is line coverage — which the literature measures at roughly
 * zero correlation with fault detection once suite size is controlled
 * (Inozemtseva & Holmes, ICSE 2014). So the answer is declared, beside the
 * suite, in a form a gate can read:
 *
 *     // test-obligation: protects=<path>[,<path>…] obligations=<kind>[,<kind>…]
 *
 * The declaration sits at the suite's head — line 1, or line 2 after a shebang —
 * so it cannot rot away from what it describes the way a central registry does.
 * Four refusals follow from it, and nothing else:
 *
 *   tag-missing             a root suite declares nothing, so its cost is
 *                           unjustified by construction;
 *   tag-misplaced           the declaration is not at the head (the contract is
 *                           "beside the suite", and a head is what a reader and
 *                           this gate both find);
 *   tag-shape               a half or empty declaration, refused by name rather
 *                           than half-trusted;
 *   tag-unknown-obligation  a value outside the published closed set
 *                           (`TEST_OBLIGATION_KINDS`, read from committed
 *                           source) — a private vocabulary is not a vocabulary;
 *   tag-dead-surface        a protected path that no longer exists. This is the
 *                           rule that makes "the surface is gone, so the test
 *                           goes" detectable on every push instead of
 *                           re-derivable at every audit.
 *
 * The sweep is the report mode, not a second mechanism. `--sweep` clusters the
 * tags by protected surface, labels the obligation-level duplicates (same
 * surface, same obligation set — never line coverage), and ranks the clusters by
 * measured cost per obligation value using the root gate's own
 * `PASS <file> (N.Ns)` lines. The deterministic result is the suspect list a
 * selective kill-rate runs on; it is capped by design, because an exhaustive
 * mutation sweep was already rejected on measured cost.
 *
 * Usage
 *   bun scripts/test-obligation-tags.mjs                  the gate, over the root suite set
 *   bun scripts/test-obligation-tags.mjs --root <dir>     another tree (fixtures, a checkout)
 *   bun scripts/test-obligation-tags.mjs --list           one line per tagged suite
 *   bun scripts/test-obligation-tags.mjs --json           the machine document
 *   bun scripts/test-obligation-tags.mjs --vocabulary     the closed set vs its owner doc
 *   bun scripts/test-obligation-tags.mjs --sweep [--cost <log|->]   the cluster and suspect table
 *   (node fallback, same argv)
 *
 * Exit: 0 the verdict is PASS · 1 it is FAIL (a refusal or an undescribed set) ·
 * 2 a usage error. Read-only: it reads bytes and writes nothing.
 *
 * Its sibling suite is `scripts/test-obligation-tags.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const CONTRACT_ID = "test-obligation-tags@1";
/** The one annotation prefix. A suite's head carries it or the suite is untagged. */
export const TAG_PREFIX = "// test-obligation: ";
/** The grammar's id, published by its owner doc (issue #596 S1/S7). */
export const TAG_GRAMMAR_ID = "test-obligation-tag@1";
export const TAG_GRAMMAR_OWNER = "skills/unit-lane/references/TESTS.md";
export const VOCABULARY_SOURCE = "packages/agentic-workflow-schema/src/vocabularies.ts";
export const VOCABULARY_EXPORT = "TEST_OBLIGATION_KINDS";
export const SUITE_DIR = "scripts";
export const SUITE_SUFFIX = ".test.mjs";

/** The closed finding set. Order is report order. */
export const FINDING_CODES = Object.freeze([
  "tag-missing",
  "tag-misplaced",
  "tag-shape",
  "tag-unknown-obligation",
  "tag-dead-surface",
]);

/** The declared suspect ceiling: seconds of measured cost per obligation value.
 *  A cluster over it is a suspicion, not a verdict — the kill-rate decides. */
export const COST_PER_OBLIGATION_LIMIT = 1;
/** The sweep is never exhaustive: at most this many clusters run kill-rate. */
export const SUSPECT_LIMIT = 5;

const uniq = (values) => [...new Set(values)];

/* --------------------------------------------------------------- the sources */

/**
 * The published obligation set, read from committed source. The reader is a
 * text scan rather than an import on purpose: the gate must run on a tree whose
 * `dist/` was never built (a fresh clone), and the const's declaration is the
 * authority either way.
 */
export function publishedObligationKinds(text) {
  const at = String(text).indexOf(`export const ${VOCABULARY_EXPORT} = Object.freeze([`);
  if (at === -1) return [];
  const end = String(text).indexOf("]);", at);
  if (end === -1) return [];
  return [...String(text).slice(at, end).matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
}

/**
 * The values the owner doc's `test-obligation-tag@1` block names, one `kind
 * <value>` row each. A block that names a value the const does not publish (or
 * the reverse) is drift, and `--vocabulary` reports it.
 */
export function obligationBlockKinds(text) {
  const lines = String(text).split("\n");
  const start = lines.findIndex((line, index) => line.trim() === "```text" && lines[index + 1]?.trim() === TAG_GRAMMAR_ID);
  if (start === -1) return [];
  const values = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "```") break;
    const cells = line.split(" | ");
    const head = cells[0]?.trim() ?? "";
    if (!head.startsWith("kind ")) continue;
    values.push(head.slice("kind ".length).trim());
  }
  return uniq(values.filter(Boolean));
}

/* ---------------------------------------------------------------- the grammar */

/** A suite's declaration, or its faults. Ordered shape: `protects=` first. */
export function parseTag(line) {
  const text = String(line);
  if (!text.startsWith(TAG_PREFIX)) return { protects: [], obligations: [], faults: ["unparsable"] };
  const body = text.slice(TAG_PREFIX.length).trim();
  const ordered = /^protects=(\S*)\s+obligations=(\S*)$/.exec(body);
  const split = (value) => String(value ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
  if (ordered === null) {
    const has = (key) => new RegExp(`(^|\\s)${key}=`).test(body);
    if (!has("protects") && !has("obligations")) return { protects: [], obligations: [], faults: ["unparsable"] };
    const faults = [];
    if (!has("protects")) faults.push("missing-protects");
    if (!has("obligations")) faults.push("missing-obligations");
    return { protects: [], obligations: [], faults: faults.length === 0 ? ["unparsable"] : faults };
  }
  const protects = split(ordered[1]);
  const obligations = split(ordered[2]);
  const faults = [];
  if (protects.length === 0) faults.push("empty-protects");
  if (obligations.length === 0) faults.push("empty-obligations");
  return { protects, obligations, faults };
}

/** The declared head index of a suite: 1 after a shebang, else 0. */
const headIndex = (lines) => (lines[0]?.startsWith("#!") ? 1 : 0);

/* -------------------------------------------------------------- the refusals */

/**
 * Every refusal the live tree owes, over `dir/*.test.mjs`.
 * @returns {{code: string, file: string, detail: string}[]} sorted by file, code
 */
export function tagFindings({ root, kinds, dir = SUITE_DIR }) {
  const base = path.join(root, dir);
  const files = fs.existsSync(base) ? fs.readdirSync(base).filter((name) => name.endsWith(SUITE_SUFFIX)).sort() : [];
  const findings = [];
  for (const name of files) {
    const file = path.posix.join(dir, name);
    const lines = fs.readFileSync(path.join(base, name), "utf8").split("\n");
    const head = headIndex(lines);
    const at = lines.findIndex((line) => line.startsWith(TAG_PREFIX));
    if (at === -1) {
      findings.push({ code: "tag-missing", file, detail: `the head declares no ${TAG_PREFIX.trim()} line` });
      continue;
    }
    if (at !== head) {
      findings.push({ code: "tag-misplaced", file, detail: `the declaration is on line ${at + 1}; the head is line ${head + 1}` });
      continue;
    }
    const parsed = parseTag(lines[head]);
    if (parsed.faults.length > 0) {
      findings.push({ code: "tag-shape", file, detail: `${parsed.faults.join(", ")} in "${lines[head].slice(TAG_PREFIX.length)}"` });
      continue;
    }
    const unknown = parsed.obligations.filter((value) => !kinds.includes(value));
    if (unknown.length > 0) {
      findings.push({ code: "tag-unknown-obligation", file, detail: `${unknown.join(", ")} not in ${kinds.join(" | ")}` });
    }
    const gone = parsed.protects.filter((target) => !fs.existsSync(path.join(root, target)));
    if (gone.length > 0) {
      findings.push({ code: "tag-dead-surface", file, detail: `${gone.join(", ")} does not exist` });
    }
  }
  return findings.sort((left, right) => `${left.file}${left.code}`.localeCompare(`${right.file}${right.code}`));
}

/** The parsed declarations of one tree, in file order. */
export function readSuites({ root, kinds, dir = SUITE_DIR }) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base)
    .filter((name) => name.endsWith(SUITE_SUFFIX))
    .sort()
    .map((name) => {
      const file = path.posix.join(dir, name);
      const lines = fs.readFileSync(path.join(base, name), "utf8").split("\n");
      const head = headIndex(lines);
      const parsed = lines[head]?.startsWith(TAG_PREFIX) ? parseTag(lines[head]) : { protects: [], obligations: [], faults: [] };
      const unknown = parsed.obligations.filter((value) => !kinds.includes(value));
      return {
        file,
        protects: parsed.protects,
        obligations: parsed.obligations,
        faults: parsed.faults,
        unknown,
      };
    });
}

/* ----------------------------------------------------------------- the sweep */

/**
 * The cost column the root gate already prints: `PASS <file> (N.Ns)`. A failing
 * suite is not a cost measurement of passing work, so only PASS lines count.
 */
export function parseCostLog(text) {
  const costs = new Map();
  for (const line of String(text).split("\n")) {
    const match = /^PASS\s+(\S+\.test\.mjs)\s+\((\d+(?:\.\d+)?)s\)/.exec(line.trim());
    if (match === null) continue;
    costs.set(match[1], Number(match[2]));
  }
  return costs;
}

/**
 * One row per protected surface: the suites that protect it, the obligations
 * they cover there, the slowest one's measured cost, and the decision its tags
 * support. `duplicate` is declaration evidence — the asserted behaviour behind
 * each suite is what a deletion decision must read, never line coverage.
 */
export function clusterRows(entries, costs = new Map(), { root = null } = {}) {
  const clusters = new Map();
  for (const entry of entries) {
    for (const surface of entry.protects) {
      const cluster = clusters.get(surface) ?? { surface, suites: [], sets: [] };
      cluster.suites.push(entry.file);
      cluster.sets.push([...entry.obligations].sort().join(","));
      clusters.set(surface, cluster);
    }
  }
  return [...clusters.values()]
    .map((cluster) => {
      const obligations = uniq(cluster.sets.flatMap((set) => (set === "" ? [] : set.split(",")))).sort();
      const measured = cluster.suites.map((file) => costs.get(file) ?? 0);
      const dead = root !== null && !fs.existsSync(path.join(root, cluster.surface));
      const identical = cluster.suites.length > 1 && uniq(cluster.sets).length === 1 && cluster.sets[0] !== "";
      return {
        surface: cluster.surface,
        suites: cluster.suites,
        obligations,
        cost: Math.max(...measured),
        decision: dead ? "delete" : identical ? "duplicate" : "keep",
      };
    })
    .sort((left, right) => left.surface.localeCompare(right.surface));
}

/**
 * The declared selection rule, as code: a cluster is a **suspect** when it is an
 * obligation-level duplicate (its decision is `duplicate`) or when its measured
 * cost per obligation value reaches `COST_PER_OBLIGATION_LIMIT`; suspects are
 * ordered by that ratio, descending, and the first `SUSPECT_LIMIT` are
 * **selected** for kill-rate. Every suspect keeps its flag, so the sweep's
 * record names the whole candidate set and the bounded measurement separately.
 */
export function selectSuspects(rows) {
  const scored = rows.map((row) => ({ ...row, ratio: row.cost / Math.max(1, row.obligations.length) }));
  const suspects = scored
    .filter((row) => row.decision === "duplicate" || row.ratio >= COST_PER_OBLIGATION_LIMIT)
    .sort((left, right) => right.ratio - left.ratio || left.surface.localeCompare(right.surface));
  const selected = new Set(suspects.slice(0, SUSPECT_LIMIT).map((row) => row.surface));
  const flagged = new Set(suspects.map((row) => row.surface));
  return scored
    .map((row) => ({ ...row, suspect: flagged.has(row.surface), selected: selected.has(row.surface) }))
    .sort((left, right) => left.surface.localeCompare(right.surface));
}

/** The selection rule in one sentence — the report prints it, so it is declared. */
export const SELECTION_RULE =
  `a cluster is a suspect when it is an obligation-level duplicate, or when its measured cost per obligation value ` +
  `is at least ${COST_PER_OBLIGATION_LIMIT} s (cost = the slowest suite on the surface, read from the root gate's own ` +
  `\`PASS <file> (N.Ns)\` lines); suspects are ordered by that ratio, descending, and at most ${SUSPECT_LIMIT} run ` +
  `kill-rate — the sweep is never exhaustive.`;

/* ----------------------------------------------------------------- the report */

const round = (value) => (Math.round(value * 100) / 100).toString();

function gateReport({ suites, findings }) {
  const lines = [
    `${CONTRACT_ID} — ${suites.length} suite(s) · ${findings.length} finding(s)`,
  ];
  for (const finding of findings) lines.push(`  ${finding.code} — ${finding.file} — ${finding.detail}`);
  lines.push(`verdict: ${findings.length === 0 ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

function vocabularyReport({ kinds, named, owner }) {
  const missing = kinds.filter((kind) => !named.includes(kind));
  const extra = named.filter((kind) => !kinds.includes(kind));
  const lines = [`${CONTRACT_ID} vocabulary — ${kinds.length - missing.length} of ${kinds.length} value(s) named by ${owner}`];
  for (const kind of kinds) lines.push(`  ${kind} — ${named.includes(kind) ? "named" : "absent"}`);
  for (const kind of extra) lines.push(`  ${kind} — named but not published`);
  lines.push(`verdict: ${missing.length === 0 && extra.length === 0 ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

function sweepReport(rows) {
  const suspects = rows.filter((row) => row.suspect);
  const selected = rows.filter((row) => row.selected);
  const lines = [
    `test-obligation-sweep — ${rows.length} cluster(s) · suspects: ${suspects.length} · selected: ${selected.length}`,
    `selection rule: ${SELECTION_RULE}`,
  ];
  for (const row of rows) {
    const obligations = row.obligations.length === 0 ? "-" : row.obligations.join(",");
    const state = row.selected ? "suspect · selected" : row.suspect ? "suspect" : "held";
    lines.push(
      `  ${row.surface} — ${row.suites.length} suite(s) · obligations ${obligations} · cost ${round(row.cost)}s · ratio ${round(row.ratio)} · ${row.decision} · ${state}`,
    );
  }
  return lines.join("\n");
}

/* --------------------------------------------------------------------- the CLI */

function usage(message) {
  process.stderr.write(`test-obligation-tags: ${message}\n`);
  process.stderr.write("usage: bun scripts/test-obligation-tags.mjs [--root <dir>] [--list|--json|--vocabulary|--sweep [--cost <log|->]]\n");
  process.exit(2);
}

function main(argv) {
  const options = { root: ROOT, mode: "gate", cost: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      options.root = path.resolve(argv[++index] ?? usage("--root needs a directory"));
    } else if (arg === "--cost") {
      const value = argv[++index];
      if (value === undefined) usage("--cost needs a path or - for stdin");
      options.cost =
        value === "-"
          ? fs.readFileSync(0, "utf8")
          : fs.readFileSync(path.resolve(value), "utf8");
    } else if (["--list", "--json", "--vocabulary", "--sweep"].includes(arg)) {
      options.mode = arg.slice(2);
    } else {
      usage(`unknown argument ${arg}`);
    }
  }

  const sourcePath = path.join(options.root, VOCABULARY_SOURCE);
  if (!fs.existsSync(sourcePath)) {
    process.stderr.write(`test-obligation-tags: ${VOCABULARY_SOURCE} is absent under ${options.root} — the closed set has no source to resolve against\n`);
    process.exit(1);
  }
  const kinds = publishedObligationKinds(fs.readFileSync(sourcePath, "utf8"));
  if (kinds.length === 0) {
    process.stderr.write(`test-obligation-tags: ${VOCABULARY_SOURCE} publishes no ${VOCABULARY_EXPORT}\n`);
    process.exit(1);
  }

  if (options.mode === "vocabulary") {
    const ownerPath = path.join(options.root, TAG_GRAMMAR_OWNER);
    if (!fs.existsSync(ownerPath)) {
      process.stderr.write(`test-obligation-tags: ${TAG_GRAMMAR_OWNER} is absent under ${options.root} — the grammar has no owner doc\n`);
      process.exit(1);
    }
    const named = obligationBlockKinds(fs.readFileSync(ownerPath, "utf8"));
    const report = vocabularyReport({ kinds, named, owner: TAG_GRAMMAR_OWNER });
    process.stdout.write(`${report}\n`);
    process.exit(report.endsWith("verdict: PASS") ? 0 : 1);
  }

  const suites = readSuites({ root: options.root, kinds });
  const findings = tagFindings({ root: options.root, kinds });

  if (options.mode === "list") {
    for (const suite of suites) process.stdout.write(`${suite.file} protects=${suite.protects.join(",")} obligations=${suite.obligations.join(",")}\n`);
    process.exit(findings.length === 0 ? 0 : 1);
  }

  if (options.mode === "sweep") {
    const costs = options.cost === null ? new Map() : parseCostLog(options.cost);
    const rows = selectSuspects(clusterRows(suites, costs, { root: options.root }));
    process.stdout.write(`${sweepReport(rows)}\n`);
    process.exit(rows.some((row) => row.decision === "delete") ? 1 : 0);
  }

  if (options.mode === "json") {
    const document = {
      contract: CONTRACT_ID,
      grammar: TAG_GRAMMAR_ID,
      vocabulary: kinds,
      suites,
      findings,
      verdict: findings.length === 0 ? "PASS" : "FAIL",
    };
    process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
    process.exit(findings.length === 0 ? 0 : 1);
  }

  const report = gateReport({ suites, findings });
  process.stdout.write(`${report}\n`);
  process.exit(findings.length === 0 ? 0 : 1);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
