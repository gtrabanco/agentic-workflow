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

`M` — two new versioned wire contracts (strict TypeScript types, validators,
two new JSON Schema files), a canonical digest core with published vectors, a
stage/verdict semantic engine, a pure freshness predicate with stable
stale/incomplete reason codes, an extensive mandated scenario matrix,
bilingual package reference, additive minor release. Five single-layer phases;
no split trigger applies (≤ ~5 phases, one layer per phase, zero unresolved
design decisions).

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

- **S1:** Strict TypeScript types, validators, JSON Schemas, and exported
  constants for `agentic-workflow/verification-plan@1` and
  `agentic-workflow/verification-receipt@1`, both rejecting undeclared
  fields.
- **S2:** `VerificationPlan v1` — an ordered, non-empty command list where
  each command carries: stable `id`; `stage: fast | full`; `executable` plus
  ordered `args` represented separately (never an inferred shell string);
  working-directory policy `candidate-root | relative-path` with a validated
  relative path when applicable; positive integer `timeoutMs`;
  `stopOnFailure` boolean; cost class `cheap | moderate | expensive`.
- **S3:** `VerificationReceipt v1` — plan digest and candidate-snapshot
  digest from #138; acceptance fingerprint; ordered per-command results with
  status `passed | failed | timed-out | skipped | infrastructure-error`;
  exit code or signal, start/end timestamps, bounded stdout/stderr evidence
  references, and an explicit skip reason; overall verdict
  `pass | fail | incomplete` and the stage actually requested.
- **S4:** Stage rules — requesting `fast` executes only fast commands;
  requesting `full` executes every fast and full command in declared order;
  `stopOnFailure: true` marks later commands `skipped` with the failed
  command id; only a current, complete `full` receipt may satisfy a delivery
  verification gate.
