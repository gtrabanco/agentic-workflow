/**
 * The pass-name vocabulary, mirrored for the runner crate.
 *
 * Provenance: the ONE machine owner of this list is
 * `@gtrabanco/agentic-workflow-schema` (`src/vocabularies.ts`, `PASS_NAMES`,
 * issue #201). This crate does not depend on the schema package (the
 * `src/journal/entry.mjs` precedent), so it carries this mirror with this
 * comment; extending the published list updates this mirror in the same PR,
 * and `test/resolve-passes.test.mjs` pins the two byte-equal until issue #427
 * unifies the reading.
 *
 * @type {readonly string[]}
 */
export const PASS_NAMES = Object.freeze([
  "review-code",
  "review-security",
  "review-verify",
  "review-design",
  "review-a11y",
  "review-brand",
  "review-perf",
  "review-seo",
  "verify",
  "classify",
  "debt",
]);

/** The one config-layer name that is not a spawned pass: the `default` escape
 *  that resolves the cheap tier for unlisted passes (issue #201, owner
 *  decision 2026-10-12). */
export const PASS_DEFAULT_NAME = "default";
