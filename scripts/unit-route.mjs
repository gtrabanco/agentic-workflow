#!/usr/bin/env node
/**
 * unit-route.mjs — deterministic, read-only router for a delivery unit.
 *
 * One closed route table answers "which route does this unit take now?" from the
 * unit's own ledger, prints the bounded read set the chosen route needs, and
 * never guesses: an unknown unit exits 1 and an ambiguous one exits 2, both
 * without printing a route.
 *
 * Routes, first match winning:
 *   replan          an open row whose frozen route is the plan owner
 *   decision        an open row that needs a product/architecture decision
 *   product         an open row whose frozen route is the product owner
 *                   (#293: repaired by the lane, never folded — the fold loop
 *                   repairs source, not authority)
 *   fold            an open row that folds into the current unit
 *   execute         a known unit with no open row and open work
 *   close-out       a done unit with no open row (the merge gate is next)
 *   historical      an archived unit: no open row and no status source left
 *   plan-from-issue a tracked issue with no unit folder yet
 *
 * Diagnostics go to stderr; the routed block goes to stdout. The script writes
 * nothing and spawns no shell. `UNIT_ROUTE_REPO` re-points it at a fixture tree.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseUnitDocPhases, loggedPhases, parseLog, sectionText } from "./unit-doc-phases.mjs";

const PROJECT = process.env.UNIT_ROUTE_REPO
  ? path.resolve(process.env.UNIT_ROUTE_REPO)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Read-set cap; beyond it the block carries one explicit remainder line. */
export const READ_SET_MAX = 12;
/** Longest echoed cell before the sanitizer truncates it. */
export const CELL_MAX = 160;

const ROUTES = Object.freeze(["replan", "decision", "product", "fold", "execute", "close-out", "historical", "plan-from-issue"]);
const PLAN_ROUTE = /replan[- ]in[- ]unit|owned by plan|plan owner|plan-owner/i;
const DECISION_ROUTE = /decision[- ]required|surface (the )?decision|needs a decision/i;
/** #293: the `Route` cell review-change persists for a product-owned row
 * (`product owner — …`), plus the spellings CLASSIFY.md's owner table allows.
 * Anchored to the cell head so a source row that merely *mentions* the product
 * owner does not leave the fold (`CLASSIFY.md`'s `source` owner folds locally). */
