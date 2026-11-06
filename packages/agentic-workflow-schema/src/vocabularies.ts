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

/** The findings-table severity ladder (`finding-severity-ladder`, issue #361),
 *  published by the `findings-table@1` block: `BLOCKER | CRITICAL | WARNING |
 *  SUGGESTION`. It replaces the retired `high | med | low` ledger scale; it is
 *  distinct from the review payload's five-level `FINDING_SEVERITIES` scale and
 *  from the planning receipt's `PRE_EXECUTION_FINDING_SEVERITIES` (both map onto
 *  the ladder through `review-implementation`'s conversion table), and it is the
 *  only severity a finder may assign. `BLOCKER` is never a conversion target: it
 *  requires a reproducer (a failure caused by the change), never a scale. */
export const FINDINGS_TABLE_SEVERITIES = Object.freeze(["BLOCKER", "CRITICAL", "WARNING", "SUGGESTION"]);
export type FindingsTableSeverity = (typeof FINDINGS_TABLE_SEVERITIES)[number];

/** The findings-table impact vocabulary (`finding-impact`, issue #361), published
 *  beside the severity by the same `findings-table@1` block: `blocking |
 *  docs-only | report-only` — does the finding affect behaviour, only documents,
 *  or nothing that blocks. A `BLOCKER` row is `blocking` or `docs-only`;
 *  `report-only` is the pre-existing advisory's impact (never a correction
 *  round). */
export const FINDINGS_TABLE_IMPACTS = Object.freeze(["blocking", "docs-only", "report-only"]);
export type FindingsTableImpact = (typeof FINDINGS_TABLE_IMPACTS)[number];

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

/** The risk tiers (`risk-tier`), published by the `risk-tier-verdict@1` block
 *  (owner: `skills/execute-phase/references/risk-tiers.md`) and emitted only by
 *  the ceremony CLI's `tier classify` — never by the model (issue #360 S5, S7).
 *  A distinct vocabulary from the model-budget tier `next.tier`
 *  (`strong | cheap`): this one names the ceremony a change owes. */
export const RISK_TIER_KINDS = Object.freeze(["passive", "standard", "high"]);
export type RiskTier = (typeof RISK_TIER_KINDS)[number];

/** The named high-risk items a `high` verdict must carry (issue #360 S5): the
 *  tier is never bare, and every token here resolves a path class the
 *  classifier owns. `content` marks an executable change that raised no named
 *  surface; it is how `standard` explains itself too. */
export const RISK_TIER_SIGNAL_KINDS = Object.freeze(["auth", "security", "destructive", "ci", "publish", "content"]);
export type RiskTierSignal = (typeof RISK_TIER_SIGNAL_KINDS)[number];

/** The size tier (`size-tier`), published by the `risk-tier-verdict@1` block:
 *  what the unit's *size* is, for the two decisions that need one — splitting a
 *  unit that is too large and grouping several small ones (issue #360 S2, S5).
 *  Deliberately a different field from the risk tier: a one-file auth change is
 *  `small` and `high`; a 400-file docs sweep is `prose` and `passive`. */
export const SIZE_TIER_KINDS = Object.freeze(["prose", "small", "large"]);
export type SizeTier = (typeof SIZE_TIER_KINDS)[number];

/** Why the classifier answered what it answered — a closed set, so a reason is
 *  grammar rather than prose a reader has to trust. */
export const RISK_TIER_REASONS = Object.freeze([
  "no-executable-effect",
  "comment-only",
  "executable-content",
  "named-high-risk",
  "empty-change",
]);
export type RiskTierReason = (typeof RISK_TIER_REASONS)[number];

/** The kill mandate's verdict (`adversarial-verdict`, issue #358), published by
 *  the `adversarial-verdict@1` block (owner:
 *  `skills/review-change/references/ADVERSARIAL_SETUP.md`): a candidate is
 *  either disproved (`kill`, with falsifying evidence) or survives the disproof
 *  attempt (`confirm`, with supporting evidence). There is no third answer, and
 *  a kill with no disproof attempt is refused by `scripts/adversarial-verdict.mjs`
 *  — precision is the mandate's whole point. */
export const ADVERSARIAL_VERDICTS = Object.freeze(["kill", "confirm"]);
export type AdversarialVerdict = (typeof ADVERSARIAL_VERDICTS)[number];

/** The diff-only reflector's verdict (`adversarial-reflector-verdict`, issue
 *  #358): it sees the diff and the finding's claim, never the pass's transcript,
 *  and answers `keep` or `drop` with a reason. A claim the diff does not ground
 *  cannot be kept — the reflector is the last precision filter, not a second
 *  finder. */
