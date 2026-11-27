/**
 * test-obligation-tags — the justification half of test relevance (issue
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
 *   test-obligation-tags                  the gate, over the root suite set
 *   test-obligation-tags --root <dir>     another tree (fixtures, a checkout)
 *   test-obligation-tags --list           one line per tagged suite
 *   test-obligation-tags --json           the machine document
 *   test-obligation-tags --vocabulary     the closed set vs its owner doc
 *   test-obligation-tags --sweep [--cost <log|->]   the cluster and suspect table
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

// Inside the crate the schema package is the dependency (issue #553): a
// repo-relative path under the project root names a file no consumer has.
const { TEST_OBLIGATION_KINDS } = await import("@gtrabanco/agentic-workflow-schema");

let ROOT = process.cwd();

/** The tree this gate reads: the caller's root, else the cwd. */
function setRoot(dir) {
  if (dir) ROOT = path.resolve(dir);
}

export const CONTRACT_ID = "test-obligation-tags@1";
/** The one annotation prefix. A suite's head carries it or the suite is untagged. */
export const TAG_PREFIX = "// test-obligation: ";
/** The grammar's id, published by its owner doc (issue #596 S1/S7). */
export const TAG_GRAMMAR_ID = "test-obligation-tag@1";
export const TAG_GRAMMAR_OWNER = "skills/unit-lane/references/TESTS.md";
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
 * The published obligation set, parsed out of committed source. The sibling
 * suite reads the declaration where it is written — the source is the
 * authority it asserts, so a stale `dist/` cannot stand in for it — while the
 * command's own gate imports the published set from the package instead
 * (issue #717) and `--vocabulary` compares that imported value against the
 * owner doc's block below.
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

function gateReport({ suites, findings, root }) {
  const lines = [
    `${CONTRACT_ID} — ${suites.length} suite(s) · ${findings.length} finding(s)`,
  ];
  for (const finding of findings) lines.push(`  ${finding.code} — ${finding.file} — ${finding.detail}`);
  // No suite at all is a refusal, never a pass: the gate found nothing to judge,
  // which is what a foreign tree looks like when its suites live elsewhere
  // (issue #717). An estate of zero rows is a defect by this crate's own
  // fail-closed standard, even though every individual row is fine.
  if (suites.length === 0) lines.push(`  estate-empty — ${SUITE_DIR}/ — no suite under the declared legs (${root})`);
  lines.push(`verdict: ${findings.length === 0 && suites.length > 0 ? "PASS" : "FAIL"}`);
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

/* ---------------------------------------------------------------- the estate */

/** The package trees' suite suffix. A package suite is any `*.test.*` file
 *  under `packages/<name>/test/` — the same "beside the suite" rule the root
 *  gate applies, read from the tree instead of a registry (issue #598). */
export const PACKAGE_TEST_FILE = /\.test\.(?:mjs|js|ts|tsx)$/;

/** What a resolved import may be, in resolution order. */
const RESOLVE_EXTENSIONS = [".mjs", ".ts", ".tsx", ".js", ".json"];

const isFile = (target) => {
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
};

const exists = (target) => fs.existsSync(target);

/** The packages that carry a `test/` tree, in name order. */
function packagesWithTests(root) {
  const base = path.join(root, "packages");
  if (!exists(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && exists(path.join(base, entry.name, "test")))
    .map((entry) => entry.name)
    .sort();
}

/** Every suite file under one package's `test/` tree, repo-relative and sorted. */
function packageSuites(root, pkg) {
  const found = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel, prefix);
      else if (PACKAGE_TEST_FILE.test(entry.name)) found.push(rel);
    }
  };
  walk(`packages/${pkg}/test`);
  return found.sort();
}

/**
 * The surfaces a package suite protects, read from its own imports: a relative
 * import that resolves inside the same package and outside the suite's own
 * `test/` tree names code the suite exercises. `../dist/x.js` — how the shipped
 * packages' suites reach the build — maps back to the source it was compiled
 * from, because the source is the surface and the build output is not.
 *
 * A specifier that resolves nowhere (a gitignored build before `tsc`) is
 * ignored rather than guessed, and a helper under `test/` is a fixture, never a
 * protected surface: a suite whose imports all land there protects `undeclared`.
 */
