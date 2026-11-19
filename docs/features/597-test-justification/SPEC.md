---
type: feature
scope: medium
roadmap_summary: Issue [#597](https://github.com/gtrabanco/agentic-workflow/issues/597) (S/M): a new test carries a one-line justification naming the independent obligation it covers (owner: the tests-step reference, landing in the RED evidence row), and test deletion gains an authority stated where it executes — `execute-phase` for a plan-marked task, `fold-findings` for a `fix-now (delete)` row, nobody else — with the deletion-grounds vocabulary registered, the delete-vs-weaken boundary written once, and the touched budgets re-based. Triaged promote 2026-11-17 (promoted label applied). Soft order after #595, #596. Unit doc: [features/597-test-justification](features/597-test-justification/SPEC.md)
---

# 597 — test-justification

> One-line: a test now says which obligation it buys, and a deletion says who may
> execute it and on what evidence — so "never weaken a test" stops being read as a
> ban on evidenced deletion, and "it passes" stops passing for justification.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Cut from the request and the issue's own `## Expected behaviour`, one requirement
per distinct ask, quoted verbatim. The issue's words are the authority and this
document never paraphrases them.

**S1 — Apply issue 597 in this repository.**
> Apply to this repository: issue #597

**S2 — Oracle justification at creation, owned by the tests step and landing in the RED row.**
> 1. **Oracle justification at creation — execute-phase.** A test the triage/plan requests carries a one-line justification naming the independent obligation: the observable contract or behavioral gap it covers, **not** the implementation under test. The RED evidence (which already names the targeted tests) carries the justification line in the unit doc's Evidence. A test without a justification line is a review finding (`fix-now`), not a silent pass. Prose owner: `skills/unit-lane/references/TESTS.md` + `skills/execute-phase/references/TEST_IMPACT.md`; no new ceremony beyond the line.

**S3 — Deletion authority, stated where it is executed.**
> 2. **Deletion authority, stated where it is executed:**
>    - **execute-phase may delete a test when the unit's plan (the triaged step list) explicitly marks it** — the deletion is a planned task, its evidence row cites the legality ground (surface dead / obligation-level duplicate / cost-over-risk, owner rule 2026-11-16) and the evidence source.
>    - **fold-findings may delete a test when a finding row is `fix-now (delete)`** — the row already carries the finding's evidence; the fold's commit and the `folded: yes` update record the deletion. This extends fold-findings' contract from "repair" to include evidence-backed deletion; its current wording ("never reclassify or substitute") stays intact.
>    - **Nobody else deletes**: product-audit/review-* stay findings-only (their non-goals already say so); test-impact targeting never deletes.

**S4 — The boundary, written once, linked from the guide.**
> 3. **The boundary, written once:** deletion with cited evidence is legal; weakening, emptying, or skipping a test to make anything pass is never (AGENTS.md). Deleting a test is not an exception to red-first (red-first governs new pairs) and never happens to turn a red suite green — a suite that goes red because a deletion removes a needed guard is a planning error, routed back to the owner. Prose owner: `skills/unit-lane/references/TESTS.md`; AGENTS.md links it, not restates it (every-repetition-names-its-owner).

**S5 — Normative registration, budget re-basis and the release intent.**
> 4. **Normative registration:** the deletion-grounds vocabulary (dead-surface / obligation-level duplicate / cost-over-risk) needs its owner surface and a row in `docs/workflow/GATE_INVENTORY.md` + the AGENTS.md owner tables; budget re-basis for touched routes; changeset.

**S6 — The issue's acceptance criteria, all five.**
> - [ ] A unit whose plan marks a test deletion executes it with an evidence row citing the ground; a red-first pair is unaffected.
> - [ ] A `fix-now (delete)` row folds with the test deleted and the deletion recorded in the fold receipt.
> - [ ] A new test without a justification line surfaces as a finding (fixture).
> - [ ] The boundary (deletion ≠ weakening) is stated in TESTS.md and linked from AGENTS.md; no second copy.
> - [ ] `bun scripts/check-skill-context.mjs` green; root suites green; changeset per repo rule.

**S7 — The declared non-goals hold.**
> - No decision-model dependency (the substrate's role is recorded in #444; nothing here reads a model).
> - No new gate or script — prose contracts and existing gates only.
> - No reclassification power for fold-findings (it executes what the finding already says).
> - No deletion without the #595/#596 evidence standard.

**S8 — Direct application: no self-machinery, no self-approval.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change.

**S9 — Documentation and state are part of the change.**
> Ship the docs **in the same change** — never deferred:
> - Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events;
> - Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead;
> - `docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff;
> - The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S2) | the tests-step reference owns a `test-justification@1` block — the line, what it names, what it never names, and the finding an absent line is — and the clause rides the RED evidence row's `What was run` cell without extending the published five-column set | `bun test scripts/normative-drift.test.mjs` exits 0 (the surface's `block:` grammar resolves) and `rg -c 'justifies:' skills/execute-phase/references/TEST_IMPACT.md` prints `1` |
| AC-2 (S3, S6) | a plan-marked deletion and a `fix-now (delete)` row are the only two executors, each citing its ground in the row that records it, and a deletion caused red suite is a planning error routed back — not a reason to delete the guard | `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS` (the `test-deletion-authority` row resolves at its anchor) and `bun scripts/red-first.mjs` exits 0 with `0 finding(s)` (a red-first pair is unaffected) |
| AC-3 (S6) | a test without a justification line is a `fix-now` finding, never a silent pass; the observation half needs a review pass this unit does not run, recorded `n/a` on O14 | `rg -c '^absent \| fix-now \|' skills/unit-lane/references/TESTS.md` prints `1` |
| AC-4 (S4, S6) | the delete-vs-weaken boundary is stated once in the tests-step reference and the guide links it instead of restating it | `rg -c 'delete ≠ weaken' skills/unit-lane/references/TESTS.md` prints `1` and `bun test scripts/guide-split.test.mjs` exits 0 |
| AC-5 (S5, S6) | both new surfaces are declared in `normative-surfaces@1`, claimed by a gate-inventory row each, and the touched document and route ceilings are re-based by measurement | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun scripts/check-skill-context.mjs --routes` exits 0 |
| AC-6 (S5, S6) | the release intent ships and names the three touched skills | `bun scripts/lint-changeset.mjs .changeset/597-test-justification.md` exits 0 |
| AC-7 (S7) | the non-goals are invariants: no package, no script and no audit/review surface changes | `git diff --name-only main...HEAD -- packages scripts skills/product-audit skills/review-change` prints nothing |
| AC-8 (S8) | no review, audit or fold machinery ran on this change and every validator above ran in the foreground | `rg -c '^- \*\*R' docs/features/597-test-justification/SPEC.md` matches 0 |
| AC-9 (S9) | the unit doc, the journal fragment, the roadmap row and the generated projection are written through their declared writers, and the whole root gate is green at the handoff head | `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/run-root-suite.mjs` exits 0 |

## Impact

- **Changed skill surfaces**: `skills/unit-lane/references/TESTS.md` (the two new
  owner sections and their versioned blocks, plus one clause each on the fixed
  output contract, the checklist, the forbidden list and the tag block's
  `deletion` row), `skills/execute-phase/references/TEST_IMPACT.md` (the RED row
  carries the clause; the never-list gains the deletion ban that is not a repair),
  `skills/execute-phase/references/EXECUTION_CONTRACT.md` (the fixed
  allowed/forbidden lists) and `skills/fold-findings/SKILL.md` (the
  `fix-now (delete)` execution contract).
- **Guide layer**: two `normative-surfaces@1` rows and one pointer clause on each
  of the two existing tests bullets in `AGENTS.md`; two prose rows plus two
  claimed ids in `docs/workflow/GATE_INVENTORY.md`. Both documents' `machineLines`
  are re-pinned to the exact boundary they spend.
- **Budget**: `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-bases the seven
  `execute-phase:*` routes, because `EXECUTION_CONTRACT.md` is loaded by every one
  of them, and re-pins the two documents' machine regions. No skill ceiling moves:
  the three touched skills stay inside their declared main and reference ceilings.
- **Consumed from other units, never redefined**: the obligation-tag grammar and
  its `deletion` row (`TESTS.md` § Obligation tags, #596), the three surplus
  checks and their evidence standards
  (`skills/product-audit/references/AUDIT_DIMENSIONS.md` § Test-surplus sweep,
  #595), the plan's retirement shape (`skills/unit-lane/references/PLAN.md`
  § Retirements, #340), the classifier's class set and severity ladder
  (`skills/review-implementation/references/CLASSIFY.md`), the fold's frozen
  classification (`skills/fold-findings/references/FOLD_POLICY.md`) and the
  guide's test-immutability law (`AGENTS.md` § Working rules, `IR3`).
- **What stops being true**: the claim that no surface authorizes a test deletion,
  the claim that a new test's justification is model-guessed and unrecorded, and
  fold-findings' contract of "repair only" — it now executes a `fix-now (delete)`
  row as well.
- **Ask before touching**: the classifier's class vocabulary, the surplus checks'
  evidence standards and the retirement shape. All three are read here; changing
  any of them is its own unit.

## Surfaces

- `skills/unit-lane`
- `skills/execute-phase`
- `skills/fold-findings`
- `docs`

## Retirements

Strictly additive: nothing is retired. Every added surface lands with its consumer
named.

| Added surface | Named consumer |
|---|---|
| `test-justification@1` block in `TESTS.md` | `AGENTS.md#normative-surfaces@1` row `test-justification-grammar`; `docs/workflow/GATE_INVENTORY.md` row `test-justification`; `TEST_IMPACT.md` § The RED evidence |
| `test-deletion-authority@1` block in `TESTS.md` | `AGENTS.md#normative-surfaces@1` row `test-deletion-authority-grammar`; `docs/workflow/GATE_INVENTORY.md` row `test-deletion-authority`; `EXECUTION_CONTRACT.md` § Allowed & forbidden; `fold-findings/SKILL.md` § The `fix-now (delete)` row |
| `ED-597` route in `SKILL_CONTEXT_BUDGETS.json` | none — the route ceilings are the manifest reader's, `bun scripts/check-skill-context.mjs --routes` |

## Non-goals

- No decision-model dependency: deterministic prose and the existing gates only
  (S7).
- No new gate or script: the two new surfaces are pinned by the and tools that
  already read them — `scripts/normative-drift.test.mjs` and
  `scripts/prose-gate-inventory.mjs` (S7).
- No reclassification power for `fold-findings`: it executes what the row already
  says and never moves a row out of its frozen class (S7).
- No deletion without the #595/#596 evidence standard: the three grounds and their
  evidence owners are cited, never restated or widened (S7).
- No translation artifacts (English-only rule).
- Findings discovered during implementation never expand scope.

## Risk tier

- **Tier** — `standard` · **Task Size** — `unit-doc`
- **Named high-risk item** — `none — not a high-tier unit`.

Computed, never chosen. `agentic-workflow ceremony tier classify` over the unit's
full path set answers, verbatim:

```text
contract: risk-tier-verdict@1
tier: standard
reason: 1 path(s) carry executable content: docs/workflow/SKILL_CONTEXT_BUDGETS.json
reason_kind: executable-content
signals: []
task_size: { understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: unit-doc, verification: gates }
```

The single executable path is the budget manifest — a data file the context
checker reads, not a program this change ships (S7's non-goal holds).

## Future

None deferred. Issue #597's non-goals are scope, not deferred work: #598 (the
dogfooding estate sweep) executes the deletions this unit authorizes, in its own
unit and its own commits.

## Future cost

- **The two blocks are now load-bearing prose**: a future edit that renames a
  block row, the ground ids or the anchors moves the two `prose-gate-inventory`
  rows with it, and `bun scripts/prose-gate-inventory.mjs` refuses the stale
  anchor by name.
- **The guide's machine region is at its exact boundary**: `machineLines` is
  re-pinned to the measured 187 / 87, so the next added row there is a manifest
  edit by construction — the cost of registering a surface, not friction.
- **The seven `execute-phase:*` routes now sit at the checker's floor**: any
  further line in `EXECUTION_CONTRACT.md` re-bases all seven, because every route
  loads it.
- **The grounds have one owner and two consumers**: the ids are
  `test-surplus@1`'s and the authority is `TESTS.md`'s, so a fourth ground is a
  change to both — the day it is needed, it is one unit that adds the check and
  the executor together.
- **The observation is still owed**: the first review pass that meets a
  justification-less test is the run that proves the finding fires on a real unit
  (AC-3's observation half, `n/a` on O14 with that reason).

## Applicable tests

- `bun test scripts/normative-drift.test.mjs` — both new surfaces resolve as
  `block:` grammars, and the guide's machine region still parses.
- `bun scripts/prose-gate-inventory.mjs` — both new rows resolve at their section
  and token, both surface ids are claimed, and no row migrates.
- `bun test scripts/guide-split.test.mjs` — the guide links the boundary instead of
  restating it, and the layer stays inside its ceilings.
- `bun test scripts/test-obligation-tags.test.mjs` and
  `bun test scripts/test-impact.test.mjs` — the sibling suites of the two references
  this change edits: previous behaviour still holds.
- `bun test scripts/product-audit-surplus.test.mjs` and
  `bun scripts/skill-lint.mjs` — the surplus checks this unit cites are untouched,
  and no unknown vendor/stack reference enters the new prose.
- `bun scripts/check-skill-context.mjs`, `--documents`, `--routes` — the re-based
  budgets.
- `bun scripts/docs-generate.mjs --check` and `bun scripts/run-root-suite.mjs` — the
  projection and the whole root gate at the handoff head.

## Known pre-existing issues

- **The workspace is uninstalled in a fresh checkout** (`node_modules` absent at
  cut): `bun install --frozen-lockfile` was run at P1 to make the crate's CLI and
  the context checker available (tier classify, roadmap check). That is a
  checkout-local, gitignored step and not part of the change. **Does not affect**
  any validator: every suite reads committed source, and the two registration gates
  need only the installed workspace this step provides.
- **No repository gate executes a review axis**: the finding AC-3 declares is
  emitted by a model pass, so its observation half cannot be proved here. **Affects**
  O14 only, recorded `n/a` with the contract it rests on.
- **`bun test scripts/red-first.test.mjs` exceeds bun's own 5s per-test default in
  this checkout**: its shipped-history case walks 60 pairs, and the suite's 60s
  budget is already declared in `scripts/test-timeout-allowlist.json` with that
  exact reason. **Affects** O4's validator only, which is the gate's own invocation
  (`bun scripts/red-first.mjs`) plus the root suite's budgeted run — never the
  standalone default.
- **Strictly additive, so `## Retirements` spends its table on the three added
  surfaces** and names one with no consumer of its own (the budget route): the
  checker is its consumer, and a route needs no second one.
- **The `cost-over-risk` spelling in the issue and the shipped `cost-over-value`
  id differ.** The landed id wins (D2): re-using it keeps one owner for the ground
  set, and #595's pin suite asserts it. **Does not affect** any criterion — the
  ground is the same, and the id is the one a row cites.

## Tasks

- P1 — Cut the unit doc and both planning ledgers; record the intent resolution,
  the tier run and the fixture pass.
  (validator: `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S1, S9)
  - Relevant files: docs/features/597-test-justification/SPEC.md, docs/features/597-test-justification/planning-evidence.md, docs/features/597-test-justification/planning-obligations.md
- P2 — Register the two surfaces in the guide and the inventory, observed red on
  the blocks that do not exist yet.
  (validator: `bun scripts/prose-gate-inventory.mjs` exits 1 with `missing-section` for both new rows)
  (Implements: S5)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md
- P3 — Write the two owner blocks and the boundary in the tests-step reference,
  observed green against the rows P2 declared.
  (validator: `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS` and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5)
  - Relevant files: skills/unit-lane/references/TESTS.md
- P4 — Carry the justification clause into the RED evidence contract and the
  plan-marked deletion into the executor's fixed lists.
  (validator: `rg -c 'justifies:' skills/execute-phase/references/TEST_IMPACT.md` prints `1` and `rg -c 'Deletion authority' skills/execute-phase/references/EXECUTION_CONTRACT.md` prints `1`)
  (Implements: S2, S3)
  - Relevant files: skills/execute-phase/references/TEST_IMPACT.md, skills/execute-phase/references/EXECUTION_CONTRACT.md
- P5 — Extend the fold's contract to execute a `fix-now (delete)` row without
  reclassifying it.
  (validator: `rg -c 'fix-now \(delete\)' skills/fold-findings/SKILL.md` prints `2`)
  (Implements: S3, S4)
  - Relevant files: skills/fold-findings/SKILL.md
- P6 — Re-base the touched budgets by measurement: both documents' machine regions
  and the seven `execute-phase:*` routes.
  (validator: `bun scripts/check-skill-context.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun scripts/check-skill-context.mjs --routes` exits 0)
  (Implements: S5)
  - Relevant files: docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P7 — Close documentation and state: the release intent, the generated
  projection, the journal fragment, and every obligation row closed on its own
  validator's evidence.
  (validator: `bun scripts/lint-changeset.mjs .changeset/597-test-justification.md` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S5, S6, S9)
  - Relevant files: .changeset/597-test-justification.md, docs/generated/, .agentic-workflow/journal/, docs/features/597-test-justification/SPEC.md

The planning ledgers live beside this file, for a medium unit:
[planning-evidence.md](planning-evidence.md) and
[planning-obligations.md](planning-obligations.md).

## Triaged steps

```text
TRIAGE — 597-test-justification (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
```

The router's own output at the cut (`bun packages/agentic-workflow/bin/agentic-workflow.mjs
unit-route --triage 597-test-justification`), with two lines omitted: its `relay:`
and `relay-next:` lines propose bootstrapping a Relay packet, and this unit is
applied directly — no packet, no legs (S8). The `review` step is the router's
recommendation for a lane run; here it is discharged by the owner's external
verification instead of a `review-change` pass, which S8 forbids.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the request, verbatim:

  ```
  Apply to this repository: issue #597
  ```

- **D1** — 2026-11-19, intent resolved from state before any action: `proceed`.
  The branch `feat/597-test-justification-creation` was clean at `bf19d5831` (no
  commits ahead of `main`), the unit folder was absent, and the only issue label
  is `fix-next` + `promoted` (`gh issue view 597 --json labels`), so nothing
  contradicts "apply issue #597" and the unit starts as a fresh cut. The roadmap
  row already existed and already named this unit doc's path, which is why the
  home is `docs/features/597-test-justification/` and not a `docs/fix/` folder.
- **D2** — 2026-11-19, the issue's ground spelling `cost-over-risk` is not adopted:
  the shipped id is `cost-over-value` (#595, `test-surplus@1`, asserted by
  `scripts/product-audit-surplus.test.mjs:1-…`). Re-using the shipped id keeps one
  owner for the ground set; coining a second spelling would have created the
  duplicate vocabulary the guide's residency rule refuses. The issue's own
  `## Dependencies` names #595 as the standard this unit cites, so its id governs.
- **D3** — 2026-11-19, the non-goal "No new gate or script" is read strictly, and
  the `fixture` half of the third acceptance criterion is answered as `n/a` with
  its reason recorded on O14 instead of an invented pin suite: #595 could add a
  prose pin because its non-goal refused a *producer*; #597's refuses the carrier
  itself. The registration is therefore pinned by the two gates that already read
  these surfaces — `scripts/normative-drift.test.mjs` (the grammars) and
  `scripts/prose-gate-inventory.mjs` (the anchors) — which fail closed if the
  prose vanishes.
- **D4** — 2026-11-19, the commit slicing: the registration rows and the owner
  blocks land in one commit, because the registration alone is red by design
  (E1) and this repository never commits red — the red observation is the
  fixture's, not a commit. The cut, the contract and the release intent are three
  separate commits, each green at its own head.
- **D5** — 2026-11-19, `bun test scripts/red-first.test.mjs` fails standalone on
  bun's 5s per-test default in this checkout. The suite's 60s budget is declared
  with that exact pre-existing reason in `scripts/test-timeout-allowlist.json`,
  so O4's validator is the gate's own invocation and the root suite's budgeted
  run; the standalone failure is recorded, never hidden, and never repaired by
  touching the suite.
- **P1** — 2026-11-19, the unit doc and both planning ledgers cut · `6f2de432e`.
- **E1** — 2026-11-19, the fixture pass in a throwaway copy of the base commit
  (`tmp/aw597`, `git archive bf19d5831`, removed before the handoff): with the two
  registration rows in place and the owner blocks absent,
  `bun scripts/prose-gate-inventory.mjs` refused both — `test-justification —
  missing-section — skills/unit-lane/references/TESTS.md#The justification line`
  and its `missing-rederive` twin, the same pair for `test-deletion-authority` —
  and `bun test scripts/normative-drift.test.mjs` failed `AC15 scope` on
  `surface test-justification-grammar has no test-justification@1 block`. With the
  blocks written, the same two answer `verdict: PASS` and 22 pass / 0 fail. The
  same fixture produced the measurements the budget re-pin spends.
- **P2** — 2026-11-19, the two surfaces registered in the guide and the inventory
  and the owner blocks written · `314f94db7` (one commit, D4).
- **E2** — 2026-11-19, `314f94db7`, `bun scripts/prose-gate-inventory.mjs` · exit
  0 · `verdict: PASS`, `test-deletion-authority — prose ·
  skills/unit-lane/references/TESTS.md:109 · priority 6 · prose` and
  `test-justification — prose · …:84`; `bun test scripts/normative-drift.test.mjs`
  · exit 0 · 22 pass / 0 fail.
- **E3** — 2026-11-19, `314f94db7`, the wording receipts: `rg -c '^absent \|
  fix-now \|'` → `1`, `rg -c 'delete ≠ weaken'` → `1`, `rg -c 'test-surplus@1'` →
  `1`, `rg -c 'nobody-else'` → `1`, `rg -c 'test-justification@1'` → `1` — all four
  in `skills/unit-lane/references/TESTS.md`.
- **E4** — 2026-11-19, `314f94db7`, the consumers: `rg -c 'justifies:'` in
  `skills/execute-phase/references/TEST_IMPACT.md` → `1`, `rg -c 'Deletion
  authority'` in `…/EXECUTION_CONTRACT.md` → `1`, and `bun scripts/red-first.mjs` ·
  exit 0 · `red-first — 60 pair(s) · 35 after the cutoff · cutoff 839c2f1`,
  `0 finding(s)`.
- **E5** — 2026-11-19, `314f94db7`, `rg -c 'fix-now \(delete\)'` in
  `skills/fold-findings/SKILL.md` → `2`, and `bun test
  scripts/review-loop-discipline.test.mjs` · exit 0 · 0 fail (its assertions are
  module-level, so exit is the receipt).
- **E6** — 2026-11-19, `314f94db7`, `bun test scripts/guide-split.test.mjs` · exit
  0 · 17 pass / 0 fail, and `bun scripts/inviolable-rules.mjs` · exit 0 · `PASS
  inviolable rules: 14 rows · 1 home` — the guide's test-immutability law is
  untouched.
- **E7** — 2026-11-19, `314f94db7`, the budgets: `bun
  scripts/check-skill-context.mjs --documents` · exit 0 · AGENTS.md 614 / 187 /
  427 / 12876, GATE_INVENTORY.md 182 / 87 / 95 / 8238; `--routes` · exit 0 · 14
  routes, `execute-phase:feature` 14643 est / 1082 lines against the re-based
  16108 / 1191; the default mode · exit 0 · 30 skills, `fold-findings` 6308 est /
  432 lines inside its unchanged 6620 / 448.
- **P7** — 2026-11-19, the release intent, the emitter's roadmap row and
  projection · `db288950b`.
- **E8** — 2026-11-19, `db288950b`, `bun scripts/lint-changeset.mjs
  .changeset/597-test-justification.md` · exit 0 · `ok`; `bun
  scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`, `Roadmap:
  docs/ROADMAP.md — unchanged`; `agentic-workflow roadmap check
  docs/features/597-test-justification/SPEC.md` · exit 0 · `verdict: PASS`,
  `violations: 0`; `bun scripts/roadmap-settle.mjs` · exit 0 · `violations: 0`; the
  session entry is the fragment
  `.agentic-workflow/journal/20261119T212859Z-feat-597-test-justification-creation-narrative-local.md`
  and `agentic-workflow journal aggregate --check` · `{"ok":true,"checked":124}`.
- **E9** — 2026-11-19, the declared non-goals as invariants: `git diff
  --name-only bf19d5831...HEAD -- packages scripts skills/product-audit
  skills/review-change` prints nothing — no package, no script, no audit or
  review surface.
- **E10** — 2026-11-19, the sibling suites that read the same files, all exit 0:
  `test-obligation-tags` 15 pass / 0 fail, `test-impact` 21 / 0,
  `product-audit-surplus` 13 / 0, `residue-dimensions` 30 / 0,
  `unit-doc-contract` 21 / 0, `pre-execution-quality` 1 / 0, `invocation-drift`
  13 / 0, `workflow-docs-index` 5 / 0, `promise-coherence` 37 / 0,
  `docs-generate` 31 / 0, `check-skill-context` 1 / 0, `pre-execution-sensor`
  25 / 0, `workflow-status-pre-execution` 10 / 0.
- **E11** — 2026-11-19, a defect in this unit's own cut, found and repaired before
  the handoff: the 16 obligation rows were written with eight cells while the
  header declares the nine-column contract, so the status column was absent and
  the flips had nothing to flip. The status cell was appended to every row and the
  rows flipped on their own validators' evidence; `bun test
  scripts/pre-execution-quality.test.mjs` and `bun test
  scripts/ledger-ownership.test.mjs` re-ran green after the repair, and the defect
  is recorded here rather than lost in a rewrite.
- **G1** — 2026-11-19, HEAD `db288950b`, `bun scripts/run-root-suite.mjs --jobs 4`
  · exit 0 · 129 suites, no failure.

## Next

The external verification. Hand this diff to the owner for the §8 verdict — no
review pass, no audit and no fold cycle ran on it (S8) — then open the single PR
against `main` (`Closes #597`) and settle the roadmap row through the emitter at
the merge.

## References

- Issue [#597](https://github.com/gtrabanco/agentic-workflow/issues/597) — the
  request this unit applies; the PR closes it.
- Roadmap row `597` in `docs/ROADMAP.md`, settled through the emitter.
- Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595) — the
  three surplus checks and their evidence standards, cited and never redefined.
- Issue [#596](https://github.com/gtrabanco/agentic-workflow/issues/596) — the
  obligation tags the justification clause is bound to.
- Issue [#340](https://github.com/gtrabanco/agentic-workflow/issues/340) — the
  retirement shape a scheduled deletion task follows.
- Unit [595-test-surplus-audit](../595-test-surplus-audit/SPEC.md) — the precedent
  for a prose pin under a "no new script" non-goal, contrasted in D3.
- Unit [596-test-relevance-sweep](../../fix/596-test-relevance-sweep/SPEC.md) — the
  tag grammar and its gate.
- **G2** — 2026-11-19, HEAD `b45290fe5`, `bun scripts/dimension-regression.mjs --base
  main` · 18 dimensions on both sides · 1 changed review surface
  (`docs/workflow/GATE_INVENTORY.md`) · this unit doc as the evidence carrier ·
  `verdict | clean`. Its first run was `refused` with
  `missing-reverification-evidence` — the gate working, then satisfied by this
  line, which is why the command sits on it rather than below.
- **G3** — 2026-11-19, HEAD `19df399c3`, `bun scripts/local-gate.mjs --skip-network
  --jobs auto` · exit 0 · `local-gate: PASS — 15 step(s) in 891s`: the whole
  local-first gate — the two runtime legs of the crate suites (1,016 tests, 1,015
  pass / 1 skipped / 0 fail), the root suite, version parity, the projection, the
  journal carrier, log immutability, push identity, the secret scan, the hygiene
  and worktree steps, the rigor sweep and the dimension re-verification — green at
  the head this line's commit follows.