const PRODUCT_ROUTE = /^(?:product[- ]owner|product[- ]owned|owned by product)\b/i;
const KNOWN_UNIT_FILES = ["SPEC.md", "ACCEPTANCE.md", "PLAN.md", "TASKS.md", "progress.md", "review-findings.md"];
const PATH_RE = /[A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@-]+)+/g;
const BARE_FILE_RE = /(?:^|[\s(`[{,])((?:SPEC|ACCEPTANCE|PLAN|TASKS|progress|review-findings|planning-evidence)\.md)\b/g;
/** A composed citation: `dir/{PLAN.md:29,TASKS.md:55}` names several artifacts. */
const BRACE_CITE_RE = /([A-Za-z0-9_.@/-]+)\{([^{}]*)\}/g;

/**
 * One sanitizer over every echoed value: flatten control whitespace, collapse
 * runs, truncate. Ledger cells are repository-authored but forge-adjacent, so
 * they are data, never instructions, and never reach stdout verbatim.
 *
 * The flatten class covers the whole control surface, not just C0: the C1 range
 * (U+0080-U+009F, e.g. NEL U+0085) is not matched by `\s`, and the Unicode line
 * and paragraph separators are named explicitly, so no echoed cell can carry a
 * character a consumer might read structurally (F28, extending F16). The
 * **format** characters (F33 — a regression of F28's declared invariant) are
 * covered too: the word joiner, zero-width space/en/em-joiner, the bidi marks and
 * embeddings/overrides/isolates, the soft hyphen and the BOM, all of which are
 * invisible to a reader and structural to a parser that honours them.
 */
export function sanitize(value) {
  const flat = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > CELL_MAX ? `${flat.slice(0, CELL_MAX - 1)}…` : flat;
}

/** Split a Markdown table row on pipes that are not escaped (`\|`). */
function cellsOf(line) {
  const cells = [];
  let current = "";
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\\" && line[index + 1] === "|") {
      current += "|";
      index += 1;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * The one open-row predicate, owned here and projected by the sensor: a row is open
 * unless its `folded` cell carries one of the ledger's not-open spellings. Two
 * vocabularies let the same ledger row answer `execute` here and `fold` there.
 *
 * The ledger annotates a closed cell with its provenance — `yes · fold <sha>`
 * (`ledger-provenance.mjs`) or `yes ↳ folded by <sha>` — so the comparison is on
 * the cell's leading token, never on the whole cell (F30: the annotated spellings
 * made merged units read as open, which routed them to the fold and the planner).
 */
// `ignore` is the classifier's DISPOSITION (`review-implementation`'s `ignore`
// class): the row is decided, never routed. Its `folded` cell stays `no`, which
// is exactly why it must be named here — unit 74's F-74-6 kept a merged,
// fully-ticked unit on `route: fold` (same class as the padded MARK header row).
const NOT_OPEN = new Set(["yes", "—", "-", "n/a", "", "ignore"]);
export const isOpen = (folded) => {
  const value = String(folded ?? "").trim().toLowerCase();
  if (value === "") return false;
  const head = value.split(/[\s·↳(,;:]/)[0];
  return !NOT_OPEN.has(head);
};

/**
 * Mark rows are not findings: `VF-<n>` carries a finding's verification signature,
 * `REVIEW-RAN` a review's and `GATE-RAN` a gate run's, and a padded mark row
 * reaches the row parser looking like a finding whose cells are empty. The id
 * shape is the guard — a value-based
 * guard ("`folded: n/a` means not a finding") breaks the moment a mark is padded
 * differently.
 */
export const isMarkRow = (id) => {
  const value = String(id ?? "").trim();
  // `MARK` is the id cell of a padded ledger HEADER row (`ledger-ownership@1` fixes
  // that shape). Without it the header parses as an open finding and routes a
  // fully-ticked unit back to `/fold-findings`.
  return /^MARK$/i.test(value) || /^VF-/i.test(value) || /^REVIEW-RAN$/i.test(value) || /^GATE-RAN$/i.test(value);
};

const isSeparator = (id) => /^[-:\s]*$/.test(String(id ?? ""));

/** Every open row of a ledger, in file order, with its cells. */
export function openRows(ledgerText) {
  if (!ledgerText) return [];
  const rows = [];
  for (const line of ledgerText.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = cellsOf(line).slice(1, -1);
    if (cells.length < 7) continue;
    const [id, file, axis, severity, klass] = cells;
    // `folded` is the row's LAST cell, never a fixed index: a row whose route or
    // file cell carries an unescaped pipe splits into extra cells, and reading
    // index 6 then returns route text — which made every such row look open (F29).
    // Joining the middle cells back recovers the split route for classification.
    const route = cells.slice(5, cells.length - 1).join(" | ");
    const folded = cells[cells.length - 1];
    if (/^id$/i.test(id) || isSeparator(id) || !isOpen(folded)) continue;
    if (isMarkRow(id)) continue; // a mark row carries no destination of its own
    rows.push({ id, file, axis, severity, klass, route, folded });
  }
  return rows;
}

/**
 * The OPEN rows of a migrated unit doc's `## Findings` section (#308). A folded
 * row leaves that table for a `## Log` line, so every row it carries is open by
 * definition and has no `folded` cell — the shape is normalized to the legacy
 * ledger's record so `routeOfRow` and the read set work on either carrier.
 *
 * @param {string} doc — the full unit doc text.
 * @returns {Array<{id, file, axis, severity, klass, route, folded}>}
 */
export function findingsRows(doc) {
  const body = sectionText(doc, "Findings");
  if (body === null) return [];
  const rows = [];
  for (const line of body.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = cellsOf(line).slice(1, -1);
    if (cells.length < 6) continue;
    const [id, target, axis, severity, klass] = cells;
    const route = cells.slice(5).join(" | ");
    if (/^id$/i.test(id) || isSeparator(id) || isMarkRow(id)) continue;
    // `carrier: "doc"` selects the collapsed carrier's column grammar in
    // `routeOfRow`; the legacy `openRows` rows carry no marker and keep prose matching.
    rows.push({ id, file: target, axis, severity, klass, route, folded: "no", carrier: "doc" });
  }
  return rows;
}

/**
 * The collapsed carrier's `class` column is a *different* vocabulary from the
 * legacy ledger's: `findings-table@1` (`docs/features/_TEMPLATE/SPEC.md`) publishes
 * `class` as the owner that repairs the row — `product | plan | source | environment
 * | runtime` — while `review-findings.md` puts the disposition there
 * (`fix-now | replan-in-unit | decision-required`). Two vocabularies, one column:
 * read as a whole cell, so a row whose route prose merely *mentions* an owner keeps
 * its own route (#293's over-match rule, applied to the other column).
 */
const OWNER_CLASS = new Map([
  ["plan", "replan"],
  ["product", "product"],
]);
/**
 * The `## Findings` carrier's `route` cell is the ROUTER'S vocabulary, so a
 * disposition is read from the head of the cell — the same anchoring #293 gave the
 * product owner because a source row that merely discusses the plan owner is still
 * a source row. The legacy ledger keeps its loose scan: its route cell is free
 * prose, and its unit fixtures pin that a mention anywhere routes the row.
 */
const DOC_PLAN_ROUTE = /^(?:replan[- ]in[- ]unit|owned by plan|plan owner|plan-owner)\b/i;
const DOC_DECISION_ROUTE = /^(?:decision[- ]required|surface (the )?decision|needs a decision)\b/i;

/** Classify one open row into the route it demands, or `null` for none. */
export function routeOfRow(row) {
  const klass = String(row.klass ?? "");
  const route = String(row.route ?? "");
  if (row.carrier === "doc") {
    // Both collapsed-carrier columns are closed vocabularies: `class` names the
    // owner that repairs the row, `route` names where the row goes.
    if (DOC_PLAN_ROUTE.test(route)) return "replan";
    if (DOC_DECISION_ROUTE.test(route)) return "decision";
    if (PRODUCT_ROUTE.test(route)) return "product";
    return OWNER_CLASS.get(klass.trim().toLowerCase()) ?? "fold";
  }
  if (PLAN_ROUTE.test(klass) || PLAN_ROUTE.test(route)) return "replan";
  if (DECISION_ROUTE.test(klass) || DECISION_ROUTE.test(route)) return "decision";
  // #293: a product-owned row is repaired by the lane, never folded — the fold
  // loop repairs source, not authority (`pre-execution-review` POLICY §4).
  if (PRODUCT_ROUTE.test(route)) return "product";
  // The migrated carrier names the repairing owner in `class`: `plan` and `product`
  // own the same routes their legacy dispositions do; `source`, `environment` and
  // `runtime` are the fold's, which is the default below.
  const owner = OWNER_CLASS.get(klass.trim().toLowerCase());
  if (owner) return owner;
  return "fold";
}

function readProject(relative) {
  try {
    return fs.readFileSync(path.join(PROJECT, relative), "utf8");
  } catch {
    return null;
  }
}

const exists = (relative) => {
  try {
    fs.statSync(path.join(PROJECT, relative));
    return true;
  } catch {
    return false;
  }
};

const isDir = (relative) => {
  try {
    return fs.statSync(path.join(PROJECT, relative)).isDirectory();
  } catch {
    return false;
  }
};

/** Unit folders under `docs/features` and `docs/fix`, sorted for determinism. */
export function unitFolders() {
  const folders = [];
  for (const [kind, dir] of [["feature", "docs/features"], ["fix", "docs/fix"]]) {
    let entries = [];
    try {
      entries = fs.readdirSync(path.join(PROJECT, dir), { withFileTypes: true });
    } catch {
      entries = [];
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
      const match = /^(\d+)-(.+)$/.exec(entry.name);
      if (!match) continue;
      folders.push({ kind, number: match[1], slug: entry.name, dir: `${dir}/${entry.name}` });
    }
  }
  return folders.sort((left, right) => left.dir.localeCompare(right.dir));
}

export function resolveUnit(token) {
  const folders = unitFolders();
  const clean = token.replace(/^docs\/(?:features|fix)\//, "").replace(/\/+$/, "");
  const matches = /^\d+$/.test(clean)
    ? folders.filter((folder) => folder.number === clean)
    : folders.filter((folder) => folder.slug === clean || folder.dir.endsWith(`/${clean}`));
  return { matches, clean };
}

/** Issue numbers referenced by the roadmap's own rows (a tracked feature). */
function roadmapIssues() {
  const text = readProject("docs/features/ROADMAP.md") ?? "";
  const numbers = new Set();
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const match = /issues\/(\d+)/.exec(line);
    if (match) numbers.add(match[1]);
  }
  return numbers;
}

/** Issue numbers referenced by the fix index (the tracked-issue surface). */
function fixIndexIssues() {
  const text = readProject("docs/fix/README.md") ?? "";
  const numbers = new Set();
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const match = /issues\/(\d+)|#(\d+)/.exec(line.split("|")[1] ?? "");
    if (match) numbers.add(match[1] ?? match[2]);
  }
  return numbers;
}

/**
 * The bare status token out of a status cell: the fix index decorates it
 * (`` `done · [#225](…)` ``) while the roadmap does not (`done · [#212](…)`),
 * and the field the block publishes carries the token only, never the markdown.
 */
function statusToken(cell) {
  return cell.replace(/[`*]/g, "").split("·")[0].trim();
}

/** Roadmap rows whose first cell carries the unit number. */
function roadmapStatus(number) {
  const text = readProject("docs/features/ROADMAP.md") ?? "";
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4) continue;
    if (cells[1] !== String(number)) continue;
    return sanitize(statusToken(cells[3])) || "unknown";
  }
  return null;
}

/** Fix-index row status for an issue number. */
function fixIndexStatus(number) {
  const text = readProject("docs/fix/README.md") ?? "";
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4) continue;
    if (!new RegExp(`issues/${number}\\b|#${number}\\b`).test(cells[1])) continue;
    return sanitize(statusToken(cells[3])) || "unknown";
  }
  return null;
}

/**
 * Flatten a brace-composed citation (`dir/{PLAN.md:29,TASKS.md:55}`) into the
 * paths it names, so the delimiter classes below see each one. Without it only
 * the composed directory survives and the isDir guard drops it, which silently
 * loses cited artifacts from the read set.
 */
function expandBraces(text) {
  return text.replace(BRACE_CITE_RE, (whole, prefix, members) => {
    const expanded = members
      .split(",")
      .map((member) => `${prefix}${member.trim()}`)
      .filter((entry) => entry.length > prefix.length);
    return expanded.length ? expanded.join(" ") : whole;
  });
}

/**
 * Repository paths cited by the selected rows. Only paths that exist under the
 * project root are kept, so the printed set is real and bounded.
 */
export function citedPaths(rows) {
  const found = [];
  for (const row of rows) {
    const text = expandBraces(`${row.file} ${row.route} ${row.klass}`);
    for (const match of text.matchAll(PATH_RE)) found.push(match[0]);
    for (const match of text.matchAll(BARE_FILE_RE)) found.push(match[1]);
  }
  const paths = new Set();
  for (const raw of found) {
    const candidate = sanitize(raw.replace(/[.,;:)\]]+$/, ""));
    if (!candidate || candidate.startsWith("/") || candidate.includes("..") || candidate.includes("://")) continue;
    if (!exists(candidate) || isDir(candidate)) continue;
    paths.add(candidate);
  }
  return [...paths].sort();
}

function readSetFor(unitDir, rows, base) {
  const paths = new Set();
  for (const name of base) {
    const relative = `${unitDir}/${name}`;
    if (exists(relative)) paths.add(relative);
  }
  for (const cited of citedPaths(rows)) paths.add(cited);
  return [...paths].sort();
}

/** Deterministic decision fingerprint over the exact inputs the answer used. */
function fingerprint(record) {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

function fail(code, message) {
  process.stderr.write(`UNIT ROUTE — error\n${message}\n`);
  process.exit(code);
}

/** The `--help`/`-h` contract: printed on stdout, exit 0 — help is not a failure. */
const USAGE = `usage: node scripts/unit-route.mjs <unit|issue>

Prints the route one delivery unit takes now, from its own ledger. The routes,
first match winning: replan (an open row whose frozen route is the plan owner),
decision (an open row that needs a product/architecture decision), product (an
open row whose frozen route is the product owner — repaired by the lane, never
folded), fold (any other open row), execute (a known unit with no open row that
is still open work),
close-out (a done unit with no open row — the merge gate is the next step),
historical (a known unit with no open row whose status source is gone: the index
or roadmap row was removed after the merge),
plan-from-issue (a tracked issue with no unit folder yet: a fix-index number or a
roadmap row's own issue number).

The routed block goes to stdout: unit, status, open-rows, route, next, rows,
read-set (at most ${READ_SET_MAX} paths, then an explicit remainder line),
fingerprint.

Exit codes: 0 a route was printed; 1 an unknown unit or an argument count other
than one; 2 an ambiguous unit token (a number matching both a feature and a fix
folder). The last two print no route at all. Diagnostics go to stderr, the
script writes nothing, and UNIT_ROUTE_REPO re-points it at a fixture tree.
`;


// ---------------------------------------------------------------------------
// Triage mode (--triage <unit>) — feature 61 P3: the closed catalog decides
// which steps a unit needs. Deterministic over the unit doc's observable
// facts; the model never re-derives the step list, it consumes this block.
// ---------------------------------------------------------------------------

// Mirrors UNIT_DOC_SECTION_SHAPES (schema package, #305 for the legacy list and
// #308 for the re-cut one); `scripts/unit-doc-contract.test.mjs` pins the copies,
// this one included. A unit doc satisfies ONE shape: the legacy 14 sections, or
// the re-cut set whose `## Specs` / `## Findings` / `## Log` replace
// `## Evidence` / `## Progress log`. Both are accepted, so an unmigrated unit
// never breaks and a migrated one never needs the legacy sections back.
const UNIT_DOC_SECTION_SHAPES = Object.freeze({
  legacy: [
    "Objective", "Why", "User outcome", "Acceptance criteria", "Impact", "Non-goals",
    "Future cost", "Applicable tests", "Known pre-existing issues", "Tasks",
    "Evidence", "Progress log", "Next", "References",
  ],
  "spec-by-reference": [
    "Specs", "Impact", "Non-goals", "Future cost", "Applicable tests",
    "Known pre-existing issues", "Tasks", "Findings", "Log", "Next", "References",
  ],
});
/** The legacy list, kept as the default a document satisfying neither shape is judged against. */
const UNIT_DOC_SECTIONS = UNIT_DOC_SECTION_SHAPES.legacy;

/** The accepted shape a document's headings satisfy, or `null` when they satisfy neither. */
function resolveSectionShape(doc) {
  for (const [name, sections] of Object.entries(UNIT_DOC_SECTION_SHAPES)) {
    if (sections.every((section) => sectionBody(doc, section) !== null)) return name;
  }
  return null;
}
const UNIT_TYPES = ["feature", "fix", "docs", "chore"];
const UNIT_SCOPES = ["trivial", "xs", "small", "standard", "medium", "large", "xlarge"];

function triageFail(code, message) {
  process.stderr.write(`TRIAGE ERROR — ${message}\n`);
  process.exit(code);
}

function loadCatalog() {
  const catalog = JSON.parse(fs.readFileSync(new URL("./catalog.json", import.meta.url), "utf8"));
  if (catalog.schemaVersion !== 1) {
    triageFail(2, `unsupported schemaVersion: ${catalog.schemaVersion} (expected 1)`);
  }
  const closed = ["research", "design", "plan", "implement", "tests", "evidence", "review", "docs", "release"];
  if (JSON.stringify(catalog.steps) !== JSON.stringify(closed)) {
    triageFail(2, `catalog: must have exactly 9 steps in the closed order`);
  }
  return catalog;
}

function frontmatterOf(text) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  const out = {};
  if (!fm) return out;
  for (const line of fm[1].split("\n")) {
    const kv = /^([a-zA-Z_-]+):\s*(.*)$/.exec(line.trim());
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

export function sectionBody(text, name) {
  const re = new RegExp(`^## ${name}\\s*$`, "m");
  const m = re.exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = /^## /m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function unitFacts(doc, unitDir) {
  const fm = frontmatterOf(doc);
  let type;
  if (fm.type !== undefined) {
    if (!UNIT_TYPES.includes(fm.type)) {
      triageFail(2, `unit type cannot be determined: '${sanitize(fm.type)}' is not one of ${UNIT_TYPES.join(", ")}`);
    }
    type = fm.type;
  } else if (unitDir.startsWith("docs/fix/")) {
    type = "fix";
  } else if (unitDir.startsWith("docs/features/")) {
    type = "feature";
  } else {
    triageFail(2, "unit type cannot be determined: no type frontmatter and the folder is neither a feature nor a fix tree");
  }
  let scope;
  if (fm.scope !== undefined) {
    if (!UNIT_SCOPES.includes(fm.scope)) {
      triageFail(2, `invalid scope '${sanitize(fm.scope)}' (one of ${UNIT_SCOPES.join(", ")})`);
    }
    scope = fm.scope;
  } else {
    const objective = sectionBody(doc, "Objective") || "";
    const objectiveLines = objective.split("\n").filter((l) => l.trim()).length;
    const acBody = sectionBody(doc, "Acceptance criteria") || "";
    const acCount = (acBody.match(/^\d+\./gm) || []).length;
    scope = objectiveLines <= 3 && acCount <= 2 ? "trivial" : "standard";
  }
  const testsBody = sectionBody(doc, "Applicable tests") || "";
  const tests = /n\/a/i.test(testsBody) ? "n/a" : "declared";
  return { type, scope, tests };
}

function triageSteps(catalog, facts) {
  const { type, scope, tests } = facts;
  const nonTrivial = scope !== "trivial";
  const codeUnit = type === "feature" || type === "fix";
  const applies = {
    research: type === "feature" && nonTrivial,
    design: type === "feature" && nonTrivial,
    plan: codeUnit && nonTrivial,
    implement: type !== "docs",
    tests: codeUnit && nonTrivial && tests !== "n/a",
    docs: type === "docs" || (codeUnit && nonTrivial),
    evidence: true,
    review: codeUnit && nonTrivial,
    release: type === "feature" && ["medium", "large", "xlarge"].includes(scope),
  };
  const reasons = {
    research: type === "docs" || type === "chore" ? "docs/chore unit" : "trivial scope",
    design: type === "docs" || type === "chore" ? "docs/chore unit" : "trivial scope",
    plan: type === "docs" || type === "chore" ? "docs/chore unit" : "trivial scope",
    implement: "docs unit",
    tests: type === "docs" ? "docs unit" : scope === "trivial" ? "trivial scope" : "tests n/a",
    docs: type === "chore" ? "chore unit" : "trivial scope",
    review: type === "docs" ? "docs unit" : "trivial scope",
    release: type !== "feature" ? "not a feature" : "small scope",
  };
  const steps = [];
  const skipped = [];
  for (const step of catalog.steps) {
    if (applies[step]) steps.push(step);
    else skipped.push({ step, reason: reasons[step] });
  }
  // #291 AC4: the per-step tiers come from the catalog's own `budget_tier` —
  // one source of truth — and the aggregate is derived from them, never a
  // second rule. A selected step without a tier fails closed.
  const tiers = {};
  for (const step of steps) {
    const tier = catalog.catalog[step].budget_tier;
    if (tier !== "cheap" && tier !== "strong") {
      triageFail(2, `catalog: step ${step} has no budget_tier (expected cheap or strong)`);
    }
    tiers[step] = tier;
  }
  const budget = steps.some((step) => tiers[step] === "strong") ? "strong" : "cheap";
  return { steps, skipped, tiers, budget };
}

/**
 * The `implement` step's catalog tier — the execution tier named on per-phase
 * hand-offs (decision D1, issue #291 AC4). One source: `scripts/catalog.json`.
 */
function executionTier() {
  return loadCatalog().catalog.implement.budget_tier;
}

/**
 * The phases a unit's `## Progress log` records as done: only phase-led
 * entry heads (not `next:` tails) name a done phase. A Progress log entry is
 * a markdown list item (`-`/`*`/`+`); indented lines after a blank line are
 * continuation prose, not an entry head, so they must be skipped. Within the
 * head, the `next: P<k>` suffix is stripped before matching — the `P<n>`
 * token the head itself records is the one (and only one) that counts.
 */
export function recordedPhases(doc) {
  // #308: a migrated unit doc records its phases in `## Log` (`P<n>` progress
  // lines) instead of a `## Progress log`; the two shapes are read by one
  // function so the router's phase answer never depends on which one a unit has.
  const done = new Set(loggedPhases(doc));
  const body = sectionBody(doc, "Progress log");
  if (body === null) return done;
  let entryStarted = false;
  let entryEnded = false;
  for (const line of body.split("\n")) {
    // A blank line ends the entry's prose continuation.
    if (/^\s*$/.test(line)) {
      entryStarted = false;
      entryEnded = true;
      continue;
    }
    // A new entry head: a list-item marker at the column-zero start (no
    // leading whitespace — indented markers are continuation prose).
    if (/^[-*+]\s/.test(line)) {
      // If we are still in a prior entry after a blank line, that entry is
      // closed — but continuation lines across a blank line do not re-open
      // it. (The blank-line break above sets entryStarted=false.)
      entryStarted = true;
      entryEnded = false;
      // Find the first " next:" on this line (if any) and take the head
      // before it — linear scan, no re-anchoring split.  (F7: avoid the
      // quadratic split(/\s+next:.*$/i).)
      const nextIdx = line.indexOf(" next:");
      const head = nextIdx === -1 ? line : line.slice(0, nextIdx);
      // Only the entry head's own phase token may record a done phase — the
      // token that appears after the leading date and em-dash that opens
      // the entry.  A phase id cited later in prose (e.g. "diff-guard …
      // P1 and P2 are separate scoped commits") must NOT count.  (F8: accept
      // the documented `YYYY-MM-DD HH:MM — <action> — next: …`
      // form where the phase id appears after an action keyword in the head
      // before the arrow (→), not only as the first post-dash token.)
      //
      // The `next:` tail is already stripped above.  Find the arrow position
      // and restrict matching to the head portion before it.
      const arrowIdx = head.indexOf(" →");
      const headWork = arrowIdx === -1 ? head : head.slice(0, arrowIdx);
      // Match P<n> that follows the entry head's `— ` prefix.  Two cases:
      // 1) Direct: `— P<digits>` (the original anchor, e.g. `— P2 — implemented`).
      // 2) Action-word: a known action keyword followed by P<digits>, with
      //    up to 3 intervening words (e.g. `— diff guard after P1`).
      //    Closed list prevents "reverted the P2 spike" from matching
      //    (reverted is not a known action).
      const knownActions = new Set([
        "implement", "research", "design", "plan", "diff", "diff-guard",
        "diff guard", "bump", "evidence", "docs", "release", "tests",
        "re-run",
      ]);
      let found = false;
      const dashIdx = headWork.indexOf(" — ");
      if (dashIdx !== -1) {
        const after = headWork.slice(dashIdx + 3);
        // 1) Direct: P immediately after dash.
        const pMatch = /^\s*\b[Pp](\d+)/.exec(after);
        if (pMatch) {
          done.add(Number(pMatch[1]));
          found = true;
        }
        // 2) Action-word: known action keyword then P<digits>, up to
        //    3 intervening words between action and P.
        if (!found) {
          const actionMatch = /([a-zA-Z][a-zA-Z-]*(?:\s[a-zA-Z][a-zA-Z-]*)*)[\s:]+([a-zA-Z]+[\s:]+){0,3}\b[Pp](\d+)/.exec(after);
          if (actionMatch) {
            const firstWord = actionMatch[1].split(/\s/)[0];
            if (knownActions.has(firstWord.toLowerCase()) ||
                knownActions.has(actionMatch[1].toLowerCase())) {
              done.add(Number(actionMatch[3]));
            }
          }
        }
      }

    } else if (entryStarted && !entryEnded) {
      // Continuation line within an active entry — do NOT match.
    }
  }
  return done;
}

/**
 * The unfinished phases of a unit: the set of `P<n>` numbers from the unit
 * doc's `## Tasks` section that the `## Progress log` does not record.
 * Returns `null` when the doc is absent or has no `## Tasks` section
 * (untouched work — caller routes to P1). Returns all parsed phases when done
 * is empty.
 */
function unfinishedPhases(unitDir) {
  const doc = readProject(`${unitDir}/SPEC.md`);
  if (doc === null || sectionBody(doc, "Tasks") === null) return null;
  const { phases } = parseUnitDocPhases(doc);
  if (phases.length === 0) {
    fail(1, `no parseable phase in ${unitDir}/SPEC.md — the Tasks section carries no \`P<n> —\` bullet (re-run the lane's plan step)`);
  }
  const done = recordedPhases(doc);
  return new Set(phases.map((phase) => phase.number).filter((number) => !done.has(number)));
}

/**
 * The first unfinished phase of a unit: the lowest `P<n> —` bullet in the unit
 * doc's `## Tasks` section that the `## Progress log` does not record. A Tasks
 * section that parses to no phase fails closed: the route never emits a bare
 * whole-unit command (#291 AC3). The caller handles the no-doc case (returns `null`).
 */
function firstUnfinishedPhase(unit) {
  const donePhases = unfinishedPhases(unit.dir);
  if (donePhases === null) return 1;
  const unfinished = [...donePhases].sort((a, b) => a - b);
  return Math.min(...unfinished);
}

function runTriage(token, { json = false } = {}) {
  const catalog = loadCatalog();
  const { matches, clean } = resolveUnit(token);
  if (matches.length > 1) {
    triageFail(2, `ambiguous unit: ${sanitize(clean)} matches ${matches.map((entry) => sanitize(entry.dir)).join(", ")}`);
  }
  if (matches.length === 0) {
    triageFail(2, `unit not found: ${sanitize(clean)}`);
  }
  const unitDir = matches[0].dir;
  const specPath = path.join(PROJECT, unitDir, "SPEC.md");
  let doc;
  try {
    doc = fs.readFileSync(specPath, "utf8");
  } catch {
    triageFail(2, `unit doc not found: ${unitDir}/SPEC.md`);
  }
  // Missing sections are reported against the shape the doc asserts; a doc
  // satisfying neither is judged against the legacy list (#308).
  const shape = resolveSectionShape(doc);
  const required = shape === null ? UNIT_DOC_SECTIONS : UNIT_DOC_SECTION_SHAPES[shape];
  const missing = required.filter((name) => sectionBody(doc, name) === null);
  if (missing.length > 0) {
    triageFail(2, `missing mandatory sections: ${missing.join(", ")}`);
  }
  const facts = unitFacts(doc, unitDir);
  const result = triageSteps(catalog, facts);
  const unitLabel = clean;
  const skippedText = result.skipped.length === 0
    ? "none"
    : result.skipped.map((entry) => `${entry.step}: ${entry.reason}`).join(", ");
  if (!json) {
    process.stdout.write(
      `TRIAGE — ${unitLabel} (${facts.type})\n` +
      `Steps: ${result.steps.join(", ")}\n` +
      `Tiers: ${result.steps.map((step) => `${step}: ${result.tiers[step]}`).join(", ")}\n` +
      `Skipped: ${skippedText}\n` +
      `Budget: ${result.budget}\n`,
    );
  }
  return { unit: unitLabel, type: facts.type, steps: result.steps, skipped: result.skipped, tiers: result.tiers, budget: result.budget };
}

function main(argv) {
  const args = argv.slice(2).filter((arg) => arg !== "");
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    process.stdout.write(USAGE);
    return;
  }
  if (args[0] === "--triage") {
    if (args.length < 2 || args.length > 3 || (args.length === 3 && args[2] !== "--json")) {
      fail(1, "usage: node scripts/unit-route.mjs --triage <unit> [--json]");
    }
    const result = runTriage(args[1], { json: args[2] === "--json" });
    if (args[2] === "--json") {
      process.stdout.write(JSON.stringify(result) + "\n");
    }
    return;
  }
  if (args.length === 0) fail(1, "usage: node scripts/unit-route.mjs <unit|issue>");
  if (args.length > 1) fail(1, `usage: node scripts/unit-route.mjs <unit|issue> — expected exactly one argument, got ${args.length}`);

  const token = args[0];
  const { matches, clean } = resolveUnit(token);

  if (matches.length > 1) {
    fail(2, `ambiguous unit: ${sanitize(clean)} matches ${matches.map((entry) => sanitize(entry.dir)).join(", ")}`);
  }

  // No unit folder: a tracked issue routes from the issue, not from a ledger.
  if (matches.length === 0) {
    const numeric = /^\d+$/.test(clean);
    if (numeric && fixIndexIssues().has(clean)) {
      const command = `/unit-lane --fix ${clean}`;
      print({ unit: clean, status: "pending", route: "plan-from-issue", command, openCount: 0, rows: [], readSet: readSetFor("docs/fix", [], ["README.md"]) });
      return;
    }
    // A roadmap row's own issue number is the other tracked-issue surface this
    // command documents, so it resolves instead of dead-ending (F34).
    if (numeric && roadmapIssues().has(clean)) {
      const command = `/unit-lane --from-issue ${clean}`;
      print({ unit: clean, status: "pending", route: "plan-from-issue", command, openCount: 0, rows: [], readSet: readSetFor("docs/features", [], ["ROADMAP.md"]) });
      return;
    }
    fail(1, `unknown unit: ${sanitize(clean)}`);
  }

  const unit = matches[0];
  const ledgerPath = `${unit.dir}/review-findings.md`;
  const ledger = readProject(ledgerPath) ?? "";
  // #308: a migrated unit doc carries its OPEN rows in `## Findings`; the side
  // ledger is the legacy carrier. The doc is probed first, and a doc with the
  // section owns the answer — a unit never reads both carriers.
  const doc = readProject(`${unit.dir}/SPEC.md`) ?? "";
  const rows = sectionText(doc, "Findings") !== null ? findingsRows(doc) : openRows(ledger);
  const status = (unit.kind === "fix" ? fixIndexStatus(unit.number) : roadmapStatus(unit.number)) ?? "absent";

  let route;
  let command;
  let selected;
  if (rows.some((row) => routeOfRow(row) === "replan")) {
    route = "replan";
    selected = rows.filter((row) => routeOfRow(row) === "replan");
    command = unit.kind === "fix" ? `/unit-lane --fix ${unit.number}` : `/unit-lane ${unit.slug}`;
  } else if (rows.some((row) => routeOfRow(row) === "decision")) {
    route = "decision";
    selected = rows.filter((row) => routeOfRow(row) === "decision");
    command = "decision required — stop and surface to the user";
  } else if (rows.some((row) => routeOfRow(row) === "product")) {
    // #293 AC1: a product-owned row is lane repair work, not fold work. The
    // command mirrors the replan route's per-kind lane invocation, executable
    // as typed (CLASSIFY.md's owner table).
    route = "product";
    selected = rows.filter((row) => routeOfRow(row) === "product");
    command = unit.kind === "fix" ? `/unit-lane --fix ${unit.number}` : `/unit-lane ${unit.slug}`;
  } else if (rows.length > 0) {
    route = "fold";
    selected = rows;
    command = "/fold-findings";
  } else if (status === "done") {
    // The work is finished; the only step left is the merge gate. Routing here to
    // `/execute-phase` sent an operator at a fully-ticked unit (F24).
    route = "close-out";
    selected = [];
    command = "/audit-pr";
  } else if (status === "absent") {
    // A known unit whose status source is gone — the index row is removed only
    // after the merge — is archived, not pending work (F32). The `next:` prose
    // names what was observed, so a unit whose row was never written is visible
    // instead of silent.
    route = "historical";
    selected = [];
    command = "nothing to do — the unit is archived: its status source is gone (merge state lives in the forge)";
  } else {
    route = "execute";
    selected = [];
    // #291 AC3/AC4: the hand-off names exactly one phase and the execution
    // tier — never the bare whole-unit command. Whole-unit mode survives only
    // as an explicit operator choice (`execute-phase`'s own §7).
    // Close-out keys on the status alone (the branch above): a `done` unit
    // routes to the merge gate whether or not its Progress log records every
    // phase. F31/P6: a unit whose status is NOT "done" (e.g. "defined",
    // "in-progress") with all phases recorded is an ambiguous boundary — not
    // finished (can't audit), no unfinished phases (can't execute) — fail
    // closed. F40: no doc / no `## Tasks` is untouched work — route to P1.
    const unfinished = unfinishedPhases(unit.dir);
    if (unfinished === null) {
      // No doc or no `## Tasks` section — untouched work, P1.
      route = "execute";
      selected = [];
      const phase = firstUnfinishedPhase(unit);
      const tier = executionTier();
      command = unit.kind === "fix"
        ? `/execute-phase --fix ${unit.number} P${phase} (tier: ${tier})`
        : `/execute-phase ${unit.slug} P${phase} (tier: ${tier})`;
    } else if (unfinished.size === 0) {
      // All phases done but status not "done" (checked above at line :733) —
      // refuse; the operator must settle the index/roadmap status first.
      fail(1, `unit ${unit.dir} has all phases recorded but status is '${sanitize(status)}' (not 'done') — settle the index or roadmap status before routing to close-out`);
    } else {
      // Incomplete phases — proceed to execute.
      const phase = firstUnfinishedPhase(unit);
      const tier = executionTier();
      command = unit.kind === "fix"
        ? `/execute-phase --fix ${unit.number} P${phase} (tier: ${tier})`
        : `/execute-phase ${unit.slug} P${phase} (tier: ${tier})`;
    }
  }

  const base = route === "replan" || route === "decision" || route === "product" || route === "fold"
    ? ["review-findings.md", "SPEC.md", "ACCEPTANCE.md"]
    : ["SPEC.md", "progress.md"];
  const readSet = readSetFor(unit.dir, selected, base);

  const rowIds = rows.map((row) => row.id);
  print({
    unit: unit.slug,
    status,
    route,
    command,
    openCount: rows.length,
    rows: rowIds,
    readSet,
  });
}

function print({ unit, status, route, command, openCount, rows, readSet }) {
  if (!ROUTES.includes(route)) fail(1, `internal error: unknown route ${sanitize(route)}`);
  const shown = readSet.slice(0, READ_SET_MAX);
  const remainder = readSet.length - shown.length;
  const record = { unit, status, route, rows, readSet, command };
  const lines = [
    `UNIT ROUTE — ${sanitize(unit)}`,
    `unit: ${sanitize(unit)}`,
    `status: ${sanitize(status)}`,
    `open-rows: ${openCount}`,
    `route: ${route}`,
    `next: ${sanitize(command)}`,
    `rows: ${rows.length ? rows.map((id) => sanitize(id)).join(" ") : "none"}`,
    `read-set (${readSet.length}):`,
    ...(shown.length ? shown.map((entry) => `  ${sanitize(entry)}`) : ["  (none)"]),
    ...(remainder > 0 ? [`  … and ${remainder} more`] : []),
    `fingerprint: ${fingerprint(record)}`,
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv);
}
