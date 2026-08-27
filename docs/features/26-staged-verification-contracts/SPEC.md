# 26 — staged-verification-contracts

> Feature specification. This is the feature document read at the start of the
> workflow. The Product half is complete; `plan-feature-scaffold` owns the
> Engineering half.

## Goal

Publish strict, portable `VerificationPlan v1` and `VerificationReceipt v1`
contracts from the schema package that separate **fast feedback from full
delivery verification** and bind every verification result to the exact
candidate content and acceptance boundary defined by feature 25 (#138):
candidate-snapshot digest and acceptance fingerprint. A consumer can fail
fast during repair (fast stage) and still require the complete, current gate
(full stage) before review or delivery; skipped, failed, timed-out, and stale
checks become explicit, machine-detectable states instead of silently trusted
absences. Origin: issue
[#139](https://github.com/gtrabanco/agentic-workflow/issues/139).

## Branch

`feat/26-staged-verification-contracts`

## Size

`L` — two new versioned wire contracts plus one authoritative validation
surface, deterministic structural-schema projection, canonical digests,
stage/verdict/freshness semantics, bounded verification-plan usability,
bilingual package reference, and an additive minor release. The original five
phases plus P6 corrections and the user-approved P7–P15 replan remain one unit
because every correction changes the same unshipped v1 contract and must land
atomically before PR #145 can merge.

## Dependencies

- Hard: feature `25-content-bound-review-receipts` (issue #138) — **merged**
  (PR [#144](https://github.com/gtrabanco/agentic-workflow/pull/144),
  `11a8061` at HEAD). The verification receipt binds to its
  `CandidateSnapshotV1` digest (`digestCandidateSnapshot`) and acceptance
  fingerprint vocabulary (`computeAcceptanceFingerprint`).
- No other dependency; features 23/24/25 are all merged at HEAD.

---

## Product half

### Context

The schema package (`@gtrabanco/agentic-workflow-schema` v3.3.0) ships the
content-bound review contracts from feature 25: `CandidateSnapshot v1`,
`ReviewReceipt v1`, the canonical digest core, and the freshness predicate.
What is still missing is the **verification-side sibling**: a versioned way
to declare *which commands constitute verification* (split into fast and full
stages) and to record *what actually ran, per command*, bound to the exact
candidate and acceptance content. Today every expensive verification command
runs after every change (wasted time and tokens), or a cheap subset silently
stands in for the full gate (false confidence). Feature 25's deferred-decision
row already anticipated this unit as the producer-side consumer of its
receipts. Issue #139 asks for the two-stage, candidate-bound contracts; this
feature delivers them as pure, portable data contracts.

### Business goals

- Make expensive verification **staged**: fast commands for repair loops, the
  complete declared set for delivery gates.
- Make every verification result **content-bound**: stale or incomplete
  results are mechanically detectable before any consumer acts on them.
- Keep the package portable data contracts only — no execution, no shell, no
  provider coupling.

### Product-surface considerations

- i18n: the package reference is updated in English and Spanish in the same
  change (NRS AD-002).
- Accessibility: n/a, no user interface.
- SEO: n/a, no public web route.
- Pricing: n/a, no commercial surface; provider prices are explicitly banned
  from the schema (issue guardrail).
- UI design reference: n/a, the only surface is package API + JSON Schemas.

### Scope

#### In scope

- **S1:** Strict TypeScript types plus exactly two authoritative public
  validators — `validateVerificationPlanV1(value: unknown)` and
  `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` —
  for `agentic-workflow/verification-plan@1` and
  `agentic-workflow/verification-receipt@1`. JSON Schemas are deterministic,
  generated structural tooling projections, not a second semantic authority.
- **S2:** `VerificationPlan v1` — an ordered, non-empty list of at most 128
  commands. Each command carries: stable bounded `id`; `stage: fast | full`;
  bounded `executable` plus at most 64 bounded ordered `args` (never an
  inferred shell string); working-directory policy `candidate-root |
  relative-path` with a bounded validated relative path; stage-bounded
  positive integer `timeoutMs`; `stopOnFailure`; and cost class `cheap |
  moderate | expensive`. The canonical plan is at most 256 KiB; aggregate
  declared timeouts are bounded by stage.
- **S3:** `VerificationReceipt v1` — plan digest and candidate-snapshot
  digest from #138; acceptance fingerprint; at most 128 ordered per-command
  results with status `passed | failed | timed-out | skipped |
  infrastructure-error`; exit code or signal, start/end timestamps, bounded
  stdout/stderr evidence references, and an explicit skip reason; overall
  verdict `pass | fail | incomplete` and the stage actually requested. The
  canonical receipt is at most 512 KiB.
- **S4:** Stage rules — requesting `fast` executes only fast commands;
  requesting `full` executes every fast and full command in declared order;
  `stopOnFailure: true` marks later commands `skipped` with the failed
  command id; only a current, complete `full` receipt may satisfy a delivery
  verification gate.
- **S5:** Verdict semantics — `pass | fail | incomplete` rules with a fixed
  precedence, enumerated in this SPEC (never delegated to "consumer
  behavior").
- **S6:** Validation failures — inherited/undeclared fields, duplicate ids,
  an empty or over-limit plan, absolute/traversing paths, over-limit strings
  or payloads, invalid per-command/aggregate timeouts, unknown vocabulary,
  and receipt/plan semantic mismatches fail through the authoritative entry
  point with at most 50 redacted code+path diagnostics.
- **S7:** A pure freshness predicate and stable stale/incomplete reason
  codes — a candidate, acceptance, or plan digest change makes a receipt
  stale; missing command results, a skipped command without a reason, or a
  requested full run that did not cover every command yields `incomplete`,
  never `pass`.
- **S8:** Canonical serialization plus published plan/receipt digest test
  vectors.
- **S9:** English and Spanish package documentation stating the two-stage
  model, the delivery-gate rule, and the no-execution boundary; additive
  minor release `3.3.0 → 3.4.0`.

#### Out of scope / non-goals

- No subprocess, shell, filesystem, container, CI, or provider execution in
  the package — the caller runs commands; the package only validates,
  canonicalizes, digests, derives, and compares.
- No project-specific command list or framework assumption.
- No automatic choice of which command is fast or full — `costClass` is
  declared project metadata, not measured billing truth.
- No token/model budget contract; runtime budgets belong to consumers.
- No AWL validation dialect, command runner, or consumer integration in this
  package unit. AWL adoption follows only after it upgrades to the released
  schema package and the user routes that independent work.
- No replacement of the existing high-level verification state in Envelope v2.
- No shell composition, interpolation, pipelines, redirects, or command
  strings — v1 deliberately represents executable plus arguments separately;
  shell execution requires a future versioned contract and is not an
  implementation choice here.
- No unbounded output field: output contents stay outside the portable
  receipt; only bounded evidence references and content digests are carried.
- No changes to `Envelope v2`, `SkillOutcome v1`, `WorkflowSnapshot v1`,
  `CandidateSnapshot v1`, `ReviewReceipt v1`, or their five shipped JSON
  Schema files (separately justified versioned contract changes would be
  required).
- No UI, remote API, ACL, or persistence surface: n/a by design.

### Capability closure

The repository has no project-level `docs/CAPABILITIES.md`. Derived inventory
for this feature: public package API; existing machine contracts; bilingual
package documentation; package distribution. Roles: `headless consumer` and
`package maintainer`.

**1. Entity closure — the two v1 contracts**

- [x] Create — UI: n/a, no UI surface · API: package-authored types and
  validators; consumers construct plans/receipts in their own memory · test:
  construction-shaped fixtures in the validation suites.
- [x] Read/list — UI: n/a · API: package-root exports of both contract type
  sets, exactly two authoritative validation entries, verdict derivation,
  canonical/digest functions, freshness predicate, readonly vectors and frozen
  contract/limit vocabularies · generated schemas are tooling projections ·
  test: public-entry import/export suites.
- [x] Update — n/a at runtime; package maintainers evolve the contracts only
  through a reviewed package change and a new version (v1 is frozen) · test:
  strict validators reject mutated/undeclared fields.
- [x] Delete — n/a: consumers cannot remove exported contracts · test:
  regression suite pins the export surface.
- [x] State transitions — the only states are computed, never stored: verdict
  `pass | fail | incomplete` is derived purely from the receipt content by
  `deriveVerificationVerdict`; `fresh ↔ stale/incomplete` is computed purely
  by the freshness predicate · test: the verdict and staleness matrices.

**Capabilities and role matrix**

- [x] Validate, digest, derive, and compare a plan or receipt — visible entry
  point: package-root exports · `headless consumer`: allowed · `package
  maintainer`: allowed.
- [x] Execute any command — visible entry point: n/a, unrepresentable: the
  package has no execution surface by design · `headless consumer`: denied ·
  `package maintainer`: denied.
- [x] Extend or reinterpret the v1 shapes/vocabularies — visible entry
  point: package source plus pull-request review · `headless consumer`:
  denied · `package maintainer`: allowed (as a new versioned contract, never
  in place).
- [x] Claim delivery verification from a fast, stale, or incomplete receipt —
  visible entry point: n/a, unrepresentable: `stageRequested` + verdict +
  freshness make the violation mechanically detectable · `headless
  consumer`: denied · `package maintainer`: denied.

**2. Integration closure — derived inventory**

- [x] Public package API — exactly two feature-26 runtime validation entries;
  pre-feature-26 export meanings unchanged · test: public-export + regression
  suites.
- [x] Existing machine contracts — `Envelope v2`, `SkillOutcome v1`,
  `WorkflowSnapshot v1`, `CandidateSnapshot v1`, `ReviewReceipt v1` and
  their five JSON Schema files unchanged · test: existing suites plus
  diff-clean check on the five shipped schema files.
- [x] Bilingual package documentation — `README.md` + `README.es.md` gain
  the synchronized staged-verification section (two-stage model,
  delivery-gate rule, no-execution boundary) · test: grep anchors in both
  files.
- [x] Package distribution — minor release `3.4.0`; artifact set grows by two
  generated structural projections plus deterministic check/benchmark scripts ·
  test: `npm pack --dry-run`, generation check and npm/Bun lock gates.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Duplicate command ids fail plan validation | in-scope | S6; AC1 |
| 2 | An empty plan fails validation | in-scope | S6; AC1 |
| 3 | An absolute or traversing relative path fails validation | in-scope | S6; AC1 |
| 4 | A non-positive timeout fails validation | in-scope | S6; AC1 |
| 5 | Unknown vocabulary (stage, status, verdict, cost class) fails validation | in-scope | S6; AC1, AC2 |
| 6 | A timeout or infrastructure error is distinct from a test failure and still prevents `pass` | in-scope | S5; AC3 |
| 7 | A skipped command without a reason yields `incomplete`, never `pass` | in-scope | S5, S7; AC3, AC4 |
| 8 | Missing command results yield `incomplete`, never `pass` | in-scope | S5, S7; AC3, AC4 |
| 9 | A requested full run that did not cover every command yields `incomplete` | in-scope | S5, S7; AC3, AC4 |
| 10 | A candidate, acceptance, or plan digest change makes a receipt stale | in-scope | S7; AC4 |
| 11 | Requesting `fast` executes only fast commands; a full-command result in a fast receipt is invalid | in-scope | S4; AC3 |
| 12 | Only a current, complete `full` receipt may satisfy a delivery verification gate | in-scope | S4; AC3, AC6 |
| 13 | Output contents stay outside the receipt — bounded evidence references and content digests only | in-scope | S3; AC2 |
| 14 | Shell composition, pipelines, or command strings ship in v1 | out-of-scope | Shell non-goal |
| 15 | The package picks which commands are fast or full, or executes anything | out-of-scope | Execution/classification non-goals |
| 16 | The package replaces Envelope v2's high-level verification state | out-of-scope | Compatibility non-goal |
| 17 | A standalone structural receipt check can claim runtime validity | denied | D12; AC2 |
| 18 | Plans/receipts exceed the accepted capacity, byte, timeout or diagnostic limits | rejected | D14; AC10 |
| 19 | Generated Draft-07 projections act as a second semantic authority | denied | D13; AC9 |
| 20 | This feature implements an AWL dialect, runner or consumer adapter | out-of-scope | D15; deferred consumer work |

### Acceptance criteria

The frozen executable finish line is `ACCEPTANCE.md` v2 (AC1–AC10). In
summary, it requires:

- [ ] **AC1:** the sole plan validator rejects all malformed, inherited and
  over-limit plans and returns normalized own-property data.
- [ ] **AC2:** the sole receipt validator performs structural + plan-bound
  validation in one call; no standalone receipt validator is exported.
- [ ] **AC3:** the full stage/verdict matrix passes, including fail-fast.
- [ ] **AC4:** all six freshness reason codes are reachable on disjoint
  conditions, plus `{fresh: true}`.
- [ ] **AC5:** canonical vectors, readonly typing and repeated
  canonicalize/digest/derive/compare operations are deterministic through the
  authoritative entry points.
- [ ] **AC6:** synchronized EN/ES docs describe authority, projections,
  limits, delivery-gate and no-execution semantics with coherent examples.
- [ ] **AC7:** package/repository gates, pack and npm/Bun frozen installs pass.
- [ ] **AC8:** all prior machine contracts and pre-feature-26 export meanings
  remain unchanged.
- [ ] **AC9:** generated Draft-07 structural projections match the canonical
  internal contract definition and identify themselves as non-authoritative.
- [ ] **AC10:** every accepted command/result/string/byte/timeout/diagnostic
  bound is enforced, and the 128-command warm-process p95 gate is ≤100 ms.

### Tooling

The TypeScript compiler, package tests, deterministic projection checker,
128-command benchmark and npm/Bun lock gates are authoritative. No external
skill, MCP, AWL dialect or consumer runtime is required.

### Product decisions

- **D1 — Freshness/incomplete reason codes (closed set):**
  `stale-plan | stale-candidate-snapshot | stale-acceptance-fingerprint |
  incomplete-missing-results | incomplete-unjustified-skip |
  incomplete-stage-coverage`. Maps 1:1 to the issue's clauses — the three
  stale dimensions (plan, candidate, acceptance digest) and the three
  incompleteness conditions (missing results, skipped without reason,
  requested-full coverage gap). A fresh comparison returns `{fresh: true}`.
  Locked by tests; changing the set is a reviewed, versioned contract
  change.
- **D2 — Verdict precedence and rules.** `incomplete > fail > pass`. `fail`
  ⟺ at least one result status ∈ `{failed, timed-out,
  infrastructure-error}` (timeout and infrastructure error stay distinct
  statuses that prevent `pass`, per the issue). `incomplete` ⟺ any of: a
  fast-stage receipt where a fast command lacks a result row; a full-stage
  receipt that does not cover every declared command; any skipped row
  without a reason. `pass` ⟺ otherwise (every required result row is
  `passed`). A stored verdict that disagrees with the derived verdict makes
  the receipt invalid.
- **D3 — Skip-reason semantics.** Non-`skipped` rows carry `skipReason:
  null` (schema rule). A `skipped` row may carry `null` (→ verdict
  `incomplete`) or a non-empty string ≤ 1024 chars that MUST equal the
  stable id of an earlier-declared command whose result is non-passed AND
  whose plan entry declares `stopOnFailure: true` — machine-checked
  fail-fast attribution; any other non-null value makes the receipt
  invalid.
- **D4 — Exit-code/signal matrix.** `passed | failed` → exactly one of
  `exitCode` (integer) / `signal` (non-empty string) present; `timed-out` →
  `exitCode` null, `signal` nullable (kill signal when captured);
  `infrastructure-error` → both null (no terminal process result);
  `skipped` → both null.
- **D5 — Evidence references.** Each of `stdout` / `stderr` is either null
  or `{ref, bytes, sha256}`: `ref` a non-empty opaque string ≤ 1024 chars
  without NUL; `bytes` an integer ≥ 0 (size of the captured evidence);
  `sha256` a lowercase 64-hex digest of the captured evidence. Output
  contents are never carried; the bound is on the reference, not the
  stream.
- **D6 — Canonical form and vectors.** Canonical serialization mirrors the
  package's existing canonical core (UTF-8 JSON, sorted object keys, compact
  separators, `null`s preserved; `commands` and `results` arrays in declared
  order); digests are lowercase-hex SHA-256 over the canonical bytes.
  Published vectors are exported as `VERIFICATION_CANONICAL_VECTORS` (same
  `CanonicalVectorV1` shape; the existing frozen `CANONICAL_VECTORS` array
  stays untouched) and lock the rules in place.
- **D7 — Stage-coverage rules (authoritative validator).** Every result's `commandId`
  must exist in the bound plan; no duplicate result command ids; results
  appear in the plan's declared command order; a fast-stage receipt may
  carry results only for fast commands (a full-command result in a fast
  receipt is invalid). Missing rows are NOT a schema error — they are
  representable and surface as verdict `incomplete` / freshness codes.
- **D8 — Minimal receipt surface.** No receipt identity field in v1: the
  issue's closed field enumeration is the contract, and consumers identify
  receipts by digest (`digestVerificationReceipt`). Adding an id is a v2
  decision, not an implementation choice.
- **D9 — Vacuous fast stage.** A plan whose fast set is empty yields a valid
  fast receipt with zero results and verdict `pass` (nothing fast failed);
  the delivery gate still requires a `full` receipt, so the vacuous pass
  cannot reach delivery verification. Pinned by a test.
- **D10 — Size `L`, fifteen phases, one atomic v1 unit.** P1–P6 are historical;
  the 2026-08-26 user-approved replan adds P7–P15. The unit is not split
  because the unshipped v1 validator authority, limits, docs and final gate
  must agree in the same package release and PR.
- **D11 — Traceability.** Origin: issue #139. The implementation PR must
  include `Closes #139`.
- **D12 — One validation authority.** The only public runtime validation
  entries are `validateVerificationPlanV1(value: unknown)` and
  `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)`.
  The latter owns structural and plan-bound receipt validation; no structural
  receipt validator remains public. Successful results contain normalized
  own-property DTOs.
- **D13 — Generated structural projections.** The two shipped Draft-07 files
  are deterministic tooling projections from one internal canonical contract
  definition. They carry explicit non-authoritative metadata and express every
  Draft-07-representable structural rule, including D4 cross-field matrices;
  semantic PASS comes exclusively from D12. A drift check forbids hand-edited
  projections.
- **D14 — Bounded usability.** V1 allows at most 128 commands/results and 64
  args per command; ids are ≤128 chars, executable/working-directory/
  skip-reason/evidence-reference values ≤1024, args ≤4096, canonical plan/
  receipt sizes ≤256/512 KiB, diagnostics ≤50 stable-code + RFC 6901 path
  entries, fast command/aggregate timeouts ≤10/15 minutes, full command/
  aggregate full-stage timeouts ≤60/120 minutes. The 128-command warm
  validation+digest p95 ceiling is 100 ms.
- **D15 — Consumer boundary.** An AWL dialect/runner/adoption is not part of
  this schema feature. It is independent future work only after AWL adopts
  the released package; no issue is created automatically.
- **D16 — Closed diagnostic result.** Each validation success is
  `{ok: true, plan}` or `{ok: true, receipt}`. Each failure is `{ok: false,
  diagnostics, truncated}` with at most 50 deterministic rows; every row has a
  frozen diagnostic code and an RFC 6901 JSON Pointer made only from contract
  property names and numeric indices. Messages and submitted values are never
  returned. The unshipped feature-26 `errors: string[]` result is replaced,
  with no compatibility alias that could become a second result contract.

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Consumer-side wiring (`execute-phase`/`review-change` emitting real plans/receipts) | The package must exist first; producer-side adoption is a separate unit | After this feature lands; next driver-integration unit |
| AWL validation dialect/runner integration | Consumer/runtime architecture is owned by AWL, not this schema package | After AWL upgrades to the released schema package and the user routes a dedicated issue |
| Shell composition / command strings | The issue explicitly reserves it for a future versioned contract | First consumer needing pipelines/redirects (new issue) |
| Receipt identity field | Not in the issue's closed enumeration; digest identification suffices in v1 | v2 contract decision (new issue) |

### Spec-lint (mechanical — product boxes)

- [x] No template placeholders remain in the Product half.
- [x] Out of scope / non-goals contains concrete bullets.
- [x] Every entity, capability, role, and state row is filled or has an
  explicit `n/a` reason.
- [x] Integration closure covers every subsystem in the recorded derived
  inventory.
- [x] Every capability lists both roles as explicitly allowed or denied.
- [x] Expectation sweep contains twenty resolved rows with pointers.
- [x] Every in-scope bullet maps to at least one acceptance criterion.
- [x] Every acceptance criterion is command-verified or read-verified.
- [x] Deferred decisions exists with decide-by triggers.

## Design status

`designed`

### Amendments

| Date | Change | Approval |
|---|---|---|
| 2026-08-24 | Added **P6 — Staged-verification contract correction** (replan-in-unit): folds review findings F31–F39 (distinct freshness outcomes, independent canonical vectors, pre-validate-then-hash, frozen exports, compile-safe EN/ES README examples, regenerated lockfile, refreshed progress, restored ledger) plus second-round findings F40+ (validate-before-hash, schema parity, SPEC check order, async plan-bound validator, verdict semantics). Finish line (ACCEPTANCE.md blob `a4c643da…`) unchanged. | User-confirmed replan route from review-change (fold ledger F31–F39 replan-in-unit rows) |
| 2026-08-26 | Added **P7–P15** after review findings S1/S12 and F63–F77: one authoritative validation system with two public entries, generated non-authoritative structural projections, bounded usable plans/receipts, synchronized package metadata/docs, and a fresh close-out. Replaced ACCEPTANCE v1 blob `a4c643da…` with user-approved ACCEPTANCE v2 (AC1–AC10); this removes an impossible dual-authority promise and strengthens runtime validity, limits, reproducibility and performance evidence. | User explicitly selected single-source/two-entry validation authority, accepted the bounded-plan proposal, kept AWL dialect work out of this feature, and requested the replan |

---

## Engineering half

Written by `plan-feature-scaffold` after this Product half.

### Technical goals

- Deliver both v1 contract surfaces through exactly two public validation
  entries backed by one canonical internal definition; ship deterministic
  Draft-07 structural projections without presenting them as a second
  semantic authority.
- Enforce the D14 usability bounds and a measurable 128-command p95 ceiling.
- Implement the staged verification semantic engine: plan-bound receipt
  validation, pure verdict derivation, canonical digests, and the pure
  freshness predicate with the D1 reason codes.
- Prove the contracts with red-first validation suites plus the mandated
  scenario matrix.
- Ship the bilingual reference and the `3.4.0` additive minor release.

### Architecture impact

Preflight: NRS consumed · invariant classification: `n/a` (no project
invariants declared — `docs/architecture/ARCHITECTURAL_INVARIANTS.md` does
not exist at HEAD; the `template/` copy is a scaffold for target projects,
not a declaration for this repo). Applicable NRS accepted decisions
preserved: AD-002 (bilingual package docs in the same change), AD-004 (one
PR per unit against `main`), AD-007 (schema-package strict contracts —
`npm test` green, generated JSON projections match their canonical definition,
authoritative validators enforce full semantics, and public API changes require
a version bump).

- **Schema/package boundary:** all additions live inside
  `packages/agentic-workflow-schema/`; the canonical verification-contract
  definition, authoritative validators and generator/check stay package-local.
  The two generated `*.schema.json` projections join the shipped artifact set;
  the five existing schema files and pre-feature-26 types remain untouched.
- **Layering:** pure data contracts + pure functions — no I/O, no subprocess,
  no shell, no forge; the caller owns execution.
- **NRS status:** frozen → consumed; W004 records this very issue as planned
  work. No contradiction affects this plan.

### Design

Reproduces the issue's rules verbatim where marked; residual mechanical gaps
are closed by D1–D16 and locked by the replacement acceptance manifest.

#### VerificationPlan v1 (`agentic-workflow/verification-plan@1`)

```ts
export const VERIFICATION_PLAN_CONTRACT_ID = "agentic-workflow/verification-plan@1";
export const VERIFICATION_STAGES = ["fast", "full"] as const;
export const VERIFICATION_COST_CLASSES = ["cheap", "moderate", "expensive"] as const;
export type WorkingDirectoryPolicy = "candidate-root" | "relative-path";
export const VERIFICATION_LIMITS = Object.freeze({
  commands: 128, results: 128, argsPerCommand: 64,
  idChars: 128, pathChars: 1024, argChars: 4096,
  skipReasonChars: 1024, evidenceRefChars: 1024,
  planBytes: 256 * 1024, receiptBytes: 512 * 1024,
  fastCommandTimeoutMs: 10 * 60_000, fastBudgetMs: 15 * 60_000,
  fullCommandTimeoutMs: 60 * 60_000, fullBudgetMs: 2 * 60 * 60_000,
  diagnostics: 50,
} as const);

export const VERIFICATION_DIAGNOSTIC_CODES = [
  "invalid-type", "missing-field", "unknown-field", "invalid-value",
  "limit-exceeded", "duplicate-id", "unknown-command", "invalid-order",
  "invalid-stage", "invalid-exit-state", "invalid-evidence", "invalid-skip",
  "invalid-fail-fast", "digest-mismatch", "verdict-mismatch", "budget-exceeded",
] as const;
export type VerificationDiagnosticCodeV1 =
  (typeof VERIFICATION_DIAGNOSTIC_CODES)[number];
export interface VerificationDiagnosticV1 {
  readonly code: VerificationDiagnosticCodeV1;
  readonly path: string; // RFC 6901; static property names + decimal indices only
}

export interface VerificationCommandV1 {
  readonly id: string;                     // 1..128 chars; unique within plan
  readonly stage: "fast" | "full";
  readonly executable: string;             // 1..1024 chars, no NUL; never shell text
  readonly args: readonly string[];        // ≤64 ordered args, each ≤4096 chars, no NUL
  readonly workingDirectoryPolicy: WorkingDirectoryPolicy;
  readonly workingDirectory: string | null; // null iff root; bounded validated relative path otherwise
  readonly timeoutMs: number;              // positive integer within the command's stage ceiling
  readonly stopOnFailure: boolean;
  readonly costClass: "cheap" | "moderate" | "expensive";
}

export interface VerificationPlanV1 {
  readonly contract: typeof VERIFICATION_PLAN_CONTRACT_ID;
  readonly commands: readonly VerificationCommandV1[]; // 1..128, declared order
}
export type VerificationPlanValidationResult =
  | { readonly ok: true; readonly plan: VerificationPlanV1 }
  | { readonly ok: false; readonly diagnostics: readonly VerificationDiagnosticV1[];
      readonly truncated: boolean };
```

`validateVerificationPlanV1(value: unknown)` is the sole plan-validation
entry. It rejects inherited/unknown fields, structural failures and every D14
limit; enforces per-command and aggregate stage budgets; caps diagnostics; and
returns a normalized own-property `VerificationPlanV1` only on success.

#### VerificationReceipt v1 (`agentic-workflow/verification-receipt@1`)

```ts
export const VERIFICATION_RECEIPT_CONTRACT_ID = "agentic-workflow/verification-receipt@1";
export const VERIFICATION_COMMAND_STATUSES =
  ["passed", "failed", "timed-out", "skipped", "infrastructure-error"] as const;
export const VERIFICATION_VERDICTS = ["pass", "fail", "incomplete"] as const;

export interface EvidenceReferenceV1 {
  readonly ref: string;     // non-empty, ≤ 1024 chars, no NUL — opaque pointer to stored evidence
  readonly bytes: number;   // integer ≥ 0 — size of the captured evidence
  readonly sha256: string;  // lowercase /^[a-f0-9]{64}$/ — digest of the captured evidence
}

export interface VerificationResultV1 {
  readonly commandId: string;   // must exist in the bound plan
  readonly status: (typeof VERIFICATION_COMMAND_STATUSES)[number];
  readonly exitCode: number | null;  // integer; per the D4 matrix
  readonly signal: string | null;    // non-empty when present; per the D4 matrix
  readonly startedAt: string;        // ISO-8601 UTC
  readonly endedAt: string;          // ISO-8601 UTC, ≥ startedAt
  readonly stdout: EvidenceReferenceV1 | null;
  readonly stderr: EvidenceReferenceV1 | null;
  readonly skipReason: string | null; // per D3
}

export interface VerificationReceiptV1 {
  readonly contract: typeof VERIFICATION_RECEIPT_CONTRACT_ID;
  readonly planDigest: string;              // lowercase 64-hex — digestVerificationPlan(plan)
  readonly candidateSnapshotDigest: string; // from #138 — digestCandidateSnapshot(snapshot)
  readonly acceptanceFingerprint: string;   // from #138 — computeAcceptanceFingerprint(inputs)
  readonly stageRequested: "fast" | "full";
  readonly results: readonly VerificationResultV1[]; // ≤128, declared order; see D7
  readonly verdict: "pass" | "fail" | "incomplete";  // must equal deriveVerificationVerdict (D2)
}
export type VerificationReceiptValidationResult =
  | { readonly ok: true; readonly receipt: VerificationReceiptV1 }
  | { readonly ok: false; readonly diagnostics: readonly VerificationDiagnosticV1[];
      readonly truncated: boolean };
```

`validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` is
the sole receipt-validation entry. In one call it validates and normalizes the
plan and receipt, then enforces result-id existence/uniqueness/order, fast-stage
subset, complete `stopOnFailure` sequencing and attribution, plan digest,
stored verdict, D14 cardinality/byte limits and bounded diagnostics. Missing
required rows remain representable and yield verdict/freshness incompleteness.
The former standalone structural receipt validator is internal-only and is not
an alternate public PASS.

Both generated Draft-07 files are deterministic structural projections for
editors, form tooling and non-authoritative shape checks. Each projection names
the authoritative package validator and marks semantic validation as required;
`npm run check:verification-schemas` fails on any generated-file drift.

#### Stage, verdict, and freshness semantics

- **Stage required set:** `fast` → the plan's fast commands in declared
  order; `full` → every command in declared order.
- `deriveVerificationVerdict(receipt, plan)` — pure, deterministic,
  throws nothing:
  1. `incomplete` if the stage's required set has a missing result row
     (fast stage: a fast command lacks a row; full stage: any declared
     command lacks a row), or any `skipped` row lacks a `skipReason`;
  2. else `fail` if any result status ∈ `{failed, timed-out,
     infrastructure-error}`;
  3. else `pass`.
- `compareVerificationReceiptToCurrent(receipt, plan,
  candidateSnapshotDigest, acceptanceFingerprint)` — pure, async,
  deterministic, throws nothing. Fixed check order: plan digest →
  candidate-snapshot digest → acceptance fingerprint → a missing fast-stage
  result (`incomplete-missing-results`) → an unjustified skip → a missing
  full-stage result (`incomplete-stage-coverage`) → `{fresh: true}`, returning
  exactly one D1
  reason code. The predicate takes the digests directly (the consumer
  already holds them from the #138 review chain) and composes with
  `digestVerificationPlan`.
- **Delivery-gate rule (documented, composed by consumers):** a delivery
  verification gate is satisfied ONLY by a receipt that is fresh AND
  `stageRequested === "full"` AND `verdict === "pass"`. The package
  enumerates the rule in both READMEs; the gate decision itself stays with
  the consumer (no gate helper ships in v1 — scope discipline).

#### Canonical core (mirrors the existing #138 core)

- `canonicalizeVerificationPlan(plan)` /
  `canonicalizeVerificationReceipt(receipt)` — UTF-8 JSON, sorted object
  keys, compact separators, `null`s preserved, `commands`/`results` arrays
  in declared order (D6). Inputs must first pass their validators.
- `digestVerificationPlan(plan)` / `digestVerificationReceipt(receipt)` →
  lowercase SHA-256 hex of the canonical bytes (async, like the existing
  digest functions).
- `VERIFICATION_CANONICAL_VECTORS` — published deeply frozen vectors (one
  minimal valid plan, one minimal valid receipt) with readonly entry types and
  expected digests; tests pass both fixtures through the authoritative entries
  and prove repeated canonicalize/digest/derive/compare calls deeply equal.

### Decisions to confirm

- **D1–D16** as recorded in Product decisions: the original semantic choices
  plus one authoritative validation surface, generated structural projections,
  bounded usability, reclassified sizing and the AWL consumer boundary. Any
  later change is a reviewed, versioned package-contract change.

### Testing requirements

- Layer: package unit tests (`node --test`), red-first per phase — each
  contract's suite lands before its implementation tasks complete.
- Fixtures under `test/fixtures/` plus deterministic in-test construction;
  no multi-MiB blobs needed (evidence references carry digests, not
  content).
- Regression: every pre-existing suite stays green (machine-contract,
  capabilities, release-contract, index, workflow-decision*,
  candidate-snapshot, review-receipt, canonical-core, edge-matrix).
- Property: determinism via deep-equality on repeated canonicalize/digest/
  derive/compare calls through authoritative validated values.
- Generation: `npm run check:verification-schemas` regenerates both structural
  projections in memory and fails on any byte drift.
- Boundaries: exact-limit and over-limit fixtures for every D14 field, payload,
  timeout and diagnostic ceiling.
- Performance: a warm 128-command plan+receipt validation/digest benchmark has
  a declared p95 ceiling of 100 ms.

### Dev scenarios

No dev harness applies (pure contracts); every scenario is driven through
an existing test fixture.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `plan:empty-command-list` | empty/zero state — an empty plan | fixture → rejected |
| `plan:path-traversal` | invalid input — absolute/traversing/NUL working directory | fixture matrix → rejected |
| `plan:timeout-boundary` | limit/threshold — stage command/aggregate budgets at and above D14 | fixture pairs → boundary accepted, overflow rejected |
| `plan:command-boundary` | mass change — 128 vs 129 commands and 64 vs 65 args | fixture pairs → boundary accepted, overflow rejected |
| `plan:byte-boundary` | payload pressure — 256 KiB plan / 512 KiB receipt ceilings | byte-count fixtures → boundary accepted, overflow rejected |
| `receipt:vacuous-fast` | empty/zero state — plan with no fast commands, fast receipt | fixture → valid, verdict `pass`, delivery gate still requires full (D9) |
| `receipt:fail-fast-chain` | degraded state — `stopOnFailure` marks later commands skipped with the failed id | fixture → verdict `fail`, skips attributed (D3) |
| `receipt:unjustified-skip` | degraded state — skipped without a reason | fixture → verdict `incomplete`, code `incomplete-unjustified-skip` |
| `receipt:timeout-vs-failure` | dependency outage/timeout — timed-out and infrastructure-error rows | fixture → distinct statuses, verdict `fail`, never `pass` |
| `receipt:concurrent-candidate-advance` | concurrent action — candidate advanced after the run | predicate → `stale-candidate-snapshot` |
| `receipt:evidence-bound` | limit/threshold — `ref` exactly 1024 vs 1025 chars | fixture pair → accepted/rejected |
| `receipt:duplicate-result` | concurrent/duplicate action — two results for one command | fixture → rejected |
| permission denied | n/a — no ACL surface; the role matrix is compile-time | — |
| mass changes | 128-command maximum-capacity plan/receipt | authoritative validate → canonicalize → digest + p95 benchmark |

### Phases

`execute-phase 26` runs all remaining phases by default; an explicit `P<n>`
runs one atomic phase. This section is the execution ledger.

### P1 — Deliver the VerificationPlan v1 contract

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new verification-plan suites.

- [ ] Add `test/verification-plan.test.mjs` FIRST, exercising every rule
  below through the public entry point (red before the validator exists).
- [ ] Define and export `VERIFICATION_PLAN_CONTRACT_ID`,
  `VERIFICATION_STAGES`, `VERIFICATION_COST_CLASSES`,
  `WorkingDirectoryPolicy`, `VerificationCommandV1`, and
  `VerificationPlanV1` with the exact shapes from Design.
- [ ] Implement `validateVerificationPlanV1` structural rules: undeclared
  fields, contract id, non-empty command list, unique non-empty ids,
  stage/cost-class vocabularies, boolean `stopOnFailure`.
- [ ] Implement executable/args rules: non-empty executable, NUL rejection
  inside `executable` and every arg.
- [ ] Implement working-directory rules: policy ↔ `workingDirectory`
  nullness, and relative-path validation (non-empty, no NUL, no leading
  `/`, no `..` segment).
- [ ] Implement the timeout rule: `timeoutMs` must be a positive integer.
- [ ] Add `verification-plan.schema.json` (additionalProperties false at
  every level) + a parity test that schema and validator accept/reject the
  same fixtures.
- [ ] Export the plan surface from `src/index.ts` and record the grown
  artifact-set expectation for P3's pack check.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P1:schema:8:Deliver the VerificationPlan v1 contract

### P2 — Deliver the VerificationReceipt v1 contract

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new verification-receipt suites.

- [ ] Add `test/verification-receipt.test.mjs` FIRST, exercising every rule
  below through the public entry point (red before the validator exists).
- [ ] Define and export `VERIFICATION_RECEIPT_CONTRACT_ID`,
  `VERIFICATION_COMMAND_STATUSES` (5 values), `VERIFICATION_VERDICTS`
  (3 values), `EvidenceReferenceV1`, `VerificationResultV1`, and
  `VerificationReceiptV1` with the exact shapes from Design.
- [ ] Implement `validateVerificationReceiptV1` shape rules: undeclared
  fields, contract id, digest formats (plan, candidate-snapshot,
  acceptance fingerprint — lowercase 64-hex), `stageRequested` vocabulary,
  duplicate result command-id rejection.
- [ ] Implement per-result rules: status vocabulary, the D4 exit/signal
  matrix, ISO-8601 UTC timestamps with `endedAt ≥ startedAt`.
- [ ] Implement evidence and skip rules: D5 bounds (ref ≤ 1024 chars,
  bytes ≥ 0 integer, sha256 64-hex), `skipReason` null on non-skipped rows
  and ≤ 1024 chars when present.
- [ ] Add `verification-receipt.schema.json` (additionalProperties false at
  every level) + a parity test against the validator on the shared fixture
  set.
- [ ] Export the receipt surface from `src/index.ts` and assert the full
  suite (P1 + P2) is green together — no export collisions.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P2:schema:7:Deliver the VerificationReceipt v1 contract

### P3 — Implement the staged verification semantic core

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 with vector, determinism, verdict, and freshness suites green;
`grep '"version"' packages/agentic-workflow-schema/package.json` → `3.4.0`.

- [ ] Implement `validateVerificationReceiptAgainstPlan`: plan-validated +
  receipt-validated + result ids exist + declared order + fast-stage subset
  + D3 fail-fast attribution + `planDigest` match + verdict consistency
  (D2) + unit tests.
- [ ] Implement `deriveVerificationVerdict` per the D2 precedence +
  unit tests.
- [ ] Implement the canonical digest surface for both contracts —
  `canonicalizeVerificationPlan`, `canonicalizeVerificationReceipt`,
  `digestVerificationPlan`, `digestVerificationReceipt` (D6) + unit tests.
- [ ] Implement `compareVerificationReceiptToCurrent` with the D1 reason
  codes in the fixed check order + unit tests.
- [ ] Publish frozen `VERIFICATION_CANONICAL_VECTORS` + authoritative-entry,
  generated-projection and digest agreement tests; repeated calls deeply equal
  (the 2026-08-26 amendment replaces the historical dual-authority wording).
- [ ] Add the synchronized staged-verification section to `README.md` and
  `README.es.md` in the same change (AD-002): two-stage model, stage rules,
  verdict semantics, freshness codes, the delivery-gate rule, the
  no-execution boundary.
- [ ] Bump the package version `3.3.0` → `3.4.0` (minor, additive) and
  verify `npm pack --dry-run` lists the grown artifact set (both new schema
  files).

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P3:schema:7:Implement the staged verification semantic core

### P4 — Cover the mandated verification scenario matrix

Layer: hardening. Done-when: `cd packages/agentic-workflow-schema && npm
test` → exit 0 with the verification-scenario suites green.

- [ ] Add fast success and fast fail-fast scenarios end-to-end: plan →
  receipt → derive verdict → freshness (verdicts `pass` / `fail`).
- [ ] Add full success and full fail-fast scenarios end-to-end, including
  D3 skip attribution to the failed command id.
- [ ] Add timeout and infrastructure-error scenarios: distinct statuses,
  D4 matrix, verdict `fail`, never `pass`.
- [ ] Add skipped-with-reason and skipped-without-reason scenarios
  (verdict `fail` vs `incomplete`, code `incomplete-unjustified-skip`).
- [ ] Add missing-results and requested-full coverage-gap scenarios
  (verdict `incomplete`, codes `incomplete-missing-results` /
  `incomplete-stage-coverage`), including the D9 vacuous-fast pin.
- [ ] Add stale candidate, stale acceptance, and stale plan scenarios
  (codes `stale-candidate-snapshot` / `stale-acceptance-fingerprint` /
  `stale-plan`).
- [ ] Add path-traversal and duplicate-id rejection scenarios through the
  full validate → canonicalize → digest → compare pipeline.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P4:hardening:7:Cover the mandated verification scenario matrix

### P5 — Hardening & PR

Layer: close-out. Done-when: every project gate is green, the PR is open with
`Closes #139`, and the roadmap row reads `done · [#<pr>](<pr-url>)`.

- [ ] Re-run the project's full verification gate — `cd
  packages/agentic-workflow-schema && npm test` → exit 0; `node
  scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push` — branch pushed, PR branch remote-current
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
  Markdown file, real backticks, never inline `--body`/heredoc that leaves
  `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes
  `Closes #139`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<pr>` and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P5:close-out:7:Hardening & PR

### P6 — Staged-verification contract correction

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with all tests passing (≥ 310 tests); `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0.

Recorded by the 2026-08-24 amendment (post-review replan-in-unit); execution ledger lives in `TASKS.md`/`progress.md`.

- [ ] Fix `compareVerificationReceiptToCurrent` to distinguish missing-results from full-coverage-gap (F31)
- [ ] Replace self-derived canonical vectors with independently fixed expected digests (F32)
- [ ] Pre-validate before hashing/dereferencing (F33) — completed; residual order defect folded as F40 in the second review round
- [ ] Freeze all exported vocabulary arrays (F36)
- [ ] Correct EN/ES README examples so they compile (F35)
- [ ] Restore the fixed ledger schema and remove non-fix-now rows (F39)

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P6:schema:6:Staged-verification contract correction

### P7 — Unify validation authority

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test && node scripts/generate-verification-schemas.mjs --check` → exit 0 with authority-surface, ownership and projection suites green.

- [ ] Add red-first public export-surface assertions for exactly two runtime validation entries
- [ ] Add red-first own-property normalization fixtures for plan and receipt inputs
- [ ] Introduce one internal canonical verification-contract definition consumed by runtime validation and deterministic projection (F76)
- [ ] Make `validateVerificationPlanV1(value: unknown)` the sole plan entry and return a normalized plan DTO (F64)
- [ ] Make `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` the sole receipt entry and return a normalized receipt DTO
- [ ] Retire the standalone public receipt validator without a compatibility alias
- [ ] Remove or register the duplicate verification constants so one public surface remains (F69)
- [ ] Implement the deterministic two-file projection generator/check with explicit non-authoritative metadata

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P7:schema:8:Unify validation authority

### P8 — Repair freshness classification

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with seven disjoint freshness outcomes reachable and stable.

- [ ] Add red-first fixtures for stale plan, candidate snapshot and acceptance fingerprint
- [ ] Add red-first fixtures for missing results, unjustified skip and stage-coverage gap
- [ ] Implement the three stale-condition branches in fixed precedence
- [ ] Implement the three incomplete-condition branches in fixed precedence
- [ ] Make stale and incomplete predicates mutually disjoint (F63)
- [ ] Prove the remaining fresh outcome is reachable and deterministic

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P8:schema:6:Repair freshness classification

### P9 — Repair verification semantics

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with fail-fast, stage-rejection, readonly-vector and determinism suites green.

- [ ] Add red-first fixtures for fail-fast sequencing and attribution
- [ ] Enforce `stopOnFailure` result sequencing (F65)
- [ ] Enforce `stopOnFailure` skip attribution (F65)
- [ ] Make the fast-stage rejection fixture exercise a full-command result (F66)
- [ ] Make frozen canonical-vector entries readonly in the public type (F67)
- [ ] Validate both published vectors through their authoritative entries (F72)
- [ ] Prove repeated canonicalize, digest and verdict calls deeply equal (F72)
- [ ] Prove repeated freshness comparisons deeply equal (F72)

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P9:schema:8:Repair verification semantics

### P10 — Bound verification shapes

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with every P10 exact-boundary/one-over pair green.

- [ ] Add red-first boundary pairs for command, result and argument cardinalities
- [ ] Add red-first boundary pairs for plan id and receipt command id lengths
- [ ] Add red-first boundary pairs for executable and working-directory lengths
- [ ] Add red-first boundary pairs for argument length and NUL rejection
- [ ] Enforce the three cardinality ceilings from the canonical definition
- [ ] Enforce both id ceilings from the canonical definition
- [ ] Enforce executable, working-directory and argument string bounds
- [ ] Export frozen shape-limit metadata and project every Draft-07-expressible shape bound

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P10:schema:8:Bound verification shapes

### P11 — Bound verification payloads

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with byte, existing-string and diagnostic boundary suites green.

- [ ] Add red-first boundary pairs for canonical plan and receipt byte sizes
- [ ] Add red-first boundary pairs for skip-reason and evidence-reference lengths
- [ ] Add red-first fixtures for diagnostic cap, truncation flag and value redaction
- [ ] Enforce both canonical byte budgets before unbounded diagnostic allocation
- [ ] Enforce the existing skip-reason and evidence-reference bounds
- [ ] Publish the frozen diagnostic-code vocabulary and RFC 6901 path representation
- [ ] Replace `errors: string[]` with the bounded diagnostic failure branch (F71)
- [ ] Project expressible payload bounds and mark canonical byte budgets runtime-only

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P11:schema:8:Bound verification payloads

### P12 — Bound verification time

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with all command and aggregate timeout boundary pairs green.

- [ ] Add red-first boundary pairs for fast and full command timeout ceilings
- [ ] Add red-first boundary pairs for fast and full aggregate stage budgets
- [ ] Enforce both per-command timeout ceilings from the canonical definition
- [ ] Enforce both aggregate stage budgets from the canonical definition
- [ ] Export frozen timeout-limit metadata for consumers and tooling
- [ ] Project command ceilings and mark aggregate sums authoritative-runtime-only

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P12:schema:6:Bound verification time

### P13 — Build package qualification tooling

Layer: config/infra · Done-when: `cd packages/agentic-workflow-schema && npm ci && bun install --frozen-lockfile && npm run check:verification-schemas && npm run bench:verification -- --commands 128 && npm run check:verification-package` → exit 0 with synchronized locks and p95 ≤100 ms.

- [ ] Remove unused Node typing configuration and regenerate the npm lock (F70)
- [ ] Regenerate the Bun lock from the same package manifest
- [ ] Implement a warm-sample 128-command benchmark with a failing p95 ceiling
- [ ] Implement a package-content checker that proves both generated projections ship
- [ ] Register the deterministic `check:verification-schemas` command
- [ ] Register the `test:verification-docs` command for P14's executable assertions
- [ ] Register the benchmark, package-content and aggregate qualification commands

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P13:config/infra:7:Build package qualification tooling

### P14 — Document the verification contract

Layer: docs · Done-when: `cd packages/agentic-workflow-schema && npm run test:verification-docs` → exit 0 with extractable examples and synchronized EN/ES semantic assertions green.

- [ ] Add red-first executable example and EN/ES semantic-parity assertions
- [ ] Document the two-entry runtime authority and projection boundary in README.md
- [ ] Publish the faithful Spanish authority/projection section in README.es.md
- [ ] Correct the English example's content bindings and result timestamps (F68)
- [ ] Apply the equivalent Spanish example correction (F68)
- [ ] Document every v1 limit and aggregate budget in the English reference
- [ ] Publish the equivalent limits and budgets in the Spanish reference
- [ ] Record the deferred AWL consumer boundary in both references without creating an issue

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P14:docs:8:Document the verification contract

### P15 — Requalify the delivery candidate

Layer: close-out · Done-when: all declared commands exit 0, `git status -sb` is remote-current, PR #145 describes the exact pushed HEAD, and the replacement-manifest receipt is current.

- [ ] Run `cd packages/agentic-workflow-schema && npm ci`
- [ ] Run `cd packages/agentic-workflow-schema && bun install --frozen-lockfile`
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification`
- [ ] Run `node scripts/check-skill-context.mjs`
- [ ] Run `npx skills add . --list`
- [ ] Record the exact AC1–AC10 replacement-manifest execution receipt
- [ ] Finalize the fix-now ledger, including F62b relocation and F63–F77 folding
- [ ] Synchronize feature progress and roadmap delivery state
- [ ] Refresh PR #145 through `gh pr edit --body-file`
- [ ] Publish the exact candidate commit and verify branch/PR head equality

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P15:close-out:10:Requalify the delivery candidate

After P15, hand the exact pushed HEAD and replacement acceptance blob to a fresh
`/review-change`; execution does not claim that independent review receipt.

### 2026-08-27 corrective replan (user-ordered)

Two review rounds left F97/F99/F100/F106 open (fix-now, too large for a fold) and
F107–F110 fold-directly. This replan appends P16–P21 as the unit's corrective
close-out; the frozen `ACCEPTANCE.md` blob `2e8058860b2c805cc30507053f15f91e2f273249`
is untouched and remains the finish line. Convergence policy: execute P16→P20
back-to-back (≈ 1 focused work day); P21 runs ONE `--adversarial 3` review over
the whole corrected candidate, folds its fix-now rows inside the phase, and
escalates only architectural or acceptance-level findings — no new corrective
phases are created automatically. F100 routes to the restore path (the F80 guard
is scoped to the feature-26 canonicalizers); amending AC8 instead requires the
user's explicit acceptance amendment before P19 executes. Row resolution:
F97→P17, F99→P18, F100→P19, F106→P20, F107/F109/F110→P16, F108→P21.

### P16 — Correct published docs hygiene

Layer: docs · Done-when: `cd packages/agentic-workflow-schema && npm run test:verification-docs` exits 0 with the new qualifier assertion, no unqualified `bench:verification` consumer sentence remains in either README, and ledger rows F107/F109/F110 read `folded: yes` naming the P16 commit.

- [ ] Annotate ledger rows F98/F101–F105 with their fold commits (e7a7f49 / a76ad88 / fdd2a98) and flip F107 `folded: yes` in the same commit
- [ ] Annotate ledger row F109 `folded: yes` citing the replan commit's roadmap flip plus the P21 close-out re-flip obligation
- [ ] Add the source-checkout qualifier to the `bench:verification` proof sentence in both READMEs (F110), pin it with a red-first docs assertion, and synchronize the case-count line in both CHANGELOGs
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0, docs suite 23/23
- [ ] Commit P16 atomically (fix plus ledger ticks) and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P16:docs:5:Correct published docs hygiene

### P17 — Snapshot verification input at validation entry

Layer: domain · Done-when: the hostile-getter suite proves both public entries decide and build DTOs from one captured document for every accessor, `npm run gate:verification` exits 0 with p95 ≤ 100 ms, and ledger F97 reads `folded: yes` naming the P17 commit.

- [ ] Write the hostile-getter regression suite red-first: a getter whose value flips at each successive read — for every plan accessor (contract, commands, id, stage, executable, args, workingDirectoryPolicy, workingDirectory, timeoutMs, costClass, stopOnFailure) and every receipt accessor (contract, planDigest, candidateSnapshotDigest, acceptanceFingerprint, results, stageRequested, verdict, commandId, status, exitCode, signal, startedAt, endedAt, stdout + ref/bytes/sha256, stderr + ref/bytes/sha256, skipReason) — must yield a refusal or a blessed DTO identical to the validated document, on both public entries. (`durationMs`/`evidence` as first written do not exist in `RESULT_SPEC`; corrected to the real accessors in P17, see `decisions.md` — the enumeration is a superset of the original intent.)
- [ ] Capture the submitted value once at entry into a frozen own-property snapshot (the capture reads every submitted accessor exactly once); validate and build DTOs from the snapshot only
- [ ] Route both public entries through the capture; a throwing getter surfaces as the existing redacted `invalid-type` refusal (F92 parity)
- [ ] Keep diagnostic parity: every refusal after capture still carries only a frozen code plus RFC-6901 path
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0, benchmark p95 ≤ 100 ms
- [ ] Flip F97 `folded: yes` naming the P17 commit; commit atomically and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P17:domain:6:Snapshot verification input at validation entry

### P18 — Bound verification preflight refusal work

Layer: domain · Done-when: a 200,000-command plan is refused `limit-exceeded` in ≤ 50 ms wall-clock, `npm run gate:verification` exits 0, and ledger F99 reads `folded: yes` naming the P18 commit.

- [ ] Write the red-first preflight budget probe: a cardinality-illegal payload must be refused without canonical serialization (the observed 2189 ms at 200k commands must drop under the 50 ms bound)
- [ ] Refuse illegal raw cardinalities at entry from the raw shape (command/result array lengths against `VERIFICATION_LIMITS`) before snapshot capture
- [ ] Measure the canonical byte budget with an early-exit serializer that aborts as soon as the running size passes the budget
- [ ] Sequence both public entries: raw cardinality → capture → bounded byte measure → full validation walk
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0; re-run the 10k and 200k probes and record the new timings in the commit body
- [ ] Flip F99 `folded: yes` naming the P18 commit; commit atomically and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P18:domain:6:Bound verification preflight refusal work

### P19 — Restore legacy canonicalizer compatibility

Layer: domain · Done-when: the golden-vector suite proves every legacy `canonicalize*`/`digest*` export returns byte-identical 3.3.0 output on the captured unsupported-leaf corpus, the verification surface's refusals stay green, `npm run gate:verification` exits 0, and ledger F100 reads `folded: yes` naming the P19 commit.

- [ ] Capture golden vectors from the merge-base code (`git show e84db167:...` executed under Node): legacy `canonicalize*`/`digest*` outputs for documents containing undefined, function, symbol, bigint and non-finite leaves
- [ ] Write the red-first compatibility suite from the golden vectors for every legacy export
- [ ] Scope the named-TypeError total-leaf guard to the feature-26 verification canonicalizers; restore the captured 3.3.0 fallback serialization for the legacy exports only
- [ ] Re-point the branch-local tests that pinned the interim throw on legacy exports to the golden vectors; never touch verification-surface refusal tests (F92 parity)
- [ ] Precise the 3.4.0 ship record in both CHANGELOGs (byte-identical schemas AND unchanged legacy export behavior) and scope the F80 guard note in decisions.md to the verification canonicalizers
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0; flip F100 `folded: yes` naming the P19 commit; commit atomically and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P19:domain:6:Restore legacy canonicalizer compatibility

### P20 — Recover ledger fold provenance

Layer: docs · Done-when: a mechanical recount proves zero `folded: yes` rows lack a commit token, and ledger F106 reads `folded: yes` naming the P20 commit.

- [ ] Run the scripted per-row `git log -S` recovery over the 62 token-less rows
- [ ] Annotate every row whose fold commit is proven
- [ ] Re-open every row whose fold cannot be proven (`folded: no` plus a BLOCKED note naming the missing evidence)
- [ ] Flip F106 `folded: yes` naming the P20 commit; commit atomically and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P20:docs:4:Recover ledger fold provenance

### P21 — Requalify the corrected candidate

Layer: close-out · Done-when: AC1–AC10 are re-verified against the frozen blob, an `--adversarial 3` review at the terminal head returns PASS with zero open findings, the PR #145 body describes the terminal head, and the roadmap row reads `done`.

- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification` and `node scripts/check-skill-context.mjs` — both exit 0
- [ ] Verify AC1–AC10 against the frozen ACCEPTANCE.md blob `2e8058860b2c805cc30507053f15f91e2f273249` and record the execution receipt in progress.md
- [ ] Run review-change `--adversarial 3` over the whole corrected candidate at the terminal head (isolated finder passes)
- [ ] Fold every fix-now row the review produces within this phase (bounded correction pass); escalate only architectural or acceptance-level findings to the user
- [ ] Refresh the PR #145 body to the terminal head and flip F108 `folded: yes`
- [ ] Run loop-review-fold 26-staged-verification-contracts to PASS
- [ ] Flip roadmap row 26 back to `done · [#145]` after PASS

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P21:close-out:7:Requalify the corrected candidate


### Spec-lint (mechanical — engineering boxes, run at scaffold time)

- [x] `### Dev scenarios` has ≥ 1 failure-mode row (the fixed category list is
  walked; n/a rows carry reasons).
- [x] Every remaining phase P7–P15 passes the 8-box Phase-lint; historical
  P1–P6 fingerprints are preserved as executed records.
- [x] No template placeholders left anywhere in the file.

### Deploy & rollback

The package ships as an additive minor release (`3.3.0` → `3.4.0`); the
feature-26 API is still unshipped, so consolidating its validators before merge
has no released migration. The artifact set grows by two generated structural
projections. Rollback: revert PR #145 to restore v3.3.0.

### Open questions / risks

- **Risk — canonical choices are v1 contract.** Key sorting, array-order
  preservation, evidence bounds, reason-code set, and verdict precedence
  (D1–D6) are choices within the issue's constraints; they are locked by
  published vectors and tests. Accepted.
- **Risk — `costClass` is declared, not measured.** A command may be cheap on
  one project and expensive on another; the issue resolves this as project
  metadata. Accepted.
- **Risk — vacuous fast pass (D9).** A plan with no fast commands yields a
  trivially passing fast receipt; the delivery gate requires `full`, so it
  cannot reach delivery verification. Pinned by a test. Accepted.
- **Risk — structural projections are not standalone semantic validators.** A
  generic Draft-07 engine cannot prove plan-bound relationships. D12 makes the
  package validator the single PASS authority; projection metadata, docs and
  export tests prevent an alternate public entry. Accepted.
- **Risk — fixed v1 capacity.** Projects needing >128 declared checks or >2 h
  aggregate full-stage timeout must aggregate checks behind a runner or propose
  a new versioned contract. This preserves usable repair/delivery loops. Accepted.
- **Inherited — stale fix-index rows (134 marked `in-progress` though PR
  #135 merged; 100/101/117/119 marked `done` pending row removal):**
  documentation hygiene owned by `audit-docs`/the fix index; not touched by
  this unit.

### Deliverables

- Updated `packages/agentic-workflow-schema/src/index.ts` — both v1 contract
  surfaces, one canonical internal definition, exactly two public validators,
  D14 limits, verdict/freshness semantics, canonical core, readonly vectors and
  bounded diagnostics.
- Generated `packages/agentic-workflow-schema/verification-plan.schema.json` +
  `verification-receipt.schema.json` structural projections and deterministic
  drift check.
- New `test/verification-plan.test.mjs`,
  `test/verification-receipt.test.mjs`, `test/verification-core.test.mjs`,
  `test/verification-scenarios.test.mjs`, fixtures.
- Updated `README.md` + `README.es.md` — synchronized
  staged-verification section.
- Updated package metadata — version `3.4.0`, exports/files/scripts grown,
  npm/Bun locks synchronized, unused Node typing dependency removed.
- Verification schema generator/check plus 128-command p95 benchmark.
- Updated `docs/features/ROADMAP.md` — row 26 remains linked as
  `done · #145` under the roadmap's PR-open state convention while the replan
  reopens unit-local phases.
- This SPEC.md + the M/L planning artifact set — frozen planning artifacts.

### Post-merge next feature

The natural successor is consumer-side adoption after AWL upgrades to the
released schema package: emitting plans/receipts, calling the two authoritative
validators, and only then deciding whether AWL needs a dialect or runner. This
remains a user-routed independent proposal; this replan creates no issue.
