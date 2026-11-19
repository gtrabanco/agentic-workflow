#!/usr/bin/env node

/**
 * inviolable-rules.mjs — the guide's laws table is a checked surface (issue #645).
 *
 * `AGENTS.md` §"Inviolable rules" carries one versioned block, `inviolable-rules@1`:
 *
 *   rule | statement | owner | state
 *
 * The gate reads it and refuses, by name, anything that would make the section a
 * claim instead of a contract:
 *
 *   missing-block     the guide carries no block (or the root cannot be read)
 *   second-home       the block appears in a second document
 *   row-shape         a row without the four cells, or a rule id off its grammar
 *   duplicate-id      one rule id stated twice
 *   owner-unresolved  the owner cell's path, heading or versioned block is absent
 *   state-shape       a state cell outside the three declared forms
 *   state-unresolved  a `materialized:` gate id the inventory does not publish,
 *                     or a `materialized:` path that does not exist
 *   reason-missing    a `soft-by-design:` row with no reason recorded
 *
 * The three state forms are the issue's own vocabulary: `materialized: <gate-id |
 * path>`, `soft-by-design: <reason>`, `materializable: #<issue>`. A gate id is
 * resolved against `docs/workflow/GATE_INVENTORY.md` — the one inventory — so a
 * law cannot claim a gate that was retired, and a path is resolved against the
 * tree so a law cannot claim a suite that was deleted.
 *
 * Usage
 *   bun scripts/inviolable-rules.mjs [--root <dir>] [--json]   (node fallback, same argv)
 *
 * stdout: `PASS inviolable rules: <n> rows · <m> home` (m is 1 on a passing tree),
 * or one `FAIL inviolable rules: <reason>…` line per finding and exit 1. `--json`
 * replaces the block with `{ ok, rows, homes, failures }`. A usage error exits 2
 * with a `usage:` line on stderr and no verdict.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { headingBoundsAll } from "../packages/agentic-workflow/src/runner/unit-doc-phases.mjs";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "inviolable-rules@1";
const INVENTORY = "docs/workflow/GATE_INVENTORY.md";
const GUIDE = "AGENTS.md";
/** The three declared state forms and the cell grammar each one accepts. */
const STATES = Object.freeze({
  materialized: "materialized",
  "soft-by-design": "soft-by-design",
  materializable: "materializable",
});
/** A rule id: `IR<n>-<kebab-slug>`. */
const RULE_ID = /^IR\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A gate id: the inventory's own identifier shape. */
const GATE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** The shortest recorded reason this gate accepts as prose rather than a dash. */
const MIN_REASON = 20;
/** Where a laws block could live: the guide, a copied platform guide, the repo's
 *  reference trees and the packages' own guides. */
const SWEEP_ROOTS = [".", "docs", "skills", "template", "packages"];

const usage = `usage: inviolable-rules [--root <dir>] [--json]

Reads <root>/${GUIDE}'s "${MARKER}" block and resolves every row's owner and
state against <root>/<the tree> and <root>/${INVENTORY}.`;

function refuse(message) {
  process.stderr.write(`inviolable-rules: ${message}\n${usage}\n`);
  process.exit(2);
}

const argv = process.argv.slice(2);
let root = DEFAULT_ROOT;
let json = false;
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === "--root") {
    const value = argv[index + 1];
    if (!value) refuse("--root requires a directory");
    root = path.resolve(value);
    index += 1;
  } else if (arg === "--json") {
    json = true;
  } else if (arg === "--help" || arg === "-h") {
    process.stdout.write(`${usage}\n`);
    process.exit(0);
  } else {
    refuse(`unknown argument: ${arg}`);
  }
}

const read = (relative) => {
  try {
    return fs.readFileSync(path.join(root, relative), "utf8");
  } catch {
    return null;
  }
};
const exists = (relative) => fs.existsSync(path.join(root, relative));

/** The `inviolable-rules@1` block of one document: its marker line index and body rows. */
function blockOf(text) {
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^```/.test(lines[index])) continue;
    let close = -1;
    for (let next = index + 1; next < lines.length; next += 1) {
      if (/^```/.test(lines[next])) {
        close = next;
        break;
      }
    }
    if (close === -1) return null;
    if ((lines[index + 1] ?? "").trim() !== MARKER) {
      index = close;
      continue;
    }
    return lines.slice(index + 2, close);
  }
  return null;
}

