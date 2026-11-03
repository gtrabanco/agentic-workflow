#!/usr/bin/env node

/**
 * Invocation-drift gate (issue #329, S9) — the enforcement half of the
 * bun-before-node / rg-before-grep discipline.
 *
 * Prose corrections did not stick across four rounds because nothing re-ordered
 * the shell-tool choice at command time and nothing failed when the repo's own
 * artifacts taught the wrong tool. This gate reads fixed tokens only (never a
 * sentence) and fails closed on:
 *
 *   usage-node          a usage string naming node in `scripts/*.mjs` outside the
 *                       declared bootstrap allowlist (S3)
 *   node-command-literal  a `node scripts/…` or `node --test …` literal in
 *                       `skills/**` or `template/**` with no fallback
 *                       declaration on the line or the one before it (S3/S4/S11)
 *   guide-line          either agent guide missing the normative tool-choice
 *                       sentence (S1)
 *   turn-box            either executor skill missing its per-turn choice box
 *                       (S2)
 *   suite-carve-out     `AGENTS.md` missing the measured exception that keeps
 *                       the root suite on `node --test` (S10)
 *   bootstrap-allowlist a declared bootstrap script is gone (stale allowlist)
 *
 * The allowlist is the bootstrap pair: `setup-env.mjs` provisions bun, so it
 * cannot print a bun usage string on a machine without bun, and
 * `update-tools.mjs` is declared node-run beside it (#331 S6/AC8). Every other
 * script prints the bun form.
 *
 * Usage
 *   bun scripts/invocation-drift.mjs            # this checkout
 *   node scripts/invocation-drift.mjs --root <dir>
 *   INVOCATION_DRIFT_ROOT=<dir> node scripts/invocation-drift.mjs
 *
 * Exit: 0 PASS, 1 drift or a missing surface, 2 usage error.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Declared node-run scripts: the bootstrap pair, each with its reason. */
const BOOTSTRAP_SCRIPTS = new Map([
  ["scripts/setup-env.mjs", "provisions bun, so it must run before bun exists (#331 S6/AC8)"],
  ["scripts/update-tools.mjs", "declared node-run beside setup-env (#331 S6/AC8)"],
]);

/** S1 — the normative sentence both guides must carry, whitespace-normalized. */
export const GUIDE_LINE =
  "Manual invocation runs `bun` before `node` and search runs `rg` before `grep`";

/** S2 — the per-turn box both executor skills must carry. */
export const TURN_BOX =
  "✓ Tool choice re-made this turn — `bun` before `node` on manual invocation, `rg` before `grep` on search; availability checked once with `node scripts/setup-env.mjs --check` (node and grep stay the documented fallback)";

/** S10/S11 — the suite commands the sweep must carry, never move. */
const SUITE_CARVE_OUT = [
  "bun test scripts/<file>.test.mjs",
  "node --test scripts/<file>.test.mjs",
  "node scripts/run-root-suite.mjs",
  "fails by construction",
];

const GUIDE_FILES = ["AGENTS.md", "template/AGENTS.md"];
const TURN_BOX_FILES = ["skills/unit-lane/SKILL.md", "skills/execute-phase/SKILL.md"];

/**
 * A literal an agent copies as an invocation: `node scripts/…` (a manual
 * invocation the bun-first rule owns) and `node --test …` (a test invocation,
 * bun-first per file since issue #329's correction). Both are legal only when
 * the adjacent line declares the fallback.
 */
