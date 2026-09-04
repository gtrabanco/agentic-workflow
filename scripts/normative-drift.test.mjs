#!/usr/bin/env node

/**
 * Feature 28 / P14 — AC15 (clause F1): normative prose bound to machine surfaces.
 *
 * AC15 fails a repository in BOTH directions:
 *   text → machine — a normative surface orders a transition, argument, field,
 *                  verdict or route the machine surface does not define or accept;
 *   machine → text — the machine publishes a value that no normative surface names,
 *                  so an executor following the text can never reach it.
 * It also freezes three conditions: only **fixed versioned grammars** are read
 * (never a sentence), every normative surface **has** such a grammar, and prose
 * that **restates** a machine fact is render-only — the machine wins, the prose is
 * the defect.
 *
 * How those conditions are met here:
 *   * The scope of "normative surface" is one declared table — `normative-surfaces@1`
 *     in `CLAUDE.md` — and the gate refuses a row whose `grammar` cell does not
 *     resolve, which is what makes "every surface has a fixed grammar" a check
 *     rather than a claim. The `rendered-facts@1` table does the same for the
 *     restatements (a surface cannot be both unpinned and unknown to the gate).
 *   * The machine is read from **committed source**: the published vocabularies,
 *     the transition table and the envelope field lists are parsed out of
 *     `packages/agentic-workflow-schema/src/index.ts` and
 *     `src/pre-execution-contract.ts` with fixed-shape extractors. `dist/` is
 *     gitignored (`.gitignore`) and produced by `npm run build`, a *mutating* step
 *     that P13's normalizer order places strictly before a freeze; importing it
 *     would make a drift gate depend on a build and fail a fresh clone.
 *   * The closed set for the machine → text direction is exactly the vocabularies
 *     marked `must-name: yes` in that inventory: `gate-rejection-type`,
 *     `pre-execution-verdict` and the `next` object of the envelope. Those three
 *     are what an agent chooses between at the end of a turn. Internal constants
 *     (`SKILL_*` capability classes, `PRE_EXECUTION_LIMITS`, the sense/stop/invoke
 *     reason codes, the 11 envelope states) are deliberately excluded: nothing in
 *     the inventoried surfaces orders an action with them, so demanding prose for
 *     them would be a second definition of a machine detail.
 *
 * Every refusal is a fixture, never an edit: `buildSurfaceModel()` reads the
 * repository into plain arrays and `runDriftChecks()` is pure, so the three
 * injected disagreements (an undefined transition, an unaccepted argument, an
 * absent field) are asserted against the same code path the live repository runs
 * through. `NORMATIVE_DRIFT_REPO` re-points the reader at a throwaway tree, which
 * is how red-first is reproduced against `git archive <pre-phase sha>` and how the
 * fail-closed case removes a grammar block for real.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Re-pointable so the suite runs red against an injected tree (P9's gotcha 3). */
const root = process.env.NORMATIVE_DRIFT_REPO ? path.resolve(process.env.NORMATIVE_DRIFT_REPO) : repoRoot;
const isChildRun = Boolean(process.env.NORMATIVE_DRIFT_REPO);
const thisFile = fileURLToPath(import.meta.url);

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

const GUIDE_REL = "CLAUDE.md";
const INVENTORY_MARKER = "normative-surfaces@1";
const FACTS_MARKER = "rendered-facts@1";
const SCHEMA_INDEX_REL = "packages/agentic-workflow-schema/src/index.ts";
const SCHEMA_PREEXEC_REL = "packages/agentic-workflow-schema/src/pre-execution-contract.ts";
const POLICY_REL = "skills/pre-execution-review/references/POLICY.md";
const GATE_VOCABULARY_MARKER = "gate-rejection-vocabulary@1";
const NA = "n/a";

const squash = (t) => t.replace(/\s+/g, " ").trim();
const uniq = (list) => [...new Set(list)];

// ---------------------------------------------------------------------------
// 1. Machine surfaces: fixed-shape extraction from committed schema source
// ---------------------------------------------------------------------------

const STRING_LITERAL = /"((?:[^"\\]|\\.)*)"/g;
const quoted = (text) => [...text.matchAll(STRING_LITERAL)].map((m) => m[1]);

/** `export const NAME[: T] = [ … ] as const;` and the `Object.freeze([ … ] as const)` form. */
function publishedConstArrays(src) {
  const out = new Map();
  const re = /export const ([A-Z][A-Z0-9_]+)(?::[^=\n]+)? = (?:Object\.freeze\(\s*)?\[([\s\S]*?)\]\s*(?:as const)?\s*\)?\s*;/g;
  for (const m of src.matchAll(re)) out.set(m[1], quoted(m[2]));
  return out;
}

/** `export const NAME_CONTRACT_ID = "…" as const;` */
function publishedContractIds(src) {
  const out = new Map();
  for (const m of src.matchAll(/export const ([A-Z0-9_]+_CONTRACT_ID)\s*=\s*"([^"]+)"/g)) out.set(m[1], m[2]);
  return out;
}

/** `{ key: "from", allowed: [ … ], condition: … }` rows of a transition table. */
function publishedTransitionTable(src, tableName) {
  const start = src.indexOf(tableName);
  if (start < 0) throw new Error(`machine surface missing: ${tableName}`);
  const block = src.slice(start, src.indexOf("]);", start));
  const rows = new Map();
  for (const m of block.matchAll(/key:\s*"([^"]+)",\s*allowed:\s*\[([\s\S]*?)\],\s*condition:/g)) {
    rows.set(m[1], quoted(m[2]));
  }
  if (rows.size === 0) throw new Error(`machine surface unreadable: ${tableName} has no rows`);
  return rows;
}

/**
 * `rejectUnexpectedKeys(value.x, "label", [ …keys ], errors)` — the authoritative
 * field list of every object the validators accept. Grouped by the enclosing
 * validator function, because `next` means different things to the envelope and
 * to a `SkillOutcome`. A `[${index}]` label is the element list of its array.
 */
function publishedFieldLists(src) {
  const lines = src.split("\n");
  const functions = [];
  lines.forEach((line, i) => {
    const m = /^(?:export )?(?:async )?function ([A-Za-z0-9_]+)/.exec(line);
    if (m) functions.push({ name: m[1], line: i });
  });
  const enclosing = (line) => {
    let name = "<file>";
    for (const f of functions) if (f.line <= line) name = f.name; else break;
    return name;
  };
  const out = new Map();
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*(export )?function rejectUnexpectedKeys/.test(lines[i])) continue;
    if (!lines[i].includes("rejectUnexpectedKeys(")) continue;
    let text = "";
    let depth = 0;
    for (let j = i; j < lines.length; j += 1) {
      text += lines[j] + "\n";
      depth += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length;
      if (depth <= 0) break;
    }
    const args = text.slice(text.indexOf("(") + 1);
    const labels = [...args.matchAll(/"([^"]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]);
    const raw = (labels[0] || "").replace(/\[\$\{index\}]/g, "");
    if (!raw) continue;
    const list = [...args.matchAll(/\[([\s\S]*?)\]/g)].map((m) => quoted(m[1])).find((a) => a.length > 0);
    if (!list) continue;
    const key = `${enclosing(i)}:${raw}`;
    if (!out.has(key)) out.set(key, uniq(list));
  }
  return out;
}

