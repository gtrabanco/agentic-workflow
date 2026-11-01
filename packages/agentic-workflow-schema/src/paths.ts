/**
 * The location index's published paths (issue #319).
 *
 * One index, one writer: {@link ROADMAP_DOCUMENT} carries the `## Features`
 * table, the `## Fixes` table and the status machine. The pre-move path is a
 * read alias that the crate spells once
 * (`packages/agentic-workflow/src/index-document.mjs`); this package recognises
 * either document through {@link ROADMAP_DOCUMENT_SUFFIX} instead of restating
 * it, so the pre-move path exists in exactly one place in the tree.
 *
 * `scripts/index-document.test.mjs` holds these values and the crate's equal —
 * the two packages publish one vocabulary, never two copies that can drift.
 */

/** The consolidated index: features, fixes and the status machine in one file. */
export const ROADMAP_DOCUMENT = "docs/ROADMAP.md";
/** The fix index file — the index itself before unit 319, a one-line stub after. */
export const FIX_INDEX_DOCUMENT = "docs/fix/README.md";
/** The heading of the features table in the consolidated index. */
export const ROADMAP_FEATURES_HEADING = "Features";
/** The heading of the fixes table in the consolidated index. */
export const ROADMAP_FIXES_HEADING = "Fixes";
/** The basename both index documents carry, which is how a caller-supplied document list is recognised. */
export const ROADMAP_DOCUMENT_SUFFIX = "ROADMAP.md";
/** The migration window: `true` while the pre-move path is still accepted (decision D2). */
export const ROADMAP_LEGACY_READ = true;