export function resolveImportedSurfaces({ root, file }) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const specifiers = [...text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((match) => match[1]);
  const pkgRoot = file.split("/").slice(0, 2).join("/");
  const testPrefix = `${pkgRoot}/test/`;
  const surfaces = new Set();
  for (const specifier of specifiers) {
    if (!specifier.startsWith(".")) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const stripped = target.replace(/\.[^./]+$/, "");
    // A build output is not a surface: `../dist/x.js` names the source it was
    // compiled from, so the source mapping is asked first and `dist/` never
    // answers.
    const candidates = [];
    if (target.includes("/dist/")) {
      const source = stripped.replace("/dist/", "/src/");
      for (const extension of RESOLVE_EXTENSIONS) candidates.push(`${source}${extension}`);
      candidates.push(source);
    }
    candidates.push(target);
    for (const extension of RESOLVE_EXTENSIONS) candidates.push(`${target}${extension}`);
    for (const extension of RESOLVE_EXTENSIONS) candidates.push(`${stripped}${extension}`);
    const hit = candidates.find((candidate) => isFile(path.join(root, candidate)));
    if (hit === undefined) continue;
    if (!hit.startsWith(`${pkgRoot}/`) || hit.startsWith(testPrefix) || hit.includes(`${pkgRoot}/dist/`)) continue;
    surfaces.add(hit);
  }
  return [...surfaces].sort();
}

/**
 * The estate: every root suite (its declaration, read from the tag at its head)
 * and every package suite (its surface, resolved from its imports, and no
 * obligation class, because no tag declares one).
 */
export function discoverEstate({ root }) {
  const rows = [];
  const rootDir = path.join(root, SUITE_DIR);
  if (exists(rootDir)) {
    for (const name of fs.readdirSync(rootDir).filter((entry) => entry.endsWith(SUITE_SUFFIX)).sort()) {
      const file = `${SUITE_DIR}/${name}`;
      const lines = fs.readFileSync(path.join(root, file), "utf8").split("\n");
      const head = headIndex(lines);
      const parsed = lines[head]?.startsWith(TAG_PREFIX) ? parseTag(lines[head]) : { protects: [], obligations: [] };
      rows.push({
        suite: file,
        scope: "root",
        surfaces: [...parsed.protects].sort(),
        obligations: [...parsed.obligations].sort(),
        declared: parsed.protects.length > 0 && parsed.obligations.length > 0,
      });
    }
  }
  for (const pkg of packagesWithTests(root)) {
    for (const file of packageSuites(root, pkg)) {
      const lines = fs.readFileSync(path.join(root, file), "utf8").split("\n");
      const head = headIndex(lines);
      const tagged = lines[head]?.startsWith(TAG_PREFIX);
      const parsed = tagged ? parseTag(lines[head]) : { protects: [], obligations: [] };
      rows.push({
        suite: file,
        scope: `packages/${pkg}`,
        surfaces: tagged ? [...parsed.protects].sort() : resolveImportedSurfaces({ root, file }),
        obligations: tagged ? [...parsed.obligations].sort() : [],
        declared: tagged && parsed.protects.length > 0 && parsed.obligations.length > 0,
      });
    }
  }
  return rows.sort((left, right) => left.suite.localeCompare(right.suite));
}

/**
 * The owner's adjudications, one row each:
 *
 *     suite | standard | what was read | verdict
 *
 * A line beginning with `#` is prose, the header row is skipped, and the last
 * cell is the verdict (`keep` or `delete`). This is the only hand-authored input
 * in the estate: a standard that would change the tree is a measurement, and the
 * ruling on it is the owner's (issue #598, `S3`).
 */
export function readAdjudications(text) {
  const rows = new Map();
  for (const line of String(text).split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith("```")) continue;
    const cells = trimmed.split("|").map((cell) => cell.trim());
    if (cells.length < 4) continue;
    if (cells[0] === "suite") continue;
    rows.set(cells[0], { standard: cells[1], read: cells.slice(2, -1).join(" | "), verdict: cells[cells.length - 1] });
  }
  return rows;
}

