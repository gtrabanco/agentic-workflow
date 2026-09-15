# fix/224-deterministic-replan-routing

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> separate planning artifacts: the SPEC and sibling `ACCEPTANCE.md` are the
> source of truth, and its `## Phases` section is the execution ledger.

## Goal

Give the workflow one deterministic entry decision for a unit, computed by a
script instead of inferred from prose: a unit carrying an open finding whose
frozen route is the plan owner takes the replan route, with a bounded read set
that reaches the finding without being told its id; a unit with no open row
takes its ordinary route. Today the replan destination exists only as three
contradictory prose sentences, the planner cannot see the ledger the finding
lives in, and the documented machine signal is not emitted — so an operator who
follows the workflow's own instructions reaches a stop that never mentions the
finding. This cannot wait for a feature cycle: it is a defect in the routing the
review loop depends on to close at all.

## Issue

`#224` — tracked issue in the project's forge. Required. The PR must close it
via `Closes #224` in the body (or the forge's equivalent auto-close
convention).

## Branch

`fix/224-deterministic-replan-routing`

## Depends on

None for this fix's own delivery: `#205`, `#172` and `#194` are independent; it
consumes their vocabulary without re-opening their decisions. One cross-unit
ordering note (RP-224-1, refreshed by the replan `fix-224-artrev-0004`/`-0005`):
unit `37-phase-lint-script` was unmerged when AC5's fixture leg was frozen and is
now merged into `main` (`docs/features/ROADMAP.md:47` row 37 = `done · [#212]`;
the unit directory and `scripts/phase-lint.mjs` are on the branch — PE-011 and
PE-013 carry the refreshed observation). AC5 therefore keeps its committed
fixture as the accepted evidence and the live variant
`node scripts/unit-route.mjs 37-phase-lint-script` — now runnable against the
real unit — was executed as the informational post-merge check in
`### Testing`, never an acceptance criterion.

## Root cause

Four independent surfaces grew around one missing owner, so no single place can
be blamed and none of them can be fixed in isolation:

1. **The planner cannot see the ledger.** The progressive-loading allowlists of
   both planners are closed lists that exclude `review-findings.md`:
   `skills/plan-feature/SKILL.md:56-68` (redirect gate, planning preflight,
   phase contract) and `skills/plan-fix/SKILL.md:91-108` (planning process,
   SPEC contract, preflight, phase contract, verification contract). A finding
   that routes to the plan owner is therefore invisible to the skill that owns
   the repair.
2. **The gate refuses before the ledger is ever considered.**
   `skills/plan-feature/references/ROUTING.md:17-24` stops on a roadmap row at
   `planned`/`in-progress` with a block that sends the operator to
   `/execute-phase`; a unit carrying an unfixed replan finding is exactly that
   case, so the route that must append phases is closed by the route that
   prevents re-scaffolding. The gate was written for a real defect (the
   re-plan-loop bug named at `:17-18`) and has no exemption for new phases on
   an in-flight unit.
3. **The destination is written three times and disagrees.**
   `skills/review-change/references/PERSIST_AND_DECIDE.md:133` sends
   `replan-in-unit` to "confirm the proposed SPEC phase(s), then
   `/execute-phase` on this same branch" (no planner); `:135-136` sends
   "owned by plan" to `/plan-feature`; and
   `skills/triage-issue/references/REVIEW_FINDING_PROCESS.md:17-21` sends the
   same class to `/plan-feature <slug>` for a feature and `/plan-fix <issue>`
   for a fix. Three destinations for one class means no consumer can be trusted.
4. **The one machine surface that could decide is both unemitted and
   misdirected.** `skills/workflow-status/references/SENSOR_SIGNALS.md:74-76`
   documents `next.suggested → /fold-findings` for any `folded: no` row; the
   schema declares the field
   (`packages/agentic-workflow-schema/envelope.schema.json:169`) but
   `scripts/workflow-status.mjs` never emits it. Its documented destination is
   also wrong for this class: `skills/fold-findings/references/FOLD_PROCESS.md:46`
   freezes the whole batch when the taken queue holds a `replan-in-unit` row —
   nothing folds and the loop stops "routing to planning", at the planner that
   step 2 shows refusing.

The cost of the gap is unbounded because nothing selects the row: the only way
to learn which finding needs replanning is to read the unit's ledger in full
(unit 37's is 1065 lines, `wc -l`) or be told the id, and both planners then
consume `planning-preflight`'s full normalized-repository-state read even though
the finding already pins the scope. The data needed to decide does exist and is
already parsed: `scripts/workflow-status.mjs:713,735` projects every
`folded: no` row as `{id, file, axis, severity, class, route, suggested_tier}`
into `findings.fix_now[]`.

## Detected in

Operator report while closing unit 37-phase-lint-script, 2026-09-15, filed as
`#224`: "cuando hay un finding que exige replan si ejecuto plan-feature o
plan-fix no detecta el finding que exige replan… no tenemos en la carga
progresiva este escenario contemplado… además plan-feature y plan-fix carga todo
el proyecto cuando con una explicación del finding y lo que tiene que
replanificar posiblemente con leer un puñado de ficheros podría ser suficiente".
The operator's directive for the repair: the load decision, the route decision
and the selection of the finding are taken deterministically by code.

## Scope

### In scope

- `scripts/unit-route.mjs` — the deterministic router: one closed route table,
  one fixed output block, one documented exit-code contract, read-only.
- `scripts/unit-route.test.mjs` — red-first fixtures for every route, the
  bounded read set, the failure states, determinism and read-only behaviour.
- `scripts/phase-lint.mjs` and `scripts/phase-lint.test.mjs` — the executed-phase
  exemption (F25): a phase whose tasks are all ticked is historical and is not
  re-judged by boxes 3 and 7, pinned by a corpus triple that keeps both checks
  armed for every unemitted phase.
- `skills/replan-findings/SKILL.md` plus
  `skills/replan-findings/references/PHASE_APPEND.md` — the internal contract
  that is loaded **only** when the router prints the replan route.
- Conditional load wiring in `skills/plan-feature/SKILL.md`,
  `skills/plan-feature/references/ROUTING.md`, `skills/plan-fix/SKILL.md` and
  `skills/plan-fix/references/PLANNING_PROCESS.md`.
- The class-routed `next.suggested` emission in `scripts/workflow-status.mjs`
  with its pins, and the withdrawal of the stale documented signal in
  `skills/workflow-status/references/SENSOR_SIGNALS.md`.
- One canonical replan destination across every surface the census shows routing
  the class (PE-007) — the eight skill files:
  `skills/review-change/references/PERSIST_AND_DECIDE.md`,
  `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md`,
  `skills/review-implementation/references/CLASSIFY.md`,
  `skills/review-implementation/SKILL.md`,
  `skills/triage-issue/SKILL.md`,
  `skills/triage-issue/references/REVIEW_FINDING_PROCESS.md`,
  `skills/fold-findings/references/FOLD_PROCESS.md`,
  `skills/fold-findings/SKILL.md` — plus the tutorial prose that repeats it:
  `docs/workflow/REVIEW_AND_CLASSIFY.md` (+ ES),
  `docs/workflow/FEATURE_WORKFLOW.md` (+ ES) and
  `docs/workflow/PORTABLE_PROMPT.md` (+ ES).
- Tutorial and release surfaces: `docs/workflow/SKILLS.md` (+ ES),
  `CHANGELOG.md` (+ ES), the touched skills' `version:` bumps, the new skill's
  budget entry in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, and the Pi mirror
  re-bundle.

### Out of scope

- **A root-file layer in the phase-lint prefix table.**
  `skills/phase-lint`'s box-2 table (`scripts/phase-lint.mjs:230-233` on
  `feat/37-phase-lint-script`) maps `skills/`, `docs/`, `template/`,
  `scripts/`, `packages/`, `.github/`, `.agentic-workflow/` and `*.md`; a
  root-level non-Markdown file (`skills.sh.json`, `model-routing.yml`) matches
  none, so any plan naming one answers `verdict BLOCKED: unparseable`
  (reproduced 2026-09-15 against the 37-branch linter). This unit therefore
  leaves the CLI grouping manifest untouched: the new skill is discovered from
  the filesystem and `skills.sh.json` declares `notGrouped: bottom`, so it is
  listed ungrouped. The grammar gap belongs to the linter's own unit
  (`docs/features/37-phase-lint-script/`), which owns the prefix table.
