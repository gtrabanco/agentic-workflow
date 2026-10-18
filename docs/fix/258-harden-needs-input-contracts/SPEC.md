# fix/258-harden-needs-input-contracts

> Fix specification — one single unit document.

## Issue

`#258` — tracked issue in the project's forge. The PR must close it via
`Closes #258` in the body.

## Objective

Three surviving skills that interrupt the user for input (`execute-phase`,
`unit-lane`, `init-workspace`) continue past a blank required answer by
inferring defaults. Each gains an explicit needs-input contract: required
input halts (re-ask once, then stop), optional input may default, ambiguous
input must be clarified. Same defect class as `review-change`'s `29b52c63`
fix.

## Why

A skill asks via `ask_user` (or the agent's question mechanism), the user
leaves the answer blank, and the skill proceeds on an inferred assumption.
No downstream gate catches it, so planning, execution and review all run on
a silent assumption. Feature 61 retired `plan-feature-scaffold` and
`plan-fix` (absorbed into `unit-lane`), so the issue's original five-skill
table reduces to the three surviving skills above.

## User outcome

When a required answer is blank, the skill visibly stops with a
`requires manual input` hand-off instead of inventing scope, targets or
consent. The user always knows when the workflow is waiting on them.

## Acceptance criteria

1. `execute-phase` body names the required-input fields (confirmed phase,
   confirmed file targets) and states the guard: blank/assumed required
   input → re-ask once → if still blank, emit
   `→ Next: execute-phase requires manual input — cannot proceed` and stop.
   `read-verified`.
2. `unit-lane` body (including its `references/DESIGN.md` and
   `references/RESEARCH.md` interruption points) applies the same guard to
   its required inputs (unit kind, acceptance criteria, scope/intent). Unit
   kind has no silent `feature` default; vague requests STOP instead of
   inferring. `read-verified`.
3. `init-workspace` body states that consent for installs/hooks/overwrites
   is mandatory: blank or absent consent → re-ask once → halt; no default
   consent. `read-verified`.
4. Each of the three skills' `## Turn contract` includes a
   `Required user inputs were answered concretely (not defaulted)` box.
   `read-verified`.
5. Root suites pass: `node --test scripts/*.test.mjs` — exit 0.
6. All bumped skills appear in `CHANGELOG.md` (version rows) and
   `README.md` (skill table cells unchanged semantics). `read-verified`.

## Non-goals

- No changes to skills other than the three listed (`triage-issue` already
  refuses to proceed without a classification).
- No new runtime script or machine gate for interactive input — this is a
  skill-body contract, enforced by the executing agent.
- No recovery of the absorbed `plan-feature-scaffold` / `plan-fix` skills.
- No golden-fixture interactive-path test — the fixture does not exercise
  interactive input; the existing deterministic suites are the regression
  gate.

## Future

none

## Future cost

none — the guard clauses are prose contracts; no standing script
obligation.

## Applicable tests

Root suites (`node --test scripts/*.test.mjs`) plus
`bun scripts/check-skill-context.mjs` (the three edited `SKILL.md` files
must stay within their enforced line/token budgets). Halt behavior itself is
verified manually per skill (read-verified ACs 1–3) — interactive paths are
not exercised by the suites.

## Known pre-existing issues

none recorded — no known red gate or open defect affects this unit.

## Tasks

- P1 — Audit the three skills' input points and record the
  required/optional/ambiguous classification in this doc's Input audit
  section (validator: `grep -q "### Input audit" docs/fix/258-harden-needs-input-contracts/SPEC.md` exits 0)
  - Relevant files: skills/execute-phase/SKILL.md, skills/unit-lane/SKILL.md,
    skills/unit-lane/references/DESIGN.md, skills/unit-lane/references/RESEARCH.md,
    skills/init-workspace/SKILL.md
- P2 — Add the needs-input guard (re-ask once → halt with
  `requires manual input`) and the Turn-contract box to `execute-phase`
  (validator: `grep -c "requires manual input" skills/execute-phase/SKILL.md` ≥ 1 and `grep -q "Required user inputs" skills/execute-phase/SKILL.md` exits 0)
  - Relevant files: skills/execute-phase/SKILL.md
- P3 — Add the needs-input guard and Turn-contract box to `unit-lane` and its
  interruption references `DESIGN.md` / `RESEARCH.md` (validator:
  `grep -c "requires manual input" skills/unit-lane/SKILL.md skills/unit-lane/references/DESIGN.md skills/unit-lane/references/RESEARCH.md` totals ≥ 2 and `grep -q "Required user inputs" skills/unit-lane/SKILL.md` exits 0)
  - Relevant files: skills/unit-lane/SKILL.md, skills/unit-lane/references/DESIGN.md,
    skills/unit-lane/references/RESEARCH.md
- P4 — Add the mandatory-consent guard and Turn-contract box to
  `init-workspace` (validator: `grep -c "requires manual input" skills/init-workspace/SKILL.md` ≥ 1 and `grep -q "Required user inputs" skills/init-workspace/SKILL.md` exits 0)
  - Relevant files: skills/init-workspace/SKILL.md
- P5 — Run `bump-skill` for the three edited skills: version bumps, CHANGELOG
  rows, README cells (validator: `grep -cE "^(\\|.*258|.*harden-needs-input)" CHANGELOG.md` ≥ 3 — one row per bumped skill)
  - Relevant files: CHANGELOG.md, README.md, skills/*/SKILL.md (version fields)
- P6 — Verification: root suites + context budgets (validator:
  `node --test scripts/*.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs` exits 0)
  - Relevant files: scripts/, skills/

### Prior-decisions sweep

Keyword sweep over the candidate sources (`docs/fix/258-harden-needs-input-contracts/decisions.md` —
not yet created; `docs/features/19-architectural-invariants/{decisions,architecture-notes}.md`;
`docs/workflow/REPOSITORY_STATE.md`; `AGENTS.md`) against the plan's claims.
No candidate matched the claims except the label rule below; the sweep is
advisory and issues no verdict.

| claim | prior decision | source path | relation |
|---|---|---|---|
| tasks are labeled `P1…P6` | phases are labeled `P1, P2, …`, never `S1`/`Step N`, in any PLAN/TASKS/SPEC artifact | AGENTS.md:124 | `compatible` |

### Input audit

Filled by P1 (one table per skill; every interruption point classified
`required` / `optional` / `ambiguous`, with its current blank-answer behavior
and the post-fix behavior).

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | `plan-feature-scaffold` and `plan-fix` no longer exist as skills — feature 61 absorbed them into `unit-lane`, so the issue's five-skill table reduces to three | `ls skills/` (no such directories); `docs/fix/README.md` row #258; issue #258 title | verified 2026-10-18 | O1, O2, O3 |
| PE-002 | file-read | among surviving skills, only `execute-phase`, `unit-lane` (+ its `DESIGN.md`/`RESEARCH.md` references) and `init-workspace` carry user-interruption points; `triage-issue` already refuses to proceed without a classification | `grep -rln "ask the user" skills/*/SKILL.md`; `skills/triage-issue/SKILL.md` | verified 2026-10-18 | O1, O2, O3 |
| PE-003 | issue-text | the fix follows the same defect-class pattern as the `review-change` commit `29b52c63` cited by the issue — **unverified: that commit is not a valid object in this repository** (`git cat-file -t 29b52c63` fails); the pattern is taken from the issue's narrative only | issue #258 §Problem; local `git cat-file` | ASSUMPTION-UNVERIFIED 2026-10-18 | O1, O2, O3 |
| PE-004 | file-read | the golden fixture does not exercise interactive input paths, so the root suites are the regression gate for this prose-only change | issue #258 §Proposed approach step 4; `docs/workflow/GOLDEN_FIXTURE.md` | verified 2026-10-18 | O6 |
| PE-005 | file-read | the three edited `SKILL.md` files are under enforced context budgets — added guard text must stay within them, checked by `scripts/check-skill-context.mjs` | `scripts/check-skill-context.mjs`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | verified 2026-10-18 | O6 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | SPEC AC1 / issue #258 AC1 | `execute-phase` never proceeds past a blank required phase/target answer: re-ask once, then halt with `requires manual input`; Turn contract gains the required-inputs box | P2 | P2 | `execute-phase` body | `grep -c "requires manual input" skills/execute-phase/SKILL.md` ≥ 1 | guard text + `✓ Required user inputs…` box in `skills/execute-phase/SKILL.md` | planned |
| O2 | SPEC AC2 / issue #258 AC1 | `unit-lane` never defaults unit kind or infers scope from a blank/vague answer; `DESIGN.md`/`RESEARCH.md` interruption points state the same guard; Turn contract gains the box | P3 | P3 | `unit-lane` body + references | `grep -c "requires manual input" skills/unit-lane/SKILL.md skills/unit-lane/references/DESIGN.md skills/unit-lane/references/RESEARCH.md` totals ≥ 2 | guard text + box in `skills/unit-lane/SKILL.md` and references | planned |
| O3 | SPEC AC3 / issue #258 AC3 | `init-workspace` never proceeds without explicit consent: blank/absent consent → re-ask once → halt, no default consent; Turn contract gains the box | P4 | P4 | `init-workspace` body | `grep -c "requires manual input" skills/init-workspace/SKILL.md` ≥ 1 | guard text + box in `skills/init-workspace/SKILL.md` | planned |
| O5 | SPEC AC6 / issue #258 AC5 | the three bumped skills appear in `CHANGELOG.md` and `README.md` | P5 | P5 | `bump-skill` | `grep -cE "258" CHANGELOG.md` ≥ 3 | CHANGELOG rows + README cells for the three skills | planned |
| O6 | SPEC AC5 / issue #258 AC4 | root suites stay green and the edited skills stay within context budgets | P6 | P6 | root gate | `node --test scripts/*.test.mjs` exits 0; `bun scripts/check-skill-context.mjs` exits 0 | Evidence rows in this doc | planned |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

### Triaged steps

```
TRIAGE — 258 (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

## Progress log

2026-10-18 21:16 — SPEC drafted from issue #258, registered in docs/fix/README.md, triage pasted verbatim → e51e2b4f — next: plan
2026-10-18 21:30 — plan step: tasks P1–P6 cut with validators, prior-decisions sweep run (1 compatible hit, AGENTS.md:124), planning ledgers cut (PE-001–005, O1–O6 minus O4 folded into O1–O3) — next: implement P1 (input audit)

## Next

Implement P1 — audit the three skills' input points and fill the Input audit section.

## References

- Issue #258 (feat(skills): harden needs-input interactive contracts)
- `review-change` fix `29b52c63` (same defect class, referenced by the issue)
- Feature 61 (lane absorption — why only three skills survive)

## Branch

`fix/258-harden-needs-input-contracts`

## Depends on

none

## Regression scope

- All existing skill wording and behavior outside the guard clauses —
  verified by `node --test scripts/*.test.mjs` (root suites, including the
  golden fixture's deterministic half) and `bun scripts/check-skill-context.mjs`.
- `n/a` beyond that: the guards are additive prose; no runtime behavior changes.
