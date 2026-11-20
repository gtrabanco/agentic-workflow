#!/usr/bin/env node
/**
 * retention-declaration.mjs — the trim ceremony declaration's gate (issue #651
 * S9, decision D8).
 *
 * A unit-doc carrier change and the matrix that classifies its files move
 * together or they drift. The declaration is a `retention-declaration@1` block in
 * each unit-doc template: one `path | disposition` row per carrier file the
 * published matrix classifies. This gate compares the four templates against the
 * matrix and refuses, by name, a missing row, a conflicting disposition, a row the
 * matrix does not publish, a duplicate, and a template with no block at all.
 *
 * A row the matrix does not publish is legal only as `out-of-scope`: that is how a
 * project records a path its carrier never produces, without inventing a second
 * matrix this repository would then have to keep in step.
 *
 * Usage
 *   bun scripts/retention-declaration.mjs [--check] [--json]
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — `retention-declaration@1`, one `template —` line per
 * file checked, one `finding — <code>` line per defect, then `verdict`. Exit: 0
 * every template agrees · 1 a refusal · 2 a usage error. Read-only.
 *
 * Its sibling suite is `scripts/retention-declaration.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  RETENTION_DECLARATION_CONTRACT,
  RETENTION_DECLARATION_DISPOSITIONS,
  UNIT_DOC_KEEP_FILES,
  UNIT_DOC_TRIM_FILES,
  publishedDisposition,
} from "../packages/agentic-workflow/src/retention/retention.mjs";

export const RECEIPT = "retention-declaration@1";

/** The four unit-doc templates: this repository's and the exportable scaffold's. */
export const TEMPLATES = Object.freeze([
  "docs/features/_TEMPLATE/SPEC.md",
  "docs/fix/_TEMPLATE/SPEC.md",
  "template/docs/features/_TEMPLATE/SPEC.md",
  "template/docs/fix/_TEMPLATE/SPEC.md",
]);

/** The matrix the declaration must match: 11 trimmable + 8 kept paths. */
export const MATRIX = Object.freeze([
  ...UNIT_DOC_TRIM_FILES.map((file) => ({ path: file, disposition: "trimmable" })),
  ...UNIT_DOC_KEEP_FILES.map((file) => ({ path: file, disposition: "kept" })),
]);

const USAGE = "usage: bun scripts/retention-declaration.mjs [--check] [--json]";

/**
 * Read one template's declaration block.
 *
 * The block is the fenced one whose first line is `retention-declaration@1`; the
 * header row names the two columns, and every later row is one declaration.
 *
 * @returns {{rows: {path: string, disposition: string}[], errors: string[]}}
 */
export function readDeclaration(text) {
  const rows = [];
  const errors = [];
  const lines = String(text ?? "").split("\n");
  let index = -1;
  for (let at = 0; at < lines.length - 1; at += 1) {
    if (lines[at].trim() === "```text" && lines[at + 1].trim() === RETENTION_DECLARATION_CONTRACT) {
      index = at;
      break;
    }
  }
  if (index === -1) return { rows, errors: ["no declaration block"] };
  let end = index + 1;
  while (end < lines.length && lines[end].trim() !== "```") end += 1;
  if (end >= lines.length) return { rows, errors: ["the declaration block has no closing fence"] };
  const body = lines.slice(index + 2, end);
  let header = null;
  for (const line of body) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    if (header === null) {
      header = trimmed;
      if (header !== "path | disposition") errors.push(`unexpected declaration header: ${header}`);
      continue;
    }
    const cells = trimmed.split("|").map((cell) => cell.trim());
    if (cells.length !== 2) {
      errors.push(`malformed declaration row: ${trimmed}`);
      continue;
    }
    // The disposition cell may carry a trailing note after a middle dot — the
    // retired-carrier marker the scaffold gate requires on a line naming
    // `TASKS.md`, `progress.md` or `ACCEPTANCE.md` (`scaffold-parity`, #355).
    const [disposition, ...note] = cells[1].split("·").map((part) => part.trim());
    rows.push({ path: cells[0], disposition, note: note.join(" · ") });
  }
  return { rows, errors };
}

/**
 * Check one template's declaration against the published matrix.
 *
 * @returns {{template: string, rows: number, findings: {code: string, detail: string}[]}}
 */
export function checkTemplate(template, text) {
  const parsed = readDeclaration(text);
  const findings = [];
  if (parsed.errors.some((error) => error === "no declaration block")) {
    return { template, rows: 0, findings: [{ code: "block-missing", detail: `no ${RETENTION_DECLARATION_CONTRACT} block` }] };
  }
  for (const error of parsed.errors) findings.push({ code: "block-malformed", detail: error });
  const seen = new Set();
  for (const row of parsed.rows) {
    if (!RETENTION_DECLARATION_DISPOSITIONS.includes(row.disposition)) {
      findings.push({ code: "row-disposition", detail: `${row.path} declares ${row.disposition}` });
      continue;
    }
    if (seen.has(row.path)) {
      findings.push({ code: "row-duplicate", detail: `${row.path} is declared twice` });
      continue;
    }
    seen.add(row.path);
    const published = publishedDisposition(row.path);
    if (published === null) {
      if (row.disposition !== "out-of-scope") {
        findings.push({ code: "row-unknown", detail: `${row.path} is not in the published matrix` });
      }
      continue;
    }
    if (row.disposition !== published) {
      findings.push({ code: "row-conflict", detail: `${row.path} is ${published} in the matrix, declared ${row.disposition}` });
    }
  }
  for (const entry of MATRIX) {
    if (!seen.has(entry.path)) findings.push({ code: "row-missing", detail: `${entry.path} is not declared` });
  }
  return { template, rows: parsed.rows.length, findings };
}

/** Check every template under `root`. */
export function checkTree(root) {
  const templates = [];
  for (const template of TEMPLATES) {
    const abs = path.join(root, template);
    if (!fs.existsSync(abs)) {
      templates.push({ template, rows: 0, findings: [{ code: "template-missing", detail: `${template} does not exist` }] });
      continue;
    }
    templates.push(checkTemplate(template, fs.readFileSync(abs, "utf8")));
  }
  const findings = templates.flatMap((entry) => entry.findings.map((finding) => ({ template: entry.template, ...finding })));
  return { contract: RECEIPT, templates, findings, verdict: findings.length === 0 ? "PASS" : "BLOCKED" };
}

function render(document) {
  const lines = [RECEIPT, `matrix | ${MATRIX.length}`];
  for (const entry of document.templates) {
    lines.push(`template — ${entry.template} | rows ${entry.rows} | findings ${entry.findings.length}`);
  }
  for (const finding of document.findings) {
    lines.push(`finding — ${finding.code} | ${finding.template} | ${finding.detail}`);
  }
  lines.push(`verdict | ${document.verdict}`);
  return `${lines.join("\n")}\n`;
}

function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let json = false;
  for (const arg of argv) {
    if (arg === "--check") continue;
    if (arg === "--json") {
      json = true;
      continue;
    }
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  const document = checkTree(root);
  process.stdout.write(json ? `${JSON.stringify(document, null, 2)}\n` : render(document));
  return document.verdict === "PASS" ? 0 : 1;
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  process.exit(main(process.argv.slice(2)));
}
