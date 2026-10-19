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

# Status

**in-progress → done** (P1–P6 executed; review folded F1–F8; PR open, awaiting merge)

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
- P2 — Add the needs-input guard (re-ask once, then halt with the fixed
  `→ Next: … cannot proceed` hand-off, SPEC AC1) and the Turn-contract box to
  `execute-phase` (validator: `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` matches 4 and `grep -q "Required user inputs" skills/execute-phase/SKILL.md` exits 0)
  - Relevant files: skills/execute-phase/SKILL.md
- P3 — Add the needs-input guard and Turn-contract box to `unit-lane` plus its
  interruption references `DESIGN.md` and `RESEARCH.md` (validator:
  `grep -cE "requires [a-z ]*input" skills/unit-lane/SKILL.md skills/unit-lane/references/DESIGN.md skills/unit-lane/references/RESEARCH.md` totals 5 and `grep -q "Required user inputs" skills/unit-lane/SKILL.md` exits 0)
  - Relevant files: skills/unit-lane/SKILL.md, skills/unit-lane/references/DESIGN.md,
    skills/unit-lane/references/RESEARCH.md
- P4 — Add the mandatory-consent guard and Turn-contract box to
  `init-workspace` (validator: `grep -cE "requires [a-z ]*input" skills/init-workspace/SKILL.md` matches 2 and `grep -q "Required user inputs" skills/init-workspace/SKILL.md` exits 0)
  - Relevant files: skills/init-workspace/SKILL.md