- **S5:** Verdict semantics — `pass | fail | incomplete` rules with a fixed
  precedence, enumerated in this SPEC (never delegated to "consumer
  behavior").
- **S6:** Validation failures — duplicate command ids, an empty plan, an
  absolute/traversing relative path, a non-positive timeout, or unknown
  vocabulary fails validation.
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
  sets, validators (structural + plan-bound), verdict derivation, canonical
  and digest functions, freshness predicate, published vectors, constants
  (contract ids, stage/status/verdict/cost-class vocabularies, freshness
  reason codes) · test: public-entry import suites.
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

- [x] Public package API — additive exports only; existing export meanings
  unchanged · test: full regression suite.
- [x] Existing machine contracts — `Envelope v2`, `SkillOutcome v1`,
  `WorkflowSnapshot v1`, `CandidateSnapshot v1`, `ReviewReceipt v1` and
  their five JSON Schema files unchanged · test: existing suites plus
  diff-clean check on the five shipped schema files.
- [x] Bilingual package documentation — `README.md` + `README.es.md` gain
  the synchronized staged-verification section (two-stage model,
  delivery-gate rule, no-execution boundary) · test: grep anchors in both
  files.
- [x] Package distribution — minor release `3.4.0`; artifact set grows by
  the two new schema files · test: `npm pack --dry-run`.

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

### Acceptance criteria

- [ ] **AC1 — command-verified:** `cd packages/agentic-workflow-schema &&
  npm test` exits 0 with a verification-plan suite proving: undeclared-field
  rejection, non-empty command list, duplicate/empty id rejection,
  `fast | full` stage vocabulary, `cheap | moderate | expensive` cost-class
  vocabulary, non-empty NUL-free executable and args, working-directory
  policy (null iff `candidate-root`; a validated relative path iff
  `relative-path`: non-empty, no NUL, no leading `/`, no `..` segment),
  positive-integer `timeoutMs`, boolean `stopOnFailure`.
- [ ] **AC2 — command-verified:** `npm test` exits 0 with a
  verification-receipt suite proving: undeclared-field rejection, closed
  status (5 values) / verdict (3 values) / stage (2 values) vocabularies,
  lowercase 64-hex digest formats (`planDigest`,
  `candidateSnapshotDigest`, `acceptanceFingerprint`), ISO-8601 UTC
  timestamps with `endedAt ≥ startedAt`, the exit-code/signal consistency
  matrix, evidence-reference bounds (non-empty `ref` ≤ 1024 chars, integer
  `bytes ≥ 0`, lowercase 64-hex `sha256`), skip-reason rules, duplicate
  result command-id rejection, and verdict consistency with
  `deriveVerificationVerdict`.
- [ ] **AC3 — command-verified:** `npm test` exits 0 with a stage/verdict
  suite covering: fast success, fast fail-fast, full success, full
  fail-fast, timeout, infrastructure error, skipped commands (with and
  without reason), missing results, a requested-full coverage gap, and the
  pass rule — a full receipt cannot pass unless every declared fast and
  full command has a current passed result.
- [ ] **AC4 — command-verified:** `npm test` exits 0 with a freshness suite
  returning exactly one stable reason code per dimension — `stale-plan`,
  `stale-candidate-snapshot`, `stale-acceptance-fingerprint`,
  `incomplete-missing-results`, `incomplete-unjustified-skip`,
  `incomplete-stage-coverage` — plus `{fresh: true}`.
- [ ] **AC5 — command-verified:** published canonical vectors for both
  contracts pass identically on the TypeScript path and the JSON-Schema
  path; repeated canonicalize/digest/compare calls are deeply equal
  (determinism).
- [ ] **AC6 — command-verified:** `grep` finds the staged-verification
  section, the two-stage statement, and the delivery-gate rule ("only a
  current, complete full receipt") in both
  `packages/agentic-workflow-schema/README.md` and `README.es.md`.
- [ ] **AC7 — command-verified:** existing verification passes unchanged —
  `npm test` exit 0 including all pre-existing suites; `node
  scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit
  0; `grep '"version"' packages/agentic-workflow-schema/package.json` →
  `3.4.0`; `npm pack --dry-run` lists the grown public artifact set (+ the
  two new schema files).
- [ ] **AC8 — read-verified:** `git diff` clean on
  `envelope.schema.json`, `skill-outcome.schema.json`,
  `workflow-snapshot.schema.json`, `candidate-snapshot.schema.json`,
  `review-receipt.schema.json`, and all pre-existing contract types — no
  meaning of any existing export changed.

### Tooling

n/a: the existing TypeScript compiler and the schema-package test scripts
are authoritative; no external skill or MCP is required.

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
- **D7 — Stage-coverage rules (schema level).** Every result's `commandId`
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
- **D10 — Size `M`, five phases, no split.** Two contracts + semantic core +
  scenario matrix exceed one commit/half-day (not XS/S), yet cut cleanly
  into five single-layer phases ≤ ~5 — the split trigger does not fire.
- **D11 — Traceability.** Origin: issue #139. The implementation PR must
  include `Closes #139`.

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Consumer-side wiring (`execute-phase`/`review-change` emitting real plans/receipts) | The package must exist first; producer-side adoption is a separate unit | After this feature lands; next driver-integration unit |
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
- [x] Expectation sweep contains sixteen resolved rows with pointers.
- [x] Every in-scope bullet maps to at least one acceptance criterion.
- [x] Every acceptance criterion is command-verified or read-verified.
- [x] Deferred decisions exists with decide-by triggers.

## Design status

`designed`

---

## Engineering half

Written by `plan-feature-scaffold` after this Product half.

### Technical goals

- Add both v1 contract surfaces (types, strict validators, two JSON Schema
  files, exported constants) as additive package exports with no existing
  meaning changed.
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
`npm test` green, JSON schemas match TS types, version bump for any public
API change).

- **Schema/package boundary:** all additions live inside
  `packages/agentic-workflow-schema/` (single-file `src/index.ts` precedent);
  the two NEW `*.schema.json` files join the shipped artifact set; the five
  existing schema files and existing types are untouched.
- **Layering:** pure data contracts + pure functions — no I/O, no subprocess,
  no shell, no forge; the caller owns execution.
- **NRS status:** frozen → consumed; W004 records this very issue as planned
  work. No contradiction affects this plan.

### Design

Reproduces the issue's rules verbatim where marked; residual mechanical gaps
are closed by D1–D9 and locked by tests.

#### VerificationPlan v1 (`agentic-workflow/verification-plan@1`)

```ts
export const VERIFICATION_PLAN_CONTRACT_ID = "agentic-workflow/verification-plan@1";
export const VERIFICATION_STAGES = ["fast", "full"] as const;
export const VERIFICATION_COST_CLASSES = ["cheap", "moderate", "expensive"] as const;
export type WorkingDirectoryPolicy = "candidate-root" | "relative-path";

export interface VerificationCommandV1 {
  readonly id: string;                     // stable, non-empty, unique within the plan
  readonly stage: "fast" | "full";
  readonly executable: string;             // non-empty, no NUL — never a shell string
  readonly args: readonly string[];        // ordered; each without NUL; may be empty
  readonly workingDirectoryPolicy: WorkingDirectoryPolicy;
  readonly workingDirectory: string | null; // null iff candidate-root; validated relative path iff relative-path
  readonly timeoutMs: number;              // positive integer
  readonly stopOnFailure: boolean;
  readonly costClass: "cheap" | "moderate" | "expensive";
}

export interface VerificationPlanV1 {
  readonly contract: typeof VERIFICATION_PLAN_CONTRACT_ID;
  readonly commands: readonly VerificationCommandV1[]; // non-empty, declared order
}
```

`validateVerificationPlanV1(value)` rejects: unknown top-level/command
fields; `contract` mismatch; an empty `commands` array; duplicate or empty
command ids; `stage` or `costClass` outside vocabulary; an empty executable
or NUL inside `executable`/`args`; `workingDirectoryPolicy` inconsistent
with `workingDirectory` nullness; a relative path that is empty, contains
NUL, has a leading `/`, or contains a `..` segment; `timeoutMs` that is not
a positive integer; `stopOnFailure` that is not a boolean.

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
  readonly results: readonly VerificationResultV1[]; // declared order; see D7
  readonly verdict: "pass" | "fail" | "incomplete";  // must equal deriveVerificationVerdict (D2)
}
```

`validateVerificationReceiptV1(value)` (structural, schema-mirrored)
rejects: unknown fields at any level; `contract` mismatch; closed
vocabularies (status/verdict/stage); digest formats (`planDigest`,
`candidateSnapshotDigest`, `acceptanceFingerprint` lowercase 64-hex);
non-ISO-8601 UTC timestamps or `endedAt < startedAt`; D4 exit/signal
violations; D5 evidence-bound violations; `skipReason` non-null on a
non-`skipped` row, empty, or longer than 1024 chars; duplicate result
command ids.

`validateVerificationReceiptAgainstPlan(receipt, plan)` (binding +
semantic) additionally rejects: a result `commandId` that does not exist in
the plan; results out of declared order; a full-command result in a
fast-stage receipt; a D3 fail-fast attribution violation (skipReason naming
a non-existent, later, passed, or non-`stopOnFailure` command);
`receipt.planDigest !== digestVerificationPlan(plan)`; a stored verdict that
differs from `deriveVerificationVerdict(receipt, plan)`. Missing result
rows are NOT rejected — they yield verdict `incomplete` / freshness codes.

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
  candidate-snapshot digest → acceptance fingerprint →
  `incomplete-missing-results` → `incomplete-unjustified-skip` →
  `incomplete-stage-coverage` → `{fresh: true}`, returning exactly one D1
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
- `VERIFICATION_CANONICAL_VECTORS` — published frozen vectors (one minimal
  valid plan, one minimal valid receipt) with expected digests; vector
  agreement tests assert the TypeScript path, the JSON-Schema validation
  path, and the published digests agree, and that repeated calls are deeply
  equal.

### Decisions to confirm

- **D1–D11** as recorded in Product decisions (reason-code set, verdict
  precedence, skip-reason semantics, exit/signal matrix, evidence bounds,
  canonical form, stage-coverage rules, minimal receipt surface, vacuous
  fast stage, sizing, traceability). These close the issue's residual
  mechanical gaps; changing any later is a reviewed, versioned package
  change.

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
  derive/compare calls.

### Dev scenarios

No dev harness applies (pure contracts); every scenario is driven through
an existing test fixture.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `plan:empty-command-list` | empty/zero state — an empty plan | fixture → rejected |
| `plan:path-traversal` | invalid input — absolute/traversing/NUL working directory | fixture matrix → rejected |
| `plan:timeout-boundary` | limit/threshold — `timeoutMs` 1 vs 0 | fixture pair → accepted/rejected |
| `receipt:vacuous-fast` | empty/zero state — plan with no fast commands, fast receipt | fixture → valid, verdict `pass`, delivery gate still requires full (D9) |
| `receipt:fail-fast-chain` | degraded state — `stopOnFailure` marks later commands skipped with the failed id | fixture → verdict `fail`, skips attributed (D3) |
| `receipt:unjustified-skip` | degraded state — skipped without a reason | fixture → verdict `incomplete`, code `incomplete-unjustified-skip` |
| `receipt:timeout-vs-failure` | dependency outage/timeout — timed-out and infrastructure-error rows | fixture → distinct statuses, verdict `fail`, never `pass` |
| `receipt:concurrent-candidate-advance` | concurrent action — candidate advanced after the run | predicate → `stale-candidate-snapshot` |
| `receipt:evidence-bound` | limit/threshold — `ref` exactly 1024 vs 1025 chars | fixture pair → accepted/rejected |
| `receipt:duplicate-result` | concurrent/duplicate action — two results for one command | fixture → rejected |
| permission denied | n/a — no ACL surface; the role matrix is compile-time | — |
| mass changes | n/a — no size dimension beyond the evidence bounds and the >32-command ordering (covered by tests) | — |

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
- [ ] Publish frozen `VERIFICATION_CANONICAL_VECTORS` + vector-agreement
  tests: TypeScript path == JSON-Schema path == published digests; repeated
  calls deeply equal (determinism).
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

### Spec-lint (mechanical — engineering boxes, run at scaffold time)

- [x] `### Dev scenarios` has ≥ 1 failure-mode row (the fixed category list is
  walked; n/a rows carry reasons).
