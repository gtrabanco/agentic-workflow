# Acceptance manifest v1 — 30-repair-receipt-delta-review

Status: frozen

Frozen 2026-09-07 by `plan-feature-scaffold` from the SPEC's acceptance
criteria AC-01…AC-11. One stable ID per SPEC criterion; validators copied from
the criteria. Modifying this manifest during execution requires a
user-approved SPEC amendment.

Re-frozen 2026-09-07 by the `plan-feature` repair batch for review receipt
`rp-30-20260907-001` (findings P30-1 + P30-2, artifact revision `30-plan-2`):
AC-03's pinned outcome was widened with the branch-selection decision-input
pins (E-D2/E-D3). No validator weakened, no row removed, no id renamed — every
existing pin only gains a strictly stronger assertion, per this manifest's own
quality floor.

| ID | Required outcome | Validator |
|---|---|---|
| AC-01 | The receipt contract is pinned: `node --test scripts/review-loop-discipline.test.mjs` passes with new pins asserting, verbatim in `skills/fold-findings/SKILL.md` and `skills/fold-findings/references/FOLD_PROCESS.md`, the fixed REPAIR-RECEIPT block, its field list (repaired ids + finding-mark refs, refuted/open, gate exit codes at head, batch class, fold-diff shortstat), the empty-batch branch, the failed-gate branch, and the frozen-batch branch | `node --test scripts/review-loop-discipline.test.mjs` -> exit 0 (receipt/freeze/branch pin sections) |
| AC-02 | Single-owner vocabulary: the receipt's batch-class field references only the closed class set owned by `skills/review-implementation/references/CLASSIFY.md` | `grep -c "replan-in-unit" skills/review-implementation/references/CLASSIFY.md` -> ≥ 1 before and after, plus the discipline suite exit 0 |
| AC-03 | Branch contract pinned: the discipline suite asserts the three closing-branch outcomes (`RE-REVIEW-REQUIRED (delta)` / `RE-REVIEW-OPTIONAL` / `RE-REVIEW-SKIPPED`), the literal default line ("no decision → re-review"), **and the branch-selection decision inputs** (repair P30-2) in `skills/fold-findings/SKILL.md`'s closing-block spec: the docs-only file-set test (E-D3 — every fold-diff file a documentation file, otherwise the batch is behavioral), the frozen-severity-`high` override (a folded row frozen `high` forces `RE-REVIEW-REQUIRED (delta)` even on a docs-only diff; frozen fields never edited to reach a branch), and the SKIPPED-requires-prior-consumer-decision rule (E-D2 — a turn with no recorded prior consumer decision prints `RE-REVIEW-OPTIONAL` + the re-review default, never `RE-REVIEW-SKIPPED`) | `node --test scripts/review-loop-discipline.test.mjs` -> exit 0 (branch + branch-selection decision-input pins) |
| AC-04 | Freeze-batch pinned: the discipline suite asserts that a replan-class finding in the batch folds nothing (no `folded: yes`, no commit) and the receipt records the replan route plus retained ids; the ledger suites stay green (no new ledger ownership) | `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs` -> exit 0 |
| AC-05 | Delta mode pinned: the discipline suite asserts, in `skills/review-change/references/REVIEW_PROCESS.md`, the delta-mode default (re-verify folded rows at cited locations; review the fold diff only), the gate-green + exact `ACCEPTANCE.md` blob precondition, and the genuinely-new dedupe wording (same `file:line`+axis only as `regression of <id>` / `DISPUTED`); existing pin 3 ("folded rows are re-verified, not re-reported") keeps passing | `node --test scripts/review-loop-discipline.test.mjs` -> exit 0 (delta pins + unchanged pin 3) |
| AC-06 | Escalation pinned: the discipline suite asserts the two triggers (file not in cited-file set **or** changed line >50 lines from any cited line in a cited file; > 200 changed lines or > 15 files) with the state-the-trigger-and-numbers requirement | `node --test scripts/review-loop-discipline.test.mjs` -> exit 0 (escalation pins) |
| AC-07 | Cap semantics pinned: the discipline suite asserts the cap counts delta cycles from the unchanged source (`review-mark@1` marks + forge receipts) and the third-cycle-user-only line survives verbatim | `node --test scripts/review-loop-discipline.test.mjs` -> exit 0 (cap pin) |
| AC-08 | Reproducer handoff pinned: the discipline suite asserts `skills/fold-findings/references/FOLD_POLICY.md` gains the materialize-reproducer rule (run the recheck method as the regression check; never re-derive; `BLOCKED` with missing input when not materializable) and `skills/pre-execution-review/references/LEDGERS.md`'s `finding-mark@1` contract is unchanged | `node --test scripts/review-loop-discipline.test.mjs` -> exit 0 (FOLD_POLICY + LEDGERS pins) |
| AC-09 | Health gates: `node scripts/check-skill-context.mjs` passes after the three minor bumps; `node --test scripts/normative-drift.test.mjs` passes | both commands -> exit 0 |
| AC-10 | Untouched-surface regressions: `node --test scripts/audit-pr-receipt.test.mjs` and the `packages/agentic-workflow-schema` suite pass with no changes to `audit-pr` or the schema package; the PR diff contains no file under `packages/` (interpreted per decisions.md E-D5: no file under `packages/agentic-workflow-schema/` or `skills/audit-pr/`; the `packages/pi-agentic-workflow` mirror re-bundle through `bundle:skills` is expected per the SPEC's integration-closure row) | `node --test scripts/audit-pr-receipt.test.mjs` -> exit 0; `cd packages/agentic-workflow-schema && npm test` -> exit 0; `git diff --name-only main...HEAD -- packages/agentic-workflow-schema skills/audit-pr` -> empty |
| AC-11 | Bilingual sync: `docs/workflow/REVIEW_AND_CLASSIFY.md` and its `.es.md` sibling gain the delta-mode + receipt narrative in the same change (reciprocal switcher links intact), and `MIGRATION.md` gains the additive version-bump note | read-verified at PR time: PR diff shows both siblings + MIGRATION.md in the change, links intact |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The loop-discipline pins are updated to the new contract, never weakened: every existing pin keeps its phrase or gains a strictly stronger assertion.

## Commands

- `node --test scripts/review-loop-discipline.test.mjs`
- `node --test scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs`
- `node --test scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs`
- `node scripts/check-skill-context.mjs`
- `node --test scripts/normative-drift.test.mjs`
- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
- `grep -c "replan-in-unit" skills/review-implementation/references/CLASSIFY.md`
