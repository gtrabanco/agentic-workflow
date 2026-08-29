# architecture-notes — 26-staged-verification-contracts

## Layers

- Runtime contract definitions, authoritative validators, semantic core and
  bounds live in `packages/agentic-workflow-schema/src/`.
- Deterministic schema generation/check and benchmark commands remain
  package-local tooling; generated projections ship at package root.
- Pure data contracts + pure functions: no subprocess, shell, Git, forge,
  provider or command execution. The caller owns execution.
- Package README.md + README.es.md document the same public contract.
- No AWL dialect, runner or consumer adapter is introduced by this unit.

## Validation authority

- `validateVerificationPlanV1(value: unknown)` is the sole public plan
  validation entry.
- `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` is
  the sole public receipt validation entry and owns both structural and
  plan-bound semantics.
- Successful validation returns normalized own-property DTOs; inherited values
  never enter canonicalization/digests.
- The former structural receipt validator is internal-only. Types are compile-
  time surfaces, not runtime validators.

## Schema impact

- `verification-plan.schema.json` and `verification-receipt.schema.json` are
  deterministic Draft-07 structural tooling projections from one canonical
  internal verification-contract definition.
- Projections carry explicit non-authoritative metadata and name the package
  validator required for semantic PASS. A generated-artifact check forbids hand
  edits and catches drift.
- Every Draft-07-expressible structural rule is projected, including applicable
  cross-field matrices such as D4. Rules Draft-07 cannot express — canonical
  byte budgets, aggregate timeout sums, order/fail-fast attribution, digests and
  plan↔receipt binding — stay exclusively in the authoritative runtime entries.
- The five existing schema files and pre-feature-26 export meanings remain
  untouched (AD-007 / AC8).

## Usability bounds

- Capacity: 128 commands/results; 64 args per command.
- Strings: ids 128 chars; executable/working-directory/skip reason/evidence
  reference 1024; each arg 4096.
- Payloads: canonical plan 256 KiB; canonical receipt 512 KiB.
- Time: fast command/aggregate 10/15 min; full command/aggregate full-stage
  60/120 min.
- Diagnostics: at most 50 structured stable-code + RFC 6901 JSON Pointer rows,
  no raw untrusted values; a `truncated` flag reports omitted rows.
- Performance: warm 128-command authoritative validation+digest p95 ≤100 ms.

## Binding impact

- Receipts bind content through `planDigest`, `candidateSnapshotDigest`, and
  `acceptanceFingerprint`, plus stage/verdict. The freshness predicate compares
  all dimensions and returns six reachable stale/incomplete codes.
- Feature 25 contracts and Envelope v2 remain unchanged.

## Preflight

- NRS consumed; invariant classification `n/a` — no project invariants declared
  at HEAD (`template/` is scaffold evidence, not a project declaration).
- AD-002 bilingual same-change, AD-004 one PR vs main, and AD-007 strict package
  contracts are preserved.
- Replan approved 2026-08-26: P7–P15 plus replacement ACCEPTANCE v2; no AWL
  issue is created automatically.
