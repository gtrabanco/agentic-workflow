/**
 * Published closed vocabularies — the canonical machine-readable declarations
 * (unit 84, issue #315 S1, decision D2).
 *
 * The repo publishes these sets in prose (the unit-doc templates, the ledger
 * references, the sensor); the prose is a citation, never a second definition.
 * A parity suite (`scripts/vocabulary-parity.test.mjs`) pins every second copy
 * to the consts below — the F22/`LOG_KINDS` pattern, moved to the canonical
 * home. Adding or removing a token is a schema-const + grammar-block +
 * parity-pin change in one PR, never a prose-only edit.
 */

/** The `## Future` row status vocabulary (`future-status`), published by both
 *  unit-doc templates and the `UnitDoc` skeleton: `open`, `planned`, or
 *  `discarded <YYYY-MM-DD>` (the date is grammar, not vocabulary). */
export const FUTURE_STATUS_KINDS = Object.freeze(["open", "planned", "discarded"]);
export type FutureStatus = (typeof FUTURE_STATUS_KINDS)[number];

/** The findings-table severity vocabulary (`finding-severity`), published by
 *  the `findings-table@1` block: `high | med | low`. Distinct from the review
 *  payload's five-level `FINDING_SEVERITIES` scale (index.ts) — the table is
 *  the ledger scale; the sensor's `SEVERITY_VOCABULARY` may accept legacy
 *  aliases on read, but the canonical table scale is this set. */
export const FINDINGS_TABLE_SEVERITIES = Object.freeze(["high", "med", "low"]);
export type FindingsTableSeverity = (typeof FINDINGS_TABLE_SEVERITIES)[number];

// The findings-table class vocabulary (`finding-class`) is already published
// canonically: `PRE_EXECUTION_FINDING_CLASSES` in `pre-execution.ts` is exactly
// the `product | plan | source | environment | runtime` set the
// `findings-table@1` block cites — no second const is created here.

/** The `## Log` line-kind vocabulary (`log-kind`), published by the
 *  `log-kind@1` block. The reader const is `scripts/unit-doc-phases.mjs`
 *  `LOG_KINDS`; the parity suite pins the two together. */
export const LOG_KIND_TOKENS = Object.freeze(["L", "E", "G", "F", "D", "P", "R", "V"]);
export type LogKindToken = (typeof LOG_KIND_TOKENS)[number];

/** The sweep claim kind the promise-coherence gate publishes (unit 84 S2): the
 *  `swept: /<pattern>/<flags> → expected <n> in <glob>` declaration a fold
 *  appends to its `## Log` entry (grammar owner: `sweep-declaration@1` in
 *  `skills/execute-phase/references/FOLDING.md`). */
export const SWEEP_CLAIM_KINDS = Object.freeze(["sweep"]);
export type SweepClaimKind = (typeof SWEEP_CLAIM_KINDS)[number];

/** The sweep claim's fail-closed reason code. */
export const SWEEP_MISMATCH_REASONS = Object.freeze(["sweep-mismatch"]);
export type SweepMismatchReason = (typeof SWEEP_MISMATCH_REASONS)[number];
