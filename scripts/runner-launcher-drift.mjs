#!/usr/bin/env node

/**
 * runner-launcher-drift.mjs — the launcher-spelling pin (issue #710, S3/S4/S8).
 *
 * The residue #679's verification sketch named and nobody ran: the shipped prose
 * ordered `agentic-workflow <subcommand>`, and nothing that resolves answers to
 * that name. The scope-less npm package is a `0.0.0` placeholder with no `bin`,
 * so the reader — a model composing the command from the page, or a person
 * following the tutorial — hits `command not found` or npm's "could not
 * determine executable to run" instead of the runner.
 *
 * The rule this gate enforces has one owner, and it is not here:
 * `skills/runner-contract/references/RUNNER.md` §"What a skill cites" states the
 * symbolic form (`runner <subcommand> [args...]`) and the ban ("A skill never
 * spells a launcher"). This file reads that form out of the contract's own fenced
 * block, so a contract that stops declaring it fails the pin closed instead of
 * quietly shrinking what the gate accepts.
 *
 * What the spelling *names* is derived too: the ordered set is the CLI's own
 * registry (`HELP_REGISTRY`, the grammar both dispatch tables are pinned to), so
 * a subcommand added to the crate is covered the day it lands and no second list
 * exists to rot. A token that no subcommand claims is prose — "an
 * agentic-workflow config is installed" is a noun phrase — which is why the
 * context matters as much as the token:
 *
 *   code context   a fenced-block line, an inline code span, or a line whose
 *                  first token is the launcher. An instruction a reader executes
 *                  is spelled in one of those three; a sentence is not.
 *
 * Two more properties are structural rather than word-level:
 *
 *   - **the exact-version form is sanctioned** (S4): `bunx
 *     @gtrabanco/agentic-workflow@<pin> <subcommand>` and its `npx`/`pnpm dlx`
 *     siblings name a launcher that resolves, so the boundary check excludes a
 *     scoped or path-qualified spelling by construction;
 *   - **the frozen receipts are excluded with a reason** (§`EXCLUSIONS`): a page
 *     that quotes the commands it ran is evidence, never an instruction.
 *
 * Usage
 *   bun scripts/runner-launcher-drift.mjs              # this checkout
 *   node scripts/runner-launcher-drift.mjs --root <dir>
 *   RUNNER_LAUNCHER_DRIFT_ROOT=<dir> node scripts/runner-launcher-drift.mjs
 *
 * Exit: 0 PASS, 1 drift or a missing surface, 2 usage error.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { HELP_REGISTRY } from "../packages/agentic-workflow/src/runner/help.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The shipped prose this pin reads: the two trees a project installs, and the
 * tutorial that orders this repository's own sessions.
 */
export const SCANNED_ROOTS = Object.freeze(["skills", "template", "docs/workflow"]);

/** The contract whose fenced block declares the symbolic form. */
export const RUNNER_CONTRACT = "skills/runner-contract/references/RUNNER.md";

/** The contract section that owns the rule this gate enforces. */
export const CONTRACT_SECTION = "## What a skill cites";

/**
 * Prose excluded from the scan, each with its reason. A frozen receipt quotes
 * the commands that ran; it is evidence, never an instruction.
 */
export const EXCLUSIONS = new Map([
  [
    "docs/workflow/REPOSITORY_STATE.md",
    "frozen Normalized Repository State receipts — the F-rows quote the commands that measured the tree, evidence of what ran, never an instruction (owner: skills/resolve-repository-state)",
  ],
]);

/** The bare name that resolves nowhere — the retired spelling, never the scoped one. */
const BARE_LAUNCHER = "agentic-workflow";

/** A token in front of the bare name that makes it a scoped or path-qualified spelling. */
const QUALIFIED = new Set(["@", "/", ".", "\\", "-", "_"]);

/** The ordered set: every subcommand the crate's own registry declares. */
export const ORDERED_SET = Object.freeze(Object.keys(HELP_REGISTRY).sort());

const ORDERED = new Set(ORDERED_SET);

