# fix/303-investigate-orient-ask

> Fix specification — one single unit document. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. This is the same closed 14-section unit
> doc `scripts/unit-route.mjs --triage` reads for a feature; the fix
> template keeps four extra sections (`Issue`, `Branch`, `Depends on`,
> `Regression scope`) on top. Legacy fix templates with separate
> PLAN/ACCEPTANCE files are not migrated (see Non-goals).

## Issue

`#303` — tracked issue in the project's forge. The PR must close it via
`Closes #303` in the body.

## Objective

Separate the lane's design and plan phases into three distinct stages —
**investigate** (discovering facts), **orient** (filtering gaps against
prior decisions and constraints), and **ask** (requesting user decisions) —
so the orchestrator never self-validates its own output. Each stage has a
fixed output contract and a hand-off boundary; the next stage reads only
the previous stage's output, never the raw context.

## Why

The lane's design and plan steps run the gap-interview, AC induction, and
prior-decisions-sweep in a single context where the orchestrator both
produces the output and later validates it. This is the same failure mode
that burned unit fix-258 through 12 review→fold cycles:

- S1: "every cycle since 3 re-verified each folded row at its own
  `file:line` but never re-read the folded text as an instruction chain"
- S2: "the fold's own declared validators and manifests were never re-run
  after its last edits"
- S3: "every cycle since 3 re-verified each folded row in isolation from
  the fold that followed it"
- S4: "a commit cannot contain the sha that names it"

The roadmap row 68 references this as "Related knowledge-honesty unit:
row #303 (design/plan investigate-orient-ask, independent and prioritized)."

The fix is structural: three phases, three output contracts, no self-review.

## User outcome

A designer running the lane can point to each stage's output (facts,
filter results, user decisions) and verify that the next stage read only
the previous stage's output — no hidden context, no self-validation loop.
A reviewer can confirm the separation by checking that `investigate.md`,
`orient.md`, and `ask.md` (or their embedded equivalents) each carry a
fixed schema.

## Acceptance criteria

- AC1 (investigate): `skills/unit-lane/references/DESIGN.md` carries a
  new `## Investigate` section that runs the gap-interview, produces a
  fixed output contract (`- <fact>: <source> · <certainty>`), and writes
  findings to the unit doc's `decisions.md` as `investigate` rows before
  the gap-interview runs. **Validator:** `grep -c "^## Investigate"
  skills/unit-lane/references/DESIGN.md` → 1 (exactly one section,
  not nested under another heading).

- AC2 (orient): `skills/unit-lane/references/DESIGN.md` carries a new
  `## Orient` section that filters each investigated fact through the
  gap-filter table and produces a fixed output (`- <gap>: <filter-result> · <action>`). **Validator:**
  `grep -c "^## Orient" skills/unit-lane/references/DESIGN.md` → 1
  (exactly one section).

- AC3 (ask): `skills/unit-lane/references/DESIGN.md` carries a new
  `## Ask` section that batches user decisions from the Orient output,
  with the constraint that it reads only the Orient output (not the raw
  investigate facts). **Validator:** the Ask section references `Orient output`
  as its input.

- AC4 (plan separate): `skills/unit-lane/references/PLAN.md` carries an
  analogous separation: the prior-decisions-sweep becomes an **Orient**
  stage (reading investigate output), and task-cutting becomes a separate
  **Ask** stage. **Validator:** `grep -c "^## Orient\|^## Ask"
  skills/unit-lane/references/PLAN.md` → at least 2.

- AC5 (no self-validation): Neither DESIGN.md nor PLAN.md contains a
  section that validates its own output. **Validator:** the grep in the
  Forbidden section is a prohibition, not self-validation.

- AC6 (golden fixture): A throwaway copy validates the three-stage grammar.
  **Validator:** fixture removed after verification.

- AC7 (ROADMAP reference): `docs/features/ROADMAP.md` row 68 references
  the fix unit's folder. **Validator:** `grep -c "303" docs/features/ROADMAP.md` → ≥ 1.

- AC8 (no regression on existing skills): The existing `unit-lane/SKILL.md`
  closing block and hand-off tokens remain unchanged.

- AC9 (versions bumped): unit-lane SKILL.md frontmatter and CHANGELOG
  table carry version 2.1.0; pi package carries version 0.24.3.

- AC10 (unit-route): No change needed to `scripts/unit-route.mjs`.

- AC11 (phase-lint): The new section structure does not break phase-lint.

