#!/usr/bin/env node

/**
 * unit-lineage.mjs — the machine surface of audit-pr's pre-execution lineage
 * gate (gate 1 of `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md`).
 *
 * The gate was prose end to end: the lane-era/legacy discriminator, the
 * triage-block currency check, and the obligation-closure rules existed as
 * sentences a reviewer re-implemented by hand — review findings F4/F5/F6/F7 on
 * fix/285 were answered with prose, and the cycle-4 review (F9–F13) rejected
 * that fold: the rules had no reader and no test. This module is that runtime.
 *
 * Discriminator (F10): the lane-era/legacy split is keyed on **evidence, not on
 * an author-controlled artifact**. The legacy path is entered only when the
 * unit's `progress.md` carries a plan receipt whose digest re-derives
 * (`pre-execution-snapshot.mjs verify --stage plan` exits 0 over the bound
 * bytes); a receipt that does not re-derive is never a pass — the check falls
 * through to the lane-era checks, so a planted or stale `progress.md` cannot
 * buy a weaker gate.
 *
 * Byte binding (F9): the lane-era currency check compares the unit doc's pasted
 * `## Triaged steps` block with the block `unit-route.mjs --triage` re-derives
 * from the doc's own facts. Triage output is a pure function of the unit doc's
 * bytes, so any tampering changes the re-derived lines and the check answers
 * BLOCKED — no separate digest surface is needed (the earlier "frozen digest
 * anchor" wording named a digest `unit-route.mjs` never emitted and is
 * retracted).
 *
 * Obligations (F11): the ledger — `### Obligations` inside the unit doc
 * (embedded shape) or `planning-obligations.md` (separate-file shape, never
 * both) — must carry ≥1 row, every row `verified` or an explicit `n/a:`.
 * Absent, empty, or open rows answer BLOCKED naming the ids.
 *
 * Fixed verdicts on stdout; diagnostics on stderr:
 *   LINEAGE OK — legacy (plan receipt re-derives) · obligations closed (<n>)
 *   LINEAGE OK — lane-era (triage block re-derives) · obligations closed (<n>)
 *   LINEAGE BLOCKED — <reason>        followed by  → Next: <route>
 *
 * Usage: node scripts/unit-lineage.mjs --unit <slug> [--root <dir>] [--json]
 * Exit: 0 OK · 1 BLOCKED · 2 usage/resolve error.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** Unescaped-pipe cell split — a markdown table escapes a literal `\|`. */
const CELL_RE = /(?<!\\)\|/;

/** The three triage lines the currency check compares, verbatim. */
const TRIAGE_LINE_NAMES = ["Steps", "Skipped", "Budget"];

/** Body of a `## <name>` section (to the next `## ` heading), or `null`. */
export function sectionBody(text, name) {
  const m = new RegExp(`^## ${name}\\s*$`, "m").exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = /^## /m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

/** The first fenced code block inside a section body, or `null`. */
function firstFencedBlock(body) {
  const m = /```[^\n]*\n([\s\S]*?)```/.exec(body ?? "");
  return m ? m[1] : null;
}

/**
 * Parse the pasted `## Triaged steps` block of a unit doc: the `Steps:` /
 * `Skipped:` / `Budget:` lines, or `null` when the block or any line is missing.
 */
export function parseTriagedBlock(doc) {
  const body = sectionBody(doc, "Triaged steps");
  const block = body === null ? null : firstFencedBlock(body);
  if (block === null) return null;
  const lines = {};
  for (const name of TRIAGE_LINE_NAMES) {
    const line = block.split("\n").find((l) => l.startsWith(`${name}:`));
    if (!line) return null;
    lines[name] = line.trim();
  }
  return lines;
}

/** Body of a `### <name>` subsection (to the next `###`/`##` heading), or `null`. */
function subsectionBody(text, name) {
  const m = new RegExp(`^### ${name}\\s*$`, "m").exec(text);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = /^### /m.exec(rest) ?? /^## /m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

const isObligationHeader = (cells) => (cells[0] ?? "").trim() === "obligation-id";
const isSeparatorRow = (cells) => cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));

/**
 * Parse obligation table rows. Status is valid when `verified` (the validator
 * ran on this candidate) or an explicit `n/a:` — anything else (planned,
 * in-progress, blank, deferred) is open. Returns `{ present, rows }` where each
 * row is `{ id, status, open }`, or `{ present: false }` when no table exists.
 * The `obligation-id` column must be `O\d+` or `AC-<name>`; `n/a` in that
 * column is a contract violation (the `status` column is the sole closure
 * signal per LEDGERS.md).
 */
