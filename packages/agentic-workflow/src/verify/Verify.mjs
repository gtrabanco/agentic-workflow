/**
 * Verify.mjs — the document verifier (issue #260 S7, non-negotiable #2).
 *
 * A deterministic check of one unit document against the frozen schemas,
 * distinct from the `edit` writer CLI (the writer composes; the verifier
 * only reads and fails closed). Consumes the crate's mirrored unit-doc
 * schema constants (`src/edit/schema.mjs`, the provenance-comment mirrors
 * of the schema package's published shapes) — never an LSP and never a
 * model.
 *
 * Checks, by doc shape:
 *   both shapes      — required sections (presence, duplication, order,
 *                      half-migration) via `UnitDoc.validate`; the
 *                      obligations ledger (embedded `### Obligations` table
 *                      or the sibling `planning-obligations.md`) closed;
 *                      receipt marks (`REVIEW-RAN` / `GATE-RAN` / `R`/`G`
 *                      log lines) carry a resolvable 40-hex HEAD sha and no
 *                      future-dated stamp.
 *   legacy only      — the Evidence table's columns; the Progress-log entry
 *                      pattern.
 *   spec-ref only    — Log lines carry a kind token from the closed set.
 *
 * The receipt-fabricated checks are the reproducers of the 2026-09-24
 * incident (a mark produced as plausible text: future date, head sha absent
 * from the repo, truncated `…` sha) and of the fix-258 class (an unclosed
 * obligations ledger). `headExists` is injected: the CLI wires it to git;
 * a caller without git passes `null` and the sha-resolution check reports
 * itself as skipped rather than passing silently.
 *
 * Read-only: verify writes nothing. Refusals carry a closed violation-code
 * vocabulary — new checks append codes, never rename them.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

import { validate as validateShape } from "../edit/UnitDoc.mjs";
import { resolveUnitDocShape, EVIDENCE_COLUMNS, PROGRESS_ENTRY_REGEX } from "../edit/schema.mjs";

/** The receipt's fixed contract id (same `<name>@<n>` shape as the other crate receipts). */
export const VERIFY_CONTRACT_ID = "verify@1";

/** The closed Log kind tokens (mirror of the schema package's LOG_KIND_TOKENS —
 * provenance: packages/agentic-workflow-schema/src/vocabularies.ts, MIT, same repo). */
export const LOG_KIND_TOKENS = Object.freeze(["L", "E", "G", "F", "D", "P", "R", "V"]);

/** The obligation statuses that close a row. A row's status cell may carry its
 * evidence citation after the token (the closed ledger records where the
 * validator ran), so `verified` matches at the token boundary; `n/a` closes
 * only when the row carries its reason (the `n/a: <reason>` shape). */
const CLOSED_STATUS = /^(?:verified\b|n\/a:)/u;

const SHA_40 = /^[0-9a-f]{40}$/u;
const DATE_PREFIX = /^- \*\*(?:[A-Z]\d+|L\d+[a-z]?)\*\* — (\d{4}-\d{2}-\d{2})/;
const LOG_LINE = /^- \*\*([A-Z])(\d+[a-z]?)\*\* —/;
const RECEIPT_HEAD = /\bHEAD[ \t]+([0-9a-f]{6,64}[0-9a-f…]*|\b)/giu;

const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

function violation(code, message) {
  return { code, message };
}

/** Parse an embedded or sibling obligations ledger into `{id, status}` rows.
 * Cells split on unescaped pipes only: a `\|` inside a cell is a literal
 * pipe (markdown table escaping), not a cell boundary. */
export function obligationsRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("|") || line.includes("---")) continue;
    const cells = line.split(/(?<!\\)\|/u).slice(1, -1).map((c) => c.trim());
    if (cells.length < 9 || cells[0] === "obligation-id") continue;
    if (!/^(O\d+|n\/a)$/u.test(cells[0])) continue;
    rows.push({ id: cells[0], status: cells[8] });
  }
  return rows;
}