const NODE_SCRIPT_LITERAL = /\bnode\s+(scripts\/[\w./-]+)/g;
const NODE_TEST_LITERAL = /\bnode\s+(--test\b[^\n`]*)/g;
const USAGE_NODE = /\busage:\s*node\b/;

function parseArgs(argv) {
  let root = process.env.INVOCATION_DRIFT_ROOT
    ? path.resolve(process.env.INVOCATION_DRIFT_ROOT)
    : REPO_ROOT;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--root") {
      const value = argv[i + 1];
      if (!value) return { error: "--root needs a directory" };
      root = path.resolve(value);
      i += 1;
      continue;
    }
    return { error: `unknown argument: ${argv[i]}` };
  }
  return { root };
}

const normalize = (text) => text.replace(/\s+/g, " ").trim();

function read(root, rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return null;
  }
}

function listScripts(root) {
  try {
    return fs
      .readdirSync(path.join(root, "scripts"))
      .filter((name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"))
      .sort()
      .map((name) => `scripts/${name}`);
  } catch {
    return [];
  }
}

function listMarkdown(root, top) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith(".md")) found.push(path.relative(root, abs).split(path.sep).join("/"));
    }
  };
  try {
    walk(path.join(root, top));
  } catch {
    return [];
  }
  return found.sort();
}

const listSkillMarkdown = (root) => listMarkdown(root, "skills");
const listTemplateMarkdown = (root) => listMarkdown(root, "template");

/** Every `node scripts/…` / `node --test …` literal, with the line it starts on. */
function nodeCommandLiterals(text) {
  const hits = [];
  for (const pattern of [NODE_SCRIPT_LITERAL, NODE_TEST_LITERAL]) {
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split("\n").length;
      hits.push({ target: match[1].trim(), line });
    }
  }
  return hits;
}

/**
 * A literal is legal only when the line before it or the line itself declares
 * the fallback (`fallback` or `absent`). The window is fixed (never a sentence
 * parse) so a wrapped literal still has to keep the declaration adjacent.
 */
function declaresFallback(lines, line) {
  const window = [lines[line - 2], lines[line - 1]].filter(Boolean);
  return window.some((text) => /fallback|absent/i.test(text));
}

export function scan(root) {
  const violations = [];
  const allowed = [];
  const counts = { usageStrings: 0, skillFiles: 0, guides: 0, turnBoxes: 0 };

  for (const script of listScripts(root)) {
    const text = read(root, script);
    if (text === null) continue;
    const lines = text.split("\n");
    lines.forEach((lineText, index) => {
      if (!USAGE_NODE.test(lineText)) return;
      counts.usageStrings += 1;
      if (BOOTSTRAP_SCRIPTS.has(script)) {
        allowed.push({ path: script, reason: BOOTSTRAP_SCRIPTS.get(script) });
        return;
      }
      violations.push({
        id: "usage-node",
        location: `${script}:${index + 1}`,
        detail: "usage string teaches node; manual invocation is bun-first (AGENTS.md §Runtime convention)",
      });
    });
  }

  for (const [script, reason] of BOOTSTRAP_SCRIPTS) {
    if (read(root, script) === null) {
      violations.push({
        id: "bootstrap-allowlist",
        location: script,
        detail: `declared bootstrap script is missing — remove its allowlist row (${reason})`,
      });
    }
  }

  for (const file of [...listSkillMarkdown(root), ...listTemplateMarkdown(root)]) {
    const text = read(root, file);
    if (text === null) continue;
    counts.skillFiles += 1;
    const lines = text.split("\n");
    for (const hit of nodeCommandLiterals(text)) {
      if (declaresFallback(lines, hit.line)) continue;
      violations.push({
        id: "node-command-literal",
        location: `${file}:${hit.line}`,
        detail: `\`node ${hit.target}\` teaches the fallback tool — use the preferred invocation or declare the fallback on the line`,
      });
    }
  }

  for (const guide of GUIDE_FILES) {
    const text = read(root, guide);
    if (text === null) {
      violations.push({ id: "guide-line", location: guide, detail: "agent guide is missing" });
      continue;
    }
    counts.guides += 1;
    if (!normalize(text).includes(normalize(GUIDE_LINE))) {
      violations.push({ id: "guide-line", location: guide, detail: `missing the normative sentence: ${GUIDE_LINE}` });
    }
  }

  for (const skill of TURN_BOX_FILES) {
    const text = read(root, skill);
    if (text === null) {
      violations.push({ id: "turn-box", location: skill, detail: "executor skill is missing" });
      continue;
    }
    counts.turnBoxes += 1;
    if (!normalize(text).includes(normalize(TURN_BOX))) {
      violations.push({ id: "turn-box", location: skill, detail: "the per-turn tool-choice box is missing or changed" });
    }
  }

  const guide = read(root, "AGENTS.md") ?? "";
  const missing = SUITE_CARVE_OUT.filter((token) => !guide.includes(token));
  if (missing.length > 0) {
    violations.push({
      id: "suite-carve-out",
      location: "AGENTS.md",
      detail: `the measured suite exception is incomplete; missing: ${missing.join(", ")}`,
    });
  }

  return { violations, allowed, counts };
}

export function report(root, scanResult) {
  const { violations, allowed, counts } = scanResult;
  const verdict = violations.length === 0 ? "PASS" : "FAIL";
  const lines = [
    "invocation-drift@1",
    `root: ${root}`,
    `verdict: ${verdict}`,
    `checked: ${counts.usageStrings} usage strings · ${counts.skillFiles} skill files · ${counts.guides} guides · ${counts.turnBoxes} turn contracts`,
  ];
  for (const row of allowed) lines.push(`allow: ${row.path} — ${row.reason}`);
  for (const row of violations) lines.push(`violation: ${row.id} | ${row.location} | ${row.detail}`);
  return { verdict, output: lines.join("\n") };
}

function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.error) {
    process.stderr.write(`usage: bun scripts/invocation-drift.mjs [--root <dir>]\n${parsed.error}\n`);
    return 2;
  }
  const result = report(parsed.root, scan(parsed.root));
  process.stdout.write(`${result.output}\n`);
  return result.verdict === "PASS" ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  process.exit(main(process.argv.slice(2)));
}
