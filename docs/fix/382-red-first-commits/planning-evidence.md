# Planning Evidence — fix/382-red-first-commits

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-11-04,
> `main` @ `1f527d45`) with the command in its `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The sibling rule constrains existence, never ordering: `scripts/structural-sibling-pins.test.mjs` fails an unpaired file but nothing in the repo reads the introducing commits of a pair | `rg -n 'diff-filter|merge-base' scripts/*.test.mjs` → no match outside this unit's plan; `AGENTS.md:144-148` (the bullet) | current | O1–O3 |
| PE-002 | known | `git log --diff-filter=A --format=%H -- <path>` yields the introducing commit of a file deterministically (oldest line), and `git merge-base --is-ancestor A B` exits 0 exactly when A precedes or equals B — the two primitives the gate needs, both plumbing-stable | `git log --diff-filter=A --format=%H -- scripts/structural-sibling-pins.test.mjs` → one SHA; `git merge-base --is-ancestor` used by `scripts/diff-guard.mjs` and the fixture suites | current | O1–O4 |
| PE-003 | known | The root suite neutralizes git signing for throwaway fixture repositories and discovers every `scripts/*.test.mjs` with no registration step, so the new suite joins by existing and its fixtures can commit | `scripts/run-root-suite.mjs` (the git signing neutralization preamble); `node scripts/run-root-suite.mjs` at the cut head → green | current | O9 |
| PE-004 | known | The fixture pattern is established: `mktemp -d` under `TMPDIR`, `git init`, `spawnSync`, assertions on exit and output, removed in a `finally` — `scripts/check-skill-context.test.mjs` and `scripts/golden-fixture.test.mjs` are the precedent shapes this suite copies | `rg -l 'mkdtempSync' scripts/*.test.mjs` → `check-skill-context.test.mjs`, `golden-fixture.test.mjs`, `skill-lint.test.mjs` | current | O1–O5 |
| PE-005 | known | `execute-phase` has 20 lines of budget headroom (349 of `mainLinesMax` 369) and `unit-lane` 28 (291 of 319): the SKILL.md edits must be rewraps; the step-detail home is `unit-lane/references/TESTS.md` and `IMPLEMENT.md`, which own the tests/implement checklists and carry no SKILL.md budget | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`execute-phase` 369, `unit-lane` 319); `wc -l` → 349 / 291 | current | O6, O7 |
| PE-006 | known | `IMPLEMENT.md` currently forbids "Never commit red (test failure)" with no exception — unamended, it contradicts the red-first ceremony it must carry | `skills/unit-lane/references/IMPLEMENT.md:64` | current | O6 |
| PE-007 | known | `scripts/test-route-map.json` is a declared normative surface whose unmatched paths run the full gate; a new `scripts/red-first.*` pair needs its own route row or every run of the pair falls back to the full gate | `scripts/test-route-map.json` (`description`, `routes[].globs`); `scripts/test-route.test.mjs` (the map's own pin) | current | O9 |
| PE-008 | known | Changesets can declare skills, and a skills change must ship with a `.changeset/` intent file (the version-parity gate's content half) — the two touched skill surfaces are `execute-phase` and `unit-lane` | `.changeset/feat-357-skill-smells-….md` (the `"skill-lint": minor` precedent); `AGENTS.md` (the version-parity rule) | current | O9 |

## Verification

Re-sampled on the change tree before hand-off; the runs are `E`/`G` lines in the
unit doc's `## Log`.
