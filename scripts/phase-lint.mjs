#!/usr/bin/env node
/**
 * phase-lint.mjs — deterministic checker for the eight phase-lint rules.
 *
 * The rules, the fixed PASS/BLOCKED result, and the normalized phase
 * fingerprint are owned by `skills/phase-contract/SKILL.md`; this script only
 * mechanizes checking them (it never carries a second copy of rule semantics).
 *
 * Usage
 *   bun scripts/phase-lint.mjs <plan.md>      (node fallback, same argv)
 *
 * stdout: one fixed, byte-stable text block — a `Phase-lint:` line per phase,
 * one `<rule-id>: <finding>` line per failing rule, a final verdict line, and a
 * `fingerprint: <sha256>` line over the newline-joined per-phase fingerprints.
 * exit: 0 only when every phase is `PASS (8/8)` and the verdict is `PASS`.
 *
 * Fail-closed reason codes: `missing-plan` (no argument, or a path that does
 * not exist), `no-phases` (readable file with zero phase headings),
 * `unparseable` (unreadable file, missing/out-of-enum `Layer:` line, or a task
 * target the frozen prefix table cannot map), `lint-blocked` (a rule failure).
 *
 * Read-only: never writes, never calls the network, no external dependencies.
 *
 * Deterministic approximations (frozen by the unit's SPEC §Design and pinned by
 * `scripts/phase-lint.test.mjs`): the `→` chain test counts arrows, so one arrow
 * is an outcome annotation and two or more are a chain; "enumerated cases" means
 * numbered/lettered markers or ordinal words, not a bare comma list; the box-2
 * target is the first path-like token outside a backticked command span.
 */

import fs from "node:fs";
import process from "node:process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const LAYERS = ["schema/db", "domain", "api", "ui", "config/infra", "docs", "hardening", "close-out"];
const HARDENING_LAYERS = new Set(["hardening", "close-out"]);
const HARDENING_TITLE = "Hardening & PR";
const RUNTIME_WORDS = new Set(["bun", "node", "npm", "npx", "git", "grep", "diff", "test", "gh"]);
const EXTENSIONS = [".md", ".mjs", ".js", ".json", ".yml", ".yaml", ".ts"];
const PATH_TOKEN = /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/?$/;
const HAS_LETTER = /[A-Za-z]/;
const PHASE_HEADING = /^#{2,4}\s+P(\d+)\s*[—-]\s*(\S.*)$/;
const INLINE_COMMAND = /`([^`]*)`/g;
const CREATION_VERB = /\b(?:create|creates|created|write|writes|written|scaffold|scaffolds|add a new file|new file)\b/i;
const ENUMERATED = /(?:^|\s)\((?:\d+|[a-h])\)|(?:^|\s)\d+[.)]\s|\b(?:first|second|third|fourth|fifth)\b/gi;

/** Strip backticked spans that are quoted commands (a runtime word leads them). */
function stripQuotedCommands(text) {
  return text.replace(INLINE_COMMAND, (whole, inner) => {
    const head = inner.trim().split(/\s+/)[0].replace(/:$/, "");
    return RUNTIME_WORDS.has(head) ? " " : whole;
  });
}

/** Every path-like token in the text, outside quoted command spans. */
function pathTokens(text) {
  const tokens = [];
  for (const raw of stripQuotedCommands(text).split(/\s+/)) {
    const token = raw.replace(/^[`"'({\[]+/, "").replace(/[`"')\]}.,;:!?]+$/, "");
    if (!PATH_TOKEN.test(token)) continue;
    // A bare numeric ratio (`0/1`, a date) is an assertion, not a target file.
    if (!HAS_LETTER.test(token)) continue;
    if (token.includes("/") || EXTENSIONS.some((extension) => token.endsWith(extension))) tokens.push(token);
  }
  return tokens;
}

/** The frozen target-file → layer prefix table (SPEC §Design, box-2). */
function layerForTarget(target) {
  if (target.startsWith("skills/") || target.startsWith("docs/") || target.startsWith("template/")) return "docs";
  if (target.startsWith("scripts/") || target.startsWith("packages/") || target.startsWith(".github/") || target.startsWith(".agentic-workflow/")) return "config/infra";
  if (target.endsWith(".md")) return "docs";
  return null;
}