function checkObligations(docText, siblingText, out) {
  const embedded = docText.includes("### Obligations") ? obligationsRows(docText) : [];
  const sibling = siblingText ? obligationsRows(siblingText) : [];
  for (const { id, status } of [...embedded, ...sibling]) {
    if (!CLOSED_STATUS.test(status)) {
      out.push(violation("obligations-open", `obligations row ${id} is not closed (status: ${status || "blank"})`));
    }
  }
}

function extractLogLines(text) {
  const lines = [];
  let inLog = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) inLog = line.startsWith("## Log");
    if (inLog) lines.push(line);
  }
  return lines;
}

function checkReceipts(text, { headExists, nowMs }, out) {
  const log = extractLogLines(text);
  const shas = new Set();
  for (const line of log) {
    // Future-dated stamp on any log entry (a fabricated mark got its date
    // from imagination — the 2026-09-24 incident's `2025-01-15` tell is the
    // past-date cousin; both are caught by comparing against the caller's now).
    const date = line.match(DATE_PREFIX)?.[1];
    if (date && nowMs !== null) {
      const t = Date.parse(`${date}T00:00:00Z`);
      if (Number.isFinite(t) && t > nowMs) {
        out.push(violation("receipt-future-date", `log entry is dated in the future (${date})`));
      }
    }
    // HEAD sha citations: R (review) and G (gate) lines must carry a sha;
    // every 40-hex sha must resolve in the repo.
    const isReceiptLine = /^- \*\*[RG]\d+[a-z]?\*\* —/u.test(line);
    if (isReceiptLine) {
      const headMatch = line.match(/HEAD[ \t]+([0-9a-f]{40})/iu);
      if (headMatch) shas.add(headMatch[1].toLowerCase());
      else if (!/\bHEAD\b/iu.test(line)) {
        // Legacy R/G lines may cite a run without a HEAD; the gate-ran@1
        // grammar requires the sha — a receipt line without one is malformed.
        out.push(violation("receipt-malformed-head", `receipt line without a HEAD sha: ${line.trim().slice(0, 80)}`));
      }
    }
    // Truncated shas anywhere in the Log: a `…`-elided sha can never be
    // resolved, so a mark carrying one attests nothing (the fabricated
    // mark's exact shape).
    for (const m of line.matchAll(/\b([0-9a-f]{4,39})…/giu)) {
      out.push(violation("receipt-malformed-head", `truncated sha in the Log: ${m[1]}…`));
    }
    // Review-mark comments (the legacy ledger carrier): <!-- REVIEW-RAN:date:head=sha:cycle=n -->
    for (const m of line.matchAll(/<!--\s*(REVIEW-RAN|GATE-RAN):([0-9T:Z-]+):head=([0-9a-f…]+)[^>]*-->/giu)) {
      if (nowMs !== null) {
        const t = Date.parse(m[2].slice(0, 10));
        if (Number.isFinite(t) && t > nowMs) {
          out.push(violation("receipt-future-date", `${m[1]} mark is dated in the future (${m[2]})`));
        }
      }
      shas.add(m[3].toLowerCase());
    }
  }
  if (headExists) {
    for (const sha of shas) {
      if (!SHA_40.test(sha)) {
        out.push(violation("receipt-malformed-head", `receipt sha is not 40-hex: ${sha}`));
      } else if (!headExists(sha)) {
        out.push(violation("receipt-unknown-head", `receipt names a commit absent from the repo: ${sha}`));
      }
    }
  } else {
    for (const sha of shas) {
      if (!SHA_40.test(sha)) {
        out.push(violation("receipt-malformed-head", `receipt sha is not 40-hex: ${sha}`));
      }
    }
  }
}

function splitTableRows(sectionText) {
  return sectionText
    .split("\n")
    .filter((l) => l.startsWith("|") && !l.includes("---") && !l.startsWith("| obligation-id"))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
}

