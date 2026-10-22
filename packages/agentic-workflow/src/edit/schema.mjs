/**
 * File-schema vocabularies for agentic-workflow edit typed file services.
 *
 * Canonical definitions: section lists, table columns, operation names,
 * and operation receipts.  Consumers in UnitDoc, Roadmap, Changelog,
 * Budgets, and Manifest import from here as their single authority.
 *
 * When the schema package (`agentic-workflow-schema`) gains an equivalent
 * typed module, import it instead and keep a comment pointing at the
 * package as owner.
 */

// ── Unit doc: 14 closed sections (ordered, #305) — the legacy shape ─────
export const UNIT_DOC_SECTIONS = [
  "Objective",
  "Why",
  "User outcome",
  "Acceptance criteria",
  "Impact",
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

// ── Unit doc: the re-cut shape (spec-by-reference, #308) ────────────────
// `## Specs` numbers the owner's requirements verbatim, `## Findings` holds the
// OPEN rows `review-findings.md` used to carry, and `## Log` appends every
// request, correction, evidence run, gate run and folded finding. Three headings
// differ from the legacy list; the rest is shared, so a migrated doc and a closed
// one are read by the same code.
export const UNIT_DOC_SPEC_REF_SECTIONS = [
  "Specs",
  "Impact",
  "Non-goals",
  "Future cost",
  "Applicable tests",
  "Known pre-existing issues",
  "Tasks",
  "Findings",
  "Log",
  "Next",
  "References",
];

// One shape table, resolved by the headings a document actually carries. Kept in
// parity with `UNIT_DOC_SECTION_SHAPES` in
// packages/agentic-workflow-schema/src/pre-execution.ts by
// `scripts/unit-doc-contract.test.mjs`; the duplicate is deliberate — this
// package ships without a dependency on the schema package.
export const UNIT_DOC_SECTION_SHAPES = Object.freeze({
  legacy: UNIT_DOC_SECTIONS,
  "spec-by-reference": UNIT_DOC_SPEC_REF_SECTIONS,
});

/** The accepted shape a set of headings satisfies, or `null` when it satisfies neither. */
export function resolveUnitDocShape(headings) {
  for (const [name, sections] of Object.entries(UNIT_DOC_SECTION_SHAPES)) {
    if (sections.every((section) => headings.includes(section))) return name;
  }
  return null;
}

/** The section list of a resolved shape, defaulting to the legacy list. */
export function unitDocSectionsFor(shape) {
  return shape === null ? UNIT_DOC_SECTIONS : UNIT_DOC_SECTION_SHAPES[shape];
}

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