- **The convergence defects of the review loop.** `#205` owns the materiality
  bar, the bounded rework and the hard stops that let unit 37 reach twelve
  cycles. This fix routes a replan finding; it does not re-cut that policy.
- **The skill-package layout.** `#198` moves scripts inside their skill with a
  shared runtime resolver; the router lands at `scripts/unit-route.mjs` beside
  the sensor and the linter, and moves with them.
- **Grouping the new skill in the CLI manifest.** Covered by the first
  bullet's grammar gap; presentation-only.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction — `/plan-feature` on a unit whose roadmap row is `in-progress` stops without reading the unit's ledger, so an open replan finding is never reached | repository | `skills/plan-feature/references/ROUTING.md:17-24`; `#224` body | `b535866633bbc4afbd75f013ad957d3068e64976` | the entry route for a replan finding | current | proven | reviewer reproduction on a fixture unit |
| PE-002 | Root cause — neither planner's progressive-loading allowlist includes `review-findings.md` | repository | `skills/plan-feature/SKILL.md:56-68`; `skills/plan-fix/SKILL.md:91-108` | `b5358666` | where the ledger read belongs | current | proven | code read by `review-plan` |
| PE-003 | Root cause — three contradictory destinations exist for one class | repository | `skills/review-change/references/PERSIST_AND_DECIDE.md:133`, `:135-136`; `skills/triage-issue/references/REVIEW_FINDING_PROCESS.md:17-21` | `b5358666` | the canonical destination string | current | proven | grep the three surfaces after the fold |
| PE-004 | Root cause — the fold freeze-batches on a replan row and routes back to the refusing planner | repository | `skills/fold-findings/references/FOLD_PROCESS.md:46`; `skills/fold-findings/SKILL.md:122` | `b5358666` | the fold's REPLAN-ROUTE receipt text | current | proven | fold receipt read after the fold |
| PE-005 | Doc/code surface — `next.suggested` is documented in `SENSOR_SIGNALS.md` and schema-declared, and the pre-fix gap this unit was filed for is closed: P3's execution assigns it (`scripts/workflow-status.mjs:1192`) | repository | `skills/workflow-status/references/SENSOR_SIGNALS.md:74-76`; `packages/agentic-workflow-schema/envelope.schema.json:169`; `grep -n "next.suggested =" scripts/workflow-status.mjs` → `:1192` | `9cc6bf90` | the sensor's routing signal | current | proven | sensor suite pin |
| PE-006 | Available machine data — the sensor already projects every open row with its `class` and `route` | repository | `scripts/workflow-status.mjs:742,753` (`readFixNow` at `:742`, projection push at `:753` at the bound revision) | `9cc6bf90` | the router's per-class decision table | current | proven | `readFixNow` read |
| PE-007 | Regression scope — the class is routed by eight skill files and three tutorial pairs (EN+ES) and projected into one emitted envelope field; no runtime consumer parses the prose | repository | `grep -rn "replan-in-unit" skills/ docs/workflow/ --include="*.md"` → 43 hits over 21 files, of which 14 files carry routing sentences (enumerated in Scope; the rest are class definitions or summaries that name no destination); `scripts/workflow-status.mjs:735` | `48aac035` | the converged surface set (Scope, P4/P5) | current | proven | grep count before and after |
| PE-008 | Rollback path — revert the single PR; skills, one script, its tests and docs only | repository | `docs/fix/_TEMPLATE/SPEC.md` rollback row; no migration or schema vocabulary in `packages/agentic-workflow-schema` | `b5358666` | rollback section | current | proven | `git revert <merge sha>` clean |
| PE-009 | Affected use case — the operator path "a finding's frozen route is the plan owner → the planner appends phases → the fold lands them" | repository | `skills/review-implementation/references/CLASSIFY.md:97`; `#224` body | `b5358666` | OB-1, OB-2 | current | proven | scenario matrix row S1 |
| PE-010 | Cost evidence — the lookup is unbounded today: unit 37's ledger is 1065 lines and both planners consume the full preflight | repository | `git show feat/37-phase-lint-script:docs/features/37-phase-lint-script/review-findings.md \| wc -l` → 1065; `skills/plan-feature/SKILL.md:63-67`; `skills/plan-fix/SKILL.md:99-100` | `feat/37-phase-lint-script@e1e282c5` (the ledger is absent at `b5358666` and at HEAD; cross-branch read, disclosed as in PE-011) | the bounded read set | current | proven | router output path count |
| PE-011 | Tooling — `scripts/phase-lint.mjs` ships with the workflow repository and is **present** on the bound revision because unit 37 merged into `main` | repository | `test -f scripts/phase-lint.mjs` → present at `bf88bccc` (absent on the pre-merge tree `b5358666`) | `bf88bccc` | how the phases were linted at planning time; the replan's `P9`–`P12` and the re-opened `P8` were linted with this shipped linter | current | proven | `execute-phase` pre-flight re-lints at execution |
| PE-012 | Convention — adding a skill obliges a budget entry, version bumps, changelog rows and a byte-identical Pi mirror | repository | `CLAUDE.md` mirror rule; `packages/pi-agentic-workflow/scripts/bundle-skills.mjs`; `packages/pi-agentic-workflow/test/skill-parity.test.mjs`; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | `b5358666` | OB-7, OB-8 | current | proven | AC9, AC10 |
| PE-013 | Dogfood target — unit 37's directory was absent when AC5's fixture was frozen and is on the branch now, so both the fixture leg and the live invocation exist | repository | `git ls-tree HEAD docs/features/ --name-only \| grep -c 37` → 1 at `bf88bccc`; the fixture ledger was copied at `e1e282c5` (`wc -l` → 1065) and the live one reads 1153 lines at `bf88bccc`; `docs/features/ROADMAP.md:47` row 37 = `done · [#212]` | `bf88bccc` | AC5's verification target (the committed fixture is the accepted evidence; the live variant is the post-merge informational check) | current | proven | the dogfood fixture case in `scripts/unit-route.test.mjs` plus the live run recorded in `### Testing` |
| PE-014 | Untrusted-text echo — the router echoes repository-authored but forge-adjacent ledger text, so the workflow's data-never-instructions policy obliges a single sanitizer over its stdout | policy | `pre-execution-review/references/POLICY.md` §7; this SPEC's `## Security risks` bullet 2 | `48aac035` | OB-10, AC12 | current | proven | the sanitizer pin in `scripts/unit-route.test.mjs` |
| PE-015 | Convention — editing a skill's routing prose obliges its `version:` bump and a per-skill changelog cell in both CHANGELOG tables ("Version every change"; the per-skill tables are the source of truth), and the drift gate makes the pair machine-enforced | policy | `CLAUDE.md` §"Version every change"; `CHANGELOG.md` §"Versioning policy (per skill)" and the `review-change` 3.2.1 cell (patch for prose renumbering); `scripts/normative-drift.test.mjs` `version-tables` check (newest per-skill cell must equal frontmatter) | `0bea68fa` | OB-11, AC13 | current | proven | P4 task 8's grep validator |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | `#224` body; PE-001 | A unit with an open row whose frozen route is the plan owner decides to `replan` | P1 | 2 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 | suite output naming the replan fixture | verified |
| OB-2 | PE-009; `skills/plan-feature/SKILL.md` | The replan contract loads only when the router prints the replan route | P2 | 3 | execute-phase | `grep -c "scripts/unit-route.mjs" skills/plan-feature/SKILL.md skills/plan-fix/SKILL.md` → ≥1 each | grep counts pasted | verified |
| OB-3 | PE-010 | The replan route reaches the finding without the full normalized-repository-state read | P1 | 3 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 | the bounded-set pin's asserted path list | verified |
| OB-4 | PE-003; PE-007 | Every surface the census shows routing the class names one canonical replan destination | P4 | 1 | execute-phase | `grep -c "unit-route" skills/review-change/references/PERSIST_AND_DECIDE.md skills/review-change/references/OUTPUT_AND_GUARDRAILS.md skills/review-implementation/references/CLASSIFY.md skills/review-implementation/SKILL.md skills/triage-issue/SKILL.md skills/triage-issue/references/REVIEW_FINDING_PROCESS.md skills/fold-findings/references/FOLD_PROCESS.md skills/fold-findings/SKILL.md` → ≥1 each | grep counts pasted | verified |
| OB-5 | PE-005 | The sensor emits `next.suggested` routed by the open row's class, and no documented signal contradicts it | P3 | 1 | execute-phase | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 | the three class pins | verified |
| OB-6 | PE-002 | An unknown or ambiguous unit never yields a guessed route | P1 | 4 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 | the exit-code pins | verified |
| OB-7 | PE-012 | The new internal skill carries a registered budget and the skill tree stays discoverable | P2 | 7 | execute-phase | `bun scripts/check-skill-context.mjs` → exit 0 | checker tail | verified |
| OB-8 | PE-012 | The Pi mirror stays byte-identical to `skills/` after the last skill edit | P7 | 2 | execute-phase | `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0 | suite output | verified |
| OB-9 | PE-006; PE-011 | The router stays read-only and byte-deterministic, and every phase re-lints at execution | P1 | 5 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 | the determinism pin and the pasted lint block | verified |
| OB-10 | PE-014 | The router's stdout carries no verbatim ledger line: echoed ids and paths pass one sanitizer that truncates long cells | P1 | 6 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 | the S7 sanitizer pin's asserted output | verified |
| OB-11 | PE-015 | The reference-only routing edit carries its version signal: `review-change`'s `version:` is bumped (patch 3.5.0 → 3.5.1) and its per-skill changelog cell lands in both CHANGELOG tables | P4 | 8 | execute-phase | `grep -q "^version: 3\.5\.1" skills/review-change/SKILL.md && grep -q "^| 3\.5\.1 |" CHANGELOG.md && grep -q "^| 3\.5\.1 |" CHANGELOG.es.md` → exit 0 | the three grep hits pasted | verified |
| OB-12 | F24; SPEC `## Amendments` 2026-09-16 | A unit whose work is finished (status `done`, no open row) is routed to the merge gate rather than to the executor | P9 | 3 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 (the terminal-route pin) | the terminal-route pin's asserted `route:`/`next:` lines | verified |
| OB-13 | F23; SPEC `## Amendments` 2026-09-16 | The `status` field carries the bare status token from the fix-index and roadmap cells, never the surrounding markdown | P9 | 2 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 (the status-token pin) | the status-token pin's asserted `status:` line | verified |
| OB-14 | F25; SPEC `## Amendments` 2026-09-16 | A phase whose tasks are all ticked is historical: boxes 3 and 7 do not re-judge it, while every unemitted phase keeps both checks armed | P10 | 2 | execute-phase | `node --test scripts/phase-lint.test.mjs` → exit 0 (the corpus pair) | the pair's PASS and BLOCKED assertions | verified |
| OB-15 | F24; SPEC `## Amendments` 2026-09-16 | The terminal route token and the bare `status` field are documented in the replan contract and its version cell lands in both changelogs | P11 | 4 | execute-phase | `grep -q "close-out" skills/replan-findings/SKILL.md && node --test scripts/normative-drift.test.mjs` → exit 0 | the grep hit, the drift verdict plus the `replan-findings` version cell | verified |
| OB-16 | F25; SPEC `## Amendments` 2026-09-16 | The phase contract — sole owner of the eight rules — states the executed-phase exemption as an owner-side rule: a fully-ticked phase is historical for boxes 3 and 7, every other box stays armed, pre-ticking to dodge a check is a defect, and its version cell lands in both changelogs | P11 | 3 | execute-phase | `grep -q "fully-ticked phase is historical" skills/phase-contract/SKILL.md && node --test scripts/normative-drift.test.mjs` → exit 0 | the rule text plus the `phase-contract` version cell | verified |
| OB-17 | F32; SPEC `## Amendments` 2026-09-16 | A known unit with no open row whose status source is gone (its index or roadmap row was removed after the merge) answers the archived state instead of the executor route | P13 | 2 | execute-phase | `node --test scripts/unit-route.test.mjs` → exit 0 (the archived-state pins) | the two pins' asserted `route:`/`next:` lines | verified |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command, with `read-verified` labelled where the observation is a read.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The router's closed route table answers `replan`, `decision`, `fold`, `execute`, `close-out`, `historical` and `plan-from-issue` from fixture ledgers, first match winning, where `close-out` is the route of a finished unit and `historical` that of an archived unit whose status source is gone; the `status` field carries the bare status token, never the surrounding markdown | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC2 | The bounded read set is derived from the selected rows only: the unit's `review-findings.md`, `SPEC.md`, `ACCEPTANCE.md` and each cited repository path, deduped, sorted, and capped with an explicit remainder line | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC3 | Failure states fail closed: an unknown unit and extra arguments exit 1, an ambiguous unit exits 2, and no route is printed on either | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC4 | The router is deterministic and read-only: two consecutive runs print byte-identical stdout, and `git status --porcelain` is unchanged after a run | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC5 | Dogfood-shaped end-to-end — against the committed fixture replicating unit 37's plan-routed ledger rows (copied from `feat/37-phase-lint-script` at `e1e282c5`, PE-013), the router answers `replan` and lists the plan-routed row ids without being told any id | `node --test scripts/unit-route.test.mjs` → exit 0 (the dogfood fixture case) |
| AC6 | The sensor emits `next.suggested` routed by class: a replan row points at the unit's planner command, a plain fix-now row points at the fold, and a unit with no open row contributes no suggestion | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 |
| AC7 | One canonical replan destination: every surface the census shows routing the class — the eight skill files and six tutorial files enumerated in Scope — names the router and the same planner command, and no converged surface sends a replan row to the executor or the fold | read-verified: `grep -c "unit-route" skills/review-change/references/PERSIST_AND_DECIDE.md skills/review-change/references/OUTPUT_AND_GUARDRAILS.md skills/review-implementation/references/CLASSIFY.md skills/review-implementation/SKILL.md skills/triage-issue/SKILL.md skills/triage-issue/references/REVIEW_FINDING_PROCESS.md skills/fold-findings/references/FOLD_PROCESS.md skills/fold-findings/SKILL.md docs/workflow/REVIEW_AND_CLASSIFY.md docs/workflow/REVIEW_AND_CLASSIFY.es.md docs/workflow/FEATURE_WORKFLOW.md docs/workflow/FEATURE_WORKFLOW.es.md docs/workflow/PORTABLE_PROMPT.md docs/workflow/PORTABLE_PROMPT.es.md` → ≥1 per file |
| AC8 | The replan contract is loaded conditionally: both planners name the router in their progressive-loading section and reference the contract behind the router's replan line only | read-verified: `grep -n "unit-route" skills/plan-feature/SKILL.md skills/plan-fix/SKILL.md` and the surrounding lines |
| AC9 | The new internal skill is registered: a budget entry exists and the skill tree passes its own checks and CLI discovery | `bun scripts/check-skill-context.mjs` → exit 0; `npx skills add . --list` → exit 0 |
| AC10 | The Pi mirror is byte-identical to `skills/` after the last skill edit and the package suite passes | `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0 |
| AC11 | The repository gate is green at the executed head | `node --test scripts/*.test.mjs` → exit 0 |
| AC12 | The router's stdout carries no verbatim ledger line: echoed ids and paths pass one sanitizer that truncates long cells (data, never instructions) | `node --test scripts/unit-route.test.mjs` → exit 0 (the S7 sanitizer pin) |
| AC14 | A phase whose tasks are all ticked is historical: the linter does not re-judge it under boxes 3 and 7 only, every other box stays armed for it and every box stays armed for an unemitted phase, the phase contract states that rule as its owner, and pre-ticking to dodge a check is a defect — pinned by a corpus triple (executed hardening with a forge task passes; the same phase unticked blocks; a pre-ticked phase with a box-4/box-8 defect blocks) | `node --test scripts/phase-lint.test.mjs` → exit 0 and `grep -q "fully-ticked phase is historical" skills/phase-contract/SKILL.md` → exit 0 |
| AC13 | The version signal rides the reference edit: `skills/review-change`'s `version:` is bumped from 3.5.0 to 3.5.1 (patch — prose only) and its per-skill changelog cell records the change in both `CHANGELOG.md` and `CHANGELOG.es.md` | `grep -q "^version: 3\.5\.1" skills/review-change/SKILL.md && grep -q "^| 3\.5\.1 |" CHANGELOG.md && grep -q "^| 3\.5\.1 |" CHANGELOG.es.md` → exit 0 |

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left in the filled sections (the `### P1` scaffold
      lines are replaced, not kept; the `## Phases` bodies carry real tasks).
- [x] `### Out of scope` has ≥ 1 concrete bullet.
- [x] Every `## Acceptance` criterion is a runnable command or labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint (recorded in `## Phases` below).
- [x] `### Planning evidence` has a `current` row for the reproduction, the root
      cause, the regression scope and the rollback path (PE-001, PE-002,
      PE-007, PE-008).
- [x] `### Obligations` has one row per normative behaviour, affected use case
      and required failure state, each with a phase, a validator and no
      `deferred` row.

### Scenario matrix

One row per failure category this SPEC names; each row points at the phase and
validator that exercise it.

| scenario | failure category | phase | validator |
|---|---|---|---|
| S1 — a unit carries an open row whose frozen route is the plan owner, and the operator invokes the planner directly | wrong route (the dead end this fix repairs) | P1 | `node --test scripts/unit-route.test.mjs` → the replan fixture exits 0 with `route: replan` |
| S2 — a unit carries only plain fix-now rows | wrong route (fold work sent to the planner) | P1, P3 | the fold fixture plus `node --test scripts/workflow-status-sensor.test.mjs` → the fold suggestion |
| S3 — a unit carries a `decision-required` row | wrong route (a human decision taken by an agent) | P1, P3 | the decision fixture plus the sensor's decision pin |
| S4 — the unit exists with no open row | wrong route (re-planning a planned unit) | P1 | the execute fixture; the `done` half of the same input is S9 |
| S5 — no unit exists, only the tracked issue | wrong route (planning without a unit) | P1 | the plan-from-issue fixture |
| S6 — the operator passes an unknown, extra, or ambiguous argument | guessed route instead of a failure state | P1 | the exit-code pins (1, 1, 2) |
| S7 — a ledger cell carries long or shell-shaped text | echoed untrusted text read as instructions | P1, P4 | the sanitizer pin (AC12, OB-10) plus the contract's data-never-instructions rule |
| S8 — the ledger is absent for a unit | silent success on a missing input | P1 | the absent-ledger fixture answers the unit's own status route |
| S9 — a finished unit (`done`, no open row) is handed to the executor | wrong route (re-executing a closed unit instead of reaching the merge gate) | P9 | the terminal-route pin (F24) in `scripts/unit-route.test.mjs` |
| S10 — a replan re-judges a phase that already ran | gate cannot be satisfied (the sanctioned append shape becomes unemittable) | P10 | the executed-phase corpus triple (F25) in `scripts/phase-lint.test.mjs` |
| S11 — a unit's status cell carries its markdown decoration | wrong value in the routed block's contract (a consumer reads `\`done`, not `done`) | P9 | the status-token pin (F23) in `scripts/unit-route.test.mjs` |
| S12 — a unit's status source is gone (its row was removed after the merge) and it carries no open row | silent success or a wrong route (an archived unit sent to the executor) | P13 | the archived-state pins (F32) in `scripts/unit-route.test.mjs` |

## Rules that must never be violated

From `CLAUDE.md` and the cited contracts; the executed change must preserve all
of them:

- **One PR per unit, always against `main`; never stack PRs.** This unit's
  branch is cut from `main`; the open `#212` is never its base.
- **Docs language is English**; the human tutorial pair
  (`docs/workflow/REVIEW_AND_CLASSIFY.md` and its `.es.md` sibling) is updated
  in the same commit as the English side.
- **Stack/architecture agnostic.** The router speaks about units, ledgers and
  routes; it names no product, runtime or framework.
- **Skills stay within their context budgets.** The new main file must satisfy
  the manifest's defaults (`mainEstimateMax: 2800`, `mainLinesMax: 240`).
- **The Pi mirror stays byte-identical** to `skills/` after the last skill edit.
- **`review-change` and `fold-findings` keep their frozen classification:** this
  fix changes where a class is routed, never how a row is classified, and never
  edits a recorded row's severity or class.
- **The linter's frozen grammar is not amended here.** Phase text avoids
  root-level non-Markdown tokens because the box-2 prefix table has no layer for
  them (out of scope, first bullet).
- **No forge mutation beyond this unit's own issue and PR.** No proposals are
  filed automatically.

## Impact

- **Layers touched:** `config/infra` (the router script, the sensor, the shared
  phase linter, their tests), `docs` (skill prose, the tutorial pair, changelogs,
  the budget manifest).
- **Modules and files:** `scripts/unit-route.mjs`,
  `scripts/unit-route.test.mjs`, `scripts/workflow-status.mjs`,
  `scripts/workflow-status-sensor.test.mjs`, `scripts/phase-lint.mjs`,
  `scripts/phase-lint.test.mjs`,
  `scripts/normative-drift.test.mjs`, `skills/replan-findings/**`,
  `skills/plan-feature/**`, `skills/plan-fix/**`, `skills/review-change/**`,
  `skills/review-implementation/**`, `skills/triage-issue/**`,
  `skills/fold-findings/**`,
  `skills/workflow-status/references/SENSOR_SIGNALS.md`,
  `docs/workflow/REVIEW_AND_CLASSIFY.md` (+ ES),
  `docs/workflow/FEATURE_WORKFLOW.md` (+ ES),
  `docs/workflow/PORTABLE_PROMPT.md` (+ ES), `docs/workflow/SKILLS.md`
  (+ ES), `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `CHANGELOG.md` (+ ES),
  `docs/fix/README.md`, `packages/pi-agentic-workflow/skills/**`.
- **Blast radius:** every unit that carries an open `folded: no` row, plus the
  sensor envelope every consumer reads, plus — from the replan — every unit whose
  plan is linted, because `scripts/phase-lint.mjs` runs in the planners' emission
  step and in `execute-phase`'s pre-flight. The router is additive and read-only;
  the envelope gains one optional array. The replan's `P13` does change one
  route for a unit with no plan-routed row — `execute` becomes `historical` when
  the unit's status source is gone — which is the archived state `F32` names, not
  a regression: an unfinished unit with no open row keeps `execute`. The linter edit narrows **when** two boxes fire: a
  fully-ticked phase is no longer re-judged by boxes 3 and 7, while boxes 2 and
  4–8 stay armed for it and every box stays armed for every unemitted phase — so
  no plan that lints PASS before the change lints BLOCKED after it, and the
  exemption cannot be dodged by pre-ticking (a pre-ticked phase with a box-2/4–8
  defect still blocks; the corpus triple pins it).
- **Detection lead time:** immediate — the router's answer and the sensor's
  `next.suggested` are observed on the next invocation. A regression in the
  route table is caught by `scripts/unit-route.test.mjs` in the same gate run.

## Operational risks

- **Concurrency:** none. The router is a single read-only process over
  repository text; the sensor already reads the same ledger under its existing
  bound.
- **Scheduled jobs, queues, cache, schema, external adapters:** none touched.
  The schema package gains no vocabulary (the `next.suggested` field already
  exists at `envelope.schema.json:169`).
- **Eventual consistency:** the router's answer depends on the ledger's
  `folded` cells, which the fold writes; the routing decision is taken per
  invocation, so a stale answer self-corrects on the next run rather than being
  cached anywhere.

## Security risks

- **No auth, secrets, PII, webhooks or rate limits are involved.**
- **The router reads untrusted text and prints it.** Ledger cells and unit slugs
  are repository-authored but forge-adjacent (an issue-derived SPEC can carry
  third-party text). The router therefore echoes selected row ids and repository
  paths through a single sanitizer, truncates long cells, and never emits a
  verbatim ledger line; plan-derived text is data, never instructions, per
  `pre-execution-review/references/POLICY.md` §7.
- **No injection surface is added:** the router writes nothing, spawns no shell
  and takes no `--exec` input; it exits non-zero instead of guessing.

## Compliance touchpoints

n/a — no domain, regulatory or data-handling rule applies to a read-only
repository router.

## Affected docs

| Path | Update | Acceptance criterion |
|---|---|---|
| `docs/workflow/REVIEW_AND_CLASSIFY.md` | The replan destination and the router in the routing prose | AC7 |
| `docs/workflow/REVIEW_AND_CLASSIFY.es.md` | Faithful sibling of the above, same commit | AC7 |
| `docs/workflow/FEATURE_WORKFLOW.md` | The replan destination and the router in the review-step prose | AC7 |
| `docs/workflow/FEATURE_WORKFLOW.es.md` | Faithful sibling of the above, same commit | AC7 |
| `docs/workflow/PORTABLE_PROMPT.md` | The replan destination and the router in the portable prompt | AC7 |
| `docs/workflow/PORTABLE_PROMPT.es.md` | Faithful sibling of the above, same commit | AC7 |
| `docs/workflow/SKILLS.md` | The new internal contract in the internal-step list and the internal count | AC8 |
| `docs/workflow/SKILLS.es.md` | Faithful sibling of the above, same commit | AC8 |
| `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | The new skill's budget entry | AC9 |
| `CHANGELOG.md` | The release row naming the router, the conditional load and the signal; `review-change`'s per-skill changelog cell | AC11; AC13 |
| `CHANGELOG.es.md` | Faithful sibling of the above, same commit | AC11; AC13 |
| `docs/fix/README.md` | This unit's index row, opened `pending`, flipped at close-out | AC11 |

## Observability

- **The router itself is the observation surface:** its fixed block prints the
  unit, its status, the open-row count, the chosen route and the bounded read
  set, so an operator sees the decision and its inputs in one screen.
- **The sensor's `next.suggested` array** carries the routed command with its
  trigger text, so an envelope consumer sees the destination without parsing
  prose.
- **Silent-failure alarm:** a unit that carries an open plan-routed row and still
  answers `execute` is the failure mode this fix exists to prevent; the router
  test suite fails loudly on it, and the dogfood fixture (AC5) pins the answer
  for a ledger shape known to carry such rows; after unit 37 merges, the live
  run `node scripts/unit-route.mjs 37-phase-lint-script` re-checks it on real
  data (informational, PE-013).

## Cross-issue notes

- **`#205` (review loops do not converge)** — an adjacent defect with a different
  owner: it re-cuts the materiality bar, the bounded rework and the hard stops.
  This fix removes one dead end that contributes to the loop; it does not
  re-open that policy's decisions. Absorb nothing; converge at the interface
  (the fold's receipt text names the router).
- **`#172` (review-pack consistency)** — owns the fold-flag and severity
  ownership. This fix changes one destination sentence per surface and adds no
  ownership.
- **`#194` (deterministic review-change orchestration)** — same design direction
  (replace prose routing with a deterministic script). Its scope is the review
  pass; this fix's is the post-review entry. No overlap in files.
- **`#198` (per-skill package layout)** — will move `scripts/*` inside their
  skills; the router is written to move with the sensor and the linter and names
  no absolute path in its own logic.
- **`docs/features/37-phase-lint-script/`** — owns the box-2 prefix table whose
  root-file gap this unit routes around; the gap is reported to that unit's
  owner, not patched here. Its ledger also supplies AC5's fixture rows
  (PE-013); once it merges, the live dogfood becomes runnable as an
  informational check.
- **`#213`/`#223`** — the fix-221 unit merged through `#223`; its sensor work is
  the substrate this fix extends (`readFixNow`).

## Effort

**M** (>4h, multi-commit): one new deterministic script plus its red-first
suite, one new internal contract with a reference, eight consumer prose surfaces
plus three tutorial pairs, one sensor emission with pins, and a release batch.
Split into eight phases because each layer's validator and rollback boundary
differ.

## Decisions made during drafting

1. **The router is a new script rather than an extension of `workflow-status`.**
   The sensor answers "what is the state of the repository"; the router answers
   "which command does this unit take now". Merging them would make every sensor
   invocation pay for a route decision and would put a mutable routing table
   behind an envelope consumer's back. Recorded here so the implementer can
   re-question it.
2. **The load decision is a printed line, and the exit code stays coarse.**
   `route:` mirrors the linter's `verdict:`/`fingerprint:` machine lines
   that consumers already paste and parse, while `0` (route determined), `1`
   (usage or unknown unit) and `2` (ambiguous unit) keep the exit code a
   success/failure signal instead of a route encoding. A per-route exit code was
   considered and dropped: it would make `&&` chains lie about success.
3. **The bounded read set is printed, not performed.** The router lists the
   paths a replan needs; the planner reads them. That keeps the router read-only
   and keeps the "what did this decision actually read" question answerable from
   its own output.
4. **`docs/fix/README.md`, `skills.sh.json` and `model-routing.yml` stay out of
   phase task text when they are root-level non-Markdown files** — a phase
   naming one fails the linter's box-2 table as unparseable (PE-008's sibling,
   reproduced). The index row is named by its `docs/` path only, and the CLI
   grouping manifest is out of scope.
5. **The evidence ledger lives in the SPEC although this unit is sized M.**
   `evidence-grounding`'s readiness box 5 names `planning-evidence.md` as the M/L
   home and `### Planning evidence` as the XS/S one; the fix contract is explicit
   that a fix unit has "no separate planning artifacts" and `plan-fix`'s Output
   names `### Planning evidence` plus `### Obligations` inside the SPEC as its two
   frozen ledgers. Precedent follows the fix contract: `docs/fix/179-declared-
   ledger-delta-receipts` is sized M and keeps the table in its SPEC with no
   `planning-evidence.md`. Box 5's substance — a compact table whose rows every
   Engineering claim resolves to — is satisfied. Recorded because the two
   contracts read differently and a reviewer should not have to guess which one
   bound this plan.
6. **The phases were linted with the unmerged linter** from
   `feat/37-phase-lint-script` because `scripts/phase-lint.mjs` does not exist on
   `main` (PE-011). The check is stronger than the hand-applied rules but is not
   the shipped one; `execute-phase`'s pre-flight re-lints every phase at
   execution time, and that re-lint is the binding one.
7. **AC5 is fixture-based; the live dogfood is post-merge and informational.**
   The reviewer's comparison unit (`37-phase-lint-script`) does not exist at the
   bound revision (PE-013), so an acceptance criterion naming it could never
   pass where acceptance is verified. The dogfood leg therefore runs against a
   committed fixture copied from that branch's ledger (real rows, real shape),
   and the live invocation is recorded as an informational post-merge check in
   `### Testing` — deliberately not an acceptance criterion, because its
   precondition (another unit's merge) is outside this unit's control.
8. **The destination census is scoped to routing sentences.**
   `grep -rn "replan-in-unit"` over `skills/` and `docs/workflow/` returns 43
   hits over 21 files (PE-007); only the 14 files whose hits route the class to
   a destination converge (eight skill files, three tutorial pairs). The
   remaining hits are class definitions or summaries that name no destination
   (`review-change/SKILL.md:157`, `REVIEW_PROCESS.md:151-152`,
   `WORKFLOW_INVARIANTS.md:80` and sibling, `SKILLS.md:96,:226` and sibling,
   `OPPORTUNISTIC_FINDING.md:21`) and stay untouched. `triage-issue/SKILL.md:118`
   was added beyond the reviewer's enumeration because it carries the same
   planner-only routing sentence as its own `REVIEW_FINDING_PROCESS.md` — leaving
   it would re-open the contradiction inside one skill.

## Testing

- **Unit (primary):** `scripts/unit-route.test.mjs` — fixture ledgers and
  fixture roadmaps/fix indexes in a temporary tree, one case per route, one per
  failure state, one for the bounded read set, one for determinism, one proving
  the run leaves `git status --porcelain` unchanged.
- **Integration:** `scripts/workflow-status-sensor.test.mjs` — the emitted
  `next.suggested` array for a replan row, a plain fix-now row and a unit with no
  open rows, through the existing `makeFixture` harness; and
  `scripts/normative-drift.test.mjs` — the canonical destination vocabulary
  agreeing across the router's route names and the prose surfaces that name it.
- **Surface:** `bun scripts/check-skill-context.mjs` and
  `packages/pi-agentic-workflow/test/skill-parity.test.mjs` for the new skill's
  budget and the mirror.
- **Live:** the dogfood fixture case inside `scripts/unit-route.test.mjs`
  (AC5, PE-013). After unit 37 merges, an informational live run —
  `node scripts/unit-route.mjs 37-phase-lint-script` → `route: replan` plus the
  row ids — re-checks the answer on real data; it is not an acceptance criterion
  because its precondition (another unit's merge) is outside this unit's
  control.

## Phases

Execution ledger — `execute-phase --fix 224` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

> Replan `fix-224-artrev-0004` (2026-09-16): `P9`–`P12` are inserted **before** a
> re-opened `P8`, so the ledger's last phase is again an unexecuted `Hardening &
> PR` closing out every phase. `P8` was executed under `artrev-0003`; its task
> list is byte-identical and it runs again as the terminal close-out. Rationale
> and the rejected alternative are in `## Amendments`.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here per phase.

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:config/infra:6:deterministic-unit-router`
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:docs:7:replan-entry-contract`
- P3 — `Phase-lint: PASS (8/8) · fingerprint P3:config/infra:3:class-routed-machine-signal`
- P4 — `Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skills-replan-destination`
- P5 — `Phase-lint: PASS (8/8) · fingerprint P5:docs:6:tutorial-destination-convergence`
- P6 — `Phase-lint: PASS (8/8) · fingerprint P6:docs:6:release-bookkeeping`
- P7 — `Phase-lint: PASS (8/8) · fingerprint P7:config/infra:2:mirror-parity`
- P9 — `Phase-lint: PASS (8/8) · fingerprint P9:config/infra:5:terminal-route-for-finished-unit`
- P10 — `Phase-lint: PASS (8/8) · fingerprint P10:config/infra:3:executed-phase-lint-exemption`
- P11 — `Phase-lint: PASS (8/8) · fingerprint P11:docs:5:replan-path-contract-docs`
- P12 — `Phase-lint: PASS (8/8) · fingerprint P12:close-out:3:terminal-receipt-closure`
- P8 — `Phase-lint: PASS (8/8) · fingerprint P8:hardening:10:hardening-pr`
- P13 — `Phase-lint: PASS (8/8) · fingerprint P13:config/infra:5:archived-unit-state`
- P14 — `Phase-lint: PASS (8/8) · fingerprint P14:hardening:10:hardening-pr`

> Planning-time note: the original phases were linted with the unmerged linter from
> `feat/37-phase-lint-script`, because `scripts/phase-lint.mjs` did not exist on
> `main` (PE-011). That check is stronger than the eight rules applied by hand,
> but it is not the shipped linter; `execute-phase`'s pre-flight re-lints every
> phase at execution time and that re-lint is the binding one.
>
> Replan note (2026-09-16, `fix-224-artrev-0004`): PE-011 is closed — the
> `feat/37-phase-lint-script` merge brought `scripts/phase-lint.mjs` onto this
> branch, so `P9`–`P12` and the re-opened `P8` were linted with the shipped
> linter (`verdict PASS`, overall fingerprint
> `751f72932d6b3c0c46af3df062824c020f049861e22eeca609c3bcf35bcc1fda`). The
> pre-flight re-lint at execution time stays binding.
>
> Repair note (2026-09-16, `fix-224-artrev-0005`): the plan-review findings
> RP-224-7…RP-224-11 were repaired in one batch (the phase-contract rule task,
> the refreshed `Depends on`/evidence rows, the idempotent re-opened `P8` with
> the receipts moved behind the commits, the extended declared surface and the
> new scenario rows). Re-linted with the shipped linter → `verdict PASS`,
> overall fingerprint
> `597c922a20d352504d840cab86282fd149fbea9c636246481877650518e9a3fa`.
>
> Repair note 2 (2026-09-16, `fix-224-artrev-0006`): the cycle-3 findings
> RP-224-12…RP-224-15 were repaired in one batch (the `## Acceptance` mirror and
> `## Status`/`## Amendments` rotation, the drift gate's closed-vocabulary pin as
> a `P9` task, OB-15's failing validator and the refreshed PE-005/PE-006
> observations). Re-linted → `verdict PASS`, overall fingerprint
> `1299caaa5db0fbec7062dc5a0a702397f8d518839c1dacc516019e212bbb1c6a`.
>
> Replan note 2 (2026-09-16, `fix-224-artrev-0008`): `P13` (the archived-unit
> state) and a fresh final `P14` were appended **after** the executed `P8` — the
> sanctioned append shape, lintable because `F25`'s exemption stops boxes 3 and 7
> from re-judging the fully-ticked `P8`. `verdict PASS`, overall fingerprint
> `dd3e140687ae85fff9b44b46478a840ae354375ee94c7df9321b61f0573aa27b`.
>
> Repair note 3 (2026-09-16, `fix-224-artrev-0009`): the replan review's
> RP-224-16…RP-224-20 were repaired in one batch — `P13` gained the
> `OB-17` reconciliation task, `## Impact` states the archived-state route change
> instead of denying it, the scenario matrix gained `S12`, the manifest's `AC1`
> enumerates the seven tokens, and the `RP-224-6` ledger row was rebuilt to the
> canonical shape. Re-linted → `verdict PASS`, overall fingerprint
> `1268a833c5fde7351e3dfbdcd591cba7de3737dee21be99880d5679f73697191`.

### P1 — Deterministic unit router

Layer: `config/infra`. Done-when: `node --test scripts/unit-route.test.mjs` → exit 0.

- [x] Red-first `scripts/unit-route.test.mjs` pinning the five route outcomes,
      the unit-37 dogfood fixture (PE-013) and the failure states from fixture
      ledgers, run to red (OB-1; PE-001, PE-009)
- [x] `scripts/unit-route.mjs` closing the route table, the fixed output block
      and the `route:`/`fingerprint:` machine lines (OB-1; PE-006)
- [x] Bounded read set extraction into a sorted deduped path list with an
      explicit remainder line (OB-3; PE-010)
- [x] Usage, unknown-unit and ambiguous-unit exits that print no route (OB-6)
- [x] Determinism and read-only proof over two consecutive runs (OB-9; PE-011)
- [x] Sanitize the router's echoed output: one sanitizer truncates long cells
      and keeps verbatim ledger lines off stdout (OB-10; PE-014)

### P2 — Replan entry contract

Layer: `docs`. Done-when: `bun scripts/check-skill-context.mjs` → exit 0.

- [x] Create `skills/replan-findings/SKILL.md` with the load condition gated on
      the router's replan line (OB-2; PE-002, PE-009)
- [x] Create `skills/replan-findings/references/PHASE_APPEND.md` with the append
      contract and its artifact-revision duty (OB-2)
- [x] Wire the conditional load into `skills/plan-feature/SKILL.md` and bump its
      version (OB-2; PE-002)
- [x] Add the replan route and the router line to
      `skills/plan-feature/references/ROUTING.md` (OB-2; PE-001)
- [x] Wire the conditional load into `skills/plan-fix/SKILL.md` and bump its
      version (OB-2; PE-002)
- [x] Add the replan detection to
      `skills/plan-fix/references/PLANNING_PROCESS.md` (OB-2; PE-002)
- [x] Register the new skill's budget in
      `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (OB-7; PE-012)

### P3 — Class-routed machine signal

Layer: `config/infra`. Done-when: `node --test scripts/workflow-status-sensor.test.mjs` → exit 0.

- [x] Emit `next.suggested` routed by the open row's class in
      `scripts/workflow-status.mjs` (OB-5; PE-005, PE-006)
- [x] Pin the three class outcomes in `scripts/workflow-status-sensor.test.mjs`
      (OB-5)
- [x] Pin the canonical destination vocabulary in
      `scripts/normative-drift.test.mjs` (OB-4; PE-003)

### P4 — Skills replan destination

Layer: `docs`. Done-when: `grep -c "unit-route" skills/review-change/references/PERSIST_AND_DECIDE.md skills/review-change/references/OUTPUT_AND_GUARDRAILS.md skills/review-implementation/references/CLASSIFY.md skills/review-implementation/SKILL.md skills/triage-issue/SKILL.md skills/triage-issue/references/REVIEW_FINDING_PROCESS.md skills/fold-findings/references/FOLD_PROCESS.md skills/fold-findings/SKILL.md` → ≥1 per file, and `grep -q "^version: 3\.5\.1" skills/review-change/SKILL.md && grep -q "^| 3\.5\.1 |" CHANGELOG.md && grep -q "^| 3\.5\.1 |" CHANGELOG.es.md` → exit 0 (OB-11, AC13).

- [x] Restate the replan destination in review-change's two reference files —
      `skills/review-change/references/PERSIST_AND_DECIDE.md` and
      `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md` (OB-4; PE-003,
      PE-007)
- [x] Restate the replan destination in
      `skills/review-implementation/references/CLASSIFY.md` (OB-4; PE-003)
- [x] Restate the replan destination in `skills/review-implementation/SKILL.md`
      and bump its version (OB-4)
- [x] Restate the replan destination in `skills/triage-issue/SKILL.md` (OB-4)
- [x] Restate the replan destination in
      `skills/triage-issue/references/REVIEW_FINDING_PROCESS.md` and bump that
      skill's version (OB-4; PE-003)
- [x] Restate the replan destination in
      `skills/fold-findings/references/FOLD_PROCESS.md` (OB-4; PE-004)
- [x] Restate the replan destination in `skills/fold-findings/SKILL.md` and bump
      its version (OB-4; PE-004)
- [x] Bump `skills/review-change/SKILL.md` from 3.5.0 to 3.5.1 (patch — prose
      only) and add its per-skill changelog cell to `CHANGELOG.md` and
      `CHANGELOG.es.md` (OB-11; PE-015)

### P5 — Tutorial destination convergence

Layer: `docs`. Done-when: `grep -c "unit-route" docs/workflow/REVIEW_AND_CLASSIFY.md docs/workflow/REVIEW_AND_CLASSIFY.es.md docs/workflow/FEATURE_WORKFLOW.md docs/workflow/FEATURE_WORKFLOW.es.md docs/workflow/PORTABLE_PROMPT.md docs/workflow/PORTABLE_PROMPT.es.md` → ≥1 per file.

- [x] Add the router and the destination to
      `docs/workflow/REVIEW_AND_CLASSIFY.md` (OB-4)
- [x] Add the faithful sibling text to
      `docs/workflow/REVIEW_AND_CLASSIFY.es.md` (OB-4)
- [x] Add the router and the destination to
      `docs/workflow/FEATURE_WORKFLOW.md` (OB-4; PE-007)
- [x] Add the faithful sibling text to
      `docs/workflow/FEATURE_WORKFLOW.es.md` (OB-4)
- [x] Add the router and the destination to
      `docs/workflow/PORTABLE_PROMPT.md` (OB-4; PE-007)
- [x] Add the faithful sibling text to
      `docs/workflow/PORTABLE_PROMPT.es.md` (OB-4)

### P6 — Release bookkeeping

Layer: `docs`. Done-when: `grep -q "unit-route" CHANGELOG.md && grep -q "unit-route" CHANGELOG.es.md && grep -q "replan-findings" docs/workflow/SKILLS.md && grep -q "replan-findings" docs/workflow/SKILLS.es.md` → exit 0.

- [x] Name the new internal contract in `docs/workflow/SKILLS.md` and update
      the internal-step count (OB-7; PE-012)
- [x] Add the faithful sibling text to `docs/workflow/SKILLS.es.md` (OB-7)
- [x] Withdraw the stale documented signal in
      `skills/workflow-status/references/SENSOR_SIGNALS.md` (OB-5; PE-005)
- [x] Add the release row to `CHANGELOG.md` (OB-7; PE-012)
- [x] Add the faithful sibling row to `CHANGELOG.es.md` (OB-7)
- [x] Bump `skills/workflow-status/SKILL.md` for the withdrawn signal (OB-5)

### P7 — Mirror parity

Layer: `config/infra`. Done-when: `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0.

- [x] Re-bundle the Pi mirror with `bun run bundle:skills` from
      `packages/pi-agentic-workflow` after the last skill edit (OB-8; PE-012)
- [x] Bump the mirror package version and add its changelog row (OB-8)

### P9 — Terminal route for a finished unit

Layer: `config/infra`. Done-when: `node --test scripts/unit-route.test.mjs` → exit 0.

- [x] Red-first `scripts/unit-route.test.mjs` pins for the two post-merge states: a
      real-shaped fix-index status cell reads as its bare token, and a `done` unit
      with no open row answers the terminal route (F23, F24; OB-12, OB-13)
- [x] `scripts/unit-route.mjs` reads the status token out of the fix-index and
      roadmap cells instead of echoing the markdown cell verbatim (F23; OB-13)
- [x] `scripts/unit-route.mjs` answers the terminal route for a `done` unit whose
      open rows are none, naming the merge audit as its `next:` command (F24; OB-12)
- [x] `scripts/normative-drift.test.mjs` extends its closed-vocabulary pin to the
      six published route tokens, so the drift gate and the router agree (F24; OB-12)
- [x] Re-run `node --test scripts/*.test.mjs` and
      `node scripts/check-skill-context.mjs --routes` to exit 0

### P10 — Executed-phase lint exemption

Layer: `config/infra`. Done-when: `node --test scripts/phase-lint.test.mjs` → exit 0.

- [x] Red-first `scripts/phase-lint.test.mjs` corpus triple: an executed hardening
      phase carrying a forge task passes, the same phase unticked mid-plan blocks,
      and a pre-ticked phase with a box-4/box-8 defect still blocks (F25; OB-16)
- [x] `scripts/phase-lint.mjs` stops re-judging a phase whose tasks are all ticked
      under boxes 3 and 7 only, keeping every other box armed (F25; OB-16)
- [x] Re-run `node --test scripts/*.test.mjs` to exit 0

### P11 — Replan path contract docs

Layer: `docs`. Done-when: `grep -q "close-out" skills/replan-findings/SKILL.md`, `node --test scripts/normative-drift.test.mjs` and the mirror parity suite all exit 0.

- [x] `skills/replan-findings/SKILL.md` documents the terminal route token and the
      bare `status` token in the block it owns (F24; OB-15)
- [x] Bump `skills/replan-findings/SKILL.md` to the next minor version for the new
      routing case (F24; OB-15)
- [x] `skills/phase-contract/SKILL.md` states the executed-phase exemption as the
      sole rule owner — a fully-ticked phase is historical for boxes 3 and 7, every
      other box stays armed, and pre-ticking to dodge a check is a defect — and
      bumps to the next patch version (F25; OB-16)
- [x] Add both per-skill version cells to `CHANGELOG.md` and `CHANGELOG.es.md`
      (OB-15, OB-16)
- [x] Re-bundle the Pi mirror and add the package release row to both changelogs
      (OB-15, OB-16)

### P12 — Terminal receipt closure

Layer: `close-out`. Done-when: the project verification gate exits 0 at the terminal head and every `OB-` row in this SPEC carries `verified` or `n/a` with its evidence.

- [x] Reconcile every `OB-` row to the status its cited validator and recorded
      evidence support, writing the evidence inline (F21, F22)
- [x] Re-freeze the acceptance manifest at the terminal head and record its blob (F22)
- [x] Fold every new fix-now finding through the fold cycle, then re-review on a
      changed snapshot (F21)

### P8 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the project verification gate commands exit 0.

Re-opened by the replan (`fix-224-artrev-0004`): PR #225 already exists and the
fix-index row already reads `done · [#225]`, so every task below re-verifies its
outcome against the live PR and never re-creates it. The three receipt tasks run
**after** the ledger is fully ticked, because a later write to `SPEC.md` would
void the plan receipt they produce.

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Confirm the fix-index row reads `done · [#225]` and commit the flip only if it is missing
- [x] `git push`
- [x] Verify the open PR and print its URL (`gh pr view --json url`) — it exists, so never re-create it; the template's create step would fail here
- [x] Confirm the fix-index row links PR #225 and re-commit only if the link moved
- [x] Commit `docs: link PR #225` and push (no empty commit when the link already holds)
- [x] Run the independent plan review as the last action of this phase, after every
      box in this ledger is ticked, and paste `current: true` (F21, F22; OB-16)
- [x] Run the independent end review on the exact terminal candidate and paste its
      receipt line (F21)
- [x] Run the merge audit on the terminal head and paste its verdict with the PR URL
      (F21)

### P13 — Archived unit state

Layer: `config/infra`. Done-when: `node --test scripts/unit-route.test.mjs` → exit 0.

- [x] Red-first `scripts/unit-route.test.mjs` pins the archived state from two new
      fixture units (a fix unit with no index row, a feature with no roadmap row):
      no open row plus a gone status source answers `historical` with a prose
      `next:` (F32; OB-17)
- [x] `scripts/unit-route.mjs` answers `historical` for that state and documents
      the token in its usage block and header (F32; OB-17)
- [x] `scripts/normative-drift.test.mjs` extends the closed-vocabulary pin to the
      seven published route tokens (F32; OB-17)
- [x] Re-run `node --test scripts/*.test.mjs` to exit 0
- [x] Reconcile the `OB-17` row to `verified` with its validator's evidence
      recorded in this phase's receipt (RP-224-16; OB-17)

### P14 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the project verification gate commands exit 0.

Fresh final close-out for the work appended after the executed `P8`. The PR
already exists and the fix-index row already reads `done · [#225]`, so every task
re-verifies its outcome against the live PR and never re-creates it; the three
receipt tasks run after the ledger is fully ticked.

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Confirm the fix-index row reads `done · [#225]` and commit the flip only if it is missing
- [ ] `git push`
- [ ] Verify the open PR and print its URL (`gh pr view --json url`) — never re-create it
- [ ] Confirm the fix-index row links PR #225 and re-commit only if the link moved
- [ ] Commit `docs: link PR #225` and push (no empty commit when the link already holds)
- [ ] Run the independent plan review as the last action of this phase, after every
      box in this ledger is ticked, and paste `current: true` (F32)
- [ ] Run the independent end review on the exact terminal candidate and paste its
      receipt line (F29, F30, F31, F32, F33, F34)
- [ ] Run the merge audit on the terminal head and paste its verdict with the PR URL

## Rollback

Revert the merge commit (`git revert <merge sha>`) or close the PR. The change
is confined to skills prose, one new script with its tests, one sensor emission,
the shared phase linter's executed-phase exemption, and documentation; there is
no data migration, no schema vocabulary change and no external side effect. A
revert restores the three contradictory destination sentences, the `execute`
mis-route for a finished unit and the retro-block of a replanned plan, so the
dead ends return — the fix is safe to revert and unsafe to leave.

## Amendments

| date | artifact revision | change | authority |
|---|---|---|---|
| 2026-09-15 | `fix-224-artrev-0002` | Repair batch after PLAN-REVIEW-FAIL (receipt `rp-224-20260915-001`, snapshot `843327b1…0be566`): RP-224-1 — AC5 re-targeted to the committed unit-37 fixture (PE-013) and `Depends on` states the ordering note; RP-224-2 — PE-010 provenance corrected to `feat/37-phase-lint-script@e1e282c5`; RP-224-3 — destination convergence widened to the census (eight skill files + three tutorial pairs, PE-007), P4 re-cut and P5/P6 added, AC7's validator covers all 14 files; RP-224-4 — sanitizer given OB-10 + AC12 + P1 task 6; RP-224-5 — PE-005/PE-006 line windows corrected to `:713`/`:735`; phases re-cut 7 → 8 under the ≤8-task box | user-authorized repair batch (`plan-fix 224`) |
| 2026-09-15 | `fix-224-artrev-0003` | Repair batch after PLAN-REVIEW-FAIL (receipt `rp-224-20260915-002`, snapshot `605f53068f5e0d43509750aecfb752fd5afe7d98cc3dbff08b1ae871a7424b35`): RP-224-6 — the version-bump sweep made even: P4's two review-change reference tasks merged into one same-skill task (box 3's ≤8 preserved, P4's fingerprint string unchanged) and new P4 task 8 bumps `review-change` 3.5.0 → 3.5.1 (patch) with its per-skill changelog cell in `CHANGELOG.md` + `CHANGELOG.es.md`; grounded as PE-015, owned by OB-11 + AC13, P4's done-when extended with the version-signal grep; ledgers re-frozen | user-authorized repair batch (`plan-fix 224`) |
| 2026-09-16 | `fix-224-artrev-0004` | Replan after the `feat/37-phase-lint-script` merge and the `audit-pr` BLOCKED verdict on PR #225 (`route: replan` from `node scripts/unit-route.mjs 224-deterministic-replan-routing`, bounded read set of 7 paths; findings F21–F25 in the fix-now fold ledger). Appends `P9` (terminal route for a finished unit + bare `status` token — F23, F24), `P10` (executed-phase lint exemption — F25), `P11` (contract docs + release signal for both), `P12` (terminal receipt closure — F21, F22) and **re-opens the executed `P8`** as the terminal close-out. **Placement:** inserted *before* `P8` rather than appended after it, because the sanctioned append (fresh final `Hardening & PR`) makes the executed `P8` non-last, and the shipped linter keys box-3's budget and box-7's `gh pr` position rule off the last phase (`scripts/phase-lint.mjs:653`) — the executed phase is then retro-blocked and the replan is unemittable (`verdict BLOCKED: lint-blocked`). Re-opening `P8` satisfies the placement rule's purpose (the ledger again ends with an unexecuted hardening closing out every phase) while keeping the plan lintable today; `P10` repairs the linter so the next replan does not need the workaround. **AC1 amended** to include the terminal route token and the bare `status` field; **OB-12, OB-13, OB-14, OB-15 added** as the owners of the new normative behaviours; `Depends on` unchanged (unit 37 is now on `main`, so AC5's live variant is recorded as executed evidence, not a new criterion) | user-authorized in-PR replan scope (operator decisions 2026-09-16: replan first, fix the post-merge dogfood defects inside this PR, insert-before placement, and repair the linter defect in-PR) |
| 2026-09-16 | `fix-224-artrev-0005` | One-batch repair of the plan-review cycle-2 findings (receipt `rp-224-20260915-004`, snapshot `bcde3ca15fa0f63fd16166833a3674668654715c8a89a6c13796362bbd610065`, PLAN-REVIEW-FAIL — RP-224-7…RP-224-11): `P11` gains the phase-contract rule task and `OB-16`, `OB-15` is narrowed to the replan contract, `OB-12` drops its duplicated half; `## Depends on` and PE-011/PE-013 are refreshed to the merged reality of unit 37; the re-opened `P8` becomes idempotent for the live PR and gains the three receipt tasks (moved out of `P12`) ordered after every tick, so the plan receipt cannot be voided by a later write; `### In scope`, `## Impact` and `## Rollback` declare the shared-linter edit; the scenario matrix gains S9–S11. `AC14` extended to cover the owner-side rule statement and the corpus triple, re-frozen (blob above); phases re-linted with the shipped linter → `verdict PASS`, fingerprint `597c922a20d352504d840cab86282fd149fbea9c636246481877650518e9a3fa` | user-authorized in-PR replan scope (operator decision 2026-09-16) |
| 2026-09-16 | `fix-224-artrev-0008` | Replan for the end review's plan-owned finding `F32` (the archived half of F24, the plan-owned row of the third review cycle): appends `P13` (the archived-unit state — a seventh route token `historical` for a unit whose status source is gone, F32/OB-17) and a fresh final `P14 Hardening & PR` after the executed `P8`, which the `F25` exemption keeps lintable. **AC1 amended** to the seven-token vocabulary; **OB-17 added** | user-authorized (operator decision 2026-09-16: fold the source rows in one batch and replan the plan-owned one, third review cycle authorized) |
| 2026-09-16 | `fix-224-artrev-0009` | One-batch repair of the replan review's findings (RP-224-16…RP-224-20): `P13` gained the `OB-17` reconciliation task; `## Impact` names the archived-state route change; `S12` joins the scenario matrix; the manifest's `AC1` enumerates seven tokens (re-frozen, blob above); the `RP-224-6` row is canonical again (`resolved` + merged evidence) | user-authorized (operator decision 2026-09-16) |

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

Acceptance manifest blob at planning time — re-frozen by the repair batches
`fix-224-artrev-0002` and `fix-224-artrev-0003`, by the replan
`fix-224-artrev-0004`, by the repair batch `fix-224-artrev-0005` and by the replan
`fix-224-artrev-0008` (each row of
`## Amendments` names what changed):
`git hash-object docs/fix/224-deterministic-replan-routing/ACCEPTANCE.md` →
`13580b459b1d93e8e80176ecf47311ca165b68fa` — recorded in the review receipt written by `review-plan` and
re-checked before every phase, per `verification-contract`.

(Removed from `docs/fix/README.md` only **after** the PR merges.)
