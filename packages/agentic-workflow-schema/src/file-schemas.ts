/**
 * File-schema vocabularies for agwo edit typed file services.
 *
 * This is the canonical source for: evidence-table columns, roadmap table
 * columns, changelog section header pattern, and operation name constants.
 *
 * The unit-doc section list (UNIT_DOC_REQUIRED_SECTIONS) is already owned
 * by src/pre-execution.ts (feature 61 P8); this file re-exports it for
 * agwo edit consumers via the index.  The SDK module at
 * `packages/agentic-workflow/src/edit/schema.mjs` duplicates with a
 * pointing comment when the crate does not depend on the schema package.
 *
 * Consumers in `packages/agentic-workflow/src/edit/` import from here
 * (or from the SDK's schema.mjs which mirrors these values).
 */

// NOTE: UNIT_DOC_REQUIRED_SECTIONS is owned by pre-execution.ts —
// re-exported here via index.ts for agwo edit consumers (feature 61 P8).
// This file does NOT redeclare it to avoid duplicate identifiers.

// ── Unit doc: evidence-table@1 columns ───────────────────────────────────
/**
 * @type {readonly ["AC", "What was run", "Exit / digest", "Output (≤2 lines)", "Verified-by"]}
 */
export const EVIDENCE_COLUMNS = [
  "AC",
  "What was run",
  "Exit / digest",
  "Output (≤2 lines)",
  "Verified-by",
] as const;

// ── Unit doc: claim-evidence row grammar (evidence-row@1, #318 S5/S12) ───
/**
 * The `claim | command | output | status` row a repair introduces for every
 * claim it makes. `fold-findings` and `execute-phase` mandate it in prose; this
 * is the versioned shape a driver can check, so "paste the command, never type
 * the result" stops being a request a model may skip.
 *
 * @type {readonly ["claim", "command", "output", "status"]}
 */
export const EVIDENCE_ROW_COLUMNS = ["claim", "command", "output", "status"] as const;

/**
 * The closed verdict set: a row either verifies or it does not. A `✗` row means
 * the turn is not done, which is why the vocabulary is closed rather than free
 * text (`yes`/`PASS`/`ok` are refused, never coerced).
 *
 * @type {readonly ["✓", "✗"]}
 */
export const EVIDENCE_ROW_VERDICTS = ["✓", "✗"] as const;

const EVIDENCE_ROW_BACKTICK = /`[^`]+`/;
const EVIDENCE_ROW_SEPARATOR = /^\|(?:\s*:?-{3,}:?\s*\|)+$/;

/** Split a markdown table line into its cells, dropping the outer pipes. */
function evidenceRowCells(line: string): string[] | null {
  const text = line.trim();
  if (!text.startsWith("|")) return null;
  const cells = text.split("|").slice(1);
  if (cells.length && cells[cells.length - 1].trim() === "") cells.pop();
  return cells.map((cell) => cell.trim());
}

/** The cell with its wrapping backticks removed, or null when it carries none. */
function backticked(cell: string): string | null {
  if (!EVIDENCE_ROW_BACKTICK.test(cell)) return null;
  return cell.replace(/^`(.*)`$/s, "$1");
}

/**
 * Classify a markdown line against `evidence-row@1`: a header, a separator, a
 * claim row (with its parsed cells and refuse-nothing shape), or something else.
 *
 * @param {string} line
 */
export function parseEvidenceRow(line: string) {
  const cells: string[] | null = evidenceRowCells(line);
  if (cells === null) return { kind: "other", ok: false, cells: null, violations: [] };
  const lower = cells.map((cell) => cell.toLowerCase());
  if (lower.length === EVIDENCE_ROW_COLUMNS.length
    && EVIDENCE_ROW_COLUMNS.every((column, index) => lower[index] === column)) {
    return { kind: "header", ok: true, cells: null, violations: [] };
  }
  if (EVIDENCE_ROW_SEPARATOR.test(line.trim())) {
    return { kind: "separator", ok: true, cells: null, violations: [] };
  }
  const violations: string[] = [];
  const [claim = "", commandCell = "", outputCell = "", status = ""] = cells;

  if (claim === "" || claim === "—") violations.push("invalid-evidence-row-claim");
  // The command must BE a command: prose in that cell is the same defect as an
  // empty one, because a typed expectation is what the shape exists to stop.
  const command = backticked(commandCell);
  if (command === null || command.trim() === "") violations.push("invalid-evidence-row-command");
  const output = backticked(outputCell);
  if (output === null || output.trim() === "") violations.push("invalid-evidence-row-output");
  if (!(EVIDENCE_ROW_VERDICTS as readonly string[]).includes(status)) violations.push("invalid-evidence-row-status");

  return {
    kind: "row",
    ok: violations.length === 0,
    cells: { claim, command: command ?? commandCell, output: output ?? outputCell, status },
    violations,
  };
}

/**
 * Validate one line against `evidence-row@1`. A header or separator is not a
 * claim and passes; a non-table line is not a row of this grammar either.
 *
 * @param {string} line
 * @returns {{ ok: boolean, kind: string, cells: object|null, violations: string[] }}
 */
export function validateEvidenceRow(line: string) {
  const parsed = parseEvidenceRow(line);
  if (parsed.kind === "other") {
    return { ...parsed, ok: false, violations: ["invalid-evidence-row-shape"] };
  }
  return parsed;
}

// ── Unit doc: progress-log@1 entry regex ─────────────────────────────────
export const PROGRESS_ENTRY_PATTERN =
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} — .+ → .+ — next: .+$/;

// ── Roadmap table columns ────────────────────────────────────────────────
/**
 * @type {readonly ["NN", "slug", "status", "depends-on", "description"]}
 */
export const ROADMAP_COLUMNS = [
  "NN",
  "slug",
  "status",
  "depends-on",
  "description",
] as const;

// ── Changelog section header pattern ─────────────────────────────────────
export const CHANGELOG_SECTION_PATTERN = /^#### `(.+)`$/;

// ── Budgets ceiling rebase operations ────────────────────────────────────
export const BUDGETS_OPERATIONS = ["ceilingRebase"] as const;

// ── Manifest operations ──────────────────────────────────────────────────
export const MANIFEST_OPERATIONS = ["skillAdd", "skillRemove"] as const;

// ── Unit doc operations ──────────────────────────────────────────────────
export const UNIT_DOC_OPERATIONS = [
  "create",
  "setSection",
  "evidence_addRow",
  "progress_logEntry",
  "validate",
] as const;

// ── Roadmap operations ───────────────────────────────────────────────────
export const ROADMAP_OPERATIONS = ["rowUpsert", "annotate"] as const;

// ── Changelog operations ─────────────────────────────────────────────────
export const CHANGELOG_OPERATIONS = ["rowAdd"] as const;