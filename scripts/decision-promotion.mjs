#!/usr/bin/env node
/**
 * decision-promotion.mjs — the promotion sweep's deterministic producer
 * (issue #650 S3/S4/S6/S7).
 *
 * The audit's `Decision promotion` dimension asks one question of the tree: does
 * every decision whose scope is `cross-unit` name the permanent owner doc that
 * carries it? A decision that stays in the unit ledger is a standing rule with
 * no reader once the unit closes, which is the failure this dimension exists to
 * make visible. The producer answers with one receipt — one row per decision it
 * read, one finding per row that breaks the rule — and it writes nothing:
 * promotion stays an owner-directed docs change (issue #650 S9).
 *
 * The ledger grammar is not re-implemented here: the `decision` rows are read by
 * the dispatcher's own parser (`needs-input.mjs`), so the sweep and the sensor
 * that refuses a malformed ledger can never disagree about what a row says.
 *
 * Usage
 *   bun scripts/decision-promotion.mjs [<dir> | --root <dir>] [--since <YYYY-MM-DD>] [--json]
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — `decision-promotion@1`, the root and the rule's
 * `since` date, the ledger totals, one `row —` line per decision, one
 * `finding — <code>` line per defect, then `verdict`. Exit: 0 clean or
 * findings reported — a ledger the parser refuses becomes a named
 * `skipped —` line, never a fatal; 2 a usage error.
 *
 * Read-only: it reads the tree, writes nothing, calls no network.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { parseLedger } from "../packages/agentic-workflow/src/runner/sensors/needs-input.mjs";

export const RECEIPT = "decision-promotion@1";
/**
 * The date the scope cell entered the ledger contract. A decision captured on or
 * after it owes a scope; an earlier one is a legacy row, counted and never
 * refused — the rule binds from capture time forward, it does not rewrite
 * history.
 */
export const RULE_SINCE = "2026-11-19";
/** The closed finding codes: one class per broken obligation, nothing else. */
export const FINDING_CODES = Object.freeze(["owner-doc-missing", "scope-unrecorded", "unpromoted-decision"]);
/**
 * The owner docs a promotion may land in, in the order a scope resolves them:
 * the guide's laws, the structural owner, and the checkable invariants. A
 * project whose decisions live elsewhere names that doc in the guide's
 * `Decision records` slot, and the slot's paths join this set.
 */
export const OWNER_DOCS = Object.freeze([
  "AGENTS.md",
  "docs/architecture/ARCHITECTURE.md",
  "docs/architecture/ARCHITECTURAL_INVARIANTS.md",
]);
/** The charter slot that declares a project's own decision home. */
const DECISION_RECORDS_SLOT = "Decision records";
/** The unit trees the sweep reads: one folder per unit, both lanes. */
const UNIT_TREES = Object.freeze(["docs/features", "docs/fix"]);
const LEDGER = "decisions.md";
const BLOCK = "open-questions@1";

export class DecisionPromotionRefusal extends Error {}

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));
const compareDate = (a, b) => String(a).localeCompare(String(b));
const stripQuotes = (cell) => String(cell).replaceAll("`", "");

