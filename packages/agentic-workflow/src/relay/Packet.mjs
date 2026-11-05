/**
 * relay/Packet.mjs — the lane's offline half of the Relay packet contract.
 *
 * pi-web owns Relay: it validates the packet on dispatch and it owns the tool.
 * This module owns what the lane can check offline, before any dispatch:
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
 * `docs/workflow/SKILL_CONTEXT_BUDGETS.json`. This module mechanizes those, it
 * never redefines them.
 *
 * Read-only and host-free: it reads the workspace and two manifests, writes
 * nothing, spawns no shell, calls no network, and holds no state between runs.
 * No document text is echoed: every value printed is either one of the closed
 * vocabularies it validates or a path from its own candidate list, so no packet
 * byte reaches a consumer as instructions.
 *
 * Two callers share it — `scripts/relay-packet.mjs` (a workspace that carries
 * the workflow's scripts) and `agentic-workflow relay` (a project that has only
 * the crate) — so the block grammar and the exit codes have one owner here.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
/** The four modes, in the order the usage strings list them. */
export const RELAY_MODES = Object.freeze(["check", "budget", "tiers", "obligations"]);
/** pi-web's `RELAY_ANCHOR_DOCUMENTS` order, so a reader sees status first. */
const BUDGET_DOCUMENTS = Object.freeze(["charter.md", "status.md"]);

/**
 * A usage error: an unknown flag, an unresolvable unit, or a manifest the mode
 * needs. The caller prints the message and exits 2 — the module never exits.
 */
export class RelayUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "RelayUsageError";
  }
}

/* ------------------------------------------------------------------- shared */

const readOrNull = (workspace, relative) => {
  try {
    return fs.readFileSync(path.join(workspace, relative), "utf8");
  } catch {
    return null;
  }
};

/**
 * Resolve a unit token to its directory: an `NN-slug` under the two unit trees,
 * or an explicit path that already carries a `SPEC.md`. Ambiguity is an error,
 * never a first match.
 */
