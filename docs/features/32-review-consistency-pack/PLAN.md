# PLAN — 32-review-consistency-pack

Five implementation phases, one layer each, zero open decisions: the sensor's
NRS branch (P1, `config/infra`), the contradicting prose aligned to its cited
owner (P2, `docs`), the classification contract consolidated onto one severity
table and one derived blocking rule (P3, `docs`), the SHA-bound gate-run receipt
plus release bookkeeping (P4, `docs`), and the hardening close-out (P5). The
product half's per-owner sketch ("fold-flag wording, severity/classification,
gate receipt, contradiction fixes, pins close-out") is cut by layer, not by
owner: the four one-line contradiction fixes land in the phase nearest their
owning surface, so the plan stays inside the ≤ 5-phase bound the Product half
records. Detailed task checklists live in `TASKS.md`; the frozen finish line is
`ACCEPTANCE.md`; the planning ledgers are `planning-evidence.md` (PE-001…PE-023)
and `planning-obligations.md` (O1…O25).

Artifact revision of this plan set: `32-plan-3` — the `plan-feature` repair
batch for `PLAN-REVIEW-32-2` findings F21–F22 (2026-09-19): PE-011's
`ledger-ownership.test.mjs` cites are re-based (`:56-57`, `:66-74`, `:158-163`,
`:173`, `:202-204`) and O9 moves to P2, so the reference alignment lands where
`PLAN.md`/`TASKS.md` P2 task 7 and its IS-5(a)-text pin already put it (the
SPEC's P1/P2 phase bullets match the split). `32-plan-2` was the re-cut by
`plan-feature` on 2026-09-19 against the post-merge head `e1c008bc` (features 31
and 60 merged), the repair batch for `PLAN-REVIEW-32-1` findings F13–F19; parent
Product receipt `SPEC-REVIEW-32-5`, snapshot `e4b293e3…`. The `32-plan-1` initial
cut (`plan-feature-scaffold`, 2026-09-18) was parented to `SPEC-REVIEW-32-4`,
`5d5a5b6c…`, and was cut before that merge.

## P1 — NRS missing-ledger notice

Layer: config/infra · Done-when: `node --test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-pre-execution.test.mjs` → exit 0 with the notice and the three real-blocker regressions green.

`missing` is optional state, not a defect: it leaves `NRS_BLOCKING`, and the
sensor reports it as a non-blocking machine-readable notice while `draft`,
`contradicted`, and `resolved` keep today's run-scoped substrate blocker and
`state: BLOCKED`. The notice reuses `detail`, which is schema-unconstrained, so
the schema package is untouched. The sensor file now also carries the merged
feature 31's review-loop-cycle projection (`deriveReviewLoopCycles`, imported
from `./pre-execution-contract.mjs`): the NRS branch edits the same file, so it
must leave that projection and its discipline pin intact.

