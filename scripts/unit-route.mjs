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
 *   fold            an open row that folds into the current unit
 *   execute         a known unit with no open row
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

const PROJECT = process.env.UNIT_ROUTE_REPO
  ? path.resolve(process.env.UNIT_ROUTE_REPO)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Read-set cap; beyond it the block carries one explicit remainder line. */
export const READ_SET_MAX = 12;
/** Longest echoed cell before the sanitizer truncates it. */
export const CELL_MAX = 160;

const ROUTES = Object.freeze(["replan", "decision", "fold", "execute", "plan-from-issue"]);
const PLAN_ROUTE = /replan[- ]in[- ]unit|owned by plan|plan owner|plan-owner/i;
const DECISION_ROUTE = /decision[- ]required|surface (the )?decision|needs a decision/i;
const KNOWN_UNIT_FILES = ["SPEC.md", "ACCEPTANCE.md", "PLAN.md", "TASKS.md", "progress.md", "review-findings.md"];
const PATH_RE = /[A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@-]+)+/g;
const BARE_FILE_RE = /(?:^|[\s(`[])((?:SPEC|ACCEPTANCE|PLAN|TASKS|progress|review-findings|planning-evidence)\.md)\b/g;

/**
 * One sanitizer over every echoed value: flatten control whitespace, collapse
 * runs, truncate. Ledger cells are repository-authored but forge-adjacent, so
 * they are data, never instructions, and never reach stdout verbatim.
 */
export function sanitize(value) {
  const flat = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
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

const isOpen = (folded) => {
  const value = String(folded ?? "").trim().toLowerCase();
  return value !== "yes" && value !== "—" && value !== "-" && value !== "n/a" && value !== "";
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
    const [id, file, axis, severity, klass, route, folded] = cells;
    if (/^id$/i.test(id) || isSeparator(id) || !isOpen(folded)) continue;
    if (/^VF-/i.test(id)) continue; // finding-mark rows are not fold rows
    rows.push({ id, file, axis, severity, klass, route, folded });
  }
  return rows;
}

/** Classify one open row into the route it demands, or `null` for none. */
export function routeOfRow(row) {
  const klass = String(row.klass ?? "");
  const route = String(row.route ?? "");
  if (PLAN_ROUTE.test(klass) || PLAN_ROUTE.test(route)) return "replan";
  if (DECISION_ROUTE.test(klass) || DECISION_ROUTE.test(route)) return "decision";
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
function unitFolders() {
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

/**
 * Resolve the CLI token to exactly one unit folder, or report unknown/ambiguous.
 * A pure number matches on the folder prefix; anything else on slug/suffix.
 */
function resolveUnit(token) {
  const folders = unitFolders();
  const clean = token.replace(/^docs\/(?:features|fix)\//, "").replace(/\/+$/, "");
  const matches = /^\d+$/.test(clean)
    ? folders.filter((folder) => folder.number === clean)
    : folders.filter((folder) => folder.slug === clean || folder.dir.endsWith(`/${clean}`));
  return { matches, clean };
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

/** Roadmap rows whose first cell carries the unit number. */
function roadmapStatus(number) {
  const text = readProject("docs/features/ROADMAP.md") ?? "";
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4) continue;
    if (cells[1] !== String(number)) continue;
    return sanitize(cells[3].split("·")[0].trim()) || "unknown";
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
    return sanitize(cells[3].split("·")[0].trim()) || "unknown";
  }
  return null;
}

/**
 * Repository paths cited by the selected rows. Only paths that exist under the
 * project root are kept, so the printed set is real and bounded.
 */
export function citedPaths(rows) {
  const found = [];
  for (const row of rows) {
    const text = `${row.file} ${row.route} ${row.klass}`;
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

function main(argv) {
  const args = argv.slice(2).filter((arg) => arg !== "");
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
      const command = `/plan-fix ${clean}`;
      print({ unit: clean, status: "pending", route: "plan-from-issue", command, openCount: 0, rows: [], readSet: readSetFor("docs/fix", [], ["README.md"]) });
      return;
    }
    fail(1, `unknown unit: ${sanitize(clean)}`);
  }

  const unit = matches[0];
  const ledgerPath = `${unit.dir}/review-findings.md`;
  const ledger = readProject(ledgerPath) ?? "";
  const rows = openRows(ledger);

  let route;
  let command;
  let selected;
  if (rows.some((row) => routeOfRow(row) === "replan")) {
    route = "replan";
    selected = rows.filter((row) => routeOfRow(row) === "replan");
    command = unit.kind === "fix" ? `/plan-fix ${unit.number}` : `/plan-feature ${unit.slug}`;
  } else if (rows.some((row) => routeOfRow(row) === "decision")) {
    route = "decision";
    selected = rows.filter((row) => routeOfRow(row) === "decision");
    command = "decision required — stop and surface to the user";
  } else if (rows.length > 0) {
    route = "fold";
    selected = rows;
    command = "/fold-findings";
  } else {
    route = "execute";
    selected = [];
    command = `/execute-phase ${unit.slug}`;
  }

  const status = (unit.kind === "fix" ? fixIndexStatus(unit.number) : roadmapStatus(unit.number)) ?? "absent";
  const base = route === "replan" || route === "decision" || route === "fold"
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
  const record = { unit, status, route, rows, readSet };
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