export function parseObligationTable(text) {
  if (text === null || text === undefined) return { present: false };
  const tableLines = String(text).split("\n").filter((l) => l.trim().startsWith("|"));
  const parsed = tableLines.map((l) => {
    const cells = l.trim().split(CELL_RE).map((c) => c.trim());
    // the boundary pipes produce empty edge cells; drop them so cell 0 is the
    // first column and the last cell is the status column
    if (cells[0] === "") cells.shift();
    if (cells[cells.length - 1] === "") cells.pop();
    return cells;
  });
  const headerIndex = parsed.findIndex((cells) => isObligationHeader(cells));
  if (headerIndex === -1) return { present: false };
  const rows = [];
  for (const cells of parsed.slice(headerIndex + 1)) {
    if (cells.length < 2 || isSeparatorRow(cells)) continue;
    const id = cells[0] || "(blank id)";
    const status = cells[cells.length - 1] || "";
    // Only the status column determines closure (LEDGERS.md: `obligation-id`
    // is reserved for O\d+/AC-<name>; n/a there is a contract violation)
    const na = /^n\/a/i.test(status);
    rows.push({ id, status, open: !na && !/^verified$/i.test(status) });
  }
  return { present: true, rows };
}

/**
 * The unit's obligation ledger: the embedded `### Obligations` unit-doc section
 * first, then the separate `planning-obligations.md` file (never both).
 */
export function obligationLedger(doc, separateFileText) {
  const embedded = parseObligationTable(subsectionBody(doc, "Obligations"));
  if (embedded.present) {
    // "never both" — reject if a second shape is also present (LEDGERS.md)
    if (separateFileText !== null) {
      const separate = parseObligationTable(separateFileText);
      if (separate.present) {
        return { source: "both", present: true, rows: [],
          ok: false, reason: "never both: embedded and separate-file ledgers present simultaneously" };
      }
      // Separate has content but no valid table — use embedded (n/a note is a discharge)
      return { source: "embedded", ...embedded };
    }
    return { source: "embedded", ...embedded };
  }
  const separate = parseObligationTable(separateFileText);
  if (separate.present) return { source: "separate", ...separate };
  // a separate-file ledger may also discharge its duties with an `n/a:` note
  if (separateFileText !== null && /^n\/a\b/im.test(separateFileText)) {
    return { source: "separate", present: true, rows: [] };
  }
  return { source: "absent", present: false, rows: [] };
}

/** The differing triage line names, in fixed order — empty when identical. */
export function compareTriagedLines(pasted, rederived) {
  if (pasted === null || rederived === null) return [...TRIAGE_LINE_NAMES];
  return TRIAGE_LINE_NAMES.filter((name) => (pasted[name] ?? "") !== (rederived[name] ?? ""));
}

/** Classify the ledger: `{ ok, count, open }` per the closure rules. */
export function classifyObligations(ledger) {
  if (ledger.ok === false) return { ok: false, count: 0, open: [], reason: ledger.reason ?? "pre-classification check failed" };
  if (!ledger.present) return { ok: false, count: 0, open: [], reason: "no obligation ledger found (neither the embedded `### Obligations` section nor planning-obligations.md)" };
  if (ledger.rows.length === 0) return { ok: false, count: 0, open: [], reason: "the obligation ledger is empty (zero rows) — a vacuous ledger cannot demonstrate closure; if there are truly no obligations, carry a single `n/a: <reason>` row" };
  const open = ledger.rows.filter((r) => r.open);
  if (open.length > 0) return { ok: false, count: ledger.rows.length, open, reason: `open obligation rows: ${open.map((r) => r.id).join(", ")}` };
  return { ok: true, count: ledger.rows.length, open: [], reason: "" };
}

/* ----------------------------- impure CLI layer ---------------------------- */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fail(code, message) {
  process.stderr.write(`UNIT-LINEAGE ERROR — ${message}\n`);
  process.exit(code);
}