- [ ] Update `scripts/workflow-status.mjs` so `NRS_BLOCKING` keeps `draft`, `contradicted`, and `resolved`; the `missing` case emits `detail.substrate_notice` with `{ id: "repository-state", state: "missing", blocking: false }` plus one `detail.workflow_observations` line, keeps `/discover-repository-state` as an `alternatives` entry, and returns to the normal state computation
- [ ] Extend `scripts/workflow-status-sensor.test.mjs` with the missing-ledger case (notice present, `blocking: false`, zero `repository-state` blockers, exit 0) and one regression case per real blocker state asserting the substrate blocker, `state: BLOCKED`, and the `/discover-repository-state` recommendation are unchanged
- [ ] Assert in `scripts/workflow-status-sensor.test.mjs` that the sensor's feature 31 review-loop-cycle projection is unchanged by the NRS branch
- [ ] Run `node --test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-pre-execution.test.mjs` → exit 0

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:4:nrs-missing-ledger-notice`

## P2 — Contract prose alignment

Layer: docs · Done-when: `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs` → exit 0 with the IS-1, IS-5(b), IS-5(c), and IS-5(a)-text pins green.

Every sentence that claims an ownership the `ledger-ownership@1` map assigns
elsewhere is replaced by a pointer to the owner: the fold-flag flip
(`fold-findings:folded-flag`), the roadmap `defined → planned` write
(`plan-feature-scaffold:planned-row`), the `triage-issue` modes, and the
optional NRS ledger. The existing `critical.*high.*major.*med.*minor.*low`
discipline pin is untouched here — it is re-pointed at the canonical table in
P3, where that table lands.

- [ ] Correct the fold-flip sentence in `skills/review-change/references/PERSIST_AND_DECIDE.md` to attribute `folded: no → yes` to `ledger-ownership@1` (`fold-findings:folded-flag`) instead of the fold cycle — and pin it, together with the AC-01 scan over `docs/workflow/` for a surviving restatement, in `scripts/review-loop-discipline.test.mjs`
- [ ] Correct the `folded: no → yes` line in `skills/execute-phase/references/FOLDING.md` to cite `ledger-ownership@1` (`fold-findings:folded-flag`) as the sole writer and pin the corrected wording in `scripts/review-loop-discipline.test.mjs`
- [ ] Correct the `LEDGERS.md` prose sentence that credits `triage-issue` with the `folded:` flag so it agrees with the map's own `review-findings` row, in `skills/pre-execution-review/references/LEDGERS.md`, and pin it in `scripts/review-loop-discipline.test.mjs`
- [ ] Restate the sole-flipper claim in `skills/fold-findings/SKILL.md` as a citation of `ledger-ownership@1` (`fold-findings:folded-flag`) and pin it in `scripts/review-loop-discipline.test.mjs`
- [ ] Name `triage-issue`'s three modes — independent proposals, audit findings, and `--prioritize-now` — in the relationship section of `skills/review-change/SKILL.md`, mirror them in `skills/review-change/references/PERSIST_AND_DECIDE.md` and `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md`, and pin them in `scripts/review-loop-discipline.test.mjs`
- [ ] State in the Confirm roadmap step of `skills/plan-feature/SKILL.md` that it verifies and repairs registration only and that the plan-feature-scaffold skill owns the `defined → planned` write; pin the step and the mirrored scaffold sentence in the review-loop discipline suite
- [ ] Align `skills/workflow-status/references/ENVELOPE_CORE.md` and `skills/workflow-status/references/SENSOR_CORE.md` with the sensor's split — only `draft`, `contradicted`, and `resolved` block, while an absent ledger is a non-blocking notice — and pin the split in `scripts/review-loop-discipline.test.mjs`
- [ ] Run `node --test scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs` → exit 0

Phase-lint: PASS (8/8) · fingerprint `P2:docs:8:contract-prose-alignment`

## P3 — Classification single-owner contract

Layer: docs · Done-when: `node --test scripts/review-loop-discipline.test.mjs scripts/audit-pr-receipt.test.mjs` → exit 0 with the conversion-table, fail-closed, blocking-gate, and scale pins green.

`skills/review-implementation/references/CLASSIFY.md` becomes the single owner
of the severity conversion (one table, four producer scales, unknown scales fail
closed) and of the derived blocking gate (a finding blocks only on a cited
single-owner failure), while the materiality vocabulary it consumes stays owned
by `LEDGERS.md` §3 (the merged feature 31's `report-note` line) — this unit
reconciles IS-3 with that shipped contract and adds no competing definition or
loop policy. The stray scales elsewhere are aligned in the same
sweep: `audit-docs` reports its real 14 checks with its legend's severities,
`product-audit` uses the closed class set, and the closure-integrity result
scale of `audit-pr` drops `warning`.

- [ ] Add the canonical severity conversion section to `skills/review-implementation/references/CLASSIFY.md` — the ledger, finder, planning, and `audit-docs` scales mapped onto `high | med | low`, one row per producer scale, unknown scales failing closed — and pin every row plus the fail-closed outcome in `scripts/review-loop-discipline.test.mjs`
- [ ] Add the derived blocking-gate rule to the same `CLASSIFY.md` section — the four citation categories (a verification criterion that is unverified, an obligation row outside `verified`/`n/a`, a gate red at the reviewed head, an open confirmed `fix-now` row), the no-citation `report-note` outcome, and D10's verdict rule unchanged — and pin it in `scripts/review-loop-discipline.test.mjs`
- [ ] Cite `LEDGERS.md` §3 (`:91-96`) as the single owner of the `report-note` definition — material is `medium`+, a `low` row is a persisted report-note — instead of restating it beside the blocking rule, and pin that the classifying surfaces name that owner rather than a second definition
- [ ] Fix the report contract in `skills/audit-docs/SKILL.md` — the `| # | Check (1-14) |` header, `Checks run: <n>/14`, and `low` in place of the phantom `MEDIUM` — and pin the three in `scripts/review-loop-discipline.test.mjs`
- [ ] Replace the `fix-now | postpone | tradeoff` class vocabulary in `skills/product-audit/SKILL.md` with the closed class set owned by `review-implementation/CLASSIFY.md`, mirror it in `skills/product-audit/references/AUDIT_PROCESS.md`, and pin the removal grep in `scripts/review-loop-discipline.test.mjs`
- [ ] Delete the ad-hoc finder-scale mapping from `skills/review-change/references/PERSIST_AND_DECIDE.md` in favour of a pointer to the canonical table in `skills/review-implementation/references/CLASSIFY.md`, then re-point the existing finder-scale pin in `scripts/review-loop-discipline.test.mjs` at the table rows
- [ ] Align the closure-integrity result scale in `skills/audit-pr/SKILL.md` to `pass | blocker | n-a` and pin the three scale lines — not the whole audit-pr tree — in `scripts/review-loop-discipline.test.mjs`
- [ ] Run `node --test scripts/review-loop-discipline.test.mjs scripts/audit-pr-receipt.test.mjs` → exit 0

