---
type: feature
scope: small
---

# 36 — verification-contract-hygiene

> One evidence-backed hygiene batch on the verification contract (issue #183):
> a validator-determinism rule and explicit property/fuzz validator recognition.

## Objective

Land issue #183's anti-flakiness validator rule and its property/fuzz validator
recognition as wording/template changes only — `skills/verification-contract/SKILL.md`
plus the template substrate validator mirror, a `bump-skill` version bump, and the
README `## References` entries the issue owes. Issue item 3 (the golden-fixture
run-log machine-comparable result field) is already shipped by feature 55 and is
verified, not re-implemented.

## Why

The verification contract's `Validator stability` rule scopes validator
*surfaces* (a validator must never gate on a surface other actors mutate) but
says nothing about validator *behaviour*: a validator that depends on network,
wall-clock time, randomness, or unordered concurrency re-fails a frozen
criterion with zero changes — the silent-degradation class arXiv:2505.06177
documents. Separately, feature 24 used property/fuzz tests ad hoc for the
schema package's `decideWorkflowAction`, but the contract never says a planner
may emit one as a `commands` row, so plans work around the contract. Issue
#183 groups both as one evidence-backed batch; its third item (run-log result
field) was absorbed by feature 55 (roadmap row 55, PR #240).

## User outcome

A planner writing frozen validators gets a contract that tells them explicitly:
pin non-deterministic dependencies (fixed version, frozen fixture, recorded
input) or downgrade the row to `read-verified:`/`manual:` — and may emit a
property/fuzz validator as a bounded `commands` row without working around the
contract. A reader of the README finds the studies that grounded the rule.

## Acceptance criteria

1. **AC1 — Anti-flakiness validator rule.** `skills/verification-contract/SKILL.md`
   § Artifact carries a validator-determinism rule beside `Validator stability`:
   a frozen validator must be deterministic — dependencies on network,
   wall-clock time, randomness, or unordered concurrency must be pinned (fixed
   version, frozen fixture, recorded input) or the row must be
   `read-verified:`/`manual:` instead of a command. Scenario: "I plan a frozen
   validator that calls the network or uses the clock, and the contract tells
   me to pin it or declassify it." Command-verified: grep over the skill shows
   the rule; `bun scripts/check-skill-context.mjs` exits 0.
2. **AC2 — Template mirror of the determinism rule.** The template substrate's
   validator wording (`template/docs/fix/_TEMPLATE/SPEC.md` `## Acceptance`
   section — the surviving validator mirror after ACCEPTANCE.md's removal)
   carries the same determinism rule. Scenario: "I copy the fix template into a
   target project and the rule arrives with it." Command-verified: grep.
3. **AC3 — Property/fuzz validator recognition (planner-facing).**
   `verification-contract` states a planner may emit a property/fuzz validator
   as a `commands` row — deterministic, bounded runtime — with bounds inherited
   from feature 26's `fast`/`full` timeout budgets (published by the schema
   package). No schema change: no new validator kind in `VerificationPlan v1`.
   Scenario: "I want my fuzz harness to serve as a validator, and the contract
   accepts it as a bounded commands row." Command-verified: grep.
4. **AC4 — Property/fuzz validator sentence (validator-facing).** The template
   substrate validator wording states a validator may be a property/fuzz test
   with bounded runtime. Command-verified: grep.
5. **AC5 — README `## References` carries the four issue-#183 bibliography
   entries** (Görz et al. FSE '26 / arXiv:2505.06177; Sheng et al. QuartetFuzz /
   arXiv:2605.21824; Manès et al. TSE'19; appsec.guide "Writing harnesses"),
   appended to the existing section, deduped against entries already there,
   added in the shipping PR per the issue's obligation. Command-verified: grep
   shows the four entries under `## References`.
6. **AC6 — Issue item 3 verified already shipped.** `node --test
   scripts/golden-fixture.test.mjs` exits 0: the closed Result grammar
   (`exact <n>/<n> · invented none|<k> · shape ok|<fail-code>`, cutoff
   2026-09-18) is live and enforced — the machine-comparable run-log result
   field exists; this unit changes nothing on that surface.
7. **AC7 — Green gate after the wording grows.** Root suites
   (`node --test scripts/*.test.mjs`) and `bun scripts/check-skill-context.mjs`
   pass; `verification-contract` version bumped + CHANGELOG row present
   (bump-skill run); schema package untouched (`bun run test` green there).

## Non-goals

- No schema-package changes — no new validator *kind* in `VerificationPlan v1`;
  property/fuzz rides the existing `commands` class.
- No fuzz-harness generation skill for target projects (rejected in the issue:
  without sanitizer/CI infrastructure the value collapses, and it breaks
  stack-agnosticism).
- No automatic flaky-detector tooling; the rule is declared by the planner and
  checked by review.
- No re-work on `docs/workflow/GOLDEN_FIXTURE.md` or its run log — item 3
  shipped via feature 55; this unit only re-verifies it (AC6).

## Future

none

## Future cost

- The determinism rule binds future planners: every new frozen validator must
  pin its non-deterministic dependencies or be declassified to
  `read-verified:`/`manual:` (binds: plan/fix planners; reviewers check it).
- The template mirror binds `init-workspace`: target projects copying the fix
  template inherit the rule (binds: template maintainers).

## Applicable tests

`node --test scripts/*.test.mjs` (root suites, incl.
`scripts/golden-fixture.test.mjs`), `bun scripts/check-skill-context.mjs`,
schema package `bun run test`. No new test: the non-goals forbid tooling and
the change is wording-only; the existing suites are the regression gate.

## Known pre-existing issues

- none observed at unit-doc creation (2026-10-18): root suites status not
  sampled before this unit's own gate run; the AC7 run doubles as the first
  sample and any red gate found there is recorded here, never excused.

### Planning evidence

Embedded (S unit). Claims verified against `main` @ `9bd272e9` on 2026-10-18:

| id | Claim | Evidence | Status |
|---|---|---|---|
| PE-001 | `verification-contract` carries no validator-determinism wording today | grep `flak\|deterministic\|wall-clock\|random` over `skills/verification-contract/SKILL.md` → only the feature-60 path-protection line | verified |
| PE-002 | The template validator mirror today is `template/docs/fix/_TEMPLATE/SPEC.md` `## Acceptance` (`read-verified` labelling); no ACCEPTANCE template exists | `grep -rn read-verified template/` → only that file; `find template -iname "*acceptance*"` → empty | verified |
| PE-003 | Issue #183 item 3 (run-log machine-comparable result field) is shipped by feature 55 | `scripts/golden-fixture.test.mjs` `RESULT_GRAMMAR` + `RESULT_GRAMMAR_CUTOFF = 2026-09-18`; roadmap row 55 records "absorbs #183's fixture metric row" | verified |
| PE-004 | The schema package publishes the `fast`/`full` timeout budgets the fuzz/property sentence references | `packages/agentic-workflow-schema/src/verification-contract.ts:221-224` (`fastCommandTimeoutMs`…`fullStageTimeoutMs`) | verified |
| PE-005 | README already has a `## References` section with one unrelated entry | `README.md:661` (Jin & Chen, arXiv:2603.00539) — no overlap with the four new entries | verified |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | issue #183 item 1 | a frozen validator is deterministic — non-deterministic dependencies pinned or the row `read-verified:`/`manual:` | P1 P2 | determinism rule + template mirror | verification-contract skill | grep + `bun scripts/check-skill-context.mjs` | Evidence row AC1/AC2 | planned |
| O2 | issue #183 item 2 | property/fuzz validators ride the `commands` class with `fast`/`full` bounds — no new validator kind | P1 P2 | fuzz/property sentences | verification-contract skill | grep | Evidence row AC3/AC4 | planned |
| O3 | issue #183 non-goal | no schema-package change (`VerificationPlan v1` kinds unchanged) | P1 P2 | absent-by-design | n/a | schema `bun run test` exits 0 | Evidence row AC7 | planned |
| O4 | issue #183 bibliography | README `## References` gains the four entries at ship time, deduped | P3 | README append | docs | grep | Evidence row AC5 | planned |
| O5 | issue #183 item 3 / roadmap row 55 | the run-log Result grammar stays enforced, untouched | P4 | re-verify only | golden-fixture suite | `node --test scripts/golden-fixture.test.mjs` exits 0 | Evidence row AC6 | planned |

## Tasks

- P1 — Add the validator-determinism rule and the property/fuzz `commands`-row
  sentence to `skills/verification-contract/SKILL.md` § Artifact (beside
  `Validator stability`); run `bump-skill` for the version bump + CHANGELOG row
  (validator: `bun scripts/check-skill-context.mjs` exits 0)
    - Relevant files: skills/verification-contract/SKILL.md, CHANGELOG.md, README.md
- P2 — Mirror the two rules in the template substrate validator wording
  (`template/docs/fix/_TEMPLATE/SPEC.md` `## Acceptance`)
  (validator: `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` exits 0)
    - Relevant files: template/docs/fix/_TEMPLATE/SPEC.md
- P3 — Append the four issue-#183 bibliography entries to README `## References`,
  deduped against existing entries (validator: `grep -c "arxiv.org/abs/2505.06177\|arxiv.org/abs/2605.21824\|10.1109/TSE.2019.2946563\|appsec.guide/docs/fuzzing" README.md` exits 0 and `grep -c` output ≥ 4)
    - Relevant files: README.md
- P4 — Verification: run the root suites, the golden-fixture suite, the context
  budgets, and the schema package tests; fill the Evidence rows
  (validator: `node --test scripts/*.test.mjs` exits 0)
    - Relevant files: docs/features/36-verification-contract-hygiene/SPEC.md

## Evidence

## Triaged steps

```
TRIAGE — 36-verification-contract-hygiene (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
```

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | repo-evidence sweep of the unit's domain (skill, templates, fixture suite, schema source, README, roadmap, issue #183) | exit 0 | 4 claims tabled as PE-001…PE-005; item 3 already shipped by feat 55; no external fetch needed — the issue carries the research provenance | lane conductor (this session) |
| R1 note | Uncertainties: none material — wording exactness for the two new sentences is a cheap default recorded in `decisions.md`; sources: repo evidence + the issue's bibliography (arXiv:2505.06177, arXiv:2605.21824, TSE'19, appsec.guide) | — | — | — |
| AC1 | `grep` over skill shows determinism rule + property/fuzz sentence; `bun scripts/check-skill-context.mjs` exits 0 | exit 0 | determinism rule present; fuzz/property sentence present | execute-phase P1
| AC2 | `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` exits 0 | exit 0 | line 74: Validator determinism; line 80: deterministic, bounded | execute-phase P2
| AC3 | `grep` over skill shows property/fuzz as commands-row | verified | bounded commands row with fastCommandTimeoutMs/fullStageTimeoutMs | execute-phase P1
| AC4 | `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` finds property/fuzz sentence | verified | line 80: deterministic, bounded — within timeout budgets | execute-phase P2
| AC5 | `grep -c` for four issue #183 references in README.md | 4 | arXiv:2505.06177, arXiv:2605.21824, TSE'19, appsec.guide | execute-phase P3
| AC6 | `node --test scripts/golden-fixture.test.mjs` exits 0 | exit 0 | 12 tests, 12 pass | execute-phase P4
| AC7 | root suites + schema test + context budgets | exit 0 | golden-fixture: 12/12 pass; schema: 717/717 pass; context: 28 skills PASS | execute-phase P4

## Progress log

- 2026-10-18 21:30 — unit doc created from template; issue #183 read from the forge; roadmap row 36 `idea → defined` → (this commit) — next: triage
- 2026-10-18 21:45 — triage pasted verbatim (8 steps, release skipped); research step closed (R1 + PE-001…PE-005); design step closed (`decisions.md`, 3 dated decisions, no gap interview turn needed) — next: plan sweep, then hand off P1
- 2026-10-18 22:00 — plan step closed: tasks P1–P4 cut with validators (above), prior-decisions sweep clean (0 contradicts), planning ledgers embedded (5 PE rows, 5 O rows) → (this commit) — next: hand off `/execute-phase 36-verification-contract-hygiene P1`
- 2026-10-18 22:10 — P1 implemented: added validator-determinism rule + property/fuzz sentence to `verification-contract` § Artifact; bumped 1.3.0→1.4.0 (minor); CHANGELOG row added; unit doc Tasks format fixed (missing `- ` prefix on bullets + validator outcome grammar); 6e9cf2da — next: P2 (template mirror)
- 2026-10-18 22:20 — P2 done: template mirror written (template/docs/fix/_TEMPLATE/SPEC.md § Acceptance); dafc2421 — next: P3 (README bibliography)
- 2026-10-18 22:30 — P3 done: four issue #183 bibliography entries appended to README § References (4 matches); b1ebff5d — next: P4 (verification gate run)
- 2026-10-18 22:40 — P4 done: golden-fixture exits 0 (AC6); check-skill-context exits 0, 28 skills (AC7); schema package 717 pass 0 fail (AC7); all Evidence rows filled; 58fa262a — next: /review-change
- 2026-10-18 22:50 — P1–P4 complete; unit doc Evidence/Progress final; pushed feat/36-verification-contract-hygiene (8480d739) — next: /review-change on the accumulated diff

## Next

Plan-step contradiction sweep, then hand off execution:
`/execute-phase 36-verification-contract-hygiene P1`.

## References

- Issue [#183](https://github.com/gtrabanco/agentic-workflow/issues/183) — NEW FEATURE: Verification-contract hygiene
- Roadmap row 36 (`docs/features/ROADMAP.md`)
- Roadmap row 55 (`executable-golden-fixture`, PR #240) — absorbed issue item 3
- Feature 26 (`staged-verification-contracts`) — `fast`/`full` timeout budgets
