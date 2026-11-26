#!/usr/bin/env node

/**
 * gate-producer-drift.mjs — the gate receipt's producer has a caller in the lane
 * (issue #728, unit `docs/features/728-gate-receipt-producer/`).
 *
 * The failure this gate exists for is not a wrong sentence, it is an absent
 * caller: `gate-receipt@1` shipped consumers (`review-verify`, `audit-pr`) and no
 * producer anywhere in the lane's execution path, so every unit landed with a
 * stale receipt and a reviewer re-ran the gate by hand. Measured at the cut: the
 * four step owners that do run a verification gate cited `gate-receipt` zero
 * times each.
 *
 * This gate reads fixed tokens and the owner block's fields — never a sentence it
 * would have to interpret — and fails closed on:
 *
 *   owner-block-missing     the `gate-producer@1` block is gone from its owner
 *                           (`skills/pre-execution-review/references/LEDGERS.md`)
 *   owner-field-missing     one of the six published fields is gone from it
 *   caller-command-missing  a gate-running step owner cites no producer command
 *   caller-owner-missing    a step owner cites the command but not the block, so
 *                           the rule it applies has no owner
 *   template-token-missing  the scaffold guide no longer declares the handshake a
 *                           project's gate must have (and the producer's command)
 *   default-gate-missing    the producer's default gate script is not in the tree
 *   default-gate-schema-missing
 *                           that script no longer publishes the handshake token
 *                           the receipt consumes
 *   ordering-inverted       a caller states the ordering law backwards: it claims
 *                           producing after the step's signed bytes would stale
 *                           the receipt, which is what producing before them does
 *
 * The owner block is the rule's one home (`gate-producer@1`); this gate restates
 * none of it. What it cannot decide — whether an agent actually ran the producer
 * at runtime — is stated in the unit's `decisions.md` §D7 instead of pretended
 * here.
 *
 * Usage
 *   bun scripts/gate-producer-drift.mjs             # this checkout
 *   bun scripts/gate-producer-drift.mjs --root <dir>
 *   (node fallback, same argv)
 *
 * stdout: one fixed, byte-stable block — a `gate-producer-drift —` header naming
 * the tree it read and the surface counts, one `FINDING <code> — <path>: <detail>`
 * line per finding in path order, then `verdict: PASS|FAIL`.
 * exit: 0 PASS, 1 at least one finding, 2 usage error.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { GATE_DEFAULT_SCRIPT, GATE_RESULT_SCHEMA } from "./gate-receipt.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The rule's one home, and the block that carries it. */
export const PRODUCER_OWNER = "skills/pre-execution-review/references/LEDGERS.md";
export const PRODUCER_BLOCK = "gate-producer@1";

/** The block's published fields, in the order the rule reads them. */
export const PRODUCER_FIELDS = Object.freeze([
  "owner",
  "command",
  "mark-slot",
  "ordering",
  "precondition",
  "absent",
]);

/** The step owners that run a verification gate. */
export const PRODUCER_CALLERS = Object.freeze([
  "execute-phase",
  "fold-findings",
  "unit-lane",
  "review-change",
]);

/** What a caller must cite: the block it applies and the command it runs. */
export const CALLER_TOKENS = Object.freeze([PRODUCER_BLOCK, "gate-receipt run"]);

/** The scaffold guide that declares the handshake a project's gate must have. */
export const TEMPLATE_GUIDE = "template/AGENTS.md";
export const TEMPLATE_TOKENS = Object.freeze([GATE_RESULT_SCHEMA, "gate-receipt run"]);

/**
 * The inverted ordering claim, stated once so a caller cannot restate it. A
 * receipt produced *after* the step's signed bytes is the fresh one; a site that
 * says the opposite has the law backwards, and a fold that followed it would
 * land stale by construction (issue #728, D4).
 */
export const ORDERING_INVERSION = /producing\s+after\s+(?:it|them|that|this)\s+would\s+leave\s+the\s+receipt\s+stale/iu;

const MARKDOWN = /\.md$/u;

/** Every markdown file under a directory, relative to it; `[]` when absent. */
function markdownFiles(root, relative) {
  const files = [];
  const walk = (absolute, prefix) => {
    let entries;
    try {
      entries = fs.readdirSync(absolute, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const childRelative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(absolute, entry.name), childRelative);
      else if (entry.isFile() && MARKDOWN.test(entry.name)) files.push(childRelative);
    }
  };
  walk(path.join(root, relative), "");
  return files.sort();
}

