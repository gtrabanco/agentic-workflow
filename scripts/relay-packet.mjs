#!/usr/bin/env node
/**
 * relay-packet.mjs — the read-only checker for a lane unit's Relay packet.
 *
 * pi-web owns Relay: it validates the packet on dispatch and it owns the tool.
 * This script owns the half the lane can check offline, before any dispatch:
 *
 *   check        is the packet a pointer-shaped Relay packet for this unit?
 *   budget       does the leg handover (charter + baton) fit the declared ceiling?
 *   tiers        which tier does each leg run at, read from the catalog?
 *   obligations  is the unit's obligations ledger closed?
 *
 * The packet contract (three documents, pi-web's names and bounds) and the
 * division of ownership are published in `skills/unit-lane/references/RELAY.md`;
 * the `REVIEW-VERDICT` grammar is owned by
 * `skills/unit-lane/references/REVIEW.md`; the leg tiers come from
 * `scripts/catalog.json` and the ceiling from
 * `docs/workflow/SKILL_CONTEXT_BUDGETS.json`. This script mechanizes those, it
 * never redefines them.
 *
 * Usage
 *   bun scripts/relay-packet.mjs check <unit> [--packet <dir>]
 *   bun scripts/relay-packet.mjs budget <unit> [--packet <dir>]
 *   bun scripts/relay-packet.mjs tiers <unit>
 *   bun scripts/relay-packet.mjs obligations <unit>
 *   (node fallback, same argv)
 *
 * stdout: one fixed block per mode, ending with `verdict: PASS|FAIL`.
 * exit: 0 PASS; 1 FAIL (a fault the packet or ledger carries); 2 a usage error,
 * an unknown/ambiguous unit, or a missing manifest the check needs.
 *
 * Read-only: it reads the workspace and two manifests, writes nothing, spawns
 * no shell, calls no network, and holds no state between runs. No document text
 * is echoed: every value printed is either one of the closed vocabularies this
 * script validates or a path from its own candidate list, so no packet byte
 * reaches a consumer as instructions.
 *
 * `RELAY_PACKET_REPO` re-points the workspace; `RELAY_PACKET_CATALOG` and
 * `RELAY_PACKET_BUDGETS` re-point the two manifests, so a validation test
 * mutates its own copies instead of the tracked files.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { sectionText } from "./unit-doc-phases.mjs";

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The workspace under test: `--repo` wins over the environment, which wins over this tree. */
let WORKSPACE = process.env.RELAY_PACKET_REPO ? path.resolve(process.env.RELAY_PACKET_REPO) : MODULE_ROOT;
const CATALOG_PATH = process.env.RELAY_PACKET_CATALOG
  ? path.resolve(process.env.RELAY_PACKET_CATALOG)
  : path.join(MODULE_ROOT, "scripts", "catalog.json");
const BUDGETS_PATH = process.env.RELAY_PACKET_BUDGETS
  ? path.resolve(process.env.RELAY_PACKET_BUDGETS)
  : path.join(MODULE_ROOT, "docs", "workflow", "SKILL_CONTEXT_BUDGETS.json");

/** pi-web's own bound on one packet document; a packet above it cannot dispatch. */
export const PACKET_DOCUMENT_MAX_BYTES = 256 * 1024;
/** The three documents pi-web validates on dispatch, in its own order. */
export const PACKET_DOCUMENTS = Object.freeze(["charter.md", "status.md", "log.md"]);
/** The optional reasoning document; never required, never a checklist item. */
export const PACKET_OPTIONAL_DOCUMENTS = Object.freeze(["decisions.md"]);
/** The baton's closed state vocabulary (pi-web's Relay runner owns the meaning). */
export const BATON_STATES = Object.freeze(["Draft — awaiting approval", "Active", "Complete", "Needs help"]);
/** A leg identity, exactly pi-web's `dispatch_relay` shape. */
export const LEG_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,31}$/u;
/** The phase cursor: one phase label or `done` (the lane's own `P<n>` grammar). */
export const PHASE_CURSOR = /^(?:P\d+|done)$/u;
/** pi-web's `RELAY_ANCHOR_DOCUMENTS` order, so a reader sees status first. */
const BUDGET_DOCUMENTS = Object.freeze(["charter.md", "status.md"]);

const USAGE = `usage: bun scripts/relay-packet.mjs <check|budget|tiers|obligations> <unit> [--repo <dir>] [--packet <dir>]
  check        validate the packet: documents, charter pointer, baton grammar, verdict grammar
  budget       measure the leg handover (charter + baton) against the declared ceiling
  tiers        print each leg's tier from scripts/catalog.json
  obligations  verify the unit's obligations ledger is closed
  <unit>       an NN-slug unit token, or a unit directory path
  --repo       read the workspace from this directory (default: this repository)
  --packet     read the packet from this directory instead of .pi-web/relays/<slug>
`;

