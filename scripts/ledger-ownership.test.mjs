#!/usr/bin/env node

/**
 * Feature 28 / P9 — AC16 (clause F2): durable ledger write ownership.
 *
 * AC16 requires one declared owner per ledger truth class plus its declared
 * mechanical annotator, present BOTH in the ownership map
 * (`skills/pre-execution-review/references/LEDGERS.md`) AND in every ledger
 * template (`docs/features/_TEMPLATE/LEDGERS.md`, `docs/fix/_TEMPLATE/LEDGERS.md`);
 * an undeclared script writer of a durable ledger must fail the scan; and a
 * declared annotator may append only the token its own entry names.
 *
 * Two scans, both local pure functions over text so every failure mode is proven
 * against a fixture instead of assumed:
 *
 *   1. `declaredOwnerScan` — the map and each template projection must agree in
 *      both directions. An owner-less row (map or template), a reworded owner, a
 *      dropped or invented template row, a non-existent owner skill, two writers
 *      on one column set, and an annotator token the annotator cannot produce are
 *      each a failure;
 *   2. `writePathScan` — every non-test script in `scripts/` and
 *      `packages/<name>/scripts/` whose write target resolves to a durable ledger must
 *      be declared for that ledger. A ledger the map does not declare at all, and
 *      a name on the map's `no-script-writer` directive, fail too. A script that
 *      only writes generated artifacts names no ledger and is out of scope — that
 *      is the exclusion, not a hole.
 *
 * Both scans fail closed: a missing or malformed `ledger-ownership@1` block is a
 * failure, never a pass. `LEDGER_OWNERSHIP_REPO` re-points the repository-state
 * tests at a throwaway tree, which is how the `node --test` non-zero proofs below
 * run this same suite over an injected defect rather than asserting one.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Re-pointable so the suite can be run red against an injected tree. */
const root = process.env.LEDGER_OWNERSHIP_REPO ? path.resolve(process.env.LEDGER_OWNERSHIP_REPO) : repoRoot;
const isChildRun = Boolean(process.env.LEDGER_OWNERSHIP_REPO);
const thisFile = fileURLToPath(import.meta.url);

// Spawn the runner on the same test file. `node --test <file>` and
// `bun test <file>` both start a runner; `bun --test <file>` does NOT — bun
// only starts a runner through the `test` subcommand, so passing `--test` as a
// flag under bun executes the file as a plain script and every `test()` call
// throws "Cannot use test outside of the test runner".
const testRunArgs = (file) => (process.versions?.bun ? ["test", file] : ["--test", file]);

const MAP_REL = "skills/pre-execution-review/references/LEDGERS.md";
const FEATURE_TEMPLATE_REL = "docs/features/_TEMPLATE/LEDGERS.md";
const FIX_TEMPLATE_REL = "docs/fix/_TEMPLATE/LEDGERS.md";
const PROVENANCE_REL = "scripts/ledger-provenance.mjs";

const MARKER = "ledger-ownership@1";
const MAP_COLUMNS = ["truth-class", "ledger", "owner", "annotator", "annotator-token", "validator"];
const TEMPLATE_COLUMNS = ["ledger", "owner", "annotator"];
const NONE = "none";

/** The frozen requirement: ACCEPTANCE.md AC16 (F2) names exactly these seven. */
const TRUTH_CLASSES = [
  "review-findings",
  "planning-findings",
  "progress",
  "known-issues",
  "decisions",
  "roadmap",
  "acceptance-manifest",
];

const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const squash = (text) => text.replace(/\s+/g, " ").trim();

// --- the versioned `ledger-ownership@1` grammar -------------------------------

/**
 * Read one fenced block opened by `MARKER`. Inside a block: a header row, a
 * separator row, data rows, and `#`-prefixed directive lines. Cells never carry a
 * pipe, so splitting one is exact.
 */
