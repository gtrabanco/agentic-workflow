# fix/258-harden-needs-input-contracts

> Fix specification — one single unit document.

## Issue

`#258` — tracked issue in the project's forge. The PR must close it via
`Closes #258` in the body.

## Objective

Three surviving skills that interrupt the user for input (`execute-phase`,
`unit-lane`, `init-workspace`) continue past a blank required answer by
inferring defaults. Each gains an explicit needs-input contract (re-cut
2026-10-19, see Amendments): a required-input gap runs the three-tier
resolution — repo provenance with a recorded search receipt → bounded research
returning 2–3 options → emit the dispatcher's `open-questions@1` block and
stop. Optional input may default; ambiguous input is a question for the owning
stage, never for the user. Same defect class as `review-change`'s `29b52c63`
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

1. `execute-phase` runs **no interview**: its body replaces the hand-written
   `Needs-input guard` with a 3–5 line pointer to the shared needs-input
   contract — a required-input gap runs the three-tier resolution (repo
   provenance with a recorded search receipt → bounded research returning
   2–3 options → emit the dispatcher's `open-questions` block and stop). No
   `re-ask once`; the executor never questions the user. `read-verified`.
2. `unit-lane` body (including its `references/DESIGN.md` and
   `references/RESEARCH.md` interruption points) applies the same contract:
   a blank/vague required input re-enters tier 0/1 with the new question; a
   gap that survives both stops with the typed `open-questions` block routed
   back to the owning stage (`design` for scope/architecture questions,
   `unit-lane` for plan-owned facts). Unit kind has no silent `feature`
   default; acceptance criteria are never inferred. `read-verified`.
3. `init-workspace` body states that consent for installs/hooks/overwrites
   is mandatory and never defaulted: a consent gap is an open question
   through the same three-tier dispatch; consent that stays absent after the
   dispatch stops with the open questions carried in the block.
   `read-verified`.
4. Each of the three skills' `## Turn contract` includes a
   `Required user inputs were answered concretely (not defaulted)` box.
   `read-verified`.
5. Root suites pass: `node --test scripts/*.test.mjs` — exit 0.
6. All bumped skills appear in `CHANGELOG.md` (version rows) and
   `README.md` (skill table cells unchanged semantics). `read-verified`.
7. The `decisions.md` ledger contract is published: append-only, two typed
   entries — `open-question` (question, why it blocks, search receipt,
   options) and `decision` (authority `human-owner`, date, chosen,
   discarded) — composing with `decisions.md`'s existing uses (the
   opportunistic-finding table), documented in the template's agent guide
   and the lane docs. `read-verified`.
8. `scripts/needs-input.mjs` reads the unit doc + `decisions.md` and prints
   the `open-questions@1` block (open questions, search receipts, options,
   route back to the owning stage, typed continuation reusing the schema's
   existing `no-decision-available`); exit 0 on a well-formed artifact,
   fail-closed (non-zero exit) on a missing or malformed one; covered by
   `scripts/needs-input.test.mjs`.