/** Every Markdown file under the scanned roots, repository-relative and sorted. */
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
  return files.sort();
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
      // A file that vanished between the walk and the read is not this pin's answer.
    }
  }
  if (texts.has(RUNNER_CONTRACT) === false) {
    try {
      texts.set(RUNNER_CONTRACT, fs.readFileSync(path.join(root, RUNNER_CONTRACT), "utf8"));
    } catch {
      // The missing contract is reported by the sanctioned-form rule below.
    }
  }
  return texts;
}

/**
 * The symbolic head the contract declares, read out of its own section's fenced
 * block (`runner <subcommand> [args...]`). Never restated here: a contract that
 * stops declaring the form returns an empty list and fails the pin closed.
 *
 * @param {string | undefined} text
 * @returns {string[]}
 */
export function sanctionedHeads(text) {
  if (typeof text !== "string") return [];
  const start = text.indexOf(CONTRACT_SECTION);
  if (start === -1) return [];
  const next = text.indexOf("\n## ", start + CONTRACT_SECTION.length);
  const section = next === -1 ? text.slice(start) : text.slice(start, next);
  const heads = new Set();
  for (const line of section.split("\n")) {
    const match = /^\s*([a-z][a-z0-9-]*)\s+<subcommand>/u.exec(line);
    if (match !== null) heads.add(match[1]);
  }
  return [...heads].sort();
}

/**
 * The contexts a reader executes from, with the 1-based line each sits on:
 * fenced-block lines (the fence rows themselves excluded), inline code spans, and
 * a line whose first token is the bare launcher (an indented block or a bare
 * command line, both of which are how a page shows a command outside a fence).
 *
 * @param {string} text
 * @returns {Array<{line: number, text: string, kind: "fence"|"span"|"line"}>}
 */
