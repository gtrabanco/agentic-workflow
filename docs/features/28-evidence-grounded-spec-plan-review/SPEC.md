# 28 — evidence-grounded-spec-plan-review

> Feature specification for issue
> [#146](https://github.com/gtrabanco/agentic-workflow/issues/146). Product and
> engineering authority are complete; implementation must preserve this SPEC.

## Goal

Make product specifications and engineering plans evidence-grounded,
independently reviewable, and content-bound before implementation. Add public
`review-spec` and `review-plan` gates, deterministic pre-execution snapshot and
receipt contracts, progressive authoring/readiness passes, explicit repair
ownership, and complete evidence/obligation ledgers so incomplete design or
planning returns upstream before code exists. The normal qualified path is one
independent review, at most one evidence-bounded author repair, and one
re-review; a second repair/re-review cycle is a convergence anomaly that must
be diagnosed and routed to its Product, Plan, source, environment, or runtime
owner instead of becoming a long `review-change` / `fold-findings` loop or a
collection of follow-up issues.

## Branch

`feat/28-evidence-grounded-spec-plan-review`

## Size

`L` — this changes the public workflow, adds two public skills and one internal
grounding capability, extends the schema package and workflow transition
vocabulary, and rewires planning, execution, review, audit, distribution, and
bilingual documentation. The plan has eight single-concern phases: the five
originally planned (P1–P5) plus the three appended by the 2026-08-31
user-approved amendment (P6 qualification corpus, P7 ledger/status
reconciliation, P8 terminal re-review and close-out). No further split trigger
applies.

## Dependencies

- Hard: feature 26 / PR #145 is merged and
  `@gtrabanco/agentic-workflow-schema@3.4.0` is published.
- Satisfied execution prerequisite: feature 27 / PR #150 is merged and creates
  the `@gtrabanco/pi-agentic-workflow` distribution surface and byte-parity
  bundle. Feature 28 must ship its new/changed skills through that surface as
  well as the canonical root. Feature 27 remains independently owned and is
  not replanned here.
- Downstream: feature 29 depends on this feature's final review vocabulary and
  current `PLAN-REVIEW-PASS` handoff.

---

## Product half

### Context

The repository already separates product design, engineering planning,
implementation, candidate review, staged verification, and PR audit. It does
not independently review the Product half before engineering planning or the
engineering plan before source edits. A plausible but incomplete SPEC or an
unsupported plan assumption can therefore survive until candidate review,
where correction is expensive and repeated local folding can hide that the
actual defect is upstream.

Feature 25 made candidate review receipts content-bound. Feature 26 made staged
verification bounded and content-bound. Those contracts answer whether a
candidate and its declared verification evidence are current; they do not prove
that the product obligation set is complete or that the implementation plan is
supported by repository evidence. This feature introduces that missing
pre-execution authority without replacing candidate review, verification, or
final audit.

The design adopts the applicable evidence-first and last-causal-event lessons
from Gentle AI v2.5.0 release candidates, but it does not depend on Gentle AI,
copy its lifecycle, or claim equivalent token savings. The measurable target is
less wrong work and less rework, not fewer exploratory reads.

### Business goals

- Detect missing use cases, unsupported claims, and contradictory assumptions
  before implementation cost is incurred.
- Make complete delivery of the reviewed feature/fix the success condition;
  current-unit obligations cannot be exported to new issues to manufacture
  closure.
- Preserve human authority over product intent while allowing engineering
  planning and repair to proceed autonomously inside reviewed scope.
- Reduce review/fold/replan churn through earlier evidence and explicit backward
  routes. The effect is unknown until the canary runs and is measured only
  observationally (D9, known-issues #7); no acceptance row of this unit claims
  the reduction.
- Make more than one review/repair/re-review cycle exceptional in qualification
  evidence without ever using a cycle budget to approve incomplete work.

### Product-surface considerations

- i18n: every changed human workflow document ships in English and Spanish in
  the same change; SPECs, plans, prompts, code, commits, and PRs remain English.
- Accessibility: n/a, no UI is introduced.
- SEO: n/a, no public web surface is introduced.
- Pricing: n/a, no commercial surface is introduced.
- UI design reference: n/a, the public surface is skills, package contracts,
  receipts, and workflow documentation.

### Scope

#### In scope

- **S1:** Add public, read-only `review-spec` and `review-plan` skills with
  fixed stage-specific checks, verdicts, evidence requirements, and return
  routes.
- **S2:** Add a non-authoritative internal evidence-grounding capability used
  by `design-feature`, `plan-feature`, and `plan-fix`, mapping material claims
  to authority, exact evidence, freshness, and an explicit unknown/owner.
- **S3:** Split issue-derived feature design from engineering planning so
  `review-spec` always occurs between the two authorities; fixes route from
  `plan-fix` directly to `review-plan`.
- **S4:** Add strict `PreExecutionArtifactSnapshot v1` and
  `PreExecutionReviewReceipt v1` package contracts, canonical digests,
  generated structural projections, fixtures, limits, examples, and freshness
  semantics without changing candidate review or verification contracts.
- **S5:** Bind plan review to the exact reviewed Product authority and current
  plan artifact set. Product changes invalidate Product and descendant plan
  evidence; plan-only changes invalidate plan evidence.
- **S6:** Prevent approval resurrection after a causal authoring event by
  including an authoring-owned `artifactRevisionId` in every snapshot and
  rotating it on every artifact write, including a revert to prior bytes.
- **S7:** Add one mechanical obligation ledger from every normative SPEC/fix
  obligation and affected invariant/use case to phase, task, validator,
  implementation owner, evidence, and status.
- **S8:** Add clean-context reviewer prompts, optional independent critique and
  synthesis, union-of-findings semantics, counter-evidence dismissal, honest
  model-diversity labels, and deterministic no-progress rules.
- **S9:** Make current SPEC review evidence a planning gate and current plan
  review evidence an implementation gate; route later findings caused by
  design or planning upstream instead of continuing a code-local fold loop.
- **S10:** Provide a legacy/manual adoption path, migration notes, skill version
  bumps, synchronized root/Pi distribution metadata and bundle parity,
  context-budget qualification, golden-fixture coverage, and an evidence-based
  canary protocol.
- **S11:** Make design and planning progressive before independent review:
  inventory obligations/questions, acquire and compact evidence, draft, run a
  deterministic readiness preflight, then hand exact frozen artifacts to a
  context-clean reviewer. Readiness may return only `READY-FOR-REVIEW |
  NEEDS-EVIDENCE | NEEDS-DESIGN | NEEDS-REPLAN`; it can never emit review PASS.
- **S12:** Persist compact planning evidence for every material Engineering
  claim and plan cut, bind it into the Plan snapshot, and provide only the
  phase-relevant slice to execution so neither reviewer nor writer reconstructs
  the planning argument from conversation history.
- **S13:** Define convergence qualification and telemetry: the first findings
  set is root-caused and repaired as one evidence-bounded batch; one re-review
  is normal; entering a second repair/re-review cycle produces a mandatory
  diagnosis and is a canary/release anomaly, never an automatic PASS or forced
  stop with defects open.

#### Out of scope / non-goals

- Implementation-source mapping immediately before a phase write belongs to
  feature 29.
- No public `fix-spec`, `fix-plan`, `fold-plan-findings`, or
  `evidence-closure` command; owning author skills repair their own artifacts.
- No autonomous invention or approval of product intent, scope, roles,
  authority, or user outcomes.
- No named model/provider routing, retries, concurrency, durable event store,
  atomic acknowledgement protocol, or context broker; AWL or another runtime
  owns those operations.
- No second SDD lifecycle, Gentle AI dependency, automatic issue creation, or
  unmeasured token-saving claim.
- No replacement or weakening of TDD, `review-change`, candidate
  `ReviewReceipt`, `VerificationPlan`/`VerificationReceipt`, or `audit-pr`.
- No automatic mutation of an artifact by its reviewer and no bookkeeping
  commit after a terminal PASS.
- No same-context readiness preflight may be presented as independent review or
  approval, and no maximum cycle count may discard, downgrade, or waive a
  material finding.
- No guarantee that a direct out-of-band edit/revert which bypasses every
  authoring event can be detected; runtimes enforce event rotation and manual
  workflows must preserve the authoring handoff.

### Capability closure

The repository has no `docs/CAPABILITIES.md`. The derived inventory for this
feature is: public package API, skill authoring/review surfaces, workflow
transition/sensing, planning artifacts, execution/review/audit gates,
distribution, bilingual documentation, and qualification tests. Roles are
`product authority`, `artifact author`, `independent reviewer`, `runtime
operator`, and `executor`.

**1. Entity closure — pre-execution snapshot, review receipt, findings ledger,
and obligation ledger**

- [x] Create — UI: n/a · API: package constructors/validators and author/review
  skill outputs create bounded snapshots, receipts, and ledger rows · tests:
  public-entry construction, stage matrix, and workflow fixture suites.
- [x] Read/list — UI: n/a · API: package-root validation/digest/freshness
  exports plus stable Markdown ledger tables · tests: public import and strict
  parser fixtures.
- [x] Update — snapshot/receipt values are immutable; authors rotate
  `artifactRevisionId` and create a new snapshot after a write; ledger rows gain
  resolution evidence without rewriting their obligation identity · tests:
  mutation and resolution matrices.
- [x] Delete — n/a: evidence is superseded, never edited into a different
  historical claim; runtime retention is outside this feature · test:
  superseded evidence cannot satisfy a current gate.
- [x] State transitions — `authored -> review-fail | needs-design |
  review-pass`; repair returns to the owning author and creates a new revision;
  current Product PASS permits planning; current Plan PASS permits discovery
  and execution · tests: deterministic transition fixtures.

**Capabilities and role matrix**

- [x] Define or change product intent — visible entry point:
  `design-feature` interview/upsert · `product authority`: allowed · `artifact
  author`: denied without explicit product authority · `independent reviewer`:
  denied · `runtime operator`: denied · `executor`: denied.
- [x] Choose engineering design inside reviewed scope — visible entry point:
  `plan-feature` / `plan-fix` · `product authority`: allowed · `artifact
  author`: allowed · `independent reviewer`: denied · `runtime operator`:
  denied · `executor`: denied.
- [x] Review a frozen Product or Plan snapshot — visible entry point:
  `review-spec` / `review-plan` · `product authority`: allowed when context
  clean · `artifact author`: denied from silently self-approving; the shipped
  manual mode cannot enforce identity, so exclusion stays a runtime
  responsibility (known-issues #9) · `independent reviewer`: allowed ·
  `runtime operator`:
  invokes/persists only · `executor`: denied.
- [x] Repair a failed artifact — visible entry point: owning author skill with
  findings input · `product authority`: allowed · `artifact author`: allowed
  within its authority · `independent reviewer`: denied · `runtime operator`:
  routes only · `executor`: denied.
- [x] Advance execution — visible entry point: workflow transition and
  `execute-phase` gate · `product authority`: allowed · `artifact author`: n/a
  · `independent reviewer`: supplies evidence only · `runtime operator`:
  allowed when deterministic gates pass · `executor`: allowed only with current
  receipts.

**2. Integration closure — derived inventory**

- [x] Public package API — additive contract types, validators, canonical
  digests, freshness comparison, generated projections, and package docs;
  existing exports retain meaning · tests: package suites and pack check.
- [x] Skill authoring/review — grounding in `design-feature`, `plan-feature`,
  and `plan-fix`; new `review-spec` and `review-plan`; repair remains with the
  author · tests: text-contract workflow fixtures.
- [x] Workflow transition/sensing — closed intents, capability profiles,
  evidence vocabulary, routing, and status recommendations include both review
  stages and fail closed on missing/stale receipts · tests: transition matrix.
- [x] Planning artifacts — compact `planning-evidence.md` (or XS/S embedded
  section), stage-aware `planning-findings.md`, and a frozen obligation ledger
  are produced without a competing lifecycle · tests: parser/readiness/coverage
  fixtures.
- [x] Execution/review/audit — `execute-phase`, `loop-review-fold`,
  `review-change`, and `audit-pr` consume current upstream evidence and route
  root causes backward · tests: route and no-issue-export fixtures.
- [x] Distribution — every new/changed skill remains discoverable under the
  intended invocability and metadata rules in the canonical root and the
  feature-27 Pi bundle · tests: Skills CLI listing, Pi bundle/parity suite, and
  context budget checker.
- [x] Bilingual documentation — workflow, orchestration, migration, and skill
  catalog surfaces change in EN/ES pairs · tests: repository doc checks and
  read verification.
- [x] Qualification — package tests, root workflow fixtures, golden fixture,
  installability, independent review, and a manual canary protocol cover the
  new path · evidence: P5 qualification record.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | A designed Product half cannot flow directly into engineering planning | in-scope | S1, S3; AC3 |
| 2 | A completed plan cannot flow directly into source edits | in-scope | S1, S9; AC4, AC8 |
| 3 | Reviewers cannot silently edit the artifact they approve | in-scope | S1; AC3, AC4 |
| 4 | Missing product choices return to the human rather than being invented | in-scope | S1, S2; AC3, AC5 |
| 5 | Engineering repair stays autonomous when reviewed product intent is unchanged | in-scope | S1, S9; AC4, AC8 |
| 6 | A Product edit invalidates every descendant Plan approval | in-scope | S4-S6; AC2 |
| 7 | A Plan-only edit leaves historical Product review traceable but requires a new Plan review | in-scope | S4-S6; AC2 |
| 8 | Reverting bytes after an authoring event cannot revive an older PASS | in-scope | S6; AC2 |
| 9 | A PASS cannot coexist with unresolved material findings or obligations | in-scope | S7-S8; AC6, AC7 |
| 10 | Two reviewers using the same model are not advertised as model-diverse | in-scope | S8; AC7 |
| 11 | Majority vote cannot erase a material finding | in-scope | S8; AC7 |
| 12 | Repeating the same review without changed evidence is no-progress | in-scope | S8; AC7 |
| 13 | Feature and fix planning use the same plan-review authority without inventing a feature SPEC for a fix | in-scope | S3; AC4, AC5 |
| 14 | Existing planned work can adopt the gates without weakening frozen acceptance | in-scope | S10; AC8, AC10 |
| 15 | Candidate review and staged verification contracts remain unchanged | in-scope | S4; AC9 |
| 16 | A current-unit omission may be moved into a follow-up issue automatically | out-of-scope | Automatic-issue non-goal |
| 17 | The skills choose providers, retry limits, storage, or concurrency | out-of-scope | Runtime-operations non-goal |
| 18 | Token savings are claimed from design alone | out-of-scope | Unmeasured-savings non-goal |
| 19 | Authoring reaches review only after a deterministic readiness preflight | in-scope | S11; AC13 |
| 20 | Planning evidence survives context changes without raw exploration history | in-scope | S12; AC13 |
| 21 | One repair/re-review is normal and a second cycle is an explicit anomaly | in-scope | S13; AC7, AC12, AC14 |
| 22 | A cycle budget may approve or hide an unresolved finding | out-of-scope | Cycle-budget non-goal |
| 23 | Machine contracts are validated through the package's public entries with canonical vectors and bounded diagnostics | in-scope | S4; AC1 |
| 24 | The executor path is qualified by a dated manual golden-fixture run, not a provider-dependent automated run | in-scope | S10; AC11 |

### Acceptance criteria

- [ ] **AC1 — command-verified:** `cd
  packages/agentic-workflow-schema && npm test` exits 0 with strict
  `PreExecutionArtifactSnapshot v1` and `PreExecutionReviewReceipt v1`
  public-entry suites, canonical vectors, bounded diagnostics, stage-specific
  semantic validation, and generated-projection parity.
- [ ] **AC2 — command-verified:** package tests prove exact-content and
  `artifactRevisionId` binding, Product-to-Plan parent binding, Product/Plan
  drift precedence, authoring-event revert non-resurrection, and rejection of
  candidate review or verification receipts as substitutes.
- [ ] **AC3 — command-verified:** `node --test
  scripts/pre-execution-quality.test.mjs` exits 0 with fixtures showing
  `review-spec` is read-only, checks product/role/capability/expectation/
  acceptance closure, and returns exactly `SPEC-REVIEW-PASS |
  SPEC-REVIEW-FAIL | NEEDS-DESIGN` with the contracted repair route.
- [ ] **AC4 — command-verified:** the same root suite proves `review-plan`
  covers both feature and fix units, reconciles every obligation to a phase,
  task, validator, and closure condition, and returns exactly
  `PLAN-REVIEW-PASS | PLAN-REVIEW-FAIL | NEEDS-DESIGN`.
- [ ] **AC5 — command-verified:** root fixtures prove evidence grounding never
  emits approval, feature issues stop for `review-spec` before Engineering-half
  planning, fix issues route `plan-fix -> review-plan`, and unsupported claims
  remain explicit unknowns rather than fabricated rationales.
- [ ] **AC6 — command-verified:** root fixtures reject blank, partial,
  deferred, or issue-exported current-unit obligations and accept `n/a` only
  with non-contradictory evidence; every accepted obligation row has phase,
  owner, validator, evidence, and `verified` closure.
- [ ] **AC7 — command-verified:** root fixtures prove clean-context review,
  author-exclusion where identities are available, unioned findings,
  counter-evidence-only dismissal, truthful diversity labels, bounded critique/
  synthesis, and changed-snapshot-or-named-question no-progress enforcement.
- [ ] **AC8 — command-verified:** transition and workflow fixtures prove a
  current SPEC receipt gates planning, a current Plan receipt gates execution,
  legacy adoption does not rewrite frozen acceptance, and later plan/spec root
  causes route upstream before another code-local fold.
- [ ] **AC9 — read-verified:** package and repository diffs preserve the
  meanings and public shapes of `CandidateSnapshot v1`, candidate
  `ReviewReceipt v1`, `VerificationPlan v1`, and `VerificationReceipt v1`;
  `review-change` and `audit-pr` retain candidate and delivery authority.
- [ ] **AC10 — command-verified:** package version/export/pack checks,
  canonical-to-Pi skill bundling/parity and Pi package tests, `node
  scripts/check-skill-context.mjs`, `npx skills add . --list`, skill
  changelogs, synchronized EN/ES docs, and migration fixtures all pass.
- [ ] **AC11 — read-verified:** the required executor-path golden fixture
  demonstrates the complete manual path through `review-spec`, planning,
  `review-plan`, execution gating, candidate review, and audit without a
  provider/runtime dependency or automatic issue creation.
- [ ] **AC12 — read-verified:** an independent review of the exact candidate
  reports no unresolved fix-now finding; the canary protocol records baseline
  and post-change measurements without claiming improvement before results
  exist.
- [ ] **AC13 — command-verified:** root fixtures prove Product and Engineering
  authoring follow inventory -> evidence -> draft -> readiness -> independent
  review; the readiness gate checks complete evidence/obligation/unknown
  structure, binds compact planning evidence into the Plan snapshot, and cannot
  emit any review PASS verdict.
- [ ] **AC14 — command/read-verified:** route fixtures and the qualification
  corpus prove the first review findings are repaired as one root-caused batch,
  one re-review is the normal correction path, and entry into a second
  repair/re-review cycle emits a convergence anomaly with an exact owner and
  evidence deficit. The release canary includes a feature, a fix, and a
  cross-boundary unit; any sample needing the second cycle fails qualification
  until its design/plan/root cause is corrected.

### Tooling

- Existing TypeScript/package test infrastructure owns machine-contract
  validation.
- Existing root Node test fixtures own text-contract and routing regression;
  feature 27's bundle/parity tests own root-to-Pi distribution identity.
- `node scripts/check-skill-context.mjs`, `npx skills add . --list`, and the
  golden fixture own context, distribution, and weak-executor qualification.
- Serena/symbol navigation and Engram/memory may accelerate discovery but are
  optional and advisory; repository evidence remains authoritative.

### Product decisions

- **PD1 — public vocabulary:** expose `review-spec` and `review-plan`; do not
  expose a generic evidence-closure or separate fold/fix command.
- **PD2 — product authority:** only the user/product authority may close missing
  intent. Reviewers may prove a gap but never choose the desired behavior.
- **PD3 — repair authority:** `design-feature` repairs Product findings;
  `plan-feature`/`plan-fix` repair Plan findings. Mechanical wording may be
  repaired by the owner only when intent is unchanged.
- **PD4 — reviewer independence:** context-clean evidence is required; model-
  family diversity is preferred but never fabricated. Material findings are
  unioned and dismissed only with counter-evidence, not votes.
- **PD5 — obligation ownership:** current-unit work remains in the unit unless
  the user explicitly amends the SPEC. No automatic follow-up issue is a valid
  closure mechanism.
- **PD6 — manual portability:** every public stage works in sequential fresh
  conversations. AWL automation is a consumer, not a prerequisite.
- **PD7 — convergence is a quality property:** no loop count grants PASS. The
  workflow qualifies for release only when its mandatory corpus normally
  converges after zero or one author-repair batch; a second batch triggers
  diagnosis and upstream correction.

### Deferred decisions

none

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders remain in the Product half.
- [x] Out-of-scope has concrete ownership and non-goal bullets.
- [x] Every entity capability row is filled or explicitly n/a.
- [x] Integration closure walks every derived subsystem.
- [x] Every capability lists every derived role as allowed, denied, invokes,
  routes, or n/a.
- [x] Expectation sweep has at least ten resolved rows with pointers.
- [x] Every in-scope bullet maps to at least one acceptance criterion.
- [x] Every acceptance criterion is command-verified or read-verified.
- [x] Deferred decisions is present and reads `none`.

Engineering boxes:

- [x] Dev scenarios include every fixed failure category.
- [x] Every phase passes the eight-box Phase-lint.
- [x] No template placeholders remain anywhere in the SPEC.

## Design status

`designed`

---

## Amendments

| Date | Authority | Change |
|---|---|---|
| 2026-08-30 | User-approved | Strengthen progressive evidence preparation, review readiness, compact planning-evidence persistence, and second-cycle convergence diagnosis/qualification without weakening fail-closed review. |
| 2026-08-31 | User-approved | Re-plan routed from review findings F2+F3+F6 (`replan-in-unit`): append P6 (qualification corpus), P7 (ledger/status reconciliation), P8 (terminal re-review and PR close-out). No acceptance row changed — the frozen manifest blob is unchanged. The roadmap row is corrected from the premature `done` (F3) to `in-progress` in the same replan commit. |
| 2026-08-31 | User-approved | Product repair batch from review rs-28-20260831-002 (RS1+RS2+RS15–RS17, one batch): Size block corrected to the eight-phase reality (RS1), AC11 verification label aligned with the frozen ACCEPTANCE.md `read-verified` (RS2), author-exclusion cell and churn business goal made truthful to the shipped-mode limits (RS15, RS16), expectation-sweep pointers added for AC1/AC11 (RS17). Scope, obligations, and acceptance rows unchanged; the frozen ACCEPTANCE.md blob is unchanged. |

---

## Engineering half

### Technical goals

- Publish one additive, bounded contract family with one semantic validation
  authority and deterministic canonicalization/freshness functions.
- Keep artifact authorship, independent review, execution, candidate review,
  verification, and audit as distinct authorities with explicit backward
  transitions.
- Make evidence and obligation completeness mechanically inspectable while
  keeping skills text-first and runtime behavior outside the skills package.
- Make review readiness structurally decidable before spending an independent
  review context, while keeping correctness approval exclusively with that
  independent review.
- Make the second repair/re-review cycle observable as a root-cause anomaly and
  a failed qualification sample rather than normal workflow throughput.
- Preserve manual execution and existing candidate/delivery contracts.

### Architecture impact

- Schema/domain contract code lives in
  `packages/agentic-workflow-schema/src/`; generated JSON files are structural
  projections, never a second semantic validator (AD-007).
- Review semantics and portable prompts live in new skill folders; shared
  evidence-grounding rules live in one internal skill/reference owner instead
  of being copied across authoring skills.
- Workflow sensing and direct-invocation routing extend existing
  `WORKFLOW_INTENTS`, evidence vocabularies, capability profiles, and transition
  tables rather than creating a second state machine.
- Runtime persistence, event sequence enforcement, author exclusion, model
  routing, retry budgets, and terminal acknowledgement remain consumer ports.
- After feature 27 merges, its bundle script remains the sole writer of
  `packages/pi-agentic-workflow/skills`; feature 28 edits canonical root skills,
  rebuilds the bundle, and proves byte parity instead of hand-editing copies.
- Human workflow docs changed by implementation have synchronized EN/ES
  siblings (AD-002). Implementation is one PR against `main` (AD-004).
- Architectural-invariant classification: `n/a: no project invariants declared`
  at NRS snapshot `2026-08-30-pre-execution-planning`. The package/skill/runtime
  boundaries above preserve the repository's observed architecture.

### Design

#### 1. Evidence-grounded authoring

Add one internal, non-user-invocable `evidence-grounding` capability consumed by
`design-feature`, `plan-feature`, and `plan-fix`. Its fixed row is:

```text
claim-or-obligation | authority-kind | source-and-location | observed-revision |
freshness | status: proven|decision|unknown | owner-or-next-evidence
```

The step asks a bounded set of material questions, reads authoritative
repository/external sources, and returns only `CONTEXT-PREPARED |
NEEDS-EVIDENCE | NEEDS-DESIGN`. It cannot return review PASS. A repeated read
must answer a new named question or expose new evidence; otherwise it is
no-progress. Stable user decisions are written to the SPEC/decisions artifact,
not reconstructed from memory.

Authoring is progressive and ordered; it does not jump from discovery directly
to a polished artifact:

1. inventory every normative obligation, affected role/use case, failure state,
   compatibility boundary, decision, and material unknown;
2. acquire evidence for each material claim, following references/topology as
   far as the claim requires rather than stopping at a file-count threshold;
3. compact conclusions into the Product half/decisions or, for Engineering,
   `planning-evidence.md` (M/L) / `### Planning evidence` in SPEC (XS/S);
4. draft the SPEC or plan from those frozen conclusions and cut phases only
   after affected surfaces, validators, and unknown ownership are evidenced;
5. run a deterministic readiness preflight before invoking an independent
   reviewer.

The readiness preflight checks required headings, capability/expectation
closure, evidence-row completeness/freshness, unknown ownership, obligation
coverage, scenario matrix, phase-lint, validator mapping, and unresolved
decisions. It emits only `READY-FOR-REVIEW | NEEDS-EVIDENCE | NEEDS-DESIGN |
NEEDS-REPLAN`. It is an authoring quality gate, not a reviewer, and cannot emit
or imply `SPEC-REVIEW-PASS` or `PLAN-REVIEW-PASS`.

`planning-evidence.md` is a compact table, not an exploration transcript:

```text
question-or-claim | authority | repository-evidence-and-revision |
affected-decision-or-obligation | freshness | status | owner-or-next-evidence
```

The Plan snapshot binds this artifact. `review-plan` receives the whole table;
execution receives only the rows relevant to its frozen phase. Raw searches,
discarded hypotheses, and conversational history are excluded.

Every authoring write creates a new opaque, bounded `artifactRevisionId` and
includes it in the handoff. A runtime persists and rotates the id. A manual
workflow carries it to the fresh reviewer. The same id may be reused for
multiple reviews of unchanged bytes, but never across an authoring write,
including a revert.

#### 2. PreExecutionArtifactSnapshot v1

Add internal canonical contract definition plus package-root types/functions:

- contract id `agentic-workflow/pre-execution-artifact-snapshot@1`;
- `stage: spec | plan`, `unitKind: feature | fix`, bounded `unitId`, exact
  `sourceRevision`, and bounded `artifactRevisionId`;
- ordered artifact rows with closed `kind`, normalized repository-relative
  `path`, selector `whole-file | spec-product-v1`, byte length, and lowercase
  SHA-256 digest;
- ordered authoritative-context bindings with closed kind, stable identifier,
  `present | absent`, and exact digest/null matrix;
- `parentSpecSnapshotDigest: null` for a SPEC snapshot and required for a Plan
  snapshot;
- canonical UTF-8 JSON, sorted object keys, array order preserved, lowercase
  SHA-256 snapshot digest, bounded payload/cardinality/string diagnostics, and
  readonly published vectors.

`spec-product-v1` deterministically selects the title, Goal, Branch, Size,
Dependencies, Product half, and Design status from the one SPEC without hashing
the empty/future Engineering half. Duplicate, missing, or out-of-order required
headings fail. A Plan snapshot hashes the complete governing SPEC plus the
frozen `ACCEPTANCE.md`, compact planning evidence, and every size-applicable
Plan/Tasks/testing/decision/architecture artifact. Mutable execution progress,
raw exploration history, and findings resolution are not Plan authority.

The package exposes one authoritative snapshot validator/normalizer, one
canonical digest entry, one deterministic Product selector, and a stage-aware
snapshot builder over caller-supplied bytes. The package never reads Git or the
filesystem.

#### 3. PreExecutionReviewReceipt v1

Add contract id `agentic-workflow/pre-execution-review-receipt@1` with:

- exact stage and snapshot digest;
- closed verdict `spec-review-pass | spec-review-fail | plan-review-pass |
  plan-review-fail | needs-design` with stage/verdict compatibility;
- bounded structured findings containing stable id, severity, class, claim,
  evidence references, verification status, and resolution status;
- opaque reviewer/session/role/author identities, review policy version, and
  UTC timestamps;
- optional bounded parent receipt digests for critic, synthesis, or arbitration
  roles, with no majority/quorum semantic;
- canonical digest and a pure comparison against the current snapshot and
  policy, returning one stable stale/review code.

The authoritative receipt-against-snapshot validator rejects PASS with a
material/unverified/open finding, wrong stage, wrong snapshot, reused author
identity where exclusion is declared enforceable, invalid parent topology, or
unknown fields. Structural projections disclose that semantic PASS belongs to
the runtime validator.

Changing Product bytes, Product context, Product revision id, or its source
binding changes the Product snapshot and invalidates every Plan descendant.
Changing Plan-only bytes/revision invalidates only Plan PASS. Rotating
`artifactRevisionId` after mutate/revert makes the recreated bytes a different
causal snapshot. Direct out-of-band events are detectable only when a runtime
or manual authoring handoff rotates the id; docs state this boundary explicitly.

#### 4. Review stages and repair

`review-spec` receives only the frozen Product snapshot, authoritative context,
and an adversarial falsification prompt. It checks outcomes, actors, roles,
entities, limits, error states, scope/non-goals, deferred decisions, capability
and integration closure, expectation sweep, objective acceptance, internal and
repository contradictions, and issue-export attempts. It never writes the
reviewed SPEC. Its public output is `SPEC-REVIEW-PASS |
SPEC-REVIEW-FAIL | NEEDS-DESIGN` plus receipt/finding evidence.

`review-plan` receives the reviewed Product parent, complete Plan snapshot, and
obligation ledger. For features it checks architecture, dependency,
compatibility, security, migration, recovery, rollback, operability, phase
atomicity/order, validators, scenario coverage, and source evidence. For fixes
it additionally requires reproduction, root-cause evidence, regression scope,
and rollback; it does not invent a Product half. It never edits reviewed plan
artifacts. Its output is `PLAN-REVIEW-PASS | PLAN-REVIEW-FAIL |
NEEDS-DESIGN`.

`SPEC-REVIEW-FAIL` routes to `design-feature` repair/upsert. A Plan failure
inside reviewed intent routes to `plan-feature` or `plan-fix` replan. A missing
product/authority choice returns `NEEDS-DESIGN`, invalidates downstream Plan
evidence, and returns to the human through `design-feature` followed by a new
SPEC review.

The first review emits one complete unioned findings set. Its owner first
classifies every finding by Product, Plan, source, environment, or runtime root
cause, then applies one evidence-bounded repair batch to the owning artifact(s)
before a single re-review of the new snapshot. Wording-only repairs may avoid a
full replan only when intent, obligation identity, phase topology, validators,
and authority remain unchanged; evidence records that determination.

Entering a second repair/re-review cycle is not forbidden and never grants
PASS, but it is a `CONVERGENCE-ANOMALY`. Before any further edit the workflow
must report the repeated/new finding ids, changed snapshots, missed evidence or
obligation, owning stage, and why the prior readiness/review/repair failed. It
then routes to the exact owner. Repeating `review-change -> fold-findings` on a
Plan/Product defect is invalid even when the candidate changed.

`plan-feature-from-issue` remains internal for compatibility but stops after
issue-derived Product design and hands off to `review-spec`; it no longer
composes Engineering planning in the same authority turn. No public repair
skill is added.

#### 5. Obligation and findings ledgers

Planning produces one frozen obligation table:

```text
obligation-id | authority-source | affected-use-case-or-invariant | phase |
task | implementation-owner | validator | required-evidence | status
```

Every normative behavior, applicable compatibility invariant, affected use
case, and required failure state appears once. Before delivery, each row must be
`verified`. `n/a` needs evidence and cannot contradict scope. `deferred`, blank,
partial, or follow-up-issue status blocks current-unit completion.

One stage-aware `planning-findings.md` table stores stable review finding ids,
stage, severity, class, snapshot digest, evidence, status, resolution evidence,
and resolving artifact revision. Reviewers append findings/receipts but never
mutate reviewed authority. Authors resolve rows through their existing upsert/
replan route.

#### 6. Workflow integration

Extend the existing schema intent/profile/evidence/transition owner for
`review-spec` and `review-plan`. `workflow-status` senses exact current
snapshots/receipts and recommends the missing upstream stage. `plan-feature`
fails closed without current SPEC PASS. `execute-phase` fails closed without
current Plan PASS; feature 29 later inserts mapping after that gate.

`ship-roadmap` follows design -> review-spec -> plan -> review-plan -> execute.
`loop-review-fold` and `review-change` classify root cause: source-local
findings fold locally; plan defects return to replan/review-plan; Product
defects return to design/review-spec. `audit-pr` requires verified obligation
closure and current upstream lineage but remains the sole `MERGE-READY`
authority.

Legacy planned/in-progress work creates the missing snapshots and reviews
without rewriting frozen acceptance. No old evidence is coerced into a PASS.

#### 7. Independent review and no-progress

The default is one context-clean reviewer. Optional adversarial mode may run
multiple fresh reviewers, bidirectional critique, then synthesis/arbitration.
Findings are unioned; no quorum exists. A material finding is dismissed only by
recorded evidence that falsifies it. Same-model clean contexts are labelled
same-model, not cross-model diversity. A synthesizer cannot promote unverified
material claims to PASS.

A review may repeat only after a changed snapshot or with a named falsifiable
question and new evidence route. Identical inputs plus identical question stop
as no-progress. One repair/re-review is the normal correction path. A second
repair/re-review cycle emits `CONVERGENCE-ANOMALY` and must diagnose its owning
root cause before proceeding. Runtime retry/budget mechanics remain outside the
skill and cannot translate exhaustion into PASS.

### Decisions to confirm

- **D1 — Contract family:** one discriminated pre-execution contract family;
  candidate review and verification contracts stay untouched.
- **D2 — Product projection:** `spec-product-v1` hashes exact authoritative
  sections so Engineering-half writes do not erase Product lineage.
- **D3 — Causal identity:** combine exact content with authoring-event identity;
  do not claim content hashes alone detect mutate/revert history.
- **D4 — Validation authority:** package runtime entries own semantic PASS;
  generated JSON Schemas are structural projections only.
- **D5 — Findings:** union plus counter-evidence; no majority threshold.
- **D6 — Fix path:** fixes enter `review-plan` from `plan-fix` without a fake
  Product-half stage.
- **D7 — Compatibility:** retain `plan-feature-from-issue` as an internal name
  for now, but narrow its terminal handoff; a rename would add migration noise
  without product value.
- **D8 — Package release:** additive public contract and intent/profile exports
  require a minor version bump from the version current at implementation.
- **D9 — Measurement:** ship a canary protocol and baseline fields; publish no
  improvement claim until observed results exist.
- **D10 — Readiness without self-approval:** authoring owns deterministic
  structural/evidence readiness, while only a clean-context reviewer owns
  correctness PASS.
- **D11 — Planning evidence artifact:** M/L units freeze
  `planning-evidence.md`; XS/S units embed the same compact table in the SPEC.
  Plan snapshots bind it and execution consumes a phase-specific slice.
- **D12 — Second-cycle diagnosis:** more than one repair/re-review cycle remains
  allowed when correctness requires it, but it is a named qualification anomaly
  and cannot continue until the owner/evidence deficit is reported.

### Testing requirements

- Red-first package unit/integration tests through public entries for valid and
  invalid shapes, bounds, canonical vectors, Product selector, semantic
  validation, lineage, freshness, stage/verdict matrices, causal revert, and
  diagnostic redaction.
- Root Node fixtures exercise skills as text contracts: feature/fix routes,
  review read-only behavior, obligation coverage, upstream root-cause routing,
  legacy adoption, no-progress, author exclusion, and automatic-issue
  prohibition.
- Readiness fixtures prove incomplete evidence, unknown ownership, missing
  scenarios, uncovered obligations, invalid phase cuts, and unresolved
  decisions never reach independent review; author readiness never emits PASS.
- Convergence fixtures prove the first findings union is repaired as one batch,
  one re-review may close it, and a second cycle emits a diagnosis with an exact
  owner instead of silently looping or manufacturing success.
- Existing package and root regressions remain green; no frozen test or
  ACCEPTANCE validator is weakened to obtain PASS.
- Run context budgets, installability, schema and Pi package tests, Pi skill
  bundle/parity, package pack/projection checks, executor-path golden fixture,
  bilingual doc checks, and independent candidate review.
- Canary captures time/model calls to first correct edit, pre-edit replans,
  post-review repairs, review/fold cycles, diff/rework, latency, and tokens for
  comparable manual units; the mandatory feature/fix/cross-boundary corpus
  treats a second repair/re-review cycle as a qualification failure while
  interpretation remains explicitly observational.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `review:happy-feature` | complete Product PASS then complete Plan PASS | fixed toy feature fixture through both public reviewers |
| `review:empty-product` | missing actor/capability/expectation/acceptance closure | malformed Product fixture returns `NEEDS-DESIGN` |
| `review:oversized-receipt` | cardinality/string/payload ceiling | generated boundary fixture rejected with bounded diagnostics |
| `review:wrong-authority` | reviewer attempts product choice or self-approval | identity/authority fixture rejects PASS and routes to design |
| `review:evidence-unavailable` | required repository/external source cannot be read | grounding fixture returns `NEEDS-EVIDENCE`, never an invented claim |
| `review:duplicate-session` | repeated identical review and synthesis parents | no-progress/parent-topology fixtures stop deterministically |
| `review:limit-hit` | maximum findings/context/artifact rows | exact-boundary accepted and boundary-plus-one rejected |
| `review:causal-revert` | bytes change and return after a new authoring event | new revision id keeps the old PASS stale |
| `review:legacy-plan` | existing frozen acceptance lacks pre-execution receipts | migration fixture reviews current artifacts without rewriting acceptance |
| `review:not-ready` | draft omits evidence, scenario, obligation, or unknown owner | readiness returns the exact upstream state and never invokes/claims review PASS |
| `review:first-repair` | one unioned findings set has Product/Plan/source roots | one batched owner repair plus one re-review reaches PASS or an exact remaining blocker |
| `review:second-cycle` | a second findings/repair round would begin | `CONVERGENCE-ANOMALY` reports ids, snapshots, owner, and missed evidence before further work |

### Phases

#### P1 — Publish pre-execution evidence contracts

Layer: schema/db. Done-when: `cd packages/agentic-workflow-schema && npm test`
-> exit 0 with pre-execution contract, selector, canonicalization, lineage,
freshness, bounds, projection, and public-export suites.

Phase-lint: PASS (8/8) · fingerprint
`P1:schema/db:8:publish-pre-execution-evidence-contracts`

#### P2 — Establish Product review readiness

Layer: docs. Done-when: `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0 for grounding,
progressive Product readiness, issue-derived design separation, and
`review-spec` fixtures.

Phase-lint: PASS (8/8) · fingerprint
`P2:docs:8:establish-product-review-readiness`

#### P3 — Establish Plan review readiness

Layer: docs. Done-when: `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0 for feature/fix
`review-plan`, planning-evidence/obligation ledgers, findings, batched repair,
second-cycle diagnosis, and no-progress fixtures.

Phase-lint: PASS (8/8) · fingerprint
`P3:docs:8:establish-plan-review-readiness`

#### P4 — Enforce pre-execution authority routing

Layer: docs. Done-when: `node --test
scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs`
-> exit 0 for workflow sensing, transitions, planning/execution gates,
root-cause routing, legacy adoption, and audit lineage.

Phase-lint: PASS (8/8) · fingerprint
`P4:docs:8:enforce-pre-execution-authority-routing`

#### P5 — Qualify the pre-execution workflow

Layer: hardening. Done-when: package/repository/installation/context/golden-
fixture gates pass, synchronized docs and migration are verified, the exact
candidate has an independent PASS with no unresolved fix-now finding, the
feature/fix/cross-boundary qualification corpus contains no second-cycle
sample, and the terminal candidate is release-ready (Pi package bumped to
`0.2.0` and changeloged after the last bundle rebuild).

Phase-lint: PASS (8/8) · fingerprint
`P5:hardening:8:qualify-the-pre-execution-workflow`

#### P6 — Run the pre-execution qualification corpus

Layer: hardening. Done-when: `testing.md`'s completed canary corpus carries one
row-set per sample (unit 28 feature, fix unit 78, feature 17 cross-boundary)
with every canary field observed or explicitly `not yet measured`, per-stage
correction-cycle counts, and no second-cycle sample; `GOLDEN_FIXTURE.md` (+ its
ES sibling) carries a dated row for every changed executor-path skill/version
listed in this unit's 3.5.0 changelog rows; root `node --test
scripts/*.test.mjs` -> exit 0.

Phase-lint: PASS (8/8) · fingerprint
`P6:hardening:4:run-the-pre-execution-qualification-corpus`

#### P7 — Reconcile the unit ledgers with qualification evidence

Layer: docs. Done-when: `grep -qE '\| 28 \| .?evidence-grounded-spec-plan-review.? \| in-progress' docs/features/ROADMAP.md`
-> exit 0 (the row stays `in-progress` until P8's PR step); every O9–O14 row
in `planning-obligations.md` carries a status matching its cited evidence
(`verified` only where the evidence row exists); and `progress.md`'s phase
table lists P6–P8 with receipts.

Phase-lint: PASS (8/8) · fingerprint
`P7:docs:4:reconcile-unit-ledgers-with-qualification-evidence`

#### P8 — Re-review and close the corrected candidate

Layer: close-out. Done-when: the terminal HEAD holds a current context-clean
`review-change` PASS receipt with zero open findings; every package gate
passes (schema suite, root suites, context/route budgets, Pi bundle + tests,
`npx skills add . --list`); the frozen ACCEPTANCE manifest is verified at
terminal HEAD; PR #155 carries the amendment summary; and roadmap row 28
reads `done · [#155]`.

Phase-lint: PASS (8/8) · fingerprint
`P8:close-out:6:re-review-and-close-the-corrected-candidate`

### Deploy & rollback

No data migration or environment configuration. Merge publishes skill/docs
changes; publish the schema package (`3.5.0`) and the Pi package (`0.2.0`) only
after package/repository qualification — the Pi publish workflow releases on
merge only when its `package.json` version is newer than the registry, so the
final hardening step bumps it after the last bundle rebuild.
Rollback is a PR revert plus package deprecation/new corrective version if the
new package version was already published. Never overwrite an npm version or
coerce stored receipts into another contract.

### Open questions / risks

- **RESOLVED — hash-only resurrection:** content hashes cannot prove causal
  history. D3 adds `artifactRevisionId`; guarantees require correct rotation by
  authoring/runtime handoffs and the limitation is documented.
- **RESOLVED — Product review freshness after planning:** D2 binds the stable
  Product projection and Plan parent digest instead of hashing only the whole
  mutable two-half SPEC.
- **RESOLVED — reviewer plurality:** multiple clean contexts increase
  falsification coverage but do not prove independent model bias; labels and
  union/counter-evidence semantics prevent false consensus.
- **Risk — skill context growth:** shared grounding/review rules must live in
  progressive references/internal ownership; P5 budget checks are a hard gate.
- **Risk — broad workflow wording changes:** executor-path golden fixture and
  root route fixtures are mandatory before completion.
- **Risk — false convergence:** a low cycle count can hide a weak reviewer or
  discarded findings. Qualification therefore preserves unioned findings,
  requires counter-evidence for dismissal, and fails any second-cycle sample
  without converting the count into approval authority.
- **Risk — package/skill rollout skew:** migration and compatibility behavior
  fail closed; no skill may claim current evidence from an older schema package
  that cannot validate the contracts, and Pi bundle parity must prevent its
  packaged skill copy from drifting from the canonical root.

### Deliverables

- Two public review skills and one internal grounding owner with versioned
  changelogs/references.
- Additive pre-execution package contracts, generated projections, fixtures,
  public exports, and EN/ES package reference.
- Stage-aware planning findings and obligation-ledger conventions.
- Progressive readiness contracts plus compact Product/Engineering evidence
  persistence, including `planning-evidence.md` for M/L plans.
- Convergence-anomaly diagnosis, first-findings batch repair, and mandatory
  feature/fix/cross-boundary qualification evidence.
- Updated authoring, status, execution, review/fold, audit, roadmap, transition,
  canonical/Pi distribution, migration, and bilingual workflow surfaces.
- Root regression suite, package qualification, golden fixture record, canary
  protocol, and independent-review evidence.

### Post-merge next feature

Feature 29 — `bounded-implementation-discovery`; first re-run `review-spec` and
`review-plan` over its already-created planning artifacts so feature 28 is
dogfooded before feature 29 implementation begins.
