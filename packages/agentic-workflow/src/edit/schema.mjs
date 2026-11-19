/**
 * File-schema vocabularies for agentic-workflow edit typed file services.
 *
 * Every set here is the schema package's published const, re-exported under the
 * name this crate's consumers already import (`UNIT_DOC_SECTIONS`,
 * `PROGRESS_ENTRY_REGEX`, `CHANGELOG_SECTION_REGEX`). The crate holds the
 * operation receipts and the shape resolver; it owns no vocabulary (owner:
 * `vocabulary-residency@1` in docs/architecture/ARCHITECTURAL_INVARIANTS.md).
 */

import {
  BUDGETS_OPERATIONS,
  CHANGELOG_OPERATIONS,
  CHANGELOG_SECTION_PATTERN,
  EVIDENCE_COLUMNS,
  MANIFEST_OPERATIONS,
  PROGRESS_ENTRY_PATTERN,
  ROADMAP_COLUMNS,
  ROADMAP_OPERATIONS,
  UNIT_DOC_OPERATIONS,
  UNIT_DOC_REQUIRED_SECTIONS,
  UNIT_DOC_SECTION_SHAPES,
  UNIT_DOC_SPEC_REF_SECTIONS,
} from "@gtrabanco/agentic-workflow-schema";

export {
  BUDGETS_OPERATIONS,
  CHANGELOG_OPERATIONS,
  EVIDENCE_COLUMNS,
  MANIFEST_OPERATIONS,
  ROADMAP_COLUMNS,
  ROADMAP_OPERATIONS,
  UNIT_DOC_OPERATIONS,
  UNIT_DOC_SECTION_SHAPES,
  UNIT_DOC_SPEC_REF_SECTIONS,
};

/** The legacy unit-doc section list (`## Objective` … `## References`, #305). */
export const UNIT_DOC_SECTIONS = UNIT_DOC_REQUIRED_SECTIONS;

/** The `progress-log@1` entry shape. */
export const PROGRESS_ENTRY_REGEX = PROGRESS_ENTRY_PATTERN;

/** The changelog's per-skill section header. */
export const CHANGELOG_SECTION_REGEX = CHANGELOG_SECTION_PATTERN;

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