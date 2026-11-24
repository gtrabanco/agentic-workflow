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
 *  `log-kind@1` block. The reader const is `LOG_KINDS` in
 *  `packages/agentic-workflow/src/runner/unit-doc-phases.mjs`; the parity
 *  suite pins the two together. */
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

/** The spawned review passes an operator may route by name
 *  (`pass-name`, issue #201): exactly the eleven passes the issue's Mechanics 1
 *  lists — the eight `review-change` finder axes, the verification pass, the
 *  classifier and the debt transform. `passes.default` is deliberately NOT a
 *  member: it is the config-layer escape that resolves the cheap tier for
 *  unlisted passes (owner decision 2026-10-12), never a spawned pass itself.
 *  The pi package's config validator and the runner crate both import this set
 *  (owner: `vocabulary-residency@1`, issue #643); extending it is a schema-const
 *  change here plus the `AGENTS.md` inventory row, never a second edit. */
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
export type PassName = (typeof PASS_NAMES)[number];

/** The `triage-issue` verdict vocabulary (`triage-verdict`, issue #441).
 *  The router of the ODD-hybrid direction (#307) classifies every input into
 *  exactly one of these, and the set is ordered the way the classification
 *  walks: the organic route first (`one-shot` — small understood work runs
 *  inline with the gate only), then the five verdicts the skill has always
 *  had, then `remove` — the deletion decision, which is a measurement and not
 *  a judgment. The prose surface (`triage-verdict@1` in the skill's
 *  `references/ISSUE_PROCESS.md`) enumerates the same tokens in the same
 *  order; a token added here without a row there is the drift the inventory
 *  refuses.
 *
 *  Neither `one-shot` nor `remove` applies a disposition label: the label
 *  vocabulary stays untouched (issue #441's Non-goals). */
export const TRIAGE_VERDICTS = Object.freeze([
  "one-shot",
  "fix-now",
  "fix-in-unit",
  "promote",
  "postpone",
  "wontfix",
  "remove",
]);
export type TriageVerdict = (typeof TRIAGE_VERDICTS)[number];

/** The provenance a verdict records for the criteria it used
 *  (`triage-criteria-provenance`, issue #441, from the charter's rule:
 *  issue #435 S10). `workflow-generic` — the workflow's own baseline, the only
 *  value a project with no declared catalogue can honestly claim;
 *  `project-declared` — the project's criteria catalogue
 *  (`docs/workflow/VERIFICATION_CRITERIA.md`) said so; `stamped-assumption` —
 *  a dated assumption recorded because the project declares no catalogue yet,
 *  never a silent default. A criterion with no provenance is a defect. */
export const TRIAGE_CRITERIA_PROVENANCE = Object.freeze([
  "workflow-generic",
  "project-declared",
  "stamped-assumption",
]);
export type TriageCriteriaProvenance = (typeof TRIAGE_CRITERIA_PROVENANCE)[number];

/** The obligation values a root suite's tag carries (`test-obligation-kind`,
 *  issue #596): what the suite's assertions actually cover on the surface it
 *  protects. The taxonomy is the one the issue adopts — the observable
 *  contract, the required failure state, the input/size domain's edge, a
 *  distribution surface's shipped bytes, a shared fixture's own correctness,
 *  and a convention no runtime enforces.
 *
 *  `distribution-contract` is the issue's `prompt-byte`/`distribution-contract`
 *  pair resolved to its second spelling (decision D2): it covers a surface that
 *  ships bytes — package contents, prompt text, a generated projection, a
 *  published schema — and it is legitimate even where the assertion looks
 *  redundant with a sibling, which is exactly why the pair needed one token.
 *
 *  The values are what a suite declares at its head, so growing the set is a
 *  schema-const change plus the owner doc's block
 *  (`test-obligation-tag@1` in `skills/unit-lane/references/TESTS.md`) in the
 *  same PR — never a prose-only edit. */
