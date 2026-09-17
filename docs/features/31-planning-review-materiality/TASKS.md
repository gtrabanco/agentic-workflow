# TASKS — 31-planning-review-materiality

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit. The discipline
pins are written red-first inside each phase and made green by that phase's
edits — never edited to pass; they are rows of one declared planning pin table
whose row floor and discrimination leg make a vacuous pin set fail (F02, AC14).
One version bump per skill per PR (E-D31-1 in `decisions.md`).

## P1 — Move the planning materiality line to report-note semantics

Layer: docs · Done-when: `bun test scripts/review-loop-discipline.test.mjs &&
grep -q "PLANNING_PIN_TABLE" scripts/review-loop-discipline.test.mjs` → exit 0
with the report-note, CHECKS-materiality, and anti-deflation pins green as the
first four rows of the planning pin table (`PLANNING_PIN_FLOOR = 4`, liveness
and discrimination legs green) and every existing assertion still passing.

- [ ] Pin the report-note contract red-first against the new §3 wording of `skills/pre-execution-review/references/LEDGERS.md`: the assertion lands in the new planning-side pin table of the discipline suite (task 7 owns the table shell) and states that a `low` planning finding is persisted, visible, non-blocking, never a re-review trigger by itself, resolvable by the stage author without a re-review, with material = `medium`+; the row carries the superseded sentence “info is the only immaterial one” as its discrimination sample (F02).
- [ ] Edit `skills/pre-execution-review/references/LEDGERS.md` §3: replace the "`info` is the only immaterial one" sentence with the report-note materiality line (material = `medium`+; a `low` finding is a persisted, visible, non-blocking report-note) and the anti-deflation carry-over (a real defect mislabeled `low` classifies at `medium` minimum; deflating a severity to dodge a review is itself a review defect), keeping the row shape, the writer map, and the append-only contract untouched.
- [ ] Pin the materiality restatement red-first against the new wording of `skills/review-spec/references/CHECKS.md` + `skills/review-plan/references/CHECKS.md` in the discipline suite: both files state material = `medium`+ and carry the anti-deflation rule; each is a table row (task 7) whose discrimination sample is the superseded “Material = anything above info” sentence it replaces (F02).
- [ ] Edit `skills/review-spec/references/CHECKS.md` + `skills/review-plan/references/CHECKS.md`: replace "Material = anything above `info`" with "Material = `medium`+" plus the report-note sentence (a `low` finding never blocks, never triggers a re-review by itself) plus the anti-deflation sentence, keeping the closed severity vocabulary list unchanged.
- [ ] Bump `pre-execution-review` 2.2.1 to 2.3.0, `review-spec` 1.7.1 to 1.8.0, `review-plan` 1.6.1 to 1.7.0 via the `bump-skill` contract (CHANGELOG rows + README cells; one bump per skill per PR per E-D31-1 — the later re-edits of these skills stay under their P1 versions).
- [ ] Run `bun test scripts/review-loop-discipline.test.mjs` and record the green run in the phase's progress entry (every existing assertion still passing).
- [ ] Declare the planning pin table in the discipline suite (`bun test scripts/review-loop-discipline.test.mjs` is the command that executes it): `PLANNING_PIN_TABLE` as `{ id, doc, must, superseded }` rows, the liveness leg (every `must` matches the live bytes), the discrimination leg (`assertDiscriminating(<row>)` fails a row whose `must` accepts its own `superseded` sample), and the floor `assert.ok(PLANNING_PINS.length >= PLANNING_PIN_FLOOR)` with `PLANNING_PIN_FLOOR = 4` — so a vacuous pin set reddens the suite (an absent, empty, truncated, and trivially-true table all fail) (F02).
- [ ] Prove the pins are mechanically present at the phase head: `bun test scripts/review-loop-discipline.test.mjs && grep -q "PLANNING_PIN_TABLE" scripts/review-loop-discipline.test.mjs` → exit 0, with the four P1 rows, the `assertDiscriminating(` leg and `PLANNING_PIN_FLOOR = 4` recorded in the phase's progress entry (F02, AC14).

## P2 — End the planning repair loop at a hard two-cycle cap

Layer: docs · Done-when: `bun test scripts/review-loop-discipline.test.mjs &&
grep -q "PLANNING_PIN_FLOOR = 8" scripts/review-loop-discipline.test.mjs` →
exit 0 with the cap, verdict-mirror, and REPAIR-mirror pins green as table rows
(floor raised to 8, discrimination leg green) and every existing assertion
still passing.

