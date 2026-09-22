# Feature workflow — the adaptive lane (end-to-end)

The lane replaces the old fixed pipeline (`design-feature` → `review-spec` →
`plan-feature` → `review-plan` → `execute-phase` → `review-change` →
`audit-pr`). Every unit is now **one `SPEC.md`** under
`docs/features/<NN>-<slug>/` containing a closed 13-section list, and the steps
a unit needs are decided by a triage pass against a catalog of closed steps
(research, design, plan, implement, tests, evidence, review, docs, release).

```
unit doc → triage → catalog steps (order depends on unit scope)
  → evidence → review → release
```

## The unit document

Every NEW unit (feature or fix) produces exactly one `SPEC.md` with these
mandatory sections:

1. **Objective** — what this unit delivers and why
2. **Why** — the problem or gap
3. **User outcome** — from the user's perspective
4. **Acceptance criteria** — numbered, scenario-induced list
5. **Non-goals** — what this unit is NOT
6. **Future cost** — standing obligations on future work
7. **Applicable tests** — triage-decided; `n/a` when no tests step
8. **Known pre-existing issues** — each marked `affects` / `does-not-affect`
9. **Tasks** — P1…Pn with stable IDs
10. **Evidence** — what was run, exit status, observed output, verified-by
11. **Progress log** — dated `YYYY-MM-DD HH:MM` entries per step
12. **Next** — the single next action
13. **References** — issues, roadmap rows, related material

Legacy multi-file units (separate PLAN/TASKS/ACCEPTANCE) remain as-is — new units
use the single-file format only.

## Stage 0 — Triage

The triage step reads the unit's scope from the first-pass SPEC content and
returns a deterministic ordered list of steps the unit needs.

Invoke `node scripts/unit-route.mjs --triage <NN>` to get:
- **Steps** the unit needs (from the closed catalog)
- **Skipped** steps and why
- **Budget** tier (`strong` or `cheap`)

Example outputs:
- Docs-only change → `[docs, evidence]` — no tests, no code review, no plan
- Trivial fix (color change) → `[implement, evidence]` — no tests, no review
- Core-logic feature → full ordered list including `tests` and `review`

**Triage rules** (from `scripts/catalog.json`):

| Unit condition                     | Steps returned                                                        | Skipped reason(s)                               |
|------------------------------------|-----------------------------------------------------------------------|-------------------------------------------------|
| `type:docs`                        | `docs, evidence`                                                      | research, design, plan, implement, tests, review, release (docs/chore/unit) |
| `type:chore`                       | `implement, evidence`                                                 | research, design, plan, tests, review, docs, release (not code unit / chore) |
| `scope:trivial` (feature/fix/chore)| `implement, evidence`                                                 | research, design, plan, tests, review, docs, release (trivial scope) |
| `feature` + non-trivial + small/standard | `research, design, plan, implement, tests, evidence, review, docs` | release (small scope)                           |
| `fix` + non-trivial                | `plan, implement, tests, evidence, review, docs` (or `implement, tests, evidence, review, docs` if scope trivial) | research, design, release (not a feature) |
| `feature` + medium/large/xlarge    | all 9 steps (research → release)                                      | none                                            |

Execution order: research → design → plan → implement → tests → evidence →
review → docs → release. The catalog returns a filtered, ordered subset.

## Stage 1 — Catalog steps

Each step in the triage-decided order is a bounded phase:

| Step | What it does |
|---|---|
| **research** | Domain research for new features (non-trivial only) |
| **design** | Capability closure, expectation sweep (non-trivial features only) |
| **plan** | Architecture impact, phased plan (code units, non-trivial) |
| **implement** | Write the code/tests (every non-docs unit) |
| **tests** | Write and run tests (core-logic units) |
| **docs** | Documentation updates (docs units, non-trivial code units) |
| **evidence** | Verify each acceptance criterion with run evidence |
| **review** | Independent review pass (code units, non-trivial) |
| **release** | Release preparation (medium+ features) |

Each step runs as an atomic gate/commit. If a step's diff exceeds its budget
(defined per step in the catalog), the unit is expelled for re-triage.

### Diff-size guard

`scripts/diff-guard.mjs` measures `git diff --stat` at phase boundaries. If the
diff exceeds the phase budget, the unit is flagged for mandatory re-triage.

**Anti-gaming rule (code):** "NEVER shrink a diff by deleting comments, blank
lines, docs or tests."

## Stage 2 — Evidence

After all catalog steps complete, the unit gathers evidence for each acceptance
criterion: what was run, exit status/digest, observed output, and who verified.
Evidence is verified, not claimed — a reviewer re-runs it.

## Stage 3 — Review

The lane's review step runs only the reviews that apply to the unit. Findings
are classified (fix-now / replan-in-unit / decision-required / proposal /
ignore) and either folded into the current phase or surfaced for user triage.

## Stage 4 — Release

For medium+ features, the release step handles version bumps, changelog entries,
migration notes, and deprecation notices. For XS/small units, this step is
skipped by triage.

## Diff-size guard bite example

If a phase produces a 200-line diff against a 50-line budget:
1. The guard detects the overflow at the phase boundary
2. The unit is expelled from the light path
3. Mandatory re-triage: `node scripts/unit-route.mjs --triage <NN>`
4. The triage may route to a new set of steps or flag for `replan`

## Worked example

```
# New feature unit: docs/features/62-some-feature/SPEC.md (complete, 13 sections)
node scripts/unit-route.mjs --triage 62
  → Steps: design, implement, tests, evidence, review
  → Skipped: research (not a new domain), plan (not code unit), docs (not docs unit), release (small scope)
  → Budget: strong

# Run catalog steps in order:
# design → implement → tests → evidence → review
# Each step: atomic gate + commit

# When complete:
# PR opens, roadmap row → done
```

## What was removed (feature 61 P8)

The old fixed pipeline is retired. These skills are no longer standalone commands:

- `design-feature` → absorbed into the `design` catalog step
- `plan-feature` / `plan-feature-scaffold` / `plan-feature-from-issue` → absorbed into the `plan` catalog step
- `plan-fix` → absorbed into the lane's fix mode
- `review-spec` / `review-plan` → absorbed into the lane's `review` catalog step
- `planning-preflight` / `replan-findings` → absorbed into triage and replan logic
- `implementation-discovery` / `evidence-grounding` → absorbed into the evidence step

The functionality survives as catalog steps within the lane. `unit-lane` is the
conductor; `execute-phase` remains the executor.

## Context hygiene

- End of a unit or phase → `/log-session`, then a NEW conversation.
- Hand-offs to review → always a fresh conversation.
- Compact only mid-phase when you hold unpersisted state you cannot afford to lose.