9. `block:open-questions@1` is a declared normative surface: the grammar
   block is published in its owning reference and carries its row in
   AGENTS.md's `normative-surfaces@1`; `node --test
   scripts/normative-drift.test.mjs` exits 0.
10. The three shrunk skills stay within re-based budgets and all gates are
    green: `bun scripts/check-skill-context.mjs` (and `--routes`) exit 0,
    `node --test scripts/*.test.mjs` exits 0, and the re-bumped skills have
    their CHANGELOG rows and README cells.

## Amendments

### 2026-10-19 — AC1–AC3 widened upward (human-owner; supersedes the `re-ask once` step)

Two owner decisions recorded during review cycles 9–10 (full text in
[`review-findings.md`](review-findings.md), §"User decision" and §"Scope
decision"):

1. **«en vez de recortar AC1-AC3 … hay que ampliar el scope de este fix para
   arreglarlo y que funcione como se pretende»** — the scope is widened, not
   narrowed: the guard becomes a deterministic producer (state + dispatcher
   + versioned block), because a prose contract cannot be regressed against
   (verified by mutation in cycle 10: deleting the whole `Needs-input guard`
   leaves the gate green).
2. **The halt carries the open questions, and "research more" is an
   answer** — three-tier resolution in order, never skipped: (0) provenance
   — search the repository's own docs first and record *where*; (1) research
   — external gaps are researched and returned as 2–3 concrete options with
   trade-offs; (2) emit-and-stop — the step stops with the open questions
   written out. Only a user decision closes an open question; a request for
   more research or discussion is a legitimate answer that re-enters tier
   0/1. Execution never interviews.

Consequences applied to this SPEC:

- AC1–AC3 are re-cut above; the `re-ask once` step and AC1's exact refusal
  string are superseded. AC4's box stays required; its wording follows the
  new contract (halt = the dispatcher's block, no re-ask).
- `execute-phase` never interviews (owner decision): `Confirmed phase` and
  `Confirmed file targets` leave the required list; Input audit E2/E3 are
  re-classified below. File targets are owned by the unit doc's nested
  `Relevant files` metadata plus the path-protection checkpoint, not by a
  user question.
- Five pieces are cut as phases P7–P11 below. F33/F34 are absorbed by the
  pieces instead of being patched sentence by sentence; F35–F40 fold as
  before, inside P10's rewrite of the surfaces they cite.

# Status

**replanned** (P1–P6 done and folded F1–F32; 2026-10-19 human-owner decision widened AC1–AC3 upward — phases P7–P11 appended, route: replan, PR #302 stays open)

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
must stay within their enforced line/token budgets). Interactive input
halt behavior is read-verified per skill (ACs 1–3 confirm the guard prose
is present) — interactive paths are not exercised by the suites.

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
  `grep -cE "requires [a-z ]*input" skills/unit-lane/SKILL.md skills/unit-lane/references/DESIGN.md skills/unit-lane/references/RESEARCH.md` totals 4 and `grep -q "Required user inputs" skills/unit-lane/SKILL.md` exits 0)
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
- P7 — Publish the `decisions.md` ledger contract covering AC7: extend the
  question protocol (template agent guide) and the lane docs with the
  append-only, two-typed ledger (`open-question`: question, why it blocks,
  search receipt, options; `decision`: authority `human-owner`, date,
  chosen, discarded), composing with decisions.md's existing table uses
  (validator: `grep -q "open-question" template/AGENTS.md docs/workflow/LANE_FLOW.md`
  exits 0 for both files)
  - Relevant files: template/AGENTS.md, docs/workflow/LANE_FLOW.md
- P8 — Implement the needs-input dispatcher covering AC8: add
  `scripts/needs-input.mjs` reading the unit doc + `decisions.md`, printing
  the `open-questions@1` block (questions, search receipts, options, route
  back to the owning stage, typed continuation reusing
  `no-decision-available`), exiting 0 on a well-formed artifact and failing
  closed (non-zero) on a missing/malformed one, covered by
  `scripts/needs-input.test.mjs` (validator: `node --test scripts/needs-input.test.mjs` exits 0)
  - Relevant files: scripts/needs-input.mjs, scripts/needs-input.test.mjs
- P9 — Declare the `open-questions@1` grammar block covering AC9: publish
  it in its owning reference
  (`skills/orchestration-envelope/references/TURN_CONTRACT.md`, which
  already owns the hand-off fields the halt uses) and add its
  `normative-surfaces@1` row to AGENTS.md (validator:
  `node --test scripts/normative-drift.test.mjs` exits 0)
  - Relevant files: skills/orchestration-envelope/references/TURN_CONTRACT.md, AGENTS.md
- P10 — Shrink the three skills to the pointer covering AC1, AC2, AC3 and
  AC10: replace each inline `Needs-input guard` section with a 3–5 line
  pointer (run the dispatcher, paste the block, stop; attended waits,
  unattended hard-fails); delete `re-ask once`, `Confirmed phase` and
  `Confirmed file targets` per owner decisions F33-D and F34-D;
  re-classify Input audit E2 and E3; re-base the SKILL_CONTEXT_BUDGETS
  ceilings; fold rows F33 through F40; bump the skills and their CHANGELOG
  and README rows (validator:
  `grep -c "^## Needs-input guard" skills/execute-phase/SKILL.md skills/unit-lane/SKILL.md skills/init-workspace/SKILL.md` totals 0 and `bun scripts/check-skill-context.mjs` exits 0)
  - Relevant files: skills/execute-phase/SKILL.md, skills/unit-lane/SKILL.md,
    skills/unit-lane/references/DESIGN.md, skills/unit-lane/references/RESEARCH.md,
    skills/init-workspace/SKILL.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json,
    docs/fix/258-harden-needs-input-contracts/review-findings.md, CHANGELOG.md, README.md
- P11 — Verification of the widened unit covering AC10, AC5 and AC9: run
  the root suites, the context budgets, the normative drift suite and
  phase-lint on this unit doc (validator: `node --test scripts/*.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs` exits 0 and `node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md` prints `verdict PASS`)
  - Relevant files: scripts/, skills/, docs/fix/258-harden-needs-input-contracts/SPEC.md

### Prior-decisions sweep

Keyword sweep over the candidate sources (`docs/fix/258-harden-needs-input-contracts/decisions.md` —
not yet created; `docs/features/19-architectural-invariants/{decisions,architecture-notes}.md`;
`docs/workflow/REPOSITORY_STATE.md`; `AGENTS.md`) against the plan's claims.
No candidate matched the claims except the label rule below; the sweep is
advisory and issues no verdict.

| claim | prior decision | source path | relation |
|---|---|---|---|
| tasks are labeled `P1…P6` | phases are labeled `P1, P2, …`, never `S1`/`Step N`, in any PLAN/TASKS/SPEC artifact | AGENTS.md:124 | `compatible` |
| replanned tasks are labeled `P7…P11` (supersedes the `P1…P6` claim above; same rule) | phases are labeled `P1, P2, …`, never `S1`/`Step N`, in any PLAN/TASKS/SPEC artifact | AGENTS.md:124 | `compatible` |
| the widened work stays in the open PR #302, one PR per unit | one PR per unit of work, always against `main`; never stack PRs | AGENTS.md (Working rules) | `compatible` |
| the halt reuses the schema package's existing `no-decision-available` (no envelope change in this unit) | any change to the envelope schema is mirrored in `packages/agentic-workflow-schema` (types + `envelope.schema.json` + version bump), same PR | AGENTS.md (Packages / verification) | `compatible` |
| the dispatcher is a plain `#!/usr/bin/env node` script tested by the root suites | root suites run `node --test scripts/*.test.mjs`; shebangs stay `#!/usr/bin/env node`; runtime resolved bun-else-node at invocation | AGENTS.md (Verification, runtime convention) | `compatible` |
| `decisions.md` stays the unit folder's own conversation ledger (extended, not forked) | choices the user delegates and cheap-to-change defaults are recorded with their reason (the unit folder's `decisions.md`), never left silent | template/AGENTS.md:159 | `compatible` |

### Input audit

One table per skill; every interruption point classified `required` / `optional`
/ `ambiguous`, with its current blank-answer behavior and the post-fix behavior.

**execute-phase** (3 interruption points):

| # | Input point | Type | Current blank behavior | Post-fix behavior |
|---|---|---|---|---|
| E1 | `<NN-slug>` argument (unit identifier) | required (artifact, not a question) | User passes it; if blank/missing the slug is empty, `unit-route.mjs` fails with a non-helpful error — skill proceeds to "unit not found" path and may infer from context. | Never inferred and never re-asked: the three-tier dispatch runs, then `scripts/needs-input.mjs` prints the `open-questions@1` block and the run stops, routed to `/unit-lane --retriage`. |
| E2 | `P<k>` step argument | optional — absent runs **all remaining steps** (the declared default, not an interview) | Absent → proceeds to first unfinished step. No issue. | No change: the phase stays optional-with-declared-default. `Confirmed phase` is withdrawn — the required-input framing was the defect (owner decision F33-D). |
| E3 | `--max-attempts N` flag (optional) | optional | Absent → defaults to 3. No issue. | No change. Optional inputs may default. |

**Amended 2026-10-19 (owner decisions F33-D/F34-D — the no-interview contract):**
E2 (`P<k>`) is **optional with the declared default** (a bare `<NN-slug>` runs
all remaining steps; never an interview), and file targets are **not a user
input at all** — owned by the unit doc's nested `Relevant files:` metadata plus
the path-protection checkpoint — so the `Confirmed file targets` requirement is
withdrawn. `re-ask once` is superseded repo-wide by the three-tier dispatch
(see Amendments).

**unit-lane** (6 interruption points):

| # | Input point | Type | Current blank behavior | Post-fix behavior |
|---|---|---|---|---|
| U1 | `<NN-slug | "<idea>">` argument (unit slug or idea) | required | If blank, the unit folder lookup silently falls through; the lane may infer `feature` as a default or proceed with a guessed slug. | Three-tier dispatch, then `scripts/needs-input.mjs` prints `open-questions@1` and the run stops, routed to `design`. No silent `feature` default, no re-ask. |
| U2 | `--fix <issue-number>` / `--from-issue <issue-number>` | required when that mode is used | If issue number is blank while `--fix`/`--from-issue` is passed, the script receives an empty arg — may be silently parsed or passed downstream. | Three-tier dispatch, then the `open-questions@1` block and stop, routed to `design`. No re-ask. |
| U3 | Vague request → acceptance criteria induction ("ask-don't-infer") | required | If the request description is too vague, the lane may infer ACs from context. | Never infer: 2–3 concrete options from the research tier, then the `open-questions@1` block and stop for a user decision. |
| U4 | "Decide for me" in the gap interview (DESIGN.md) | optional | User selects it → lane chooses and records the choice. No issue. | No change. |
| U5 | Vague/ambiguous scope → unit kind classification | required | Blank/vague → skill may default to `feature`. | Never infer: route the classification question to `design` through the `open-questions@1` block. |

| U6 | Objective, why, user outcome (from the SPEC) | required | Blank/missing → Process §1 fills them from the invocation (or the issue) by inference, bypassing the guard. | Process §1 fills them from the invocation (or the issue) when present. A blank one is a plan-owned fact, so it routes to `unit-lane` through the `open-questions@1` block — a doc defect repaired by the lane, never a question the user cannot answer (F14). |

**init-workspace** (3 interruption points):

| # | Input point | Type | Current blank behavior | Post-fix behavior |
|---|---|---|---|---|
| I1 | `[target-dir]` argument (target repository) | optional | If blank, cwd is used. No issue. | No change — cwd is the declared, recorded default; never a question (F7). |
| I2 | Consent for each install/hook/overwrite | required | If blank or absent, the current text says "never overwrite without explicit yes" but the enforcement is prose-only; a model may proceed by assuming consent from context. | Consent is never defaulted: three-tier dispatch, then `scripts/needs-input.mjs` prints `open-questions@1` and the run stops with the questions carried in it. No re-ask. |
| I3 | Upgrade vs bootstrap mode selection | required | If the repo is ambiguous (partially scaffolding), the skill may pick a route by guessing the state. | Never guess: the route question goes to `design` through the `open-questions@1` block. |

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | `plan-feature-scaffold` and `plan-fix` no longer exist as skills — feature 61 absorbed them into `unit-lane`, so the issue's five-skill table reduces to three | `ls skills/` (no such directories); `docs/fix/README.md` row #258; issue #258 title | verified 2026-10-18 | O1, O2, O3 |
| PE-002 | file-read | among surviving skills, only `execute-phase`, `unit-lane` (+ its `DESIGN.md`/`RESEARCH.md` references) and `init-workspace` carry user-interruption points; `triage-issue` already refuses to proceed without a classification | `grep -rln "ask the user" skills/*/SKILL.md`; `skills/triage-issue/SKILL.md` | verified 2026-10-18 | O1, O2, O3 |
| PE-003 | issue-text | the fix follows the same defect-class pattern as the `review-change` commit `29b52c63` cited by the issue — **unverified: that commit is not a valid object in this repository** (`git cat-file -t 29b52c63` fails); the pattern is taken from the issue's narrative only | issue #258 §Problem; local `git cat-file` | ASSUMPTION-UNVERIFIED 2026-10-18 | O1, O2, O3 |
| PE-004 | file-read | the golden fixture does not exercise interactive input paths, so the root suites are the regression gate for this prose-only change | issue #258 §Proposed approach step 4; `docs/workflow/GOLDEN_FIXTURE.md` | verified 2026-10-18 | O6 |
| PE-005 | file-read | the three edited `SKILL.md` files are under enforced context budgets — added guard text must stay within them, checked by `scripts/check-skill-context.mjs` | `scripts/check-skill-context.mjs`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | verified 2026-10-18 | O6 |
| PE-006 | file-read | the schema's `CONTINUATION_REFUSALS` already carries `no-decision-available` with `decisionAvailable === false` semantics, so the halt's typed continuation reuses it with **no schema package change**; adding a distinct `insufficient-input` code stays the owner's call and is recorded as an assumption | `packages/agentic-workflow-schema/src/continuation.ts:32,82,186` | code verified 2026-10-19; reuse decision ASSUMPTION-UNVERIFIED (cheap default, owner may overrule at P10 review) | O8 |
| PE-007 | file-read | `scripts/normative-drift.test.mjs` fails closed on any surface that orders what an agent may do next without a fixed grammar in `normative-surfaces@1`, so the `open-questions@1` block needs its owning reference + AGENTS.md row | `scripts/normative-drift.test.mjs`; AGENTS.md `normative-surfaces@1` | verified 2026-10-19 | O9 |
| PE-008 | file-read | repo script convention: `#!/usr/bin/env node` shebangs, tests via `node --test scripts/*.test.mjs` (precedent: `scripts/phase-lint.mjs` + its suite, the same writer/verifier split) | `scripts/phase-lint.mjs`; AGENTS.md Verification + runtime convention | verified 2026-10-19 | O8, O11 |
| PE-009 | file-read | `decisions.md` is an established convention (template agent guide's question protocol; `execute-phase`'s own decisions table) — the two-typed ledger extends it, never forks it | `template/AGENTS.md:159`; `template/.agentic-workflow/path-protection.md:62` | verified 2026-10-19 | O7 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | SPEC AC1 / issue #258 AC1 | `execute-phase` never interviews: a blank required input runs the three-tier dispatch, then `scripts/needs-input.mjs` prints `open-questions@1` and the run stops routed to `/unit-lane --retriage`; Turn contract gains the required-inputs box | P2 | P2 | `execute-phase` body | `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` matches 4 | guard text + `✓ Required user inputs…` box in `skills/execute-phase/SKILL.md` | verified |
| O2 | SPEC AC2 / issue #258 AC1 | `unit-lane` never defaults unit kind or infers scope from a blank/vague answer; `DESIGN.md`/`RESEARCH.md` interruption points state the same three-tier guard (a doc defect routes to the lane, not to the user); Turn contract gains the box | P3 | P3 | `unit-lane` body + references | `grep -cE "requires [a-z ]*input" skills/unit-lane/SKILL.md skills/unit-lane/references/DESIGN.md skills/unit-lane/references/RESEARCH.md` totals 4 | guard text + box in `skills/unit-lane/SKILL.md` and references | verified |
| O3 | SPEC AC3 / issue #258 AC3 | `init-workspace` never proceeds without explicit consent: a consent gap runs the three-tier dispatch then the `open-questions@1` block and stops, no default consent; Turn contract gains the box | P4 | P4 | `init-workspace` body | `grep -cE "requires [a-z ]*input" skills/init-workspace/SKILL.md` matches 2 | guard text + box in `skills/init-workspace/SKILL.md` | verified |
| O5 | SPEC AC6 / issue #258 AC5 | the three bumped skills appear in `CHANGELOG.md` and `README.md` | P5 | P5 | `bump-skill` | `grep -cE "258" CHANGELOG.md` matches 7 | CHANGELOG rows + README cells for the three skills | verified |
| O6 | SPEC AC5 / issue #258 AC4 | root suites stay green and the edited skills stay within context budgets | P6 | P6 | root gate | `node --test scripts/*.test.mjs` exits 0; `bun scripts/check-skill-context.mjs` exits 0 | Evidence rows in this doc | verified |
| O7 | SPEC AC7 (amended) | the decisions.md ledger contract is published and composes with decisions.md's existing table uses | P7 | P7 | template agent guide + lane docs | `grep -q "open-question" template/AGENTS.md docs/workflow/LANE_FLOW.md` exits 0 for both files | ledger contract prose in both files | verified |
| O8 | SPEC AC8 (amended) | the dispatcher prints `open-questions@1` (questions, search receipts, options, route back, typed continuation via `no-decision-available`), exit 0 well-formed, fail-closed malformed, tested | P8 | P8 | `scripts/needs-input.mjs` + suite | `node --test scripts/needs-input.test.mjs` exits 0 | suite covers valid/malformed/empty | verified |
| O9 | SPEC AC9 (amended) | `open-questions@1` is a declared normative surface with its owning reference and AGENTS.md row | P9 | P9 | TURN_CONTRACT.md + AGENTS.md | `node --test scripts/normative-drift.test.mjs` exits 0 | drift test green with the new row | verified |
| O10 | SPEC AC1–AC3, AC10 (amended) | the three skills are pointer-only: no interview, no `re-ask once`, `Confirmed phase`/`Confirmed file targets` gone; budgets re-based; F33–F40 folded | P10 | P10 | the three skills + budgets manifest + review-findings rows | `grep -c "^## Needs-input guard" skills/execute-phase/SKILL.md skills/unit-lane/SKILL.md skills/init-workspace/SKILL.md` totals 0; `bun scripts/check-skill-context.mjs` exits 0 | guard sections gone, ceilings re-based, fold rows updated | verified |
| O11 | SPEC AC10, AC5, AC6, AC9 (amended) | all gates green at the widened head: root suites, context budgets, normative drift, phase-lint; CHANGELOG/README rows for the re-bumped skills | P11 | P11 | root gate | `node --test scripts/*.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs` exits 0 and `node scripts/phase-lint.mjs docs/fix/258-harden-needs-input-contracts/SPEC.md` prints `verdict PASS` | Evidence rows updated | verified |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | execute-phase guard added (`grep -cE "requires [a-z ]*input" …` matches 4, `grep -q "Required user inputs"` exits 0) | 0 | 4 guard mentions, 1 contract box | read-verified (execute-phase/SKILL.md) |
| AC2 | unit-lane + DESIGN.md + RESEARCH.md guards added (regex totals 4, unit-lane `Required user inputs` exits 0) | 0 | 4 guard mentions across 3 files | read-verified (unit-lane/SKILL.md + refs) |
| AC3 | init-workspace guard added (regex matches 2, `Required user inputs` exits 0) | 0 | 2 guard mentions, 1 contract box | read-verified (init-workspace/SKILL.md) |
| AC4 | all skills' Turn contract includes required-inputs box (`grep -q "Required user inputs were answered" skills/execute-phase/SKILL.md skills/unit-lane/SKILL.md skills/init-workspace/SKILL.md` exits 0) | 0 | 3 skills updated | read-verified (turn contracts) |
| AC5 | root suites: grep validators all pass; context budgets pass after unit-lane ceiling bump (execute-phase 5.2.1 + F3 re-basis) | 0 | 693 tests PASS · 28 skills PASS | check-skill-context.mjs + node --test scripts/*.test.mjs |
| AC6 | CHANGELOG rows for 3 bumped skills + pi-agentic-workflow re-bundle + pre-existing rows restored | 0 | 7 rows (3 skill + 2 pi + 2 other) | grep -cE '258' CHANGELOG.md = 7 |
| AC7 | `decisions.md` ledger contract published in the template agent guide (append-only `open-question`/`decision` grammar, `open-questions@1` preview) and in the lane docs (`docs/workflow/LANE_FLOW.md` §Needs-input — resolution tiers, dispatcher, interactive vs unattended) — composes with the existing uses (`Decide for me` rows, `path-protection-records@1`, planning ledgers) | 0 | `open-question` present in both files; `node --test scripts/doc-discipline.test.mjs` exit 0 | read-verified (template/AGENTS.md, docs/workflow/LANE_FLOW.md) |
| AC8 | `node --test scripts/needs-input.test.mjs` — the dispatcher reads the unit doc + `decisions.md` and prints `open-questions@1`; fail-closed matrix covers missing/malformed header, entry, receipt, options, route, authority, duplicate id | 0 | 22 tests · 22 pass · 0 fail (red run first: 22 failures against the absent script) | node --test scripts/needs-input.test.mjs |
| AC8 | `node --test scripts/*.test.mjs` at the dispatcher commit — no regression across the root suites | 0 | 715 tests · 715 pass · 0 fail | node --test scripts/*.test.mjs |
| AC1 | execute-phase never interviews: `## Needs-input guard` gone (0), `re-ask once`/`Confirmed phase`/`Confirmed file targets` absent repo-wide, `## Inputs — artifacts, never questions` present | 0 | 0 guard sections · 0 stale strings; three-tier dispatch names `scripts/needs-input.mjs` | read-verified (skills/execute-phase/SKILL.md) |
| AC2 | unit-lane + DESIGN.md + RESEARCH.md state the same contract: no silent `feature` default, ACs never inferred, DESIGN's blank gap re-enters the dispatch, RESEARCH routes a blank objective to the lane as a doc defect | 0 | 0 hand-written guard sections · `open-questions@1` named in all three | read-verified (skills/unit-lane/SKILL.md + references) |
| AC3 | init-workspace: consent mandatory and never defaulted through the same dispatch; `[target-dir]` optional-with-recorded-default | 0 | 0 hand-written guard sections | read-verified (skills/init-workspace/SKILL.md) |
| AC4 | all three Turn contracts carry the `Required user inputs were answered concretely (not defaulted)` box, reworded to the dispatcher halt | 0 | 3/3 boxes present | read-verified (turn contracts) |
| AC6 | CHANGELOG rows for execute-phase 6.0.0 · unit-lane 2.0.0 · init-workspace 4.0.0 · orchestration-envelope 2.3.0 · pi package 0.23.0, plus README + SKILLS.md cells | 0 | `node scripts/version-parity-gate.mjs --content --base main` → VERDICT: PASS | version-parity-gate + check-changelog-row |
| AC10 | `bun scripts/check-skill-context.mjs` (28 skills) and `--routes` (14 routes) pass with every ceiling re-based to the declared formula; root suites green | 0 | 715 tests · 715 pass · 0 fail · PASS context budgets · PASS route budgets | bun scripts/check-skill-context.mjs · node --test scripts/*.test.mjs |
| AC5 | `node --test scripts/*.test.mjs` at the P11 head — the whole root suite, including the golden fixture's deterministic half, the drift gate, the version-parity gate and the new dispatcher suite | 0 | 715 tests · 715 pass · 0 fail | node --test scripts/*.test.mjs |
| AC9 | `node --test scripts/normative-drift.test.mjs` and `node scripts/phase-lint.mjs <unit doc>` at the P11 head | 0 | 18/18 drift pass · `verdict PASS` (11/11 phases, fingerprint 80fc2b86) | node --test scripts/normative-drift.test.mjs · node scripts/phase-lint.mjs |
| AC6 | `node scripts/version-parity-gate.mjs --content --base main` — the trigger set changed and the companion row is present | 0 | content parity holds: version 0.21.0 → 0.23.0, companion row present · VERDICT: PASS | version-parity-gate.mjs |
| AC9 | `open-questions@1` published in its owning reference (`skills/orchestration-envelope/references/TURN_CONTRACT.md` §Open questions — header/fields/fail-block/route/exit codes, `produced-by` the dispatcher) and declared in AGENTS.md `normative-surfaces@1` (`open-questions-block` row, machine `continuation-refusal-type`) | 0 | 18 tests · 18 pass · 0 fail; TURN_CONTRACT ceiling re-based 2200 → 2573 = ceil(2339 × 1.10) with the growth source named | node --test scripts/normative-drift.test.mjs · bun scripts/check-skill-context.mjs |

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
- 2026-10-19 (plan re-cut) — replan upward per the two human-owner decisions recorded in review-findings.md (cycles 9–10): AC1–AC3 re-cut to the three-tier needs-input contract, `## Amendments` added quoting both decisions, Input audit E2/E3 re-classified (no-interview contract), phases P7–P11 appended for the five pieces (decisions ledger contract, needs-input dispatcher, open-questions@1 normative surface, three-skill shrink + F33–F40 folds, verification), planning ledgers extended (PE-006–009, O7–O11), prior-decisions sweep extended (5 new rows, all compatible) → 3d8241c5 — next: user confirms the re-cut plan → `/execute-phase fix/258-harden-needs-input-contracts P7`
- 2026-10-19 (P7) — published the `decisions.md` ledger contract (AC7): `template/AGENTS.md` now carries the append-only `open-questions@1` grammar with the two typed entries and the five rules (only a user decision closes a question, resume re-reads, append-only, composes with the existing blocks, halt-not-ask); `docs/workflow/LANE_FLOW.md` gained §Needs-input — the three-tier order, the dispatcher invocation, interactive vs unattended, plus a cheat-sheet row. Validator `grep -q "open-question" template/AGENTS.md docs/workflow/LANE_FLOW.md` exits 0 for both · `node --test scripts/doc-discipline.test.mjs` exit 0 → 026bcd50 — next: P8 (the dispatcher `scripts/needs-input.mjs` + its suite)
- 2026-10-19 (P8) — built the needs-input dispatcher (AC8): `scripts/needs-input.mjs` reads `SPEC.md` + `decisions.md`, folds the ledger (only a `decision` closes an `open-question`, a later row re-opens the loop) and prints the `open-questions@1` block with questions, blocks, search receipts, options, the route back and the typed `no-decision-available` continuation; fails closed with a named reason on a missing unit doc or a malformed ledger/dedup/authority defect, exit 2 on usage error. Tests-first: 22 cases red against the absent script, then 22/22 green · root suites 715/715 · `bun scripts/check-skill-context.mjs` PASS → cfd99fa0 — next: P9 (declare `open-questions@1` in TURN_CONTRACT.md + the AGENTS.md normative-surfaces row)
- 2026-10-19 (P10) — shrank the three skills to the dispatch pointer (AC1–AC3, AC10): removed all three hand-written `## Needs-input guard` sections (`grep -c "^## Needs-input guard"` = 0/0/0) and replaced them with inline contracts — execute-phase `## Inputs — artifacts, never questions`, unit-lane `## Inputs — never inferred, never defaulted`, init-workspace `## Consent — mandatory, never defaulted`; folded F33-F40 (F33/F34 absorbed: `Confirmed phase`/`Confirmed file targets` gone, a bare `<NN-slug>` documented as all-remaining-steps; F35 CHANGELOG rows are now additive and claim only the real removals; F36/F37 manifest narration re-emitted with the measured values and the duplicate `2026-09-22`/`2026-09-18` `policy.declared` clauses dropped for one accurate clause; F38 validators re-run at this head; F39 `--force` stated truthfully; F40 the elided refusal string retired with the section); Input audit E1–E3/U1–U6/I1–I3 re-classified to the no-interview contract; ceilings re-based **down** to the declared formula (execute-phase 3807/315 → 3717/303, unit-lane 3464/280 → 3424/271, init-workspace 3447/251 → 3463/249); versions bumped execute-phase 6.0.0, unit-lane 2.0.0, init-workspace 4.0.0, orchestration-envelope 2.3.0, pi package 0.23.0 with CHANGELOG + README/SKILLS cells → **diff-guard EXCEPTION recorded**: this phase is one atomic SPEC step (its validator spans all three skills at once, so splitting it would break the `count = 0` gate mid-way) and measures 258 lines (+123/−135) across 12 files against the 8-file limit — an honest shrink, not padding; lines are within the 400 budget → next: P11 (full verification of the widened unit)
- 2026-10-19 (P11) — verified the widened unit (AC5, AC9, AC10, AC6): root suites 715/715, `bun scripts/check-skill-context.mjs` PASS 28 skills, `--routes` PASS 14 routes, `node --test scripts/normative-drift.test.mjs` 18/18, `node scripts/phase-lint.mjs <unit doc>` verdict PASS with fingerprint 80fc2b86 (11/11 phases), `node scripts/version-parity-gate.mjs --content --base main` VERDICT PASS (0.21.0 → 0.23.0) — O7–O11 closed `verified`, every Evidence row re-run at this head → next: `/review-change` on the changed HEAD (mandatory end review)

## Next

**Replanned upward (2026-10-19 owner decision) — plan re-cut, awaiting
confirmation.** AC1–AC3 re-cut to the three-tier needs-input contract
(provenance → research → emit-and-stop, state in `decisions.md`, dispatcher
`scripts/needs-input.mjs`, `open-questions@1` block, skills shrink to the
pointer). Phases P7–P11 appended; P1–P6 receipts stand. PR #302 stays open
and accumulates the widened work.

→ execute `execute-phase fix/258-harden-needs-input-contracts P7` first (the
lane hands off one phase per turn); the receipt stage (`review-receipt
verify --pr 302`) re-runs only after P11.

---

**P7–P11 complete — the widened unit is implemented and every gate is green.**
The three skills now point at the deterministic dispatcher, the ledger contract
and the `open-questions@1` grammar are published and drift-gated, and the
budgets came down with the bodies. Next action: the mandatory end review.

→ execute `/review-change` on the changed HEAD (PR #302) — the mandatory end
review of the widened unit.

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
