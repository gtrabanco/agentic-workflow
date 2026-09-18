# fix/244-freeze-batch-planner-consumer

> Fix specification. Copy of `docs/fix/_TEMPLATE/SPEC.md` filled per issue
> #244. Registered in `docs/fix/README.md` (`pending`). Fix unit — no Product
> half exists; its authority is reproduction, root cause, regression scope,
> rollback path, and the affected use case.

## Goal

Repair the `fold-findings` freeze-batch hand-off so its `→ Next:` block
recommends the *conclusion* the unit router already produced — `/plan-fix <n>`
(fix) or `/plan-feature <slug>` (feature) — instead of the raw
`node scripts/unit-route.mjs <unit>` invocation, and so the closing-block
contract pins each `·` sub-bullet to exactly one physical line. A weak model
copying the current block verbatim hands its user a discovery script the fold
already ran and a hand-wrapped sub-bullet that breaks the fixed block shape;
the planner command it should surface is only implicit. A regression pin in
`scripts/normative-drift.test.mjs` — the file that owns closing-hand-off
drift — makes a reintroduction fail CI.

## Issue

#244 — tracked issue in the project's forge (severity low). The PR must close
it via `Closes #244` in the body.

## Branch

`fix/244-freeze-batch-planner-consumer`, cut from `main` (`3781d651`).

## Depends on

None.

## Root cause

Fix #224 ("Deterministic replan routing", commit `3904ab06`) introduced
`scripts/unit-route.mjs` as the replan router and, in the same change, wrote
the router *invocation* into the freeze-batch consumer cell and prose:

- `skills/fold-findings/SKILL.md` freeze-batch paragraph and the
  closing-block decision table name `node scripts/unit-route.mjs <unit>` as
  the `→ Next:` consumer — the actionable slot — while the planner command
  (`/plan-fix <n>` / `/plan-feature <slug>`) the router prints on its
  `next:` line is left implicit.
- `skills/fold-findings/references/FOLD_PROCESS.md` repeats the invocation in
  the batch-classification table and step 9 (Replan).

The fixed `→ Next:` block's REPLAN sub-bullet compounds it: it says "confirm
all proposed SPEC phases, then /execute-phase", skipping the planner step the
freeze-batch actually routes to. Nothing validates any of it: the
`closing_handoffs` grammar (`CLAUDE.md`, `normative-surfaces@1`) reads only
the fenced `→ Next:` blocks and only the recommended line — and the
`# hand-off-host-commands: clear` directive means a host command in a hand-off
was never admissible, which is why the invocation ended up in a table cell,
outside every grammar's scope. The one-physical-line rule has the same gap:
`review-change`'s `PERSIST_AND_DECIDE.md` forbids *joining* sub-bullets, but
nothing forbids *hard-wrapping* one, and a real fold run wrapped a sub-bullet
across two lines (issue #244's reproduction).

## Detected in

`/fold-findings` for fix #182 on 2026-09-18 (REVIEW-FAIL → freeze-batch,
F3 class `replan-in-unit`): the turn printed the router invocation as the
recommendation and emitted a hard-wrapped sub-bullet. Recorded in issue #244
(2026-09-18) and `docs/LOGS.md` session 2026-09-18.

## Scope

### In scope

1. **Pin test first** (`scripts/normative-drift.test.mjs`, P1): a `#244` test
   that reads the fold-findings fixed `→ Next:` block and closing-block
   decision table and fails while the skill bytes still carry the defects —
   sub-bullets hard-wrapped or a host command as the consumer — and passes
   once P2 lands.
2. **Skill contract repair** (`skills/fold-findings/SKILL.md`,
   `skills/fold-findings/references/FOLD_PROCESS.md`, P2): the freeze-batch
   prose, the fenced REPLAN sub-bullet, and the decision-table consumer cell
   name `/plan-fix <n>` / `/plan-feature <slug>` as the recommendation; the
   router invocation is described as the already-run discovery step; the
   `<unit>` argument format (bare folder number or full slug) is stated; the
   one-physical-line rule is added to the closing-block contract in both
   files.