export const TEST_OBLIGATION_KINDS = Object.freeze([
  "contract",
  "failure-path",
  "boundary",
  "distribution-contract",
  "fixture-support",
  "convention",
]);
export type TestObligationKind = (typeof TEST_OBLIGATION_KINDS)[number];

/** The routes a `prose-only` boundary may take in the materialization round
 *  (`materialization-outcome`, issue #564 S1/S5). `scaffold` — the project's own
 *  rule file lands in the target repository; `issue` — the item is filed on the
 *  target forge for the team to build; `declined` — the team answered no, and
 *  the refusal is recorded with its reason. The three are the closed set a
 *  receipt row's `outcome` cell may carry: a prose-only boundary ends with one
 *  of them, never with silence. */
export const MATERIALIZATION_OUTCOMES = Object.freeze([
  "scaffold",
  "issue",
  "declined",
]);
export type MaterializationOutcome = (typeof MATERIALIZATION_OUTCOMES)[number];

/** The closed finding-code set the materialization check emits
 *  (`materialization-finding-code`, issue #564 S4/S9). Every code names a
 *  declared-but-unmaterialized state, so a boundary can never slip back into
 *  "lives in reviewer memory" while the receipt reports a pass:
 *  `boundary-declared-unenforced` (declared, no enforcement recorded),
 *  `boundary-artifact-missing` (an outcome names a rule file the tree lacks),
 *  `feature-map-missing` / `feature-map-shape` (the map is declared and absent,
 *  or still templated), `evidence-driver-missing` (a capture criterion with no
 *  declared driver) and `artifact-evidence-missing` (a criterion whose carrier
 *  records no digest or names no driver). */
export const MATERIALIZATION_FINDING_CODES = Object.freeze([
  "artifact-evidence-missing",
  "boundary-artifact-missing",
  "boundary-declared-unenforced",
  "evidence-driver-missing",
  "feature-map-missing",
  "feature-map-shape",
]);
export type MaterializationFindingCode = (typeof MATERIALIZATION_FINDING_CODES)[number];

/** The artifact kinds an acceptance criterion may name as its evidence
 *  (`artifact-evidence-kind`, issue #564 S3): the shapes a capture driver can
 *  produce a digest for. A capture the set does not carry is prose, not
 *  evidence. */
export const ARTIFACT_EVIDENCE_KINDS = Object.freeze([
  "screenshot",
  "video",
  "state-snapshot",
]);
export type ArtifactEvidenceKind = (typeof ARTIFACT_EVIDENCE_KINDS)[number];

// ── The vocabulary residency set (issue #643) ──────────────────────────────
// Every closed set below was runner-resident until #643. They are machine
// vocabularies of normative surfaces (`normative-surfaces@1` carries their
// rows), so the invariant `vocabulary-residency@1` (owner:
// docs/architecture/ARCHITECTURAL_INVARIANTS.md) makes this package their home
// and the runner imports them. The runner keeps exporting each name from its
// historical module path, so a consumer's import does not move.
//
// One block, one rule: adding a token is a const change here plus the
// consumer's use of it, in the same PR — never a second literal in the runner.

/** The CLI feedback tiers (`feedback-tier`, issue #424): the closed set
 *  `--debug` / `--profile` select from, in precedence order. Published by
 *  `docs/workflow/FEEDBACK.md`; emitted by the crate's feedback channel. */
export const FEEDBACK_TIERS = Object.freeze(["regular", "debug", "profile"]);
export type FeedbackTier = (typeof FEEDBACK_TIERS)[number];

/** The shared writer-driver's refusal vocabulary (`writer-refusal-reason`,
 *  issue #498): a write refusal is a value the caller reads, never an exception
 *  it guesses at. Published by the crate README's `writer-driver-contract@1`. */
export const WRITER_REFUSAL_REASONS = Object.freeze([
  "stale-read",
  "missing-file",
  "unreadable",
  "invalid-document",
]);
export type WriterRefusalReason = (typeof WRITER_REFUSAL_REASONS)[number];