/**
 * One row per suite with the standard its evidence fires and the verdict that
 * standard supports. Three standards, never line coverage (owner rule
 * 2026-11-16):
 *
 *   dead-surface          a declared protected path no longer exists ⇒ `delete`
 *   obligation-duplicate  identical protected surfaces AND identical obligation
 *                         set on at least two suites ⇒ one `keep` survivor (the
 *                         cheapest measured one) and `merge` for the rest
 *   cost-over-risk        measured cost per obligation value at or above the
 *                         declared limit ⇒ the standard fires, the verdict stays
 *                         `keep` and the row is a `suspect` until adjudicated
 *
 * An adjudication replaces the verdict of a row that fires; a `delete`/`merge`
 * that no adjudication rules on is reported as missing, never silently applied.
 */
export function estateRows({ root, rows, costs = new Map(), adjudications = new Map() }) {
  const withEvidence = rows.map((row) => {
    const cost = costs.get(row.suite) ?? null;
    const dead = row.surfaces.some((surface) => !exists(path.join(root, surface)));
    return { ...row, cost, dead };
  });
  const groups = new Map();
  for (const row of withEvidence) {
    if (row.dead || !row.declared || row.surfaces.length === 0 || row.obligations.length === 0) continue;
    const key = `${row.surfaces.join(",")}|${row.obligations.join(",")}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const survivorOf = new Map();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort((left, right) => (left.cost ?? Number.POSITIVE_INFINITY) - (right.cost ?? Number.POSITIVE_INFINITY) || left.suite.localeCompare(right.suite));
    for (const row of ordered.slice(1)) survivorOf.set(row.suite, ordered[0].suite);
  }
  const rows_ = withEvidence.map((row) => {
    let evidence = row.declared ? "declared" : "undeclared";
    let verdict = "keep";
    let survivor = null;
    if (row.dead) {
      evidence = "dead-surface";
      verdict = "delete";
    } else if (survivorOf.has(row.suite)) {
      evidence = "obligation-duplicate";
      verdict = "merge";
      survivor = survivorOf.get(row.suite);
    } else if (
      row.obligations.length > 0 &&
      row.cost !== null &&
      row.cost / row.obligations.length >= COST_PER_OBLIGATION_LIMIT
    ) {
      evidence = "cost-over-risk";
    }
    const derivedVerdict = verdict;
    const adjudication = adjudications.get(row.suite);
    const adjudicated = adjudication !== undefined;
    if (adjudication !== undefined && (adjudication.verdict === "keep" || adjudication.verdict === "delete")) {
      verdict = adjudication.verdict;
      survivor = adjudication.verdict === "keep" ? null : survivor;
    }
    return { suite: row.suite, scope: row.scope, surfaces: row.surfaces, obligations: row.obligations, cost: row.cost, evidence, derived: derivedVerdict, verdict, survivor, adjudicated, selected: false };
  });
  // The cost-over-risk standard fires as a measurement; the bounded instrument
  // is the declared selection (at most `SUSPECT_LIMIT`, highest cost per
  // obligation first), exactly as the sweep's kill-rate list is capped.
  const overRisk = rows_
    .filter((row) => row.evidence === "cost-over-risk")
    .sort(
      (left, right) =>
        (right.cost ?? 0) / Math.max(1, right.obligations.length) - (left.cost ?? 0) / Math.max(1, left.obligations.length) ||
        left.suite.localeCompare(right.suite),
    );
  const selected = new Set(overRisk.slice(0, SUSPECT_LIMIT).map((row) => row.suite));
  return rows_.map((row) => ({ ...row, selected: selected.has(row.suite) }));
}

/** The rows whose standard wants a ruling the estate does not have yet. */
export function missingAdjudications(rows) {
  return rows.filter((row) => (row.verdict === "delete" || row.verdict === "merge") && row.adjudicated !== true);
}

function estateReport(rows, scope, source = null) {
  const fired = rows.filter((row) => row.evidence !== "declared" && row.evidence !== "undeclared");
  const suspects = rows.filter((row) => row.evidence === "cost-over-risk");
  const selected = suspects.filter((row) => row.selected);
  const missing = missingAdjudications(rows);
  const tallies = { delete: 0, keep: 0, merge: 0 };
  for (const row of rows) tallies[row.verdict] += 1;
  const lines = [
    `${CONTRACT_ID} estate — ${scope.root} root suite(s) · ${scope.packages} package suite(s) · ${rows.length} row(s) · standards fired: ${fired.length} · cost-over-risk: ${suspects.length} · selected: ${selected.length} · adjudications missing: ${missing.length}${source === null ? "" : `\nadjudications: ${source}`}`,
    `selection rule: ${SELECTION_RULE}`,
    "",
    "| suite | scope | surface | obligations | cost (s) | evidence | verdict |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const row of rows) {
    const surfaces = row.surfaces.length === 0 ? "-" : row.surfaces.map((surface) => `\`${surface}\``).join(", ");
    const obligations = row.obligations.length === 0 ? "undeclared" : row.obligations.join(",");
    const cost = row.cost === null ? "unmeasured" : round(row.cost);
    const verdict = row.survivor !== null ? `${row.verdict} → \`${row.survivor}\`` : row.selected ? `${row.verdict} · selected` : row.verdict;
    lines.push(`| \`${row.suite}\` | ${row.scope} | ${surfaces} | ${obligations} | ${cost} | ${row.evidence} | ${verdict} |`);
  }
  const adjudicated = rows.filter((row) => row.adjudicated || row.selected);
  if (adjudicated.length > 0) {
    lines.push("", "### adjudication", "", "| suite | standard | derived | adjudicated |", "|---|---|---|---|");
    for (const row of adjudicated) {
      lines.push(`| \`${row.suite}\` | ${row.evidence} | ${row.derived ?? row.verdict} | ${row.verdict} |`);
    }
    const nonKeep = rows.filter((row) => row.derived !== undefined && row.derived !== "keep").length;
    lines.push(
      "",
      `derived non-keep: ${nonKeep} · selected: ${rows.filter((row) => row.selected).length} · adjudicated: ${adjudicated.length} of ${adjudicated.length}`,
    );
  }
  if (missing.length > 0) {
    lines.push("", "missing adjudication (a standard that would change the tree needs its ground recorded):");
    for (const row of missing) lines.push(`  ${row.suite} — ${row.evidence}`);
  }
  return { text: lines.join("\n"), tallies, missing };
}