/* ------------------------------------------------------------------- shared */

function usage(message) {
  process.stderr.write(`relay-packet: ${message}\n`);
  process.stderr.write(USAGE);
  process.exit(2);
}

function fail(code, message) {
  process.stderr.write(`RELAY ERROR — ${message}\n`);
  process.exit(code);
}

const readOrNull = (relative) => {
  try {
    return fs.readFileSync(path.join(WORKSPACE, relative), "utf8");
  } catch {
    return null;
  }
};

/**
 * Resolve a unit token to its directory: an `NN-slug` under the two unit trees,
 * or an explicit path that already carries a `SPEC.md`. Ambiguity is an error,
 * never a first match.
 */
function resolveUnit(token) {
  const clean = String(token ?? "").replace(/\/+$/, "");
  if (clean === "") usage("a unit token is required");
  const candidates = [];
  if (clean.includes("/")) {
    if (fs.existsSync(path.join(WORKSPACE, clean, "SPEC.md"))) return { dir: clean, slug: path.basename(clean) };
    usage(`unit doc not found: ${clean}/SPEC.md`);
  }
  for (const tree of ["docs/features", "docs/fix"]) {
    const root = path.join(WORKSPACE, tree);
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === clean || entry.name.startsWith(`${clean}-`) || entry.name.split("-")[0] === clean) {
        candidates.push({ dir: `${tree}/${entry.name}`, slug: entry.name });
      }
    }
  }
  const unique = [...new Map(candidates.map((entry) => [entry.dir, entry])).values()];
  if (unique.length === 0) fail(2, `unknown unit: ${clean}`);
  if (unique.length > 1) fail(2, `ambiguous unit: ${clean} matches ${unique.map((entry) => entry.dir).join(", ")}`);
  return unique[0];
}