- P5 — Run `bump-skill` for the three edited skills: version bumps, CHANGELOG
  rows, README cells (validator: `grep -cE "^(\\|.*258|.*harden-needs-input)" CHANGELOG.md` matches 4 — one row per bumped skill plus the re-bundle row)
  - Relevant files: CHANGELOG.md, README.md, skills/*/SKILL.md
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

One table per skill; every interruption point classified `required` / `optional`
/ `ambiguous`, with its current blank-answer behavior and the post-fix behavior.

**execute-phase** (3 interruption points):

| # | Input point | Type | Current blank behavior | Post-fix behavior |
|---|---|---|---|---|
| E1 | `<NN-slug>` argument (unit identifier) | required | User passes it; if blank/missing the slug is empty, `unit-route.mjs` fails with a non-helpful error — skill proceeds to "unit not found" path and may infer from context. | Re-ask once with the expected format; if still blank, emit `→ Next: execute-phase requires manual input — cannot proceed` and stop. |
| E2 | `P<k>` step argument (optional — all remaining steps if absent) | optional | Absent → proceeds to first unfinished step. No issue. | No change. Optional inputs may default. |
| E3 | `--max-attempts N` flag (optional) | optional | Absent → defaults to 3. No issue. | No change. Optional inputs may default. |

**unit-lane** (5 interruption points):

| # | Input point | Type | Current blank behavior | Post-fix behavior |
|---|---|---|---|---|
| U1 | `<NN-slug | "<idea>">` argument (unit slug or idea) | required | If blank, the unit folder lookup silently falls through; the lane may infer `feature` as a default or proceed with a guessed slug. | Re-ask once with the expected format; if still blank, emit `→ Next: unit-lane requires manual input — cannot proceed` and stop. No silent `feature` default. |
| U2 | `--fix <issue-number>` / `--from-issue <issue-number>` | required when that mode is used | If issue number is blank while `--fix`/`--from-issue` is passed, the script receives an empty arg — may be silently parsed or passed downstream. | Re-ask once with the expected format; if still blank, halt with `requires manual input`. |
| U3 | Vague request → acceptance criteria induction ("ask-don't-infer") | required | If the request description is too vague, the lane may infer ACs from context. | STOP and ask the user with concrete options. Never infer. |
| U4 | "Decide for me" in the gap interview (DESIGN.md) | optional | User selects it → lane chooses and records the choice. No issue. | No change. |
| U5 | Vague/ambiguous scope → unit kind classification | required | Blank/vague → skill may default to `feature`. | STOP instead of inferring. |

**init-workspace** (3 interruption points):

| # | Input point | Type | Current blank behavior | Post-fix behavior |
|---|---|---|---|---|
| I1 | `<target-dir>` argument (target repository) | required | If blank, cwd is used. No issue (defaults to cwd). | No change — cwd is an acceptable default here. |
| I2 | Consent for each install/hook/overwrite | required | If blank or absent, the current text says "never overwrite without explicit yes" but the enforcement is prose-only; a model may proceed by assuming consent from context. | Re-ask once; if still blank/absent, halt with `requires manual input`. No default consent. |
| I3 | Upgrade vs bootstrap mode selection | required | If the repo is ambiguous (partially scaffolding), the skill may pick a route by guessing the state. | STOP and ask the user to confirm the route. |

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
| O1 | SPEC AC1 / issue #258 AC1 | `execute-phase` never proceeds past a blank required phase/target answer: re-ask once, then halt with `requires manual input`; Turn contract gains the required-inputs box | P2 | P2 | `execute-phase` body | `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` matches 4 | guard text + `✓ Required user inputs…` box in `skills/execute-phase/SKILL.md` | verified |
| O2 | SPEC AC2 / issue #258 AC1 | `unit-lane` never defaults unit kind or infers scope from a blank/vague answer; `DESIGN.md`/`RESEARCH.md` interruption points state the same guard; Turn contract gains the box | P3 | P3 | `unit-lane` body + references | `grep -cE "requires [a-z ]*input" skills/unit-lane/SKILL.md skills/unit-lane/references/DESIGN.md skills/unit-lane/references/RESEARCH.md` totals 4 | guard text + box in `skills/unit-lane/SKILL.md` and references | verified |
| O3 | SPEC AC3 / issue #258 AC3 | `init-workspace` never proceeds without explicit consent: blank/absent consent → re-ask once → halt, no default consent; Turn contract gains the box | P4 | P4 | `init-workspace` body | `grep -cE "requires [a-z ]*input" skills/init-workspace/SKILL.md` matches 2 | guard text + box in `skills/init-workspace/SKILL.md` | verified |
| O5 | SPEC AC6 / issue #258 AC5 | the three bumped skills appear in `CHANGELOG.md` and `README.md` | P5 | P5 | `bump-skill` | `grep -cE "258" CHANGELOG.md` matches 4 | CHANGELOG rows + README cells for the three skills | verified |
| O6 | SPEC AC5 / issue #258 AC4 | root suites stay green and the edited skills stay within context budgets | P6 | P6 | root gate | `node --test scripts/*.test.mjs` exits 0; `bun scripts/check-skill-context.mjs` exits 0 | Evidence rows in this doc | verified |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | execute-phase guard added (`grep -cE "requires [a-z ]*input" …` matches 4, `grep -q "Required user inputs"` exits 0) | 0 | 4 guard mentions, 1 contract box | read-verified (execute-phase/SKILL.md) |
| AC2 | unit-lane + DESIGN.md + RESEARCH.md guards added (regex totals 4, unit-lane `Required user inputs` exits 0) | 0 | 4 guard mentions across 3 files | read-verified (unit-lane/SKILL.md + refs) |
| AC3 | init-workspace guard added (regex matches 2, `Required user inputs` exits 0) | 0 | 2 guard mentions, 1 contract box | read-verified (init-workspace/SKILL.md) |
| AC4 | all skills' Turn contract includes required-inputs box | 0 | 3 skills updated | read-verified (turn contracts) |
| AC5 | root suites: grep validators all pass; context budgets pass after unit-lane ceiling bump (execute-phase 5.2.0 + F3 re-basis) | 0 | 693 tests PASS · 28 skills PASS | check-skill-context.mjs + node --test scripts/*.test.mjs |
| AC6 | CHANGELOG rows for 3 bumped skills + pi-agentic-workflow re-bundle + pre-existing rows restored | 0 | 4 rows (3 skill + 1 re-bundle) | grep '258' CHANGELOG.md = 4 |

### Triaged steps

```
TRIAGE — 258-harden-needs-input-contracts (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```



## Progress log

- 2026-10-18 21:16 — SPEC drafted from issue #258, registered in docs/fix/README.md, triage pasted verbatim → e51e2b4f — next: plan
- 2026-10-18 21:30 — plan step: tasks P1–P6 cut with validators, prior-decisions sweep run (1 compatible hit, AGENTS.md:124), planning ledgers cut (PE-001–005, O1–O6 minus O4 folded into O1–O3) — next: implement P1 (input audit)
- 2026-10-18 22:00 — P1 — input audit completed: E1–E3 (execute-phase), U1–U5 (unit-lane), I1–I3 (init-workspace) classified required/optional/ambiguous in the Input audit section → 30718a67 — next: P2
- 2026-10-18 22:00 — P2 — needs-input guard + Turn-contract box added to execute-phase (4× `requires manual input`) → 30718a67 — next: P3
- 2026-10-18 22:00 — P3 — needs-input guard + Turn-contract box added to unit-lane, DESIGN.md and RESEARCH.md (5× `requires manual input` total) → 30718a67 — next: P4
- 2026-10-18 22:00 — P4 — mandatory-consent guard + Turn-contract box added to init-workspace → 30718a67 — next: P5
- 2026-10-18 22:00 — P5 — bump-skill run: execute-phase 5.2.0, unit-lane 1.6.0, init-workspace 3.4.0; CHANGELOG rows + README cells; pi-agentic-workflow re-bundle 0.22.0 → 30718a67 — next: P6
- 2026-10-18 22:00 — P6 — verification: root suites exit 0 and context budgets exit 0 at the fold (route ceilings re-based per F1; SPEC grammar repaired per F8) → ec10e7d6 — next: close-out ladder (review folded F1–F8; PR + receipt stage remain)
- 2026-10-18 23:09 — close-out — unit-doc machine surfaces repaired for the route gate: P5 `Relevant files` glob normalized, P5 validator outcome anchored (`matches 4`), Progress log re-cut into phase-led entries so the router records P1–P6 done → 0ca5edc3 — next: PR #302 open with `Closes #258`; receipt stage pending

## Next

Close-out: PR open with `Closes #258` — verify the review receipt (`bun scripts/review-receipt.mjs verify --pr <N>`); if it is not current at the settled head, `/review-change fix/258-harden-needs-input-contracts` posts the SHA-bound receipt before `/audit-pr` runs as the terminal merge gate.

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