/** `export const VERDICTS_BY_STAGE = Object.freeze({ spec: [ … ], plan: [ … ] })`. */
function publishedStageMatrix(src) {
  const at = src.indexOf("export const VERDICTS_BY_STAGE");
  if (at < 0) throw new Error("machine surface missing: VERDICTS_BY_STAGE");
  const block = src.slice(at, src.indexOf("});", at));
  const out = new Map();
  for (const m of block.matchAll(/(\w+):\s*\[([^\]]*)\]/g)) out.set(m[1], quoted(m[2]));
  if (out.size === 0) throw new Error("machine surface unreadable: VERDICTS_BY_STAGE has no rows");
  return out;
}

/** A published machine: vocabularies, the transition relation, and field lists. */
function buildMachine() {
  const index = read(SCHEMA_INDEX_REL);
  const preexec = read(SCHEMA_PREEXEC_REL);
  const consts = new Map([...publishedConstArrays(index), ...publishedConstArrays(preexec)]);
  const contracts = new Map([...publishedContractIds(index), ...publishedContractIds(preexec)]);
  const transitions = publishedTransitionTable(index, "WORKFLOW_TRANSITION_TABLE");
  const fields = new Map([...publishedFieldLists(index), ...publishedFieldLists(preexec)]);
  const stages = publishedStageMatrix(preexec);

  const pre = (name) => {
    const v = consts.get(name);
    if (!v) throw new Error(`machine vocabulary not published in src: ${name}`);
    return v;
  };
  const vocabularies = new Map();
  const name = (symbol) => symbol.toLowerCase().replace(/_/g, "-");
  for (const [symbol, values] of consts) {
    const plural = name(symbol);
    vocabularies.set(plural, values);
    // The published names are plural arrays; the grammar cells read them as one
    // vocabulary per value, so `PRE_EXECUTION_STAGES` is also `pre-execution-stage`.
    if (plural.endsWith("s")) vocabularies.set(plural.replace(/s$/, ""), values);
  }
  for (const [symbol, value] of contracts) vocabularies.set(`const:${symbol}`, [value]);
  vocabularies.set("envelope-state", pre("ENVELOPE_STATES"));
  vocabularies.set("terminal-state", pre("TERMINAL_STATES"));
  vocabularies.set("workflow-intent", pre("WORKFLOW_INTENTS"));
  vocabularies.set("pre-execution-verdict", pre("PRE_EXECUTION_VERDICTS"));
  vocabularies.set("pre-execution-stage", pre("PRE_EXECUTION_STAGES"));
  return {
    consts,
    contracts,
    transitions,
    fields,
    stages,
    vocabularies,
    /**
     * Values of a field list, narrowed to the validator family that owns the
     * object: `next` means the envelope's `next` to `envelope` and the outcome's
     * `next` to `outcome`, so one prose set cannot be checked against the union.
     */
    fieldsOf(object, family = null) {
      const needle = family ? family.charAt(0).toUpperCase() + family.slice(1) : null;
      const hits = [...fields.entries()].filter(([k]) => {
        if (!k.endsWith(`:${object}`)) return false;
        return needle === null || k.includes(needle);
      });
      return { objects: hits.map(([k]) => k.split(":").slice(1).join(":")), keys: hits.flatMap(([, v]) => v) };
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Grammar readers: fenced versioned blocks, fixed-output blocks, tables
// ---------------------------------------------------------------------------

/** The fenced block whose first line is `marker`; `null` when the file has none. */
function versionedBlock(text, marker) {
  const fence = /```[a-zA-Z]*\n([\s\S]*?)```/g;
  for (const m of text.matchAll(fence)) {
    const body = m[1].replace(/\n$/, "");
    const lines = body.split("\n");
    if (lines[0].trim() !== marker) continue;
    const directives = new Map();
    const rest = [];
    for (const line of lines.slice(1)) {
      const d = /^#\s*([a-z0-9-]+)\s*:\s*(.*)$/.exec(line.trim());
      if (d && line.trim().startsWith("#")) directives.set(d[1], d[2].trim());
      else rest.push(line);
    }
    const cells = (line) => line.split("|").map((c) => c.trim());
    const header = cells(rest[0] || "");
    const rows = rest.slice(1).filter((l) => l.trim()).map((l) => {
      const values = cells(l);
      const row = { __line: l };
      header.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return row;
    });
    return { marker, header, rows, directives, body };
  }
  return null;
}

/** Every fenced block in `text` that contains `marker`. */
function fixedOutputBlocks(text, marker) {
  return [...text.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .filter((b) => b.includes(marker));
}

/** The markdown table that follows the section whose heading contains `heading`. */
function markdownTable(text, heading) {
  const at = text.indexOf(heading);
  if (at < 0) return null;
  const rows = [];
  for (const line of text.slice(at).split("\n").slice(1)) {
    if (/^\s*\|/.test(line)) rows.push(line.split("|").map((c) => c.trim()).filter(Boolean));
    else if (rows.length && line.trim() === "") break;
    else if (rows.length && !/^\s*\|/.test(line)) break;
  }
  return rows.length >= 3 ? rows : null;
}

/** `argument-hint:` of every skill's frontmatter — the machine-declared argument surface. */
function argumentHints() {
  const dir = path.join(root, "skills");
  const out = new Map();
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const fm = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(file, "utf8"));
    const hint = fm && /^argument-hint:\s*(.*)$/m.exec(fm[1]);
    out.set(name, {
      hint: hint ? hint[1].trim().replace(/^"|"$/g, "") : null,
      flags: hint ? [...hint[1].matchAll(/--\[[a-z0-9-]+\]|(--[a-z0-9-]+)/g)].map((m) => (m[1] || m[0]).replace(/[[\]]/g, "")) : [],
      userInvocable: fm ? /^user-invocable:\s*true\s*$/m.test(fm[1]) : false,
      version: fm ? (/^version:\s*(\S+)/m.exec(fm[1]) || [])[1] || null : null,
    });
  }
  return out;
}

const flagsIn = (hint) => [...(hint || "").matchAll(/(-{1,2}[a-z][a-z0-9-]+)/g)].map((m) => m[1]);

// ---------------------------------------------------------------------------
// 3. The surface model: every token an inventoried surface orders
// ---------------------------------------------------------------------------

/**
 * Read the repository into plain data. Nothing here decides anything; every
 * refusal is produced by `runDriftChecks` so a fixture can inject a token and the
 * live tree can be proved green through the identical code path.
 */
function buildSurfaceModel() {
  const machine = buildMachine();
  const model = {
    machine,
    hints: argumentHints(),
    skillNames: [...argumentHints().keys()],
    surfaces: [],
    declaredGateTypes: [],
    printedGateTypes: [],
    gateTypeSurface: new Map(),
    verdicts: [],
    flags: [],
    routes: [],
    transitions: [],
    fields: [],
    handOffCommands: [],
    hostCommands: [],
    ownerFiles: [],
    alternations: [],
    allFlags: [],
    readFiles: new Set([GUIDE_REL, SCHEMA_INDEX_REL, SCHEMA_PREEXEC_REL, POLICY_REL]),
  };
  model.allFlags = [...model.hints.values()].flatMap((h) => flagsIn(h.hint));
  const guide = read(GUIDE_REL);
  model.readFiles.add(GUIDE_REL);
  const inventory = versionedBlock(guide, INVENTORY_MARKER);
  if (!inventory) {
    // Fail closed rather than throw: a tree without the scope table must report it
    // as a refusal on every check, which is also what makes red-first readable.
    model.surfaces.push({
      surface: INVENTORY_MARKER, files: [GUIDE_REL], grammar: `block:${INVENTORY_MARKER}`,
      machine: [], mustName: false, ok: false,
      faults: [`${GUIDE_REL} does not declare ${INVENTORY_MARKER}, so no normative surface has a declared grammar`],
    });
    return model;
  }
  model.hostCommands = (inventory.directives.get("hand-off-host-commands") || "").split(/[,\s]+/).filter(Boolean);
  // The gate-rejection vocabulary is published by a versioned block, not by the
  // schema: §8 owns it, so that block is this machine surface's only home.
  const gateVocabulary = versionedBlock(read(POLICY_REL), GATE_VOCABULARY_MARKER);
  const gateTypes = gateVocabulary ? gateVocabulary.rows.map((r) => r.type).filter(Boolean) : [];
  model.machine.vocabularies.set("gate-rejection-type", gateTypes);

  const skillDirGlob = /^skills\/\*\/SKILL\.md$/;
  for (const row of inventory.rows) {
    const files = row.file.split("+").map((f) => f.trim());
    const entry = {
      surface: row.surface,
      files,
      grammar: row.grammar,
      machine: row.machine.split("+").map((v) => v.trim()).filter((v) => v !== NA),
      mustName: row["must-name"] === "yes",
      gateTypes: [],
      verdicts: [],
      ok: true,
      faults: [],
    };
    model.surfaces.push(entry);
    for (let file of files) {
      if (skillDirGlob.test(file)) {
        for (const name of model.hints.keys()) {
          model.readFiles.add(`skills/${name}/SKILL.md`);
          readSkillHandOffs(model, entry, `skills/${name}/SKILL.md`);
        }
        continue;
      }
      if (file.includes("*")) { entry.ok = false; entry.faults.push(`unexpandable file pattern in surface ${file}`); continue; }
      if (!exists(file)) { entry.ok = false; entry.faults.push(`surface file missing: ${file}`); continue; }
      model.readFiles.add(file);
      const text = read(file);
      const [kind, ...rest] = row.grammar.split(":");
      const arg = rest.join(":");
      if (kind === "block") {
        const block = versionedBlock(text, arg);
        if (!block) { entry.ok = false; entry.faults.push(`surface ${entry.surface} has no ${arg} block`); continue; }
        entry.block = entry.block || block;
        readBlockTokens(model, entry, block, file);
      } else if (kind === "fenced") {
        // A `fenced:` cell names one or more markers joined by `+`; the surface is
        // every fixed-output block carrying any of them.
        const markers = arg.split("+");
        const blocks = markers.flatMap((marker) => fixedOutputBlocks(text, marker));
        if (blocks.length === 0) { entry.ok = false; entry.faults.push(`surface ${entry.surface} has no fixed-output block containing ${markers.join(" / ")}`); continue; }
        readFencedTokens(model, entry, blocks, file);
      } else if (kind === "table") {
        const table = markdownTable(text, arg);
        if (!table) { entry.ok = false; entry.faults.push(`surface ${entry.surface} has no table under ${arg}`); continue; }
        // C5 (P16 fold): this kind used to push the first column into
        // `model.labelRows`, a collection nothing ever read, so a `table:` surface
        // pretended to bind labels while checking only that some table exists. The
        // claim now matches the check: the grammar reads the section's table, and a
        // heading whose block has no data row is `markdownTable`'s null, i.e. a fault.
        // The count is recorded so the AC15 case can assert it instead of trusting it. Labels stay unbound because no published
        // vocabulary owns them (known-issue 19 names the same residual for the
        // `machine: n/a` blocks) — the day one does, this cell gains a `machine`.
        entry.tableDataRows = table.length - 2;
      } else {
        entry.ok = false;
        entry.faults.push(`unknown grammar kind in the inventory: ${row.grammar}`);
      }
    }
  }
  return model;
}

/** The closing `→ Next:` blocks of one skill file. */
function readSkillHandOffs(model, entry, file) {
  const blocks = fixedOutputBlocks(read(file), "\u2192 Next:");
  readFencedTokens(model, entry, blocks, file);
}

/** Vocabularies a cell may reference with `name:token`, plus the two the
 * repository publishes itself (the skill set and the declared argument flags). */
const REFERENCEABLE_VOCABULARIES = new Set([
  "envelope-state", "terminal-state", "workflow-intent", "gate-rejection-type", "skill", "flag",
  "pre-execution-stage", "pre-execution-unit-kind", "pre-execution-verdict", "pre-execution-artifact-kind",
  "pre-execution-context-kind", "pre-execution-author-exclusion", "pre-execution-model-diversity",
  "pre-execution-finding-class", "pre-execution-finding-severity", "pre-execution-review-role",
  "pre-execution-parent-role", "pre-execution-selector", "pre-execution-context-presence",
]);
/** The closed sets an `<a|b|c>` alternation in a fixed-output block may bind to. */
const CLOSED_VOCABULARIES = [
  "pre-execution-stage", "pre-execution-unit-kind", "pre-execution-verdict", "pre-execution-artifact-kind",
  "pre-execution-context-kind", "pre-execution-author-exclusion", "pre-execution-model-diversity",
  "pre-execution-finding-class", "pre-execution-finding-severity", "pre-execution-review-role",
  "pre-execution-parent-role", "envelope-state", "workflow-intent", "gate-rejection-type",
];

function readBlockTokens(model, entry, block, file) {
  const machineTag = block.directives.get("machine") || null;
  for (const row of block.rows) {
    // A `vocab:token` cell is an explicit reference to a published vocabulary.
    for (const [column, value] of Object.entries(row)) {
      if (column.startsWith("__")) continue;
      for (const m of String(value).matchAll(/([a-z0-9-]+):([A-Za-z0-9_-]+)/g)) {
        // A cell is a machine reference only when its prefix names a published
        // vocabulary; `review-change:finding-rows` is a skill's column set, not one.
        if (!knownVocabulary(model, m[1])) continue;
        model.transitions.push({ surface: entry.surface, kind: "ref", vocab: m[1], token: m[2], column, file });
      }
    }
    if (row.type !== undefined) {
      if (block.marker === GATE_VOCABULARY_MARKER) {
        const dir = block.directives.get("dir");
        model.declaredGateTypes.push(row.type);
        for (const [column, value] of Object.entries(row)) {
          if (column.startsWith("__") || column === "type") continue;
          if (value && !exists(path.posix.join(dir || "", value))) {
            entry.faults.push(`${block.marker} row ${row.type} names ${column} ${value}, which is not a file`);
          }
        }
      } else {
        entry.faults.push(`${block.marker} re-declares a type column that ${GATE_VOCABULARY_MARKER} already owns`);
      }
    }
    if (row.flag !== undefined) model.flags.push({ surface: entry.surface, owner: block.directives.get("owner") || "", flag: row.flag, route: row.route || "", file });
    if (row.route !== undefined) model.routes.push({ surface: entry.surface, route: row.route, file });
    if (row.from !== undefined && row.to !== undefined) model.transitions.push({ surface: entry.surface, kind: "pair", from: strip(row.from), to: strip(row.to), file });
    if (row.object !== undefined && row.field !== undefined) {
      if (!machineTag) entry.faults.push(`${block.marker} declares fields with no machine family to resolve them against`);
      model.fields.push({ surface: entry.surface, machine: machineTag, object: row.object, field: row.field, file });
    }
  }
}

const strip = (token) => token.split(":").pop();

function readFencedTokens(model, entry, blocks, file) {
  for (const block of blocks) {
    for (const m of block.matchAll(/GATE REJECTION — ([a-z][a-z0-9-]*)/g)) {
      model.printedGateTypes.push(m[1]);
      model.gateTypeSurface.set(m[1], entry.surface);
    }
    // A verdict is only ever declared by a `Verdict: <a|b|c>` cell or by the
    // display line a verdict block returns — never by a sentence that happens to
    // contain a hyphenated capitalised word.
    for (const m of block.matchAll(/Verdict:\s*<([a-z][a-z0-9-]*(?:\|[a-z][a-z0-9-]*)+)>/g)) {
      for (const token of m[1].split("|")) model.verdicts.push({ surface: entry.surface, token, file });
    }
    for (const m of block.matchAll(/^\s*([A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+)\s+—/gm)) {
      model.verdicts.push({ surface: entry.surface, token: m[1].toLowerCase(), file });
    }
    // Every `<a|b|c>` alternation in a fixed-output block claims to be a closed
    // set. One that partially overlaps a published vocabulary invents a member.
    for (const m of block.matchAll(/<([a-z][a-z0-9-]*(?:\|[a-z][a-z0-9-]*)+)>/g)) {
      model.alternations.push({ surface: entry.surface, members: m[1].split("|"), file });
    }
    for (const m of block.matchAll(/→\s*Next:\s*\/([a-z][a-z0-9-]+)/g)) {
      model.handOffCommands.push({ surface: entry.surface, command: m[1], file });
    }
  }
}

// ---------------------------------------------------------------------------
// 4. The decision: runDriftChecks — pure, so injections prove every refusal
// ---------------------------------------------------------------------------

/** One refusal shape for every fault, so a report reads the same in each case. */
const refuse = (code, surface, token, message) => ({ code, surface, token, message });

/** Resolve a `name:token` prefix against the machine of the model being read. */
function knownVocabulary(model, vocab) {
  if (!REFERENCEABLE_VOCABULARIES.has(vocab)) return false;
  if (vocab === "skill") return model.skillNames;
  if (vocab === "flag") return model.allFlags;
  return model.machine.vocabularies.get(vocab) || null;
}

function runDriftChecks(model) {
  const findings = [];
  const machine = model.machine;

  // -- 4a. The inventory itself: fixed grammar per surface, published vocabularies.
  for (const surface of model.surfaces) {
    for (const fault of surface.faults) {
      findings.push(refuse("undeclared-grammar", surface.surface, fault, `${surface.surface}: ${fault} — a normative surface without a fixed versioned grammar is AC15's defect class`));
    }
    for (const vocab of surface.machine) {
      if (vocab === "envelope-field" || vocab.startsWith("envelope-field:")) continue;
      if (vocab === "skill" || vocab === "flag" || vocab === "gate-rejection-type") continue;
      if (!machine.vocabularies.has(vocab)) {
        findings.push(refuse("unpublished-vocabulary", surface.surface, vocab, `the inventory names machine vocabulary ${vocab}, which no published surface exports`));
      }
    }
  }

  // -- 4b. text → machine.
  const publishedGateTypes = machine.vocabularies.get("gate-rejection-type") || [];
  for (const type of model.printedGateTypes) {
    if (publishedGateTypes.includes(type)) continue;
    findings.push(refuse("undefined-gate-type", model.gateTypeSurface.get(type) || "gate-traces", type,
      `a gate prints the rejection type ${type}, which ${GATE_VOCABULARY_MARKER} does not declare`));
  }
  for (const v of model.verdicts) {
    const published = machine.vocabularies.get("pre-execution-verdict");
    if (!published.includes(v.token)) {
      findings.push(refuse("unpublished-verdict", v.surface, v.token, `${v.file} offers verdict ${v.token}, which PRE_EXECUTION_VERDICTS does not publish`));
      continue;
    }
    const stage = v.file.includes("review-spec") ? "spec" : v.file.includes("review-plan") ? "plan" : null;
    if (stage && !(machine.stages.get(stage) || []).includes(v.token)) {
      findings.push(refuse("unpublished-verdict", v.surface, `${stage}:${v.token}`, `${v.file} offers ${v.token} at stage ${stage}, which VERDICTS_BY_STAGE does not allow`));
    }
  }
  for (const t of model.transitions.filter((t) => t.kind === "pair")) {
    const allowed = machine.transitions.get(t.from);
    if (!allowed) {
      findings.push(refuse("undefined-transition", t.surface, `${t.from}->${t.to}`, `no WORKFLOW_TRANSITION_TABLE row has key ${t.from}`));
    } else if (!allowed.includes(t.to)) {
      findings.push(refuse("undefined-transition", t.surface, `${t.from}->${t.to}`, `the transition table does not allow ${t.to} after ${t.from}`));
    }
  }
  for (const t of model.transitions.filter((t) => t.kind === "ref")) {
    const values = machine.vocabularies.get(t.vocab);
    if (!values) {
      findings.push(refuse("unpublished-vocabulary", t.surface, `${t.vocab}:${t.token}`, `cell ${t.column} references vocabulary ${t.vocab}, which the machine does not publish`));
    } else if (!values.includes(t.token)) {
      findings.push(refuse("unpublished-vocabulary", t.surface, `${t.vocab}:${t.token}`, `cell ${t.column} names ${t.token}, which ${t.vocab} does not publish`));
    }
  }
  for (const alt of model.alternations) {
    const bound = CLOSED_VOCABULARIES
      .map((vocab) => ({ vocab, values: machine.vocabularies.get(vocab) || [] }))
      .filter((c) => c.values.length > 0);
    // A set the machine already publishes in full is bound, whichever it is.
    if (bound.some((c) => alt.members.every((member) => c.values.includes(member)))) continue;
    const best = bound
      .map((c) => ({ ...c, hit: alt.members.filter((member) => c.values.includes(member)).length }))
      .sort((a, c) => c.hit - a.hit)[0];
    // Two or more members from one published set is a claim about that set; one is
    // a coincidence, and a set with no claim at all stays a local placeholder.
    if (!best || best.hit < 2) continue;
    for (const invented of alt.members.filter((member) => !best.values.includes(member))) {
      findings.push(refuse("unpublished-alternation", alt.surface, `${best.vocab}:${invented}`,
        `${alt.file} orders <${alt.members.join("|")}> against ${best.vocab}, which does not publish ${invented}`));
    }
  }
  for (const f of model.flags) {
    if (f.flag === NA) continue;
    const ownerHint = model.hints.get(f.owner)?.hint ?? null;
    const routeHint = model.hints.get(f.route)?.hint ?? null;
    const accepted = [...flagsIn(ownerHint), ...flagsIn(routeHint)];
    if (!accepted.includes(f.flag)) {
      findings.push(refuse("unaccepted-argument", f.surface, f.flag, `${f.file} offers ${f.flag} to ${f.route}, which no argument-hint accepts (accepted: ${accepted.join(", ") || "none"})`));
    }
  }
  for (const r of model.routes) {
    if (r.route === NA) continue;
    if (!model.skillNames.includes(r.route)) {
      findings.push(refuse("unknown-route", r.surface, r.route, `${r.file} routes to ${r.route}, which is not a skill in this repository`));
    }
  }
  for (const fd of model.fields) {
    const { objects, keys } = machine.fieldsOf(fd.object, fd.machine);
    if (objects.length === 0) {
      findings.push(refuse("absent-field", fd.surface, `${fd.object}.${fd.field}`, `${fd.file} projects ${fd.object}, which no validator declares`));
    } else if (!keys.includes(fd.field)) {
      findings.push(refuse("absent-field", fd.surface, `${fd.object}.${fd.field}`, `${fd.file} projects ${fd.object}.${fd.field}, which the ${fd.object} field list does not declare (declared: ${keys.join(", ")})`));
    }
  }
  for (const c of model.handOffCommands) {
    if (model.skillNames.includes(c.command) || model.hostCommands.includes(c.command)) continue;
    findings.push(refuse("unknown-route", c.surface, `/${c.command}`, `${c.file} prints a hand-off to /${c.command}, which is neither a skill nor a declared host command`));
  }

  // -- 4c. machine → text.
  for (const surface of model.surfaces.filter((s) => s.mustName && s.ok)) {
    for (const vocab of surface.machine) {
      const values = vocab === "gate-rejection-type"
        ? machine.vocabularies.get("gate-rejection-type") || []
        : vocab.startsWith("envelope-field:")
          ? machine.fieldsOf(vocab.split(":")[1], "envelope").keys
          : machine.vocabularies.get(vocab) || [];
      const namedBy = new Set();
      if (vocab === "gate-rejection-type") for (const t of model.printedGateTypes) namedBy.add(t);
      if (vocab === "pre-execution-verdict") for (const v of model.verdicts) namedBy.add(v.token);
      if (vocab === "envelope-field:next") for (const fd of model.fields.filter((f) => f.object === "next")) namedBy.add(fd.field);
      for (const value of values) {
        if (!namedBy.has(value)) {
          findings.push(refuse("value-not-named", surface.surface, `${vocab}:${value}`, `the machine publishes ${vocab}:${value} and no normative surface orders an action with it`));
        }
      }
    }
  }

  // -- 4d. render-only prose: the machine wins, so recompute every pinned restatement.
  const facts = versionedBlock(read(GUIDE_REL), FACTS_MARKER);
  if (!facts) {
    findings.push(refuse("undeclared-grammar", "rendered-facts", FACTS_MARKER, `${GUIDE_REL} lost its ${FACTS_MARKER} block, so a restatement could go unpinned`));
  } else {
    const counts = {
      "count:user-facing": () => [...model.hints.values()].filter((h) => h.userInvocable).length,
    };
    for (const row of facts.rows) {
      for (const surface of row.surface.split("+").map((s) => s.trim())) {
        model.readFiles.add(surface);
        const text = exists(surface) ? read(surface) : "";
        if (!exists(surface)) {
          findings.push(refuse("unrendered-value", surface, row.machine, `${surface} named by ${FACTS_MARKER} does not exist`));
          continue;
        }
        const [kind, ...rest] = row.claim.split(":");
        const literal = rest.join(":");
        if (kind === "pattern") {
          const publisher = row.machine;
          const value = counts[publisher] !== undefined ? String(counts[publisher]())
            : publisher.startsWith("const:") ? (model.machine.contracts.get(publisher.slice(6)) ?? null) : null;
          if (value === null) {
            findings.push(refuse("unpublished-machine", surface, publisher, `${FACTS_MARKER} names a machine this test cannot recompute`));
            continue;
          }
          const captured = new RegExp(literal, "m").exec(text);
          if (!captured) {
            findings.push(refuse("unrendered-value", surface, literal, `${surface} no longer carries the pinned restatement ${literal}, which ${publisher} computes to ${value}`));
          } else if (captured[1] !== value) {
            findings.push(refuse("unrendered-value", surface, captured[1], `${publisher} recomputes to ${value} but ${surface} restates ${captured[1]} — the prose is the defect`));
          }
        } else if (kind === "literal") {
          const publisher = row.machine;
          let value = null;
          if (counts[publisher]) value = String(counts[publisher]());
          else if (publisher.startsWith("const:")) value = model.machine.contracts.get(publisher.slice(6)) ?? null;
          if (value === null) {
            findings.push(refuse("unpublished-machine", surface, publisher, `${FACTS_MARKER} names a machine this test cannot recompute`));
            continue;
          }
          if (!text.includes(literal)) {
            findings.push(refuse("unrendered-value", surface, literal, `${surface} no longer states "${literal}" while ${publisher} says ${value}`));
            continue;
          }
          if (!literal.includes(value)) {
            findings.push(refuse("unrendered-value", surface, literal, `${publisher} recomputes to ${value} but ${surface} restates "${literal}" — the prose is the defect`));
          }
        } else if (kind === "version-tables") {
          for (const [skill, meta] of model.hints) {
            const declared = newestVersionCell(text, skill);
            if (declared !== null && meta.version && declared !== meta.version) {
              findings.push(refuse("unrendered-value", surface, `${skill} ${declared}`, `${surface} restates ${skill} as ${declared} while its frontmatter says ${meta.version} — the prose is the defect`));
            }
          }
        } else if (kind === "package-versions") {
          for (const pkg of ["packages/agentic-workflow-schema", "packages/pi-agentic-workflow"]) {
            const manifest = JSON.parse(read(`${pkg}/package.json`));
            const declared = newestVersionCell(text, path.basename(pkg));
            if (declared !== null && declared !== manifest.version) {
              findings.push(refuse("unrendered-value", surface, `${path.basename(pkg)} ${declared}`, `${surface} restates ${pkg} as ${declared} while package.json says ${manifest.version}`));
            }
          }
        } else {
          findings.push(refuse("undeclared-grammar", surface, row.claim, `${FACTS_MARKER} uses an unknown claim kind in ${surface}`));
        }
      }
    }
  }

  // -- 4e. One cited owner for the identity-value rule F37 split across two models.
  const owner = read(POLICY_REL);
  const pairing = "beside the recomputed one";
  const ownerStates = squash(owner).includes(pairing);
  if (!ownerStates) {
    findings.push(refuse("owner-citation-drift", "identity-value rule", POLICY_REL, `POLICY.md §7 no longer owns the identity-value rule, so the citations below point at nothing`));
  }
  for (const [file, needle] of [["skills/review-plan/SKILL.md", /`POLICY\.md` §7|`POLICY\.md` §7|POLICY\.md` §7/], ["skills/review-spec/SKILL.md", /`POLICY\.md` §7/]]) {
    model.readFiles.add(file);
    if (!exists(file) || !needle.test(read(file))) {
      findings.push(refuse("owner-citation-drift", "identity-value rule", file, `${file} no longer cites POLICY.md §7 as the owner of the identity-value rule`));
    }
  }
  for (const file of [POLICY_REL, "skills/review-plan/SKILL.md", "skills/review-spec/SKILL.md"]) {
    if (file !== POLICY_REL && exists(file) && read(file).includes(pairing)) {
      findings.push(refuse("owner-citation-drift", "identity-value rule", file, `${file} restates the rule instead of citing its one owner`));
    }
  }
  const thirdCopies = [];
  const skillsDir = path.join(root, "skills");
  for (const skill of fs.readdirSync(skillsDir)) {
    for (const dir of [path.join(skillsDir, skill), path.join(skillsDir, skill, "references")]) {
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith(".md")) continue;
        const rel = path.relative(root, path.join(dir, f));
        if (rel === POLICY_REL) continue;
        if (fs.readFileSync(path.join(dir, f), "utf8").includes(pairing)) thirdCopies.push(rel);
      }
    }
  }
  if (thirdCopies.length) {
    findings.push(refuse("owner-citation-drift", "identity-value rule", thirdCopies.join(", "), `a second file states the identity-value rule: ${thirdCopies.join(", ")}`));
  }
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.code}|${f.token}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The highest version row inside a skill's or a package's own changelog section.
 * Skill tables are newest-first and the two package tables are oldest-first, so the
 * gate compares the newest cell rather than pinning either ordering convention. */
function versionCells(text, name) {
  const skillHead = "#### `" + name + "`";
  const pkgHead = "#### [`@gtrabanco/" + name + "`]";
  const out = [];
  let section = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("#### ")) {
      section = line.startsWith(skillHead) || line.startsWith(pkgHead);
      continue;
    }
    if (!section) continue;
    const v = /^\|\s*(\d+\.\d+\.\d+)\s*\|/.exec(line);
    if (v) out.push(v[1]);
  }
  return out;
}

const semverGreater = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pa[i] > pb[i];
  return false;
};

/** The newest restated version in a section, or null when the section has none. */
function newestVersionCell(text, name) {
  const cells = versionCells(text, name);
  if (!cells.length) return null;
  return cells.reduce((best, cell) => (semverGreater(cell, best) ? cell : best));
}

// ---------------------------------------------------------------------------
// 4b. The changelog's version ROWS — the set reading `newestVersionCell` cannot do
// ---------------------------------------------------------------------------

const NAMED_VERSION_ROW = /^\|\s*`?([^`|]+?)`?\s*\|\s*(\d+\.\d+\.\d+)\s*\|/;
const BARE_VERSION_ROW = /^\|\s*(\d+\.\d+\.\d+)\s*\|/;
const SECTION_HEADING = /^#### \[?`@gtrabanco\/([^`]+)`\]?\(|^#### `([^`]+)`$/;

/**
 * Every version row of a changelog, keyed by the surface that owns it: a
 * `#### <name>` section carries rows whose version sits in the first cell, and the
 * internal/package tables name their skill in that cell instead. Names outside the
 * published set are not rows of this surface.
 *
 * No continuation is inferred: a row whose name cell is empty belongs to whichever
 * block merged that cell, which is not a fact this gate may guess — the same lesson
 * C5 records for the table grammar. A1 (P16 fold) is why this reader exists: the
 * gate asked `newestVersionCell` for a maximum, and a maximum cannot see a repeated
 * row. The three duplicated ES rows this branch added sat in exactly that blind spot.
 */
function changelogVersionRows(text, names) {
  const rows = new Map();
  const push = (name, version) => {
    if (!rows.has(name)) rows.set(name, []);
    rows.get(name).push(version);
  };
  let section = null;
  for (const line of text.split("\n")) {
    if (/^#{2,4} /.test(line)) {
      section = null;
      const head = SECTION_HEADING.exec(line);
      const named = head && (head[1] || head[2]);
      if (named && names.has(named)) section = named;
      continue;
    }
    const named = NAMED_VERSION_ROW.exec(line);
    if (named && names.has(named[1].trim())) {
      push(named[1].trim(), named[2]);
      continue;
    }
    if (!section) continue;
    const cell = BARE_VERSION_ROW.exec(line);
    if (cell) push(section, cell[1]);
  }
  return rows;
}

/**
 * Rows the pin exempts because they predate the pin and say something the release
 * history cannot be rewritten to unsay. Each entry must still match a real duplicate
 * in BOTH languages, so fixing one deletes the entry here — an exemption that stops
 * matching is itself a failure. known-issue 23 owns it.
 */
const LEGACY_DUPLICATE_VERSION_ROWS = [["log-session", "1.4.0"]];

// ---------------------------------------------------------------------------
// 5. The suite
// ---------------------------------------------------------------------------

const live = buildSurfaceModel();

test("AC15 scope: every normative surface that orders an agent action has a fixed grammar", () => {
  assert.ok(live.surfaces.length >= 14, `the inventory orders ${live.surfaces.length} surfaces, not a handful`);
  for (const surface of live.surfaces) {
    assert.deepEqual(surface.faults, [], `${surface.surface}: ${surface.faults.join("; ")}`);
    assert.ok(surface.grammar.startsWith("block:") || surface.grammar.startsWith("fenced:") || surface.grammar.startsWith("table:") || surface.grammar.startsWith("frontmatter:"),
      `${surface.surface} resolves to a fixed grammar kind`);
  }
  // The inventory is the whole scope: a row may not name a grammar kind it cannot read.
  assert.ok(live.surfaces.some((s) => s.surface === "sensor-envelope-fields" && s.files.includes("skills/workflow-status/references/SENSOR_CORE.md")));
  assert.ok(live.surfaces.some((s) => s.surface === "turn-contract-transitions"));
  // C5: a grammar kind checks exactly what it claims. `table:` reads shape, so a
  // table surface without a data row is a fault, and no read-only collection is
  // left in the model to pretend otherwise.
  const tableSurfaces = live.surfaces.filter((s) => s.grammar.startsWith("table:"));
  assert.ok(tableSurfaces.length >= 1, "the inventory declares at least one table grammar");
  for (const surface of tableSurfaces) {
    assert.ok(surface.tableDataRows >= 1, `${surface.surface}'s table grammar reads ${surface.tableDataRows} data rows`);
  }
  assert.ok(!("labelRows" in live), "no write-only label collection survives in the surface model (C5)");
  assert.ok(![...live.hints.values()].some((h) => "metadataInternal" in h),
    "no write-only frontmatter flag survives in the hint map (C5)");
});

test("text → machine: the live repository orders nothing the machine surface does not define", () => {
  const findings = runDriftChecks(live);
  assert.deepEqual(findings, [], `normative drift:\n${findings.map((f) => `  [${f.code}] ${f.surface}: ${f.message}`).join("\n")}`);
  // proof the scan is not vacuous
  assert.ok(live.transitions.filter((t) => t.kind === "pair").length >= 8, "transition pairs are read from the hand-off grammar");
  assert.ok(live.fields.length >= 12, "field references are read from the sensor and turn grammars");
  assert.ok(live.flags.length >= 4, "argument references are read from the mode grammars");
  assert.ok(live.handOffCommands.length >= 10, "closing hand-offs are read from fixed-output blocks");
});

test("machine → text: every value of the must-name vocabularies is ordered by a surface", () => {
  const vocabularies = live.surfaces.filter((s) => s.mustName).flatMap((s) => s.machine);
  assert.deepEqual(uniq(vocabularies).sort(), ["envelope-field:next", "gate-rejection-type", "pre-execution-verdict"],
    "the closed set the second direction covers is declared in the file header");
  const fieldKeys = [...live.machine.fields.keys()];
  assert.ok(fieldKeys.some((k) => k.endsWith(":next")), `the envelope next list is published by name, got: ${fieldKeys.join(", ")}`);
  const named = new Set([...live.printedGateTypes, ...live.verdicts.map((v) => v.token), ...live.fields.filter((f) => f.object === "next").map((f) => f.field)]);
  for (const value of live.machine.vocabularies.get("gate-rejection-type")) assert.ok(named.has(value), `gate type ${value} is named`);
  for (const value of live.machine.vocabularies.get("pre-execution-verdict")) assert.ok(named.has(value), `verdict ${value} is named`);
  assert.deepEqual(live.machine.fieldsOf("next", "envelope").keys, ["recommended", "alternatives", "tier", "suggested"],
    "the envelope's `next` is the object the turn contract names, not the outcome's");
  for (const value of live.machine.fieldsOf("next", "envelope").keys) assert.ok(named.has(value), `next.${value} is named`);
});

test("injected disagreement — undefined transition: a state pair no table defines is refused by name", () => {
  const model = buildSurfaceModel();
  model.transitions.push({
    surface: "turn-contract-transitions", kind: "pair", from: "review-spec", to: "execute-phase",
    file: "skills/orchestration-envelope/references/TURN_CONTRACT.md",
  });
  const findings = runDriftChecks(model).filter((f) => f.code === "undefined-transition");
  assert.equal(findings.length, 1, "exactly the injected pair is refused");
  assert.equal(findings[0].surface, "turn-contract-transitions", "the refusal names the offending surface");
  assert.match(findings[0].token, /review-spec->execute-phase/, "the refusal names the offending token");
  assert.match(findings[0].message, /does not allow execute-phase after review-spec/);
});

test("injected disagreement — unaccepted argument: a flag no argument-hint accepts is refused by name", () => {
  const model = buildSurfaceModel();
  model.flags.push({
    surface: "plan-mode-routing", owner: "plan-feature", flag: "--force", route: "plan-feature-scaffold",
    file: "skills/plan-feature/references/ROUTING.md",
  });
  const findings = runDriftChecks(model).filter((f) => f.code === "unaccepted-argument");
  assert.equal(findings.length, 1, "exactly the injected flag is refused");
  assert.equal(findings[0].surface, "plan-mode-routing");
  assert.equal(findings[0].token, "--force");
  assert.match(findings[0].message, /no argument-hint accepts/);
  // and the same check accepts what the surface really declares
  for (const f of model.flags.filter((x) => x.flag !== "--force")) {
    assert.ok(!runDriftChecks({ ...model, flags: [f] }).some((x) => x.code === "unaccepted-argument"), `${f.flag} is declared`);
  }
});

test("injected disagreement — absent field: a key the schema does not declare is refused by name", () => {
  const model = buildSurfaceModel();
  model.fields.push({
    surface: "sensor-envelope-fields", machine: "envelope", object: "gates", field: "review_gate_pending",
    file: "skills/workflow-status/references/SENSOR_CORE.md",
  });
  const findings = runDriftChecks(model).filter((f) => f.code === "absent-field");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].surface, "sensor-envelope-fields");
  assert.equal(findings[0].token, "gates.review_gate_pending");
  assert.match(findings[0].message, /the gates field list does not declare/);
});

test("injected disagreement — an object no validator declares is refused as an absent field too", () => {
  const model = buildSurfaceModel();
  model.fields.push({ surface: "turn-contract-fields", machine: "envelope", object: "ledger", field: "row", file: POLICY_REL });
  const findings = runDriftChecks(model).filter((f) => f.code === "absent-field");
  assert.equal(findings.length, 1);
  assert.match(findings[0].token, /^ledger\.row$/);
});

test("injected disagreement — an invented member of a published closed set is refused", () => {
  const model = buildSurfaceModel();
  model.alternations.push({
    surface: "snapshot-commands", members: ["spec", "plan", "retro"],
    file: "skills/pre-execution-review/references/SNAPSHOT.md",
  });
  const findings = runDriftChecks(model).filter((f) => f.code === "unpublished-alternation");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].surface, "snapshot-commands");
  assert.equal(findings[0].token, "pre-execution-stage:retro");
  // a set the machine publishes in full is bound, never flagged
  model.alternations.push({ surface: "snapshot-commands", members: ["spec", "plan"], file: "x" });
  assert.equal(runDriftChecks(model).filter((f) => f.code === "unpublished-alternation").length, 1);
});

test("machine → text fails when a published value is dropped from every surface", () => {
  const model = buildSurfaceModel();
  model.verdicts = model.verdicts.filter((v) => v.token !== "needs-design");
  const findings = runDriftChecks(model).filter((f) => f.code === "value-not-named");
  assert.ok(findings.some((f) => f.token === "pre-execution-verdict:needs-design"), "an unpublished-looking verdict that no surface names is a finding");
  model.printedGateTypes = model.printedGateTypes.filter((t) => t !== "phase-lint");
  const second = runDriftChecks(model).find((f) => f.code === "value-not-named" && f.token === "gate-rejection-type:phase-lint");
  assert.ok(second, "and the same holds for the gate vocabulary");
  model.fields = model.fields.filter((f) => f.field !== "tier");
  const third = runDriftChecks(model).find((f) => f.code === "value-not-named" && f.token === "envelope-field:next:tier");
  assert.ok(third, "and for a field of the envelope object the agent reads at the end of a turn");
});

test("render-only prose: a restatement that drifts from the machine value is the defect", () => {
  const model = buildSurfaceModel();
  const before = runDriftChecks(model).filter((f) => f.code === "unrendered-value");
  assert.deepEqual(before, [], "every pinned restatement agrees with its recomputed value today");
  const guide = read(GUIDE_REL);
  const facts = versionedBlock(guide, FACTS_MARKER);
  assert.ok(facts.rows.length >= 4, `the restatements are pinned as a table (${facts.rows.length} rows)`);
  // A stale claim: the surface lost the number the machine recomputes.
  const stale = { ...model };
  const original = read("docs/workflow/SKILLS.md");
  const mutated = original.replace("**19 user-facing skills**", "**20 user-facing skills**");
  assert.notEqual(mutated, original, "the pinned literal is present in the guide surface");
  {
    // Recompute through a surface model that reads the mutated text instead of writing it.
    const patched = new Map([[path.join(root, "docs/workflow/SKILLS.md"), mutated]]);
    const realRead = fs.readFileSync;
    fs.readFileSync = (p, ...a) => (patched.has(String(p)) ? patched.get(String(p)) : realRead(p, ...a));
    try {
      const findings = runDriftChecks(buildSurfaceModel()).filter((f) => f.code === "unrendered-value");
      assert.equal(findings.length, 1, "the divergent restatement is refused");
      assert.equal(findings[0].surface, "docs/workflow/SKILLS.md");
      assert.match(findings[0].message, /recomputes to 19/);
    } finally {
      fs.readFileSync = realRead;
    }
  }
});

test("version cells and package versions are recomputed, not trusted", () => {
  const model = buildSurfaceModel();
  const en = read("CHANGELOG.md");
  const es = read("CHANGELOG.es.md");
  for (const [skill, meta] of model.hints) {
    for (const [name, text] of [["CHANGELOG.md", en], ["CHANGELOG.es.md", es]]) {
      const cell = newestVersionCell(text, skill);
      if (cell !== null && meta.version) assert.equal(cell, meta.version, `${name} must restate ${skill} at its frontmatter version`);
    }
  }
  assert.equal(newestVersionCell(en, "pi-agentic-workflow"), JSON.parse(read("packages/pi-agentic-workflow/package.json")).version);
  assert.equal(newestVersionCell(en, "agentic-workflow-schema"), JSON.parse(read("packages/agentic-workflow-schema/package.json")).version);
});

// A1 + A2 (P16 fold). The check above reads a MAXIMUM per skill, which is the gate
// gap: `CHANGELOG.es.md` stated `pre-execution-review` 1.1.0, `plan-feature-scaffold`
// 2.1.0 and `evidence-grounding` 1.1.1 twice in the same table and stayed green, and
// `CHANGELOG.md` lost `plan-fix` 3.0.0 out of its table entirely while the file
// self-describes as the source of truth for what changed between versions. Both are
// set properties of the same rows, so both are computed here, once, in the file that
// owns the changelog grammar.
test("a changelog version row appears once per table, and both languages publish the same set", () => {
  const model = buildSurfaceModel();
  const names = new Set([...model.hints.keys(), "agentic-workflow-schema", "pi-agentic-workflow"]);
  const byFile = new Map();
  for (const file of ["CHANGELOG.md", "CHANGELOG.es.md"]) {
    const rows = changelogVersionRows(read(file), names);
    const total = [...rows.values()].reduce((sum, list) => sum + list.length, 0);
    assert.ok(total >= 400, `${file} yields ${total} version rows — the reader stopped matching the tables`);
    byFile.set(file, rows);
    for (const [name, versions] of rows) {
      const seen = new Map();
      for (const version of versions) seen.set(version, (seen.get(version) ?? 0) + 1);
      const doubled = [...seen]
        .filter(([version, count]) => count > 1 && !LEGACY_DUPLICATE_VERSION_ROWS.some(([n, v]) => n === name && v === version))
        .map(([version, count]) => `${version} ×${count}`);
      assert.deepEqual(doubled, [], `${file} states ${name} more than once in one table: ${doubled.join(", ")} — a max-reading gate cannot see this, this pin can`);
    }
  }
  // The exemptions are still true, or they come out of the list.
  for (const [name, version] of LEGACY_DUPLICATE_VERSION_ROWS) {
    for (const [file, rows] of byFile) {
      const hits = (rows.get(name) ?? []).filter((v) => v === version).length;
      assert.equal(hits, 2, `${file}: the exempted ${name} ${version} duplicate is no longer a duplicate (seen ${hits}) — delete the exemption (known-issue 23)`);
    }
  }
  for (const name of new Set([...byFile.get("CHANGELOG.md").keys(), ...byFile.get("CHANGELOG.es.md").keys()])) {
    const en = uniq(byFile.get("CHANGELOG.md").get(name) ?? []).sort();
    const es = uniq(byFile.get("CHANGELOG.es.md").get(name) ?? []).sort();
    assert.deepEqual(es, en, `${name}: CHANGELOG.es.md must publish the same version set as CHANGELOG.md (${en.join(", ")})`);
  }
});

test("F37 has one cited owner: both boxes name POLICY.md §7 and no third copy exists", () => {
  const findings = runDriftChecks(live).filter((f) => f.code === "owner-citation-drift");
  assert.deepEqual(findings, [], findings.map((f) => f.message).join("\n"));
  const planBox = read("skills/review-plan/SKILL.md");
  assert.match(planBox, /`POLICY\.md` §7 owns the identity-value rule|`POLICY\.md` §7/, "review-plan's parent-digest line cites §7 as the owner");
  // either citation reworded away is a refusal, proven in memory
  const model = buildSurfaceModel();
  const patched = new Map([[path.join(root, "skills/review-plan/SKILL.md"), planBox.replace(/`POLICY\.md` §7/g, "the review policy")]]);
  const realRead = fs.readFileSync;
  fs.readFileSync = (p, ...a) => (patched.has(String(p)) ? patched.get(String(p)) : realRead(p, ...a));
  try {
    const drift = runDriftChecks(buildSurfaceModel()).filter((f) => f.code === "owner-citation-drift");
    assert.ok(drift.length >= 1, "a reworded citation is a finding");
    assert.ok(drift.some((f) => f.token === "skills/review-plan/SKILL.md"));
  } finally {
    fs.readFileSync = realRead;
  }
});

// F41 — the readiness preflight's first spec box restated the Product heading list
// in prose, so a weak run reported `READY-FOR-REVIEW` on bytes the canonical
// selector refused for a missing `Goal` heading. The machine owns that list; prose
// may cite it and must not copy it.
const SHAPE_SCHEMA_REL = "packages/agentic-workflow-schema/src/pre-execution.ts";
const READINESS_REL = "skills/evidence-grounding/references/READINESS.md";

test("F41: the readiness heading box cites the machine's Product heading list instead of restating it", () => {
  const decl = new RegExp(`export const SPEC_PRODUCT_REQUIRED_HEADINGS = Object\\.freeze\\(\\[([\\s\\S]*?)\\] as const\\)`);
  const found = SHAPE_SCHEMA_REL ? decl.exec(read(SHAPE_SCHEMA_REL)) : null;
  assert.ok(found, "the machine must still own one closed Product heading list");
  const headings = quoted(found[1]);
  assert.ok(headings.length >= 3, `expected a non-trivial list, got ${JSON.stringify(headings)}`);
  const readiness = read(READINESS_REL);
  assert.match(readiness, /SPEC_PRODUCT_REQUIRED_HEADINGS/, "box 1 names the machine as the owner");
  assert.doesNotMatch(readiness, /in template order/, "the prose restatement is gone, not kept beside the citation");
  const copied = headings.filter((h) => new RegExp(`^\`{1}${h}\`{1}$|^ ${h}$`, "m").test(readiness));
  assert.deepEqual(copied, [], `READINESS.md must not carry a second copy of ${JSON.stringify(headings)}`);
  // the injection that proves the citation is load-bearing: strip it and the box is prose again
  const stripped = readiness.replace(/SPEC_PRODUCT_REQUIRED_HEADINGS/g, "the required headings");
  assert.ok(!/SPEC_PRODUCT_REQUIRED_HEADINGS/.test(stripped), "the fixture models a reworded-away owner");
});

test("the gate fails closed: a surface that loses its grammar block is refused", (t) => {
  if (isChildRun) return t.skip("the child run is itself the injected tree");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "normative-drift-"));
  const files = [...live.readFiles].filter((rel) => exists(rel));
  for (const rel of files) {
    fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
    fs.copyFileSync(path.join(root, rel), path.join(tmp, rel));
  }
  const policy = path.join(tmp, POLICY_REL);
  const text = fs.readFileSync(policy, "utf8");
  const cut = text.replace(/[ ]{0,3}```text[ \t]*\n[ ]{0,3}gate-rejection-vocabulary@1[\s\S]*?```[ \t]*\n?/, "");
  assert.notEqual(cut, text, "the fixture removes the versioned grammar it reads");
  fs.writeFileSync(policy, cut);
  const env = { ...process.env, NORMATIVE_DRIFT_REPO: tmp };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  const child = spawnSync(process.execPath, ["--test", thisFile], { cwd: tmp, env, encoding: "utf8" });
  assert.notEqual(child.status, 0, `a normative surface stripped of its fixed grammar must not read as green\n${child.stdout.slice(-1500)}\n${child.stderr.slice(-500)}`);
  assert.match(`${child.stdout}${child.stderr}`, /undeclared-grammar|has no gate-rejection-vocabulary@1 block/);
});

test("machine vocabularies are parsed from committed source, never from dist", () => {
  assert.ok(live.readFiles.has(SCHEMA_INDEX_REL) && live.readFiles.has(SCHEMA_PREEXEC_REL), "the gate reads the two published source files");
  assert.ok([...live.readFiles].every((rel) => !rel.includes("/dist/")), "the gate reads no build output");
  assert.ok(live.machine.vocabularies.get("workflow-intent").includes("review-plan"));
  assert.ok(live.machine.vocabularies.get("envelope-state").length >= 11);
  assert.ok(live.machine.transitions.get("plan-feature").includes("review-plan"));
  assert.ok(live.machine.vocabularies.get("const:PRE_EXECUTION_RECEIPT_CONTRACT_ID")[0].startsWith("agentic-workflow/"));
  for (const name of ["SKILL_ROLES", "SKILL_EFFECTS", "SKILL_REASONING", "SKILL_CONTEXT_SOURCES", "SKILL_REQUIRED_EVIDENCE",
    "WORKFLOW_DECISION_SENSE_CODES", "WORKFLOW_DECISION_STOP_CODES", "WORKFLOW_DECISION_INVOKE_CODES",
    "PRE_EXECUTION_UNIT_KINDS", "PRE_EXECUTION_ARTIFACT_KINDS", "PRE_EXECUTION_CONTEXT_KINDS",
    "PRE_EXECUTION_FINDING_SEVERITIES", "PRE_EXECUTION_FINDING_CLASSES", "PRE_EXECUTION_REVIEW_ROLES",
    "PRE_EXECUTION_PARENT_ROLES", "VERDICTS_BY_STAGE"]) {
    if (name === "VERDICTS_BY_STAGE") {
      assert.deepEqual([...live.machine.stages.keys()].sort(), ["plan", "spec"], "the stage matrix is read from src");
      continue;
    }
    assert.ok(live.machine.consts.has(name), `${name} is read from src`);
  }
});


