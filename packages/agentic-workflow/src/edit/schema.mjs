/**
 * File-schema vocabularies for agwo edit typed file services.
 *
 * Canonical definitions: section lists, table columns, operation names,
 * and operation receipts.  Consumers in UnitDoc, Roadmap, Changelog,
 * Budgets, and Manifest import from here as their single authority.
 *
 * When the schema package (`agentic-workflow-schema`) gains an equivalent
 * typed module, import it instead and keep a comment pointing at the
 * package as owner.
 */

// ── Unit doc: 13 closed sections (ordered) ───────────────────────────────
export const UNIT_DOC_SECTIONS = [
  "Objective",
  "Why",
  "User outcome",
  "Acceptance criteria",
  "Non-goals",
  "Future cost",
  "Applicable tests",
  "Known pre-existing issues",
  "Tasks",
  "Evidence",
  "Progress log",
  "Next",
  "References",
];

// ── Unit doc: evidence-table@1 columns ───────────────────────────────────
export const EVIDENCE_COLUMNS = [
  "AC",
  "What was run",
  "Exit / digest",
  "Output (≤2 lines)",
  "Verified-by",
];

// ── Unit doc: progress-log@1 entry regex ─────────────────────────────────
// Format: YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>
export const PROGRESS_ENTRY_REGEX =
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} — .+ → .+ — next: .+$/;

// ── Roadmap table columns ────────────────────────────────────────────────
export const ROADMAP_COLUMNS = ["NN", "slug", "status", "depends-on", "description"];

// ── Changelog section header pattern ─────────────────────────────────────
// Matches: #### `skillName` (the named section per skill)
export const CHANGELOG_SECTION_REGEX = /^#### `(.+)`$/;

// ── Budgets ceiling rebase operations ────────────────────────────────────
export const BUDGETS_OPERATIONS = ["ceilingRebase"];

// ── Manifest operations ──────────────────────────────────────────────────
export const MANIFEST_OPERATIONS = ["skillAdd", "skillRemove"];

// ── Unit doc operations ──────────────────────────────────────────────────
export const UNIT_DOC_OPERATIONS = ["create", "setSection", "evidence_addRow", "progress_logEntry", "validate"];

// ── Roadmap operations ───────────────────────────────────────────────────
export const ROADMAP_OPERATIONS = ["rowUpsert", "annotate"];

// ── Changelog operations ─────────────────────────────────────────────────
export const CHANGELOG_OPERATIONS = ["rowAdd"];

// ── Receipt templates per operation kind ─────────────────────────────────
export const OPERATION_RECEIPT = {
  unitDocCreate:
    "UNIT_DOC.create — {path}\nSchema: unit-doc-template@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  unitDocSetSection:
    "UNIT_DOC.setSection — {path}\nSchema: unit-doc-section@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  unitDocEvidence:
    "UNIT_DOC.evidence — {path}\nSchema: evidence-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  unitDocProgress:
    "UNIT_DOC.progress — {path}\nSchema: progress-log@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  unitDocValidate:
    "UNIT_DOC.validate — {path}\nSchema: unit-doc-schema@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  roadmapUpsert:
    "ROADMAP.rowUpsert — {path}\nSchema: roadmap-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  roadmapAnnotate:
    "ROADMAP.annotate — {path}\nSchema: roadmap-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  changelogRowAdd:
    "CHANGELOG.rowAdd — {path}\nSchema: changelog-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  budgetsCeilingRebase:
    "BUDGETS.ceilingRebase — {path}\nSchema: budgets-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  manifestSkillAdd:
    "MANIFEST.skillAdd — {path}\nSchema: manifest-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
  manifestSkillRemove:
    "MANIFEST.skillRemove — {path}\nSchema: manifest-table@1 · Receipt: {verdict}\nBefore: {before} · After: {after}",
};