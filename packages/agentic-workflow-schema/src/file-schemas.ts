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