function resolveUnitDir(root, token) {
  const clean = token.replace(/^docs\/(?:features|fix)\//, "").replace(/\/+$/, "");
  const matches = [];
  for (const dir of ["docs/fix", "docs/features"]) {
    const full = path.join(root, dir, clean);
    if (fs.existsSync(path.join(full, "SPEC.md"))) matches.push(full);
  }
  if (matches.length === 0) {
    // suffix match, as `unit-route.mjs` resolves tokens
    for (const dir of ["docs/fix", "docs/features"]) {
      let entries = [];
      try {
        entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
        if (entry.name.endsWith(`/${clean}`) || entry.name === clean) continue;
        if (clean.length >= 4 && entry.name.includes(clean) === false) continue;
        const full = path.join(root, dir, entry.name);
        if (entry.name.endsWith(clean) && entry.name !== clean && fs.existsSync(path.join(full, "SPEC.md"))) matches.push(full);
      }
    }
  }
  if (matches.length === 0) fail(2, `unit not found: ${clean} (no docs/fix or docs/features folder carries a SPEC.md)`);
  if (matches.length > 1) fail(2, `ambiguous unit: ${clean} matches ${matches.join(", ")}`);
  return { dir: matches[0], slug: path.basename(matches[0]), kind: matches[0].includes(`${path.sep}docs${path.sep}fix`) ? "fix" : "feature" };
}

/** Run `unit-route.mjs --triage` over the unit and parse its fixed block. */
function rederiveTriage(root, slug) {
  const r = spawnSync(process.execPath, [path.join(root, "scripts", "unit-route.mjs"), "--triage", slug], {
    cwd: root, encoding: "utf8", timeout: 60000, env: { ...process.env, UNIT_ROUTE_REPO: root },
  });
  if (r.status !== 0) {
    return { error: (r.stderr || `unit-route --triage exited ${r.status}`).trim() };
  }
  const lines = {};
  for (const name of TRIAGE_LINE_NAMES) {
    const line = r.stdout.split("\n").find((l) => l.startsWith(`${name}:`));
    if (!line) return { error: `unit-route --triage printed no ${name}: line` };
    lines[name] = line.trim();
  }
  return { lines };
}

/** Run the receipt verifier; only exit 0 (a current PASS) opens the legacy path. */
function verifyLegacyReceipt(root, kind, slug) {
  const unitId = kind === "fix" ? `fix-${slug}` : slug;
  const r = spawnSync(process.execPath, [path.join(root, "scripts", "pre-execution-snapshot.mjs"), "verify", "--stage", "plan", "--unit", unitId, "--root", root], {
    cwd: root, encoding: "utf8", timeout: 120000,
  });
  if (r.status === 0) return { ok: true };
  let detail = "";
  try {
    const report = JSON.parse(r.stdout);
    detail = report.structural?.code ?? report.code ?? "";
  } catch {
    detail = r.stderr.trim() || `verify exited ${r.status}`;
  }
  return { ok: false, detail };
}

function main(argv) {
  const args = argv.slice(2);
  const asJson = args.includes("--json");
  const unitIndex = args.indexOf("--unit");
  if (unitIndex === -1 || args[unitIndex + 1] === undefined) {
    fail(2, "usage: node scripts/unit-lineage.mjs --unit <slug> [--root <dir>] [--json]");
  }
  const token = args[unitIndex + 1];
  const rootIndex = args.indexOf("--root");
  const root = rootIndex !== -1 && args[rootIndex + 1] !== undefined
    ? path.resolve(args[rootIndex + 1])
    : REPO_ROOT;

  const unit = resolveUnitDir(root, token);
  const specPath = path.join(unit.dir, "SPEC.md");
  const doc = fs.readFileSync(specPath, "utf8");
  const separateLedgerPath = path.join(unit.dir, "planning-obligations.md");
  const separateLedgerText = fs.existsSync(separateLedgerPath) ? fs.readFileSync(separateLedgerPath, "utf8") : null;

  const ledger = obligationLedger(doc, separateLedgerText);
  const obligations = classifyObligations(ledger);

  // Legacy first — but only a receipt that actually re-derives opens it (F10).
  const progressPath = path.join(unit.dir, "progress.md");
  let legacy = null;
  if (fs.existsSync(progressPath)) {
    legacy = verifyLegacyReceipt(root, unit.kind, unit.slug);
    if (legacy.ok && obligations.ok) {
      const verdict = `LINEAGE OK — legacy (plan receipt re-derives) · obligations closed (${obligations.count})`;
      if (asJson) process.stdout.write(`${JSON.stringify({ verdict: "ok", path: "legacy", unit: unit.slug, obligations: obligations.count })}\n`);
      else process.stdout.write(`${verdict}\n`);
      return;
    }
  }

  // Lane-era path: the checks every unit must satisfy when no receipt re-derives.
  const pasted = parseTriagedBlock(doc);
  const rederived = rederiveTriage(root, unit.slug);
  const blocked = (reason, route) => {
    const verdict = `LINEAGE BLOCKED — ${reason}`;
    if (asJson) process.stdout.write(`${JSON.stringify({ verdict: "blocked", path: legacy && !legacy.ok ? "legacy-fallthrough" : "lane-era", unit: unit.slug, reason, route })}\n`);
    else process.stdout.write(`${verdict}\n→ Next: ${route}\n`);
    process.exitCode = 1;
  };

  if (rederived.error !== undefined) {
    blocked(`the triage re-derivation failed: ${rederived.error}`, `/unit-lane ${unit.slug} --retriage`);
    return;
  }
  if (pasted === null) {
    blocked("the unit doc carries no pasted `## Triaged steps` block with Steps/Skipped/Budget lines", `/unit-lane ${unit.slug} --retriage`);
    return;
  }
  const differing = compareTriagedLines(pasted, rederived.lines);
  if (differing.length > 0) {
    blocked(`triage block currency failed — differing line(s): ${differing.map((n) => `${n}:`).join(" ")}`, `/unit-lane ${unit.slug} --retriage`);
    return;
  }
  if (!obligations.ok) {
    blocked(obligations.reason, `/unit-lane ${unit.slug}`);
    return;
  }

  const receiptNote = legacy && !legacy.ok ? ` (a ${progressPath ? "progress.md" : ""} receipt was present but did not re-derive${legacy.detail ? `: ${legacy.detail}` : ""})` : "";
  const verdict = `LINEAGE OK — lane-era (triage block re-derives${receiptNote}) · obligations closed (${obligations.count})`;
  if (asJson) process.stdout.write(`${JSON.stringify({ verdict: "ok", path: "lane-era", unit: unit.slug, obligations: obligations.count })}\n`);
  else process.stdout.write(`${verdict}\n`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main(process.argv);
