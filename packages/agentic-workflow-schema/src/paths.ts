/**
 * The location index's published paths (issue #319).
 *
 * One index, one writer: {@link ROADMAP_DOCUMENT} carries the `## Features`
 * table, the `## Fixes` table and the status machine. The migration window is
 * closed (owner decision D4): this package matches that one path, and the
 * pre-move path — spelled once, in the crate
 * (`packages/agentic-workflow/src/index-document.mjs`) — is never read.
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
/**
 * The migration window: closed by decision D4. Kept as the documented rollback
 * lever. This package stays dependency-free (no Node typings), so it publishes
 * the closed value; the runtime channel that flips it for an installed package
 * lives in the crate (`src/index-document.mjs`), which is the module that reads
 * the filesystem. Both sides state the same fact: the window is closed.
 */
export const ROADMAP_LEGACY_READ = false;
