# TASKS — 32-review-consistency-pack

Per-phase checklists mirroring `PLAN.md` (fingerprints recorded there). The
frozen finish line is `ACCEPTANCE.md`; the obligations ledger is
`planning-obligations.md`. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — NRS missing-ledger notice

Layer: config/infra · fingerprint `P1:config/infra:4:nrs-missing-ledger-notice`
· Phase-lint: PASS (8/8)

- [x] Update `scripts/workflow-status.mjs` so `NRS_BLOCKING` keeps `draft`, `contradicted`, and `resolved`; the `missing` case emits `detail.substrate_notice` with `{ id: "repository-state", state: "missing", blocking: false }` plus one `detail.workflow_observations` line, keeps `/discover-repository-state` as an `alternatives` entry, and returns to the normal state computation
- [x] Extend `scripts/workflow-status-sensor.test.mjs` with the missing-ledger case (notice present, `blocking: false`, zero `repository-state` blockers, exit 0) and one regression case per real blocker state asserting the substrate blocker, `state: BLOCKED`, and the `/discover-repository-state` recommendation are unchanged
- [x] Assert in `scripts/workflow-status-sensor.test.mjs` that the sensor's feature 31 review-loop-cycle projection is unchanged by the NRS branch
- [x] Run `node --test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-pre-execution.test.mjs` → exit 0

Done-when: `node --test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-pre-execution.test.mjs` → exit 0 with the notice and the three real-blocker regressions green.

## P2 — Contract prose alignment

Layer: docs · fingerprint `P2:docs:8:contract-prose-alignment` · Phase-lint: PASS (8/8)

- [x] Correct the fold-flip sentence in `skills/review-change/references/PERSIST_AND_DECIDE.md` to attribute `folded: no → yes` to `ledger-ownership@1` (`fold-findings:folded-flag`) instead of the fold cycle — and pin it, together with the AC-01 scan over `docs/workflow/` for a surviving restatement, in `scripts/review-loop-discipline.test.mjs`
- [x] Correct the `folded: no → yes` line in `skills/execute-phase/references/FOLDING.md` to cite `ledger-ownership@1` (`fold-findings:folded-flag`) as the sole writer and pin the corrected wording in `scripts/review-loop-discipline.test.mjs`
- [x] Correct the `LEDGERS.md` prose sentence that credits `triage-issue` with the `folded:` flag so it agrees with the map's own `review-findings` row, in `skills/pre-execution-review/references/LEDGERS.md`, and pin it in `scripts/ledger-ownership.test.mjs`
- [x] Restate the sole-flipper claim in `skills/fold-findings/SKILL.md` as a citation of `ledger-ownership@1` (`fold-findings:folded-flag`) and pin it in `scripts/review-loop-discipline.test.mjs`
- [x] Name `triage-issue`'s three modes — independent proposals, audit findings, and `--prioritize-now` — in the relationship section of `skills/review-change/SKILL.md`, mirror them in `skills/review-change/references/PERSIST_AND_DECIDE.md` and `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md`, and pin them in `scripts/review-loop-discipline.test.mjs`
- [x] State in the Confirm roadmap step of `skills/plan-feature/SKILL.md` that it verifies and repairs registration only and that the plan-feature-scaffold skill owns the `defined → planned` write; pin the step and the mirrored scaffold sentence in the review-loop discipline suite
- [x] Align `skills/workflow-status/references/ENVELOPE_CORE.md` and `skills/workflow-status/references/SENSOR_CORE.md` with the sensor's split — only `draft`, `contradicted`, and `resolved` block, while an absent ledger is a non-blocking notice — and pin the split in `scripts/review-loop-discipline.test.mjs`
- [x] Run `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs` → exit 0

Done-when: `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs` → exit 0 with the IS-1, IS-5(b), IS-5(c), and IS-5(a)-text pins green.

## P3 — Classification single-owner contract

Layer: docs · fingerprint `P3:docs:8:classification-single-owner-contract` · Phase-lint: PASS (8/8)

