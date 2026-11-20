#!/usr/bin/env node
/**
 * retention-debt.mjs — the retention-debt dimension's deterministic producer
 * (issue #651 S8).
 *
 * The audit asks one question of the tree: which merged units still carry the
 * process artifacts a settle would collapse, and which documents can never be
 * settled at all? The producer answers with one receipt — the totals, one row per
 * unit it read, one finding per defect — and it writes nothing: the trim itself is
 * `agentic-workflow doc archive`, run by an operator.
 *
 * The predicate is not re-implemented here. `planRetention` (the crate's
 * `src/retention/retention.mjs`) answers eligibility and the carrier split from the
 * schema package's published matrix, so the audit, the sensor and the write path
 * cannot disagree about which unit is debt.
 *
 * Usage
 *   bun scripts/retention-debt.mjs [<dir> | --root <dir>] [--json]
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — `retention-debt@1`, the root, the configured mode,
 * the totals, one `row —` line per unit, one `finding — <code>` line per defect,
 * then `verdict`. Exit: 0 whether or not debt was found (a finding is a report,
 * not a failure) · 2 a usage error. Read-only: it reads the tree, writes nothing.
 *
 * Its sibling suite is `scripts/retention-debt.test.mjs`.
 */

import path from "node:path";
import process from "node:process";

import { planRetention, readRetentionConfig } from "../packages/agentic-workflow/src/retention/retention.mjs";

export const RECEIPT = "retention-debt@1";

/**
 * The closed finding codes. One class per broken obligation: a merged unit still
 * carrying trimmable artifacts, a document that can never be settled, and a unit
 * folder carrying a file the published matrix does not classify.
 */
export const FINDING_CODES = Object.freeze(["pending-trim", "unstamped-doc", "unclassified-file"]);

const USAGE = "usage: bun scripts/retention-debt.mjs [<dir> | --root <dir>] [--json]";

/**
 * Read one tree and answer the dimension's document.
 *
 * @param {string} root — the repository root.
 * @returns {{contract: string, root: string, mode: string, units: number, pending: number,
 *   out_of_scope: number, rows: object[], findings: object[], verdict: string}}
 */
export function analyze(root) {
  const config = readRetentionConfig({ root });
  const plan = planRetention({ root, config });
  const findings = [];
  for (const row of plan.rows) {
    if (row.writable) {
      findings.push({
        code: "pending-trim",
        unit: row.unit,
        detail: `proved-merged full carrier with ${row.trim.length} trimmable file(s): ${row.trim.join(", ") || "none"}`,
      });
    }
    if (row.state === "unstamped" || row.state === "older-format") {
      findings.push({
        code: "unstamped-doc",
        unit: row.unit,
        detail: `${row.state} — out of scope forever; the documented path is a provenance re-stamp`,
      });
    }
    if (row.unclassified.length > 0) {
      findings.push({
        code: "unclassified-file",
        unit: row.unit,
        detail: `the matrix classifies neither ${row.unclassified.join(", ")} — declare it trimmable or kept`,
      });
    }
  }
  return {
    contract: RECEIPT,
    root: path.resolve(root),
    mode: plan.mode,
    units: plan.rows.length,
    pending: plan.rows.filter((row) => row.writable).length,
    out_of_scope: plan.out_of_scope.length,
    rows: plan.rows.map((row) => ({
      unit: row.unit,
      state: row.state,
      trim: row.trim,
      kept: row.kept,
      unclassified: row.unclassified,
    })),
    findings,
    verdict: findings.length === 0 ? "PASS" : "DEBT",
  };
}

/** The fixed block. */
export function render(document) {
  const lines = [
    RECEIPT,
    `root | ${document.root}`,
    `mode | ${document.mode}`,
    `units | ${document.units}`,
    `pending | ${document.pending}`,
    `out-of-scope | ${document.out_of_scope}`,
  ];
  for (const row of document.rows) {
    lines.push(`row | ${row.unit} | ${row.state} | trim: ${row.trim.join(",") || "-"}`);
  }
  for (const finding of document.findings) {
    lines.push(`finding | ${finding.code} | ${finding.unit} | ${finding.detail}`);
  }
  lines.push(`verdict | ${document.verdict}`);
  return `${lines.join("\n")}\n`;
}

function main(argv) {
  let root = process.cwd();
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        process.stderr.write(`${USAGE}\n`);
        return 2;
      }
      root = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      process.stderr.write(`${USAGE}\n`);
      return 2;
    }
    root = arg;
  }
  const document = analyze(root);
  process.stdout.write(json ? `${JSON.stringify(document, null, 2)}\n` : render(document));
  return 0;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  process.exit(main(process.argv.slice(2)));
}