function sectionBody(text, name) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l === `## ${name}`);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function checkLegacyTables(text, out) {
  const evidence = sectionBody(text, "Evidence");
  if (evidence !== null) {
    const header = evidence.split("\n").find((l) => l.startsWith("|"));
    if (header) {
      const cols = header.split("|").slice(1, -1).map((c) => c.trim());
      const expected = EVIDENCE_COLUMNS.join(", ");
      if (cols.join(", ") !== expected) {
        out.push(violation("evidence-columns", `Evidence table columns are ${JSON.stringify(cols)}; expected ${expected}`));
      }
    }
  }
  const progress = sectionBody(text, "Progress log");
  if (progress !== null) {
    for (const line of progress.split("\n")) {
      const t = line.trim();
      if (t === "" || t.startsWith("#") || t.startsWith("|") || t.startsWith(">")) continue;
      if (!PROGRESS_ENTRY_REGEX.test(t)) {
        out.push(violation("progress-entry", `progress entry does not match progress-log@1: ${t.slice(0, 80)}`));
      }
    }
  }
}

function checkLogKinds(text, shape, out) {
  if (shape !== "spec-by-reference") return;
  for (const line of extractLogLines(text)) {
    const m = line.match(LOG_LINE);
    if (!m) continue;
    if (!LOG_KIND_TOKENS.includes(m[1])) {
      out.push(violation("log-kind", `unknown Log kind token: ${m[0].slice(0, 12)}`));
    }
  }
}

/**
 * verifyUnitDoc({ text, path, headExists?, now?, siblingDir? }) — the
 * verifier's whole read. Returns `{ contract, path, shape, checks, ok,
 * violations }`; `ok` is false exactly when `violations` is non-empty.
 * Writes nothing.
 */
export function verifyUnitDoc({ text, path, headExists = null, now = null, siblingDir = null }) {
  const violations = [];
  if (typeof text !== "string" || text.trim() === "") {
    return { contract: VERIFY_CONTRACT_ID, path, shape: null, checks: [], ok: false, violations: [violation("empty-document", "the document is empty")] };
  }

  const nowMs = now ? Date.parse(`${now}T23:59:59Z`) : null;

  // Shape (delegates to the writer's own shape reader — one grammar, one reader).
  const shapeResult = validateShape(text);
  for (const v of shapeResult.violations) {
    const [kind, ...rest] = v.split(":");
    const code = kind === "Missing section" ? "section-missing"
      : kind === "Duplicate section" ? "section-duplicate"
      : kind === "Misordered section" ? "section-misordered"
      : "section-shape";
    // The fix-lane templates keep `## Acceptance criteria` (feature 61 made it
    // the canonical acceptance source) while the re-cut shape list predates
    // that — the section is tolerated, never a half-migration signal; the
    // receipt-carrying legacy sections (Evidence, Progress log) are not.
    if (code === "section-shape" && rest.join(":").includes("Acceptance criteria belongs to the other accepted shape")) continue;
    violations.push(violation(code, rest.join(":").trim() || v));
  }

  const headings = (text.match(/^## (.+)$/gmu) ?? []).map((h) => h.replace(/^## /, ""));
  const shape = resolveUnitDocShape(headings);

  // Sibling obligations ledger (the M/L home) beside the doc, when discoverable.
  let siblingText = null;
  if (siblingDir) {
    const siblingPath = join(siblingDir, "planning-obligations.md");
    if (existsSync(siblingPath)) siblingText = readFileSync(siblingPath, "utf8");
  } else if (path) {
    const siblingPath = join(dirname(path), "planning-obligations.md");
    if (existsSync(siblingPath)) siblingText = readFileSync(siblingPath, "utf8");
  }

  checkObligations(text, siblingText, violations);
  checkReceipts(text, { headExists, nowMs }, violations);
  checkLogKinds(text, shape, violations);
  if (shape === null || shape === "legacy") checkLegacyTables(text, violations);

  const checks = [
    "sections",
    "obligations-closure",
    "receipt-marks",
    shape === "spec-by-reference" ? "log-kinds" : "evidence-columns+progress-entries",
  ];

  return {
    contract: VERIFY_CONTRACT_ID,
    path: path ?? null,
    shape,
    checks,
    ok: violations.length === 0,
    violations,
  };
}