/** The shared-document merge classes (`shared-merge-class`, issue #498/#630):
 *  one git merge driver per class, named `agentic-shared-<class>` in
 *  `.gitattributes`. Published by the crate README's
 *  `writer-driver-contract@1`. */
export const SHARED_MERGE_CLASSES = Object.freeze(["roadmap", "budgets", "repo-state", "logs", "telemetry"]);
export type SharedMergeClass = (typeof SHARED_MERGE_CLASSES)[number];

/** The shared merge driver's refusal vocabulary (`shared-merge-refusal-reason`):
 *  what stderr names and why the driver exited nonzero. A merge the driver
 *  cannot perform is a named refusal, never a silent textual resolution. */
export const SHARED_MERGE_REFUSAL_REASONS = Object.freeze([
  "unknown-path",
  "generated-projection",
  "class-mismatch",
  "unreadable-side",
  "invalid-document",
  "not-append-only",
  "non-append-union",
  "refused-install",
  "usage",
]);
export type SharedMergeRefusalReason = (typeof SHARED_MERGE_REFUSAL_REASONS)[number];

/** The path-protection gate's verdict reasons (`path-protection-reason`,
 *  feature 60): the closed set the Tier 1 gate prints after `PATH-GUARD
 *  <pass|fail> — <code>`. Adding a reason is a SPEC change, never a new code
 *  path. */
export const PATH_GUARD_REASONS = Object.freeze([
  "clean",
  "justified",
  "approved",
  "protected-modification",
  "approval-required",
  "undeclared-test",
  "unmatched-record",
  "malformed-declaration",
  "missing-config",
  "malformed-config",
]);
export type PathGuardReason = (typeof PATH_GUARD_REASONS)[number];

/** What one tool observation can conclude (`doctor-check-status`, issue #537):
 *  `ok` healthy, `missing` absent, `mismatch` two versions that disagree,
 *  `unarmed` a declared contract never applied, `unreachable` present but
 *  silent, and `not-applicable` a surface the project does not declare — never
 *  a defect. Owner: the crate README's `tool-inventory@1`. */
export const DOCTOR_CHECK_STATUSES = Object.freeze([
  "ok",
  "missing",
  "mismatch",
  "unarmed",
  "unreachable",
  "not-applicable",
]);
export type DoctorCheckStatus = (typeof DOCTOR_CHECK_STATUSES)[number];

/** How a tool is installed (`install-route`, issue #537), in the order a
 *  reader picks one: a package manager, the project's own binary download, or
 *  an operator command this CLI never runs. */
export const INSTALL_ROUTES = Object.freeze(["npm", "bun", "pip-uv", "brew", "binary", "instruct-only"]);
export type InstallRoute = (typeof INSTALL_ROUTES)[number];

/** What the setup wizard may do with one check row (`wizard-move`, issue #537):
 *  report it, ask consent and run the project's installer, print the exact
 *  command for the operator, or leave it alone as a residual. */
export const WIZARD_MOVES = Object.freeze(["report-only", "ask-consent-write", "instruct-only", "residual"]);
export type WizardMove = (typeof WIZARD_MOVES)[number];

/** A discovered skill candidate's screening verdict (`skill-screen-verdict`,
 *  issue #537): the deterministic screen either accepts it for consent or
 *  excludes it with a reason. Owner: the crate README's `skill-discovery@1`. */
export const SKILL_SCREEN_VERDICTS = Object.freeze(["screened", "excluded"]);
export type SkillScreenVerdict = (typeof SKILL_SCREEN_VERDICTS)[number];

/** A candidate's consent answer (`skill-consent-answer`): `pending` until the
 *  owner answers, then `yes` or `no`. An install without a recorded `yes` is
 *  the defect this set exists to make unrepresentable. */
export const SKILL_CONSENT_ANSWERS = Object.freeze(["pending", "yes", "no"]);
export type SkillConsentAnswer = (typeof SKILL_CONSENT_ANSWERS)[number];

/** The state of one extra skill on the installed register (`skill-extra-state`,
 *  feature 75): `ok`, `unpinned` (no pin declared), `stale` (past the declared
 *  decay window) or `incomplete` (extras absent from the manifest). */
