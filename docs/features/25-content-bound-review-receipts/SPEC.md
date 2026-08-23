# 25 — content-bound-review-receipts

> Feature specification. This is the feature document read at the start of the
> workflow. The Product half is complete; `plan-feature-scaffold` owns the
> Engineering half.

## Goal

Publish strict, content-bound `CandidateSnapshot v1` and `ReviewReceipt v1`
contracts from the schema package so a review proves exactly which diff and
acceptance boundary it evaluated — base tree, candidate tree, ordered path
manifest, acceptance fingerprint, and review policy version — not only which
candidate commit was current at the time. Stale or incomplete review evidence
becomes mechanically detectable instead of silently trusted. Origin: issue
[#138](https://github.com/gtrabanco/agentic-workflow/issues/138).

## Branch

`feat/25-content-bound-review-receipts`

## Size

`M` — two new versioned wire contracts (types, strict validators, two new JSON
Schema files), a canonical hashing/serialization core with published test
vectors, a freshness predicate, an extensive mandated edge matrix, bilingual
package reference, additive minor release. Five single-layer phases; no split
trigger applies (≤ ~5 phases, one layer per phase, zero unresolved design
decisions).

## Dependencies

- Hard: none. The issue declares no dependency; it may run in parallel with
  features 23 (#136) and 24 (#137) — **both merged** (`f690d92`, PR #143 at
  HEAD).
- Soft: feature `24-workflow-transition-decider` anticipates this unit as the
  tightening of its receipt-attestation chain (its D5); no contract change is
  required there. Feature `23-workflow-skill-capability-profiles` profiles are
  untouched.

---

## Product half

### Context

The schema package (`@gtrabanco/agentic-workflow-schema` v3.2.0) already ships
`Envelope v2`, `SkillOutcome v1`, `WorkflowSnapshot v1`, capability profiles,
and the `decideWorkflowAction()` transition decider. Its merge and review gates
attest evidence by *receipt freshness at a source revision* — feature 24's D5
explicitly left deeper binding to "issues #138/#139". Today a candidate commit
SHA alone does not fully identify what a review evaluated: the base branch can
advance, rename detection can differ, the acceptance contract can change, or a
manifest can omit large/binary paths while the candidate SHA stays unchanged.
Content-bound receipts close that gap in the strongest part of the workflow:
independent review that can be reproduced and audited.

### Business goals

- Make stale or incomplete review evidence **mechanically detectable** before
  any consumer acts on it.
- Strengthen independent review reproducibility: a receipt proves the exact
  content boundary it evaluated.
- Keep the package portable data contracts only — no execution, storage, or
  provider coupling.

### Product-surface considerations

- i18n: the package reference is updated in English and Spanish in the same
  change (NRS AD-002).
- Accessibility: n/a, no user interface.
- SEO: n/a, no public web route.
- Pricing: n/a, no commercial surface.
- UI design reference: n/a, the only surface is package API + JSON Schemas.

### Scope

#### In scope

- **S1:** Strict TypeScript types, validators, JSON Schemas, and exported
  constants for `agentic-workflow/candidate-snapshot@1` and
  `agentic-workflow/review-receipt@1`, both rejecting undeclared fields.
- **S2:** `GitObjectId` defined exactly as `{algorithm: "sha1", hex: string
  matching /^[a-f0-9]{40}$/} | {algorithm: "sha256", hex: string matching
  /^[a-f0-9]{64}$/}`; mixed algorithms inside one candidate snapshot are
  invalid.
- **S3:** `CandidateSnapshot v1` required fields: `objectFormat:
  "sha1" | "sha256"`; `baseCommit`, `candidateCommit`, `baseTree`,
  `candidateTree` as full `GitObjectId` values of that format;
  `acceptanceFingerprint` as a lowercase SHA-256 digest of the ordered
  authoritative acceptance inputs; `changedPaths` as a path-byte-ordered
  manifest.
- **S4:** Each manifest entry carries `path`, `status`, `oldPath`, `mode`,
  `objectSha`, `sizeBytes`, `binary` — using `null` where not applicable;
  `mode ∈ 100644 | 100755 | 120000 | 160000 | null`; `objectSha` is a full
  `GitObjectId` for the candidate-side object and `null` for deletions;
  `sizeBytes` and `binary` are `null` for gitlinks; `status ∈ added |
  modified | deleted | renamed | copied | type-changed`.
- **S5:** `ReviewReceipt v1` required fields: stable receipt id and
  candidate-snapshot digest; review kind `implementation | security |
  verification | debt | design | accessibility | brand | performance | seo |
  audit`; verdict `pass | fail`; structured findings with stable id, severity,
  summary, path/line evidence when applicable, and evidence references;
  reviewer/session identity as opaque strings, timestamps, and parser/source
  diagnostics; the exact review policy/profile version used.
- **S6:** Canonical hashing/serialization rules — UTF-8, path ordering
  (ascending unsigned UTF-8 byte order), null handling, duplicate-path
  rejection — plus published digest test vectors.
- **S7:** A pure freshness predicate comparing a receipt with the current
  candidate snapshot and acceptance fingerprint, returning a stable reason
  code for every stale dimension.
- **S8:** Coverage for base advancement, candidate mutation, acceptance
  mutation, full revert, rename/copy, symlink/submodule mode, binary content,
  large files (> 4 MiB), > 32 changed paths, and empty diffs.
- **S9:** English and Spanish package documentation stating that schema
  validity is not review correctness and that current content binding is
  mandatory; additive minor release `3.2.0 → 3.3.0`.

#### Out of scope / non-goals

- No Git, filesystem, forge, model, or review execution in the package — the
  caller produces snapshots and receipts; the package only validates,
  canonicalizes, digests, and compares them.
- No storage engine or migration for a consumer.
- No provider-specific reviewer names or pricing data.
- No claim that a receipt verdict is correct merely because its schema is
  valid — documentation states this explicitly.
- No automatic acceptance of a partial manifest — large/binary files stay
  represented; consumers may *review* them through evidence references but may
  never silently omit them.
- No changes to `Envelope v2`, `SkillOutcome v1`, `WorkflowSnapshot v1`, or
  their three shipped JSON Schema files (separately justified versioned
  contract changes would be required).
- No coercion of legacy SHA-only receipts into content-bound receipts without
  reconstructing every required fact — dual reads are the consumer's concern.
- No UI, network API, ACL, or persistence surface: n/a by design.

### Capability closure

The repository has no project-level `docs/CAPABILITIES.md`. Derived inventory
for this feature: public package API; existing machine contracts; bilingual
package documentation; package distribution. Roles: `headless consumer` and
`package maintainer`.

**1. Entity closure — the two v1 contracts**

- [x] Create — UI: n/a, no UI surface · API: package-authored types and
  validators; consumers construct snapshots/receipts in their own memory ·
  test: construction-shaped fixtures in the validation suites.
- [x] Read/list — UI: n/a · API: package-root exports of both contract type
  sets, validators, canonical-digest functions, freshness predicate, published
  vectors, constants (`CONTRACT_IDS`, severity/kind/status/mode vocabularies)
  · test: public-entry import suites.
- [x] Update — n/a at runtime; package maintainers evolve the contracts only
  through a reviewed package change and a new version (v1 is frozen) · test:
  strict validators reject mutated/undeclared fields.
- [x] Delete — n/a: consumers cannot remove exported contracts · test:
  regression suite pins the export surface.
- [x] State transitions — the only state is `fresh ↔ stale`, computed purely
  by the freshness predicate from compared content, never stored · test: the
  staleness matrix.

**Capabilities and role matrix**

- [x] Validate and bind a candidate snapshot / review receipt (call the
  validators, digest, compare) — visible entry point: package-root exports ·
  `headless consumer`: allowed · `package maintainer`: allowed.
- [x] Extend or reinterpret the v1 shapes/vocabularies — visible entry point:
  package source plus pull-request review · `headless consumer`: denied ·
  `package maintainer`: allowed (as a new versioned contract, never in place).
- [x] Claim a receipt is current without content binding, or omit large/binary
  manifest entries — visible entry point: n/a, validators make both states
  unrepresentable · `headless consumer`: denied · `package maintainer`: denied.

**2. Integration closure — derived inventory**

- [x] Public package API — additive exports only; existing export meanings
  unchanged · test: full regression suite.
- [x] Existing machine contracts — `Envelope v2`, `SkillOutcome v1`,
  `WorkflowSnapshot v1` types and their three JSON Schema files unchanged ·
  test: existing suites plus diff-clean check on shipped schema files.
- [x] Bilingual package documentation — `README.md` + `README.es.md` gain the
  synchronized contracts section (validity ≠ correctness; mandatory content
  binding) · test: grep anchors in both files.
- [x] Package distribution — minor release `3.3.0`; artifact set grows by the
  two new schema files · test: `npm pack --dry-run`.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Both validators reject undeclared/extra fields | in-scope | S1; AC1, AC2 |
| 2 | Mixed sha1/sha256 object ids inside one snapshot are invalid | in-scope | S2; AC1 |
| 3 | Manifest order is ascending unsigned UTF-8 byte order; duplicates rejected | in-scope | S6; AC1, AC3 |
| 4 | Renames/copies carry both `path` and `oldPath`; other statuses carry `oldPath: null` | in-scope | S4; AC1, AC5 |
| 5 | Deletions have `objectSha: null`; gitlinks have `sizeBytes`/`binary: null` | in-scope | S4; AC1 |
| 6 | An empty diff is valid only when base and candidate trees match; it never reuses an older receipt | in-scope | S8; AC4 |
| 7 | Every stale dimension has one stable reason code | in-scope | S7; AC4 |
| 8 | Large (> 4 MiB) and binary files remain represented in the manifest | in-scope | S8; AC5 |
| 9 | Digest vectors are published and pass in TypeScript and JSON-Schema paths | in-scope | S6; AC3 |
| 10 | Documentation ships EN + ES in the same change, disclaiming validity-as-correctness | in-scope | S9; AC6 |
| 11 | The package computes snapshots from Git or executes reviews | out-of-scope | Execution non-goal |
| 12 | Legacy SHA-only receipts auto-upgrade to v1 | out-of-scope | Compatibility non-goal |

### Acceptance criteria

- [ ] **AC1 — command-verified:** `cd packages/agentic-workflow-schema && npm
  test` exits 0 with a candidate-snapshot suite proving: undeclared-field
  rejection, exact `GitObjectId` format enforcement, mixed-algorithm rejection,
  path-byte ordering, duplicate/NUL/absolute/traversing-path rejection,
  unsupported-status rejection, abbreviated-id rejection, negative-size
  rejection, mode enum enforcement, rename/copy `oldPath` requirement,
  deletion `objectSha: null`, gitlink `sizeBytes`/`binary: null`.
- [ ] **AC2 — command-verified:** `npm test` exits 0 with a review-receipt
  suite proving: undeclared-field rejection, closed kind vocabulary (10
  values), verdict `pass | fail`, finding structure (stable id, severity,
  summary, optional path/line evidence, evidence references), opaque
  reviewer/session identity, timestamp format, diagnostics, policy/profile
  version presence.
- [ ] **AC3 — command-verified:** published canonical vectors exist and pass —
  the TypeScript canonicalization/digest path and the JSON-Schema validation
  path agree on every vector; repeated calls are deeply equal
  (determinism).
- [ ] **AC4 — command-verified:** the freshness predicate returns exactly one
  stable reason code per stale dimension across the mandated matrix: base
  advancement (`stale-base-tree`), candidate mutation (`stale-candidate-tree`),
  manifest mismatch (`stale-manifest`), acceptance mutation
  (`stale-acceptance-fingerprint`), review-policy mutation
  (`stale-review-policy`), full revert, and empty-diff handling — `npm test`
  exits 0.
- [ ] **AC5 — command-verified:** the scale/content matrix passes — > 32
  changed paths, a > 4 MiB file, binary content, rename/copy/type-changed —
  each represented in the manifest and surviving validate → digest → compare;
  `npm test` exits 0.
- [ ] **AC6 — command-verified:** `grep` finds the contracts section, the
  "schema validity ≠ review correctness" statement, and the mandatory-content-
  binding statement in both `packages/agentic-workflow-schema/README.md` and
  `README.es.md`.
- [ ] **AC7 — command-verified:** existing verification passes unchanged —
  `npm test` exit 0 including all pre-existing suites; `node
  scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0;
  `grep '"version"' packages/agentic-workflow-schema/package.json` → `3.3.0`;
  `npm pack --dry-run` lists the grown public artifact set (+ the two new
  schema files).
- [ ] **AC8 — read-verified:** `git diff` clean on
  `envelope.schema.json`, `skill-outcome.schema.json`,
  `workflow-snapshot.schema.json`, and all pre-existing contract types — no
  meaning of any existing export changed.

### Tooling

n/a: the existing TypeScript compiler and the schema-package test scripts are
authoritative; no external skill or MCP is required.

### Product decisions

- **D1 — Freshness reason codes (closed set).** `stale-base-tree |
  stale-candidate-tree | stale-manifest | stale-acceptance-fingerprint |
  stale-review-policy`. The issue requires "a stable reason code for every
  stale dimension"; these five are exactly its state/error dimensions (base
  tree, candidate tree, ordered path manifest, acceptance fingerprint, review
  policy/profile). A fresh comparison returns `{fresh: true}`. Locked by
  tests; changing the set is a reviewed, versioned contract change.
- **D2 — Acceptance fingerprint inputs.** "Ordered authoritative acceptance
  inputs" = an ordered array of `{id, blobSha256}` entries (unit id +
  lowercase SHA-256 of the frozen acceptance boundary content — matching this
  repo's blob-bound ACCEPTANCE practice); `acceptanceFingerprint` = lowercase
  SHA-256 over their canonical serialization. Producers choose the entries;
  the fingerprint binds whatever was declared, in order.
- **D3 — Severity vocabulary.** Findings carry severity `info | low | medium |
  high | critical` (closed). The issue names severity without fixing values;
  this set matches the repo's fix-ledger usage (feature 17).
- **D4 — Canonical form.** Canonical serialization = UTF-8 JSON, fixed key
  order (declaration order), insignificant whitespace removed, `null`s
  preserved for inapplicable fields, `changedPaths` in ascending unsigned byte
  order, findings ordered by ascending byte order of their stable ids. Digests
  are lowercase-hex SHA-256 over the canonical bytes. Locked by published
  vectors.
- **D5 — Receipt identity opacity.** Receipt id, reviewer identity, session
  id, and policy/profile version are opaque non-empty strings — the package
  never interprets their internals (no provider-specific reviewer names).
- **D6 — Size `M`, five phases, no split.** Two contracts + hashing core +
  edge matrix exceed one commit/half-day (not XS/S), yet cut cleanly into five
  single-layer phases ≤ ~5 — the split trigger does not fire.
- **D7 — Traceability.** Origin: issue #138. The implementation PR must include
  `Closes #138`.

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Consumer-side wiring (`review-change`/`audit-pr` emitting real snapshots/receipts) | Issue #139 (staged, candidate-bound verification contracts) owns the producer side; the package must exist first | After #139 lands; next driver-integration unit |
| Dual-read migration helper for legacy SHA-only receipts | Compatibility section forbids silent coercion; consumers migrate with their own dual reads until demand proves a shared helper | First consumer requesting it (new issue) |

### Spec-lint (mechanical — product boxes)

- [x] No template placeholders remain in the Product half.
- [x] Out of scope / non-goals contains concrete bullets.
- [x] Every entity, capability, role, and state row is filled or has an
  explicit `n/a` reason.
- [x] Integration closure covers every subsystem in the recorded derived
  inventory.
- [x] Every capability lists both roles as explicitly allowed or denied.
- [x] Expectation sweep contains twelve resolved rows with pointers.
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
- Implement one canonical content-binding core: serialization, SHA-256
  digests, published vectors, and the pure freshness predicate.
- Prove the contracts with red-first validation suites plus the mandated
  edge-condition matrix.
- Ship the bilingual reference and the `3.3.0` additive minor release.

### Architecture impact

Preflight: NRS consumed · invariant classification: `n/a` (no project
invariants declared — `docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not
exist at HEAD; repository inspection supersedes NRS F013). Applicable NRS
accepted decisions preserved: AD-002 (bilingual package docs in the same
change), AD-004 (one PR per unit against `main`), AD-007 (schema-package
strict contracts — `npm test` green, JSON schemas match TS types, version bump
for any public API change).

- **Schema/package boundary:** all additions live inside
  `packages/agentic-workflow-schema/` (single-file `src/index.ts` precedent);
  the two NEW `*.schema.json` files join the shipped artifact set; the three
  existing schema files and existing types are untouched.
- **Layering:** pure data contracts + pure functions — no I/O, no Git, no
  forge; producers own capture.
- **NRS status:** frozen → consumed; W003 records this very issue as planned
  work. No contradiction affects this plan.

### Design

Reproduces the issue's rules verbatim where marked; residual mechanical gaps
are closed by D1–D5 and locked by tests.

#### CandidateSnapshot v1 (`agentic-workflow/candidate-snapshot@1`)

```ts
export const CANDIDATE_SNAPSHOT_CONTRACT_ID = "agentic-workflow/candidate-snapshot@1";

export type GitObjectFormat = "sha1" | "sha256";
// Exactly: {algorithm:"sha1", hex: /^[a-f0-9]{40}$/} | {algorithm:"sha256", hex: /^[a-f0-9]{64}$/}
export interface GitObjectId { readonly algorithm: GitObjectFormat; readonly hex: string }

export type ChangeStatus = "added" | "modified" | "deleted" | "renamed" | "copied" | "type-changed";
export type GitMode = "100644" | "100755" | "120000" | "160000"; // serialized; null when not applicable

export interface ManifestEntryV1 {
  readonly path: string;            // relative, no NUL, no leading "/", no ".." segment
  readonly status: ChangeStatus;
  readonly oldPath: string | null;  // REQUIRED (non-null) iff status ∈ renamed|copied; else exactly null
  readonly mode: GitMode | null;    // null when not applicable
  readonly objectSha: GitObjectId | null; // full id of the CANDIDATE-side object; null for deletions
  readonly sizeBytes: number | null;      // ≥ 0; null for gitlinks (160000)
  readonly binary: boolean | null;        // null for gitlinks
}

export interface CandidateSnapshotV1 {
  readonly contract: typeof CANDIDATE_SNAPSHOT_CONTRACT_ID;
  readonly objectFormat: GitObjectFormat;   // uniform across EVERY GitObjectId below
  readonly baseCommit: GitObjectId;
  readonly candidateCommit: GitObjectId;
  readonly baseTree: GitObjectId;
  readonly candidateTree: GitObjectId;
  readonly acceptanceFingerprint: string;   // lowercase /^[a-f0-9]{64}$/
  readonly changedPaths: readonly ManifestEntryV1[]; // ascending unsigned UTF-8 byte order; unique paths
}
```

Validation rules (all failing → rejected): unknown top-level/entry fields;
`contract` mismatch; abbreviated ids (wrong hex length/case); algorithms
mixed within one snapshot (every id's algorithm MUST equal `objectFormat`);
paths violating byte-order, duplicated, containing NUL, absolute, or a `..`
segment; unsupported status; renamed/copied without `oldPath`; non-renamed/
copied with `oldPath !== null`; deletion with `objectSha !== null`; gitlink
with `sizeBytes !== null || binary !== null`; negative `sizeBytes`;
`candidateTree` deep-equal to `baseTree` with `changedPaths.length > 0`, and
an empty `changedPaths` accepted ONLY then (empty diff validity rule).

#### ReviewReceipt v1 (`agentic-workflow/review-receipt@1`)

```ts
export const REVIEW_RECEIPT_CONTRACT_ID = "agentic-workflow/review-receipt@1";
export const REVIEW_KINDS = ["implementation","security","verification","debt",
  "design","accessibility","brand","performance","seo","audit"] as const;
export const FINDING_SEVERITIES = ["info","low","medium","high","critical"] as const;

export interface FindingEvidenceV1 { readonly path: string; readonly line?: number } // line ≥ 1 when present
export interface FindingV1 {
  readonly id: string;                    // stable within the receipt; unique; byte-ordered
  readonly severity: (typeof FINDING_SEVERITIES)[number];
  readonly summary: string;               // non-empty
  readonly evidence?: FindingEvidenceV1;  // when applicable
  readonly refs: readonly string[];       // evidence references (≥ 0)
}
export interface ReviewReceiptV1 {
  readonly contract: typeof REVIEW_RECEIPT_CONTRACT_ID;
  readonly id: string;                          // stable, opaque, non-empty (D5)
  readonly candidateSnapshotDigest: string;     // lowercase /^[a-f0-9]{64}$/, digest OF the snapshot reviewed
  readonly kind: (typeof REVIEW_KINDS)[number];
  readonly verdict: "pass" | "fail";
  readonly findings: readonly FindingV1[];
  readonly reviewer: string;                    // opaque (D5)
  readonly sessionId: string;                   // opaque (D5)
  readonly startedAt: string; readonly finishedAt: string; // ISO-8601 UTC; finishedAt ≥ startedAt
  readonly diagnostics: readonly string[];      // parser/source diagnostics
  readonly policyVersion: string;               // exact review policy/profile version used (D5)
}
```

Validation rules: unknown fields anywhere; closed vocabularies; digest/id/
timestamp formats; unique finding ids; `line ≥ 1` when present; empty-string
identities rejected.

#### Canonical content-binding core

- `canonicalize(value)` — D4 rules; input must first pass its validator.
- `digestCandidateSnapshot(snapshot)` → lowercase SHA-256 hex of the canonical
  bytes (the value a receipt's `candidateSnapshotDigest` carries).
- `computeAcceptanceFingerprint(inputs: readonly {id; blobSha256}[])` → D2.
- `compareReceiptToCurrentSnapshot(receipt, snapshot, acceptanceInputs,
  policyVersion)` → `{fresh: true}` | `{fresh: false, reasonCode: …}` —
  compares, in order, baseTree, candidateTree, changedPaths (canonical
  equality), acceptanceFingerprint, policyVersion → D1 codes; everything equal
  AND snapshot digest === receipt.candidateSnapshotDigest → fresh. Pure;
  deterministic; throws nothing (invalid inputs are a validator concern).

JSON Schemas mirror both types 1:1 with `additionalProperties: false` at every
object level; a parity test asserts validator and schema accept/reject the
same fixture set.

### Decisions to confirm

- **D1–D7** as recorded in Product decisions (reason-code set, fingerprint
  inputs, severity vocabulary, canonical form, identity opacity, sizing,
  traceability). These close the issue's residual mechanical gaps; changing
  any later is a reviewed, versioned package change.

### Testing requirements

- Layer: package unit tests (`node --test`), red-first per phase — each
  contract's suite lands before its implementation tasks complete.
- Fixtures under `test/fixtures/` (vectors, oversized/binary placeholders
  generated deterministically at test time — no multi-MiB blobs committed).
- Regression: every pre-existing suite stays green (machine-contract,
  capabilities, release-contract, index, workflow-decision*).
- Property: determinism via deep-equality on repeated canonicalize/digest/
  compare calls.

### Dev scenarios

No dev harness applies (pure contracts); every scenario is driven through an
existing test fixture.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `snapshot:empty-diff-mismatch` | empty/zero state violated — empty manifest with differing trees | fixture: `changedPaths: []` + distinct trees → rejected |
| `snapshot:oversized-paths` | mass-change limit (> 32 paths) | generated fixture: 33+ entries → valid, ordered, digestable |
| `snapshot:path-injection` | invalid input — NUL/absolute/`..` path | fixture matrix → rejected |
| `snapshot:mixed-formats` | inconsistent input — sha1 id inside sha256 snapshot | fixture → rejected |
| `receipt:policy-drift` | dependency/state drift — different policy version | predicate → `stale-review-policy` |
| `receipt:concurrent-race` | concurrent/duplicate action analog — candidate advanced after review | predicate → `stale-candidate-tree` |
| `receipt:full-revert` | degraded state — candidate reverted to base | predicate → stale (manifest/tree dimension) |
| `receipt:large-binary` | threshold content — > 4 MiB + binary files | fixtures represented, never omitted |
| outage/timeout | n/a — pure functions, no external dependencies | — |
| permission denied | n/a — no ACL surface; role matrix is compile-time | — |

### Phases

`execute-phase 25` runs all remaining phases by default; an explicit `P<n>`
runs one atomic phase. This section is the execution ledger.

### P1 — Deliver the CandidateSnapshot v1 contract

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new candidate-snapshot suites.

- [ ] Add `test/candidate-snapshot.test.mjs` FIRST, exercising every rule
  below through the public entry point (red before the validator exists).
- [ ] Define and export `GitObjectId`, `GitObjectFormat`, `ChangeStatus`,
  `GitMode`, and the contract-id constant with the exact shapes from Design.
- [ ] Define and export `ManifestEntryV1` + `CandidateSnapshotV1` with the
  null-applicability matrix (oldPath/objectSha/sizeBytes/binary).
- [ ] Implement `validateCandidateSnapshotV1`: structural rejection
  (undeclared fields, contract id, trees-match empty-diff rule, rename/copy
  oldPath requirement, deletion/gitlink nullability).
- [ ] Implement path-byte validation: ascending unsigned-byte order,
  duplicate rejection, NUL/absolute/`..`-segment rejection.
- [ ] Implement id/size validation: abbreviated ids, mixed algorithms vs
  `objectFormat`, negative sizes, mode enum.
- [ ] Add `candidate-snapshot.schema.json` (additionalProperties false at
  every level) + parity test that schema and validator accept/reject the same
  fixtures.
- [ ] Export the snapshot surface from `src/index.ts` and record the grown
  artifact set expectation for P3's pack check.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P1:schema:8:Deliver the CandidateSnapshot v1 contract

### P2 — Deliver the ReviewReceipt v1 contract

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new review-receipt suites.

- [ ] Add `test/review-receipt.test.mjs` FIRST, exercising every rule below
  through the public entry point (red before the validator exists).
- [ ] Define and export `REVIEW_KINDS` (10 values), `FINDING_SEVERITIES`
  (5 values), the contract-id constant, and `FindingV1` /
  `FindingEvidenceV1` with the exact shapes from Design.
- [ ] Define and export `ReviewReceiptV1`: stable id, candidate-snapshot
  digest, kind, verdict, findings, opaque reviewer/session identities,
  ISO-8601 UTC timestamps, diagnostics, policyVersion.
- [ ] Implement `validateReviewReceiptV1`: undeclared-field rejection, closed
  vocabularies, digest/timestamp/id formats, unique finding ids, `line ≥ 1`.
- [ ] Add `review-receipt.schema.json` (additionalProperties false at every
  level) + parity test against the validator on the shared fixture set.
- [ ] Export the receipt surface from `src/index.ts`.
- [ ] Assert the full suite (P1 + P2) is green together — both contracts
  coexist without export collisions.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P2:schema:7:Deliver the ReviewReceipt v1 contract

### P3 — Implement the canonical content-binding core

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 with vector, determinism, and freshness suites green; `grep '"version"'
packages/agentic-workflow-schema/package.json` → `3.3.0`.

- [ ] Implement `canonicalize` per D4 (UTF-8, declaration-order keys, nulls
  preserved, byte-ordered `changedPaths`, findings ordered by id) + unit
  tests.
- [ ] Implement `digestCandidateSnapshot` and `computeAcceptanceFingerprint`
  (lowercase SHA-256 over canonical bytes / ordered `{id, blobSha256}`
  entries) + unit tests.
- [ ] Implement `compareReceiptToCurrentSnapshot` returning `{fresh: true}` or
  exactly one D1 reason code, in the fixed comparison order + unit tests.
- [ ] Publish frozen canonical vectors (`CANONICAL_VECTORS` export + fixtures)
  with expected digests for both contracts.
- [ ] Add vector-agreement tests: TypeScript path, JSON-Schema validation
  path, and published digests agree; repeated calls are deeply equal.
- [ ] Add the synchronized English section to `README.md`: both contracts,
  canonicalization, freshness codes, "schema validity ≠ review correctness",
  mandatory content binding.
- [ ] Add the synchronized Spanish section to `README.es.md` carrying the same
  statements and examples.
- [ ] Bump the package version `3.2.0` → `3.3.0` (minor, additive) and verify
  `npm pack --dry-run` lists the grown artifact set (both new schema files).

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P3:schema:8:Implement the canonical content-binding core

### P4 — Cover the edge-condition matrix

Layer: hardening. Done-when: `cd packages/agentic-workflow-schema && npm test`
→ exit 0 with the edge-matrix suites green.

- [ ] Add the > 32 changed-paths fixture end-to-end: validate → canonicalize →
  digest → freshness-compare all pass.
- [ ] Add the > 4 MiB file fixture (generated at test time): represented with
  true `sizeBytes`, never omitted.
- [ ] Add the binary-content fixture: `binary: true`, reviewable via evidence
  references, still present in the manifest.
- [ ] Add renamed + copied + type-changed fixtures: `oldPath` rules enforced
  in both directions (required vs forbidden).
- [ ] Add base-advancement + candidate-mutation cases asserting
  `stale-base-tree` / `stale-candidate-tree`.
- [ ] Add acceptance-mutation + policy-version-mutation cases asserting
  `stale-acceptance-fingerprint` / `stale-review-policy`.
- [ ] Add full-revert + symlink/submodule-mode cases and the empty-diff rule:
  valid only when trees match; an older receipt is never fresh for a new
  empty diff.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P4:hardening:7:Cover the edge-condition matrix

### P5 — Hardening & PR

Layer: close-out. Done-when: every project gate is green, the PR is open with
`Closes #138`, and the roadmap row reads `done · [#<pr>](<pr-url>)`.

- [ ] Re-run the project's full verification gate — `cd
  packages/agentic-workflow-schema && npm test` → exit 0; `node
  scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push` — branch pushed, PR branch remote-current
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
  Markdown file, real backticks, never inline `--body`/heredoc that leaves
  `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes
  `Closes #138`
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

The package ships as an additive minor release (`3.2.0` → `3.3.0`); no
migration, flag, or config change; the artifact set grows by two schema files.
Rollback: revert the PR to restore v3.2.0.

### Open questions / risks

- **Risk — canonical choices are v1 contract.** Key order, null rendering,
  fingerprint input shape, severity set, and reason-code set (D1–D4) are
  choices within the issue's constraints; they are locked by published vectors
  and tests. Accepted.
- **Risk — rename detection stays heuristic in Git.** The v1 contract binds
  the manifest actually reviewed and never recomputes or claims one universal
  rename result (issue's own resolution). Accepted.
- **Inherited — NRS F023/F024 (stale SKILLS.md counts, deleted ledger
  history):** RESOLVED elsewhere; not touched by this unit.

### Deliverables

- Updated `packages/agentic-workflow-schema/src/index.ts` — both v1 contract
  surfaces, validators, canonical core, freshness predicate, published
  vectors, package-root exports.
- New `packages/agentic-workflow-schema/candidate-snapshot.schema.json` +
  `review-receipt.schema.json`.
- New `test/candidate-snapshot.test.mjs`, `test/review-receipt.test.mjs`,
  edge-matrix suites, fixtures.
- Updated `README.md` + `README.es.md` — synchronized contracts section.
- Updated `package.json` — version `3.3.0`, exports/files grown.
- Updated `docs/features/ROADMAP.md` — row 25 registered (`planned`).
- This SPEC.md + the M/L planning artifact set — frozen planning artifacts.

### Post-merge next feature

Issue [#139](https://github.com/gtrabanco/agentic-workflow/issues/139) —
staged, candidate-bound verification contracts: the natural next unit; it
consumes these receipts on the producer side.
