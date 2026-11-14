#!/usr/bin/env node
/**
 * residual-classify.mjs — issue #438: "unused — and then what?" answered by
 * the plan, never by a zero match alone.
 *
 *   bun scripts/residual-classify.mjs <surface|symbol> [--root <dir>]
 *   bun scripts/residual-classify.mjs --receipt <surface|symbol> --date <YYYY-MM-DD>
 *   bun scripts/residual-classify.mjs --inventory --base <rev> [--root <dir>]
 *   (node fallback, same argv)
 *
 * Four states, each a claim some plan surface makes (the issue's own words):
 *
 *   used        a live consumer in executable code
 *   andamio     no consumer yet, but a roadmap row, an open unit, a recorded
 *               forward promise or a charter planned-work row names it
 *   half-built  an open unit names it in a `## Tasks` bullet that is not ticked
 *               → resume, not retire
 *   orphan      nothing in the plan claims it → retire is legitimate here
 *   ambiguous   a consult surface could not be read, or a recorded promise's
 *               consumer does not resolve → fail closed, never a guess
 *
 * The consult order is fixed (live-tree, roadmap-rows, open-unit-tasks,
 * forward-promises, charter-planned-work); every document carries one row per
 * surface with the path it read and the evidence it found. Precedence is
 * `used` > `half-built` > `andamio` > `orphan`, because the two middle states
 * are defined as "no consumer yet".
 *
 * A forward promise is a declared grammar, never inferred prose — it lives in
 * a unit folder's `decisions.md`:
 *
 *   ```text
 *   residual-promise@1
 *   surface | consumer | date | owner
 *   `theName` | unit:docs/features/11-x | 2026-11-11 | owner
 *   ```
 *
 * `consumer` resolves offline to `unit:<unit-folder>` or `row:<NN>`; anything
 * else (a bare issue number, a sentence) refuses as `ambiguous`.
 *
 * `--inventory --base <rev>` is the strictly-additive unit's answer to
 * `## Retirements` (issue #438's third expected behaviour): one row per
 * surface the change adds — added non-documentation files and added `export`
 * symbols — each with the state above and the consumer evidence sites the scan
 * counted, so an unclaimed addition is visible at plan time instead of passing
 * as an empty prose section.
 *
 * `--receipt <orphan> --date <YYYY-MM-DD>` prints the recorded receipt plus
 * the dated decision row a retirement leaves behind, and refuses every other
 * state: `orphan` is the only retire-legitimate state.
 *
 * Exit: 0 a classified state (`used`, `andamio`, `half-built`, `orphan`);
 * 1 `ambiguous` (fail-closed refusal, still printed as the document); 2 usage.
 *
 * Reads the tree and git history only — no clock, no forge, no network. The
 * date a retirement records is supplied by `--date`, so identical inputs print
 * identical bytes. Sibling suite: `scripts/residual-classify.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import {
  ROADMAP_DOCUMENT,
  readRoadmapIndex,
  roadmapSection,
  roadmapTableRows,
  tableCells,
} from "../packages/agentic-workflow/src/index-document.mjs";
import { parseTasks } from "../packages/agentic-workflow/src/runner/lib.mjs";
import { sectionBounds } from "../packages/agentic-workflow/src/runner/unit-doc-phases.mjs";

/** The document's contract id. */
export const CONTRACT_ID = "residual-classify@1";
/** The inventory's contract id. */
export const INVENTORY_CONTRACT_ID = "residual-classify-inventory@1";
/** The promise declaration block's id (registered in `normative-surfaces@1`). */
export const PROMISE_CONTRACT_ID = "residual-promise@1";

/** The consult order the issue fixes; every document reports these rows in it. */
export const CONSULT_ORDER = Object.freeze([
  "live-tree",
  "roadmap-rows",
  "open-unit-tasks",
  "forward-promises",
  "charter-planned-work",
]);

/** The closed state vocabulary. */
export const STATES = Object.freeze(["used", "andamio", "half-built", "orphan", "ambiguous"]);

/** The closed reason vocabulary. */
export const REASONS = Object.freeze([
  "live-consumer",
  "unmet-task",
  "recorded-planned-consumer",
  "no-plan-claim",
  "unreadable-live-tree",
  "unreadable-roadmap-rows",
  "unreadable-open-unit-tasks",
  "unreadable-forward-promises",
  "unreadable-charter-planned-work",
  "unresolved-consumer",
]);