/** Title-deliverable: lowercased, kebab-cased, `&` a separator, articles dropped. */
function titleDeliverable(title) {
  return title
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\b(?:the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse the phase headings and their bodies out of a Markdown plan. */
function parsePhases(text) {
  const phases = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = PHASE_HEADING.exec(line);
    if (heading) {
      current = { number: Number(heading[1]), title: heading[2].trim(), body: [] };
      phases.push(current);
      continue;
    }
    if (current) current.body.push(line);
  }
  return phases.map((phase) => {
    const layerIndex = phase.body.findIndex((line) => /Layer:\s*\S/.test(line));
    const layer = layerIndex === -1 ? null : phase.body[layerIndex].replace(/.*?Layer:\s*/, "").trim().split(/\s+/)[0].replace(/[.,;:]+$/, "").replace(/^`|`$/g, "");
    const doneIndex = phase.body.findIndex((line) => /Done-when:/.test(line));
    let doneWhen = null;
    if (doneIndex !== -1) {
      const block = [phase.body[doneIndex].replace(/.*?Done-when:\s*/, "")];
      for (let i = doneIndex + 1; i < phase.body.length; i += 1) {
        if (phase.body[i].trim() === "" || /^\s*-\s*\[/.test(phase.body[i])) break;
        block.push(phase.body[i].trim());
      }
      doneWhen = block.join(" ").trim();
    }
    const tasks = phase.body
      .map((line) => /^\s*-\s*\[([ x])\]\s+(.+)$/.exec(line))
      .filter(Boolean)
      .map((match) => match[2].trim());
    return { ...phase, layer, doneWhen, tasks };
  });
}

function enumeratedCount(text) {
  const matches = text.match(ENUMERATED);
  return matches ? matches.length : 0;
}

function createdTargets(text) {
  if (!CREATION_VERB.test(text)) return [];
  return [...new Set(pathTokens(text))];
}

/** Box 1 — the title names ONE deliverable. */
const SYMBOL_JOINER = /[\p{L}\p{N}_]\s*[+,/&]\s*[\p{L}\p{N}_]/u;
const WORD_JOINER = /(?:^|[^\p{L}\p{N}_])[\p{L}\p{N}_]+\s+(?:and|y)\s+[\p{L}\p{N}_]+(?:$|[^\p{L}\p{N}_])/iu;
function box1(phase) {
  const title = phase.title.trim();
  if (title === HARDENING_TITLE) return [];
  if (SYMBOL_JOINER.test(title)) return [`title joins deliverables with “+”, “,”, “/” or “&”: “${title}”`];
  if (WORD_JOINER.test(title)) return [`title joins deliverables with “and”/“y”: “${title}”`];
  return [];
}

/** Box 2 — one declared layer; every task target belongs to it. */
function box2(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    const tokens = pathTokens(task);
    if (tokens.length === 0) continue;
    const target = tokens[0];
    const layer = layerForTarget(target);
    if (layer === null) return { findings, ambiguous: target };
    if (layer !== phase.layer) findings.push(`task ${index + 1} target \`${target}\` belongs to layer ${layer}, not ${phase.layer}`);
  }
  return { findings };
}

/** Box 3 — task count within the phase budget (the final close-out keeps ≤ 10). */
function box3(phase) {
  const limit = phase.finalCloseOut ? 10 : 8;
  return phase.tasks.length > limit ? [`phase has ${phase.tasks.length} tasks (limit ${limit} for layer ${phase.layer})`] : [];
}

/** Box 4 — one checkbox = one deliverable. */
function box4(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    const arrows = (task.match(/→/g) || []).length;
    if (arrows >= 2) {
      findings.push(`task ${index + 1} is a → chain of ${arrows + 1} steps`);
      continue;
    }
    const enumerated = enumeratedCount(task);
    if (enumerated > 3) {
      findings.push(`task ${index + 1} enumerates ${enumerated} cases`);
      continue;
    }
    const created = createdTargets(task);
    if (created.length > 1) findings.push(`task ${index + 1} creates ${created.length} files of distinct concerns`);
  }
  return findings;
}

/** Box 5 — zero decision words. */
function box5(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    if (/\b(?:decide|decides|decided|choose|chooses|choosing)\b/i.test(task)) findings.push(`task ${index + 1} carries a decision word`);
    else if (/\beither\b[\s\S]*\bor\b/i.test(task)) findings.push(`task ${index + 1} offers either/or alternatives`);
    else if (/\bif\b[^.]*\bthen\b[^.]*\b(?:add|remove|move|split|merge|defer)\w*\b/i.test(task)) findings.push(`task ${index + 1} carries an “If … then” scope change`);
  }
  return findings;
}

/** Box 6 — no conditional scope mutation across phases. */
function box6(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    if (/\b(?:moves?|defers?)\b[^.]*\b(?:to|into)\s+P\d+\b/i.test(task)) findings.push(`task ${index + 1} moves work to another phase`);
  }
  return findings;
}

