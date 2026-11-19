/**
 * vocabulary.mjs — the doctor's published vocabularies (issue #537 S5).
 *
 * Three closed sets and the curated companion↔core pair. The three sets are the
 * schema package's published consts (owner: `vocabulary-residency@1`), re-exported
 * because `AGENTS.md`'s `normative-surfaces@1` binds each one through a
 * `schema-export:` row — so the values an agent may pass and the values this
 * module accepts are one declaration, not two that could drift apart.
 *
 * Nothing here is a second copy of a documented fact: the *declarative* half of
 * every surface (what it is, why it exists, whether it is required, how it is
 * detected, its alternative and its install route) lives in the crate README's
 * `tool-inventory@1` block, which `inventory.mjs` reads. This module owns only
 * the closed value sets and the one maintainer-curated pairing.
 */

import {
  DOCTOR_CHECK_STATUSES,
  INSTALL_ROUTES,
  WIZARD_MOVES,
} from "@gtrabanco/agentic-workflow-schema";

/** The checker's own contract id — its twin is `resources-detect@1`. */
export const DOCTOR_CONTRACT_ID = "doctor@1";

/** What one observation can conclude (`doctor-check-status`), how a surface is
 *  installed (`install-route`), and what the wizard may do with one row
 *  (`wizard-move`) — the schema package's published consts. */
export { DOCTOR_CHECK_STATUSES, INSTALL_ROUTES, WIZARD_MOVES };

/**
 * The Node.js floor the CLI declares — `packages/agentic-workflow/package.json`
 * owns it and `doctor.inventory.test.mjs` pins this constant to that manifest, so
 * the two cannot disagree.
 */
export const NODE_ENGINE = ">=24";

/**
 * The curated companion↔core pairing (the spike's row 9). This is maintainer
 * knowledge, not a derivable fact: a Pi companion package is known to work with
 * a core release line, and nothing in either package files declares the pair.
 * The check reports a departing pair as an advisory `mismatch`, never a failure —
 * a maintainer decision (the `residual` move), never an operator command.
 *
 * The measured entry is this repository's live pair on 2026-11-14: companion
 * `gentle-engram@0.8.0` against core `engram@3.7.1` (binary and served).
 */
export const COMPANION_PAIRINGS = Object.freeze([
  Object.freeze({
    companion: "gentle-engram",
    companionLine: "0.8",
    core: "engram",
    coreLine: "3.7",
    owner: "maintainer",
    source: "docs/research/2026-11-13-tool-doctor-inventory.md row 9 + the live pair measured 2026-11-14",
  }),
]);