/** The declared push budget's receipt (`pre-push-budget@1`), as the estate
 *  report renders it: the three change classes and their two measurements. The
 *  numbers live in that manifest and nowhere else — a table typed into a unit
 *  doc drifts from the run it claims. */
export function readBudgetManifest(text) {
  const manifest = JSON.parse(text);
  if (manifest?.contract !== "pre-push-budget@1") throw new Error("the budget manifest is not pre-push-budget@1");
  if (!Array.isArray(manifest.classes) || manifest.classes.length === 0) throw new Error("the budget manifest records no change class");
  for (const row of manifest.classes) {
    if (typeof row.class !== "string" || !Number.isFinite(row.before) || !Number.isFinite(row.after)) {
      throw new Error(`the budget manifest's row ${JSON.stringify(row.class)} is missing its class or a measurement`);
    }
  }
  return manifest;
}

function budgetSection(manifest) {
  const over = manifest.classes.filter((row) => row.after > manifest.budgetSeconds);
  const lines = [
    "### wall-clock",
    "",
    `budget: ${manifest.budgetSeconds} s on ${manifest.host}`,
    "",
    "| change class | before (s) | after (s) | note |",
    "|---|---|---|---|",
    ...manifest.classes.map((row) => `| \`${row.class}\` | ${row.before} | ${row.after} | ${row.note ?? "-"} |`),
  ];
  if (over.length > 0) {
    lines.push("", `over budget: ${over.map((row) => `${row.class} at ${row.after}s`).join(", ")}`);
  }
  return { text: lines.join("\n"), over };
}

/* --------------------------------------------------------------------- the CLI */

function usage(message) {
  process.stderr.write(`test-obligation-tags: ${message}\n`);
  process.stderr.write(
    "usage: test-obligation-tags [--root <dir>] [--list|--json|--vocabulary|--sweep|--estate [--cost <log|->] [--adjudications <file>] [--budget <file>]]\n",
  );
  process.exit(2);
}