/** Box 7 — no external/manual gates inside implementation phases. */
function box7(phase) {
  if (HARDENING_LAYERS.has(phase.layer)) return [];
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    if (/manual/i.test(task) || /\bask the user\b/i.test(task) || /\bgh pr\b/i.test(task)) {
      findings.push(`task ${index + 1} carries a manual/external gate outside the hardening phase`);
    }
  }
  return findings;
}

/** Box 8 — machine-checkable done-when. */
function box8(phase) {
  if (!phase.doneWhen) return ["phase body has no `Done-when:` line"];
  if (!/`[^`]+`/.test(phase.doneWhen)) return ["`Done-when:` carries no backticked command"];
  if (!/→|->|exit 0|exit zero|empty|matches|zero|\bpass(?:es|ed)?\b/i.test(phase.doneWhen)) return ["`Done-when:` carries no expected outcome"];
  return [];
}

const BOXES = [box1, box2, box3, box4, box5, box6, box7, box8];

/** Check one phase; returns { findings: [{box, reason}] } or { ambiguous }. */
function lintPhase(phase) {
  const findings = [];
  for (const [index, check] of BOXES.entries()) {
    const result = check(phase);
    if (result && !Array.isArray(result)) {
      if (result.ambiguous) return { ambiguous: result.ambiguous };
      for (const reason of result.findings) findings.push({ box: index + 1, reason });
      continue;
    }
    for (const reason of result) findings.push({ box: index + 1, reason });
  }
  return { findings };
}

/** The full run over one Markdown document. */
export function lintPlan(text) {
  const phases = parsePhases(text);
  if (phases.length === 0) return { verdict: "BLOCKED: no-phases", exitCode: 1, lines: ["verdict BLOCKED: no-phases", `fingerprint: ${digest([])}`] };

  for (const phase of phases) {
    if (!phase.layer || !LAYERS.includes(phase.layer)) {
      return { verdict: "BLOCKED: unparseable", exitCode: 1, lines: ["verdict BLOCKED: unparseable", `fingerprint: ${digest([])}`] };
    }
  }

  // The ≤10 task budget belongs to the FINAL hardening/close-out phase only
  // (owner rule 3; SPEC §Design box-3) — a mid-plan `hardening` phase keeps 8.
  let finalCloseOutIndex = -1;
  phases.forEach((phase, index) => {
    if (HARDENING_LAYERS.has(phase.layer)) finalCloseOutIndex = index;
  });
  phases.forEach((phase, index) => {
    phase.finalCloseOut = index === finalCloseOutIndex;
  });

  const fingerprints = [];
  const results = [];
  for (const phase of phases) {
    fingerprints.push(`P${phase.number}:${phase.layer}:${phase.tasks.length}:${titleDeliverable(phase.title)}`);
    const result = lintPhase(phase);
    if (result.ambiguous) {
      return { verdict: "BLOCKED: unparseable", exitCode: 1, lines: ["verdict BLOCKED: unparseable", `fingerprint: ${digest([])}`] };
    }
    results.push({ phase, findings: result.findings });
  }

  const lines = [];
  let blocked = false;
  for (const [index, { phase, findings }] of results.entries()) {
    if (findings.length === 0) {
      lines.push(`P${phase.number} Phase-lint: PASS (8/8) · fingerprint ${fingerprints[index]}`);
      continue;
    }
    blocked = true;
    for (const finding of findings) lines.push(`P${phase.number} box-${finding.box}: ${finding.reason}`);
    lines.push(`P${phase.number} Phase-lint: BLOCKED — box ${findings[0].box}: ${findings[0].reason}`);
  }
  lines.push(blocked ? "verdict BLOCKED: lint-blocked" : "verdict PASS");
  lines.push(`fingerprint: ${digest(fingerprints)}`);
  return { verdict: blocked ? "BLOCKED: lint-blocked" : "PASS", exitCode: blocked ? 1 : 0, lines };
}

function digest(fingerprints) {
  return createHash("sha256").update(fingerprints.join("\n")).digest("hex");
}

/** CLI: one explicit path argument, nothing else. */
function main(argv) {
  const file = argv[0];
  if (!file) return { verdict: "BLOCKED: missing-plan", exitCode: 1, lines: ["verdict BLOCKED: missing-plan", `fingerprint: ${digest([])}`] };
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    const code = error && error.code === "ENOENT" ? "missing-plan" : "unparseable";
    return { verdict: `BLOCKED: ${code}`, exitCode: 1, lines: [`verdict BLOCKED: ${code}`, `fingerprint: ${digest([])}`] };
  }
  return lintPlan(text);
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  const result = main(process.argv.slice(2));
  process.stdout.write(`${result.lines.join("\n")}\n`);
  process.exit(result.exitCode);
}