/** The file's text, or `null` when it is unreadable — absence is never a pass. */
function readOrNull(absolute) {
  try {
    return fs.readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
}

/** The block's `field | rule` rows, keyed by field, from the owner file's text. */
export function producerFields(text) {
  const fields = new Map();
  const fence = /```[a-zA-Z]*\n([\s\S]*?)```/gu;
  for (const match of String(text ?? "").matchAll(fence)) {
    const lines = match[1].replace(/\n$/u, "").split("\n");
    if (lines[0].trim() !== PRODUCER_BLOCK) continue;
    for (const line of lines.slice(1)) {
      const row = /^([a-z][a-z-]*)\s*\|/u.exec(line.trim());
      if (row) fields.set(row[1], line.trim());
    }
    return fields;
  }
  return null;
}

/**
 * The audit: four surfaces, one pass over fixed tokens. `root` is a checkout that
 * carries the skills tree, the scaffold guide and the default gate.
 */
export function audit({ root = REPO_ROOT } = {}) {
  const findings = [];
  const surfaces = [];
  const add = (code, target, detail) => findings.push({ code, path: target, detail });

  // 1. The rule's home: the block and its six fields.
  const ownerText = readOrNull(path.join(root, PRODUCER_OWNER));
  let owner = { block: false, fields: [], missing: [...PRODUCER_FIELDS] };
  if (ownerText === null) {
    add("owner-block-missing", PRODUCER_OWNER, `the file does not exist: the ${PRODUCER_BLOCK} block has no home`);
  } else {
    const fields = producerFields(ownerText);
    if (fields === null) {
      add("owner-block-missing", PRODUCER_OWNER, `no fenced ${PRODUCER_BLOCK} block`);
    } else {
      const missing = PRODUCER_FIELDS.filter((field) => !fields.has(field));
      owner = { block: true, fields: [...fields.keys()], missing };
      for (const field of missing) add("owner-field-missing", PRODUCER_OWNER, `the block declares no \`${field}\` field`);
    }
  }
  surfaces.push({ kind: "owner", path: PRODUCER_OWNER, ...owner });

  // 2. Every gate-running step owner cites the command and the block.
  for (const caller of PRODUCER_CALLERS) {
    const surface = `skills/${caller}`;
    const files = markdownFiles(root, surface);
    let commandCited = false;
    let ownerCited = false;
    for (const file of files) {
      const text = readOrNull(path.join(root, surface, file)) ?? "";
      if (text.includes(CALLER_TOKENS[1])) commandCited = true;
      if (text.includes(PRODUCER_BLOCK)) ownerCited = true;
    }
    if (!commandCited) {
      add("caller-command-missing", surface, "`gate-receipt run` is not cited: the gate is run beside the producer, never as it");
    }
    if (!ownerCited) {
      add("caller-owner-missing", surface, `the ${PRODUCER_BLOCK} block is not cited`);
    }
    surfaces.push({ kind: "caller", path: surface, commandCited, ownerCited });
  }

  // 3. No gate-running call site states the ordering law backwards.
  const orderingViolations = [];
  for (const caller of PRODUCER_CALLERS) {
    const surface = `skills/${caller}`;
    for (const file of markdownFiles(root, surface)) {
      const text = readOrNull(path.join(root, surface, file)) ?? "";
      if (!ORDERING_INVERSION.test(text)) continue;
      orderingViolations.push({ path: surface, detail: "a call site claims producing after the step's signed bytes would stale the receipt" });
      break;
    }
  }

  // 4. The scaffold guide declares the handshake, or the producer has no
  //    precondition a project could satisfy.
  const guideText = readOrNull(path.join(root, TEMPLATE_GUIDE));
  if (guideText === null) {
    add("template-token-missing", TEMPLATE_GUIDE, "the file does not exist");
    surfaces.push({ kind: "template", path: TEMPLATE_GUIDE, missing: [...TEMPLATE_TOKENS] });
  } else {
    const missing = TEMPLATE_TOKENS.filter((token) => !guideText.includes(token));
    if (missing.length > 0) add("template-token-missing", TEMPLATE_GUIDE, `missing ${missing.join(", ")}`);
    surfaces.push({ kind: "template", path: TEMPLATE_GUIDE, missing });
  }

  // 5. The producer's default gate is this repository's, and it publishes the
  //    handshake — a rename there breaks the default with no other signal.
  const gateText = readOrNull(path.join(root, GATE_DEFAULT_SCRIPT));
  const gateSurface = { kind: "default-gate", path: GATE_DEFAULT_SCRIPT, present: gateText !== null };
  if (gateText === null) {
    add("default-gate-missing", GATE_DEFAULT_SCRIPT, "the producer's default gate script is not in the tree");
  } else if (!gateText.includes(GATE_RESULT_SCHEMA)) {
    add("default-gate-schema-missing", GATE_DEFAULT_SCRIPT, `the script does not publish ${GATE_RESULT_SCHEMA}`);
    gateSurface.schema = false;
  }
  surfaces.push(gateSurface);

  findings.sort((left, right) => (left.path === right.path ? left.code.localeCompare(right.code) : left.path.localeCompare(right.path)));
  const orderingFindings = orderingViolations.map((violation) => ({ code: "ordering-inverted", ...violation }));
  const all = [...findings, ...orderingFindings].sort((left, right) => (left.path === right.path ? left.code.localeCompare(right.code) : left.path.localeCompare(right.path)));
  return { ok: all.length === 0, verdict: all.length === 0 ? "PASS" : "FAIL", owner, surfaces, findings: all, orderingViolations };
}

/** The fixed block, byte-stable for one tree and one result. */
export function render(result, label) {
  const count = (kind) => result.surfaces.filter((surface) => surface.kind === kind).length;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const header = [
    `gate-producer-drift — ${label}`,
    plural(count("caller"), "caller", "callers"),
    plural(count("owner"), "owner block", "owner blocks"),
    plural(count("template"), "template guide", "template guides"),
    plural(result.findings.length, "finding", "findings"),
  ].join(" · ");
  const lines = [header];
  for (const finding of result.findings) lines.push(`FINDING ${finding.code} — ${finding.path}: ${finding.detail}`);
  lines.push(`verdict: ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: bun scripts/gate-producer-drift.mjs [--root <dir>]   (node fallback, same argv)";

function usage(message) {
  process.stderr.write(`gate-producer-drift: ${message}\n${USAGE}\n`);
  process.exit(2);
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  let root = REPO_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg !== "--root") usage(`unknown argument ${arg}`);
    const value = argv[index + 1];
    if (value === undefined) usage("--root needs a directory");
    root = path.resolve(value);
    index += 1;
  }
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) usage(`not a directory: ${root}`);

  const result = audit({ root });
  process.stdout.write(render(result, path.basename(root)));
  return result.ok ? 0 : 1;
}

// Run only as a program: the sibling suite imports the audit and the block.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