export const SKILL_EXTRA_STATES = Object.freeze(["ok", "unpinned", "stale", "incomplete"]);
export type SkillExtraState = (typeof SKILL_EXTRA_STATES)[number];

/** The scripts sanctioned to run under `node` (`node-sanctioned-script`, issue
 *  #329/#331): the bootstrap pair that must run before bun exists, plus the
 *  root suite runner. One declaration, two readers — the tool-choice policy and
 *  the invocation-drift gate — so a script added here is sanctioned on both
 *  layers. Owner: `AGENTS.md` §Runtime convention. */
export const NODE_SANCTIONED_SCRIPTS = Object.freeze([
  "scripts/setup-env.mjs",
  "scripts/update-tools.mjs",
  "scripts/run-root-suite.mjs",
]);
export type NodeSanctionedScript = (typeof NODE_SANCTIONED_SCRIPTS)[number];

/** The gate-rejection types (`gate-rejection-type`, issue #643 S7): what the
 *  executor's gates print as `GATE REJECTION — <type>` and what an agent
 *  chooses between at the end of a turn. This const is the vocabulary's machine
 *  surface; `gate-rejection-vocabulary@1` in POLICY.md §8 is a rendered
 *  restatement of it, recomputed by `rendered-facts@1` rather than trusted. */
export const GATE_REJECTION_TYPES = Object.freeze([
  "dependency",
  "status",
  "phase-lint",
  "path-protection",
  "stale-or-missing-receipt",
  "stale-unit-doc",
]);
export type GateRejectionType = (typeof GATE_REJECTION_TYPES)[number];

/** The needs-input routes (`needs-input-route`, issue #644 S3): the stages that
 *  own a fact and may receive it back through the `open-questions@1` block.
 *  `design` owns scope and architecture questions, `unit-lane` owns the
 *  plan-owned facts, and `init-workspace` owns a *substrate* gap — a question
 *  the workspace has no document scaffolded to own, so the scaffold is the
 *  stage that creates its home. A substrate row qualifies the route with the
 *  class it claims (`init-workspace:<substrate-class>`), and the dispatcher
 *  verifies that claim against the workspace's census instead of trusting the
 *  cell — that verification is what makes the third route structural rather
 *  than an escape hatch. */
export const NEEDS_INPUT_ROUTES = Object.freeze(["design", "unit-lane", "init-workspace"]);
export type NeedsInputRoute = (typeof NEEDS_INPUT_ROUTES)[number];

/** The substrate classes (`substrate-class`, issue #644 S3/S4): the four
 *  answers `init-workspace`'s engineering interview asks and must land in a
 *  written scaffold section. Each class names the surface that would own it —
 *  the architecture document, the charter's `Decision records` slot, the
 *  charter's `API posture` slot, and the guide's documentation map — so the
 *  census reads one declared owner per class instead of guessing where a fact
 *  "should" live. A class the project declines is a recorded row
 *  (`substrate-declines@1`), never a silent skip. */
export const SUBSTRATE_CLASSES = Object.freeze([
  "architecture",
  "decision-records",
  "api-posture",
  "documentation-map",
]);
export type SubstrateClass = (typeof SUBSTRATE_CLASSES)[number];

/** The scope a recorded decision declares (`decision-scope`, issue #650 S3/S4):
 *  the one fact that decides whether the decision stays in the unit ledger or
 *  is promoted to a permanent owner doc. A `unit-only` decision binds the unit
 *  that took it and dies with the unit's folder; a `cross-unit` decision binds
 *  work beyond that unit, so it is promoted to exactly ONE owner doc — the
 *  guide's laws, the architecture document, or the architectural invariants —
 *  and the unit row cites that doc instead of restating it. The vocabulary is
 *  the closed set a `decision` row's trailing `scope` cell may carry; the
 *  mapping from a scope's subject to its owner doc is the procedure the
 *  architecture document publishes, never a second copy here. */