/** Path-like tokens in a cell, so a citation is judged as a path, not a prose hit. */
function pathTokens(cell) {
  return stripQuotes(cell)
    .split(/[\s,;()<>[\]"']+/)
    .map((token) => token.replace(/\.$/, ""))
    .filter((token) => token.includes("/") || /\.(md|mdx)$/.test(token));
}

/** The project's declared decision home, read from the guide's charter slot. */
export function declaredDecisionDocs(root) {
  const guide = path.join(root, "AGENTS.md");
  if (!fs.existsSync(guide)) return [];
  const line = fs
    .readFileSync(guide, "utf8")
    .split("\n")
    .find((row) => row.includes(`**${DECISION_RECORDS_SLOT}`));
  if (line === undefined) return [];
  return pathTokens(line).filter((token) => token.includes("/"));
}

/** Every unit folder carrying a ledger, in tree order so a run is reproducible. */
export function unitLedgers(root) {
  const found = [];
  for (const tree of UNIT_TREES) {
    const base = path.join(root, tree);
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const file = path.join(base, entry.name, LEDGER);
      if (fs.existsSync(file)) found.push({ unit: `${tree}/${entry.name}`, file });
    }
  }
  return found;
}

/**
 * Read one ledger's decision rows through the dispatcher's parser. A ledger with
 * no `open-questions@1` block (a records-only file) carries no decision and is
 * skipped; a ledger carrying the block with a defective row is a refusal, never
 * a silently dropped decision.
 */
export function readDecisions(root, { unit, file }) {
  const text = fs.readFileSync(file, "utf8");
  // A records-only ledger (a `path-protection-records@1` file) carries no
  // decision and is skipped; a ledger that carries the marker anywhere is read,
  // and the dispatcher's parser decides whether it is readable at all.
  if (!text.split("\n").some((line) => line.trim() === BLOCK)) {
    return { unit, file, decisions: [], noBlock: true, unreadable: null };
  }
  const parsed = parseLedger(text);
  if (!parsed.ok) {
    // A ledger the dispatcher cannot read is named, never dropped and never
    // fatal: refusing a row is `needs-input`'s contract on its own surface, and
    // a sweep that dies on the first historical ledger reports nothing at all.
    // The dimension turns each named ledger into one finding.
    return { unit, file, decisions: [], unreadable: `${parsed.reason} at ${parsed.where}` };
  }
  return { unit, file, decisions: parsed.entries.filter((entry) => entry.type === "decision"), unreadable: null };
}

/** Every documentation path a row cites, in the order it cites them. */
function citedDocs(entry) {
  return [entry.chosen, entry.discarded]
    .flatMap((cell) => pathTokens(cell ?? ""))
    .filter((token) => /\.(md|mdx)$/.test(token));
}

/**
 * The owner doc a row cites, and whether it is the canonical one: a citation to
 * a doc outside the closed set is a promotion attempt at a doc that owns no
 * scope, which the caller reports rather than silently accepting.
 */
function ownerDocOf(entry, ownerDocs) {
  const cited = citedDocs(entry);
  const canonical = cited.find((token) => ownerDocs.includes(token));
  if (canonical !== undefined) return { doc: canonical, canonical: true };
  return cited.length > 0 ? { doc: cited[0], canonical: false } : null;
}

/**
 * The rule, pure in its inputs: one row per decision, one finding per row that
 * breaks the contract. `root` is only read to check that a cited doc exists.
 */
export function evaluatePromotion({ root, ledgers, since, ownerDocs = OWNER_DOCS }) {
  const resolvedOwnerDocs = [...ownerDocs, ...declaredDecisionDocs(root)];
  const rows = [];
  const findings = [];
  let scoped = 0;
  let crossUnit = 0;
  let promoted = 0;
  const unreadable = ledgers.filter((ledger) => ledger.unreadable !== null).map((ledger) => ({ unit: ledger.unit, reason: ledger.unreadable }));
  const noBlock = ledgers.filter((ledger) => ledger.noBlock === true).map((ledger) => ledger.unit);

  for (const ledger of ledgers) {
    for (const entry of ledger.decisions) {
      const cited = entry.scope === "cross-unit" ? ownerDocOf(entry, resolvedOwnerDocs) : null;
      const row = {
        unit: ledger.unit,
        id: entry.id,
        date: entry.date,
        scope: entry.scope ?? null,
        ownerDoc: cited?.doc ?? null,
        status: "legacy",
      };
      if (entry.scope !== null) scoped += 1;

      if (entry.scope === null) {
        if (compareDate(entry.date, since) >= 0) {
          findings.push({
            code: "scope-unrecorded",
            unit: ledger.unit,
            id: entry.id,
            detail: `captured ${entry.date}, after the rule landed at ${since}, with no scope cell`,
          });
        }
      } else if (entry.scope === "unit-only") {
        row.status = "unit-only";
      } else {
        crossUnit += 1;
        if (cited === null) {
          findings.push({
            code: "unpromoted-decision",
            unit: ledger.unit,
            id: entry.id,
            detail: `cross-unit and cites no owner doc (${resolvedOwnerDocs.join(", ")})`,
          });
        } else if (!cited.canonical) {
          findings.push({
            code: "owner-doc-missing",
            unit: ledger.unit,
            id: entry.id,
            detail: `promotes to ${cited.doc}, which is not one of the owner docs (${resolvedOwnerDocs.join(", ")})`,
          });
        } else if (!fs.existsSync(path.join(root, cited.doc))) {
          findings.push({
            code: "owner-doc-missing",
            unit: ledger.unit,
            id: entry.id,
            detail: `promotes to ${cited.doc}, which does not exist in this tree`,
          });
        } else {
          row.status = "promoted";
          promoted += 1;
        }
      }
      rows.push(row);
    }
  }

  findings.sort((a, b) => `${a.unit}${a.id}`.localeCompare(`${b.unit}${b.id}`));
  return {
    contract: RECEIPT,
    root,
    since,
    totals: {
      ledgers: ledgers.length,
      noBlock: noBlock.length,
      unreadable: unreadable.length,
      decisions: rows.length,
      scoped,
      crossUnit,
      promoted,
    },
    noBlock,
    unreadable,
    ownerDocs: resolvedOwnerDocs,
    rows,
    findings,
    verdict: findings.length === 0 ? "clean" : `findings ${findings.length}`,
  };
}

export function renderReceipt(result) {
  const lines = [result.contract];
  lines.push(`root | ${result.root}`);
  lines.push(`since | ${result.since}`);
  lines.push(
    `ledgers | read ${result.totals.ledgers} · no-block ${result.totals.noBlock} · unreadable ${result.totals.unreadable} · decisions ${result.totals.decisions} · scoped ${result.totals.scoped} · cross-unit ${result.totals.crossUnit} · promoted ${result.totals.promoted}`,
  );
  for (const row of result.rows) {
    lines.push(`row — ${row.unit} · ${row.id} · ${row.scope ?? "—"} · ${row.ownerDoc ?? "—"} · ${row.status}`);
  }
  for (const skipped of result.unreadable) {
    lines.push(`skipped — ${skipped.unit} · ${skipped.reason}`);
  }
  for (const finding of result.findings) {
    lines.push(`finding — ${finding.code} · ${finding.unit} · ${finding.id} · ${finding.detail}`);
  }
  lines.push(`verdict | ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

export function buildPromotion(root, { since = RULE_SINCE, ownerDocs } = {}) {
  if (!isDate(since)) throw new DecisionPromotionRefusal(`--since needs a YYYY-MM-DD date, got ${since}`);
  const ledgers = unitLedgers(root).map((ledger) => readDecisions(root, ledger));
  return evaluatePromotion({ root, ledgers, since, ...(ownerDocs === undefined ? {} : { ownerDocs }) });
}

const USAGE = "usage: decision-promotion.mjs [<dir> | --root <dir>] [--since <YYYY-MM-DD>] [--json]";

function main(argv) {
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let since = RULE_SINCE;
  let dirGiven = false;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (!value) {
        process.stderr.write(`decision-promotion: --root needs a directory\n${USAGE}\n`);
        return 2;
      }
      if (dirGiven) {
        process.stderr.write(`decision-promotion: one directory only\n${USAGE}\n`);
        return 2;
      }
      root = path.resolve(value);
      dirGiven = true;
      index += 1;
    } else if (arg === "--since") {
      const value = argv[index + 1];
      if (!value || !isDate(value)) {
        process.stderr.write(`decision-promotion: --since needs a YYYY-MM-DD date\n${USAGE}\n`);
        return 2;
      }
      since = value;
      index += 1;
    } else if (arg === "--json") {
      json = true;
    } else if (!arg.startsWith("-")) {
      if (dirGiven) {
        process.stderr.write(`decision-promotion: one directory only\n${USAGE}\n`);
        return 2;
      }
      root = path.resolve(arg);
      dirGiven = true;
    } else {
      process.stderr.write(`decision-promotion: unknown argument ${arg}\n${USAGE}\n`);
      return 2;
    }
  }

  let result;
  try {
    result = buildPromotion(root, { since });
  } catch (error) {
    if (error instanceof DecisionPromotionRefusal) {
      process.stderr.write(`decision-promotion: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
  process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : renderReceipt(result));
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