export const ADVERSARIAL_REFLECTOR_VERDICTS = Object.freeze(["keep", "drop"]);
export type AdversarialReflectorVerdict = (typeof ADVERSARIAL_REFLECTOR_VERDICTS)[number];

/** The stability verdict (`adversarial-stability`, issue #358): `unstable` marks
 *  a reproducer that also fires on untouched adjacent code, which is a
 *  misattribution — the finding is re-scoped before it persists, never persisted
 *  as-is (CIVER, arXiv 2610.36010). */
export const ADVERSARIAL_STABILITY_VERDICTS = Object.freeze(["stable", "unstable"]);
export type AdversarialStabilityVerdict = (typeof ADVERSARIAL_STABILITY_VERDICTS)[number];

// ── The workflow-projection contract (issue #406) ─────────────────────────
// The four consumers of the projection chain (#410 stripper, #412 guards, #413
// seam hooks, #414 prereq) type their inputs from these sets instead of
// renegotiating grammar. Every set is closed: growing one is a schema-const
// change plus a `normative-surfaces@1` row in the same PR, never a prose edit.

/** The workflow seams a project hook or a projected rule may attach to
 *  (`projection-seam`). Every member is an existing lifecycle point in this
 *  workflow, not an invented event: the pi session boundary (#394's
 *  `session_start`/`session_shutdown`), the lane's unit boundary, the executor's
 *  phase boundary, and git's commit/push seams (the repo installs a `pre-push`
 *  gate hook). #413's dispatcher consumes this set; it never extends it by
 *  prose (issue #406 S13). */
export const PROJECTION_SEAMS = Object.freeze([
  "session:start",
  "session:end",
  "unit:start",
  "unit:end",
  "phase:start",
  "phase:end",
  "pre:commit",
  "post:commit",
  "pre:push",
]);
export type ProjectionSeam = (typeof PROJECTION_SEAMS)[number];

/** The three projection operations a manifest rule may declare
 *  (`projection-op`): remove a section or line range, replace it with a one-line
 *  pointer naming the enforcing command, or do that and pre-run the command so
 *  its result is injected instead of recomputed (issue #410, #414). */
export const PROJECTION_OPS = Object.freeze(["remove", "pointerize", "prereq"]);
export type ProjectionOp = (typeof PROJECTION_OPS)[number];

/** The selector forms a manifest rule may carry (`projection-selector-kind`).
 *  They are the shipped section locator's own forms
 *  (`packages/agentic-workflow/src/doc/section-locator.mjs`, issue #407), so a
 *  rule is handed to the locator as data instead of being translated:
 *  `heading` (one root heading), `path` (a depth-aware heading path),
 *  `headingRegex`, and `line` (an exact line or a regex, optionally scoped with
 *  `within` — the "line-in-scope" form). A selector carries exactly one of the
 *  four. */
export const PROJECTION_SELECTOR_KINDS = Object.freeze(["heading", "path", "headingRegex", "line"]);
export type ProjectionSelectorKind = (typeof PROJECTION_SELECTOR_KINDS)[number];

/** The digest algorithms a rule's `contentHash` may use
 *  (`projection-hash-algorithm`). One member today on purpose: the hash is over
 *  the exact UTF-8 bytes the rule removes (the locator's `byteStart`/`byteEnd`,
 *  never its UTF-16 offsets), and a second algorithm is a deliberate schema
 *  bump, not a per-rule choice. */
export const PROJECTION_HASH_ALGORITHMS = Object.freeze(["sha256"]);
export type ProjectionHashAlgorithm = (typeof PROJECTION_HASH_ALGORITHMS)[number];

/** The fail-closed guard verdicts (`guard-verdict`): `allow` — the guarded rule
 *  holds; `block` — the rule is violated, or the guard could not prove it holds
 *  (a guard that fails to load or throws blocks by default, never passes); and
 *  `degrade` — a declared, named fallback for the one case a hard block would be
 *  wrong. A degrade is never silent: it carries the same message contract. */
export const GUARD_VERDICTS = Object.freeze(["allow", "block", "degrade"]);
export type GuardVerdictKind = (typeof GUARD_VERDICTS)[number];

/** The closed reason a guard rejects or degrades (`guard-rejection-reason`), so
 *  the teaching message is grammar rather than prose a reader has to trust:
 *  `rule-violation` (the guard proved a violation), `guard-unavailable` (the
 *  enforcing module or command is absent), `guard-error` (the guard threw), and
 *  `config-invalid` (the declared guard configuration cannot be honoured). */
export const GUARD_REJECTION_REASONS = Object.freeze([
  "rule-violation",
  "guard-unavailable",
  "guard-error",
  "config-invalid",
]);
export type GuardRejectionReason = (typeof GUARD_REJECTION_REASONS)[number];
