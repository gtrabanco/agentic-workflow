# PLAN — 30-repair-receipt-delta-review

Four implementation phases (receipt surface → review surface → durable-mark
surface → qualification). The REPAIR-RECEIPT block, impact-rule classification,
branch table, escalation computation, delta scope, and reproducer handoff are
frozen in `SPEC.md` (`## Engineering half` → `### Design`). Artifact revision
of this plan set: `30-plan-1`.

## P1 — Pin the REPAIR-RECEIPT contract in fold-findings

Layer: docs · write the discipline pins red-first, then give `fold-findings`
(SKILL.md + FOLD_PROCESS.md + FOLD_POLICY.md) the fixed receipt block, the
impact-rule batch classification, the freeze-batch rule, the empty-batch and
failed-gate branches, the four-branch closing block, and the
materialize-reproducer rule; bump 1.3.0 → 1.4.0.

## P2 — Make delta mode the default post-fold re-review

Layer: docs · write the delta/escalation/cap pins red-first, then extend
`skills/review-change/references/REVIEW_PROCESS.md` step 1 with the
delta-mode default, the width/size escalation triggers, the genuinely-new
dedupe extension, and the delta-cap sentence; bump 3.3.0 → 3.4.0. Existing pin
3 keeps its phrase verbatim.

## P3 — Bind recheck-cell consumption in the durable mark contract

Layer: docs · add the consumption sentence (fold-findings reads the
`finding-mark@1` `recheck` cell to materialize; never re-derives) to
`skills/pre-execution-review/references/LEDGERS.md` §"The durable finding
mark"; pin it; bump 2.1.0 → 2.2.0; keep the ledger-ownership block and the
template copies untouched.

## P4 — Qualify the delta-review unit

Layer: hardening · synchronize the bilingual workflow narrative + MIGRATION
note, re-measure context budgets, run every frozen validator (root suites,
schema + audit-pr regressions, Pi bundle parity), close out the planning docs
truthfully, open the one PR (`Closes #170`), and flip the roadmap row.
