# Obligations — fix/382-red-first-commits

> One row per normative behaviour, compatibility invariant, affected use case and
> required failure state. Frozen at cut except `status`. Every row flips to
> `verified` only after its validator ran in the foreground; the run is recorded
> in the unit doc's `## Log` (`E`/`G` lines) and summarised in the last cell.

## Ledger

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | a new script+suite pair committed together after the gate's introduction is a finding — the red-first ceremony has no evidence — including a pair that was added, deleted and re-added together (its latest add is the one that counts) | P3 | P2, P3 | `scripts/red-first.mjs` | `node --test scripts/red-first.test.mjs` exits 0 with the same-commit and re-added-together fixture cases passing | the case names and the fixtures' FAIL verdicts, in the Log (E8) | verified |
| O2 | S2 | a test-first pair (suite commit observed red, implementation commit after) passes the gate | P3 | P2, P3 | `scripts/red-first.mjs` | `node --test scripts/red-first.test.mjs` exits 0 with the test-first fixture case passing | the case name and the fixture's PASS verdict, in the Log | verified |
| O3 | S2 | an implementation-first pair (suite added later than the script, both after the cutoff) is a finding — a late suite is not red-first evidence | P3 | P2, P3 | `scripts/red-first.mjs` | `node --test scripts/red-first.test.mjs` exits 0 with the implementation-first fixture case passing | the case name, in the Log | verified |
| O4 | S2, S5 | the shipped tree passes: every pair introduced at or before the gate's own commit is grandfathered, and a suite with no implementation sibling is out of scope | P3 | P2, P3 | `scripts/red-first.mjs` | `node scripts/red-first.mjs` exits 0 with `verdict: PASS`, and the no-pair fixture case passes | both outputs, in the Log | verified |
| O5 | S2 | the gate is read-only, offline, dependency-free and byte-stable: two runs over the same history print the same block and write nothing | P3 | P3 | `scripts/red-first.mjs` | the suite's determinism/no-write case passes (`git status --porcelain` unchanged, two runs byte-identical) | the case name, in the Log | verified |
| O6 | S3 | the tests step commits red before the implementation commits green, per task, and the evidence names both commits; "Never commit red" carries the one sanctioned exception | P4 | P4 | `skills/unit-lane/references/TESTS.md` + `IMPLEMENT.md` | `rg -c 'red-first' skills/unit-lane/references/TESTS.md skills/unit-lane/references/IMPLEMENT.md` matches ≥1 per file | the two counts, in the Log | verified |
| O7 | S3, S4, S6 | the rule and its evidence shape are stated in `AGENTS.md`, `FEATURE_WORKFLOW.md` and `execute-phase` without breaking any context budget | P4 | P4 | `AGENTS.md`, `docs/workflow/FEATURE_WORKFLOW.md`, `skills/execute-phase/SKILL.md` | `bun scripts/check-skill-context.mjs` exits 0, and `rg -c 'red commit' AGENTS.md docs/workflow/FEATURE_WORKFLOW.md` matches ≥1 per file | both outputs, in the Log | verified |
| O8 | S1, S6 | the gate's own pair lands red-first: the suite's introducing commit precedes the implementation's, and both runs are recorded | P2, P3 | P2, P3 | git history | `git log --diff-filter=A --format=%H -- scripts/red-first.test.mjs scripts/red-first.mjs` lists two distinct commits with the test's first | the two SHAs, in the Log | verified |
| O9 | S2, S6 | nothing that passed before regresses: the root gate stays green with the new suite discovered, the changeset is valid, and pair existence is still enforced | P5 | P5 | repo | `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/lint-changeset.mjs` exits 0, and `node --test scripts/structural-sibling-pins.test.mjs` exits 0 | the three tallies, in the Log | verified |
