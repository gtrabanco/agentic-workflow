#!/usr/bin/env node
/**
 * substrate.mjs — the substrate census and its coverage gate (issue #644).
 *
 * The no-assumption rule (`ask-dont-infer@1`, owner
 * `skills/unit-lane/references/DESIGN.md`) tells a lane to halt when a fact has
 * no evidence. What it could not tell was *why* the fact had no evidence: a
 * question whose owning document simply has not answered yet belongs to
 * `design` / `unit-lane`, while a question the workspace has **no document
 * scaffolded to own** belongs to the scaffolder — and until this module existed
 * nothing could tell the two apart, so the alarm had no route to
 * `init-workspace`.
 *
 * One census answers both halves of that:
 *
 *   `census` — per substrate class, is the surface that would own it *present*,
 *   *declined* with a recorded row, or *absent*? `needs-input` reads it to
 *   verify a substrate route, and `substrate check` reads it as the gate
 *   `init-workspace` runs; neither re-derives it.
 *   `agentic-workflow substrate check --workspace <dir>` — the gate's CLI.
 *
 * The classes are read from their declared owners, never guessed: the
 * architecture document, the charter's `Decision records` and `API posture`
 * slots (the crate's own slot reader, so "a documented shape is not an answer"
 * has one implementation), and the guide's documentation map. Read-only,
 * dependency-free of the network, and deterministic: the same workspace always
 * prints the same bytes.
 *
 * Usage
 *   agentic-workflow substrate check --workspace <dir> [--guide AGENTS.md] [--json]
 *
 * stdout: the fixed `substrate-coverage@1` block, or a refusal block naming the
 * reason and where it was found.
 * exit: 0 no class absent · 1 one or more absent · 2 refusal or usage error.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { SUBSTRATE_CLASSES } from "@gtrabanco/agentic-workflow-schema";

import { isPlaceholder, readSlots } from "../../charter/interview.mjs";
import { sectionText } from "../unit-doc-phases.mjs";

/** Contract identifier for the printed block. */
export const BLOCK_ID = "substrate-coverage@1";
/** The closed state vocabulary a class row may carry, in reporting order. */
export const STATES = Object.freeze(["present", "declined", "absent"]);
/** The declared-decline block the guide publishes, and its column set. */
export const DECLINES_BLOCK = "substrate-declines@1";
export const DECLINE_COLUMNS = Object.freeze(["class", "date", "owner"]);
/** The refusal vocabulary: every one names a defect the census will not guess past. */
export const REFUSALS = Object.freeze(["unknown-class", "malformed-declines", "duplicate-class"]);
/** The guide every class is read from, relative to the workspace root. */
export const DEFAULT_GUIDE = "AGENTS.md";
/** The architecture document the scaffold ships as the class's home. */
export const ARCHITECTURE_DOC = "docs/architecture/ARCHITECTURE.md";
/** The guide's documentation-map section, and the charter's two slots. */
export const MAP_HEADING = "Documentation map";
export const CHARTER_HEADING = "Project charter";
export const SLOTS = Object.freeze({
  "decision-records": "Decision records",
  "api-posture": "API posture",
});
/** The classes, in the fixed order the block reports them. */
export const CLASSES = SUBSTRATE_CLASSES;

