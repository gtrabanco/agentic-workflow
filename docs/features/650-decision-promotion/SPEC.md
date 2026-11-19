---
type: feature
scope: medium
ac-hash: 49001af7393d29fc6cd4e307832758a17737ddce28b42b0defd3ab1b854d020b
roadmap_summary: Cross-cutting decision promotion — a decision whose scope is cross-unit is promoted to the ONE permanent owner doc that owns that scope (the guide's laws, `ARCHITECTURE.md`, `ARCHITECTURAL_INVARIANTS.md`), with the unit ledger linking it and never copying it; the scope is recorded in the decision row at capture time, `product-audit` gains the detection dimension with its deterministic producer, and a one-time backfill sweep audits the existing ledgers.
---

# 650 — decision-promotion

> One-line: a standing decision stops dying in the unit folder that took it — the
> lane records the decision's scope when it is captured, a cross-unit decision
> lands in exactly one permanent owner doc with the unit ledger linking it, and
> the audit finds the ones that never made it.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#`, quoting the requester's own words verbatim.
`S1` is the turn's instruction; `S2…S11` quote issue
[#650](https://github.com/gtrabanco/agentic-workflow/issues/650), which `S1`
adopts. The issue's own recorded owner decisions (2026-11-19) are `S12`.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #650

**S2 — The goal: the gap this feature closes.**
> Decisions with cross-unit scope (conventions, boundaries, ceremony, tooling) currently live only in a unit's `decisions.md`, its `architecture-notes.md` contract-impact notes, or a `## Log` `D` line — and die as active references when the unit closes and (with the companion retention feature) settles. This feature adds the missing promotion rule: a decision whose scope is cross-unit MUST land in the ONE permanent doc that owns that scope (`AGENTS.md` charter/working rules, `ARCHITECTURE.md`, `ARCHITECTURAL_INVARIANTS.md`), with unit docs linking — never copying (every-repetition-names-its-owner). A one-time backfill sweep audits the existing ledgers for promotable content and lands it through the normal docs path.

**S3 — The promotion rule (in scope, element 1).**
> - **The promotion rule**: a decision in a unit's `decisions.md`, `architecture-notes.md` contract-impact, or `## Log` `D` line whose scope is cross-unit is promoted to the owner doc of that scope (charter slots/working rules in `AGENTS.md`; `ARCHITECTURE.md`; `ARCHITECTURAL_INVARIANTS.md`). The promoted statement lives in exactly ONE owner doc; unit docs link it, never copy it.

**S4 — Capture-time scope recording (in scope, element 2).**
> - **Capture-time guidance**: the lane's decision steps record the decision's scope (unit-only vs cross-unit) at capture time in `decisions.md`/the `D` line, so the promotion decision is made once, with the decision — not excavated later.

**S5 — The architectural procedure (in scope, element 3).**
> - **Architectural procedure — documented and referenced**: the promotion procedure ships documented in `ARCHITECTURE.md` (the existing owner doc for cross-cutting rules — when a decision is cross-unit, which owner doc receives it per scope, the link-never-copy consequence) and referenced from every surface that carries it (the lane's capture-time guidance, product-audit's detection dimension). If a NEW doc ever takes ownership of the procedure, its documentation-map row ships in the same PR. If the capture-time scope recording introduces fixed grammar (a new `decisions.md` column or typed block), that grammar is a normative surface — registered in `normative-surfaces@1` with its vocabulary owned by the schema package.

**S6 — The detection dimension (in scope, element 4).**
> - **Detection dimension** in `product-audit`: a general-rule statement living only in a unit ledger is a typed finding (route: promotion).

**S7 — The backfill sweep (in scope, element 5).**
> - **Backfill sweep**: a one-time audit-style pass over existing `decisions.md` / `architecture-notes.md` / `docs/LOGS.md` entries → findings table persisted as the sweep's carrier → promotions land via the normal docs path (owner-directed inline batches or units — per the one-PR-per-unit rule).

**S8 — The pre-plan re-analysis the lane must run before the plan freezes.**
> This issue body records the 2026-11-19 analysis; it is not a substitute for a fresh one. Before the plan is frozen, the lane MUST re-analyze the **problem and the solution** against the tree as it stands then:
>
> - **Re-validate the problem** — do the ledgers still carry cross-unit decisions that never reach a permanent doc? Have new decision surfaces appeared since (new capture points, ledger formats, ceremony pieces) that change the problem?
> - **Re-validate the solution** — is the promotion rule as recorded here still the right design? Assess explicitly, element by element, what to **discard** and what to **add** as the direct or indirect effect of the features and fixes that landed while this feature was not yet done: new owner docs or scope categories, new commands reading these ledgers, new normative surfaces, new decision kinds. A superseded element is recorded as superseded with its reason in the unit doc — never silently carried into the SPEC.
> - **Re-map the surfaces** — new sections or files the analysis must cover, new commands that depend on the ledger sections this issue reads, and every lateral effect of work landed in the meantime.
>
> The evidence must be re-derived from current code, never taken from this body.

**S9 — Out of scope, verbatim.**
> - Changing what `resolve-repository-state` owns or writes.
> - Mechanical auto-promotion (an agent moving statements into `AGENTS.md` on its own initiative) — promotions are owner-directed docs changes.
> - Retention/trimming — companion issue owns it.

**S10 — Acceptance criteria, verbatim.**
> - The promotion rule is documented with its owner-doc-per-scope mapping and the link-never-copy consequence.
> - `ARCHITECTURE.md` documents the promotion procedure, and every surface that carries it (the lane's capture-time guidance, product-audit's detection dimension) references it; if the scope recording introduced fixed grammar, it is registered in `normative-surfaces@1` with its vocabulary in the schema package.
> - The lane records each decision's scope at capture time (template + skill prose + tests).
> - `product-audit` emits typed findings for general-rule statements living only in unit ledgers.
> - The backfill sweep ran once: findings table persisted; each promoted statement lives in exactly one owner doc; unit docs link it.
> - The pre-plan re-analysis was executed — problem, solution (discard/add per element) and surfaces — and its evidence is in the unit doc before the plan froze.

**S11 — Open questions and risks, verbatim.**
> - Precedence when a decision's scope spans both `AGENTS.md` and `ARCHITECTURE.md` — which owner doc wins (decide at planning).
> - Whether the capture-time scope recording needs fixed grammar (a scope column in `decisions.md` rows) or prose guidance suffices — decides whether a normative-surface registration ships.
> - Backfill execution vehicle (owner inline batches vs units) — per-unit volume decides.
> - Ledger formats will have moved by implementation time — the pre-plan re-analysis covers it.

**S12 — The issue's recorded owner decisions (2026-11-19), verbatim — binding.**
> 1. Separate issue from doc retention (companion; link in Dependencies). It lands the rule + the backfill sweep; the retention feature assumes it exists but does not depend on it mechanically.
> 2. The analysis this body records is re-run BEFORE planning (see the re-analysis requirement below) — the problem, the solution and the surfaces will have moved by then.
> 3. `resolve-repository-state` is NOT the writer here — it owns frozen repository-state facts only; a promotion is a docs change like any other.
> 4. This is an architectural change that adds a standing procedure: it ships documented and referenced (see In scope), not as prose buried in a skill.

## Re-analysis (S8 — run at this cut, not inherited from the issue body)

Each element of the issue's 2026-11-19 analysis is re-derived from the tree at
`bf19d5831` and marked **confirmed**, **amended** or **superseded**. The
evidence is `PE-*` rows in [`planning-evidence.md`](planning-evidence.md).

| element | verdict | evidence at this cut |
|---|---|---|
| **Problem** — cross-unit decisions die in the unit folder | **confirmed, quantified** | 252 unit folders, 127 with a `decisions.md`; 57 `decision`-row entries across them, 589 `## Log` `D` lines across 105 unit docs, 27 `architecture-notes.md`. `rg 'promot' skills/ template/ docs/architecture/` returns no promotion rule at all: the only `promote` hits are the triage verdict (`promoted` label) and the release channels — the gap the issue names is real and has no carrier (`PE-001`) |
| **Problem** — new decision surfaces since 2026-11-19 | **amended: one new capture point** | the `## Log` `D` line is the decision carrier of every unit opened after feature 61 (`log-kind@1`); `decisions.md`'s `open-questions@1` block (Q/D rows) remains the other. Both are read by `needs-input` (`PE-002`). No third carrier exists; `architecture-notes.md` is a prose file no reader parses |
| **Solution 1 — the promotion rule + owner-doc-per-scope mapping** | **confirmed, with the precedence decided here** | the three owner docs exist with different roles: `AGENTS.md` carries the always-loaded `inviolable-rules@1` table whose `owner` cell cites the mechanism (`IR1…IR14`); `docs/architecture/ARCHITECTURE.md` is the structural owner; `docs/architecture/ARCHITECTURAL_INVARIANTS.md` holds `AI-001`-shaped checkable invariants. The precedence `S11` asks for is answered by that existing shape, not invented: **the doc that carries the mechanism owns the statement; the guide carries one law row whose `owner` cell cites it** (`PE-003`, `D2`) |
| **Solution 2 — capture-time scope recording** | **amended: fixed grammar, not prose** | prose cannot be read by anything: the ledger's own reader (`parseLedger`) already tolerates trailing cells on a `decision` row, and the closed set has a machine home waiting (`vocabularies.ts`). A prose-only scope would leave `S6`'s dimension model-swept over 589 free-text lines (`PE-004`, `D3`) |
| **Solution 3 — the procedure documented in `ARCHITECTURE.md` and referenced from its carriers** | **confirmed, home pinned** | `template/docs/architecture/ARCHITECTURE.md` is the architecture doc a target project *copies and fills* (36-line scaffold); the workflow therefore ships the **procedure** as a section there and the project's own architecture prose stays the project's. The charter already carries the slot this procedure answers — `Decision records: <where architecture decisions live…>` (`PE-005`) |
| **Solution 4 — a detection dimension in `product-audit`** | **confirmed, producer added** | every dimension starts at a deterministic producer where one exists (#440), and two of the four precedent producers (`coverage-gap`, `journal-corpus`) are exactly this shape: one script, one receipt grammar, one seeded/clean fixture, one evolution-regression duty. A model-only sweep over 589 free-text lines is the surface `S6` exists to make checkable (`PE-006`) |
| **Solution 5 — the backfill sweep** | **confirmed, bounded** | the issue's "one-time audit-style pass" lands as this unit's own sweep carrier with a declared sample (all 57 `decision` rows, all 27 `architecture-notes.md`, the 60 most recent `## Log` `D` lines), each row dispositioned and every promotion landed in exactly one owner doc (`PE-007`) |
| **Discard** — `resolve-repository-state` as a writer | **confirmed out of scope** | that skill writes frozen repository facts only; a promotion is a docs change (`S9`, `S12.3`) — no edit to it ships |
| **Discard** — mechanical auto-promotion | **confirmed out of scope** | the producer **detects and proposes**; it writes nothing. `S9`'s ban is honoured by construction (`PE-008`) |
| **Discard** — an `open-questions@2` block or a new column on the block header | **superseded by design** | the block's column row is parsed exactly by `needs-input` (`LEDGER_COLUMNS`), so changing it would refuse all 127 existing ledgers as `malformed-ledger-header`; the scope cell rides the `decision` row's trailing cell, which the reader already tolerates (`D4`) |

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it. Frozen at the plan cut; a criterion is never rewritten at close.

| id | requirement | criterion | proving check |
|---|---|---|---|
| AC-S1 | S1 | this unit dir carries `SPEC.md`, `planning-evidence.md`, `planning-obligations.md`, `decisions.md` and `backfill-sweep.md`, and every obligation row is `verified` or an evidenced `n/a` | `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/650-decision-promotion/SPEC.md` exits 0 · `rg -c 'planned\|in-progress' docs/features/650-decision-promotion/planning-obligations.md` matches 0 |
| AC-S2 | S2 | the promotion rule exists in exactly one owner doc per scope, and the tree states the failing state it prevents (a cross-unit decision with no permanent home) | `rg -c 'decision-scope@1' skills/unit-lane/references/DESIGN.md` matches 2 · `rg -c 'Promoting a decision' template/docs/architecture/ARCHITECTURE.md` matches 1 |
| AC-S3 | S3 | the owner-doc-per-scope mapping and the link-never-copy consequence are published once, and the unit ledger side is a citation | `rg -c 'unit-only\|cross-unit' skills/unit-lane/references/DESIGN.md` matches ≥ 2 · `rg -c 'link' template/docs/architecture/ARCHITECTURE.md` matches ≥ 1 |
| AC-S4 | S4 | the `decision` row's scope cell is a machine vocabulary in the schema package, the reader exposes it, and the lane records it | `bun packages/agentic-workflow/bin/agentic-workflow.mjs needs-input docs/features/650-decision-promotion --json` exits 0 · `bun test packages/agentic-workflow/test/runner.sensors.test.mjs` exits 0 · `bun test scripts/decision-promotion.test.mjs` exits 0 |
| AC-S5 | S5 | the procedure is documented in the architecture doc, referenced from the lane's capture guidance and from the audit dimension, and the new grammar is registered in `normative-surfaces@1` with its vocabulary in the schema package | `bun test scripts/normative-drift.test.mjs` exits 0 · `rg -c 'decision-scope' AGENTS.md` matches ≥ 2 |
| AC-S6 | S6 | `product-audit` carries the dimension row, the pass-only-if section, the receipt grammar and the seeded/clean fixture, and the producer emits one finding per unpromoted cross-unit decision | `bun test scripts/decision-promotion.test.mjs` exits 0 · `rg -c 'Decision promotion' skills/product-audit/references/AUDIT_DIMENSIONS.md` matches 1 |
| AC-S7 | S7 | the sweep ran over its declared sample, its findings table is persisted, and every promoted statement lives in exactly one owner doc cited by its row | `rg -c '^\\| B[0-9]+ \\|' docs/features/650-decision-promotion/backfill-sweep.md` matches ≥ 12 · `bun scripts/decision-promotion.mjs --root .` exits 0 and prints `verdict \\| clean` |
| AC-S8 | S8 | the re-analysis is in this document with a per-element verdict and a `PE-*` citation each | `rg -c 'confirmed, \\|amended: \\|superseded by design\\|confirmed out of scope' docs/features/650-decision-promotion/SPEC.md` matches ≥ 6 |
| AC-S9 | S9 | no change to `resolve-repository-state`, and the producer writes nothing (read-only, no auto-promotion) | `git diff --stat origin/main -- skills/resolve-repository-state/` prints nothing · `bun test scripts/decision-promotion.test.mjs` exits 0 (its read-only case) |
| AC-S10 | S10 | all six issue criteria are delivered and covered | AC-S2 … AC-S7 all pass |
| AC-S11 | S11 | each open question is closed by a recorded `D` row: the precedence, the grammar decision, the backfill vehicle, and the ledger-format re-check | `rg -c '^- \*\*D[0-9]' docs/features/650-decision-promotion/SPEC.md` matches ≥ 8 |
| AC-S12 | S12 | the four owner decisions hold: separate from #651, re-analysis run, `resolve-repository-state` untouched, procedure documented and referenced | AC-S8 · AC-S9 · AC-S5 · `rg -c '651' docs/features/650-decision-promotion/SPEC.md` matches ≥ 1 |

## Impact

- **Consumers of the ledger**: `needs-input` is the only machine reader of
  `decisions.md`; it gains one read of the `decision` row's trailing cell, so
  every existing ledger keeps parsing unchanged (a legacy row with no scope cell
  is a decision whose scope was never recorded — `unknown`, never a refusal).
  The printed `open-questions@1` envelope is **unchanged**: the scope is not a
  question, so it never enters the hand-off block.
- **The guide**: `AGENTS.md` gains three `normative-surfaces@1` rows — the
  drafted `rendered-facts@1` row was dropped at execution (`D12`: the block
  publishes no `type` column for a `restates:` claim to recompute) — so its
  machine region grows by three lines and its ceilings are re-based to the
  measurement in the same change.
- **The scaffold**: `template/AGENTS.md`'s `open-questions@1` example row gains
  the scope cell, and `template/docs/architecture/ARCHITECTURE.md` gains the
  procedure section every target project inherits; `template/` has no budget
  entry, so no ceiling moves for it.
- **`product-audit`**: the dimension table gains one row, so the reference grows
  and its budget is re-based; `scripts/dimension-regression.mjs` refuses a
  dimension change with no recorded run, so this unit records one.
- **The gate inventory**: a new deterministic producer is a new gate row, and
  the `normative-surface-grammar` row's `surfaces` cell claims the new ids.
- **Stops being true**: the audit dimension table's claim that no dimension reads
  the decision ledgers; and the lane's decision step's silence about scope.
- **Live surfaces**: `packages/agentic-workflow-schema` (a new published const)
  and `packages/agentic-workflow` (the ledger reader) both move, which earns a
  changeset and the version-parity gate's attention.

## Surfaces

- `docs`
- `scripts`
- `skills/unit-lane`
- `skills/product-audit`
- `template`
- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`

## Retirements

Nothing is retired: this unit is strictly additive on every surface it touches.
The computed inventory is the anti-divergence receipt:

`bun scripts/residual-classify.mjs --inventory --base origin/main` lists the added
surfaces with the state the plan decided for each (`E12` in `## Log`). Every
addition has a consumer in this change except the two the dimension contract
requires to be *declared before first use*: `DECISION_SCOPES` is consumed by the
reader, the producer, the audit dimension and the two prose surfaces in the same
change, so nothing lands as `orphan` while the unit is open. Once the roadmap
row reaches a terminal status the plan claim ends
(`scripts/residual-classify.mjs`'s `unitIsOpen`/`TERMINAL_STATUS`, `PE-019`), so
the inventory re-run at head reports `scripts/decision-promotion.test.mjs` as
`orphan / no-plan-claim` — the classifier's done-unit semantics, not a dead
surface: the root suite runs it (`G13`) and its producer has live consumers
(`E22`).

## Non-goals

- Any change to `resolve-repository-state` — it owns frozen repository-state
  facts; a promotion is a docs change (`S9`, `S12.3`).
- Mechanical promotion: the producer detects and proposes; moving prose into
  `AGENTS.md` stays an owner-directed docs change (`S9`).
- Retention, trimming or archiving settled unit docs — companion issue #651.
- A second `open-questions` block generation or a new column on its header row
  (`D4`).
- Re-litigating the entity-fusion of `decisions.md` with the `## Log` `D` line:
  both carriers stay, and the scope cell is published in both (`D5`).

## Risk tier

- **Tier** — `standard` · **Task Size** — `contained`
- **Named high-risk item** — none — not a high-tier unit
- **Verdict source** — `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --base origin/main` at the plan cut over the planned paths, recorded as `E1`. The unit ships a script, a suite, a fixture generator, a schema const and a reader change, so `passive` is excluded by definition.

## Future

none — nothing was deferred. The companion unit is #651's work, not this unit's
future; neither is a postponed promotion (every promotion the sweep found either
landed here or is recorded as `unit-only` with its reason).

## Future cost

| rule | binds |
|---|---|
| A new cross-unit decision is captured with its scope cell and promoted to one owner doc in the change that takes it; a later reader finds it there, never in the closed unit folder | every future unit's decide step |
| A unit ledger that names a cross-unit decision without naming its owner doc is one `decision-promotion@1` finding, not a review judgement call | every future review, audit and fold of a promotion finding |
| The scope vocabulary has one machine owner (`DECISION_SCOPES`); the prose surfaces cite it, and the block↔const equivalence pins both directions in `scripts/decision-promotion.test.mjs` (the drafted `rendered-facts@1` row was dropped, `D12`) | every future unit that changes the scope set |
| A promotion never copies the statement into the guide: the guide carries one law row whose `owner` cell cites the mechanism doc | every future rule that is architectural rather than conventional |

## Applicable tests

| suite | what it proves for this unit |
|---|---|
| `scripts/decision-promotion.test.mjs` | the producer's receipt contract, the cross-unit/unpromoted detection, the read-only guarantee, the seeded/clean fixture pair, determinism, and the prose the dimension ships |
| `scripts/normative-drift.test.mjs` | the two `schema-export:`/`block:` rows resolve (no `restates:` row ships — `D12`: the block publishes no `type` column for one to recompute) |
| `scripts/prose-gate-inventory.test.mjs` | the new gate row and the `surfaces` cell it claims |
| `scripts/dimension-regression.test.mjs` | the dimension change carries its re-verification run |
| `scripts/vocabulary-parity.test.mjs` | the new const has one owner and no literal copy outside the registered surfaces |
| `packages/agentic-workflow-schema/test/index.test.mjs` | the const is published from the package root |
| `packages/agentic-workflow/test/runner.sensors.test.mjs` | the ledger reader keeps every existing behaviour and reads the scope cell |
| `scripts/scaffold-parity.test.mjs` | the scaffold's new prose does not break the template parity checks |
| `scripts/check-skill-context.test.mjs` | the two re-based ceilings still bound their files |

## Known pre-existing issues

- `scripts/decision-promotion.mjs`'s input (the `## Log` `D` line) is prose, not a
  row grammar: a `D` line carries no cells a reader can key on. **Affects** this
  unit: the producer reads the scope cell from `decisions.md` rows only, and the
  `## Log` `D` line is covered by the audit dimension's model remainder. Making
  the `D` line a row grammar is a separate unit's decision, not a silent extension
  here.
- The issue's 2026-11-19 body cites `docs/LOGS.md` as a sweep input. That file is
  an **aggregator** since #468: fragments are written by `journal write` and
  aggregated into it, and the aggregator is byte-prefix append-only. **Affects**
  this unit: the sweep reads `docs/LOGS.md` plus the pending fragment directory
  through the existing journal-carrier readers rather than re-parsing the log.
- `skills/product-audit/references/AUDIT_DIMENSIONS.md` has no consumer that
  enforces the *table row* and the *pass-only-if section* agree; the evolution
  gate only counts dimension ids. **Does not affect** this unit: both are written
  in the same change and `scripts/decision-promotion.test.mjs` asserts the section
  exists for the row it adds.

## Tasks

- P1 — Freeze the plan: this document with the `S8` re-analysis, the two planning
  ledgers, `decisions.md` with its path-protection records, and the sweep
  carrier's header.
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/650-decision-promotion/SPEC.md` exits 0)
  (Implements: S1, S8, S11)
  - Relevant files: docs/features/650-decision-promotion/

- P2 — Land the frozen-failure corpus red: the producer's sibling suite alone,
  observed failing against the missing module — the sweep's real reproducers plus
  the receipt and fixture cases it must satisfy.
  (validator: `bun test scripts/decision-promotion.test.mjs` exits 1 naming the missing `scripts/decision-promotion.mjs`)
  (Implements: S6, S7)
  - Relevant files: scripts/decision-promotion.test.mjs

- P3 — Publish the scope vocabulary in the schema package: the closed const in
  `packages/agentic-workflow-schema/src/vocabularies.ts`, its package-root
  re-export and the export suite's case.
  (validator: `bun test packages/agentic-workflow-schema/test/index.test.mjs` exits 0)
  (Implements: S4)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts

- P4 — Read the scope cell in the ledger reader: one additive case block in the
  crate's sensor suite (legacy tail, a scope cell, a tail that only looks like
  one) and the trailing-cell read in `packages/agentic-workflow/src/runner/sensors/needs-input.mjs`,
  with the printed hand-off envelope unchanged.
  (validator: `bun test packages/agentic-workflow/test/runner.sensors.test.mjs` exits 0)
  (Implements: S4)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/needs-input.mjs, packages/agentic-workflow/test/runner.sensors.test.mjs

- P5 — Implement the producer: read every unit ledger through the crate's own
  parser, emit the `decision-promotion@1` receipt with one row per cross-unit
  decision (its owner-doc citation, else its finding), refuse a malformed ledger,
  mutate nothing.
  (validator: `bun test scripts/decision-promotion.test.mjs` exits 0)
  (Implements: S6, S7, S9)
  - Relevant files: scripts/decision-promotion.mjs

- P6 — Ship the dimension's calibration fixture: `scripts/product-audit-promotion-fixture.mjs`
  lays down one seed per finding class beside a clean twin, so the sweep's
  pass-only-if has its paired case.
  (validator: `bun scripts/product-audit-promotion-fixture.mjs "$(mktemp -d)"` exits 0 and `bun test scripts/decision-promotion.test.mjs` exits 0)
  (Implements: S6)
  - Relevant files: scripts/product-audit-promotion-fixture.mjs

- P7 — Document the promotion procedure in the scaffold's architecture doc: when a
  decision is cross-unit, which owner doc receives it per scope, the precedence,
  and the link-never-copy consequence.
  (validator: `rg -c 'Promoting a decision' template/docs/architecture/ARCHITECTURE.md` matches 1)
  (Implements: S2, S3, S5)
  - Relevant files: template/docs/architecture/ARCHITECTURE.md

- P8 — Record the capture-time scope guidance in the lane's decision reference:
  the `decision-scope@1` block, the `decision` row's scope cell, and the pointer
  to the procedure.
  (validator: `bun scripts/check-skill-context.mjs --skill unit-lane` exits 0)
  (Implements: S3, S4, S5)
  - Relevant files: skills/unit-lane/references/DESIGN.md

- P9 — Ship the detection dimension: the applicability row, the pass-only-if
  section with the receipt grammar and its evidence standard, and the route the
  audit already owns.
  (validator: `bun scripts/check-skill-context.mjs --skill product-audit` exits 0)
  (Implements: S5, S6)
  - Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md

- P10 — Carry the ledger contract into the scaffold: the `decision` row's scope
  cell beside its column contract, and the charter's decision-records slot naming
  the procedure.
  (validator: `bun test scripts/scaffold-parity.test.mjs` exits 0)
  (Implements: S3, S4, S5)
  - Relevant files: template/AGENTS.md

- P11 — Register the grammar and the gate: three `normative-surfaces@1` rows (the
  drafted `rendered-facts@1` row dropped at execution, `D12`), the guide's own
  promotion law, the gate-inventory row
  with the claimed surface ids, and the ceiling re-pins the growth measures.
  (validator: `bun test scripts/normative-drift.test.mjs` and `bun test scripts/prose-gate-inventory.test.mjs` exit 0)
  (Implements: S3, S5, S6)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json

- P12 — Run the backfill sweep over its declared sample and land the promotions:
  the findings table in the sweep carrier, each promotion in exactly one owner doc
  with its sweep row citing it, and the producer re-run green over the tree.
  (validator: `bun scripts/decision-promotion.mjs --root .` exits 0 and prints `verdict | clean`)
  (Implements: S7, S12)
  - Relevant files: docs/features/650-decision-promotion/backfill-sweep.md, AGENTS.md

- P13 — Close: the evidence rows appended, every obligation row at `verified` (an
  evidenced `n/a` where a row allows one), the evolution-regression run recorded,
  the projection regenerated, and the session entry written.
  (validator: `bun scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S10)
  - Relevant files: docs/LOGS.md, docs/features/650-decision-promotion/

- P15 — Correction batch (external verify 2026-11-19): re-point the three anchors
  that never ran (`O7`, `O20`, `AC-S4`), supersede `D3`'s dropped
  `rendered-facts@1` row, qualify the `## Retirements` inventory claim with the
  classifier's done-unit semantics, add the scope cell to the plan stage's
  decision-row example, and align the producer's exit-code comment.
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/650-decision-promotion/SPEC.md` exits 0)
  (Implements: S1, S4, S7)
  - Relevant files: docs/features/650-decision-promotion/, skills/unit-lane/references/PLAN.md, scripts/decision-promotion.mjs

### Planning evidence

Frozen beside this document: [`planning-evidence.md`](planning-evidence.md).

### Obligations

Frozen beside this document: [`planning-obligations.md`](planning-obligations.md).

## Triaged steps

Read from the machine, not chosen here. The router's verdict at the plan cut is
the authoritative step list; the tasks above are its expansion, in its order.

```text
TRIAGE — 650-decision-promotion (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/650-decision-promotion
```

The `review` step is the one the operator's instruction supersedes for this
change (`D6`): the unit is applied inline and the operator is its external
verifier, so no `review-change`, `audit-pr` or fold cycle runs on it. Every
other triaged step executes here, in the router's order.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from `log-kind@1`.

- **L1** — 2026-11-19, the request, verbatim:
  ```
  Apply to this repository: issue #650
  ```
- **D1** — 2026-11-19, the owner-doc-per-scope mapping is fixed as four scopes,
  one owner each: `unit-only` → the unit ledger itself; a **convention or law**
  that binds every session → the guide (`AGENTS.md`, as one `inviolable-rules@1`
  row whose state cell names its carrier); a **structure** decision (module or
  layer ownership, dependency direction, boundary) → `docs/architecture/ARCHITECTURE.md`;
  a **checkable long-lived property with a mechanism** →
  `docs/architecture/ARCHITECTURAL_INVARIANTS.md` as `AI-<n>`. Authority: `S3`
  ("charter slots/working rules in `AGENTS.md`; `ARCHITECTURE.md`;
  `ARCHITECTURAL_INVARIANTS.md`") read against the three documents' actual roles
  (`PE-003`).
- **D2** — 2026-11-19, the precedence `S11` asks for when a decision spans the
  guide and the architecture doc: **the doc that carries the mechanism owns the
  statement; the guide carries one law row whose `owner` cell cites it.** The
  guide's own `inviolable-rules@1` shape (one row per law, `owner` naming the
  surface that owns the mechanism, `state` saying how it is enforced) and `IR11`
  ("a rule, contract or vocabulary names the surface that owns it before it enters
  a doc, and a second copy cites that owner") already answer it; the alternative —
  the guide holding the long form — would restate the mechanism in the
  always-loaded file and pay its line budget for a copy. Authority: `S11`'s first
  question, delegated to planning by `S12.2`.
- **D3** — 2026-11-19, the capture-time scope recording is **fixed grammar**, not
  prose: a trailing `scope` cell on the `decision` row, closed to
  `DECISION_SCOPES` (`unit-only | cross-unit`) in the schema package, registered
  in `normative-surfaces@1` with a `rendered-facts@1` row recomputing the prose
  against the const. Authority: `S5`'s grammar clause plus `S6` — a prose scope
  leaves the detection dimension model-sweeping 589 free-text `D` lines, and a
  closed set with no machine owner is the `AI-001` defect (`PE-004`).
- **D4** — 2026-11-19, the scope rides the `decision` row's **trailing cell**; the
  `open-questions@1` header row is untouched and no `open-questions@2` generation
  exists. The reader parses the header exactly (`LEDGER_COLUMNS`), so a new column
  there would refuse all 127 existing ledgers as `malformed-ledger-header`, and the
  `decision` row's tail is already tolerant (`cells.slice(7)`). A row whose last
  cell is not a member of the vocabulary keeps parsing as a legacy row with no
  recorded scope (`PE-002`). Authority: `S11`'s second question plus the reader's
  own contract.
- **D5** — 2026-11-19, both decision carriers stay: the `decisions.md` `decision`
  row carries the scope cell, and the `## Log` `D` line is covered by the
  dimension's model remainder. Making the `D` line a row grammar is not this
  unit's work — `log-kind@1` publishes it as a prose line and a grammar change
  there is a separate normative-surface change (`PE-009`).
- **D6** — 2026-11-19, the router's `review` step is superseded for this change:
  the operator's instruction applies the unit inline and holds the external
  verifier role, so no `review-change`, `audit-pr` or fold cycle runs here. The
  repository's deterministic gates still run in full. Authority: §4 of the
  operator's instruction for this turn, read against the triage block above.
- **D7** — 2026-11-19, the backfill sweep's vehicle is **this unit's own change**
  with a declared sample (all 57 `decision` rows, all 27 `architecture-notes.md`,
  the 60 most recent `## Log` `D` lines, newest first by their date cell), not a
  new unit per promotion: the sweep found four promotable statements, below the
  volume that would justify splitting, and each lands in an owner doc this change
  already touches. Authority: `S7`'s "owner inline batches or units — per-unit
  volume decides" plus `S11`'s third question.
- **D8** — 2026-11-19, the promotion procedure ships in
  `template/docs/architecture/ARCHITECTURE.md` (the doc a target project copies)
  and **not** in this repository's `docs/architecture/ARCHITECTURE.md`, which stays
  the unfilled scaffold it has always been: the procedure is product-domain
  (every target project needs it) while this repository's own architectural
  statements are project-domain and already live in `AGENTS.md`'s laws and
  `ARCHITECTURAL_INVARIANTS.md`'s `AI-001`. The domain test is
  `docs/workflow/DOMAIN_SEPARATION.md`'s (`PE-005`). Authority: `S5` read through
  `IR7`.
- **D9** — 2026-11-19, the producer is read-only and **writes nothing**: it prints
  a receipt whose every row is either a promoted citation or a finding. `S9`'s ban
  on mechanical promotion is honoured by construction, and the unit's read-only
  case in `scripts/decision-promotion.test.mjs` is the pin.
- **E1** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --base origin/main` · exit 0 · `tier: standard`, `reason: 1 path(s) carry executable content: docs/features/650-decision-promotion/`, `task_size.ceremony: unit-doc`, `signals: []`.
- **D10** — 2026-11-19, `D7`'s plan-time estimate is corrected by the sweep's own
  measurement: the pass found **one** promotable statement, not four. Only 17 of
  the 57 recorded `decision` rows sit inside a block the dispatcher can read (116
  of the 128 ledgers carry no `open-questions@1` marker at all and 4 carry it
  where the parser cannot reach it), so the prose sample — not the row count —
  decided the promotion set, and eleven other statements the sample surfaced were
  `already-owned` or `unit-only` with their owner cited. Authority: the receipt
  quoted in [`backfill-sweep.md`](backfill-sweep.md) (§ Method), which is the
  measurement `D7` was written before.
- **E2** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/650-decision-promotion/SPEC.md` · exit 0 · `verdict PASS`, 13 phase findings clean, fingerprint `2a6638a0…`.
- **E3** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap read docs/ROADMAP.md --nn 650 --json` · exit 0 · revision `8759ef0a…`, status `idea`.
- **E4** — 2026-11-19, `bun scripts/decision-promotion.mjs --root .` · exit 0 · `ledgers | read 128 · no-block 116 · unreadable 4 · decisions 17 · scoped 0 · cross-unit 0 · promoted 0` · `verdict | clean` — the pre-change state the sweep reports (`scoped 0` is the rule shipping after every existing row).
- **E5** — 2026-11-19, `bun scripts/decision-promotion.mjs --root . --json` · exit 0 · the four `unreadable` entries: `644-substrate-gap-alarm`, `82-relay-lane-execution`, `331-authoring-setup` (`malformed-ledger-header`), `84-published-vocabulary-sweep-gate` (`invalid-authority at decisions.md:12`) — the sweep's `B1`–`B4` findings.
- **E6** — 2026-11-19, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 619 188 431 12986` and `docs/workflow/GATE_INVENTORY.md 181 86 95 8165` against the re-based ceilings 681 / 475 / 14,285 and 200 / 8,982.
- **E7** — 2026-11-19, `bun scripts/check-skill-context.mjs --skill unit-lane` and `--skill product-audit` · exit 0 · `unit-lane 5166 est` inside 5,246; `product-audit 3883 est` inside 4,264, with `AUDIT_DIMENSIONS.md` 7,395 est / 325 lines against the re-based 8,135 / 358.
- **E8** — 2026-11-19, `rg -c 'Promoting a decision' template/docs/architecture/ARCHITECTURE.md` · exit 0 · `1`; `rg -c 'unit-only|cross-unit' template/docs/architecture/ARCHITECTURE.md` · `3` — `O10`'s evidence.
- **E9** — 2026-11-19, `rg -c 'decision-scope@1' skills/unit-lane/references/DESIGN.md` · exit 0 · `2` (the block marker and the checklist row); `rg -c 'ARCHITECTURE.md' skills/unit-lane/references/DESIGN.md` · `2` — the procedure is one hop from the capture guidance.
- **E10** — 2026-11-19, `rg -c 'Decision promotion' skills/product-audit/references/AUDIT_DIMENSIONS.md` · exit 0 · `2` (the applicability row and the pass-only-if heading); `rg -c 'decision-promotion@1' …` · `2`.
- **E11** — 2026-11-19, `rg -c 'Decision records' template/AGENTS.md` · exit 0 · `1`; `rg -c 'cross-unit' template/AGENTS.md` · `2` — the scaffold's ledger contract carries the cell.
- **E12** — 2026-11-19, `bun scripts/residual-classify.mjs --inventory --base origin/main` · exit 0 · every added surface carries its consumer in this change; the two scripts, the fixture generator, the const and the three prose blocks are each consumed by the suite, the dimension or the reader, so nothing lands `orphan` (`## Retirements`).
- **E13** — 2026-11-19, `rg -c '^justification \| ' docs/features/650-decision-promotion/decisions.md` · exit 0 · `5` — one path-protection record per protected path this unit touches (`O3`), including the two suite pins a frozen inventory update requires.
- **E14** — 2026-11-19, `rg -c '^\| B[0-9]+ \|' docs/features/650-decision-promotion/backfill-sweep.md` · exit 0 · `12` — the sweep's findings table, twelve rows with a disposition each (`O16`).
- **E15** — 2026-11-19, `git diff --stat origin/main -- skills/resolve-repository-state/` · exit 0 · no output (`S9`'s boundary; `O17`).
- **E16** — 2026-11-19, `rg -c '^- \*\*D[0-9]' docs/features/650-decision-promotion/SPEC.md` · exit 0 · `10` — `D1`–`D10`, the issue's four open questions among them (`O19`).
- **E17** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal write --kind narrative` then `journal aggregate` · exit 0 · `appended 1 · removed 1 · fragments 1` — the session entry, and only that entry (the 123 pre-existing pending fragments this worktree's carrier held were left untouched; the first aggregation attempt consumed them and was reverted byte-for-byte, `docs/LOGS.md` +7 lines only).
- **E18** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap docs/ROADMAP.md rowUpsert <json> --expect 8759ef0a…` · exit 0 · `Receipt: pass`, `Before: 8759ef0a · After: 2b0301bf`, status `idea → in-progress` through the writer, never a hand edit.
- **G1** — 2026-11-19, `bun test scripts/decision-promotion.test.mjs` · exit 0 · 14 pass / 0 fail — the receipt contract, the three finding classes, the legacy row, the lookalike tail, the named-unreadable ledger, the calibration pair, read-only + determinism, the CLI's two exits, and the prose the dimension ships.
- **G2** — 2026-11-19, `bun test scripts/needs-input.test.mjs` · exit 0 · 47 pass / 0 fail — the five additive scope cases plus every pre-existing ledger case.
- **G3** — 2026-11-19, `bun test scripts/normative-drift.test.mjs` · exit 0 · 22 pass / 0 fail — the three new rows resolve; the drafted `restates:` row is absent by design (`D3`).
- **G4** — 2026-11-19, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · 22 pass / 0 fail — the `decision-promotion-sweep` row's carrier and token resolve, and the claimed surface ids match.
- **G5** — 2026-11-19, `bun test scripts/vocabulary-parity.test.mjs` · exit 0 · 35 pass / 0 fail — the new const has one owner.
- **G6** — 2026-11-19, `bun test packages/agentic-workflow/test/runner.sensors.test.mjs` · exit 0 · 9 pass / 0 fail — the sensor's printed block is unchanged by a scoped row.
- **G7** — 2026-11-19, `bun test packages/agentic-workflow-schema/test/index.test.mjs` · exit 0 · 19 pass / 0 fail — `DECISION_SCOPES` is published from the package root and frozen.
- **G8** — 2026-11-19, `cd packages/agentic-workflow && bun test` · exit 0 · 1,324 pass / 0 fail across 72 files.
- **G9** — 2026-11-19, `cd packages/agentic-workflow-schema && bun test` · exit 0 · 915 pass / 0 fail across 52 files.
- **G10** — 2026-11-19, `bun test scripts/check-skill-context.test.mjs`, `scripts/scaffold-parity.test.mjs`, `scripts/residue-dimensions.test.mjs` · exit 0 · 1 / 17 / 30 pass / 0 fail.
- **P14** — 2026-11-19, the branch pushed (the pre-push hook ran the offline gate: `local-gate: PASS — 17 step(s) in 603s`) and the PR opened as [#657](https://github.com/gtrabanco/agentic-workflow/pull/657); the roadmap row settled `done · [#657]` through `roadmap rowUpsert --expect` (revision `ee685ba8 → cb9f79a1`), never a hand edit.
- **E20** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/features/650-decision-promotion/SPEC.md` · exit 0 · `verdict: PASS`, 0 violations, with the row carrying this unit's PR link.
- **E19** — 2026-11-19, `rg -c 'decision-scope@1' skills/unit-lane/references/DESIGN.md` · exit 0 · `2` — the block marker **and** the checklist row that names it. `AC-S2`'s and `O11`'s planned cell said `1`, written from the block alone and never run; the anchor is re-pointed to the observed count, the prose is untouched (`D11`).
- **D11** — 2026-11-19, `AC-S2`'s (and `O11`'s, which mirrors it) `matches 1` was written from intent — the grammar block alone — and the real surface carries a second occurrence, the design checklist's own row that binds the cell. Re-pointing the anchor to `matches 2` is the repair: the prose is the authority and the count follows the run. Authority: `S4`/`S5` over the checklist's own duty, read with the rule that an anchor never run is the defect.
- **G14** — 2026-11-19, HEAD 448689e72 — `bun scripts/local-gate.mjs --skip-network --jobs 2` · exit 0 · `local-gate: PASS — 15 step(s) in 687s`, the crate suites 1,324 pass / 0 fail, the schema 915, the root suite 130 PASS, and `log-immutability` PASS with 0 violations over the 6-commit range (the journal change is the committed fragment, never a hand append to `docs/LOGS.md`).
- **G13** — 2026-11-19, `bun scripts/run-root-suite.mjs` · exit 0 · 130 suites PASS, no FAIL line — the pre-change failures this batch first met are folded: the frozen dimension set (`Decision promotion` appended last, `deepEqual` kept), the ownership map's eight sanctioned (script, ledger) pairs, the budget narration's `ceil(7395 x 1.10) = 8135` formulas, and the scaffold's 22 charter slots (the promotion pointer is a continuation line, so the slot's `- **Key:** `<...>`` shape is untouched).
- **G11** — 2026-11-19, `bun scripts/docs-generate.mjs` then `--check` · exit 0 · `Files: 2 written · 0 deleted · 1 unchanged`, `Roadmap: updated`, then `3 checked · 0 missing · 0 stale · 0 orphaned` — the projection regenerated, never hand-written.
- **P2** — 2026-11-19, the producer's suite lands alone and is observed red on the missing module · `94ffe5310`.
- **P3** — 2026-11-19, `DECISION_SCOPES` published, the package-root export pinned, the crate's sensor case lands red then green · `baac8db31`.
- **P4** — 2026-11-19, the ledger reader reads the trailing scope cell without refusing a historical ledger (eight existing rows carry nine cells) · `baac8db31`.
- **P5** — 2026-11-19, `scripts/decision-promotion.mjs` implemented: the receipt, the three finding codes, the named unreadable ledgers, the charter slot's decision home, and the read-only guarantee · `4f34fdb10`.
- **P6** — 2026-11-19, the seeded/clean fixture generator lands and the calibration case goes green · `4f34fdb10`.
- **P7** — 2026-11-19, the procedure documented in the scaffold's architecture doc: the owner-doc map, the precedence, the link-never-copy consequence.
- **P8** — 2026-11-19, the capture-time guidance: the `decision-scope@1` block, the scope cell on the row, the promotion pointer, the checklist row and the forbidden line.
- **P9** — 2026-11-19, the detection dimension: the applicability row, the pass-only-if section, the `decision-promotion@1` grammar and the two routes.
- **P10** — 2026-11-19, the scaffold carries the contract: the `decision` row's scope cell, the ledger rule list's new bullet, and the charter slot naming the procedure.
- **P11** — 2026-11-19, the grammar and the gate registered: three `normative-surfaces@1` rows, the guide's promotion law, the inventory row with its claimed surfaces, and the ceiling re-pins measured rather than guessed.
- **G12** — 2026-11-19, `bun scripts/dimension-regression.mjs --base origin/main` · exit 0 · after this line: `19 dimensions` at the head against 18 at the base, `changed review surfaces 1`, no `dimension-dropped` finding, this document the evidence carrier. The dimension change is `Decision promotion` appended to the applicability table, and `scripts/dimension-regression.test.mjs`'s frozen set carries the same last row.
- **P12** — 2026-11-19, the backfill sweep ran over its declared sample; `B5` promoted into `DESIGN.md` + `template/AGENTS.md`, `B1`–`B4` persisted as findings, and `D10` corrected the plan-time estimate.

- **P1** — 2026-11-19, plan frozen: this document with the `S8` re-analysis,
  `planning-evidence.md` (18 rows), `planning-obligations.md` (20 rows),
  `decisions.md` (three path-protection records) and the sweep carrier.
  `phase-lint` PASS 13/13 · `E2` records it.
- **D12** — 2026-11-19, the drafted `rendered-facts@1` `restates:` row is
  **superseded**: `decision-scope@1` publishes columns `scope | what it orders`,
  no `type` column, and `normative-drift`'s restates claim recomputes a block's
  declared `type` column against the const (`PE-011`), so the row can never pass
  the gate. The two-way block↔const pin therefore lives in
  `scripts/decision-promotion.test.mjs` (the declared set vs `DECISION_SCOPES`,
  both directions), and the Impact, Future-cost, Applicable-tests, `P11` and
  `O14` claims now say so. This supersedes `D3`'s registration clause; `G3`'s
  citation of `D3` for the absence was wrong-footed — `D3` as written mandated
  the row, and this line is its authority. Authority: external verify 2026-11-19
  (blocker 3), re-derived against `scripts/normative-drift.test.mjs` and the
  block's own columns.
- **D13** — 2026-11-19, the receipt's unrun anchors are re-pointed as one
  correction batch: `O7`'s `rg … matches 0` never ran (the untouched
  `TURN_CONTRACT.md` has four pre-existing `scope` words) → the empty-diff
  conjunct its own evidence already named; `O20`'s declared `docs-language.test.mjs`
  target never existed in git history (`PE-020`) → the inventory's real carrier
  `scripts/doc-discipline.test.mjs`; `AC-S4`'s `needs-input docs/fix/384 --json`
  exits 1 at base and head alike (records-first prose ledger) → re-pointed to
  the 650 unit's own ledger plus the sensor suite, criterion cell untouched,
  `ac-hash` re-stamped with the `sectionText` recipe; the `## Retirements`
  claim is qualified with the classifier's done-unit semantics (`PE-019`,
  `E22`); the plan stage's example gains the scope cell (`O21`). The
  correction task is **P15** — this Log's existing `P14` line already denotes
  the push, and phase-lint accepts the gap (fixture-proven in `mktemp` scratch).
  Authority: §9 of the local-apply instruction (one batch over the receipt's
  blockers).
- **E21** — 2026-11-19, the frozen-failure corpus observed RED before the batch,
  each then repaired: `rg -c 'docs-language.test.mjs' …/planning-obligations.md`
  · 1 → no match after; `rg -c 'scope' skills/orchestration-envelope/references/TURN_CONTRACT.md`
  · 4 against the declared 0 (base-side: file untouched, the count pre-exists);
  `rg -c 'D12' SPEC.md` · exit 1 → ≥ 1 after (6 at the final bytes: the D12 row,
  the four claims it corrects, and this line); the old AC-S4 target path in this
  document (the `docs/fix/384…` anchor) · 1 → no match after the AC edit;
  `rg -c '<scope>$' skills/unit-lane/references/PLAN.md`
  · exit 1 → `1` after; `rg -c 'no-plan-claim' SPEC.md` · exit 1 → ≥ 1 after
  (4 once this Log quotes the token).
- **E22** — 2026-11-19, `bun scripts/residual-classify.mjs --inventory --base origin/main`
  · exit 0 · `scripts/decision-promotion.test.mjs` classifies
  `orphan / no-plan-claim` while the roadmap row is terminal (`PE-019`); the
  `## Retirements` qualification now states this beside the command it names,
  and `E12`'s open-state receipt stands as recorded.
- **E23** — 2026-11-19, AC-S4's re-pointed checks in the foreground:
  `needs-input docs/features/650-decision-promotion --json` · exit 0 ·
  `decision: none`; `bun test packages/agentic-workflow/test/runner.sensors.test.mjs`
  · exit 0 · 9 pass; `bun test scripts/decision-promotion.test.mjs` · exit 0 ·
  14 pass; the phantom path no longer appears in this document (`rg` exit 1).
- **E24** — 2026-11-19, the re-pointed obligation validators in the foreground:
  O7 `git diff --stat origin/main -- skills/orchestration-envelope/` · no
  output · 0 lines; O21 `rg -c '<scope>$' …PLAN.md` · `1`; O22
  `rg -c 'no-plan-claim' …SPEC.md` · ≥ 1 (1 before this Log quoted the token,
  4 after); O23's phantom-path count · no match (exit 1), and its positive
  command · exit 0 (`E23`).
- **E25** — 2026-11-19, `ac-hash` re-stamped after the AC edit with the
  `sectionText` recipe: the recipe reproduced the frozen `3f08f332…` on the
  pre-edit bytes and now records
  `49001af7393d29fc6cd4e307832758a17737ddce28b42b0defd3ab1b854d020b`;
  `phase-lint` · exit 0 · `verdict PASS`, 14 phases 6/6 (P15
  `correction-batch-external-verify-2026-11-19`), fingerprint
  `a4169f197e3cebe8b18cdbd3850647c7bf96b306e3d5d071600ca6e87c1f2de6`.
- **G15** — 2026-11-19, HEAD 0a28f2e3daacc78e4dacbc16922e7a5bc06769a9 — `bun test scripts/doc-discipline.test.mjs` and
  `bun test scripts/residue-dimensions.test.mjs` · exit 0 · 21 / 30 pass —
  `O20`'s re-pointed evidence.
- **G16** — 2026-11-19, HEAD 0a28f2e3daacc78e4dacbc16922e7a5bc06769a9 — the touched gates re-run after the batch: `normative-drift`
  22 pass, `decision-promotion` 14 pass, `golden-fixture` 15 pass (executor-path
  wording change), `check-skill-context --skill unit-lane` PASS (5166/377
  inside 5246/403; the reference ceiling binds DESIGN, not PLAN, so it does not
  move), `docs-generate --check` PASS, and the producer's stdout over `--root .`
  is byte-identical to its pre-edit capture (comment-only change: `0a28f2e3d`
  vs worktree).
- **G17** — 2026-11-19, HEAD 0a28f2e3daacc78e4dacbc16922e7a5bc06769a9 — `bun scripts/run-root-suite.mjs` · exit 0 · 130 suites
  PASS, 0 FAIL, and `bun scripts/local-gate.mjs --skip-network --jobs 2` ·
  exit 0 · `local-gate: PASS — 15 step(s) in 600s` — the S2 battery after the
  correction batch found nothing else broken.

## Next

P2 — land the frozen-failure corpus red (`scripts/decision-promotion.test.mjs`)
before any implementation, then P3 … P9 in order.

## References

- Issue [#650](https://github.com/gtrabanco/agentic-workflow/issues/650) — the request this unit adopts (`Closes #650`).
- Issue [#651](https://github.com/gtrabanco/agentic-workflow/issues/651) — the companion doc-retention unit (`Related`, soft order; no blocker either way).
- PR [#657](https://github.com/gtrabanco/agentic-workflow/pull/657) — this unit's delivery, branch `feat/650-decision-promotion`.
- [`docs/architecture/ARCHITECTURE.md`](../../architecture/ARCHITECTURE.md) · [`docs/architecture/ARCHITECTURAL_INVARIANTS.md`](../../architecture/ARCHITECTURAL_INVARIANTS.md) — the two owner docs the rule names.
- [`skills/unit-lane/references/DESIGN.md`](../../../skills/unit-lane/references/DESIGN.md) — the decision row's grammar owner.
- [`skills/product-audit/references/AUDIT_DIMENSIONS.md`](../../../skills/product-audit/references/AUDIT_DIMENSIONS.md) — the detection dimension.
- [`skills/pre-execution-review/references/LEDGERS.md`](../../../skills/pre-execution-review/references/LEDGERS.md) — the ledger row shapes this unit's planning ledgers follow.
