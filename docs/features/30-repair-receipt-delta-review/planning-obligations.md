# Planning obligations — 30-repair-receipt-delta-review

One row per acceptance criterion (AC-01…AC-11) from the frozen
`ACCEPTANCE.md`, plus O12 for the loop-termination invariant (IS-10) that no
single AC names alone. Row shape and column order per
`pre-execution-review/references/LEDGERS.md` §2. Status vocabulary:
`planned | in-progress | verified | n/a | deferred` — every row starts
`planned`; no row is `deferred` (no obligation is exported to a follow-up
issue).

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC-01 | REPAIR-RECEIPT block, field list, empty-batch, failed-gate, and frozen-batch branches pinned verbatim in `skills/fold-findings/SKILL.md` + `references/FOLD_PROCESS.md` | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; new pin sections assert the fixed block and branches | planned |
| O2 | AC-02 | batch-class vocabulary references only `review-implementation`'s closed class set | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `grep -c "replan-in-unit" skills/review-implementation/references/CLASSIFY.md` ≥ 1 (before and after) + discipline suite | grep count line + suite exit 0 | planned |
| O3 | AC-03 | closing branches `RE-REVIEW-REQUIRED (delta)` / `RE-REVIEW-OPTIONAL` / `RE-REVIEW-SKIPPED` + literal no-decision→re-review default pinned in the SKILL closing-block spec | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; branch pins present | planned |
| O4 | AC-04 | freeze-batch: a replan-class member folds nothing (no `folded: yes`, no commit); receipt records route + retained ids; no new ledger ownership | P1 | Pin the REPAIR-RECEIPT contract in fold-findings | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs` | all suites exit 0 | planned |
| O5 | AC-05 | delta-mode default in `REVIEW_PROCESS.md`: re-verify folded rows at cited locations, fold diff only, gate green + exact `ACCEPTANCE.md` blob precondition, genuinely-new dedupe wording; existing pin 3 phrase survives | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; delta pins + unchanged pin 3 | planned |
| O6 | AC-06 | escalation triggers (width: file outside cited union or changed line >50 from cited; size: >200 lines or >15 files) with state-trigger-and-numbers requirement | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; escalation pins with observed-number requirement | planned |
| O7 | AC-07 | cap counts delta cycles from the unchanged source (`review-mark@1` marks + forge receipts); third-cycle-user-only line survives verbatim | P2 | Make delta mode the default post-fold re-review | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` | exit 0; cap-semantics pin | planned |
| O8 | AC-08 | `FOLD_POLICY.md` gains the materialize-reproducer rule (recheck cell; never re-derive; `BLOCKED` with missing input); `LEDGERS.md` `finding-mark@1` contract shape and single-writer unchanged | P1 + P3 | Pin the REPAIR-RECEIPT contract in fold-findings (P1); Bind recheck-cell consumption in the durable mark contract (P3) | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs` | exit 0; FOLD_POLICY pin + unchanged LEDGERS contract pins | planned |
| O9 | AC-09 | health gates: context budgets and normative drift stay green after the three minor bumps | P4 | Qualify the delta-review unit | execute-phase | `node scripts/check-skill-context.mjs`; `node --test scripts/normative-drift.test.mjs` | both exit 0; budgets manifest re-measured | planned |
| O10 | AC-10 | untouched surfaces: `audit-pr` and `packages/agentic-workflow-schema` unchanged; audit-pr-receipt suite + schema suite green (PR-diff scope per decisions.md E-D5) | P4 | Qualify the delta-review unit | execute-phase | `node --test scripts/audit-pr-receipt.test.mjs`; schema `npm test`; `git diff --name-only main...HEAD -- packages/agentic-workflow-schema skills/audit-pr` empty | suite exits 0 + empty diff listing | planned |
| O11 | AC-11 | bilingual sync: `REVIEW_AND_CLASSIFY.md` + `.es.md` gain the delta/receipt narrative in the same change; `MIGRATION.md` gains the additive bump note | P4 | Qualify the delta-review unit | execute-phase | read-verified at PR time: reciprocal switcher links intact, ES narrative present, MIGRATION note present | PR diff shows both files changed in one commit | planned |
| O12 | IS-10 (SPEC) | loop-termination invariant: a SKIPPED branch never occurs without a receipt; delta cycles stay inside the cap; the manual path and the outer driver consume the same receipt | P2 + P4 | Make delta mode the default post-fold re-review (P2); Qualify the delta-review unit (P4) | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` | exit 0; cap + receipt pins | planned |

## Closure

- Every acceptance criterion AC-01…AC-11 has exactly one mapped obligation row
  (O1…O11); IS-10's invariant is O12. No obligation is `deferred` or exported.
- No Product-half artifact is edited to produce this ledger.
- One behaviour appears once: the freeze rule is O4 (its receipt fields are part
  of O1's block pin, cited, not duplicated).