const FENCE = /^(`{3,}|~{3,})/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether a document carries an answer rather than a documented shape: a line
 * outside a fence that is neither blank, nor a heading, nor a lone `<…>`
 * placeholder. Reuses the charter's one placeholder rule so a new slot and a new
 * document cannot disagree about what "filled" means.
 */
export function hasAnswer(text) {
  if (text === null || text === undefined) return false;
  let fence = null;
  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (fence !== null) {
      const match = FENCE.exec(trimmed);
      if (match && match[1][0] === fence.char && match[1].length >= fence.length) fence = null;
      continue;
    }
    const opened = FENCE.exec(trimmed);
    if (opened) {
      fence = { char: opened[1][0], length: opened[1].length };
      continue;
    }
    if (trimmed === "") continue;
    if (trimmed.startsWith("#")) continue;
    if (isPlaceholder(trimmed)) continue;
    return true;
  }
  return false;
}

/** Data rows of a markdown table (the header and its separator are not data). */
function tableRows(section) {
  const rows = (section ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  return rows.filter((line) => !/^\|[\s:|-]+\|$/.test(line)).slice(1);
}

/**
 * The guide's `substrate-declines@1` block: one row per class the project
 * consciously left unhomed. Ask-first is the writer's contract (`init-workspace`
 * asks before recording one); this reader only refuses an unreadable record.
 *
 * @param {string} guideText
 * @returns {{ ok: true, declines: Map<string, { id: string, line: number }> }
 *          | { ok: false, reason: string, where: string }}
 */
export function readDeclines(guideText) {
  const declines = new Map();
  const lines = guideText === null ? [] : guideText.split("\n");
  let index = -1;
  while (index + 1 < lines.length) {
    index += 1;
    if (lines[index].trim() !== DECLINES_BLOCK) continue;
    const headerAt = index + 1;
    const header = (lines[headerAt] ?? "")
      .split("|")
      .map((cell) => cell.trim().toLowerCase());
    if (header.join("|") !== DECLINE_COLUMNS.join("|")) {
      return { ok: false, reason: "malformed-declines", where: `${DEFAULT_GUIDE}:${headerAt + 1}` };
    }
    let rowIndex = headerAt + 1;
    let ordinal = 0;
    while (rowIndex < lines.length) {
      const where = `${DEFAULT_GUIDE}:${rowIndex + 1}`;
      const line = lines[rowIndex].trim();
      if (line.startsWith("```") || line.startsWith("~~~")) break;
      rowIndex += 1;
      if (line === "") continue;
      const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      if (cells.length !== DECLINE_COLUMNS.length) return { ok: false, reason: "malformed-declines", where };
      const [name, date, owner] = cells;
      if (!ISO_DATE.test(date) || owner === "") return { ok: false, reason: "malformed-declines", where };
      if (!CLASSES.includes(name)) return { ok: false, reason: "unknown-class", where };
      if (declines.has(name)) return { ok: false, reason: "duplicate-class", where };
      ordinal += 1;
      declines.set(name, { id: `D${ordinal}`, line: rowIndex });
    }
    index = rowIndex;
  }
  return { ok: true, declines };
}

/**
 * Read one workspace's substrate. Pure apart from the file reads; every caller
 * renders from this result and re-derives nothing.
 *
 * @param {string} workspaceDir
 * @param {{ guide?: string }} [options]
 */
export function census(workspaceDir, options = {}) {
  const workspace = path.resolve(workspaceDir);
  const guideName = options.guide ?? DEFAULT_GUIDE;
  const guidePath = path.join(workspace, guideName);
  const guideText = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, "utf8") : null;
  const declines = readDeclines(guideText);
  if (!declines.ok) return { ok: false, workspace, reason: declines.reason, where: declines.where };

  const slots = guideText === null ? [] : readSlots(guideText);
  const slotState = (slot) => slots.find((entry) => entry.key === slot)?.state ?? "placeholder";
  const architecturePath = path.join(workspace, ARCHITECTURE_DOC);
  const architectureText = fs.existsSync(architecturePath) ? fs.readFileSync(architecturePath, "utf8") : null;

  /** Every class's natural reading, before a recorded decline overrides it. */
  const readings = {
    architecture: hasAnswer(architectureText) ? "present" : "absent",
    "decision-records": slotState(SLOTS["decision-records"]) === "filled" ? "present" : "absent",
    "api-posture": slotState(SLOTS["api-posture"]) === "filled" ? "present" : "absent",
    "documentation-map": tableRows(sectionText(guideText ?? "", MAP_HEADING)).length > 0 ? "present" : "absent",
  };
  const evidence = {
    architecture: ARCHITECTURE_DOC,
    "decision-records": `${guideName} § ${CHARTER_HEADING} · ${SLOTS["decision-records"]}`,
    "api-posture": `${guideName} § ${CHARTER_HEADING} · ${SLOTS["api-posture"]}`,
    "documentation-map": `${guideName} § ${MAP_HEADING}`,
  };

  const classes = CLASSES.map((name) => {
    const declined = declines.declines.get(name);
    if (declined !== undefined) {
      return { name, state: "declined", evidence: `${guideName} § ${DECLINES_BLOCK} · ${declined.id}` };
    }
    return { name, state: readings[name], evidence: evidence[name] };
  });
  const summary = {
    classes: classes.length,
    present: classes.filter((entry) => entry.state === "present").length,
    declined: classes.filter((entry) => entry.state === "declined").length,
    absent: classes.filter((entry) => entry.state === "absent").length,
  };
  return {
    ok: true,
    block: BLOCK_ID,
    workspace,
    classes,
    summary,
    verdict: summary.absent === 0 ? "complete" : "gap",
  };
}