/** Row statuses that end a plan claim: a terminal row names delivered work. */
const TERMINAL_STATUS = /^(done|declined|folded|wontfix|dropped)\b/i;

/** Unit folders, by kind. A folder is a unit only when it carries a SPEC.md. */
const UNIT_KINDS = Object.freeze(["features", "fix"]);

/** Paths the consumer scan never reads: documentation, runtime state, VCS. */
const NON_CONSUMER_GLOBS = Object.freeze([
  "!docs/**",
  "!**/*.md",
  "!.git/**",
  "!node_modules/**",
  "!.agentic-workflow/**",
  "!.worktrees/**",
]);

/**
 * A symbol's declaration is not a consumer of itself: `export function x()`,
 * `def x`, `class x`, `const x =`. A target that only ever appears this way
 * has no consumer (the difference `used` and `orphan` turn on).
 */
const DECLARATION_PATTERNS = [
  (target) => new RegExp(`\\b(?:export\\s+)?(?:async\\s+)?(?:function|class|const|let|var|interface|type|enum)\\s+${target}\\b`),
  (target) => new RegExp(`\\bdef\\s+${target}\\b`),
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whether a text names the target as a token (never as a longer identifier). */
export function mentions(text, target) {
  const pattern = new RegExp(`(^|[^\\w$])${escapeRegExp(target)}([^\\w$]|$)`);
  return pattern.test(text);
}

const stripTicks = (cell) => String(cell ?? "").replace(/`/g, "").trim();

function isDeclaration(content, target) {
  return DECLARATION_PATTERNS.some((build) => build(escapeRegExp(target)).test(content));
}

function run(bin, args, cwd) {
  try {
    const result = spawnSync(bin, args, { cwd, encoding: "utf8" });
    return { status: result.status, stdout: result.stdout ?? "", missing: result.error?.code === "ENOENT" };
  } catch {
    return { status: 2, stdout: "", missing: true };
  }
}

/* --------------------------------------------------------------- live tree */

/**
 * The live consumers of the target: `rg`-first, `grep` as the documented
 * fallback (a project without rg still classifies), never a documentation
 * mention. Evidence is the first five sorted `path:line` sites.
 */
export function liveTreeConsumers(target, { root = process.cwd(), rgBin = "rg", grepBin = "grep" } = {}) {
  const isPath = target.includes("/");
  let result = run(
    rgBin,
    ["--fixed-strings", "--line-number", "--no-heading", "--color", "never", ...NON_CONSUMER_GLOBS.flatMap((glob) => ["--glob", glob]), target, "."],
    root,
  );
  if (result.missing) {
    result = run(
      grepBin,
      ["-RFn", "--exclude-dir=.git", "--exclude-dir=node_modules", "--exclude-dir=docs", "--exclude-dir=.agentic-workflow", "--exclude-dir=.worktrees", "--exclude=*.md", "--", target, "."],
      root,
    );
  }
  if (result.missing) return { surface: "live-tree", path: ".", result: "unreadable", evidence: [], detail: "unreadable-live-tree" };
  if (result.status === 1) return { surface: "live-tree", path: ".", result: "none", evidence: [] };
  if (result.status !== 0) return { surface: "live-tree", path: ".", result: "unreadable", evidence: [], detail: "unreadable-live-tree" };

  const hits = [];
  for (const line of result.stdout.split("\n")) {
    const match = /^(.*?):(\d+):(.*)$/.exec(line);
    if (match === null) continue;
    const file = match[1].replace(/^\.\//, "");
    if (isPath && file === target) continue;
    if (isDeclaration(match[3], target)) continue;
    hits.push({ file, line: Number(match[2]) });
  }
  hits.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
  const evidence = hits.slice(0, 5).map((hit) => `${hit.file}:${hit.line}`);
  return {
    surface: "live-tree",
    path: ".",
    result: evidence.length === 0 ? "none" : "consumer",
    evidence,
  };
}

/* ---------------------------------------------------------------- roadmap */

function readIndex(root) {
  try {
    const index = readRoadmapIndex(root);
    if (index === null) return { absent: true, text: "", features: [], fixes: [] };
    return {
      absent: false,
      text: index.text,
      features: roadmapTableRows(index.text, "feature"),
      fixes: roadmapTableRows(index.text, "fix"),
    };
  } catch {
    return { absent: false, text: "", features: [], fixes: [], unreadable: true };
  }
}

/** The line one row occupies in the roadmap: `tableCells` equality is the key. */
function rowLine(text, cells) {
  const lines = text.split("\n");
  for (let number = 1; number <= lines.length; number += 1) {
    const found = tableCells(lines[number - 1]);
    if (found.length === cells.length && found.every((cell, index) => cell === cells[index])) return number;
  }
  return 0;
}

const rowIsOpen = (cells) => !TERMINAL_STATUS.test(stripTicks(cells[2]));

function roadmapSurfaces(index, target) {
  const claims = [];
  for (const [kind, rows] of [["feature", index.features], ["fix", index.fixes]]) {
    for (const cells of rows) {
      const searched = kind === "feature" ? cells.filter((_, position) => position !== 3) : cells;
      const names = searched.some((cell) => mentions(cell, target));
      if (!names) continue;
      claims.push({ kind, cells, open: rowIsOpen(cells) });
    }
  }
  return claims;
}

function roadmapConsult(index, target) {
  const base = { surface: "roadmap-rows", path: ROADMAP_DOCUMENT };
  if (index.absent) return { ...base, result: "absent", evidence: [] };
  const declaresTables = roadmapSection(index.text, "Features") !== null || roadmapSection(index.text, "Fixes") !== null;
  if (index.unreadable || !declaresTables) {
    return { ...base, result: "unreadable", evidence: [], detail: "unreadable-roadmap-rows" };
  }
  const open = roadmapSurfaces(index, target).filter((claim) => claim.open);
  if (open.length === 0) return { ...base, result: "none", evidence: [] };
  return {
    ...base,
    result: "claim",
    evidence: open.map((claim) => `${ROADMAP_DOCUMENT}:${rowLine(index.text, claim.cells)}`),
  };
}

/* ------------------------------------------------------------------ units */

/** Every unit folder: a directory under docs/features or docs/fix carrying a
 *  SPEC.md (a cut unit) or a decisions.md (a claim/promise ledger). */
export function unitFolders(root = process.cwd()) {
  const units = [];
  for (const kind of UNIT_KINDS) {
    const base = path.join(root, "docs", kind);
    let entries;
    try {
      entries = fs.readdirSync(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (!entry.isDirectory()) continue;
      const relative = `docs/${kind}/${entry.name}`;
      const spec = path.join(base, entry.name, "SPEC.md");
      const decisions = path.join(base, entry.name, "decisions.md");
      const hasSpec = fs.existsSync(spec);
      if (!hasSpec && !fs.existsSync(decisions)) continue;
      units.push({
        kind,
        dir: relative,
        slug: entry.name.replace(/^\d+-/, ""),
        spec: `${relative}/SPEC.md`,
        decisions: `${relative}/decisions.md`,
        hasSpec,
      });
    }
  }
  return units;
}

/**
 * Whether a unit is still open. A unit with no roadmap row is open (it is
 * being cut); a unit whose row is terminal is closed and its tasks are no
 * longer a plan claim.
 */
function unitIsOpen(unit, index) {
  const rows = unit.kind === "features" ? index.features : index.fixes;
  const row = rows.find((cells) => stripTicks(cells[1]) === unit.slug);
  if (row === undefined) return true;
  return rowIsOpen(row);
}

function unitConsult(units, index, target, root) {
  const base = {
    surface: "open-unit-tasks",
    path: "docs/features/*/SPEC.md, docs/fix/*/SPEC.md",
  };
  if (units.length === 0) return { ...base, result: "absent", evidence: [] };
  const unmet = [];
  const met = [];
  for (const unit of units) {
    if (!unit.hasSpec) continue;
    if (!unitIsOpen(unit, index)) continue;
    let text;
    try {
      text = fs.readFileSync(path.join(root, unit.spec), "utf8");
    } catch {
      return { ...base, result: "unreadable", evidence: [], detail: "unreadable-open-unit-tasks" };
    }
    for (const task of parseTasks(text)) {
      if (!mentions(task.label, target)) continue;
      (task.ticked ? met : unmet).push(`${unit.spec}:P${task.n}`);
    }
  }
  if (unmet.length > 0) return { ...base, result: "unmet", evidence: unmet.sort() };
  if (met.length > 0) return { ...base, result: "met", evidence: met.sort() };
  return { ...base, result: "none", evidence: [] };
}

/* -------------------------------------------------------- forward promises */

/**
 * Parse every `residual-promise@1` block of one decisions document. A block
 * whose contract line or header is wrong, and a row that does not carry four
 * cells, are quarantined — the refusal input — never silently dropped. Line
 * numbers are absolute in the document, so a receipt cites the real line.
 */
export function parsePromises(text) {
  const rows = [];
  const quarantined = [];
  const lines = text.split("\n");
  let fence = null;
  let block = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const run = /^\s*(`{3,}|~{3,})/.exec(line);
    if (run !== null) {
      if (fence === null) {
        fence = run[1][0];
        block = { lines: [], numbers: [] };
        continue;
      }
      fence = null;
      if (block !== null) {
        const content = block.lines.map((entry, position) => ({ entry, number: block.numbers[position] }));
        if (content.length > 0 && content[0].entry.trim() === PROMISE_CONTRACT_ID) {
          const header = content[1];
          const expected = ["surface", "consumer", "date", "owner"].join("|");
          if (header === undefined || header.entry.split("|").map((cell) => cell.trim()).join("|") !== expected) {
            quarantined.push({ line: content[0].number, reason: "malformed-header" });
          } else {
            for (const { entry, number } of content.slice(2)) {
              if (entry.trim() === "") continue;
              const cells = entry.split("|").map((cell) => cell.trim());
              if (cells.length !== 4) {
                quarantined.push({ line: number, reason: "malformed-row" });
                continue;
              }
              rows.push({
                line: number,
                surface: stripTicks(cells[0]),
                consumer: cells[1],
                date: cells[2],
                owner: cells[3],
              });
            }
          }
        }
      }
      block = null;
      continue;
    }
    if (fence !== null && block !== null) {
      block.lines.push(line);
      block.numbers.push(index + 1);
    }
  }
  return { rows, quarantined };
}

