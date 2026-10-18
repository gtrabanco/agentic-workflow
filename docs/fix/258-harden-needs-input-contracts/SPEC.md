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
  required/optional/ambiguous classification in this SPEC (Relevant files:
  skills/execute-phase/SKILL.md, skills/unit-lane/SKILL.md,
  skills/init-workspace/SKILL.md). Validator: classification table present
  in this doc's Input audit section.
- P2 — Add the needs-input guard (re-ask once → halt with
  `requires manual input`) + Turn-contract box to `execute-phase`.
  Validator: AC1 read-check passes.
- P3 — Add the needs-input guard + Turn-contract box to `unit-lane` and its
  interruption references (`DESIGN.md`, `RESEARCH.md`). Validator: AC2
  read-check passes.
- P4 — Add the mandatory-consent guard + Turn-contract box to
  `init-workspace`. Validator: AC3 read-check passes.
- P5 — Run `bump-skill` for the three edited skills (version bumps +
  CHANGELOG rows + README cells). Validator: AC6 read-check passes.
- P6 — Verification: `node --test scripts/*.test.mjs` exit 0;
  `bun scripts/check-skill-context.mjs` exit 0. Validator: AC5 command
  evidence rows in this doc.

### Planning evidence

| # | Claim | Type | Source | Confidence | Impact if wrong |
|---|---|---|---|---|---|
| 1 | `plan-feature-scaffold` and `plan-fix` no longer exist; feature 61 absorbed them into `unit-lane` | Code | `ls skills/` (no such dirs); fix index row #258; issue title "(3 surviving skills)" | High | Scope widens to 5 skills — re-triage |
| 2 | Only `execute-phase`, `unit-lane`, `init-workspace` have user-interruption points among interactive skills | Code | grep over `skills/*/SKILL.md`; issue table | Medium | Extra skill needs the guard — fold as finding |
| 3 | `triage-issue` already refuses to proceed without a classification | Doc | issue body §"Current gaps"; `skills/triage-issue/` | High | Add it to scope — re-triage |
| 4 | Golden fixture does not exercise interactive paths; root suites are the regression gate | Doc | issue body step 4 ("sanity check, not a regression test") | High | AC5 shape wrong — re-triage |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O-258-1 | issue #258 AC1 | execute-phase never proceeds on blank required phase/target input | P2 | P2 | execute-phase body | read-check of guard text | guard clause + contract box in SKILL.md | open |
| O-258-2 | issue #258 AC1 | unit-lane never defaults unit kind or infers scope from a blank/vague answer | P3 | P3 | unit-lane body + DESIGN/RESEARCH refs | read-check of guard text | guard clause + contract box in SKILL.md + refs | open |
| O-258-3 | issue #258 AC3 | init-workspace never proceeds without explicit consent | P4 | P4 | init-workspace body | read-check of guard text | guard clause + contract box in SKILL.md | open |
| O-258-4 | issue #258 AC2 | each skill's Turn contract carries the required-inputs box | P2-P4 | P2, P3, P4 | Turn contract sections | read-check | three `✓ Required user inputs…` boxes | open |
| O-258-5 | repo workflow rules | edited skills stay within context budgets; suites stay green | P6 | P6 | root gate | `node --test scripts/*.test.mjs` + `bun scripts/check-skill-context.mjs` | Evidence rows | open |

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

2026-10-18 21:16 — SPEC drafted from issue #258, registered in docs/fix/README.md — next: triage

## Next

Run `bun scripts/unit-route.mjs --triage 258` and paste the block verbatim.

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