Phase-lint: PASS (8/8) · fingerprint `P3:docs:8:classification-single-owner-contract`

## P4 — Gate-run receipt

Layer: docs · Done-when: `node --test scripts/ledger-ownership.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/normative-drift.test.mjs` → exit 0 with the map/projection equality, the `gate-ran@1` pins, the roadmap pins, and the changelog once-per-table pin green.

The gate runs once per head: a `gate-ran@1` appended text mark records the head a
green run used, any skill reuses it only at the identical head, and a changed
head re-runs. The mark's recorder sets join the map's existing `review-findings`
truth-class row, mirrored byte-identically into both template projections. The
phase closes with the release bookkeeping — the `CHANGELOG.md` version
collision that keeps the drift gate red resolved first, then minor bumps for
every touched skill and the budget re-basis, which lands here because P4 is the
last phase that edits skill text.

- [ ] Resolve the `CHANGELOG.md` version collision the drift gate fails on: the later-merged feature 60 row takes `pre-execution-review` 2.4.0 (feature 31's row keeps 2.3.0), the row text records the correction, and `skills/pre-execution-review/SKILL.md` `version:` reads 2.4.0 so the newest-row/frontmatter pin holds
- [ ] Add the `gate-ran@1` appended-text mark to `skills/pre-execution-review/references/LEDGERS.md` — the fixed format, the additive-slots rule, the reserved trailing `manifest` slot, the identical-head reuse rule, and the changed-head re-run rule — and extend the map's `review-findings` owner cell with `execute-phase:gate-ran-marks` and `review-change:review-gate-ran-marks`, pinned in `scripts/review-loop-discipline.test.mjs`
- [ ] Mirror the identical `review-findings` owner cell into `docs/features/_TEMPLATE/LEDGERS.md` and `docs/fix/_TEMPLATE/LEDGERS.md` so the live map and both projections stay byte-equal
- [ ] State in `skills/execute-phase/references/EXECUTION_CONTRACT.md` that the phase completion gate records a `GATE-RAN` mark at the head it ran and consumes an identical-head green mark instead of re-running, mirror it in `skills/execute-phase/references/FOLDING.md`, and pin it in `scripts/review-loop-discipline.test.mjs`
- [ ] State in `skills/review-change/references/PERSIST_AND_DECIDE.md` that a reviewer records a `GATE-RAN` mark for the gate run its review performed and consumes an identical-head green mark instead of re-running, and pin it in `scripts/review-loop-discipline.test.mjs`
- [ ] Bump the minor version of every touched skill (review-change, execute-phase, pre-execution-review — 2.4.0 → 2.5.0 — fold-findings, review-implementation, audit-docs, product-audit, audit-pr, plan-feature, plan-feature-scaffold, workflow-status) through the `bump-skill` routine with one `CHANGELOG.md` row each
- [ ] Re-base the declared `docs/workflow/SKILL_CONTEXT_BUDGETS.json` entries at the tool's own declared re-basis with the growth source named, declaring a new entry for a touched skill that grew past `defaults`, then run `node scripts/check-skill-context.mjs` and `node --test scripts/ledger-ownership.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/normative-drift.test.mjs` → exit 0

Phase-lint: PASS (8/8) · fingerprint `P4:docs:7:gate-run-receipt`

## P5 — Hardening & PR

Layer: hardening · Done-when: `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the whole ladder green, the mirror parity green, and the PR URL printed.

Qualify the whole unit against the frozen finish line, re-bundle the Pi mirror,
record the acceptance blob receipt, append the bibliography, and close out.

- [ ] Run the full verification ladder — the root suites, the schema and Pi package suites, the budget gate, and the drift gate — pasting each command with its exit code
- [ ] Re-bundle the Pi mirror from the final skill tree and run the parity suite plus the Pi package suite → exit 0
- [ ] Confirm every phase fingerprint still matches the plan's committed shapes and the frozen acceptance blob is unchanged, and record the acceptance receipt in the unit's progress file
- [ ] Append the arXiv:2603.00539 entry to the bottom `## References` section of the repo README, creating the section when absent and deduping against entries other features added (read-verified)
- [ ] Verify the README entry sits under the References section, cites the printed form, and is deduped (read-verified)
- [ ] Confirm the touched test files gained the new pins and kept every existing assertion, recording the sanctioned AC-11 rewordings (read-verified)
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push

Phase-lint: PASS (8/8) · fingerprint `P5:hardening:9:hardening-pr`