export function resolveUnit(workspace, token) {
  const clean = String(token ?? "").replace(/\/+$/, "");
  if (clean === "") throw new RelayUsageError("a unit token is required");
  const candidates = [];
  if (clean.includes("/")) {
    if (fs.existsSync(path.join(workspace, clean, "SPEC.md"))) return { dir: clean, slug: path.basename(clean) };
    throw new RelayUsageError(`unit doc not found: ${clean}/SPEC.md`);
  }
  for (const tree of ["docs/features", "docs/fix"]) {
    const root = path.join(workspace, tree);
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
  if (unique.length === 0) throw new RelayUsageError(`unknown unit: ${clean}`);
  if (unique.length > 1) throw new RelayUsageError(`ambiguous unit: ${clean} matches ${unique.map((entry) => entry.dir).join(", ")}`);
  return unique[0];
}

/** The packet directory: pi-web's default, or an explicit `--packet`. */
export function packetPathOf(workspace, unit, explicit) {
  const relative = (explicit ?? `.pi-web/relays/${unit.slug}`).replace(/^\.\//, "").replace(/\/+$/, "");
  return { relative, absolute: path.join(workspace, relative) };
}

function readManifest(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    throw new RelayUsageError(`${what} is missing: ${file}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new RelayUsageError(`${what} is not valid JSON: ${file}`);
  }
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

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

export function checkPacket({ workspace, unit, packet }) {
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
  const unitDoc = readOrNull(workspace, unitDocPath);

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
  const lines = [
    `RELAY-PACKET — ${unit.slug}`,
    `packet: ${packet.relative}`,
    `state: ${baton?.state ?? "unreadable"}`,
    `legs: ${baton?.nextLeg ? `${baton.lastLeg} → ${baton.nextLeg}` : "-"}`,
    `phase: ${baton?.phase ?? "-"}`,
    `verdict: ${faults.length === 0 ? "PASS" : "FAIL"}`,
  ];
  if (faults.length > 0) lines.push("faults:", ...faults.map((fault) => `  - ${fault}`));
  lines.push(`fingerprint: ${sha256(bytes).slice(0, 16)}`);
  return { lines, exit: faults.length === 0 ? 0 : 1 };
}

/* -------------------------------------------------------------------- budget */

export function budgetPacket({ workspace, unit, packet, budgetsPath, budgetsLabel }) {
  const manifest = readManifest(budgetsPath, "the budgets manifest");
  const ceiling = manifest?.relays?.legHandoverEstimateMax;
  if (!Number.isFinite(ceiling)) {
    throw new RelayUsageError(`the budgets manifest declares no relays.legHandoverEstimateMax (${budgetsLabel})`);
  }
  const faults = [];
  let bytes = 0;
  let lineTotal = 0;
  for (const document of BUDGET_DOCUMENTS) {
    const text = readOrNull(workspace, path.join(packet.relative, document));
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
  const lines = [
    `RELAY-BUDGET — ${unit.slug}`,
    `handover: ${BUDGET_DOCUMENTS.join(" + ")}`,
    `measured: ${measured} est`,
    `lines: ${lineTotal}`,
    `ceiling: ${ceiling} est`,
    `lines-ceiling: ${Number.isFinite(lineCeiling) ? lineCeiling : "n/a"}`,
    `verdict: ${faults.length === 0 ? "PASS" : "FAIL"}`,
  ];
  if (faults.length > 0) lines.push("faults:", ...faults.map((fault) => `  - ${fault}`));
  return { lines, exit: faults.length === 0 ? 0 : 1 };
}

/* --------------------------------------------------------------------- tiers */

export function tiersOf({ unit, catalogPath, catalogLabel }) {
  const catalog = readManifest(catalogPath, "the catalog");
  const legs = catalog?.relay?.legs;
  if (legs === undefined || legs === null) {
    throw new RelayUsageError("catalog: no relay leg mapping (`relay.legs`) — the leg tiers have one source and it is missing");
  }
  const tiers = {};
  for (const leg of ["execute", "coherence-review"]) {
    const step = legs[leg]?.step;
    if (typeof step !== "string") throw new RelayUsageError(`catalog: relay leg ${leg} names no step`);
    const tier = catalog?.catalog?.[step]?.budget_tier;
    if (tier !== "cheap" && tier !== "strong") throw new RelayUsageError(`catalog: step ${step} has no budget_tier (expected cheap or strong)`);
    tiers[leg] = tier;
  }
  return {
    tiers,
    lines: [
      `RELAY-TIERS — ${unit.slug}`,
      `execute: ${tiers.execute}`,
      `coherence-review: ${tiers["coherence-review"]}`,
      `source: ${catalogLabel}`,
      "verdict: PASS",
    ],
    exit: 0,
  };
}

/* --------------------------------------------------------------- obligations */

const OBLIGATION_HEADER = /^\|\s*obligation-id\s*\|/u;
/** The 9-column row shape `skills/pre-execution-review/references/LEDGERS.md` publishes. */
const OBLIGATION_CELLS = 9;

/** Split a Markdown table row on pipes that are not escaped (`\|`). */
function cellsOfRow(line) {
  const cells = [];
  let current = "";
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\\" && line[index + 1] === "|") {
      current += "|";
      index += 1;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

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
    const cells = cellsOfRow(line.trim()).slice(1, -1);
    // Fail closed: a row that does not carry the declared columns is a malformed
    // ledger, never a row this reader silently drops (a dropped row is an
    // unverified obligation hiding behind a PASS).
    if (cells.length !== OBLIGATION_CELLS) {
      rows.push({ malformed: cells.length });
      continue;
    }
    rows.push({ id: cells[0], evidence: cells[7], status: cells[8] });
  }
  return rows;
}

const NO_EVIDENCE = new Set(["", "—", "-", "n/a"]);

export function obligationsOf({ workspace, unit }) {
  const relative = `${unit.dir}/planning-obligations.md`;
  const text = readOrNull(workspace, relative);
  if (text === null) throw new RelayUsageError(`planning-obligations.md is missing: ${relative}`);
  const rows = obligationRows(text);
  if (rows.length === 0) throw new RelayUsageError(`planning-obligations.md carries no row: ${relative}`);
  const open = [];
  let verified = 0;
  let notApplicable = 0;
  for (const row of rows) {
    if (row.malformed !== undefined) {
      open.push(`a table row carries ${row.malformed} cells; the declared shape has ${OBLIGATION_CELLS} (escape a literal pipe as \\|)`);
      continue;
    }
    if (row.status === "verified") {
      verified += 1;
    } else if (row.status === "n/a") {
      if (NO_EVIDENCE.has(row.evidence)) open.push(`${row.id}: n/a without evidence`);
      else notApplicable += 1;
    } else {
      open.push(`${row.id}: ${row.status || "blank"}`);
    }
  }
  const lines = [
    `RELAY-OBLIGATIONS — ${unit.slug}`,
    `rows: ${rows.length}`,
    "verified: " + String(verified),
    "n/a: " + String(notApplicable),
    `open: ${open.length}`,
    `verdict: ${open.length === 0 ? "PASS" : "FAIL"}`,
  ];
  if (open.length > 0) lines.push("faults:", ...open.map((fault) => `  - ${fault}`));
  return { lines, exit: open.length === 0 ? 0 : 1 };
}

/* ---------------------------------------------------------------------- mode */

/**
 * Parse the shared argument grammar. `usage` is the caller's problem (each CLI
 * prints its own command line); every refusal is a `RelayUsageError` with the
 * wording the CLI prints after its own prefix.
 */
export function parseRelayArgs(args, { defaultWorkspace }) {
  if (!RELAY_MODES.includes(args[0])) throw new RelayUsageError("the first argument names the mode");
  const positional = [];
  let packet = null;
  let workspace = defaultWorkspace;
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] === "--repo") {
      const value = args[index + 1];
      if (value === undefined) throw new RelayUsageError("--repo needs a directory");
      if (!fs.existsSync(path.resolve(value))) throw new RelayUsageError(`--repo directory does not exist: ${value}`);
      workspace = path.resolve(value);
      index += 1;
    } else if (args[index] === "--packet") {
      const value = args[index + 1];
      if (value === undefined) throw new RelayUsageError("--packet needs a directory");
      packet = value;
      index += 1;
    } else if (args[index].startsWith("--")) {
      throw new RelayUsageError(`unknown flag: ${args[index]}`);
    } else {
      positional.push(args[index]);
    }
  }
  if (positional.length !== 1) throw new RelayUsageError("exactly one unit token is required");
  if (packet !== null && args[0] !== "check" && args[0] !== "budget") {
    throw new RelayUsageError(`--packet does not apply to ${args[0]}`);
  }
  return { mode: args[0], unitToken: positional[0], packet, workspace };
}

/** Run one mode: the block to print and the exit code, or a `RelayUsageError`. */
export function runRelayMode({ mode, workspace, unitToken, packet, catalogPath, catalogLabel, budgetsPath, budgetsLabel }) {
  const unit = resolveUnit(workspace, unitToken);
  const resolved = packetPathOf(workspace, unit, packet);
  if (mode === "check") return checkPacket({ workspace, unit, packet: resolved });
  if (mode === "budget") return budgetPacket({ workspace, unit, packet: resolved, budgetsPath, budgetsLabel });
  if (mode === "tiers") return tiersOf({ unit, catalogPath, catalogLabel });
  return obligationsOf({ workspace, unit });
}