/** Render the fixed `substrate-coverage@1` block. */
export function render(result) {
  return [
    result.block,
    `Workspace: ${result.workspace}`,
    ...result.classes.map((entry) => `- ${entry.name} · ${entry.state} · ${entry.evidence}`),
    `Summary: ${result.summary.classes} classes · ${result.summary.present} present · `
      + `${result.summary.declined} declined · ${result.summary.absent} absent`,
    `Verdict: ${result.verdict}`,
  ].join("\n") + "\n";
}

/** Render the refusal block; the reason and where are the whole answer. */
export function renderRefusal(result) {
  return [
    `SUBSTRATE REFUSAL — ${BLOCK_ID}`,
    `Workspace: ${result.workspace}`,
    `Reason: ${result.reason}`,
    `Where: ${result.where}`,
  ].join("\n") + "\n";
}

const USAGE = "usage: agentic-workflow substrate check --workspace <dir> [--guide AGENTS.md] [--json]\n";

/**
 * The workspace a unit folder lives in: the nearest ancestor carrying the
 * scaffold marker (the guide) or a git directory. `null` when nothing above the
 * folder is a workspace — the caller decides whether that is a refusal.
 *
 * @param {string} fromDir
 * @returns {string | null}
 */
export function discoverWorkspace(fromDir) {
  let current = path.resolve(fromDir);
  for (;;) {
    if (fs.existsSync(path.join(current, DEFAULT_GUIDE)) || fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** The state one class carries in a census result, or `null` for an unknown class. */
export function stateOf(result, name) {
  return result.classes.find((entry) => entry.name === name)?.state ?? null;
}

function usageError(message) {
  process.stderr.write(`substrate: ${message}\n${USAGE}`);
  return 2;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0) return usageError("missing subcommand: check");
  if (args[0] !== "check") return usageError(`unknown subcommand: ${args[0]}`);
  const json = args.includes("--json");
  let guide = DEFAULT_GUIDE;
  let workspace = null;
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") continue;
    if (arg === "--workspace" || arg === "--guide") {
      const value = args[index + 1];
      if (value === undefined) return usageError(`${arg} needs a value`);
      index += 1;
      if (arg === "--workspace") workspace = value;
      else guide = value;
      continue;
    }
    return usageError(`unknown option: ${arg}`);
  }
  if (workspace === null) return usageError("missing --workspace <dir>");
  let stat = null;
  try {
    stat = fs.statSync(workspace);
  } catch {
    stat = null;
  }
  if (stat === null || !stat.isDirectory()) return usageError(`${workspace} is not a directory`);

  const result = census(workspace, { guide });
  if (!result.ok) {
    process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : renderRefusal(result));
    return 2;
  }
  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : render(result));
  return result.verdict === "complete" ? 0 : 1;
}

/**
 * CLI entry: the arguments after `agentic-workflow substrate`.
 * Returns the exit code (0 complete, 1 gap, 2 refusal/usage) for the bin to set.
 *
 * @param {string[]} argv
 * @returns {number}
 */
export function run(argv) {
  return main([process.argv[0], process.argv[1], ...argv]);
}