/** The packet directory: pi-web's default, or an explicit `--packet`. */
function packetPathOf(unit, explicit) {
  const relative = explicit ?? `.pi-web/relays/${unit.slug}`;
  return { relative: relative.replace(/^\.\//, "").replace(/\/+$/, ""), absolute: path.join(WORKSPACE, relative) };
}

function readManifest(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    fail(2, `${what} is missing: ${file}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return fail(2, `${what} is not valid JSON: ${file}`);
  }
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const ignoredExcerpt = (text, pattern) => pattern.test(text);

/* -------------------------------------------------------------------- baton */

/**
 * The one reader of the baton's state and leg cursor: `check` uses it to
 * validate, the router uses it to decide what to print, so the grammar exists
 * once. Returns `null` for every field it cannot read — never a guess.
 */
export function batonOf(statusText) {
  const text = String(statusText ?? "");
  const stateCell = /^State:[ \t]*(.+?)[ \t]*$/m.exec(text)?.[1] ?? "";
  const state = BATON_STATES.find((candidate) => stateCell === candidate || stateCell.startsWith(`${candidate};`)) ?? null;
  const legsCell = /^Legs:[ \t]*(.+?)[ \t]*$/m.exec(text)?.[1] ?? "";
  const legsMatch = /^(none|[a-zA-Z0-9][a-zA-Z0-9._-]{0,31})[ \t]*→[ \t]*([a-zA-Z0-9][a-zA-Z0-9._-]{0,31})$/u.exec(legsCell);
  const phaseCell = /^Phase:[ \t]*(.+?)[ \t]*$/m.exec(text)?.[1] ?? "";
  return {
    state,
    stateCell,
    lastLeg: legsMatch ? legsMatch[1] : null,
    nextLeg: legsMatch ? legsMatch[2] : null,
    legsCell,
    phase: PHASE_CURSOR.test(phaseCell) ? phaseCell : null,
    phaseCell,
  };
}

/* ------------------------------------------------------------------- verdict */

/**
 * The `REVIEW-VERDICT` block, exactly as `skills/unit-lane/references/REVIEW.md`
 * publishes it: one verdict line and three fixed report lines, nothing else.
 * Returns `null` when the document carries no block at all, and
 * `{ fault }` when it carries one that does not match.
 */
export function reviewVerdictOf(unitDoc) {
  const text = String(unitDoc ?? "");
  if (!text.includes("REVIEW-VERDICT")) return null;
  const lines = text.split("\n").map((line) => line.replace(/\s+$/u, ""));
  const start = lines.findIndex((line) => line.startsWith("REVIEW-VERDICT"));
  const block = lines.slice(start, start + 4);
  if (block.length < 4) return { fault: "the block is truncated: four lines are required" };
  if (!/^REVIEW-VERDICT: (?:PASS|FAIL)$/u.test(block[0])) return { fault: "the verdict line must read `REVIEW-VERDICT: PASS` or `REVIEW-VERDICT: FAIL`" };
  if (!/^- Findings: \d+ material, \d+ report-notes$/u.test(block[1])) return { fault: "the findings line must read `- Findings: <n> material, <n> report-notes`" };
  if (!/^- Evidence reproduced: (?:yes|no)$/u.test(block[2])) return { fault: "the evidence line must read `- Evidence reproduced: yes` or `no`" };
  if (block[3] !== "- AC integrity: unchanged from triage") return { fault: "the integrity line must read `- AC integrity: unchanged from triage`" };
  const fifth = lines[start + 4] ?? "";
  if (fifth.startsWith("- ")) return { fault: "the block carries a fifth report line; the grammar publishes three" };
  return { verdict: block[0].slice("REVIEW-VERDICT: ".length) };
}

/* --------------------------------------------------------------------- check */

/** Fault classes the charter may not carry: the plan and the gates stay in the unit doc. */
const PLAN_IN_CHARTER = [
  [/(?:^|\n)[ \t]*[-*][ \t]+P\d+[ \t]+[—-]/u, "a `P<n> —` task bullet"],
  [/\(validator:/u, "a `(validator: …)` span"],
  [/^#{2,3}[ \t]+(?:Tasks|Evidence|Progress log)[ \t]*$/mu, "a plan or evidence heading"],
];

const EVIDENCE_IN_BATON = [
  [/(?:^|\n)[ \t]*\|[ \t]*AC\d*[ \t]*\|/u, "an `| AC |` evidence row"],
  [/^#{2,3}[ \t]+(?:Evidence|Progress log)[ \t]*$/mu, "a plan or evidence heading"],
];

const firstMatch = (text, patterns) => {
  for (const [pattern, label] of patterns) {
    const match = pattern.exec(text);
    if (match === null) continue;
    const line = text.slice(0, match.index).split("\n").length;
    return { label, line };
  }
  return null;
};

function readDocument(absolute, document, faults) {
  if (!fs.existsSync(absolute)) {
    faults.push(`${document} is missing`);
    return null;
  }
  const info = fs.statSync(absolute);
  if (!info.isFile()) {
    faults.push(`${document} must be a regular file`);
    return null;
  }
  const bytes = fs.readFileSync(absolute);
  if (bytes.length === 0) {
    faults.push(`${document} must contain saved text`);
    return null;
  }
  if (bytes.length > PACKET_DOCUMENT_MAX_BYTES) {
    faults.push(`${document} must be at most ${PACKET_DOCUMENT_MAX_BYTES} bytes`);
    return null;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    faults.push(`${document} must be UTF-8 text`);
    return null;
  }
  if (text.trim() === "" || text.includes("\0")) {
    faults.push(`${document} must contain saved text`);
    return null;
  }
  return text;
}

function runCheck(unit, packet) {
  const faults = [];
  const packetExists = fs.existsSync(packet.absolute);
  if (!packetExists) {
    faults.push(`packet is missing: ${packet.relative}`);
  } else if (!fs.statSync(packet.absolute).isDirectory()) {
    faults.push(`packet must be a directory: ${packet.relative}`);
  }

  const documents = {};
  if (packetExists && fs.statSync(packet.absolute).isDirectory()) {
    for (const document of [...PACKET_DOCUMENTS, ...PACKET_OPTIONAL_DOCUMENTS]) {
      const absolute = path.join(packet.absolute, document);
      const optional = PACKET_OPTIONAL_DOCUMENTS.includes(document);
      if (optional && !fs.existsSync(absolute)) continue;
      const text = readDocument(absolute, document, faults);
      if (text !== null) documents[document] = text;
    }
  }

  const unitDocPath = `${unit.dir}/SPEC.md`;
  const unitDoc = readOrNull(unitDocPath);

  if (documents["charter.md"] !== undefined) {
    const charter = documents["charter.md"];
    if (!charter.includes(unitDocPath)) {
      faults.push(`charter.md names no existing unit doc: expected \`${unitDocPath}\``);
    } else if (unitDoc === null) {
      faults.push(`charter.md names no existing unit doc: \`${unitDocPath}\` is absent from the workspace`);
    }
    const restated = firstMatch(charter, PLAN_IN_CHARTER);
    if (restated !== null) faults.push(`charter restates the plan: ${restated.label} at charter.md:${restated.line}`);
  }

  const baton = documents["status.md"] === undefined ? null : batonOf(documents["status.md"]);
  if (documents["status.md"] !== undefined) {
    if (baton.state === null) {
      faults.push(`status.md: state must be one of ${BATON_STATES.join(", ")} (got \`${baton.stateCell.slice(0, 40)}\`)`);
    }
    if (baton.nextLeg === null) {
      faults.push("status.md: leg cursor must read `Legs: <leg> \u2192 <leg>` with a pi-web leg identity on each side");
    }
    if (baton.phase === null) {
      faults.push("status.md: phase cursor must read `Phase: P<n>` (the phase this leg starts) or `Phase: done`");
    }
    const duplicated = firstMatch(documents["status.md"], EVIDENCE_IN_BATON);
    if (duplicated !== null) faults.push(`baton duplicates the unit doc's evidence: ${duplicated.label} at status.md:${duplicated.line}`);
  }

  if (documents["log.md"] !== undefined && !/^#{2,3}[ \t]+Leg[ \t]+\S+/mu.test(documents["log.md"])) {
    faults.push("log.md carries no leg entry: add a `## Leg <id>` heading per leg");
  }

  const verdict = unitDoc === null ? null : reviewVerdictOf(unitDoc);
  if (verdict?.fault !== undefined) {
    faults.push(`REVIEW-VERDICT does not match the grammar owned by skills/unit-lane/references/REVIEW.md: ${verdict.fault}`);
  }

  const bytes = PACKET_DOCUMENTS.map((document) => documents[document] ?? "").join("\u0000");
  const record = [
    `RELAY-PACKET — ${unit.slug}`,
    `packet: ${packet.relative}`,
    `state: ${baton?.state ?? "unreadable"}`,
    `legs: ${baton?.nextLeg ? `${baton.lastLeg} → ${baton.nextLeg}` : "-"}`,
    `phase: ${baton?.phase ?? "-"}`,
    `verdict: ${faults.length === 0 ? "PASS" : "FAIL"}`,
  ];
  if (faults.length > 0) record.push("faults:", ...faults.map((fault) => `  - ${fault}`));
  record.push(`fingerprint: ${sha256(bytes).slice(0, 16)}`);
  process.stdout.write(`${record.join("\n")}\n`);
  return faults.length === 0 ? 0 : 1;
}