export const DECISION_SCOPES = Object.freeze(["unit-only", "cross-unit"]);
export type DecisionScope = (typeof DECISION_SCOPES)[number];

/** The guard-plugin kinds (`guard-plugin-kind`, issue #654): the two answers to
 *  "what decides this project's own guard?". `deterministic` is the kind this
 *  repository ships — an ordered rule list evaluated locally, with no model and
 *  no network. `model-backed` is the declared slot a case-by-case reviewer
 *  occupies once its adapter exists; the seam accepts a declaration of that kind
 *  and registers no link until a handler is supplied, so the slot exists without
 *  the seam assuming a model. */
export const GUARD_PLUGIN_KINDS = Object.freeze(["deterministic", "model-backed"]);
export type GuardPluginKind = (typeof GUARD_PLUGIN_KINDS)[number];

/** The surfaces a declared guard may gate (`guard-plugin-surface`, issue #654):
 *  the categories a request is decided on — a shell command, a path, a tool
 *  call, a skill name, an MCP surface. The vocabulary is the seam's own; a
 *  permission layer's transport names are mapped onto it by that layer's
 *  adapter, never copied here. */
export const GUARD_PLUGIN_SURFACES = Object.freeze(["bash", "path", "tool", "skill", "mcp"]);
export type GuardPluginSurface = (typeof GUARD_PLUGIN_SURFACES)[number];

/** The delivery-condition families (`delivery-condition-kind`, issue #704): the
 *  phrasings a project writes when a delivery waits on another delivery. Each is
 *  a *condition on another issue's landing*, and each names the issue it waits
 *  for — that citation is the carrier the machine re-checks. `covered-by` is the
 *  coverage claim ("closed as covered by #N", "cerrada como cubierta por #N");
 *  `reopen-when` is the recorded follow-up ("reopen when #N lands", "reabrir …
 *  cuando #N lande"); `proceeds-when` and `waits-for` are the two forward-gating
 *  spellings; `retire-when` records a retirement its own landing makes due. */
export const DELIVERY_CONDITION_KINDS = Object.freeze([
  "covered-by",
  "reopen-when",
  "proceeds-when",
  "waits-for",
  "retire-when",
]);
export type DeliveryConditionKind = (typeof DELIVERY_CONDITION_KINDS)[number];

/** The judgment of one condition against the cited issues' states
 *  (`delivery-condition-verdict`, issue #704). `satisfied` — the cited delivery
 *  landed and nothing is due; `pending` — the cited delivery has not landed and
 *  the record is consistent; `stalled` — the cited state moved past the condition
 *  and the recorded follow-up is due (the #301 shape); `unresolved` — the machine
 *  cannot read the cited issue, so it refuses to guess. */
export const DELIVERY_CONDITION_VERDICTS = Object.freeze(["satisfied", "pending", "stalled", "unresolved"]);
export type DeliveryConditionVerdict = (typeof DELIVERY_CONDITION_VERDICTS)[number];

/** What a sweep reports (`delivery-condition-finding`, issue #704).
 *  `covered-by-open` — a closed issue (or a settled roadmap row) claims coverage
 *  by an issue that is still open; `condition-stalled` — a recorded follow-up
 *  came due and nobody ran it; `condition-uncarried` — a condition-shaped
 *  sentence names no issue, so no machine can re-check it. */
export const DELIVERY_CONDITION_FINDINGS = Object.freeze([
  "covered-by-open",
  "condition-stalled",
  "condition-uncarried",
]);
export type DeliveryConditionFinding = (typeof DELIVERY_CONDITION_FINDINGS)[number];

/** What the close-time guard refuses (`delivery-condition-refusal`, issue #704).
 *  One class, because it is the only close-time violation that is false-positive
 *  free: a coverage claim against an undelivered cover is wrong by construction.
 *  The follow-up families are post-close by nature and belong to the sweep. */
export const DELIVERY_CONDITION_REFUSALS = Object.freeze(["covered-by-open"]);
export type DeliveryConditionRefusal = (typeof DELIVERY_CONDITION_REFUSALS)[number];
