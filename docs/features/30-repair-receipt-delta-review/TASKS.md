# TASKS — 30-repair-receipt-delta-review

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit. Tests are written
red-first inside each phase and made green by that phase's implementation —
never edited to pass.

## P1 — Pin the REPAIR-RECEIPT contract in fold-findings

Layer: docs · Done-when: `node --test
scripts/review-loop-discipline.test.mjs` -> exit 0 with the new receipt,
classification, freeze, branch, branch-selection decision-input,
empty/failed-gate, and reproducer pins green and every existing pin still
passing.

- [x] Write red-first pins in `scripts/review-loop-discipline.test.mjs` asserting the fixed REPAIR-RECEIPT block, its field list, its empty-batch / failed-gate / frozen-batch branches, and the branch-selection decision inputs (docs-only file-set test E-D3, frozen-severity-`high` override, SKIPPED-requires-prior-consumer-decision rule E-D2) verbatim in `skills/fold-findings/SKILL.md` + `references/FOLD_PROCESS.md`.
- [x] Add the fixed REPAIR-RECEIPT block (fields: repaired ids + `finding-mark@1` refs, refuted/open, gate exit codes at head, batch class, fold-diff shortstat) to `fold-findings`' report contract and turn-contract box, printed after the tally as the ABSOLUTE-last output.
- [x] Add the impact-rule batch classification (`all-repair-in-place` vs `frozen (replan present)`, from the frozen class set only) and the freeze-batch rule (a replan-class member folds nothing: no flips, no commits; route + retained ids) to `FOLD_PROCESS.md`.
- [x] Add the four-branch closing block (`RE-REVIEW-REQUIRED (delta)` / `RE-REVIEW-OPTIONAL` / `RE-REVIEW-SKIPPED` / `REPLAN-ROUTE`) with the literal no-decision→re-review default and the branch-selection rules (docs-only file-set test E-D3, frozen-severity-`high` override, SKIPPED-requires-prior-consumer-decision rule E-D2) to `SKILL.md`'s closing-block spec.
- [x] Add the empty-batch (nothing taken → receipt with `none` class) and failed-gate (gate red → receipt with observed exit codes, nothing folded) branches to the report contract.
- [x] Add the materialize-reproducer rule to `FOLD_POLICY.md` (consume the `finding-mark@1` `recheck` cell; never re-derive; unmaterializable → `BLOCKED` with the missing input named).
- [x] Bump `fold-findings` 1.3.0 → 1.4.0 via the `bump-skill` contract (both changelog siblings get rows) and keep the skill inside its context budget.
- [x] Run the discipline suite green and confirm pins 1–4 plus the bounded-loop fold pins (`one FOLDED <same-sha> line per member`, `never edit classification or create an issue`) still pass unchanged.

## P2 — Make delta mode the default post-fold re-review

Layer: docs · Done-when: `node --test
scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs`
-> exit 0 with the delta, escalation, dedupe, and cap pins green and existing
pin 3 unchanged.

- [ ] Write red-first pins in `scripts/review-loop-discipline.test.mjs` asserting the delta-mode default, the two escalation triggers with the state-trigger-and-numbers requirement, the genuinely-new dedupe wording, and the delta-cap sentence in `skills/review-change/references/REVIEW_PROCESS.md`.
- [ ] Extend `REVIEW_PROCESS.md` step 1 with the delta-mode default: re-verify every `folded: yes` row at its ledger `file:line`, review the fold diff only, and require gate green at the reviewed head plus the exact sibling `ACCEPTANCE.md` blob before any pass.
- [ ] Add the escalation rule to `REVIEW_PROCESS.md`: width (changed file outside the cited-file union, or changed line more than 50 lines from every cited line in its file) or size (more than 200 changed lines or more than 15 files) escalates to a full pass, stating which trigger fired and the observed numbers.
- [ ] Extend the cycle-≥2 dedupe paragraph: a same-`file:line`+axis re-report inside the delta scope is admitted only as `regression of <id>` or `DISPUTED`, and delta cycles are counted by the existing two-cycle cap source (`review-mark@1` marks + forge receipts) with the third-cycle-user-only line preserved verbatim.
- [ ] Bump `review-change` 3.3.0 → 3.4.0 via the `bump-skill` contract and keep the skill inside its context budget.
- [ ] Run the discipline + bounded-loop suites green; verify the `LOOP CAP REACHED` / `third cycle never starts` / `regression of <id>` pins and `REVIEW_PROCESS.md`'s step-2 blob precondition survive unchanged.

## P3 — Bind recheck-cell consumption in the durable mark contract

Layer: docs · Done-when: `node --test
scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs
scripts/ledger-provenance.test.mjs` -> exit 0.

- [ ] Write a red-first pin in `scripts/review-loop-discipline.test.mjs` asserting that `LEDGERS.md` §"The durable finding mark" names `fold-findings` as the `recheck` cell's consumer (materialize-never-rederive).
- [ ] Add one consumption sentence to `skills/pre-execution-review/references/LEDGERS.md` §"The durable finding mark" (fold-findings reads the `recheck` cell to materialize the reproducer; the row shape, `VF-` exclusions, and the `review-change` single-writer rule stay untouched).
- [ ] Bump `pre-execution-review` 2.1.0 → 2.2.0 via the `bump-skill` contract.
- [ ] Run the discipline + ledger-ownership + ledger-provenance suites green; confirm the ownership block, the `VF-` annotator-exclusion fixture behavior, and the template copies (`docs/features/_TEMPLATE/LEDGERS.md`, `docs/fix/_TEMPLATE/LEDGERS.md`) are unchanged.

## P4 — Qualify the delta-review unit

Layer: hardening · Done-when: every frozen validator in `ACCEPTANCE.md`
passes, the Pi bundle parity is green, and the PR is open with `Closes #170`
(read-verified PR URL printed in the chat).

- [ ] Synchronize the workflow narrative: `docs/workflow/REVIEW_AND_CLASSIFY.md` and its `.es.md` sibling gain the delta-mode + REPAIR-RECEIPT narrative in one commit (reciprocal switcher links intact), and `docs/workflow/MIGRATION.md` gains the additive version-bump note.
- [ ] Re-measure the three bumped skills against `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (update the manifest where growth is declared) and run `node scripts/check-skill-context.mjs` green.
- [ ] Run the full root regression set: `node --test scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/normative-drift.test.mjs` -> exit 0.
- [ ] Verify untouched surfaces: `cd packages/agentic-workflow-schema && npm test` -> exit 0 and `git diff --name-only main...HEAD -- packages/agentic-workflow-schema skills/audit-pr` -> empty (AC-10, scope per decisions.md E-D5).
- [ ] Re-bundle the Pi mirror only through `cd packages/pi-agentic-workflow && npm run bundle:skills`, bump the package's distribution metadata as required, and pass its suite/parity tests.
- [ ] Close `progress.md`, `testing.md`, and `known-issues.md` truthfully and verify the frozen `ACCEPTANCE.md` manifest at the terminal HEAD (blob recomputed and recorded in the receipt).
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
