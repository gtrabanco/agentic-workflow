---
type: feature
scope: medium
---

# 73 — lane-closeout-handoffs

> One-line: close the four close-out gaps in the `unit-lane` conductor — review
> receipt hand-off, `audit-pr` as the terminal stage, per-phase
> `execute-phase` hand-offs, and per-step budget tiers wired from the catalog.

## Objective

Make the lane's close-out contract real: a lane run ends with the SHA-bound
review receipt (or an explicit `/review-change` hand-off), the closing
recommendation orders `/audit-pr` as the terminal stage, execution work hands
off one `execute-phase` phase per turn, and the triage exposes each step's
budget tier from `scripts/catalog.json` so per-step model routing is reachable.
Issue #291.

## Why

`unit-lane` was written as a self-contained one-shot conductor and never
received the hand-off half of the contract. Four linked gaps (issue #291,
observed live on PR #290 / unit 72):

1. The lane's review step writes only the prose `REVIEW-VERDICT` into the unit
   doc — the machine receipt `audit-pr` consumes is never posted, so the merge
   gate blocks with `missing-review-receipt` (F1 on PR #290).
2. `/audit-pr` is a third-level alternative bullet in the closing block, never
   the ordered terminal stage `docs/workflow/LANE_FLOW.md` step 7 promises.
3. The lane executes every triaged step inline at its own (strong) tier —
   `execute-phase` is never mentioned — so the cheap `/execute-phase` route in
   the recommended profiles and the per-step `budget_tier` in `catalog.json`
   are dead data.
4. No hand-off ever names one phase: `unit-route` prints bare
   `/execute-phase <slug>` and whole-unit loop mode is the default, so a
   4-task unit runs as one turn instead of `P1 → P2 → P3 → P4`.

## User outcome

A contributor running the lane on a unit with a PR gets a merge gate that
works: the receipt is posted at close (or the lane visibly hands off to
`/review-change`), and `/audit-pr` is the named next stage. An operator on the
`nan` recommended profile gets the advertised economics: triage/review/audit at
the strong tier, each execution phase one cheap-model turn
(`/execute-phase <NN> P<k>`), with the tier printed on every hand-off.

## Acceptance criteria

From issue #291 (its own ACs — verbatim intent, not induced):

1. **AC1 — Receipt at close.** A lane run on a unit with an open PR ends with
   a posted `review-change:pass` receipt at the settled head (verified by
   `bun scripts/review-receipt.mjs verify --pr <N>` exit 0), or the lane stops
   and prints `/review-change` as its closing recommendation before `/audit-pr`
   can be mentioned.
2. **AC2 — Terminal stage.** When all triaged steps are done, the lane's
   `→ Next:` recommends `/audit-pr` as the terminal stage (receipt precondition
   stated), per the closing-hand-off grammar.
3. **AC3 — One phase per hand-off.** Every execution step boundary of a lane
   run prints `/execute-phase <NN> P<k>` naming exactly one phase; neither the
   lane's closing block nor `unit-route`'s execute route can emit the bare
   whole-unit command. Whole-unit mode survives only as an explicit operator
   choice.
4. **AC4 — Tier reaches the boundary.** Triage output carries the per-step
   `budget_tier` from `scripts/catalog.json` (the aggregate rule at
   `unit-route.mjs`'s `triageSteps` is removed or documented as derived from
   them — no second source), and the tier is printed with the `→ Next:`
   hand-off. The `implement: strong` catalog tier vs. the operator intent to
   run implement on a cheap model is resolved explicitly and recorded as a
   decision, not left contradictory.
5. **AC5 — Docs + versions.** Docs updated where the flow is described
   (`docs/workflow/LANE_FLOW.md`, both skills' relationship sections); skill
   versions bumped + CHANGELOG rows per the versioning rule, same PR.
6. **AC6 — Smoke test.** Executor-path wording change smoke-tested per
   `docs/workflow/GOLDEN_FIXTURE.md`.

## Non-goals

- No change to the receipt contract itself (`review-change`, `audit-pr`,
  `scripts/review-receipt.mjs`) beyond relationship wording.
- No new model-routing profiles or tier maps (#260, #201, #246 stay out).
- No change to `workflow-status`'s next-step ranking (it already emits the
  per-phase form).
- No envelope schema change (nothing in `packages/agentic-workflow-schema`).
- The lane keeps composing its review-pack axes for the in-doc
  `REVIEW-VERDICT`; this unit only adds the receipt stage at close-out.

## Future

none

## Future cost

- The per-phase hand-off contract binds every skill that prints an execution
  `→ Next:` (`unit-lane`, `execute-phase`, `unit-route`'s execute route): they
  must name exactly one phase — a new execution surface that prints a bare
  whole-unit command is a defect.

## Applicable tests

- `scripts/unit-route.test.mjs` (triage output: per-step tiers, aggregate
  derived, execute route phase-named)
- `scripts/catalog.test.mjs` (tier flip)
- `scripts/turn-contract-grammar.test.mjs` + `scripts/normative-drift.test.mjs`
  (closing-hand-off grammar surfaces)
- `scripts/check-skill-context.mjs` (context budgets)
- `node --test scripts/*.test.mjs` (root suites green)
- Golden fixture smoke per `docs/workflow/GOLDEN_FIXTURE.md` (AC6)

## Known pre-existing issues

- F1 on PR #290 / unit 72 (`missing-review-receipt` at the gate) — **affects**
  this unit: it is the live observation the unit repairs.
- Related-but-out-of-scope: #260 (cheap-model topology), #201 (model routing
  for spawned passes) — **does-not-affect**: different topology, no dependency.

## Tasks

- P1 — unit-route triage emits each step's `budget_tier` from `scripts/catalog.json` and derives the aggregate from those tiers (hardcoded rule deleted), flipping the `implement` step's tier to `cheap` per decision D1 (validator: `node --test scripts/unit-route.test.mjs scripts/catalog.test.mjs` exits 0)
  - Relevant files: scripts/unit-route.mjs, scripts/catalog.json, scripts/unit-route.test.mjs, scripts/catalog.test.mjs
- P2 — unit-route's execute route prints `/execute-phase <slug|fix> P<k> (tier: <execution-tier>)` with the first unfinished phase derived from the unit doc, never the bare whole-unit command (validator: `node --test scripts/unit-route.test.mjs` exits 0)
  - Relevant files: scripts/unit-route.mjs, scripts/phase-lint.mjs, scripts/unit-route.test.mjs
- P3 — `unit-lane` SKILL.md + references carry the per-phase hand-off contract at execution boundaries and the close-out ladder with the receipt stage and the `/audit-pr` terminal stage (validator: `bun scripts/check-skill-context.mjs --routes` exits 0)
  - Relevant files: skills/unit-lane/SKILL.md, skills/unit-lane/references/
- P4 — `execute-phase` SKILL.md closing hand-off names the next single phase and the tier, resumes the lane after the last phase, and requires the Progress entry to name the phase id; relationship section aligned with the lane (validator: `bun scripts/check-skill-context.mjs --routes` exits 0)
  - Relevant files: skills/execute-phase/SKILL.md
- P5 — flow docs updated: `docs/workflow/LANE_FLOW.md` lifecycle step 7 + triage-block example (validator: `node --test scripts/doc-discipline.test.mjs` exits 0)
  - Relevant files: docs/workflow/LANE_FLOW.md
- P6 — verification: root suites, context budgets, golden-fixture smoke test, `bump-skill` version bumps + CHANGELOG rows (validator: `node --test scripts/*.test.mjs` exits 0)
  - Relevant files: CHANGELOG.md, README.md, skills/*/SKILL.md

### Planning evidence

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| Lane review emits no receipt | `grep -rn "review-receipt" skills/unit-lane/` → 0 hits; `skills/unit-lane/references/REVIEW.md` fixed output is prose-only | issue #291 D1 | 2026-10-15 |
| `audit-pr` consumes only the SHA-bound receipt | `skills/audit-pr/SKILL.md` Step 1 — newest `review-change:pass sha=<40-hex>` marker or BLOCKER | issue #291 D1 | 2026-10-15 |
| Lane never mentions `execute-phase` | `grep -rn "execute-phase" skills/unit-lane/` → 0 hits | issue #291 D3 | 2026-10-15 |
| Aggregate Budget ignores catalog tiers | `scripts/unit-route.mjs` `triageSteps` line: `steps.some((s) => ["design","tests","review"].includes(s)) ? "strong" : "cheap"` | issue #291 D3 | 2026-10-15 |
| Execute route prints bare command | `scripts/unit-route.mjs`: `` `/execute-phase ${unit.slug}` `` (no phase) | issue #291 D4 | 2026-10-15 |
| Sensor already emits per-phase form | `scripts/workflow-status.mjs` `resolveNext` level 4: `/execute-phase <unit> <phases_.current>` | issue #291 D4 | 2026-10-15 |
| Whole-unit mode is the no-step default | `skills/execute-phase/SKILL.md` §7 | issue #291 D4 | 2026-10-15 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | skills/unit-lane/SKILL.md close-out ladder | Lane close-out posts the receipt or hands off to `/review-change` before mentioning `/audit-pr` | P3 | P3 | unit-lane SKILL.md §6 | check-skill-context + AC1 evidence | closing block text | open |
| O2 | skills/execute-phase/SKILL.md closing contract | Every execution turn's `→ Next:` names exactly one phase; the last resumes the lane | P4 | P4 | execute-phase SKILL.md | check-skill-context + AC3 evidence | closing block text | open |
| O3 | scripts/unit-route.mjs execute route | Machine execute route never emits the bare whole-unit command | P2 | P2 | unit-route.mjs | unit-route.test.mjs | test run | open |
| O4 | scripts/catalog.json `implement` tier | One tier source; `implement` execution routes cheap; decision D1 recorded | P1 | P1 | catalog.json + decisions.md | catalog.test.mjs | test run | open |

## Evidence

### Triaged steps

```
TRIAGE — 73 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC4 (triage half) | `node --test scripts/catalog.test.mjs` | exit 0 | 15/15 pass — tiers match `catalog.json`, `implement: cheap` (D1), aggregate derived | pi (opus, unit-lane) |
| AC4 (triage half) | `node --test scripts/lane-era-lineage.test.mjs` | exit 0 | 19/19 pass — currency check unaffected by the `Tiers:` line | pi (opus, unit-lane) |
| AC4 (triage half) | `node --test scripts/unit-route.test.mjs` | exit 1 → 22/26 | 22 pre-existing pass; 4 red are P2's own red-first tests, committed only at P2 | pi (opus, unit-lane) |
| AC3 | `UNIT_ROUTE_REPO=…/unit-route node scripts/unit-route.mjs 13\|14\|22\|17` | exit 0 / 0 / 0 / 1 | `/execute-phase 13-execute-unit P2 (tier: cheap)` · `14… P1` · `--fix 22 P2` · phaseless → fail-closed, no bare command | pi (opus, unit-lane) |
| AC3 | `node --test scripts/unit-route.test.mjs` | exit 0 | 26/26 pass — phase-named execute route, untouched-log P1, fail-closed no-phase | pi (opus, unit-lane) |
| AC4 (one-source) | `node --test scripts/phase-lint.test.mjs` | exit 0 | 151/151 pass — `parseUnitDocPhases` exported, parser unchanged | pi (opus, unit-lane) |
| AC3 (sandbox mirrors) | `node --test scripts/workflow-status-sensor.test.mjs scripts/review-loop-discipline.test.mjs scripts/normative-drift.test.mjs scripts/lane-era-lineage.test.mjs scripts/catalog.test.mjs` | exit 0 | 67 + 1 + 18 + 34 pass — sandboxes mirror the router's new `phase-lint` import | pi (opus, unit-lane) |
| AC3/AC4 (skill contract) | `bun scripts/check-skill-context.mjs --routes` | exit 0 | PASS route budgets: 14 routes | pi (opus, unit-lane) |
| AC1/AC2/AC3 (skill contract) | `node --test scripts/next-recommendations.test.mjs scripts/normative-drift.test.mjs scripts/continuation-discipline.test.mjs scripts/review-loop-discipline.test.mjs scripts/pre-execution-quality.test.mjs` | exit 0 | 7 + 24 pass — closing-hand-off grammar, receipt ladder, per-phase hand-off wording conform | pi (opus, unit-lane) |
| AC3/AC4 (executor contract) | `bun scripts/check-skill-context.mjs && --routes` | exit 0 | PASS 28 skills · PASS 14 routes — execute-phase mirror contract in budget, ceilings re-based with declared source | pi (opus, unit-lane) |
| AC5 (flow docs) | `node --test scripts/doc-discipline.test.mjs` | exit 0 | 16/16 pass — lifecycle, tiered triage block + JSON shape, per-phase command table | pi (opus, unit-lane) |
| AC6 (smoke) | golden-fixture weak-model run (nan/qwen3.6, 5 scenarios + re-run) | exact 5/5 · invented none · shape ok | run-log row in GOLDEN_FIXTURE.md; first run caught the last-phase `P<k+1>` defect → wording split into two end-states, re-run exact | pi (opus, unit-lane) |
| AC5 (versions) | `node --test scripts/*.test.mjs` | exit 0 | 654/654 pass — version rows match frontmatter (rendered-facts gate), run-log grammar, full gate green | pi (opus, unit-lane) |

## Progress log

- 2026-10-15 23:15 — P1 — triage emits per-step `budget_tier` from `catalog.json` (one source), aggregate derived, `implement` flipped cheap per D1 → 4b587661 — next: the execute-route phase hand-off
- 2026-10-15 23:15 — P2 — execute route hands off one phase + the execution tier, fail-closed on a phaseless Tasks section; `parseUnitDocPhases` exported as the one phase parser; sandbox mirrors carry the router's new import → d5a0f3e5 — next: the lane's per-phase hand-off contract in the skill text
- 2026-10-15 23:20 — diff-guard (base 9e5aba25 → d5a0f3e5): `Lines: 235 · Files: 13 > 8` — **BREACH on file count, exception recorded**: honest split attempted (P1 and P2 are separate scoped commits); the 13 files are 2 source + 3 test (red-first pins + 2 sandbox mirrors of the router's new import) + 4 fixtures the red tests require + 2 unit-doc bookkeeping files; lines are under budget and no test, doc or fixture may be deleted to shrink the count (anti-gaming rule) — next: P3 skill wording
- 2026-10-15 23:30 — P3 — lane skill carries the per-phase hand-off contract (execution steps never inline, one `P<k>` + tier per hand-off), the close-out ladder with the receipt stage, and `/audit-pr` as the terminal gate → d235446b — next: execute-phase's mirror contract
- 2026-10-15 23:45 — P4 — execute-phase closing hand-off names the next single phase + tier, resumes the lane after the last phase, whole-unit mode demoted to explicit operator choice, Progress entry names the phase id; context ceilings re-based with declared source (issue #291) → 11f99cea — next: flow docs
- 2026-10-15 23:55 — P5 — LANE_FLOW.md lifecycle (hand-off steps, receipt stage, terminal gate), tiered triage block + JSON shape, per-phase command table → e242a44b — next: verification + versions
- 2026-10-16 00:10 — P6 — full gate green (654/654), budgets PASS, golden-fixture smoke run (caught + fixed the last-phase `P<k+1>` defect), bump-skill: unit-lane 1.5.0 + execute-phase 5.1.0, CHANGELOG rows + release-log line, README cells → see commit — next: review + release

## Next

Run the triage (`bun scripts/unit-route.mjs --triage 73`) and paste its block
as the authoritative step list.

## References

- Issue [#291](https://github.com/gtrabanco/agentic-workflow/issues/291)
- Related: #260, #201, #246 (out of scope)
- Live observation: PR #290 / unit 72 F1 (`docs/features/72-pi-100-compat-guard/review-findings.md`)