function parseBlock(text, { columns, label }) {
  const lines = text.split("\n");
  const rows = [];
  const directives = {};
  let blocks = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\s*(?:```|~~~)/.test(lines[i])) continue;
    const fence = lines[i].trim().slice(0, 3);
    const body = [];
    let j = i + 1;
    for (; j < lines.length && lines[j].trim() !== fence; j += 1) body.push(lines[j]);
    if (j >= lines.length) return { error: `${label}: unclosed code fence opened at line ${i + 1}`, rows: [] };
    i = j;
    if (!body.some((line) => line.trim() === MARKER)) continue;
    blocks += 1;
    const table = body.filter((line) => line.trim() !== "" && line.trim() !== MARKER);
    if (table.length < 2) return { error: `${label}: ${MARKER} needs a header and at least one row`, rows: [] };
    const header = splitRow(table[0]);
    if (header.join("|") !== columns.join("|")) {
      return { error: `${label}: ${MARKER} header must be exactly "${columns.join(" | ")}", found "${header.join(" | ")}"`, rows: [] };
    }
    // a markdown separator row is allowed but not required inside a fenced block
    const data = /^[-:\s|]+$/.test(table[1]) ? table.slice(2) : table.slice(1);
    if (!data.length) return { error: `${label}: ${MARKER} declares no rows`, rows: [] };
    for (const line of data) {
      if (line.trim().startsWith("#")) {
        const [key, value] = [line.trim().slice(1).split(":")[0].trim(), line.trim().slice(1).split(":").slice(1).join(":")];
        directives[key] = value.split("·").map((name) => name.trim()).filter(Boolean);
        continue;
      }
      const cells = splitRow(line);
      if (cells.length !== columns.length) {
        return { error: `${label}: ${MARKER} row needs ${columns.length} cells, found ${cells.length}: ${line}`, rows: [] };
      }
      rows.push(Object.fromEntries(columns.map((column, idx) => [column, cells[idx]])));
    }
  }
  if (blocks === 0) return { error: `${label}: no ${MARKER} block`, rows: [] };
  if (rows.length === 0) return { error: `${label}: ${MARKER} block declares no rows`, rows: [] };
  return { rows, directives };
}

function splitRow(line) {
  const cells = line.split("|");
  if (cells[0].trim() === "") cells.shift();
  if (cells.length && cells.at(-1).trim() === "") cells.pop();
  return cells.map((cell) => cell.trim());
}

/** ` · ` joins the ledgers of one truth class; ` + ` joins the owner column sets. */
const ledgerList = (cell) => cell.split("·").map((s) => s.trim()).filter(Boolean);
const ownerList = (cell) => cell.split("+").map((s) => s.trim()).filter(Boolean);
const tokenList = (cell) => cell.split("+").map((s) => s.trim()).filter(Boolean);
const tokenWord = (token) => (/·\s*([A-Za-z][\w-]*)/.exec(token) || [])[1] || null;
const basename = (pattern) => pattern.split("/").pop();
/** A pattern with a placeholder is a per-unit ledger: it matches on its name. */
const isUnitPattern = (pattern) => pattern.includes("<");

// --- scan 1: the declared-owner scan -----------------------------------------

function declaredOwnerScan({ mapText, templates, knownSkills, annotatorSources, label }) {
  const map = parseBlock(mapText, { columns: MAP_COLUMNS, label: `${label}: ownership map` });
  if (map.error) return { failures: [map.error], rows: [], patterns: new Map() };
  const projections = new Map();
  for (const [rel, text] of Object.entries(templates)) {
    const block = parseBlock(text, { columns: TEMPLATE_COLUMNS, label: `${label}: ${rel}` });
    if (block.error) return { failures: [block.error], rows: map.rows, patterns: new Map() };
    projections.set(rel, block.rows);
  }
  const failures = [];

  const classes = map.rows.map((row) => row["truth-class"]);
  for (const name of TRUTH_CLASSES) {
    const hits = classes.filter((c) => c === name).length;
    if (hits !== 1) failures.push(`${label}: the map declares ${hits} rows for truth class "${name}", AC16 requires exactly 1`);
  }
  for (const name of classes) {
    if (!TRUTH_CLASSES.includes(name)) failures.push(`${label}: map truth class "${name}" is not one of the seven AC16 classes`);
  }

  const patterns = new Map();
  for (const row of map.rows) {
    const who = `${label}: map row "${row["truth-class"]}"`;
    failures.push(...ownerCellFailures(who, row.owner, knownSkills));
    const ledgers = ledgerList(row.ledger);
    if (!ledgers.length) failures.push(`${who}: declares no ledger pattern`);
    for (const pattern of ledgers) {
      if (patterns.has(pattern)) failures.push(`${who}: ledger "${pattern}" is already declared by "${patterns.get(pattern)["truth-class"]}"`);
      else patterns.set(pattern, row);
      if (!pattern.endsWith(".md")) failures.push(`${who}: ledger "${pattern}" is not a markdown ledger`);
      if (!pattern.startsWith("docs/features/") && !pattern.startsWith("docs/fix/")) {
        failures.push(`${who}: ledger "${pattern}" is outside the durable ledger trees`);
      }
    }
    if (!row.validator) failures.push(`${who}: no validator command to prove the row`);
    if (row.annotator === NONE || row.annotator === "") {
      if (row["annotator-token"] && row["annotator-token"] !== NONE) {
        failures.push(`${who}: names an annotator token without an annotator`);
      }
    } else {
      failures.push(...annotatorFailures(who, row.annotator, tokenList(row["annotator-token"]), annotatorSources));
    }
  }

  for (const [rel, projectionRows] of projections) {
    const seen = new Set();
    for (const row of projectionRows) {
      const who = `${label}: ${rel} row "${row.ledger}"`;
      const mapRow = patterns.get(row.ledger);
      if (!mapRow) {
        failures.push(`${who}: the ownership map declares no such ledger`);
        continue;
      }
      if (seen.has(row.ledger)) failures.push(`${who}: declared twice in the template`);
      seen.add(row.ledger);
      if (!treeOf(rel).test(row.ledger)) failures.push(`${who}: belongs to the other tree`);
      failures.push(...ownerCellFailures(who, row.owner, knownSkills));
      if (squash(mapRow.owner) !== squash(row.owner)) {
        failures.push(`${who}: owner "${row.owner}" disagrees with the map "${mapRow.owner}"`);
      }
      if (squash(mapRow.annotator) !== squash(row.annotator)) {
        failures.push(`${who}: annotator "${row.annotator}" disagrees with the map "${mapRow.annotator}"`);
      }
    }
    for (const [pattern, mapRow] of patterns) {
      if (!treeOf(rel).test(pattern)) continue;
      if (!seen.has(pattern)) {
        failures.push(`${label}: ${rel} is missing the "${pattern}" row the map declares for ${mapRow["truth-class"]}`);
      }
    }
  }
  return { failures, rows: map.rows, patterns, directives: map.directives };
}

const treeOf = (rel) => (rel === FIX_TEMPLATE_REL ? /^docs\/fix\// : /^docs\/features\//);

/** The one-owner rule, checked mechanically: every column set names exactly one writer. */
function ownerCellFailures(who, cell, knownSkills) {
  const entries = ownerList(cell || "");
  if (!entries.length) return [`${who}: no declared owner`];
  const failures = [];
  const columnSets = new Set();
  for (const entry of entries) {
    const parts = entry.split(":");
    const [skill, columnSet] = [parts[0].trim(), parts.slice(1).join(":").trim()];
    if (parts.length !== 2 || !skill || !columnSet) {
      failures.push(`${who}: owner "${entry}" is not the declared "<skill>:<column-set>" form`);
      continue;
    }
    if (!knownSkills.has(skill)) failures.push(`${who}: owner "${skill}" is neither a shipped skill nor human-owner`);
    if (columnSets.has(columnSet)) failures.push(`${who}: column set "${columnSet}" has two declared writers — one owner per column set`);
    columnSets.add(columnSet);
  }
  return failures;
}

/**
 * The annotator's real emission set, read from its source rather than a magic
 * constant. `scripts/ledger-provenance.mjs` chooses its marker word from the score
 * ladder (`entry.token = chosen.score === 1 ? "ticked" : "fold"`), appends it in the
 * `--annotate` branch (`cells[6] = \` ${route} · ${entry.token} …\``), and re-opens an
 * unproven row with the `· REOPENED — provenance unproven` note in the same branch —
 * no phase number, which the git walk cannot observe (F58). A token
 * the entry names but the script cannot emit — or one the script emits that the
 * entry hides — is the drift AC16 forbids.
 */
function annotatorEmissionSet(sources, annotator, failures, who) {
  const source = sources[annotator];
  if (source === undefined) {
    failures.push(`${who}: annotator "${annotator}" is not a script this scan can read`);
    return new Set();
  }
  const start = source.indexOf("if (annotate) {");
  if (start === -1) {
    failures.push(`${who}: ${annotator} has no --annotate branch, so it can append nothing`);
    return new Set();
  }
  const branch = source.slice(start);
  const emitted = new Set();
  const ternary = /\.token\s*=\s*[^;\n]*\?\s*"([a-zA-Z]+)"\s*:\s*"([a-zA-Z]+)"/.exec(source);
  if (ternary) [ternary[1], ternary[2]].forEach((word) => emitted.add(word));
  const reopened = /·\s*([A-Z][A-Z]+)\s/.exec(branch);
  if (reopened) emitted.add(reopened[1]);
  if (!ternary || !branch.includes("${entry.token}")) {
    failures.push(`${who}: ${annotator} no longer appends a · <token> provenance marker — the map row is stale`);
  }
  return emitted;
}

function annotatorFailures(who, annotator, tokens, sources) {
  const failures = [];
  if (!/^scripts\/[\w./-]+\.mjs$/.test(annotator)) failures.push(`${who}: annotator "${annotator}" is not a scripts/*.mjs path`);
  if (!tokens.length) failures.push(`${who}: a declared annotator must name every token it may append`);
  const emitted = annotatorEmissionSet(sources, annotator, failures, who);
  for (const token of tokens) {
    const word = tokenWord(token);
    if (!word) failures.push(`${who}: annotator token "${token}" names no · marker`);
    else if (!emitted.has(word)) failures.push(`${who}: annotator ${annotator} cannot produce the declared token "${word}"`);
  }
  for (const word of emitted) {
    if (!tokens.map(tokenWord).includes(word)) failures.push(`${who}: annotator ${annotator} emits "· ${word}" but the entry does not name it`);
  }
  return failures;
}

// --- scan 2: the script write-path scan --------------------------------------

const WRITE_CALL = /(?:\bfs\.)?\b(?:writeFileSync|appendFileSync|writeFile|appendFile)\s*\(/g;
const NAME_IN_TEXT = /((?:[\w<>.-]+\/)*[\w.-]+\.md)/g;
const DECLARATION = /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g;
const USAGE_LINE = /^(?:[\*/]{0,2}\s*)?(?:[-*]\s*)?[Uu]sage\b/;
const CONSOLE_USAGE = /console\.(?:error|log|warn)\(\s*["'`]?\s*[Uu]sage/;

/** The first argument of a call, honouring nested parentheses. */
function firstArgument(source, openIndex) {
  let depth = 1;
  let quote = null;
  for (let i = openIndex + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "," && depth === 1) return source.slice(openIndex + 1, i);
    if (depth === 0) return source.slice(openIndex + 1, i);
  }
  return "";
}

function literalsIn(text) {
  return [...text.matchAll(/["'`]([^"'`\n]*)["'`]/g)].map((match) => match[1]);
}

/**
 * Ledger names a script can write:
 *  (A) a name inside a write target, resolving one-hop identifier bindings; or
 *  (B) for a target that is wholly caller-supplied (an `--annotate`-style
 *      rewrite), the ledger names the script's own usage line documents.
 */
function writtenLedgers(source) {
  const names = new Set();
  const bindings = new Map();
  for (const match of source.matchAll(DECLARATION)) bindings.set(match[1], match[2]);
  let dynamic = false;
  for (const match of source.matchAll(WRITE_CALL)) {
    const arg = firstArgument(source, match.index + match[0].length - 1);
    let values = literalsIn(arg);
    if (!values.length) values = resolvedLiterals(arg, bindings);
    const named = values.flatMap((value) => [...value.matchAll(NAME_IN_TEXT)].map((m) => m[1]));
    if (named.length) named.forEach((name) => names.add(name));
    else dynamic = true;
  }
  if (dynamic) {
    // the target is caller-supplied: the script's own usage line names what it rewrites
    for (const line of source.split("\n")) {
      if (!USAGE_LINE.test(line.trim()) && !CONSOLE_USAGE.test(line)) continue;
      for (const match of line.matchAll(NAME_IN_TEXT)) names.add(match[1]);
    }
  }
  names.delete(undefined);
  return names;
}

function resolvedLiterals(expression, bindings, depth = 0) {
  if (depth > 3) return [];
  const out = [];
  for (const match of expression.matchAll(/[A-Za-z_$][\w$]*/g)) {
    const bound = bindings.get(match[0]);
    if (!bound) continue;
    const literals = literalsIn(bound);
    out.push(...literals, ...resolvedLiterals(bound, bindings, depth + 1));
  }
  return out;
}

/**
 * @param patterns  ledger pattern → map row, from the ownership map
 * @param blocked   names on the map's `no-script-writer` directive
 */
function writePathScan({ patterns, blocked, sources, label }) {
  const failures = [];
  const writers = new Set();
  const declareWriters = (pattern, row) => {
    const set = new Set();
    if (row.annotator && row.annotator !== NONE) set.add(row.annotator);
    for (const entry of ownerList(row.owner)) set.add(entry.split(":")[0].trim());
    return { pattern, writers: set };
  };
  const declared = new Map([...patterns].map(([pattern, row]) => [pattern, declareWriters(pattern, row)]));
  const matchLedger = (target) => {
    for (const entry of declared.values()) {
      const hit = isUnitPattern(entry.pattern)
        ? basename(entry.pattern) === basename(target)
        : target === entry.pattern || target.endsWith(entry.pattern);
      if (hit) return entry;
    }
    return null;
  };
  for (const [rel, source] of Object.entries(sources)) {
    for (const target of writtenLedgers(source)) {
      if (blocked.has(basename(target))) {
        failures.push(`${label}: ${rel} writes "${target}", a durable record the map forbids any script to write`);
        continue;
      }
      const entry = matchLedger(target);
      if (!entry) {
        failures.push(`${label}: ${rel} writes "${target}", a durable ledger absent from the ownership map`);
        continue;
      }
      if (!entry.writers.has(rel)) {
        failures.push(`${label}: ${rel} writes "${target}" but the map declares no owner or annotator for it`);
        continue;
      }
      writers.add(`${rel} → ${basename(target)}`);
    }
  }
  return { failures, writers: [...writers].sort() };
}

// --- the tree under test ------------------------------------------------------

function knownSkills(base = root) {
  const names = new Set(["human-owner"]);
  const dir = path.join(base, "skills");
  if (fs.existsSync(dir)) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "SKILL.md"))) names.add(entry.name);
    }
  }
  return names;
}

/** Every non-test `.mjs` under `scripts/` and `packages/<name>/scripts/`. */
function scannedScripts(base) {
  const dirs = [path.join(base, "scripts")];
  const packages = path.join(base, "packages");
  if (fs.existsSync(packages)) {
    for (const entry of fs.readdirSync(packages, { withFileTypes: true })) {
      const scripts = path.join(packages, entry.name, "scripts");
      if (entry.isDirectory() && fs.existsSync(scripts)) dirs.push(scripts);
    }
  }
  const found = {};
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir).sort()) {
      if (!entry.endsWith(".mjs") || entry.endsWith(".test.mjs")) continue;
      const rel = path.relative(base, path.join(dir, entry)).split(path.sep).join("/");
      found[rel] = fs.readFileSync(path.join(dir, entry), "utf8");
    }
  }
  return found;
}

function state() {
  const mapText = read(MAP_REL);
  const templates = { [FEATURE_TEMPLATE_REL]: read(FEATURE_TEMPLATE_REL), [FIX_TEMPLATE_REL]: read(FIX_TEMPLATE_REL) };
  const sources = scannedScripts(root);
  const declared = declaredOwnerScan({
    mapText,
    templates,
    knownSkills: knownSkills(),
    annotatorSources: sources,
    label: "repository",
  });
  const written = writePathScan({
    patterns: declared.patterns,
    blocked: new Set(declared.directives?.["no-script-writer"] || []),
    sources,
    label: "repository",
  });
  return { mapText, templates, sources, declared, written };
}

/** Replace one cell fragment; throws when the line moved, so a fixture never no-ops. */
function patchFragment(text, from, to) {
  if (!text.includes(from)) throw new Error(`fixture patch target absent: ${from}`);
  return text.replace(from, to);
}

function rowOf(text, needle) {
  const line = text.split("\n").find((l) => l.includes(needle));
  if (!line) throw new Error(`fixture patch target absent: ${needle}`);
  return line;
}

// --- scan 1, proven red -------------------------------------------------------

test("scan 1 fails a map row with no declared owner", () => {
  const { mapText, templates, sources } = state();
  const line = rowOf(mapText, "known-issues | docs/features/");
  const cells = splitRow(line);
  const blanked = cells.map((cell, idx) => (idx === 2 ? "" : cell)).join(" | ");
  const scan = declaredOwnerScan({
    mapText: mapText.replace(line, blanked),
    templates,
    knownSkills: knownSkills(),
    annotatorSources: sources,
    label: "fixture",
  });
  assert.ok(
    scan.failures.some((f) => /map row "known-issues": no declared owner/.test(f)),
    JSON.stringify(scan.failures),
  );
  assert.ok(
    scan.failures.every((f) => f.includes("known-issues")),
    `only the known-issues row may be at fault: ${JSON.stringify(scan.failures)}`,
  );
});

test("scan 1 fails a template ledger row with no owner (AC16's named fixture)", () => {
  const { mapText, templates, sources } = state();
  const line = rowOf(templates[FEATURE_TEMPLATE_REL], "known-issues.md | ");
  const cells = splitRow(line);
  const blanked = `${cells[0]} |  | ${cells[2]}`;
  const scan = declaredOwnerScan({
    mapText,
    templates: { ...templates, [FEATURE_TEMPLATE_REL]: templates[FEATURE_TEMPLATE_REL].replace(line, blanked) },
    knownSkills: knownSkills(),
    annotatorSources: sources,
    label: "fixture",
  });
  assert.ok(
    scan.failures.some((f) => /known-issues\.md"?: no declared owner/.test(f)),
    JSON.stringify(scan.failures),
  );
});

test("scan 1 fails a template owner reworded away from the map", () => {
  const { mapText, templates, sources } = state();
  const scan = declaredOwnerScan({
    mapText,
    templates: { ...templates, [FEATURE_TEMPLATE_REL]: patchFragment(templates[FEATURE_TEMPLATE_REL], "execute-phase:phase-entries", "execute-phase:whatever") },
    knownSkills: knownSkills(),
    annotatorSources: sources,
    label: "fixture",
  });
  assert.ok(scan.failures.some((f) => /disagrees with the map/.test(f)), JSON.stringify(scan.failures));
});

test("scan 1 fails a dropped and an invented template row", () => {
  const { mapText, templates, sources } = state();
  const features = templates[FEATURE_TEMPLATE_REL];
  const decisionsLine = rowOf(features, "decisions.md | plan-feature-scaffold:create");
  const run = (templateText) =>
    declaredOwnerScan({
      mapText,
      templates: { ...templates, [FEATURE_TEMPLATE_REL]: templateText },
      knownSkills: knownSkills(),
      annotatorSources: sources,
      label: "fixture",
    });

  const dropped = run(features.replace(decisionsLine, ""));
  assert.ok(
    dropped.failures.some((f) => /missing the "docs\/features\/<NN>-<slug>\/decisions\.md" row/.test(f)),
    JSON.stringify(dropped.failures),
  );

  const invented = run(features.replace(decisionsLine, `${decisionsLine}\ndocs/features/<NN>-<slug>/ghosts.md | execute-phase:ghost-writes | none`));
  assert.ok(invented.failures.some((f) => /ghosts\.md.*declares no such ledger/.test(f)), JSON.stringify(invented.failures));
});

test("scan 1 fails an owner that is not a shipped skill", () => {
  const { mapText, templates, sources } = state();
  const scan = declaredOwnerScan({
    mapText,
    templates: { ...templates, [FIX_TEMPLATE_REL]: patchFragment(templates[FIX_TEMPLATE_REL], "execute-phase:phase-entries", "not-a-skill:phase-entries") },
    knownSkills: knownSkills(),
    annotatorSources: sources,
    label: "fixture",
  });
  assert.ok(scan.failures.some((f) => /not-a-skill.*neither a shipped skill nor human-owner/.test(f)), JSON.stringify(scan.failures));
});

test("scan 1 fails two owners on one column set", () => {
  const { mapText, templates, sources } = state();
  const scan = declaredOwnerScan({
    mapText,
    templates: {
      ...templates,
      [FEATURE_TEMPLATE_REL]: patchFragment(
        templates[FEATURE_TEMPLATE_REL],
        "execute-phase:phase-entries",
        "execute-phase:phase-entries + audit-docs:phase-entries",
      ),
    },
    knownSkills: knownSkills(),
    annotatorSources: sources,
    label: "fixture",
  });
  assert.ok(scan.failures.some((f) => /column set "phase-entries" has two declared writers/.test(f)), JSON.stringify(scan.failures));
});

test("scan 1 fails an annotator token the annotator cannot produce, in both directions", () => {
  const { mapText, templates, sources } = state();
  const skills = knownSkills();
  const bogus = declaredOwnerScan({
    mapText: patchFragment(mapText, "· fold <sha> + · ticked <sha>", "· squashed <sha> + · ticked <sha>"),
    templates,
    knownSkills: skills,
    annotatorSources: sources,
    label: "fixture",
  });
  assert.ok(bogus.failures.some((f) => /cannot produce the declared token "squashed"/.test(f)), JSON.stringify(bogus.failures));
  assert.ok(bogus.failures.some((f) => /emits "· fold" but the entry does not name it/.test(f)), JSON.stringify(bogus.failures));

  // the annotator grows a marker nobody declared: the entry is now incomplete
  const grown = {
    ...sources,
    [PROVENANCE_REL]: patchFragment(sources[PROVENANCE_REL], 'chosen.score === 1 ? "ticked"', 'chosen.score === 1 ? "squashed"'),
  };
  const hidden = declaredOwnerScan({ mapText, templates, knownSkills: skills, annotatorSources: grown, label: "fixture" });
  assert.ok(hidden.failures.some((f) => /emits "· squashed" but the entry does not name it/.test(f)), JSON.stringify(hidden.failures));
});

test("both scans fail closed on a missing or malformed ownership block", () => {
  const { mapText, templates, sources } = state();
  const skills = knownSkills();
  const run = (over = {}) =>
    declaredOwnerScan({
      mapText: over.mapText ?? mapText,
      templates: over.templates ?? templates,
      knownSkills: skills,
      annotatorSources: sources,
      label: "fixture",
    });

  const renamed = run({ mapText: mapText.replace(MARKER, "ledger-ownership@2") });
  assert.deepEqual(renamed.failures, ["fixture: ownership map: no ledger-ownership@1 block"], JSON.stringify(renamed.failures));

  const badHeader = run({ mapText: patchFragment(mapText, "annotator-token | validator", "token | validator") });
  assert.ok(badHeader.failures.some((f) => /header must be exactly/.test(f)), JSON.stringify(badHeader.failures));

  const noTemplates = run({ templates: { ...templates, [FEATURE_TEMPLATE_REL]: "# projection\n\nnothing machine readable here\n" } });
  assert.ok(noTemplates.failures.some((f) => /no ledger-ownership@1 block/.test(f)), JSON.stringify(noTemplates.failures));

  const shortRow = run({ mapText: patchFragment(mapText, "| none | none |", "| none |") });
  assert.ok(shortRow.failures.some((f) => /row needs 6 cells/.test(f)), JSON.stringify(shortRow.failures));

  // with no map rows the write scan can never bless a writer
  const empty = writePathScan({ patterns: new Map(), blocked: new Set(), sources: { "scripts/x.mjs": UNDECLARED_WRITER }, label: "fixture" });
  assert.ok(empty.failures.some((f) => /absent from the ownership map/.test(f)), JSON.stringify(empty.failures));
});

// --- scan 2, proven red ------------------------------------------------------

const UNDECLARED_WRITER = [
  "#!/usr/bin/env node",
  'import { writeFileSync } from "node:fs";',
  'const ledger = "docs/features/99-fake/progress.md";',
  'writeFileSync(ledger, "## P1 — 2026-09-01\\n");',
  "",
].join("\n");

const UNDECLARED_CLI_REWRITER = [
  "#!/usr/bin/env node",
  'import { readFileSync, writeFileSync } from "node:fs";',
  "const args = process.argv.slice(2);",
  'const ledger = args.find((a) => !a.startsWith("--"));',
  'if (!ledger) console.error("usage: node scripts/reopen-known-issues.mjs <known-issues.md> [--write]");',
  'writeFileSync(ledger, readFileSync(ledger, "utf8").replace(/no/, "yes"));',
  "",
].join("\n");

const GENERATED_ARTIFACT_WRITER = [
  "#!/usr/bin/env node",
  'import { writeFileSync } from "node:fs";',
  'const out = "packages/agentic-workflow-schema/pre-execution.schema.json";',
  'writeFileSync(out, "{}");',
  'writeFileSync("packages/pi-agentic-workflow/dist/bundle.js", "// generated bundle");',
  "",
].join("\n");

function scan2(source, over = {}) {
  const { declared } = state();
  return writePathScan({
    patterns: over.patterns ?? declared.patterns,
    blocked: over.blocked ?? new Set(declared.directives?.["no-script-writer"] || []),
    sources: { "scripts/fixture-writer.mjs": source },
    label: "fixture",
  });
}

test("scan 2 fails a script writing a declared ledger it is not declared for", () => {
  const scan = scan2(UNDECLARED_WRITER);
  assert.ok(scan.failures.some((f) => /writes "docs\/features\/99-fake\/progress\.md" but the map declares no owner/.test(f)), JSON.stringify(scan.failures));
});

test("scan 2 fails a CLI rewrite tool the map never names", () => {
  const scan = scan2(UNDECLARED_CLI_REWRITER);
  assert.ok(scan.failures.some((f) => /fixture-writer\.mjs writes "known-issues\.md"/.test(f)), JSON.stringify(scan.failures));
});

test("scan 2 fails when the map loses the row for a ledger a script writes", () => {
  const { mapText, templates, sources } = state();
  const withoutProgress = mapText
    .split("\n")
    .filter((line) => !line.startsWith("progress | docs/"))
    .join("\n");
  const scan1 = declaredOwnerScan({ mapText: withoutProgress, templates, knownSkills: knownSkills(), annotatorSources: sources, label: "fixture" });
  const scan = writePathScan({
    patterns: scan1.patterns,
    blocked: new Set(scan1.directives?.["no-script-writer"] || []),
    sources: { "scripts/fixture-writer.mjs": UNDECLARED_WRITER },
    label: "fixture",
  });
  assert.ok(scan.failures.some((f) => /"docs\/features\/99-fake\/progress\.md", a durable ledger absent from the ownership map/.test(f)), JSON.stringify(scan.failures));
});

test("scan 2 blocks a durable record the map forbids any script to write", () => {
  const scan = scan2(UNDECLARED_WRITER.replace("progress.md", "planning-obligations.md"));
  assert.ok(scan.failures.some((f) => /planning-obligations\.md.*forbids any script/.test(f)), JSON.stringify(scan.failures));
});

test("scan 2 leaves a generated-artifact writer alone", () => {
  const scan = scan2(GENERATED_ARTIFACT_WRITER);
  assert.deepEqual(scan.failures, [], JSON.stringify(scan.failures));
});

// --- the repository itself ---------------------------------------------------

test("the map and both templates declare one owner and the annotator per ledger", () => {
  const { declared } = state();
  assert.deepEqual(declared.failures, [], declared.failures.join(" | "));
  assert.deepEqual(
    declared.rows.map((row) => row["truth-class"]),
    TRUTH_CLASSES,
    "one row per AC16 truth class, in AC16's order",
  );
});

test("the fold provenance token is pinned to the annotator line that emits it", () => {
  const { declared } = state();
  const review = declared.rows.find((row) => row["truth-class"] === "review-findings");
  assert.equal(review.annotator, PROVENANCE_REL);
  assert.deepEqual(tokenList(review["annotator-token"]).map(tokenWord).sort(), ["REOPENED", "fold", "ticked"]);
  const source = read(PROVENANCE_REL);
  assert.match(source, /entry\.token = chosen\.score === 1 \? "ticked" : "fold";/, "the score ladder names the two marker words");
  assert.match(source, /cells\[6\] = ` \$\{route\} · \$\{entry\.token\} \$\{entry\.fold\}\$\{tail\} `;/, "the --annotate branch appends the marker into the route cell");
  assert.match(source, /· REOPENED — provenance unproven/, "the reopen note re-opens an unproven row without naming a phase (F58)");
  assert.match(review.validator, /ledger-provenance/, "the row names the annotator's own validator");
  for (const row of declared.rows.filter((r) => r.annotator === NONE)) {
    assert.equal(row["annotator-token"], NONE, `${row["truth-class"]}: no annotator, so no token`);
  }
});

test("scan 2 passes the real tree and still recognises its declared annotator", () => {
  const { written } = state();
  assert.deepEqual(written.failures, [], written.failures.join(" | "));
  assert.deepEqual(
    written.writers,
    [`${PROVENANCE_REL} → review-findings.md`],
    "exactly one non-test script may rewrite a durable ledger today, as the map's annotator",
  );
});

// --- the same suite run against an injected tree must go non-zero ------------

/** A throwaway tree: the real ownership surface plus one injected defect. */
function makeTree(t, { extraScripts = {}, templates = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-ownership-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const real = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");
  const write = (rel, text) => {
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  };
  write(MAP_REL, real(MAP_REL));
  write(FEATURE_TEMPLATE_REL, templates[FEATURE_TEMPLATE_REL] ?? real(FEATURE_TEMPLATE_REL));
  write(FIX_TEMPLATE_REL, templates[FIX_TEMPLATE_REL] ?? real(FIX_TEMPLATE_REL));
  for (const skill of knownSkills(repoRoot)) {
    if (skill === "human-owner") continue;
    write(`skills/${skill}/SKILL.md`, `---\nname: ${skill}\n---\n`);
  }
  for (const rel of Object.keys(scannedScripts(repoRoot))) write(rel, real(rel));
  for (const [rel, text] of Object.entries(extraScripts)) write(rel, text);
  return dir;
}

function runSuiteAgainst(dir) {
  // NODE_TEST_CONTEXT makes a nested `node --test` report to its parent and exit 0,
  // which would silently disarm the proof, so the child runs as a top-level suite.
  const env = { ...process.env, LEDGER_OWNERSHIP_REPO: dir };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return spawnSync(process.execPath, testRunArgs(thisFile), { encoding: "utf8", env });
}

test("node --test exits non-zero on the undeclared-writer fixture tree", (t) => {
  if (isChildRun) return t.skip("the child run is itself the injected tree");
  const dir = makeTree(t, { extraScripts: { "scripts/undeclared-writer.mjs": UNDECLARED_WRITER } });
  const run = runSuiteAgainst(dir);
  assert.notEqual(run.status, 0, "the undeclared-writer fixture must fail the suite");
  assert.match(run.stdout + run.stderr, /undeclared-writer\.mjs writes "docs\/features\/99-fake\/progress\.md"/);
});

test("node --test exits non-zero when a template row loses its owner", (t) => {
  if (isChildRun) return t.skip("the child run is itself the injected tree");
  const features = fs.readFileSync(path.join(repoRoot, FEATURE_TEMPLATE_REL), "utf8");
  const line = rowOf(features, "known-issues.md | ");
  const cells = splitRow(line);
  const dir = makeTree(t, {
    templates: { [FEATURE_TEMPLATE_REL]: features.replace(line, `${cells[0]} |  | ${cells[2]}`) },
  });
  const run = runSuiteAgainst(dir);
  assert.notEqual(run.status, 0, "an owner-less template row must fail the suite");
  assert.match(run.stdout + run.stderr, /no declared owner/);
});

console.log(
  "PASS ledger ownership: map and both template projections agree in each direction, the fold token is bound to the line that emits it, and no undeclared writer touches a durable ledger",
);