/** Resolve a promise consumer offline: `unit:<folder>` or `row:<NN>`. */
function resolveConsumer(consumer, units, index) {
  const unitShape = /^unit:(.+)$/.exec(consumer);
  if (unitShape !== null) {
    const wanted = unitShape[1].replace(/\/+$/, "");
    const unit = units.find((candidate) => candidate.dir === wanted);
    if (unit === undefined || !unit.hasSpec) return null;
    return unitIsOpen(unit, index) ? "open" : null;
  }
  const rowShape = /^row:(\d+)$/.exec(consumer);
  if (rowShape !== null) {
    const wanted = String(Number(rowShape[1]));
    const rows = [...index.features, ...index.fixes];
    const row = rows.find((cells) => {
      const first = stripTicks(cells[0]).replace(/^\[#(\d+)\].*$/, "$1").replace(/^#/, "");
      return String(Number(first)) === wanted;
    });
    if (row === undefined) return null;
    return rowIsOpen(row) ? "open" : null;
  }
  return null;
}

function promiseConsult(units, index, target, root) {
  const base = { surface: "forward-promises", path: "docs/features/*/decisions.md, docs/fix/*/decisions.md" };
  let present = false;
  const claims = [];
  const refusals = [];
  for (const unit of units) {
    const file = path.join(root, unit.decisions);
    if (!fs.existsSync(file)) continue;
    present = true;
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      return { ...base, result: "unreadable", evidence: [], detail: "unreadable-forward-promises" };
    }
    const parsed = parsePromises(text);
    for (const row of parsed.rows) {
      if (row.surface !== target) continue;
      const resolution = resolveConsumer(row.consumer, units, index);
      if (resolution === "open") claims.push(`${unit.decisions}:${row.line}`);
      else refusals.push(`${unit.decisions}:${row.line}`);
    }
  }
  if (refusals.length > 0) {
    return { ...base, result: "unreadable", evidence: refusals.sort(), detail: "unresolved-consumer" };
  }
  if (claims.length > 0) return { ...base, result: "claim", evidence: claims.sort() };
  return { ...base, result: present ? "none" : "absent", evidence: [] };
}

/* ---------------------------------------------------------------- charter */

/**
 * The guide's charter planned-work rows: a table under a heading matching
 * "planned work" inside `## Project charter`. A project with no such section
 * records `absent` — a declared degradation, never a guessed claim. The
 * charter section is bounded by the shared fence-aware reader (the `## `
 * grammar's one owner), so this script carries no heading scan of its own.
 */
function charterConsult(target, root) {
  const base = { surface: "charter-planned-work", path: "AGENTS.md" };
  let text;
  try {
    text = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  } catch {
    return { ...base, result: "absent", evidence: [] };
  }
  const bounds = sectionBounds(text, "Project charter");
  if (bounds === null) return { ...base, result: "absent", evidence: [] };
  const startLine = text.slice(0, bounds[0]).split("\n").length;
  const section = text.slice(bounds[0], bounds[1]).split("\n");
  let planned = -1;
  let level = 0;
  for (let index = 1; index < section.length; index += 1) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(section[index]);
    if (heading === null) continue;
    if (/planned[- ]work/i.test(heading[2])) {
      planned = index;
      level = heading[1].length;
      break;
    }
  }
  if (planned === -1) return { ...base, result: "absent", evidence: [] };
  const evidence = [];
  for (let index = planned + 1; index < section.length; index += 1) {
    const heading = /^(#{1,6})\s+/.exec(section[index]);
    if (heading !== null && heading[1].length <= level) break;
    if (!section[index].trimStart().startsWith("|")) continue;
    const cells = tableCells(section[index]);
    if (cells.length === 0 || cells.every((cell) => /^[-:\s]*$/.test(cell))) continue;
    if (stripTicks(cells[0]) === target) evidence.push(`AGENTS.md:${startLine + index}`);
  }
  if (evidence.length > 0) return { ...base, result: "claim", evidence };
  return { ...base, result: "none", evidence: [] };
}

/* ---------------------------------------------------------------- classify */

/**
 * Classify one target against every consult surface. Pure over the tree: the
 * same tree yields the same document, so the caller can diff two runs.
 */
export function classify(target, { root = process.cwd(), rgBin, grepBin } = {}) {
  const index = readIndex(root);
  const units = unitFolders(root);
  const consulted = [
    liveTreeConsumers(target, { root, ...(rgBin === undefined ? {} : { rgBin }), ...(grepBin === undefined ? {} : { grepBin }) }),
    roadmapConsult(index, target),
    unitConsult(units, index, target, root),
    promiseConsult(units, index, target, root),
    charterConsult(target, root),
  ];
  const bySurface = new Map(consulted.map((row) => [row.surface, row]));

  let state;
  let reason;
  const unreadable = consulted.find((row) => row.result === "unreadable");
  if (bySurface.get("live-tree").result === "consumer") {
    state = "used";
    reason = "live-consumer";
  } else if (unreadable !== undefined) {
    state = "ambiguous";
    reason = unreadable.detail ?? `unreadable-${unreadable.surface}`;
  } else if (bySurface.get("open-unit-tasks").result === "unmet") {
    state = "half-built";
    reason = "unmet-task";
  } else if (consulted.some((row) => row.result === "claim" || row.result === "met")) {
    state = "andamio";
    reason = "recorded-planned-consumer";
  } else {
    state = "orphan";
    reason = "no-plan-claim";
  }
  return { contract: CONTRACT_ID, target, state, reason, consulted };
}

/* --------------------------------------------------------------- inventory */

/** An added path that is a code surface: not documentation, not runtime state. */
const isCodeSurface = (file) =>
  !file.startsWith("docs/") &&
  !file.startsWith(".changeset/") &&
  !file.startsWith(".agentic-workflow/") &&
  !file.endsWith(".md");

const EXPORTED_SYMBOL = /^\s*export\s+(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;

/**
 * The computed surface inventory of a change (issue #438's third expected
 * behaviour): the added code files and the added `export` symbols against
 * `base`, each classified — the receipt a strictly additive unit's
 * `## Retirements` section carries instead of prose — with the live-tree
 * evidence sites behind that state, so a reader judges a `used`/`orphan`
 * verdict instead of trusting it.
 */
export function inventory(root, base, options = {}) {
  const git = (args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    if (result.status !== 0) return null;
    return result.stdout;
  };
  const added = git(["diff", "--name-only", "--diff-filter=A", `${base}...HEAD`]);
  if (added === null) throw new Error(`inventory: git diff against ${base} failed`);
  const patch = git(["diff", "-U0", `${base}...HEAD`]) ?? "";
  const files = added.split("\n").map((line) => line.trim()).filter((line) => line !== "" && isCodeSurface(line));
  const symbols = new Set();
  for (const line of patch.split("\n")) {
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    const match = EXPORTED_SYMBOL.exec(line.slice(1));
    if (match !== null) symbols.add(match[1]);
  }
  const rows = [
    ...files.map((file) => ({ surface: file, kind: "file" })),
    ...[...symbols].map((symbol) => ({ surface: symbol, kind: "symbol" })),
  ]
    .sort((a, b) => (a.surface < b.surface ? -1 : a.surface > b.surface ? 1 : 0))
    .map((row) => {
      const verdict = classify(row.surface, { root, ...options });
      const consumers = verdict.consulted.find((site) => site.surface === "live-tree");
      return { ...row, state: verdict.state, reason: verdict.reason, evidence: [...consumers.evidence] };
    });
  return { contract: INVENTORY_CONTRACT_ID, base, rows };
}

/* ---------------------------------------------------------------- receipt */

/**
 * The recorded receipt a retirement leaves: the verdict, every consulted path,
 * and the dated decision row a later unit cites to reclaim the name. Refuses
 * every state but `orphan` — the only retire-legitimate state.
 */
export function receipt(document, date) {
  if (document.state !== "orphan") return null;
  const lines = [
    `${CONTRACT_ID} — retire receipt`,
    `target: ${document.target}`,
    `state: ${document.state}`,
    `reason: ${document.reason}`,
    "consulted:",
    ...document.consulted.map((row) => `- ${row.surface} (${row.path}) — ${row.result}${row.evidence.length === 0 ? "" : `: ${row.evidence.join(", ")}`}`),
    `decision: ${date} — retire \`${document.target}\`; no plan surface claims it (${CONTRACT_ID}: ${document.reason}). A later unit reclaims the name only with this receipt.`,
  ];
  return `${lines.join("\n")}\n`;
}

/* -------------------------------------------------------------------- CLI */

const USAGE = `usage:
  bun scripts/residual-classify.mjs <surface|symbol> [--root <dir>]
  bun scripts/residual-classify.mjs --receipt <surface|symbol> --date <YYYY-MM-DD> [--root <dir>]
  bun scripts/residual-classify.mjs --inventory --base <rev> [--root <dir>]
  (node fallback, same argv)`;

function usage(message) {
  process.stderr.write(`residual-classify: ${message}\n${USAGE}\n`);
  process.exit(2);
}

function main(argv) {
  const options = { root: process.cwd(), receipt: false, inventory: false, date: null, base: null, target: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) usage(`${arg} needs a value`);
      index += 1;
      return next;
    };
    if (arg === "--root") options.root = path.resolve(value());
    else if (arg === "--receipt") options.receipt = true;
    else if (arg === "--inventory") options.inventory = true;
    else if (arg === "--date") options.date = value();
    else if (arg === "--base") options.base = value();
    else if (arg.startsWith("-")) usage(`unknown argument ${arg}`);
    else if (options.target === null) options.target = arg;
    else usage(`unexpected argument ${arg}`);
  }

  if (options.receipt && options.inventory) usage("--receipt and --inventory are exclusive");
  if (options.inventory) {
    if (options.base === null) usage("--inventory needs --base <rev>");
    const document = inventory(options.root, options.base);
    process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
    process.exit(0);
  }
  if (options.target === null) usage("a <surface|symbol> target is required");
  if (options.receipt) {
    if (options.date === null || !/^\d{4}-\d{2}-\d{2}$/.test(options.date)) usage("--receipt needs --date <YYYY-MM-DD>");
    const document = classify(options.target, { root: options.root });
    const text = receipt(document, options.date);
    if (text === null) {
      process.stderr.write(`residual-classify: retire refused — ${options.target} is ${document.state} (${document.reason}); only orphan is retire-legitimate\n`);
      process.exit(1);
    }
    process.stdout.write(text);
    process.exit(0);
  }
  const document = classify(options.target, { root: options.root });
  process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
  process.exit(document.state === "ambiguous" ? 1 : 0);
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) main(process.argv.slice(2));
