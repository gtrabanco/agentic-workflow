# PLAN — 31-planning-review-materiality

Four implementation phases (materiality line → hard cap → wording-only route →
qualification). The full semantics of each rule, the pin placement, and the
bump assignment are frozen in `SPEC.md` (`## Engineering half` → `### Design`)
and `decisions.md` (E-D31-1…E-D31-4). Artifact revision of this plan set:
`31-plan-1` (first scaffold write, 2026-09-17, from the Product half at
artifact revision `31-spec-1`, receipt `spec-review-31-1` @ snapshot
`735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a`).
Frozen acceptance-manifest blob at scaffold time (`git hash-object`): `f220c1dd432125a9524dd37d7286202d58d8a731` — re-verified at first execution run.

## P1 — Move the planning materiality line to report-note semantics

Layer: docs · Done-when: `bun test scripts/review-loop-discipline.test.mjs` →
exit 0 with the report-note, CHECKS-materiality, and anti-deflation pins green
and every existing assertion still passing.

- [ ] Pin the report-note contract red-first against the new §3 wording of `skills/pre-execution-review/references/LEDGERS.md`: the assertions land in a new planning-side section of the discipline suite and state that a `low` planning finding is persisted, visible, non-blocking, never a re-review trigger by itself, resolvable by the stage author without a re-review, with material = `medium`+.
- [ ] Edit `skills/pre-execution-review/references/LEDGERS.md` §3: replace the "`info` is the only immaterial one" sentence with the report-note materiality line (material = `medium`+; a `low` finding is a persisted, visible, non-blocking report-note) and the anti-deflation carry-over (a real defect mislabeled `low` classifies at `medium` minimum; deflating a severity to dodge a review is itself a review defect), keeping the row shape, the writer map, and the append-only contract untouched.
- [ ] Pin the materiality restatement red-first against the new wording of `skills/review-spec/references/CHECKS.md` + `skills/review-plan/references/CHECKS.md` in the discipline suite: both files state material = `medium`+ and carry the anti-deflation rule.
- [ ] Edit `skills/review-spec/references/CHECKS.md` + `skills/review-plan/references/CHECKS.md`: replace "Material = anything above `info`" with "Material = `medium`+" plus the report-note sentence (a `low` finding never blocks, never triggers a re-review by itself) plus the anti-deflation sentence, keeping the closed severity vocabulary list unchanged.
- [ ] Bump `pre-execution-review` 2.2.1 to 2.3.0, `review-spec` 1.7.1 to 1.8.0, `review-plan` 1.6.1 to 1.7.0 via the `bump-skill` contract (CHANGELOG rows + README cells; one bump per skill per PR per E-D31-1 — the later re-edits of these skills stay under their P1 versions).
- [ ] Run `bun test scripts/review-loop-discipline.test.mjs` and record the green run in the phase's progress entry (every existing assertion still passing).

## P2 — End the planning repair loop at a hard two-cycle cap

Layer: docs · Done-when: `bun test scripts/review-loop-discipline.test.mjs` →
exit 0 with the cap, verdict-mirror, and REPAIR-mirror pins green and every
existing assertion still passing.

