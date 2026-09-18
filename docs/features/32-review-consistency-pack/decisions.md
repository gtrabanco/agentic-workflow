# Decisions — 32-review-consistency-pack

Product-half decisions recorded by `design-feature` (append-only; newest last).

## 2026-09-17 — D32-1: only the *missing* NRS ledger degrades to a substrate notice

- **What**: `workflow-status` stops blocking on an absent
  `docs/workflow/REPOSITORY_STATE.md` and emits a machine-readable, non-blocking
  substrate notice instead. `draft`, `contradicted`, and `resolved` statuses keep
  blocking exactly as today.
- **Why**: the issue's contradiction fix targets the missing-ledger blocker
  specifically ("degrades its missing-ledger *blocker* to a machine-readable
  substrate notice"); NRS is optional by contract
  (`EXECUTION_CONTRACT.md:108-116`). A present-but-unfrozen or contradicted
  ledger is a real integrity problem, not an absent substrate — degrading those
  would silently weaken the NRS contract beyond the issue's scope.
- **Authority**: issue #172 wording + repository evidence E-07/E-08; recorded by
  `design-feature` 2026-09-17.

## 2026-09-17 — D32-2: the severity conversion table is closed over existing scales

- **What**: the canonical conversion table in
  `review-implementation/references/CLASSIFY.md` maps the scales that actually
  exist at implementation time: the ledger scale `high|med|low`, `audit-docs`'
  `high|low`, and (once feature 31 lands) the planning scale
  `info|low|medium|high|critical`. Unknown scales fail closed — a consuming
  skill never converts ad hoc; adding a scale means one table row in the owning
  section.
- **Why**: the issue asserts "finder scale `critical|major|minor` → ledger
  `high|med|low` is already mapped", but no such scale exists anywhere in
  `skills/` or `packages/agentic-workflow-schema/src/` at authoring HEAD
  `4b3a56b` (evidence row E-09). Encoding a phantom row would write unevidenced
  contract text — the exact defect this feature exists to remove. The deviation
  is a strict narrowing: the issue's intent (one conversion authority) is fully
  preserved.
- **Authority**: repository evidence E-03/E-04/E-09; issue #172 as the
  requested outcome. Recorded by `design-feature` 2026-09-17.

## 2026-09-17 — D32-3: GATE-RAN is a durable ledger mark, not a schema contract

- **What**: the gate-run receipt is a fixed-format, append-only text mark
  (`GATE-RAN | HEAD <sha> | <cmds> | exit <code>[ | <additive slots>]`) recorded
  by whoever ran the gate, in a ledger whose home file and single writer are
  fixed by a new `ledger-ownership@1` map row added in the same change. No
  `@gtrabanco/agentic-workflow-schema` type, envelope field, or JSON Schema is
  added.
- **Why**: same ruling as feature 30's REPAIR-RECEIPT (D30-3): durable state
  stays in the existing ledgers; a schema contract would couple a wording-level
  consistency sweep to a package release. The SHA-binding pattern matches
  `review-mark@1`, so freshness discipline is identical.
- **Authority**: issue #172 + its 2026-09-07 amendment; feature 30 precedent.
  Recorded by `design-feature` 2026-09-17.

## 2026-09-17 — D32-4: extensible digest slots from day one

- **What**: GATE-RAN's format treats every field after `HEAD` as additive:
  consumers ignore unknown trailing fields, and a trailing `manifest <sha>` slot
  is reserved from day one. The owning spec carries the one-line rule and the
  discipline test pins it.
- **Why**: the 2026-09-07 amendment on issue #182 (scoped affecting-path
  manifests, feature 35) requires the same mark to gain the scope manifest
  without a format migration; hard-coding `exit` as the final field would force
  exactly that migration.
- **Authority**: issue #172 amendment section; recorded by `design-feature`
  2026-09-17.

## 2026-09-17 — D32-5: execute-phase's NRS clause is regression-only

- **What**: `skills/execute-phase/references/EXECUTION_CONTRACT.md` is not
  re-edited by this feature; it already records NRS as optional ("record
  `n/a: no normalized repository state`; NRS is optional") at authoring HEAD.
  The surface gets a regression check only.
- **Why**: the issue's affected-surfaces list was authored before that clause
  landed; re-editing already-correct text would churn a merged surface with no
  semantic change and re-open review scope for nothing.
- **Authority**: repository evidence E-08; recorded by `design-feature`
  2026-09-17.

## 2026-09-17 — Roadmap row 32 promoted `idea → defined`

- **What**: the roadmap row for feature 32 keeps its number, slug, and
  dependencies; status moves `idea → defined` in the same turn that stamps the
  Product half `designed`.
- **Why**: this skill owns the `idea → defined` transition
  (`design-feature:idea-or-defined-row` in `ledger-ownership@1`); statuses past
  `defined` belong to `plan-feature-scaffold` / `execute-phase`.
- **Authority**: `ledger-ownership@1` roadmap row; recorded by `design-feature`
  2026-09-17.

## Open items for `resolve-repository-state` (not resolved here)

- REPOSITORY_STATE.md F006/F007 are stale versus the current forge and roadmap
  (rows 30–38 done; 31 still `idea`). Evidence row E-19 records the drifted
  rows and the consequence (this design consumes roadmap + forge evidence
  directly). Owner: `resolve-repository-state`.