- AC12 (skill context budgets): The reference file changes do not exceed
  catalog ceilings. **Validator:** `bun scripts/check-skill-context.mjs`
  → exit 0.

## Impact

- `skills/unit-lane/references/DESIGN.md` — gains three sections (Investigate,
  Orient, Ask); the existing gap-interview mechanics are preserved but
  re-organized.
- `skills/unit-lane/references/PLAN.md` — gains an Orient section and an
  Ask section; the prior-decisions-sweep is preserved in the Orient stage.
- `docs/features/ROADMAP.md` — row 68 gains a reference to the fix unit.
- `docs/fix/README.md` — new index row.
- `CHANGELOG.md` — bump unit-lane version + companion row + pi package row.
- `packages/pi-agentic-workflow/package.json` — bump pi package version.
- `skills/unit-lane/SKILL.md` — version bump 2.0.0 → 2.1.0.

## Non-goals

- No changes to the lane conductor (`unit-lane/SKILL.md`) closing block or
  hand-off tokens — preserved byte-for-byte.
- No changes to the triage catalog (`scripts/catalog.json`) — `design` and
  `plan` remain as they are.
- No changes to `execute-phase` — the executor reads the unit doc's tasks.
- No changes to the review pack (`review-change`, `fold-findings`, etc.) —
  those are the self-approval surface this fix prevents, not the fix itself.
- No changes to `unit-route.mjs` — triage output is unchanged.

## Future

none

## Future cost

none

## Applicable tests

`node --test scripts/*.test.mjs` (root suite),
`bun scripts/check-skill-context.mjs` (budget ceiling),
`bun scripts/check-skill-context.mjs --routes` (route budget ceiling).

## Known pre-existing issues

- None recorded for this unit's scope.

## Tasks

- P1 — Add the `## Investigate` section to DESIGN.md (validator: grep → 1)
- P2 — Add the `## Orient` section to DESIGN.md (validator: grep → 1)
- P3 — Add the `## Ask` section to DESIGN.md (validator: grep for Orient input)
- P4 — Add Orient and Ask sections to PLAN.md (validator: grep → ≥ 2)
- P5 — Verify no self-validation sections exist
- P6 — Create golden fixture, validate, remove it
- P7 — Update ROADMAP.md row 68 (validator: grep -c "303" → ≥ 1)
- P8 — Register the fix in docs/fix/README.md (validator: grep for 303 in index)
- P9 — Bump versions: unit-lane 2.0.0→2.1.0, pi package 0.24.2→0.24.3, CHANGELOG rows
- P10 — Run all tests (validator: all four commands exit 0)
  - `node --test scripts/*.test.mjs`
  - `bun scripts/check-skill-context.mjs`
  - `bun scripts/check-skill-context.mjs --routes`

### Planning evidence

| id | claim | source | status |
|---|---|---|---|
| PE-001 | The lane's design and plan steps self-validate | fix-258 review-findings.md cycles 3–12 | verified |
| PE-002 | ROADMAP row 68 references #303 as "design/plan investigate-orient-ask" | docs/features/ROADMAP.md:78 | verified |
| PE-003 | Three-stage separation (investigate, orient, ask) is the fix direction | LOGS.md:3151 (owner decision) | verified |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | This fix is structural, not behavioral — no existing skill's execution contract changes | P1–P5 | unit-lane author | grep validators at P1–P5 | read-verified |
| O2 | ROADMAP row 68 must reference #303 after this fix ships | P7 | unit-lane author | grep in ROADMAP.md | read-verified |
| O3 | No regression on unit-lane/SKILL.md closing block | P9 | unit-lane author | diff against base commit | read-verified |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| (filled during execution) | | | | |

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

## Next

Draft complete; hand off for owner review.

## References

- Issue: [#303](https://github.com/gtrabanco/agentic-workflow/issues/303)
- ROADMAP row 68 (subagent-first-execution): "Related knowledge-honesty unit: fix #303 (design/plan investigate-orient-ask, independent and prioritized) — [SPEC](../../fix/303-investigate-orient-ask/SPEC.md)"
- fix-258 review cycle history: 12 review→fold cycles, root cause = self-validation
- LOGS.md entry 3151: "the owner ruled the 12-cycle pattern a workflow defect"

## Branch

`fix/303-investigate-orient-ask`

## Depends on

none

## Regression scope

n/a — this fix changes prose only (reference files and docs). No executable
code, no behavioral contract changes. Verified that existing skills and
scripts continue to operate against the modified reference files by running
phase-lint and check-skill-context.