/* -------------------------------------------------------------------- budget */

function runBudget(unit, packet) {
  const manifest = readManifest(BUDGETS_PATH, "the budgets manifest");
  const ceiling = manifest?.relays?.legHandoverEstimateMax;
  if (!Number.isFinite(ceiling)) {
    fail(2, `the budgets manifest declares no relays.legHandoverEstimateMax (${path.relative(MODULE_ROOT, BUDGETS_PATH)})`);
  }
  const faults = [];
  let bytes = 0;
  let lineTotal = 0;
  for (const document of BUDGET_DOCUMENTS) {
    const text = readOrNull(path.join(packet.relative, document));
    if (text === null) {
      faults.push(`${document} is missing, so the handover cannot be measured`);
      continue;
    }
    bytes += Buffer.byteLength(text, "utf8");
    lineTotal += text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  }
  const measured = Math.ceil(bytes / 4);
  if (measured > ceiling) faults.push(`measured ${measured} est > ceiling ${ceiling} est`);
  const lineCeiling = manifest?.relays?.legHandoverLinesMax;
  if (Number.isFinite(lineCeiling) && lineTotal > lineCeiling) {
    faults.push(`measured ${lineTotal} lines > ceiling ${lineCeiling} lines`);
  }
  const record = [
    `RELAY-BUDGET — ${unit.slug}`,
    `handover: ${BUDGET_DOCUMENTS.join(" + ")}`,
    `measured: ${measured} est`,
    `lines: ${lineTotal}`,
    `ceiling: ${ceiling} est`,
    `lines-ceiling: ${Number.isFinite(lineCeiling) ? lineCeiling : "n/a"}`,
    `verdict: ${faults.length === 0 ? "PASS" : "FAIL"}`,
  ];
  if (faults.length > 0) record.push("faults:", ...faults.map((fault) => `  - ${fault}`));
  process.stdout.write(`${record.join("\n")}\n`);
  return faults.length === 0 ? 0 : 1;
}

/* --------------------------------------------------------------------- tiers */