/** Every document under the sweep roots that carries the marker as a fence line. */
function findHomes() {
  const found = new Set();
  const walk = (relative) => {
    const absolute = path.join(root, relative);
    let entries;
    try {
      entries = fs.readdirSync(absolute, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const next = relative === "." ? entry.name : path.join(relative, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".worktrees") continue;
        walk(next);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      const text = read(next);
      if (text === null || !text.includes(MARKER)) continue;
      if (blockOf(text) !== null) found.add(next.split(path.sep).join("/"));
    }
  };
  let rootEntries;
  try {
    rootEntries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return []; // an unreadable root is reported by the missing block, never a crash
  }
  for (const sweep of SWEEP_ROOTS) {
    if (sweep === ".") {
      // The root tree: guides only, never a recursive walk of the whole repository.
      for (const entry of rootEntries) {
        if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
        const text = read(entry.name);
        if (text !== null && text.includes(MARKER) && blockOf(text) !== null) found.add(entry.name);
      }
      continue;
    }
    walk(sweep);
  }
  return [...found].sort();
}

/** The gate ids the one inventory publishes, in row order. */
function gateIds() {
  const text = read(INVENTORY);
  if (text === null) return null;
  const fenced = /```text\n(prose-gate-inventory@1\n[\s\S]*?)```/.exec(text);
  if (!fenced) return null;
  const ids = new Set();
  for (const line of fenced[1].split("\n").slice(2)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const id = line.split("|")[0].trim();
    if (GATE_ID.test(id)) ids.add(id);
  }
  return ids;
}

/** True when `<file>#block:<id>` resolves: the fenced marker is present in that file. */
const hasBlock = (text, id) => {
  const fenced = /```[a-zA-Z]*\n([^\n]*)\n[\s\S]*?```/g;
  for (const match of text.matchAll(fenced)) {
    if (match[1].trim() === id) return true;
  }
  return false;
};

const finding = (reason, subject, detail) => ({ reason, subject, detail });

/** The owner cell: `<path>` or `<path>#<heading>` or `<path>#block:<id>`. */
function ownerFailure(cell) {
  const [relative, anchor] = cell.split("#");
  const target = relative === "this guide" ? GUIDE : relative;
  if (target.trim() === "") return finding("owner-unresolved", cell, "the cell names no path");
  if (!exists(target)) return finding("owner-unresolved", cell, `${target} does not exist`);
  if (anchor === undefined) return null;
  const text = read(target);
  if (text === null) return finding("owner-unresolved", cell, `${target} is unreadable`);
  if (anchor.startsWith("block:")) {
    const id = anchor.slice("block:".length);
    return hasBlock(text, id) ? null : finding("owner-unresolved", cell, `${target} carries no ${id} block`);
  }
  return headingBoundsAll(text, anchor).length > 0
    ? null
    : finding("owner-unresolved", cell, `${target} carries no "${anchor}" heading`);
}

/** The state cell: one of the three declared forms, resolved. */
function stateFailure(id, cell, gates) {
  const separator = cell.indexOf(":");
  if (separator === -1) return finding("state-shape", id, `${cell} declares no form`);
  const form = cell.slice(0, separator).trim();
  const value = cell.slice(separator + 1).trim();
  if (!(form in STATES)) return finding("state-shape", id, `${form} is not one of materialized, soft-by-design, materializable`);
  if (form === "soft-by-design") {
    return value.length < MIN_REASON || /^[-—?]+$/.test(value)
      ? finding("reason-missing", id, `${value || "nothing recorded"} — record why the law stays prose`)
      : null;
  }
  if (form === "materializable") {
    return /^#\d+$/.test(value) ? null : finding("state-shape", id, `${value || "nothing"} — name the issue as #<n>`);
  }
  // materialized: a gate id (resolved against the inventory) or a repository path.
  const looksLikePath = value.includes("/") || value.endsWith(".mjs") || value.endsWith(".md");
  if (looksLikePath) return exists(value) ? null : finding("state-unresolved", id, `${value} does not exist`);
  if (gates === null) return finding("state-unresolved", id, `${INVENTORY} is missing, so ${value} cannot be resolved`);
  if (!GATE_ID.test(value)) return finding("state-unresolved", id, `${value} is neither a gate id nor a path`);
  return gates.has(value) ? null : finding("state-unresolved", id, `${value} is not a gate of ${INVENTORY}`);
}

function check() {
  const guideText = read(GUIDE);
  const body = guideText === null ? null : blockOf(guideText);
  if (body === null) {
    return {
      ok: false,
      rows: 0,
      homes: findHomes().length,
      failures: [finding("missing-block", null, `${GUIDE} carries no ${MARKER} block`)],
    };
  }
  const failures = [];
  const found = findHomes();
  for (const home of found) {
    if (home !== GUIDE) failures.push(finding("second-home", home, `${GUIDE} is the block's only home`));
  }
  const cells = body.filter((line) => line.trim() !== "");
  const header = cells.shift() ?? "";
  if (header.trim() !== "rule | statement | owner | state") {
    failures.push(finding("row-shape", null, `the block header is "${header.trim()}", not "rule | statement | owner | state"`));
  }
  const gates = gateIds();
  const seen = new Set();
  let rows = 0;
  for (const [index, line] of cells.entries()) {
    const parts = line.split("|").map((cell) => cell.trim());
    if (parts.length !== 4 || parts.some((cell) => cell === "")) {
      failures.push(finding("row-shape", null, `row ${index + 1} does not carry four non-empty cells (${line.trim().slice(0, 80)})`));
      continue;
    }
    const [id, statement, owner, state] = parts;
    rows += 1;
    if (!RULE_ID.test(id)) {
      failures.push(finding("row-shape", null, `row ${index + 1} id "${id}" is not IR<n>-<slug>`));
      continue;
    }
    if (seen.has(id)) {
      failures.push(finding("duplicate-id", id, `row ${index + 1} states a rule id already present`));
      continue;
    }
    seen.add(id);
    if (statement.length < 15) failures.push(finding("row-shape", id, `states no rule (${statement || "nothing"})`));
    const ownerFault = ownerFailure(owner);
    if (ownerFault !== null) failures.push(ownerFault);
    const stateFault = stateFailure(id, state, gates);
    if (stateFault !== null) failures.push(stateFault);
  }
  if (rows === 0) failures.push(finding("row-shape", null, `the ${MARKER} block carries no rule row`));
  return { ok: failures.length === 0, rows, homes: found.length, failures };
}

const report = check();
if (json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (report.ok) {
  process.stdout.write(`PASS inviolable rules: ${report.rows} rows · ${report.homes} home\n`);
} else {
  for (const failure of report.failures) {
    process.stdout.write(`FAIL inviolable rules: ${failure.reason}${failure.subject === null ? "" : `: ${failure.subject}`}\n`);
    if (failure.detail) process.stdout.write(`  ${failure.detail}\n`);
  }
}
process.exit(report.ok ? 0 : 1);
