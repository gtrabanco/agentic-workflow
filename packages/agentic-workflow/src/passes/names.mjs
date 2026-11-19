/**
 * The pass-name vocabulary — the schema package's published `PASS_NAMES`
 * (issue #201). The crate imports the const rather than restating it (owner:
 * `vocabulary-residency@1` in docs/architecture/ARCHITECTURAL_INVARIANTS.md), so
 * extending the published list needs no second edit here.
 *
 * @type {readonly string[]}
 */
export { PASS_NAMES } from "@gtrabanco/agentic-workflow-schema";

/** The one config-layer name that is not a spawned pass: the `default` escape
 *  that resolves the cheap tier for unlisted passes (issue #201, owner
 *  decision 2026-10-12). */
export const PASS_DEFAULT_NAME = "default";