3. **Release wiring** (P3–P4): `fold-findings` version bump (1.5.1, patch — the
   same bump class fix #63 got for the same defect family), `CHANGELOG.md`
   rows (P3), and the `packages/pi-agentic-workflow/skills/` mirror refreshed
   with the package version bump (P4) so the parity test stays byte-identical.

### Out of scope

- **Other skills' router prose.** `review-implementation/SKILL.md`,
  `review-implementation/references/CLASSIFY.md`, `review-change`'s
  `OUTPUT_AND_GUARDRAILS.md`, and the `docs/workflow/` guides name
  `node scripts/unit-route.mjs <unit>` in *discovery* sentences ("run the
  router — its `route: replan` line names the planner"), which is the
  behaviour #244 declares correct. Only the hand-off consumer slot is wrong;
  widening the edit to those surfaces is scope bleed.
- **Generalizing the physical-line rule beyond fold-findings.** The issue's
  acceptance criteria name the `fold-findings` skill + references. Promoting
  the rule repo-wide (e.g. into `TURN_CONTRACT.md` or every skill's fixed
  block) is a separate decision.
- **Extending the `closing_handoffs` grammar to table cells.** The pin test
  covers the freeze-batch cell deterministically; a grammar extension is a
  sensor-design change with repo-wide blast radius, tracked here only as an
  alternative that was weighed and not taken (see Decisions).
- Adjacent sensor/router behaviour (`workflow-status` `next.suggested`,
  `scripts/unit-route.mjs` itself) — unchanged; the router already prints the
  right conclusion.

### Planning evidence

The fix's own authority: reproduction, root cause with code evidence,
regression scope, rollback path, and the affected use case — one compact row
each.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: the freeze-batch `→ Next:` consumer names the router invocation, the planner command is only implicit, the `<unit>` format is undocumented (`node scripts/unit-route.mjs fix-182` exits 1 `unknown unit: fix-182` while `182` and the full slug resolve), and a sub-bullet may be hard-wrapped | repository | `skills/fold-findings/SKILL.md:125,166-171,184`; `skills/fold-findings/references/FOLD_PROCESS.md:46,61`; issue #244 reproduction block (commands + outputs, run 2026-09-18) | `3781d651` | O1, O2, O3, AC1, AC2, AC3 | current | proven | — |
| PE-002 | Root cause: fix #224's canonical-replan-destination change wrote the router invocation into the consumer slot and table cell; the `closing_handoffs` grammar reads only fenced `→ Next:` recommended lines, so the defect is invisible to the sensor | repository | `git log --oneline -S "unit-route.mjs <unit>" -- skills/fold-findings/SKILL.md` → `3904ab06`; `CLAUDE.md` `normative-surfaces@1` row `closing_hand-offs`; `scripts/normative-drift.test.mjs:511` (`→\s*Next:\s*\/` recommended-line regex) | `3904ab06` | O1, O4, AC1, AC4 | current | proven | — |
| PE-003 | Regression scope: the change touches two skill files, one test file, `CHANGELOG.md`, the `fold-findings` frontmatter version, and the generated pi mirror; no script runtime, no schema package byte, no envelope field, no forge call | repository | file inventory in `### In scope`; `grep -rn "unit-route.mjs" skills/fold-findings/` (2 files only); `CLAUDE.md` mirror-parity rule | `3781d651` | O1–O6, AC1–AC6 | current | proven | — |
| PE-004 | Rollback path: one `git revert` of the fix PR restores the pre-fix skill bytes, test, versions, and mirror; data cleanup: none (no schema, no migration, no persisted state); preserved: any receipts already printed by fold runs (transcript history, not repository state) | derived | rule "single-commit revert", inputs PE-003; issue #244 rollback section | — | O1–O6, AC1–AC6 | not-applicable | decision | — |
| PE-005 | Affected use case: a hand-off printed as the ABSOLUTE-last output must be directly actionable by a weak model copying it verbatim — the consumer slot carries the next command, never the discovery step that named it (defect class of closed issue #63) | repository | issue #63 ("static → Next block recommends /audit-pr even on FAIL (weak models copy it verbatim)"); `skills/fold-findings/SKILL.md` turn-contract box 5; `CHANGELOG.md` `#### fold-findings` 1.5.0 row (the 1.5.0 bump itself declared the router invocation) | `3904ab06` | O1, O3, O5, AC1, AC3 | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | Issue #244 expected behaviour (1) | Freeze-batch `→ Next:` consumer names the router's conclusion — `/plan-fix <n>` (fix) or `/plan-feature <slug>` (feature); the invocation appears only as the described prior discovery step (SKILL.md prose + fenced REPLAN sub-bullet + decision-table cell; FOLD_PROCESS.md batch-classification cell + step 9) | P2 | P2 tasks 1–3 | executor | `node --test scripts/normative-drift.test.mjs` (#244 pin) → exit 0; `grep -c "/plan-feature <slug>" skills/fold-findings/SKILL.md` → ≥ 2 | pin output + grep counts | planned |
| O2 | Issue #244 expected behaviour (2) | The `<unit>` argument format is stated — bare folder number or the full slug — where the router is named in `skills/fold-findings/SKILL.md` and `references/FOLD_PROCESS.md` | P2 | P2 task 4 | executor | `grep -c "bare folder number or the full slug" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → 1 per file | grep counts | planned |
| O3 | Issue #244 expected behaviour (3) | The closing-block contract states each `·` sub-bullet is exactly one physical line — never hard-wrapped across several, never joined into one prose line — in SKILL.md and FOLD_PROCESS.md | P2 | P2 tasks 2, 4 | executor | pin test (block-shape assertion) → pass; `grep -c "exactly one physical line" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → 1 per file | pin output + grep counts | planned |
| O4 | Issue #244 acceptance criterion (4) | A pin/test guards the freeze-batch hand-off so the regression fails CI: sub-bullet hard-wrapped in the block, a host command as the consumer, or the planner command removed from block or cell | P1 | P1 tasks 1–2 | executor | `node --test scripts/normative-drift.test.mjs` → exit 1 at pre-fix HEAD (red recorded in P1), exit 0 after P2 | red/green run outputs | planned |
| O5 | Issue #244 acceptance criterion (6) | `fold-findings` version bumped + a `CHANGELOG.md` row in the same PR (1.5.1 patch, fix-#63 precedent), with the companion-package re-bundle row | P3 | P3 tasks 1–3 | executor | `grep -c "^| 1.5.1 |" CHANGELOG.md` → 1; `grep -c "^| 0.11.2 |" CHANGELOG.md` → 1; frontmatter `version: 1.5.1` | grep counts | planned |
| O6 | Issue #244 acceptance criterion (5) | Bundled `packages/pi-agentic-workflow/skills/` mirror refreshed and byte-identical; project gate green | P4 | P4 tasks 1–3 | executor | `cd packages/pi-agentic-workflow && bun run test` → exit 0 (includes `test/skill-parity.test.mjs`); `bun scripts/check-skill-context.mjs` → exit 0 | suite outputs | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` — never unlabelled prose.

### AC1 — Freeze-batch consumer is the router's conclusion

`skills/fold-findings/SKILL.md` (prose, fenced `→ Next:` REPLAN sub-bullet,
decision-table cell) and `skills/fold-findings/references/FOLD_PROCESS.md`
(batch-classification freeze-batch cell, step 9) name `/plan-fix <n>` and
`/plan-feature <slug>` as the consumer and describe
`node scripts/unit-route.mjs <unit>` as the already-run discovery step, never
the recommendation.

Validator: `node --test scripts/normative-drift.test.mjs` → exit 0 (the `#244`
pin asserts block + cell tokens) and
`grep -c "/plan-feature <slug>" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → ≥ 1 per file.

### AC2 — `<unit>` argument format documented

Validator: `grep -c "bare folder number or the full slug" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → 1 per file.

### AC3 — One-physical-line rule stated in the contract

Validator: `grep -c "exactly one physical line" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → 1 per file, and the `#244`
pin's block-shape assertion (no wrapped sub-bullet) passes.

### AC4 — Regression pin guards the freeze-batch hand-off

The `#244` test in `scripts/normative-drift.test.mjs` fails while the skill
bytes carry the defect (hard-wrapped sub-bullet, router invocation as
consumer, missing planner command) and passes on the fixed bytes.

Validator: `node --test scripts/normative-drift.test.mjs` → exit 0; the red
run at pre-fix HEAD recorded in P1 (`read-verified`: P1 task 2 output).

### AC5 — Gate and mirror green

Validator: `bun scripts/check-skill-context.mjs` → exit 0;
`node --test scripts/*.test.mjs` → exit 0;
`cd packages/pi-agentic-workflow && bun run test` → exit 0 (the bundled
mirror parity check runs inside the suite).

### AC6 — Version bump and CHANGELOG rows in the same PR

Validator: `grep -c "version: 1.5.1" skills/fold-findings/SKILL.md` → 1;
`grep -c "^| 1.5.1 |" CHANGELOG.md` → 1;
`grep -c "^| 0.11.2 |" CHANGELOG.md` → 1.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001), the root
      cause (PE-002), the regression scope (PE-003), and the rollback path (PE-004) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Phases

Execution ledger — `execute-phase --fix 244` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

Phase-lint: PASS (8/8) · fingerprint `P1:hardening:2:freeze-batch-hand-off-pin`
Phase-lint: PASS (8/8) · fingerprint `P2:docs:6:freeze-batch-consumer-contract`
Phase-lint: PASS (8/8) · fingerprint `P3:docs:3:release-wiring`
Phase-lint: PASS (8/8) · fingerprint `P4:config/infra:3:mirror-re-bundle`
Phase-lint: PASS (8/8) · fingerprint `P5:hardening:7:hardening-pr`

### P1 — Freeze-batch hand-off pin

Layer: hardening. Done-when: `node --test scripts/normative-drift.test.mjs`
→ exit 1 with only the new `#244` test failing (red against the unfixed skill
bytes).

- [ ] Add the `#244` test to `scripts/normative-drift.test.mjs`: over the fold-findings fixed closing block — every line after the block's `Next:` header line is a `· ` sub-bullet (one physical line, no wrapped continuation), no router-invocation token inside the block, and the REPLAN sub-bullet names both planner commands
- [ ] Extend the `#244` test in `scripts/normative-drift.test.mjs` with the second half: the freeze-batch consumer cell in the closing-block decision table names both planner tokens with their unit kinds and marks the router invocation as discovery; both skill files carry the `bare folder number and the full slug` format sentence and the `exactly one physical line` rule sentence; run the suite and record the red output (failures confined to the new test) in `progress.md`

### P2 — Freeze-batch consumer contract

Layer: docs. Done-when: `node --test scripts/normative-drift.test.mjs`
→ exit 0 and `bun scripts/check-skill-context.mjs` → exit 0.

- [ ] `skills/fold-findings/SKILL.md` freeze-batch prose: the `→ Next:` block recommends the planner command the already-run router named — the fix planner for a fix unit, the feature planner for a feature — and the invocation is described as the discovery step, never the recommendation
- [ ] `skills/fold-findings/SKILL.md` fixed `→ Next:` block: the REPLAN sub-bullet names both planner tokens with their unit kinds as the consumer and carries the planner-append, user-confirm, fresh-review, execute chain on exactly one physical line; the one-physical-line rule (never hard-wrapped, never joined into prose) is stated under the block
- [ ] `skills/fold-findings/SKILL.md` closing-block decision table: the freeze-batch `REPLAN-ROUTE` consumer cell names both planner tokens with their unit kinds and marks the router invocation as the discovery step the fold already ran
- [ ] `skills/fold-findings/references/FOLD_PROCESS.md`: the batch-classification freeze-batch cell and step 9 (Replan) name both planner tokens as the route, describe the invocation as the discovery step, and state the `<unit>` format (the bare folder number and the full slug both resolve); the closing-block section states the exactly-one-physical-line rule
- [ ] Run the pin suite (`node --test scripts/normative-drift.test.mjs`) → exit 0 — the P1 pin turns green
- [ ] Run `bun scripts/check-skill-context.mjs` → exit 0 (budget ceilings hold for the edited skill)

### P3 — Release wiring

Layer: docs. Done-when: `grep -c "^| 1.5.1 |" CHANGELOG.md` → 1 and
`grep -c "^| 0.11.2 |" CHANGELOG.md` → 1.

- [ ] `skills/fold-findings/SKILL.md`: bump the frontmatter `version:` to `1.5.1` (patch — wording/contract clarification, the fix-#63 bump precedent)
- [ ] `CHANGELOG.md`: add the `fold-findings` 1.5.1 row to the `#### fold-findings` table (fix #244: freeze-batch consumer names the router's conclusion; `<unit>` format documented; one-physical-line rule; `#244` pin)
- [ ] `CHANGELOG.md`: add the companion-package 0.11.2 re-bundle row to the package's table (publishes the refreshed `fold-findings`; no package code change)

### P4 — Mirror re-bundle

Layer: config/infra. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ exit 0.

- [ ] `packages/pi-agentic-workflow/package.json`: bump the `version:` field to `0.11.2`
- [ ] `packages/pi-agentic-workflow`: refresh the bundled skills mirror with the package's `bundle:skills` script
- [ ] `packages/pi-agentic-workflow`: run the package test suite (`bun run test`) → exit 0, proving the bundled mirror is byte-identical to `skills/`

### P5 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the project verification gate commands exit 0.

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #244`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

## Testing

The regression guard is a `#244` test inside `scripts/normative-drift.test.mjs`
(integration: reads the real skill bytes through the same
`fixedOutputBlocks`/`markdownTable` helpers the drift sensor uses, so the pin
cannot drift from the grammar it guards). It is written first and observed red
against the unfixed bytes, then green after P2 — the red run is the evidence
that the pin has regression power. No new runtime, fixture, or golden file.

## Failure scenarios

| Scenario | Guard |
|---|---|
| A future fold-findings edit reintroduces the router invocation as the consumer in the fenced block | P1 pin: `unit-route.mjs` token inside the block → test fails |
| A future edit hard-wraps a `·` sub-bullet across physical lines | P1 pin: every post-header line must start with `· ` → test fails |
| A future edit drops the planner command from the fenced REPLAN sub-bullet or the freeze-batch table cell | P1 pin: `/plan-fix` + `/plan-feature` assertions → test fails |
| The `<unit>` format sentence or the one-physical-line rule is deleted | P1 pin: fixed-fragment assertions over both files → test fails |
| The edited skill exceeds a context budget ceiling | `bun scripts/check-skill-context.mjs` → exit 1 (P2 done-when) |
| The committed mirror drifts from `skills/` | `test/skill-parity.test.mjs` inside the package suite → suite fails (P3 done-when) |

## Rollback

Single PR; `git revert` of the merge commit restores the previous skill bytes,
the test file, the versions, and the mirror (the mirror re-bundles on revert
with the skill bytes). Data cleanup: none — no schema, no migration, no
persisted state. Preserved: everything the fix did not touch (the router
itself, the sensor, other skills' prose).

## Status

`pending`

## Rules that must never be violated

- **Machine surfaces stay machine-checked** (AC15, `CLAUDE.md` rendered
  facts/normative surfaces): a fixed-output block's consumer is a declared
  skill command, and `# hand-off-host-commands: clear` means no host command
  ever occupies a hand-off recommendation slot.
- **Fixed output formats are copied verbatim** (`CLAUDE.md` workflow
  principles; issue #63's contract): the closing block's shape — one physical
  line per `·` sub-bullet — is part of the contract, not a rendering choice.
- **The fold never reclassifies and the freeze-batch never folds**
  (`FOLD_POLICY.md`/`FOLD_PROCESS.md` step 7): this fix touches only the
  hand-off contract, not the batch classification, the receipt, or the
  commit/push rules.
- **Test immutability** (`verification-contract`): the P1 pin is written
  before the doc fix and is never edited to pass; P2 changes the skill bytes,
  never the test.
- **Docs language is English-only** (`CLAUDE.md` working rules): no `.es.md`
  sibling, no language-switcher link.

## Impact

- **Layers touched:** docs (two skill files, CHANGELOG), hardening (one test
  file), config/infra (pi package version + generated mirror). No schema, no
  application runtime, no forge call.
- **Modules and files:** `skills/fold-findings/SKILL.md`;
  `skills/fold-findings/references/FOLD_PROCESS.md`;
  `scripts/normative-drift.test.mjs`; `CHANGELOG.md`;
  `packages/pi-agentic-workflow/package.json` (version only);
  `packages/pi-agentic-workflow/skills/fold-findings/**` (generated mirror).
- **Blast radius:** consumers of the `fold-findings` closing block only. The
  drift sensor's grammar rows are unchanged (the pin rides the existing test
  file); the router, the sensor envelope, and every other skill's bytes are
  untouched. Detection lead time: CI — the pin and the parity/context checks
  fail before merge.
- **Performance:** none (text edits + one more test in an existing suite).

## Operational risks

- **Budget ceiling.** The edited `SKILL.md` grows a few lines;
  `fold-findings` currently sits at 2469/2800 estimate and 201/240 lines
  (`bun scripts/check-skill-context.mjs --skill fold-findings`, 2026-09-19),
  so the additions hold with margin; P2's done-when fails closed if not.
- **No scheduled job, queue, cache, schema, or external-adapter interaction**:
  the change is documentation and one test. n/a otherwise.

## Security risks

n/a — no auth, secrets, PII, webhook, or rate-limit surface; the change only
alters printed recommendation text and test assertions.

## Compliance touchpoints

n/a — no domain or compliance rule touches skill hand-off prose.

## Affected docs

- `CHANGELOG.md` — `fold-findings` 1.5.1 row + companion-package 0.11.2
  re-bundle row (P3; AC6).
- `docs/fix/README.md` — the `#244` row already registered (`pending`);
  flipped to `done · [#<pr>](<pr-url>)` by the final phase.
- `docs/workflow/SKILLS.md` — read-verified: no row restates the freeze-batch
  consumer (`grep -n "unit-route" docs/workflow/SKILLS.md` → no
  hand-off-consumer sentence), so no update is required.

## Observability

- The `#244` pin in `scripts/normative-drift.test.mjs` fails CI on any
  regression of the consumer contract (silent-failure guard).
- `bun scripts/check-skill-context.mjs` and the package parity test report
  budget/mirror drift; both are P2/P3 done-when gates.

## Cross-issue notes

- **#63 (closed)** — same defect family (weak model copies the static
  `→ Next:` block verbatim). This unit applies the same remedy class to the
  freeze-batch branch and reuses #63's patch-bump precedent. No conflict.
- **#224 (closed, merged via `3904ab06`)** — introduced the defect by writing
  the router invocation into the consumer slot. Its routing machinery (the
  router, the sensor projection) is correct and untouched; only the
  fold-findings hand-off wording is repaired.
- **#179 (`pending`, fix index)** — unrelated surface (declared ledger delta
  receipts); no dependency either way.
- **`review-implementation` / `review-change` router prose** — those surfaces
  already describe the invocation as discovery (the correct shape); this unit
  deliberately does not touch them (Out of scope).

## Effort

S — one bounded test (~40 lines), four prose edits, one version bump, one
mirror re-bundle; a single reviewable PR well under a day.

## Decisions made during drafting

- **Pin test over grammar extension.** The issue offers two guard options;
  this SPEC takes the pin test (assertions over the real bytes through the
  sensor's own helpers) instead of extending `closing_handoffs` to table
  cells, because the grammar extension changes a repo-wide machine surface
  for one cell and risks false refusals in other skills' tables. Recorded as
  a weighed alternative, revisitable as a separate unit.
- **Patch bump (1.5.1), not minor.** Fix #63 — the same defect family —
  shipped as a patch: the fix corrects what the block prints, adds no flag,
  and changes no invocation surface. The one-physical-line rule is a contract
  clarification of the existing fixed shape.
- **Fixed grep fragments.** AC2/AC3 validators pin the exact sentences
  (`bare folder number or the full slug`, `exactly one physical line`) so the
  criteria stay mechanical; the wording inside each sentence may be extended
  but the fragment must survive.
- **The fenced REPLAN sub-bullet absorbs the confirm/review/execute steps.**
  The old sub-bullet ("confirm all proposed SPEC phases, then
  /execute-phase") skipped the planner; the new one carries the full chain on
  one line, so the fixed block stays the single source of the branch's route.

## Planning preflight record

Router (`node scripts/unit-route.mjs 244`, 2026-09-19):
`route: plan-from-issue` — ordinary fix-SPEC draft, replan contract not
loaded.

Preflight: Stage 1 — NRS consumed · arch: deferred

Preflight: NRS consumed · invariant classification: n/a (no project invariants declared)

(`docs/workflow/REPOSITORY_STATE.md` status `frozen`; F010 records that no
`ARCHITECTURAL_INVARIANTS.md` exists, so Stage 2 passes `n/a`. The fix is
skill-text and test-only — no architectural rule is touched.)

Readiness (`evidence-grounding` `references/READINESS.md`, `stage: plan`):

```text
READINESS — fix 244-freeze-batch-planner-consumer plan READY-FOR-REVIEW
- Artifact revision: ar-fix244-20260919-plan-1 · Rows checked: 11 · Unknowns open: 0
- Evidence: SPEC ### Planning evidence (PE-001..PE-005) · Frozen: 2026-09-19
```

(Manual authoring workflow: no runtime rotates `artifactRevisionId`; the
planner's declared id is carried here and in the hand-off. Stage: plan boxes
evaluated over the frozen ledgers above — box 1 is n/a for a fix unit (no
Product half exists; the issue is the authority), boxes 2–11 ticked against
the repository evidence cited in each row.)

`artifactRevisionId`: `ar-fix244-20260919-plan-1` (this draft write).