- [x] Every phase passes the 8-box Phase-lint (records above).
- [x] No template placeholders left anywhere in the file.

### Deploy & rollback

The package ships as an additive minor release (`3.3.0` → `3.4.0`); no
migration, flag, or config change; the artifact set grows by two schema
files. Rollback: revert the PR to restore v3.3.0.

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
- **Inherited — stale fix-index rows (134 marked `in-progress` though PR
  #135 merged; 100/101/117/119 marked `done` pending row removal):**
  documentation hygiene owned by `audit-docs`/the fix index; not touched by
  this unit.

### Deliverables

- Updated `packages/agentic-workflow-schema/src/index.ts` — both v1 contract
  surfaces, structural + plan-bound validators, verdict derivation,
  canonical digest core, freshness predicate, published vectors,
  package-root exports.
- New `packages/agentic-workflow-schema/verification-plan.schema.json` +
  `verification-receipt.schema.json`.
- New `test/verification-plan.test.mjs`,
  `test/verification-receipt.test.mjs`, `test/verification-core.test.mjs`,
  `test/verification-scenarios.test.mjs`, fixtures.
- Updated `README.md` + `README.es.md` — synchronized
  staged-verification section.
- Updated `package.json` — version `3.4.0`, exports/files grown.
- Updated `docs/features/ROADMAP.md` — row 26 registered (`planned`).
- This SPEC.md + the M/L planning artifact set — frozen planning artifacts.

### Post-merge next feature

No open issue follows #139 (it is the only open proposal at planning time).
The natural successor is the deferred consumer-side wiring
(`execute-phase`/`review-change` emitting real verification plans and
receipts) — a new issue when demand lands; until then the package ships as
pure contracts.
