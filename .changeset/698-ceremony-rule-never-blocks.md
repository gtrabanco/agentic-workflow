---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"fold-findings": minor
"audit-pr": minor
"review-change": minor
"review-implementation": minor
"pre-execution-review": minor
---

feat(698): a ceremony-shaped finding never blocks a completed feature

The findings vocabulary gains `workflow` — the sixth owning stage, the workflow's
own scaffold, gate or carrier — and the findings writer refuses any
`workflow` row that is not `report-only`, so a ceremony defect routes upstream
instead of becoming the project's `BLOCKER · fix-now` row. `CLASSIFY.md` states
its owning-stage hand-off and the advisory the composing skill surfaces.

`fold-findings`' terminal `REPAIR-RECEIPT` prose becomes a runtime:
`repair-receipt emit` derives the typed `fold-findings:repair` marker at HEAD
(delta class `ceremony`/`docs-only`, scope digest, acceptance hash, gate evidence
digest, open `BLOCKER`/`CRITICAL` count) and encodes the route the facts support
(`RE-REVIEW-SKIPPED`/`OPTIONAL`/`REQUIRED`/`REPLAN-ROUTE`/`PRODUCT-ROUTE`) from
the fold's existing branch table; `verify` re-derives every claim. `audit-pr-gate`
consumes it as review currency and clears a gate receipt staled only over
ceremony bookkeeping, while every other gate still decides; `review-receipt
verify` consumes it too. The scope manifest gains the closed
`isCeremonyBookkeeping` matcher (additive — its class and digest are unchanged).

Every verdict now leaves a machine trace: a BLOCKED audit posts its typed
`audit-pr:blocked` receipt, and a non-pass review posts
`review-change:fail`/`needs-decision` with the head, cycle and open-finding
count. Issue #698.
