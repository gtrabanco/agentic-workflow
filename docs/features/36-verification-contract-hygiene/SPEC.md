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
| PE-006 | Replan batch (2026-10-19): the 12 open rows' claims are recheck-verified evidence, not assumptions | cycle-3 ledger VF-24…VF-35 at head `d85eeb4040df9e28e2426de371b7a958f566a01c`; root suite 684/693 with the two failing files 29/29 at `main` `9bd272e9` | verified |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | issue #183 item 1 | a frozen validator is deterministic — non-deterministic dependencies pinned or the row `read-verified:`/`manual:` | P1 P2 | determinism rule + template mirror | verification-contract skill | grep + `bun scripts/check-skill-context.mjs` | Evidence row AC1/AC2 | verified |
| O2 | issue #183 item 2 | property/fuzz validators ride the `commands` class with `fast`/`full` bounds — no new validator kind | P1 P2 | fuzz/property sentences | verification-contract skill | grep | Evidence row AC3/AC4 | verified |
| O3 | issue #183 non-goal | no schema-package change (`VerificationPlan v1` kinds unchanged) | P1 P2 | absent-by-design | n/a | schema `bun run test` exits 0 | Evidence row AC7 | verified |
| O4 | issue #183 bibliography | README `## References` gains the four entries at ship time, deduped | P3 | README append | docs | grep | Evidence row AC5 | verified |
| O5 | issue #183 item 3 / roadmap row 55 | the run-log Result grammar stays enforced, untouched | P4 | re-verify only | golden-fixture suite | `node --test scripts/golden-fixture.test.mjs` exits 0 | Evidence row AC6 | verified |
| O6 | issue #183 item 1 (budget re-basis) | route ceilings re-based when wording growth pushes them over — declared re-basis names growth source | P4 | context-budget re-basis | scripts/SKILL_CONTEXT_BUDGETS.json | `node scripts/check-skill-context.mjs --routes` exits 0 | Evidence row AC7 | verified |
| O7 | cycle-3 F29 + F30 (VF-25, VF-26) | machine surfaces parse: the `ledger-ownership@1` acceptance-manifest row carries 6 cells; `versionCells()` reads all three patch rows | P5 | ledger row + CHANGELOG rows rewrite | lane fold | `node --test scripts/ledger-ownership.test.mjs && node --test scripts/normative-drift.test.mjs` exits 0 | Evidence row P5 | verified |
| O8 | cycle-3 F31 (VF-27) | the router never returns `close-out` for a unit whose index status is not `done`/`absent` — a `defined` unit with all phases recorded refuses with exit 1 | P6 | close-out guard status gate + shared derive helper | scripts/unit-route.mjs | `node --test scripts/unit-route.test.mjs` exits 0 (new fixture case) | Evidence row P6 | verified |
| O9 | cycle-3 F34 + F39 (VF-30, VF-35) | the post-61 receipt has exactly one declared owner and no phantom artifact is described; the legacy ACCEPTANCE.md mandate reads binding-if-present | P7 | receipt owner + era-label restatement | skills/verification-contract/SKILL.md | `bun scripts/check-skill-context.mjs` exits 0 | Evidence row P7 | verified |
| O10 | cycle-3 F35 (VF-31) | the audit-pr closure-gate bullet is well-formed — the remedy sentence is terminated, not run into the sibling bullet | P8 | bullet repair + audit-pr bump | skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md | `grep -n "Next: /unit-lane" skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` exits 0 | Evidence row P8 | planned |
| O11 | cycle-3 F36 (VF-32) | README § References carries the issue's full author lists, not "et al." truncations | P9 | bibliography author lists | README.md | `grep -c "Philipp Görz\|Ze Sheng\|V. J. M. Manès" README.md` = 3 | Evidence row P9 | planned |
| O12 | cycle-3 F37 (VF-33) | exported templates carry no repo-specific nouns (AGENTS.md stack-agnostic rule) | P10 | template sentence restatement | template/docs/*/_TEMPLATE/SPEC.md | `grep -c "schema package\|existing commands class" template/docs/features/_TEMPLATE/SPEC.md template/docs/fix/_TEMPLATE/SPEC.md` = 0 | Evidence row P10 | planned |
| O13 | cycle-3 F38 (VF-34) | budget growth sources name files the branch actually changed, with honest pre-re-basis measurements | P11 | budget growth-source re-basis | docs/workflow/SKILL_CONTEXT_BUDGETS.json | `node scripts/check-skill-context.mjs --routes` exits 0 | Evidence row P11 | planned |
| O14 | cycle-3 F28 + F32 + F33 (VF-24, VF-28, VF-29) | the gate is green with fresh GATE-RAN marks at the repaired head; Evidence rows carry real exits; `## Next` states the true gate state | P12 | full gate run + unit doc re-record | lane fold | `node --test scripts/*.test.mjs` exits 0 | Evidence row P12 | planned |

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
- P5 — Replan batch (F29 + F30): repair the two broken machine surfaces —
  rewrite the `acceptance-manifest` `ledger-ownership@1` row so its validator
  cell parses as 6 cells (one command form; the era split moves to prose) and
  rewrite the three patch rows (audit-pr 5.6.1, review-change 3.12.1,
  workflow-status 3.9.2) in the section's own
  `| <version> | <date> | <type> | <what> |` shape, dropping the name-prefixed
  copies (validator: `node --test scripts/ledger-ownership.test.mjs && node --test scripts/normative-drift.test.mjs` exits 0)
    - Relevant files: skills/pre-execution-review/references/LEDGERS.md, CHANGELOG.md
- P6 — Replan batch (F31): test-first — add a unit-route fixture case where a
  `defined` unit has all phases recorded and expect refusal (exit 1), then gate
  the close-out branch on the in-progress status and derive the unfinished list
  from one helper shared with `firstUnfinishedPhase` (validator: `node --test scripts/unit-route.test.mjs` exits 0)
    - Relevant files: scripts/unit-route.mjs, scripts/unit-route.test.mjs
- P7 — Replan batch (F34 + F39): give the post-61 receipt one owner in
  `verification-contract` § Freeze and receipt — declare the unit doc's Evidence
  table the receipt, delete the phantom `## Acceptance receipt v1` unit-doc
  block, and restate the line-22 legacy mandate as binding-if-present (no
  template instruction); run `bump-skill` (patch)
  (validator: `bun scripts/check-skill-context.mjs` exits 0)
    - Relevant files: skills/verification-contract/SKILL.md, CHANGELOG.md, README.md
- P8 — Replan batch (F35): place the mid-bullet remedy sentence deliberately in
  `audit-pr`'s closure-gate block — terminate the `→ Next: /unit-lane <unit>`
  bullet before the sibling `- Lane-era path` bullet, keeping the :159 duplicate
  canonical; run `bump-skill` for audit-pr (reference-only patch)
  (validator: `grep -n "Next: /unit-lane" skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` exits 0 on a bullet that terminates before the next bullet)
    - Relevant files: skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md, CHANGELOG.md, README.md
- P9 — Replan batch (F36): restore the full issue-#183 author lists in README
  § References from `gh issue view 183`
  (validator: `grep -c "Philipp Görz\|Ze Sheng\|V. J. M. Manès" README.md` exits 0 and prints 3)
    - Relevant files: README.md
- P10 — Replan batch (F37): restate the two template determinism/property-fuzz
  sentences without repo-specific nouns ("schema package", "commands class")
  while keeping the stated bound
  (validator: `grep -c "schema package\|existing commands class" template/docs/features/_TEMPLATE/SPEC.md template/docs/fix/_TEMPLATE/SPEC.md` exits 0 and prints 0)
    - Relevant files: template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md
- P11 — Replan batch (F38): re-basis the six budget growth entries — name
  `skills/verification-contract/SKILL.md` as the growth source, state the
  pre-re-basis measurement, and fix the `ceil(… × 1.10)` arithmetic text
  (validator: `node scripts/check-skill-context.mjs --routes` exits 0)
    - Relevant files: docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P12 — Replan batch (F28 + F32 + F33): verification — run all seven gate
  commands at the repaired head, append fresh GATE-RAN marks to the ledger,
  re-record the unit doc's Evidence rows (one AC6 + one AC7 row with the real
  exits) and rewrite `## Next` with the true gate state
  (validator: `node --test scripts/*.test.mjs` exits 0)
    - Relevant files: docs/features/36-verification-contract-hygiene/SPEC.md, docs/features/36-verification-contract-hygiene/review-findings.md

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
| AC1 | `grep -n "Validator determinism" skills/verification-contract/SKILL.md` && `grep -n "Property / fuzz" skills/verification-contract/SKILL.md` && `bun scripts/check-skill-context.mjs` exits 0 | exit 0 | determinism rule present (line 44); fuzz/property sentence present (line 49) | execute-phase P1
| AC2 | `grep -n "determin" template/docs/fix/_TEMPLATE/SPEC.md` exits 0 | exit 0 | line 74: Validator determinism; line 81: deterministic, bounded | execute-phase P2
| AC3 | `grep -n "Property / fuzz validators" skills/verification-contract/SKILL.md` exits 0 | exit 0 | line 49: bounded commands row | execute-phase P1
| AC4 | `grep -n "Property / fuzz validators" template/docs/fix/_TEMPLATE/SPEC.md` exits 0 | exit 0 | line 79: **Property / fuzz validators.** bounded runtime within schema timeout budgets | execute-phase P2
| AC5 | `grep -c` for four issue #183 references in README.md | 4 | arXiv:2505.06177, arXiv:2605.21824, TSE'19, appsec.guide | execute-phase P3
| AC7 | root suites: `node --test scripts/*.test.mjs` + `node scripts/check-skill-context.mjs --routes` + `node scripts/version-parity-gate.mjs`; schema: `bun run test` in `packages/agentic-workflow-schema` | exit 0 / exit 0 / exit 0 / exit 0 | golden-fixture: 12/12 pass (AC6); schema: 717 pass 0 fail; check-skill-context: 1 pass 0 fail (--routes PASS); version-parity: content parity holds (AC1) | execute-phase P4
| AC7 | root suites + schema test + context budgets | exit 0 | golden-fixture: 12/12 pass (AC6); schema: 717 pass 0 fail; check-skill-context.test: 1 pass 0 fail (AC1); --routes PASS route budgets: 14 (AC1); version-parity: content parity holds (AC2) | execute-phase P4
| P5 | ledger-ownership: `node --test scripts/ledger-ownership.test.mjs` + normative-drift: `node --test scripts/normative-drift.test.mjs` | exit 0 / exit 0 | ledger-ownership: 11/11 pass; normative-drift: 18/18 pass (VF-25/F29: acceptance-manifest validator cell parses as 6 cells; VF-26/F30: patch rows use `| version | date | type | what |` shape) | execute-phase P5
| P6 | `node --test scripts/unit-route.test.mjs` (44 tests) | exit 0 | 44 pass 0 fail — F31/P6: `defined` all-phases unit refuses exit 1; `done` all-phases routes close-out; F8 tests pass with roadmap status set to `done`; shared `unfinishedPhases` helper | execute-phase P6
| P7 | `bun scripts/check-skill-context.mjs` + direct read of SKILL.md § Artifact + § Freeze and receipt | exit 0 | 28 skills PASS; evidence table declared as receipt (no phantom `## Acceptance receipt v1`); legacy era label rephrased as binding-if-present; version bumped 1.4.0→1.4.1 + CHANGELOG row | execute-phase P7
| P8 | `grep -n "Next: /unit-lane" skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` + `bun scripts/check-skill-context.mjs` | exit 0 / exit 0 | audit-pr 5.6.1→5.6.2; all `→ Next: /unit-lane` bullets terminate before sibling bullets; 28 skills PASS | execute-phase P8
| P9 | `grep -c "Philipp Görz|Ze Sheng|V. J. M. Manès" README.md` | 3 | 3 author lists restored from issue #183 (Görz 4, Sheng 6, Manès 7); no `et al.` remain | execute-phase P9

## Progress log

- 2026-10-18 21:30 — unit doc created from template; issue #183 read from the forge; roadmap row 36 `idea → defined` → (this commit) — next: triage
- 2026-10-18 21:45 — triage pasted verbatim (8 steps, release skipped); research step closed (R1 + PE-001…PE-005); design step closed (`decisions.md`, 3 dated decisions, no gap interview turn needed) — next: plan sweep, then hand off P1
- 2026-10-18 22:00 — plan step closed: tasks P1–P4 cut with validators (above), prior-decisions sweep clean (0 contradicts), planning ledgers embedded (5 PE rows, 5 O rows) → (this commit) — next: hand off `/execute-phase 36-verification-contract-hygiene P1`
- 2026-10-18 22:10 — P1 implemented: added validator-determinism rule + property/fuzz sentence to `verification-contract` § Artifact; bumped 1.3.0→1.4.0 (minor); CHANGELOG row added; unit doc Tasks format fixed (missing `- ` prefix on bullets + validator outcome grammar); 6e9cf2da — next: P2 (template mirror)
- 2026-10-18 22:20 — P2 done: template mirror written (template/docs/fix/_TEMPLATE/SPEC.md § Acceptance); dafc2421 — next: P3 (README bibliography)
- 2026-10-18 22:30 — P3 done: four issue #183 bibliography entries appended to README § References (4 matches); b1ebff5d — next: P4 (verification gate run)
- 2026-10-18 22:40 — P4 done: golden-fixture exits 0 (AC6); check-skill-context exits 0, 28 skills (AC7); schema package 717 pass 0 fail (AC7); all Evidence rows filled; 58fa262a — next: /review-change
- 2026-10-18 22:50 — P1–P4 complete; unit doc Evidence/Progress final; pushed feat/36-verification-contract-hygiene (8480d739) — next: /review-change on the accumulated diff
- 2026-10-18 23:40 — review cycle 1 ran (5 passes + synthesis/classification/debt); F1–F11, F14, F15 folded per owner scope directive (e28ff213); ledger SHA corrected to squashed head (f03fc673) — next: lane resume at settled head
- 2026-10-18 23:55 — lane resumed at settled head f03fc673: gate re-verified green (root suites exit 0; `--routes` PASS 14 routes; version-parity PASS 0.21.0→0.22.0; golden-fixture exit 0); `--triage` re-run confirms step list unchanged; branch pushed at f03fc673; Future rows: none; receipt stage: no PR (release skipped) → receipt missing → hand off to /review-change (this commit) — next: /review-change 36-verification-contract-hygiene
- 2026-10-19 (replan) — review cycle 3 returned F28–F39, all fix-now routed fold-into-unit; F33 is frozen `replan-in-unit`, so the fold queue froze (REPLAN-ROUTE) and the router printed `route: replan` → the lane's plan step re-ran: tasks P5–P12 cut for the 12 rows (O7–O14 planned, PE-006 added), sweep clean (0 contradicts) → (this commit) — next: hand off `/execute-phase 36-verification-contract-hygiene P5`
- 2026-10-19 P5 done: VF-25/F29 repaired — acceptance-manifest `ledger-ownership@1` validator cell rewritten to use `then` instead of escaped `\|` (parses as 6 cells); VF-26/F30 repaired — patch rows 5.6.1, 3.12.1, 3.9.2 rewritten to `| version | date | type | what |` shape without name prefixes; ledger-ownership 11/11 pass, normative-drift 18/18 pass; e7b1c1eb — next: P6
- 2026-10-19 P6 done: close-out guard gates on `status === "done"` (F31 — a `defined` unit with all phases now refuses exit 1); shared `unfinishedPhases(unitDir)` helper extracted from inline `firstUnfinishedPhase` derivation; F8 tests updated to set roadmap status to `done`; unit-route 44/44 pass; f85567cd — next: P7
- 2026-10-19 P7 done: post-61 receipt owner declared (Evidence table); phantom `## Acceptance receipt v1` block deleted; legacy era label rephrased binding-if-present (no template instruction); verification-contract 1.4.0→1.4.1 + CHANGELOG row; check-skill-context 28 skills PASS; ea4ce056 — next: P8
- 2026-10-19 P8 done: closure-gate `→ Next: /unit-lane <unit>` bullet terminated before `- Lane-era path` sibling (F35); audit-pr 5.6.1→5.6.2; check-skill-context 28 skills PASS; 701cd08a — next: P9
- 2026-10-19 P9 done: full issue-#183 author lists restored in README § References (3 grep matches; no `et al.`); 5eae8492 — next: P10

## Next

P1–P4 complete; review cycle 1 ran and F1–F11 + F14 + F15 folded (e28ff213);
gate re-verified green at the settled head f03fc673 (root suites, --routes,
version-parity, golden-fixture — all exit 0). No PR yet (release skipped by
greenlight triage: small scope), so no review receipt exists at head. Next:
/review-change on the settled head to re-verify the folds and post the
SHA-bound receipt.

## References

- Issue [#183](https://github.com/gtrabanco/agentic-workflow/issues/183) — NEW FEATURE: Verification-contract hygiene
- Roadmap row 36 (`docs/features/ROADMAP.md`)
- Roadmap row 55 (`executable-golden-fixture`, PR #240) — absorbed issue item 3
- Feature 26 (`staged-verification-contracts`) — `fast`/`full` timeout budgets