- [x] Add the canonical severity conversion section to `skills/review-implementation/references/CLASSIFY.md` — the ledger, finder, planning, and `audit-docs` scales mapped onto `high | med | low`, one row per producer scale, unknown scales failing closed — and pin every row plus the fail-closed outcome in `scripts/review-loop-discipline.test.mjs`
- [x] Add the derived blocking-gate rule to the same `CLASSIFY.md` section — the four citation categories (a verification criterion that is unverified, an obligation row outside `verified`/`n/a`, a gate red at the reviewed head, an open confirmed `fix-now` row), the no-citation `report-note` outcome, and D10's verdict rule unchanged — and pin it in `scripts/review-loop-discipline.test.mjs`
- [x] Cite `LEDGERS.md` §3 (`:91-96`) as the single owner of the `report-note` definition — material is `medium`+, a `low` row is a persisted report-note — instead of restating it beside the blocking rule, and pin that the classifying surfaces name that owner rather than a second definition
- [x] Fix the report contract in `skills/audit-docs/SKILL.md` — the `| # | Check (1-14) |` header, `Checks run: <n>/14`, and `low` in place of the phantom `MEDIUM` — and pin the three in `scripts/review-loop-discipline.test.mjs`
- [x] Replace the `fix-now | postpone | tradeoff` class vocabulary in `skills/product-audit/SKILL.md` with the closed class set owned by `review-implementation/CLASSIFY.md`, mirror it in `skills/product-audit/references/AUDIT_PROCESS.md`, and pin the removal grep in `scripts/review-loop-discipline.test.mjs`
- [x] Delete the ad-hoc finder-scale mapping from `skills/review-change/references/PERSIST_AND_DECIDE.md` in favour of a pointer to the canonical table in `skills/review-implementation/references/CLASSIFY.md`, then re-point the existing finder-scale pin in `scripts/review-loop-discipline.test.mjs` at the table rows
- [x] Align the closure-integrity result scale in `skills/audit-pr/SKILL.md` to `pass | blocker | n-a` and pin the three scale lines — not the whole audit-pr tree — in `scripts/review-loop-discipline.test.mjs`
- [x] Run `node --test scripts/review-loop-discipline.test.mjs scripts/audit-pr-receipt.test.mjs` → exit 0

Done-when: `node --test scripts/review-loop-discipline.test.mjs scripts/audit-pr-receipt.test.mjs` → exit 0 with the conversion-table, fail-closed, blocking-gate, and scale pins green.

## P4 — Gate-run receipt

Layer: docs · fingerprint `P4:docs:7:gate-run-receipt` · Phase-lint: PASS (8/8)

- [x] Resolve the `CHANGELOG.md` version collision the drift gate fails on: the later-merged feature 60 row takes `pre-execution-review` 2.4.0 (feature 31's row keeps 2.3.0), the row text records the correction, and `skills/pre-execution-review/SKILL.md` `version:` reads 2.4.0 so the newest-row/frontmatter pin holds
- [x] Add the `gate-ran@1` appended-text mark to `skills/pre-execution-review/references/LEDGERS.md` — the fixed format, the additive-slots rule, the reserved trailing `manifest` slot, the identical-head reuse rule, and the changed-head re-run rule — and extend the map's `review-findings` owner cell with `execute-phase:gate-ran-marks` and `review-change:review-gate-ran-marks`, pinned in `scripts/review-loop-discipline.test.mjs`
- [x] Mirror the identical `review-findings` owner cell into `docs/features/_TEMPLATE/LEDGERS.md` and `docs/fix/_TEMPLATE/LEDGERS.md` so the live map and both projections stay byte-equal
- [x] State in `skills/execute-phase/references/EXECUTION_CONTRACT.md` that the phase completion gate records a `GATE-RAN` mark at the head it ran and consumes an identical-head green mark instead of re-running, mirror it in `skills/execute-phase/references/FOLDING.md`, and pin it in `scripts/review-loop-discipline.test.mjs`
- [x] State in `skills/review-change/references/PERSIST_AND_DECIDE.md` that a reviewer records a `GATE-RAN` mark for the gate run its review performed and consumes an identical-head green mark instead of re-running, and pin it in `scripts/review-loop-discipline.test.mjs`
- [x] Bump the minor version of every touched skill (review-change, execute-phase, pre-execution-review — 2.4.0 → 2.5.0 — fold-findings, review-implementation, audit-docs, product-audit, audit-pr, plan-feature, plan-feature-scaffold, workflow-status) through the `bump-skill` routine with one `CHANGELOG.md` row each
- [x] Re-base the declared `docs/workflow/SKILL_CONTEXT_BUDGETS.json` entries at the tool's own declared re-basis with the growth source named, declaring a new entry for a touched skill that grew past `defaults`, then run `node scripts/check-skill-context.mjs` and `node --test scripts/ledger-ownership.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/normative-drift.test.mjs` → exit 0

Done-when: ✅ `node --test scripts/ledger-ownership.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/normative-drift.test.mjs` → exit 0 with the map/projection equality, the `gate-ran@1` pins, the roadmap pins, and the changelog once-per-table pin green.

## P5 — Hardening & PR

Layer: hardening · fingerprint `P5:hardening:9:hardening-pr` · Phase-lint: PASS (8/8)

- [x] Run the full verification ladder — the root suites, the schema and Pi package suites, the budget gate, and the drift gate — pasting each command with its exit code
- [x] Re-bundle the Pi mirror from the final skill tree and run the parity suite plus the Pi package suite → exit 0
- [x] Confirm every phase fingerprint still matches the plan's committed shapes and the frozen acceptance blob is unchanged, and record the acceptance receipt in the unit's progress file
- [x] Append the arXiv:2603.00539 entry to the bottom `## References` section of the repo README, creating the section when absent and deduping against entries other features added (read-verified)
- [x] Verify the README entry sits under the References section, cites the printed form, and is deduped (read-verified)
- [x] Confirm the touched test files gained the new pins and kept every existing assertion, recording the sanctioned AC-11 rewordings (read-verified)
- [x] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [x] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [x] commit `docs: link PR #<n>` and push

Done-when: `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the whole ladder green, the mirror parity green, and the PR URL printed.