export function main(argv = process.argv.slice(2), context = {}) {
  setRoot(context.root);
  const options = { root: ROOT, mode: "gate", cost: null, estate: false, adjudications: null, budget: null };
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
    } else if (arg === "--estate") {
      options.estate = true;
    } else if (arg === "--budget") {
      const value = argv[++index];
      if (value === undefined) usage("--budget needs a path");
      options.budget = fs.readFileSync(path.resolve(value), "utf8");
    } else if (arg === "--adjudications") {
      const value = argv[++index];
      if (value === undefined) usage("--adjudications needs a path");
      options.adjudicationPath = path.relative(options.root, path.resolve(value)).split(path.sep).join("/");
      options.adjudications = fs.readFileSync(path.resolve(value), "utf8");
    } else if (["--list", "--json", "--vocabulary", "--sweep"].includes(arg)) {
      options.mode = arg.slice(2);
    } else {
      usage(`unknown argument ${arg}`);
    }
  }

  // The published set is the dependency's, never a path under the measured
  // root: `packages/agentic-workflow-schema/src/vocabularies.ts` has no meaning
  // in a target project, and reading it there made the whole command unusable
  // on any tree that is not this repository (issue #717, the #553 rule).
  const kinds = [...TEST_OBLIGATION_KINDS];
  if (kinds.length === 0) {
    process.stderr.write(`test-obligation-tags: the installed schema package publishes no ${VOCABULARY_EXPORT}\n`);
    process.exit(1);
  }

  if (options.mode === "vocabulary") {
    const ownerPath = path.join(options.root, TAG_GRAMMAR_OWNER);
    if (!fs.existsSync(ownerPath)) {
      // The owner doc ships with the skills tree, not with the crate: on a
      // target project the parity check has nothing to compare and says so
      // instead of refusing a file the project can never carry (issue #717).
      process.stdout.write(`${CONTRACT_ID} vocabulary — n/a — product-internal: ${TAG_GRAMMAR_OWNER} ships with the skills tree, not with this crate\nverdict: PASS\n`);
      process.exit(0);
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

  if (options.estate) {
    const rows = discoverEstate({ root: options.root });
    const scope = {
      root: rows.filter((row) => row.scope === "root").length,
      packages: rows.filter((row) => row.scope !== "root").length,
    };
    const costs = options.cost === null ? new Map() : parseCostLog(options.cost);
    const adjudications = options.adjudications === null ? new Map() : readAdjudications(options.adjudications);
    const estate = estateRows({ root: options.root, rows, costs, adjudications });
    const { text, tallies, missing } = estateReport(estate, scope, options.adjudicationPath);
    const budget = options.budget === null ? null : readBudgetManifest(options.budget);
    const section = budget === null ? null : budgetSection(budget);
    const over = section === null ? [] : section.over;
    // An estate with no row is a refusal, never a pass: a foreign tree whose
    // suites live elsewhere looked exactly like a healthy one (issue #717).
    const verdict = estate.length === 0 || missing.length > 0 || over.length > 0 ? "FAIL" : "PASS";
    const empty = estate.length === 0 ? `\nestate-empty — no suite under ${SUITE_DIR}/ or packages/*/test/ (${options.root})` : "";
    const body = section === null ? `${text}${empty}` : `${text}${empty}\n\n${section.text}`;
    if (options.mode === "json") {
      process.stdout.write(
        `${JSON.stringify(
          {
            contract: CONTRACT_ID,
            scope,
            rows: estate,
            tallies,
            missing: missing.map((row) => row.suite),
            budget: budget === null ? null : { budgetSeconds: budget.budgetSeconds, host: budget.host, classes: budget.classes },
            verdict,
          },
          null,
          2,
        )}\n`,
      );
    } else {
      process.stdout.write(`${body}\n\nverdict: ${verdict}\n`);
    }
    process.exit(verdict === "PASS" ? 0 : 1);
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

  const report = gateReport({ suites, findings, root: options.root });
  process.stdout.write(`${report}\n`);
  process.exit(findings.length === 0 && suites.length > 0 ? 0 : 1);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
