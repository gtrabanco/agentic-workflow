#!/usr/bin/env node

/**
 * forge-read-drift.mjs — the sanctioned-forms pin (issue #612, S4).
 *
 * A prose correction did not hold for the tool-choice drift (#329) because
 * nothing failed when the repository's own artifacts taught the wrong form. The
 * same shape closed the forge read: the skills ordered `gh issue view --json
 * body`, the guard never saw it, and no suite missed it. This gate transposes
 * `scripts/invocation-drift.mjs`: it reads fixed tokens only — never a sentence —
 * and fails closed on:
 *
 *   raw-content-read          a `gh issue view` / `gh pr view` that requests a
 *                             content field (or no field list at all) in the
 *                             shipped prose (S3, AC2)
 *   elided-field-list         a `--json` list the scanner cannot read; an
 *                             unreadable list is never assumed metadata-only
 *   transport-leak            `gh api` in shipped prose: the transport lives in
 *                             the crate, so a skill that names it re-opens the
 *                             transport question the crate owns (S2, AC6)
 *   unexplainable-exemption   an exemption with no reason stated
 *   sanctioned-form-missing   `RUNNER.md`'s subcommand table no longer names the
 *                             subcommand this pin sanctions — the pin cannot
 *                             sanction a form its own contract does not declare
 *   sanctioned-citation-missing  no shipped page orders the sanctioned form, so
 *                             the ban has no replacement and the workflow it
 *                             serves has no route
 *
 * The classifier is the crate's (`packages/agentic-workflow/src/forge-read/
 * grammar.mjs`), the same one the subcommand and the shim run: one home, no
 * second copy. The *sanctioned spelling* is read from the runner contract's
 * subcommand table, never restated here.
 *
 * Usage
 *   bun scripts/forge-read-drift.mjs              # this checkout
 *   node scripts/forge-read-drift.mjs --root <dir>
 *   FORGE_READ_DRIFT_ROOT=<dir> node scripts/forge-read-drift.mjs
 *
 * Exit: 0 PASS, 1 drift or a missing surface, 2 usage error.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { findForgeReads } from "../packages/agentic-workflow/src/forge-read/grammar.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The shipped prose this pin reads: the two trees that reach a project, and the tutorial. */
export const SCANNED_ROOTS = Object.freeze(["skills", "template", "docs/workflow"]);

/** The runner contract: the closed set's one row is where a sanctioned form lives. */
export const RUNNER_CONTRACT = "skills/runner-contract/references/RUNNER.md";

/** The subcommand the pin sanctions, read out of that table. */
export const SANCTIONED = "forge-read";

/**
 * Prose excluded from the scan, each with its reason. Frozen receipts quote the
 * commands that ran; they are evidence, never instructions.
 */
export const EXCLUSIONS = new Map([
  ["docs/workflow/REPOSITORY_STATE.md", "frozen Normalized Repository State receipts — evidence of what ran, never an instruction"],
]);

/** Files allowed to name the transport, each with the reason it must. */
export const TRANSPORT_EXEMPT = new Map();

/** Every Markdown file under the scanned roots, repository-relative. */
function listMarkdown(root) {
  const files = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith(".md")) files.push(rel);
    }
  };
  for (const dir of SCANNED_ROOTS) walk(dir);
  return files;
}

/**
 * The live model: `path → text` for every scanned page plus the runner contract.
 *
 * @param {{root?: string}} [options]
 * @returns {Map<string, string>}
 */
export function loadTree({ root = REPO_ROOT } = {}) {
  const texts = new Map();
  for (const file of listMarkdown(root)) {
    try {
      texts.set(file, fs.readFileSync(path.join(root, file), "utf8"));
    } catch {
      // a file that vanished between the walk and the read is not this pin's answer
    }
  }
  if (texts.has(RUNNER_CONTRACT) === false) {
    try {
      texts.set(RUNNER_CONTRACT, fs.readFileSync(path.join(root, RUNNER_CONTRACT), "utf8"));
    } catch {
      // the missing contract is reported by the sanctioned-form rule below
    }
  }
  return texts;
}