function runTiers(unit) {
  const catalog = readManifest(CATALOG_PATH, "the catalog");
  const legs = catalog?.relay?.legs;
  if (legs === undefined || legs === null) {
    fail(2, "catalog: no relay leg mapping (`relay.legs`) — the leg tiers have one source and it is missing");
  }
  const tiers = {};
  for (const leg of ["execute", "coherence-review"]) {
    const step = legs[leg]?.step;
    if (typeof step !== "string") fail(2, `catalog: relay leg ${leg} names no step`);
    const tier = catalog?.catalog?.[step]?.budget_tier;
    if (tier !== "cheap" && tier !== "strong") fail(2, `catalog: step ${step} has no budget_tier (expected cheap or strong)`);
    tiers[leg] = tier;
  }
  process.stdout.write(
    [
      `RELAY-TIERS — ${unit.slug}`,
      `execute: ${tiers.execute}`,
      `coherence-review: ${tiers["coherence-review"]}`,
      "source: scripts/catalog.json",
      "verdict: PASS",
    ].join("\n") + "\n",
  );
  return 0;
}

/* --------------------------------------------------------------- obligations */

const OBLIGATION_HEADER = /^\|\s*obligation-id\s*\|/u;

function obligationRows(text) {
  const rows = [];
  const lines = String(text ?? "").split("\n");
  let inTable = false;
  for (const line of lines) {
    if (OBLIGATION_HEADER.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.trimStart().startsWith("|")) {
      inTable = false;
      continue;
    }
    if (/^\|[\s|:-]+\|$/u.test(line.trim())) continue;
    const cells = line.trim().replace(/^\|/u, "").replace(/\|$/u, "").split("|").map((cell) => cell.trim());
    if (cells.length !== 9) continue;
    rows.push({ id: cells[0], evidence: cells[7], status: cells[8] });
  }
  return rows;
}

const NO_EVIDENCE = new Set(["", "—", "-", "n/a"]);

function runObligations(unit) {
  const relative = `${unit.dir}/planning-obligations.md`;
  const text = readOrNull(relative);
  if (text === null) fail(2, `planning-obligations.md is missing: ${relative}`);
  const rows = obligationRows(text);
  if (rows.length === 0) fail(2, `planning-obligations.md carries no row: ${relative}`);
  const open = [];
  let verified = 0;
  let notApplicable = 0;
  for (const row of rows) {
    if (row.status === "verified") {
      verified += 1;
    } else if (row.status === "n/a") {
      if (NO_EVIDENCE.has(row.evidence)) open.push(`${row.id}: n/a without evidence`);
      else notApplicable += 1;
    } else {
      open.push(`${row.id}: ${row.status || "blank"}`);
    }
  }
  const record = [
    `RELAY-OBLIGATIONS — ${unit.slug}`,
    `rows: ${rows.length}`,
    `verified: ${verified}`,
    "n/a: " + String(notApplicable),
    `open: ${open.length}`,
    `verdict: ${open.length === 0 ? "PASS" : "FAIL"}`,
  ];
  if (open.length > 0) record.push("faults:", ...open.map((fault) => `  - ${fault}`));
  process.stdout.write(`${record.join("\n")}\n`);
  return open.length === 0 ? 0 : 1;
}

/* ---------------------------------------------------------------------- main */

function main(argv) {
  const args = argv.slice(2).filter((arg) => arg !== "");
  if (args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  const mode = args[0];
  if (!["check", "budget", "tiers", "obligations"].includes(mode)) usage("the first argument names the mode");
  const positional = [];
  let packet = null;
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] === "--repo") {
      const value = args[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      if (!fs.existsSync(path.resolve(value))) usage(`--repo directory does not exist: ${value}`);
      WORKSPACE = path.resolve(value);
      index += 1;
    } else if (args[index] === "--packet") {
      const value = args[index + 1];
      if (value === undefined) usage("--packet needs a directory");
      packet = value;
      index += 1;
    } else if (args[index].startsWith("--")) {
      usage(`unknown flag: ${args[index]}`);
    } else {
      positional.push(args[index]);
    }
  }
  if (positional.length !== 1) usage("exactly one unit token is required");
  if (packet !== null && mode !== "check" && mode !== "budget") usage(`--packet does not apply to ${mode}`);

  const unit = resolveUnit(positional[0]);
  const resolved = packetPathOf(unit, packet);
  if (mode === "check") process.exit(runCheck(unit, resolved));
  if (mode === "budget") process.exit(runBudget(unit, resolved));
  if (mode === "tiers") process.exit(runTiers(unit));
  process.exit(runObligations(unit));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv);
}