export function codeContexts(text) {
  const contexts = [];
  const lines = String(text).split("\n");
  let fence = null;
  for (const [index, line] of lines.entries()) {
    const opening = /^\s*(`{3,}|~{3,})/u.exec(line);
    if (fence === null && opening !== null) {
      fence = opening[1];
      continue;
    }
    if (fence !== null) {
      if (line.trimStart().startsWith(fence)) {
        fence = null;
        continue;
      }
      contexts.push({ line: index + 1, text: line, kind: "fence" });
      continue;
    }
    for (const span of line.matchAll(/`([^`\n]+)`/gu)) contexts.push({ line: index + 1, text: span[1], kind: "span" });
    const head = line.replace(/^\s+/u, "");
    if (head.startsWith(`${BARE_LAUNCHER} `)) contexts.push({ line: index + 1, text: head, kind: "line" });
  }
  return contexts;
}

/**
 * The launcher spellings one context carries: the bare name followed by a token
 * the registry claims, excluding a scoped or path-qualified spelling (which is
 * the exact-version form, sanctioned by S4).
 *
 * @param {string} context
 * @returns {Array<{command: string, subcommand: string}>}
 */
export function bareLaunchers(context) {
  const found = [];
  const text = String(context);
  for (let at = text.indexOf(BARE_LAUNCHER); at !== -1; at = text.indexOf(BARE_LAUNCHER, at + BARE_LAUNCHER.length)) {
    if (at > 0 && QUALIFIED.has(text[at - 1])) continue;
    const rest = text.slice(at + BARE_LAUNCHER.length);
    const match = /^[ \t]+([a-z][a-z0-9-]*)/u.exec(rest);
    if (match === null || !ORDERED.has(match[1])) continue;
    found.push({ command: `${BARE_LAUNCHER} ${match[1]}`, subcommand: match[1] });
  }
  return found;
}

/**
 * Run the rules over a model of the tree. Pure: the live case builds the model
 * from disk, the injected cases mutate it.
 *
 * @param {{files?: Map<string, string>, exemptions?: Array<{file: string, why: string}>}} [input]
 * @returns {{findings: Array<{code: string, file: string, line: number|null, detail: string}>, checked: number, sanctioned: string[], ordered: string[], citations: number}}
 */
export function scanLauncherDrift(input = {}) {
  const files = input instanceof Map ? input : (input.files ?? new Map());
  const exemptions = input instanceof Map ? [] : (input.exemptions ?? []);
  const findings = [];
  const checked = [...files.keys()]
    .filter((file) => SCANNED_ROOTS.some((dir) => file.startsWith(`${dir}/`)))
    .sort();
  const excluded = new Set([...EXCLUSIONS.keys(), ...exemptions.map((entry) => entry.file)]);

  for (const entry of exemptions) {
    if (String(entry.why ?? "").trim() === "") {
      findings.push({
        code: "unexplained-exemption",
        file: entry.file,
        line: null,
        detail: "an exemption needs its reason stated, or the file it covers is unexplained silence",
      });
    }
  }

  const sanctioned = sanctionedHeads(files.get(RUNNER_CONTRACT));
  if (sanctioned.length === 0) {
    findings.push({
      code: "sanctioned-form-missing",
      file: RUNNER_CONTRACT,
      line: null,
      detail: `${CONTRACT_SECTION} no longer declares the symbolic form (\`<head> <subcommand> [args...]\`), so the pin cannot sanction the replacement it exists to enforce`,
    });
  }

  if (ORDERED_SET.length === 0) {
    findings.push({
      code: "ordered-set-empty",
      file: "packages/agentic-workflow/src/runner/help.mjs",
      line: null,
      detail: "the crate's CLI registry yielded no subcommand, so the pin cannot tell a launcher from a word",
    });
  }

  const citation = sanctioned.length === 0 ? null : new RegExp(`(?:^|[^\\w/@.-])${sanctioned[0]}\\s+[a-z][a-z0-9-]*`, "u");
  let citations = 0;

  for (const file of checked) {
    if (excluded.has(file)) continue;
    const text = files.get(file) ?? "";
    for (const context of codeContexts(text)) {
      const quoted = context.text.trim().replace(/\s+/gu, " ").slice(0, 120);
      for (const launcher of bareLaunchers(context.text)) {
        findings.push({
          code: "bare-launcher",
          file,
          line: context.line,
          detail: `\`${quoted}\` — \`${launcher.command}\` names the scope-less package, which has no bin, so no reader can resolve it; order \`${sanctioned[0] ?? "runner"} <subcommand>\` (owner: ${RUNNER_CONTRACT} § What a skill cites)`,
        });
      }
    }
    if (citation !== null && file.startsWith("skills/") && citation.test(text)) citations += 1;
  }

  return { findings, checked: checked.length, sanctioned, ordered: [...ORDERED_SET], citations };
}

/* -------------------------------------------------------------------- CLI */

function usage(message) {
  process.stderr.write(`runner-launcher-drift: ${message}\n`);
  process.stderr.write("usage: bun scripts/runner-launcher-drift.mjs [--root <dir>]\n");
  process.exit(2);
}

function parseArgs(argv) {
  let root = process.env.RUNNER_LAUNCHER_DRIFT_ROOT
    ? path.resolve(process.env.RUNNER_LAUNCHER_DRIFT_ROOT)
    : REPO_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") {
      const value = argv[index + 1];
      if (!value) usage("--root needs a directory");
      root = path.resolve(value);
      index += 1;
      continue;
    }
    usage(`unknown argument: ${argv[index]}`);
  }
  return { root };
}

function main(argv) {
  const { root } = parseArgs(argv);
  const { findings, checked, sanctioned, ordered, citations } = scanLauncherDrift({ files: loadTree({ root }) });
  for (const finding of findings) {
    process.stdout.write(
      `runner-launcher-drift: ${finding.file}${finding.line === null ? "" : `:${finding.line}`} ${finding.code} — ${finding.detail}\n`,
    );
  }
  process.stdout.write(`bare-launcher: ${findings.filter((finding) => finding.code === "bare-launcher").length}\n`);
  process.stdout.write(
    `roots: ${SCANNED_ROOTS.join(",")} · sanctioned: ${sanctioned.join(",") || "-"} · ordered: ${ordered.length} · citations: ${citations} · files: ${checked}\n`,
  );
  process.stdout.write(`verdict: ${findings.length === 0 ? "PASS" : "FAIL"}\n`);
  return findings.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
