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
 *                      the provenance stamp well-formed, published and in
 *                      parity with the carrier (issue #462) — an absent stamp
 *                      is a degradation, never a violation;
 *                      receipt marks (`REVIEW-RAN` / `GATE-RAN` / `R`/`G`
 *                      log lines) carry a resolvable 40-hex HEAD sha and no
 *                      future-dated stamp; the tree cross-checks (issue
 *                      #227's 2026-11-03 re-scope residual) — a root-relative
 *                      path citation exists in the tree and a gate citation
 *                      resolves to something published.
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
 *
 * Tree cross-checks (issue #227, injected `pathExists`/`rootHasDir`/`gateKnown`):
 * the 2026-11-03 re-scope's residual half — "referenced paths exist, cited
 * gates are the published ones". The claim grammar is closed and lexical:
 *   path claim — an inline code span (outside fenced blocks) with no
 *     whitespace and no `{ } < > | *` character, containing a slash, ending in
 *     a known extension, optionally followed by a `:line`/`:Lline` citation
 *     suffix, whose FIRST segment is a real directory at the repo root.
 *     Everything else — context-relative shorthand (`src/…`), brace expansion
 *     (`{a,b}.ts`), commands, branch names, URLs — is not a claim a verifier
 *     can decide, so it is never checked. Unresolvable != absent is a
 *     deliberate boundary: the check refuses what the tree disproves, not
 *     what it cannot interpret.
 *   gate claim — an inline span that is a bare kebab-case id immediately
 *     followed by the word "gate" (`the `phase-lint-rules` gate`). The id must
 *     resolve to something published: the repo's sources decide (the CLI
 *     builds the set from the gate inventory, audit-pr's `GATE_NAMES`, existing
 *     skills and script stems); the module only takes `gateKnown` injected.
 * With `null` deps (no repo context, `--no-git`) a cross-check is skipped and
 * its name stays out of the receipt's `checks` — skipped, never silently
 * passed: the same contract `headExists` established for sha resolution.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

import { validate as validateShape } from "../edit/UnitDoc.mjs";
import { resolveUnitDocShape, EVIDENCE_COLUMNS, PROGRESS_ENTRY_REGEX } from "../edit/schema.mjs";
import { DOC_FORMAT_GRAMMARS, deriveFormat, parseProvenance, readProvenance, validateProvenance } from "../edit/Provenance.mjs";

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

/** Tree cross-checks (issue #227): the closed path-claim and gate-claim shapes. */
const PATH_EXTENSIONS = new Set([
  "md", "mdx", "mjs", "cjs", "js", "mts", "cts", "ts", "tsx", "jsx",
  "json", "yml", "yaml", "txt", "sh", "html", "css",
]);
const PATH_CLAIM = /^([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.@+-]+)+)\.([A-Za-z0-9]{1,5})(?::(?:\d+|L\d+))?$/u;
const NOT_A_PATH = /[\s{}<>|*]/u;
const GATE_CLAIM = /`([a-z0-9][a-z0-9-]{0,63})` gate\b/gu;

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

/**
 * The document provenance stamp (issue #462).
 *
 * Three questions, one pass: is the stamp well-formed and does it speak a
 * generation this package publishes (`provenance-invalid` / `provenance-
 * unpublished` / `provenance-newer-than-reader`), and does the declaration agree
 * with the carrier the document actually carries (`provenance-format-mismatch`,
 * `provenance-grammar-mismatch` — S8's parity, both ways).
 *
 * An absent stamp is a declared degradation, never a violation: closed units are
 * never backstamped (S5).
 */
function checkProvenance(text, headings, out) {
  const parsed = parseProvenance(text);
  if (parsed.value === null) {
    if (parsed.errors.length > 0) {
      out.push(violation("provenance-invalid", parsed.errors.join("; ")));
    }
    return;
  }
  const stamp = parsed.value;

  for (const { code, detail } of validateProvenance(stamp).errors) {
    const published = code.startsWith("unpublished-");
    out.push(violation(published ? "provenance-unpublished" : "provenance-invalid", detail));
  }

  const reading = readProvenance(text);
  if (reading.verdict === "refuse") {
    const code = reading.reason === "stamp-invalid" || reading.reason === "format-too-old"
      ? "provenance-invalid"
      : reading.reason === "format-unknown-to-reader"
        ? "provenance-unpublished"
        : "provenance-newer-than-reader";
    out.push(violation(code, `${stamp.format} · ${reading.reason}`));
  }

  const derived = deriveFormat(headings);
  if (derived !== null && stamp.format !== derived) {
    out.push(violation("provenance-format-mismatch", `declared format ${stamp.format}, but the carrier is ${derived}`));
  }
  const expected = DOC_FORMAT_GRAMMARS[stamp.format] ?? [];
  const declared = Object.keys(stamp.grammars);
  const missing = expected.filter((family) => !declared.includes(family));
  const extra = declared.filter((family) => !expected.includes(family));
  if (missing.length > 0 || extra.length > 0) {
    out.push(violation(
      "provenance-grammar-mismatch",
      `the carrier declares [${expected.join(", ")}] and the stamp declares [${declared.join(", ")}]`,
    ));
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
    // Receipt lines (R/G log lines and REVIEW-RAN/GATE-RAN comment marks) must
    // carry a resolvable full 40-hex sha: a mark attests a reviewed/gated state,
    // and a state cited by an elided prefix can never be pinned to a revision —
    // the fabricated mark's exact shape (2026-09-24). Ordinary prose sha
    // prefixes elsewhere in the Log are normal git citations and stay valid.
    const isReceiptLine = /^- \*\*[RG]\d+[a-z]?\*\* —/u.test(line);
    if (isReceiptLine) {
      if (/[0-9a-f]{4,39}…/iu.test(line)) {
        out.push(violation("receipt-malformed-head", `receipt line carries a truncated sha: ${line.trim().slice(0, 80)}`));
      }
      const headMatch = line.match(/HEAD[ \t]+([0-9a-f]{40})/iu);
      if (headMatch) shas.add(headMatch[1].toLowerCase());
      else if (!/\bHEAD\b/iu.test(line)) {
        // Legacy R/G lines may cite a run without a HEAD; the gate-ran@1
        // grammar requires the sha — a receipt line without one is malformed.
        out.push(violation("receipt-malformed-head", `receipt line without a HEAD sha: ${line.trim().slice(0, 80)}`));
      }
    }
    // Review-mark comments (the legacy ledger carrier): <!-- REVIEW-RAN:date:head=sha:cycle=n -->
    for (const m of line.matchAll(/<!--\s*(REVIEW-RAN|GATE-RAN):([0-9T:Z-]+):head=([0-9a-f…]+)[^>]*-->/giu)) {
      if (nowMs !== null) {
        const t = Date.parse(m[2].slice(0, 10));
        if (Number.isFinite(t) && t > nowMs) {
          out.push(violation("receipt-future-date", `${m[1]} mark is dated in the future (${m[2]})`));
        }
      }
      if (!SHA_40.test(m[3].toLowerCase())) {
        out.push(violation("receipt-malformed-head", `${m[1]} mark carries a truncated sha: ${m[3]}`));
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
 * Inline code spans outside fenced blocks. Verbatim quotes in the Log live in
 * fences and are never scanned — a quote is evidence, not a claim of the
 * quoting doc.
 */
function inlineSpans(text) {
  const spans = [];
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^\s*```/u.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    for (const m of line.matchAll(/`([^`\n]+)`/gu)) spans.push(m[1]);
  }
  return spans;
}

function checkCitations(text, { pathExists, rootHasDir, gateKnown }, out) {
  if (pathExists && rootHasDir) {
    for (const span of inlineSpans(text)) {
      if (NOT_A_PATH.test(span)) continue;
      const m = span.match(PATH_CLAIM);
      if (!m || !PATH_EXTENSIONS.has(m[2].toLowerCase())) continue;
      // PATH_CLAIM's group 1 stops before the extension dot; the claim is the
      // whole file path, with the citation suffix (`:line`) already dropped.
      const target = `${m[1]}.${m[2]}`;
      if (!rootHasDir(m[1].split("/")[0])) continue;
      if (!pathExists(target)) {
        out.push(violation("cited-path-missing", `cited path does not exist in the tree: ${span}`));
      }
    }
  }
  if (gateKnown) {
    // Rebuild the fence state instead of reusing inlineSpans: the gate claim
    // is a span-plus-following-word shape, so it needs the surrounding text.
    let stripped = "";
    let fenced = false;
    for (const line of text.split("\n")) {
      if (/^\s*```/u.test(line)) {
        fenced = !fenced;
        continue;
      }
      if (!fenced) stripped += line + "\n";
    }
    for (const m of stripped.matchAll(GATE_CLAIM)) {
      if (!gateKnown(m[1])) {
        out.push(violation("cited-gate-unknown", `gate citation resolves to nothing published: ${m[1]}`));
      }
    }
  }
}

/**
 * verifyUnitDoc({ text, path, headExists?, now?, siblingDir?, pathExists?,
 * rootHasDir?, gateKnown? }) — the verifier's whole read. Returns `{ contract,
 * path, shape, checks, ok, violations }`; `ok` is false exactly when
 * `violations` is non-empty. Writes nothing.
 */
export function verifyUnitDoc({ text, path, headExists = null, now = null, siblingDir = null, pathExists = null, rootHasDir = null, gateKnown = null }) {
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
  checkProvenance(text, headings, violations);
  checkReceipts(text, { headExists, nowMs }, violations);
  checkLogKinds(text, shape, violations);
  if (shape === null || shape === "legacy") checkLegacyTables(text, violations);
  checkCitations(text, { pathExists, rootHasDir, gateKnown }, violations);

  const checks = [
    "sections",
    "obligations-closure",
    "provenance-stamp",
    "receipt-marks",
    shape === "spec-by-reference" ? "log-kinds" : "evidence-columns+progress-entries",
  ];
  if (pathExists && rootHasDir) checks.push("cited-paths");
  if (gateKnown) checks.push("cited-gates");

  return {
    contract: VERIFY_CONTRACT_ID,
    path: path ?? null,
    shape,
    checks,
    ok: violations.length === 0,
    violations,
  };
}