/** The subcommands the runner contract's table names, with their argument cells. */
function runnerTable(text) {
  if (typeof text !== "string") return new Map();
  const start = text.indexOf("## Subcommands");
  const end = text.indexOf("## Exit codes");
  if (start === -1) return new Map();
  const section = end === -1 ? text.slice(start) : text.slice(start, end);
  const rows = new Map();
  for (const line of section.split("\n")) {
    const cell = /^\|\s*`([a-z][a-z0-9-]*)([^`]*)`/u.exec(line);
    if (cell === null) continue;
    rows.set(cell[1], cell[2]);
  }
  return rows;
}

/** 1-based line of an offset in a document. */
const lineAt = (text, offset) => text.slice(0, offset).split("\n").length;

/**
 * Run the rules over a model of the tree. Pure: the live case builds the model
 * from disk, the injected cases mutate it.
 *
 * @param {{files: Map<string, string>, exemptions?: Array<{file: string, why: string}>, transportExempt?: Array<{file: string, why: string}>}} model
 * @returns {{findings: Array<{code: string, file: string, line: number|null, detail: string}>, checked: number, sanctioned: string[], citations: number}}
 */
export function scanForgeReadDrift(input = {}) {
  // A bare `Map` is the model itself; the object form carries the injected
  // exemptions a test adds without rebuilding the file map.
  const files = input instanceof Map ? input : (input.files ?? new Map());
  const exemptions = input instanceof Map ? [] : (input.exemptions ?? []);
  const transportExempt = input instanceof Map ? [] : (input.transportExempt ?? []);
  const findings = [];
  const checked = [...files.keys()].filter((file) => SCANNED_ROOTS.some((dir) => file.startsWith(`${dir}/`))).sort();
  const excluded = new Set([...EXCLUSIONS.keys(), ...exemptions.map((entry) => entry.file)]);
  const transportAllowed = new Set([...TRANSPORT_EXEMPT.keys(), ...transportExempt.map((entry) => entry.file)]);

  for (const entry of [...exemptions, ...transportExempt]) {
    if (String(entry.why ?? "").trim() === "") {
      findings.push({
        code: "unexplained-exemption",
        file: entry.file,
        line: null,
        detail: "an exemption needs its reason stated, or the file it covers is unexplained silence",
      });
    }
  }

  const rows = runnerTable(files.get(RUNNER_CONTRACT));
  const sanctioned = [...rows.keys()].filter((name) => name === SANCTIONED);
  if (sanctioned.length === 0) {
    findings.push({
      code: "sanctioned-form-missing",
      file: RUNNER_CONTRACT,
      line: null,
      detail: `the subcommand table no longer names \`${SANCTIONED}\`, so the pin cannot sanction the form it exists to enforce`,
    });
  }

  let citations = 0;
  for (const file of checked) {
    if (excluded.has(file)) continue;
    const text = files.get(file) ?? "";
    for (const read of findForgeReads(text)) {
      if (read.kind === "content") {
        findings.push({
          code: "raw-content-read",
          file,
          line: read.line,
          detail: `${read.command} — a content-bearing forge read; order \`runner ${SANCTIONED} ${read.target} <n>${read.comments ? " --comments" : ""}\` instead (S3)`,
        });
      } else if (read.kind === "elided") {
        findings.push({
          code: "elided-field-list",
          file,
          line: read.line,
          detail: `${read.command} — the field list cannot be read, so the pin cannot prove this is metadata-only; name the fields`,
        });
      }
    }
    if (/(?:^|[^a-z-])gh\s+api\b/u.test(text) && !transportAllowed.has(file)) {
      const offset = text.search(/(?:^|[^a-z-])gh\s+api\b/u);
      findings.push({
        code: "transport-leak",
        file,
        line: lineAt(text, offset),
        detail: "`gh api` names the transport in prose; the transport lives in the crate and the skill cites `runner` (S2, AC6)",
      });
    }
    if (file.startsWith("skills/") && new RegExp(`runner\\s+${SANCTIONED}\\b`, "u").test(text)) citations += 1;
  }

  if (citations === 0) {
    findings.push({
      code: "sanctioned-citation-missing",
      file: "skills",
      line: null,
      detail: `no shipped skill orders \`runner ${SANCTIONED}\`, so the ban has no replacement and the workflow it serves has no route (S3)`,
    });
  }

  return { findings, checked: checked.length, sanctioned, citations };
}

/* -------------------------------------------------------------------- CLI */

function parseArgs(argv) {
  let root = process.env.FORGE_READ_DRIFT_ROOT ? path.resolve(process.env.FORGE_READ_DRIFT_ROOT) : REPO_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") {
      const value = argv[index + 1];
      if (!value) return { error: "--root needs a directory" };
      root = path.resolve(value);
      index += 1;
      continue;
    }
    return { error: `unknown argument: ${argv[index]}` };
  }
  return { root };
}

function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.error) {
    process.stderr.write(`forge-read-drift: ${parsed.error}\nusage: forge-read-drift [--root <dir>]\n`);
    return 2;
  }
  const { findings, checked, sanctioned, citations } = scanForgeReadDrift({ files: loadTree({ root: parsed.root }) });
  for (const finding of findings) {
    process.stdout.write(`forge-read-drift: ${finding.file}${finding.line === null ? "" : `:${finding.line}`} ${finding.code} — ${finding.detail}\n`);
  }
  process.stdout.write(`sanctioned: ${sanctioned.join(",") || "-"} · citations: ${citations} · files: ${checked}\n`);
  process.stdout.write(`verdict: ${findings.length === 0 ? "PASS" : "FAIL"}\n`);
  return findings.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
