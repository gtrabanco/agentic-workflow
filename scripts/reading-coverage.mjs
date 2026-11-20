#!/usr/bin/env node
/**
 * reading-coverage.mjs — the full-read claim, made checkable (issue #646 S5a/B).
 *
 * The unit that filed this issue produced its findings from keyword sweeps and
 * reported them as a full read; six named files had never been opened. A claim
 * like that is unverifiable by construction unless the file set is **derived**
 * from the tree and every member is accounted for, with the depth it was read at
 * declared rather than implied.
 *
 * The reader therefore does four things and nothing else:
 *
 *   - enumerates the in-scope tree from the S5a list (every `SKILL.md`, every
 *     `skills/*\/references/*.md`, the tutorial and the note trees, the whole
 *     scaffold, the forge templates) minus the exclusions the ledger declares;
 *   - requires one row per in-scope file (`unrowed`);
 *   - requires every row to name an existing in-scope file (`stale-row`), a
 *     published depth (`bad-depth`) and its evidence (`no-evidence`);
 *   - refuses closed when the ledger or its block is absent, so a missing record
 *     never reads as coverage.
 *
 * Usage
 *   bun scripts/reading-coverage.mjs [--repo <dir>] [--ledger <path>] [--scope docs-skills] [--json]
 *   bun scripts/reading-coverage.mjs --help
 *   (node fallback, same argv)
 *
 * Exit: 0 `covered` · 1 a finding or a refusal · 2 a usage error. Read-only.
 *
 * Its sibling suite is `scripts/reading-coverage.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The ledger that carries the read rows for this unit. */
export const DEFAULT_LEDGER = "docs/fix/646-docs-skills-reconciliation/second-read.md";
/** The block the ledger publishes. */
export const COVERAGE_MARKER = "reading-coverage@1";
/** The published depth set. A row's depth is one of these, never a synonym. */
export const DEPTHS = Object.freeze(["full", "scanned"]);
/** The closed finding set, in report order. */
export const FINDING_CODES = Object.freeze(["unrowed", "stale-row", "bad-depth", "no-evidence", "missing-block", "missing-ledger"]);
/** The scope's directory roots, the S5a list. */
export const SCOPE_ROOTS = Object.freeze([
  "AGENTS.md",
  "README.md",
  "skills/",
  "docs/workflow/",
  "docs/design/",
  "docs/research/",
  "docs/assets/",
  "docs/passive/",
  "docs/pre-spec/",
  "docs/telemetry/",
  "docs/",
  "template/",
  ".github/",
]);
/** Roots a scope never descends into: build output, dependency trees, the
 *  repository's own workflow state (machine, not documentation). */
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".worktrees"]);

const isDoc = (rel) => /\.(md|json|ya?ml|png|svg|pdf|txt|jsonc|sh|ts|example)$/.test(rel);

/** Every in-scope file, repo-relative, sorted — the S5a list made executable. */
export function scopeFiles(repo, scope = "docs-skills") {
  if (scope !== "docs-skills") throw new Error(`unknown scope ${scope}`);
  const out = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        const rel = path.relative(repo, path.join(dir, entry.name)).split(path.sep).join("/");
        if (isDoc(rel)) out.add(rel);
      }
    }
  };
  for (const root of SCOPE_ROOTS) {
    const full = path.join(repo, root);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) walk(full);
    else out.add(root);
  }
  return [...out].sort();
}

/** The ledger's rows, directives and faults. */
export function coverageRows(text) {
  const lines = String(text).split("\n");
  const at = lines.findIndex((line, index) => line.trim() === "```text" && lines[index + 1]?.trim() === COVERAGE_MARKER);
  if (at === -1) return { rows: [], directives: {}, faults: [`no \`\`\`text block carrying ${COVERAGE_MARKER}`] };
  const directives = { excluded: [] };
  const rows = [];
  const faults = [];
  let header = null;
  for (const line of lines.slice(at + 2)) {
    if (line.trim() === "```") break;
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("#")) {
      const directive = /^#\s*([a-z-]+):\s*(.*)$/.exec(trimmed);
      if (directive && directive[1] === "excluded") directives.excluded.push(directive[2].split(" — ")[0].trim());
      continue;
    }
    const cells = trimmed.split("|").map((cell) => cell.trim());
    if (header === null) {
      header = cells;
      if (header.join("|") !== "file|tier|depth|evidence") faults.push(`the block header is "${header.join(" | ")}", expected "file | tier | depth | evidence"`);
      continue;
    }
    if (cells.length !== 4) {
      faults.push(`row "${cells[0] ?? "?"}" carries ${cells.length} cells, expected 4`);
      continue;
    }
    const [file, tier, depth, evidence] = cells;
    rows.push({ file, tier, depth, evidence });
  }
  return { rows, directives, faults };
}

