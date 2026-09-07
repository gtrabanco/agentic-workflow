# Planning obligations — 30-repair-receipt-delta-review

One row per phase slice of each acceptance criterion (AC-01…AC-11) from the
frozen `ACCEPTANCE.md`, plus O12/O14 for the loop-termination invariant (IS-10)
that no single AC names alone. Row shape and column order per
`pre-execution-review/references/LEDGERS.md` §2. Status vocabulary:
`planned | in-progress | verified | n/a | deferred` — every row starts
`planned`; no row is `deferred` (no obligation is exported to a follow-up
issue).

Repair note (2026-09-07, artifact revision `30-plan-2`): the review receipt
`rp-30-20260907-001` finding P30-1 showed O8 and O12 each naming two phases,
violating the one-phase-one-task row contract. Both rows were split into
one-phase rows — O8 → O8 (P1, FOLD_POLICY pin) + O13 (P3, LEDGERS sentence);
O12 → O12 (P2, delta pins) + O14 (P4, qualification). Ids stay stable; the
split-off halves got the next free ids (O13/O14), so every existing reference
to O8/O12 keeps resolving.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC-01 | REPAIR-RECEIPT block, field list, empty-batch, failed-gate, and frozen-batch branches pinned verbatim in `skills/fold-findings/SKILL.md` + `references/FOLD_PROCESS.md` | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; new pin sections assert the fixed block and branches | planned |
| O2 | AC-02 | batch-class vocabulary references only `review-implementation`'s closed class set | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `grep -c "replan-in-unit" skills/review-implementation/references/CLASSIFY.md` ≥ 1 (before and after) + discipline suite | grep count line + suite exit 0 | planned |
| O3 | AC-03 | closing branches `RE-REVIEW-REQUIRED (delta)` / `RE-REVIEW-OPTIONAL` / `RE-REVIEW-SKIPPED` + literal no-decision→re-review default pinned in the SKILL closing-block spec, **plus the branch-selection decision inputs** (finding P30-2): the docs-only file-set test (E-D3), the frozen-severity-`high` override, and the SKIPPED-requires-prior-consumer-decision rule (E-D2) | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; branch pins + branch-selection decision-input pins present | planned |
| O4 | AC-04 | freeze-batch: a replan-class member folds nothing (no `folded: yes`, no commit); receipt records route + retained ids; no new ledger ownership | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs` | all suites exit 0 | planned |
| O5 | AC-05 | delta-mode default in `REVIEW_PROCESS.md`: re-verify folded rows at cited locations, fold diff only, gate green + exact `ACCEPTANCE.md` blob precondition, genuinely-new dedupe wording; existing pin 3 phrase survives | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; delta pins + unchanged pin 3 | planned |
| O6 | AC-06 | escalation triggers (width: file outside cited union or changed line >50 from cited; size: >200 lines or >15 files) with state-trigger-and-numbers requirement | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; escalation pins with observed-number requirement | planned |
| O7 | AC-07 | cap counts delta cycles from the unchanged source (`review-mark@1` marks + forge receipts); third-cycle-user-only line survives verbatim | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; cap-semantics pin | planned |
| O8 | AC-08 | `FOLD_POLICY.md` gains the materialize-reproducer rule (recheck cell; never re-derive; `BLOCKED` with missing input) | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; FOLD_POLICY materialize-reproducer pin | planned |
| O9 | AC-09 | health gates: context budgets and normative drift stay green after the three minor bumps | P4 | Qualify the delta-review unit | execute-phase | `node scripts/check-skill-context.mjs`; `node --test scripts/normative-drift.test.mjs` | both exit 0; budgets manifest re-measured | planned |
| O10 | AC-10 | untouched surfaces: `audit-pr` and `packages/agentic-workflow-schema` unchanged; audit-pr-receipt suite + schema suite green (PR-diff scope per decisions.md E-D5) | P4 | Qualify the delta-review unit | execute-phase | `node --test scripts/audit-pr-receipt.test.mjs`; schema `npm test`; `git diff --name-only main...HEAD -- packages/agentic-workflow-schema skills/audit-pr` empty | suite exits 0 + empty diff listing | planned |
| O11 | AC-11 | bilingual sync: `REVIEW_AND_CLASSIFY.md` + `.es.md` gain the delta/receipt narrative in the same change; `MIGRATION.md` gains the additive bump note | P4 | Qualify the delta-review unit | execute-phase | read-verified at PR time: reciprocal switcher links intact, ES narrative present, MIGRATION note present | PR diff shows both files changed in one commit | planned |
| O12 | IS-10 (SPEC) | loop-termination invariant, review side (finding P30-1 split): delta cycles stay inside the two-cycle cap (counted from `review-mark@1` marks + forge receipts) and the SKIPPED/OPTIONAL branches never bypass the receipt's evidence trail | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` | exit 0; delta-cap + receipt-trail pins | planned |
| O13 | AC-08 | `LEDGERS.md` `finding-mark@1` contract shape and single-writer unchanged; the section names `fold-findings` as the `recheck` cell's consumer (materialize-never-rederive) | P3 | Bind recheck-cell consumption in the durable mark contract | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs` | exit 0; consumption pin + unchanged LEDGERS contract pins | planned |
| O14 | IS-10 (SPEC) | loop-termination invariant, consumption side (finding P30-1 split): the manual path and the outer driver consume the same fixed receipt text (IS-10, expectation 13) | P4 | Qualify the delta-review unit | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/normative-drift.test.mjs` | exit 0; one pinned receipt surface, no parallel normative copy | planned |

## Closure

- Every acceptance criterion AC-01…AC-11 maps to obligation rows with exactly
  one phase each: AC-01→O1, AC-02→O2, AC-03→O3, AC-04→O4, AC-05→O5, AC-06→O6,
  AC-07→O7, **AC-08→O8 (P1) + O13 (P3)**, AC-09→O9, AC-10→O10, AC-11→O11;
  **IS-10's invariant is O12 (P2) + O14 (P4)**. No obligation is `deferred` or
  exported.
- No Product-half artifact is edited to produce this ledger.
- One behaviour appears once: the freeze rule is O4 (its receipt fields are part
  of O1's block pin, cited, not duplicated). The O8/O12 splits (repair batch for
  P30-1) cut one behaviour into phase slices, never duplicate it.