- [ ] Pin the hard cap red-first against the new §4 wording of `skills/pre-execution-review/references/POLICY.md` in the discipline suite: the second cycle prints the unchanged `CONVERGENCE-ANOMALY` block before any further edit, a third cycle never starts without explicit user instruction, and an unconverged loop ends in `NEEDS-DESIGN` routed to the human.
- [ ] Edit `skills/pre-execution-review/references/POLICY.md` §4: after the anomaly text, state the hard two-cycle cap with its counting basis (persisted receipts + repair records across the unit's progress and findings ledgers), end an unconverged loop in `NEEDS-DESIGN` routed to the human, scope the repair-turn exemption to authorized cycles, and replace "no cap converts a verdict into a dead end" with the user-gated-stop semantics — the `CONVERGENCE-ANOMALY` block itself stays byte-identical.
- [ ] Pin the verdict-surface mirrors red-first against the new loop text of `skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md` in the discipline suite: both files carry the cap line (`third cycle never starts without explicit user instruction`).
- [ ] Edit `skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md`: extend the second-cycle loop text with the hard cap and the `NEEDS-DESIGN` end, keeping the receipt-literal lines and the verdict blocks byte-identical (machine-pinned normative grammar).
- [ ] Edit `skills/design-feature/references/REPAIR.md` §4: replace "More cycles stay allowed when correctness needs them" with the cap mirror (a third cycle never starts without explicit user instruction; an unconverged loop ends in `NEEDS-DESIGN`), preserving the §4 heading and the anomaly-first ordering.
- [ ] Bump `design-feature` 3.4.0 to 3.5.0 via the `bump-skill` contract (the three skills bumped in P1 keep their versions — E-D31-1).
- [ ] Run `bun test scripts/review-loop-discipline.test.mjs` and record the green run in the phase's progress entry (cap + mirror pins green; existing assertions unchanged).

## P3 — Route wording-only repairs past the full snapshot re-review

Layer: docs · Done-when: `bun test scripts/review-loop-discipline.test.mjs` →
exit 0 with the wording-only pin green and every existing assertion still
passing.

- [ ] Pin the wording-only route red-first against the new §3 text of `skills/pre-execution-review/references/POLICY.md` in the discipline suite: a recorded wording-only determination routes a cosmetic repair batch without the full snapshot re-review, records the determination in the unit's frozen evidence, and rotates `artifactRevisionId`.
- [ ] Edit `skills/pre-execution-review/references/POLICY.md` §3: the opening paragraph keeps the single re-review as the default batch consequence and exempts a recorded wording-only determination; the Wording-only row's forbidden cell keeps the recording requirement and adds the `artifactRevisionId` rotation requirement; the Common-root-cause and Scope-changing rows stay untouched.
- [ ] Run `bun test scripts/review-loop-discipline.test.mjs` and record the green run in the phase's progress entry (wording-only pin green; existing assertions unchanged; no version bump — E-D31-1).

## P4 — Qualify the planning-review-materiality unit

Layer: hardening · Done-when: `bun scripts/check-skill-context.mjs && bun test
scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs
scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
scripts/normative-drift.test.mjs` → exit 0 with every frozen `ACCEPTANCE.md`
validator green at the terminal HEAD and the PR open with `Closes #171`.

- [ ] Re-measure the four bumped skills against the context-budgets manifest and run `bun scripts/check-skill-context.mjs` green, updating the manifest where the declared growth covers the edits.
- [ ] Run `bun run bundle:skills` after the last skills edit and run the Pi package's parity suite from its package root — the mirror stays byte-identical to the canonical skill tree.
- [ ] Run the full regression set (discipline + ledger-ownership + pre-execution-quality + ledger-provenance + normative-drift + pre-execution-sensor suites) and record every exit 0 in the phase's progress entry.
- [ ] Run the schema package's suite from its package root and verify `git diff main...HEAD -- packages/agentic-workflow-schema` stays empty (negative integration, AC10).
- [ ] Verify the AC8 + AC9 diff walks at the branch head: `git diff main...HEAD -- skills/pre-execution-review/references/POLICY.md` touches only §3 + §4 hunks (§1, §2, §5–§8 byte-identical), `git diff --name-only main...HEAD` lists only the In-scope surfaces, and the discipline-suite diff removes no existing assertion (additions + equal-strength rewrites only) — read-verified walks recorded in the phase entry.
- [ ] Append the Jin & Chen entry (arXiv:2603.00539) under a bottom References section in the repository README (created there if absent, deduped against other features' entries) and verify the AC13 version surface (four minor bumps + four CHANGELOG rows) — read-verified walk of the bump-skill output diff recorded.
- [ ] Close the unit's progress, testing, and known-issues ledgers truthfully and verify the frozen acceptance-manifest blob (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md`) at the terminal HEAD.
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