const finding = (code, file, detail) => ({ code, file, detail });

/** Judge one repository's read ledger against its own tree. Read-only. */
export function coverage(repo, scope = "docs-skills") {
  const ledgerPath = path.join(repo, DEFAULT_LEDGER);
  const base = { verdict: "REFUSED", findings: [], counts: { files: 0, full: 0, scanned: 0 } };
  if (!fs.existsSync(ledgerPath)) {
    return { ...base, findings: [finding("missing-ledger", DEFAULT_LEDGER, "the read ledger does not exist, so no coverage can be claimed")] };
  }
  const { rows, directives, faults } = coverageRows(fs.readFileSync(ledgerPath, "utf8"));
  const findings = [];
  if (faults.length > 0) {
    return { ...base, findings: faults.map((fault) => finding("missing-block", DEFAULT_LEDGER, fault)) };
  }

  const files = scopeFiles(repo, scope);
  const inScope = new Set(files);
  for (const excluded of directives.excluded) {
    if (excluded.endsWith("/")) {
      for (const rel of files) if (rel.startsWith(excluded)) inScope.delete(rel);
    } else {
      inScope.delete(excluded);
    }
  }
  // The ledger cannot require a row about itself; the real one declares one
  // anyway, which the existence check accepts.
  inScope.delete(DEFAULT_LEDGER);
  const rowed = new Map(rows.map((row) => [row.file, row]));
  for (const rel of [...inScope].sort()) {
    if (!rowed.has(rel)) findings.push(finding("unrowed", rel, "in scope and never declared, so the full-read claim skips it"));
  }
  for (const row of rows) {
    if (!fs.existsSync(path.join(repo, row.file))) findings.push(finding("stale-row", row.file, "the ledger names a file this tree does not carry"));
    if (!DEPTHS.includes(row.depth)) findings.push(finding("bad-depth", row.file, `depth "${row.depth}" is outside ${DEPTHS.join(" | ")}`));
    if (row.evidence === "") findings.push(finding("no-evidence", row.file, "the row records no evidence for its depth"));
  }
  const counts = {
    files: inScope.size,
    full: rows.filter((row) => row.depth === "full").length,
    scanned: rows.filter((row) => row.depth === "scanned").length,
  };
  return { verdict: findings.length === 0 ? "covered" : "FAIL", findings, counts };
}

function usage(message) {
  process.stderr.write(`reading-coverage: ${message}\n`);
  process.stderr.write("usage: bun scripts/reading-coverage.mjs [--repo <dir>] [--ledger <path>] [--scope docs-skills] [--json]  (node fallback, same argv)\n");
  process.exit(2);
}

function main(argv) {
  let repo = SCRIPT_ROOT;
  let scope = "docs-skills";
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write("usage: bun scripts/reading-coverage.mjs [--repo <dir>] [--ledger <path>] [--scope docs-skills] [--json]\n");
      return 0;
    }
    if (arg === "--json") {
      json = true;
    } else if (arg === "--repo" || arg === "--ledger" || arg === "--scope") {
      const value = argv[index + 1];
      if (value === undefined) usage(`${arg} needs a value`);
      if (arg === "--repo") repo = path.resolve(value);
      if (arg === "--scope") scope = value;
      index += 1;
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  if (!fs.existsSync(repo)) usage(`${repo} does not exist`);
  const result = coverage(repo, scope);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    const lines = [
      `reading-coverage — ${result.counts.files} in scope · ${result.counts.full} full · ${result.counts.scanned} scanned · ${result.findings.length} finding(s)`,
    ];
    for (const entry of result.findings) lines.push(`FINDING ${entry.code} — ${entry.file} — ${entry.detail}`);
    lines.push(`verdict: ${result.verdict}`);
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  return result.verdict === "covered" ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