- [ ] Pin the hard cap red-first against the new §4 wording of `skills/pre-execution-review/references/POLICY.md` in the discipline suite: the second cycle prints the unchanged `CONVERGENCE-ANOMALY` block before any further edit, a third cycle never starts without explicit user instruction, and an unconverged loop ends in `NEEDS-DESIGN` routed to the human; each pin is a row of `PLANNING_PIN_TABLE` (P1) whose discrimination sample is the superseded sentence it replaces, and this phase raises `PLANNING_PIN_FLOOR` to 8 (F02).
- [ ] Edit `skills/pre-execution-review/references/POLICY.md` §4: after the anomaly text, state the hard two-cycle cap with its counting basis (persisted receipts + repair records across the unit's progress and findings ledgers), end an unconverged loop in `NEEDS-DESIGN` routed to the human, scope the repair-turn exemption to authorized cycles, and replace "no cap converts a verdict into a dead end" with the user-gated-stop semantics — the `CONVERGENCE-ANOMALY` block itself stays byte-identical.
- [ ] Pin the verdict-surface mirrors red-first against the new loop text of `skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md` in the discipline suite: both files carry the cap line (`third cycle never starts without explicit user instruction`); each mirror is a table row with its superseded sentence as the discrimination sample (F02).
- [ ] Edit `skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md`: extend the second-cycle loop text with the hard cap and the `NEEDS-DESIGN` end, keeping the receipt-literal lines and the verdict blocks byte-identical (machine-pinned normative grammar).
- [ ] Edit `skills/design-feature/references/REPAIR.md` §4: replace "More cycles stay allowed when correctness needs them" with the cap mirror (a third cycle never starts without explicit user instruction; an unconverged loop ends in `NEEDS-DESIGN`), preserving the §4 heading and the anomaly-first ordering.
- [ ] Bump `design-feature` 3.4.0 to 3.5.0 via the `bump-skill` contract (the three skills bumped in P1 keep their versions — E-D31-1).
- [ ] Run `bun test scripts/review-loop-discipline.test.mjs` and record the green run in the phase's progress entry (cap + mirror pins green; existing assertions unchanged).

## P3 — Route wording-only repairs past the full snapshot re-review

Layer: docs · Done-when: `bun test scripts/review-loop-discipline.test.mjs &&
grep -q "PLANNING_PIN_FLOOR = 9" scripts/review-loop-discipline.test.mjs` →
exit 0 with the wording-only pin green as the ninth table row (the frozen
floor) and every existing assertion still passing.

- [ ] Pin the wording-only route red-first against the new §3 text of `skills/pre-execution-review/references/POLICY.md` in the discipline suite: a recorded wording-only determination routes a cosmetic repair batch without the full snapshot re-review, records the determination in the unit's frozen evidence, and rotates `artifactRevisionId`; the pin is the ninth row of `PLANNING_PIN_TABLE` and this phase raises `PLANNING_PIN_FLOOR` to its frozen value 9 (F02).
- [ ] Edit `skills/pre-execution-review/references/POLICY.md` §3: the opening paragraph keeps the single re-review as the default batch consequence and exempts a recorded wording-only determination; the Wording-only row's forbidden cell keeps the recording requirement and adds the `artifactRevisionId` rotation requirement; the Common-root-cause and Scope-changing rows stay untouched.
- [ ] Run `bun test scripts/review-loop-discipline.test.mjs` and record the green run in the phase's progress entry (wording-only pin green; existing assertions unchanged; no version bump — E-D31-1).

## P4 — Qualify the planning-review-materiality unit

Layer: hardening · Done-when: `bun scripts/check-skill-context.mjs && bun test
scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs
scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
scripts/normative-drift.test.mjs` → exit 0 with every frozen `ACCEPTANCE.md`
validator green at the terminal HEAD (AC14's `PLANNING_PIN_TABLE`,
`assertDiscriminating(` and `PLANNING_PIN_FLOOR = 9` greps included) and the PR
open with `Closes #171`.

- [ ] Re-measure the four bumped skills against the context-budgets manifest and run `bun scripts/check-skill-context.mjs` green, updating the manifest where the declared growth covers the edits.
- [ ] Re-bundle the Pi mirror from the final skill tree by running the package's own bundler with the Pi package root as the working directory — the verbatim command pair is frozen in the acceptance manifest's Commands section (F01) — then run the package's parity suite from the same working directory, so the mirror stays byte-identical to the canonical skill tree.
- [ ] Run the full regression set (discipline + ledger-ownership + pre-execution-quality + ledger-provenance + normative-drift + pre-execution-sensor suites) and record every exit 0 in the phase's progress entry.
- [ ] Run the schema package's suite from its package root and verify `git diff main...HEAD -- packages/agentic-workflow-schema` stays empty (negative integration, AC10).
- [ ] Verify the AC8 + AC9 diff walks at the branch head: the `git diff main...HEAD -- skills/pre-execution-review/references/POLICY.md` walk touches only §3 + §4 hunks (§1, §2, §5–§8 byte-identical), the `git diff --name-only main...HEAD` walk lists only the In-scope surfaces **plus the declared derived-surface set** (every file the bundler rewrote under the Pi package skills tree, the four edited version lines, the README skill-table cells, the CHANGELOG rows) and nothing else, and the `git diff main...HEAD -- scripts/review-loop-discipline.test.mjs` walk removes no existing assertion (additions + equal-strength rewrites only) — the three read-verified walks are recorded in the phase entry (F03).
- [ ] Append the Jin & Chen entry (arXiv:2603.00539) under a bottom References section in the repository README (created there if absent, deduped against other features' entries) and verify the AC13 version surface (four minor bumps + four CHANGELOG rows) — read-verified walk of the bump-skill output diff recorded.
- [ ] Close the unit's progress, testing, and known-issues ledgers truthfully and verify the frozen acceptance-manifest blob (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md`) at the terminal HEAD.
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
