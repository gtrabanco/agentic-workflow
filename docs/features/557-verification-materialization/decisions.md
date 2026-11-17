# Decisions — 557 verification-materialization

## D1 — triage (recorded at promotion, 2026-11-15)

Promoted from issue #564: a valid feature proposal whose hard dependency on the
engineering interview (556/#563) is correct — the materialization consumes the
interview's enforcement answers.

## D2 — the local, unpublished workflow for this repository's own surgery

The unit is applied through the local path (owner's instruction, `## Log` L2): no
`review-change`, no `audit-pr`, no fold cycle and no self-granted gate exception on
this change. The frozen ledgers are the plan, the deterministic gates run always,
and the owner is the external verifier of the handed-over diff. The risk tier the
classifier computes (`high`, PE-016) names the full review pass; the substitution
is recorded here rather than silently skipped, so the evidence a reviewer would
ask for is the diff, the obligation ledger and the gate receipts.

## D3 — the mechanism is the project's, never the workflow's

`materialize apply` refuses a `scaffold` item without a `mechanism` string. The
service never maps a stack to a rule: the project names the mechanism it already
carries, and the workflow records it. That is what keeps the round stack-agnostic
while issue #564's own examples (a dependency-analysis config, a lint rule, a CI
job) stay target-local.

## D4 — the charter slot count moves 21 → 22 with its property intact

`scripts/review-loop-discipline.test.mjs` pins the shipped template's charter-slot
count. Adding the `Evidence driver` slot moves the count to 22; the pinned
property — every charter slot prints, none silently skipped — is unchanged, so
the count follows the template rather than the template following a cap (unit
556's D4 precedent).

## D5 — the audit, not `review-design`, carries the unenforced-boundary finding

`review-design` is scoped to UI/UX surfaces, so an architectural-boundary finding
does not belong there. The typed finding lives in the deterministic checker
(`materialize check`) and `audit-docs` runs it as check 17, which is where a
declaration-only defect is readable today.

## residual-promise@1

```text
residual-promise@1
surface | consumer | date | owner
`packages/agentic-workflow/test/materialize.test.mjs` | unit:docs/features/557-verification-materialization | 2026-11-16 | owner
```
