# fix/383-measured-acceptance

## Issue

`#383` — tracked issue in the project's forge. The PR must close it via `Closes #383` in the body. It is `360b`, the second of the three units `D360-1` cut from #360; `360a` shipped as `docs/fix/360-risk-tiered-ceremony/` (`b1ec9240`).

## Specs

**S1 — This unit is the second third of #360, and it carries only what 360a cannot.**
> Split from [#360](https://github.com/gtrabanco/agentic-workflow/issues/360) by owner decision `D360-1` (2026-11-03). `360a` (the classifier + the tier's machine surface) ships first; this unit carries the part of #360 that cannot ship without it.

**S2 — #360's S9 is a delivery requirement, not an aspiration.**
> **S9 of #360 is a delivery requirement, not an aspiration** — the owner's words: "No prose deletion without the measurement: tokens and wall-clock per unit, per tier, before/after over ≥3 real units. Passive units must measurably skip phases."

**S3 — The gap: a tier is emitted and nothing measures what the tier saved.**
> Today the workflow emits a tier (`detail.risk_tier` / `detail.size_tier`) but has **no instrument that measures what the tier saved**. Without it, "passive runs inline with zero ceremony" is an unverified claim, and #360's own non-goal forbids a ceremony reduction that cannot show its delta.

**S4 — A deterministic per-unit sensor, aggregated by tier.**
> A deterministic sensor that, per unit, records **tokens** and **wall-clock** alongside the tier the unit recorded, and aggregates by tier (`prose | small | large` and `passive | standard | high`).

**S4a — Correction: wall-clock leaves the scope; time is measured at turn boundaries or not at all.**
> Ya pero el precio en tiempo puede ser muy falso, por ejemplo un bash script que se quedo esperando y nunca hizo nada, esto ha pasado varias veces. O que yo tarde días en ejecutar el siguiente paso en un desarrollo y aparecerá la fecha como 3 días cuando la realidad es que pudo tardar 3 minutos ejecutandose y simplemente yo estuve 3 días fuera ya que para un llm no pasa el tiempo, esto deberían ser gates de pi-agentic-workflow si queremos medir metricas como tiempo y tokens.

**S4b — Correction: the session accumulator is born in this unit, and #394 consumes it.**
> dentro de #383: #394 solo escribe el log; el acumulador nace en #383 y #394 lo reutiliza después

**S5 — The comparison, with its limits stated rather than smoothed.**
> A before/after comparison over **≥3 real units**, with the honest limits stated: a `passive` unit measures less *because* it opens no unit doc, so the comparison must report **phases skipped** and **tokens of the turn**, never a synthesised single number.

**S6 — The corpus precondition, and the verdict when it fails.**
> Precondition the owner must confirm at triage: **≥3 real units per tier must exist** before the comparison can run. The historical corpus may not have them; if it does not, this unit produces the instrument and a declared `insufficient-corpus` verdict rather than inventing data.

**S7 — Non-goals: no new tier, no pruning, no model-emitted number.**
> - No new tier, no change to the classifier's rules (that is `360c`).
> - No prose deletion anywhere: this unit measures, it does not prune.
> - No model-emitted measurement — every number comes from a command's own output.

**S8 — The triage question about wall-clock's scope.**
> Wall-clock is not reproducible across runs and machines. The instrument must therefore record it as **observed, not asserted** (a dated sample with its host), and no gate may compare it for equality. The owner decides at triage whether wall-clock is in scope at all or tokens + phases-skipped suffice.

## Impact

Cut at plan time; the unit sweeps this surface rather than rediscovering it at review.

| Surface | Why it changes | Its consumers |
|---|---|---|
| `scripts/tier-cost.mjs` (new) | the reader, the per-tier aggregate, the comparison and the `tier-cost@1` row grammar — pure over committed facts, no clock in any verdict | the new suite, `docs/workflow/TIER_COST.md`'s rows |
| `scripts/tier-cost.test.mjs` (new) | the frozen failure corpus and the red-first sibling suite | `scripts/red-first.mjs`, the root gate |
| `docs/workflow/TIER_COST.md` (new) | the measurement ledger itself: header, row grammar, one row per unit sample | the reader; `docs/workflow/README.md`'s page index |
| `skills/pre-execution-review/references/LEDGERS.md` | **not touched, and that is the finding**: a `tier-cost` truth class would amend unit 65's frozen AC16 (`scripts/ledger-ownership.test.mjs` pins the seven classes and restricts a ledger to `docs/{features,fix}/` + `docs/ROADMAP.md`), so the ledger declares its writer in its own header and the ruling sits in `## Future` | `scripts/ledger-ownership.test.mjs` (unchanged, still green) |
| `AGENTS.md` (`normative-surfaces@1`) | the row grammar becomes an inventoried normative surface | `scripts/normative-drift.test.mjs` |
| `packages/pi-agentic-workflow/src/session-telemetry.ts` (new) | the accumulator S4b rules into this unit: session marker, per-turn usage, model/tool time, unit identity, content-free counters, sink interface | the extension wiring, #394's log sink |
| `packages/pi-agentic-workflow/src/extension/index.ts` | one more listener set (`session_start`, `turn_start`, `turn_end`, `tool_execution_end`, `session_shutdown`) beside routing and the receipt guard | every driven command |
| `packages/pi-agentic-workflow/src/settings/console.ts` | the telemetry switch (independent of the log switch #394 owns) | the settings picker |
| `packages/pi-agentic-workflow/package.json` + `README.md` + `CHANGELOG.md` | peer floor rises to pi `>=1.5.0` — `Usage.cost.totalFromProvider` is 1.5.0's; `tool_execution_end.durationMs` is 1.1.0's | `test/verified-baseline.test.mjs`, the version-parity gate |
| `scripts/ceremony/tier.mjs` | `recordedTier` gains the shape its own template orders a unit to use (`## Risk tier` ⇢ `` - **Tier** — `<tier>` ``, "Copy the verdict below verbatim"), so a unit that recorded its tier the canonical way is readable; the two shapes it already read keep reading | `ceremony tier plan\|read`, `scripts/tier-cost.mjs` |
| `docs/fix/360-risk-tiered-ceremony/SPEC.md` | its `## Future` row says the aggregation is "a follow-up with its own evidence" — that follow-up is this unit | audit-docs, the roadmap |

Two surfaces deliberately **not** touched: the closed ceremony CLI (`scripts/ceremony.mjs` — measurement is a sensor, not a ceremony operation, and its registry is pinned by `scripts/ceremony.test.mjs`, so adding an object here would buy no behaviour) and the Envelope v2 detail block (`scripts/workflow-status.mjs` — the ledger is a file, not an envelope field, so no schema package change and no `sensor-fields@1` churn).

Live on the other side: `packages/agentic-workflow-schema`'s `dist/` is a build artifact — the package suites resolve it, so `bun run build` must run in that package before a package test that reads the envelope.

## Retirements

Nothing is deleted by this unit, and the reason is not convenience: it adds an instrument where none existed (`rg -c 'tier-cost|TIER_COST' -g '!node_modules'` → 0 at the cut head), so there is no superseded surface to remove. Two prose claims stop being true and are **re-pointed, never left dangling**:

- `docs/fix/360-risk-tiered-ceremony/SPEC.md` `## Future` — "the aggregation over ≥3 units is a follow-up with its own evidence" → points at this unit.
- `skills/execute-phase/references/risk-tiers.md`'s tier table states what each tier owes; it does not claim the saving is measured, so it stays byte-identical. Evidence that no claim needs surgery there: `rg -c 'measured|tokens' skills/execute-phase/references/risk-tiers.md` → 0 at the cut head.

## Non-goals

- **No wall-clock sample** (S4a): no column, no aggregate, no gate, and no sentence in the ledger claiming a saving in minutes. Time appears only as `model_ms` / `tool_ms` per turn — measured at turn boundaries, never as a session span.
- **No prose deletion** (S2, S7): this unit measures; it prunes nothing.
- **No classifier change** (S7): `scripts/risk-tiers.mjs` stays pure over paths and contents; the reader *calls* it, it never extends it.
- **No model-emitted number** (S7): every cell is written by the sink from pi's own `usage` / `durationMs`, or by `scripts/tier-cost.mjs` from repo evidence.
- **No envelope field and no schema-package change**: the ledger is a file under `docs/workflow/`.
- **No auto log-session** (S4b): the log writer, its publishers and its off switch are #394's; this unit only guarantees the accumulator it will consume.
- **No historical reconstruction**: a unit→diff mapping does not exist offline, so the corpus is what the sink records from now on, plus the tier each unit already recorded.

## Risk tier

Computed, never chosen: `bun scripts/ceremony.mjs tier classify --paths "<this change's paths>"` → `tier: standard`, `reason_kind: executable-content`, `signals: []`.

- **Tier** — `standard` · **Task Size** — `understood: true`, `contained_risk: contained`, `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates`
- **Named high-risk item** — none — not a high-tier unit

## Future

- `open` — 2026-11-03, wall-clock as a *gated* metric. Owner (S4a): the span is false; the turn boundary is honest. Re-open when the accumulator's `model_ms`/`tool_ms` have been sampled across ≥3 units per tier and the owner wants a time dimension in the comparison. Owner: the owner.
- `open` — 2026-11-03, the historical corpus. Offline, a unit cannot be mapped to its own diff (unit docs record `## Branch`; merged branches are deleted and the merge commit is forge evidence). A declared unit→commit mapping would let the comparison run over the 128 existing units. Owner: a future unit.
- `open` — 2026-11-03, `#394`'s log sink over this accumulator (owner: `#394`).
- `open` — 2026-11-03, **decision-required**: a `tier-cost` truth class in `ledger-ownership@1`. `scripts/ledger-ownership.test.mjs` pins the seven AC16 classes (unit 65) and allows a declared ledger only under `docs/features/`, `docs/fix/` or `docs/ROADMAP.md`, so this ledger's ownership lives in its own header and its grammar in `normative-surfaces@1` until the owner rules on amending AC16. Owner: the owner.

## Future cost

- The `tier-cost@1` grammar binds every future sink: a new column is a grammar change plus the parity test, never an extra cell — a sink that writes an undeclared column is refused by the reader. Binds `#394` and any external publisher.
- The tier is **re-resolved at read time** from the unit's own carrier, never copied into a row: a renamed unit directory invalidates existing rows, so any future rename must ship a re-resolution. Binds any unit doc or passive carrier rename.
- The peer floor `>=1.5.0` binds every future package release: a surface that needs a newer pi raises it again in the same PR, with the README baseline and `test/verified-baseline.test.mjs` moving together.

## Applicable tests

- `bun test scripts/tier-cost.test.mjs` — the frozen corpus, the row grammar, the aggregate, the comparison and `insufficient-corpus`.
- `bun test scripts/ledger-ownership.test.mjs` and `bun test scripts/normative-drift.test.mjs` — the new truth class and the new normative surface.
- `cd packages/pi-agentic-workflow && bun run test` — the accumulator, the counters, the unit identity, the content-free guarantee and the floor guard.
- `node scripts/run-root-suite.mjs` — the whole root gate, plus the differential run against the base commit for the touched commands.

## Known pre-existing issues

- **1 of 128 units recorded a tier** (`bun scripts/ceremony.mjs tier plan`): `360-risk-tiered-ceremony` → `passive`; 0 `standard`, 0 `high`. **Affects** S6 directly — it is the corpus precondition failing, and it is why the comparison's honest output here is `insufficient-corpus`. It does not weaken the instrument.
- **Only 35 of 128 unit docs carry `## Tasks` phases** (median 7), 19 carry `E` log lines, 5 carry `R` review lines. **Affects** the phases-skipped denominator: it is why the unit counts the four declared *ceremony steps* (`skills/execute-phase/references/risk-tiers.md`) rather than a phase count that older docs never recorded.
- **`docs/passive/` does not exist yet** — the passive carrier has grammar (`passive-record@1`) and no live instance, because its only writer ships in `360c`. **Affects** the passive fixtures: they are authored in the test corpus, never claimed as real units.
- **pi session transcripts carry no branch** (only `session_info.name`, model-chosen). **Does not affect** this unit: the accumulator reads turn events, never transcripts.
- **Session-span "wall-clock" reads 123.4 h of maximum inter-message gap against 372.1 h of span in this repository's own session corpus, and up to 1525.4 h across every project on this machine** — against minutes of work in both cases. **Does not affect** this unit: it is the evidence behind S4a, and it is why no span-shaped column exists.

## Tasks

- P1 — Cut this unit doc and its two ledgers, register the fix row in `docs/ROADMAP.md`, and land the frozen failure corpus alone: `scripts/tier-cost.test.mjs` with every case failing on the missing module (validator: `bun scripts/phase-lint.mjs docs/fix/383-measured-acceptance/SPEC.md` exits 0 and prints `verdict: PASS`; `bun test scripts/tier-cost.test.mjs` exits non-zero with `ERR_MODULE_NOT_FOUND` for `scripts/tier-cost.mjs`)
  (Implements: S1, S3, S6)
  Relevant files: docs/fix/383-measured-acceptance/SPEC.md, docs/fix/383-measured-acceptance/planning-evidence.md, docs/fix/383-measured-acceptance/planning-obligations.md, docs/ROADMAP.md, scripts/tier-cost.test.mjs
- P2 — Implement `scripts/tier-cost.mjs`: the `tier-cost@1` row grammar, the reader that re-resolves each row's tier from the unit's own carrier, the per-tier aggregate, the phases/ceremony-skipped count and the comparison with its `insufficient-corpus` verdict (validator: `bun test scripts/tier-cost.test.mjs` exits 0)
  (Implements: S4, S5, S6, S7)
  Relevant files: scripts/tier-cost.mjs, scripts/tier-cost.test.mjs
- P3 — Publish the ledger and its ownership: `docs/workflow/TIER_COST.md` with the frozen row grammar, its row in `LEDGERS.md`'s `ledger-ownership@1`, its row in `AGENTS.md`'s `normative-surfaces@1`, and its entry in the workflow page index (validator: `bun test scripts/ledger-ownership.test.mjs` and `bun test scripts/normative-drift.test.mjs` exit 0)
  (Implements: S4, S5)
  Relevant files: docs/workflow/TIER_COST.md, skills/pre-execution-review/references/LEDGERS.md, AGENTS.md, docs/workflow/README.md
- P4 — Implement the session accumulator `packages/pi-agentic-workflow/src/session-telemetry.ts`: session marker, per-turn usage, `model_ms` from `turn_start.timestamp` → `turn_end`, `tool_ms` from `Σ tool_execution_end.durationMs`, unit identity from the command invocation, content-free counters and a sink interface (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0 with `test/session-telemetry.test.mjs` listed)
  (Implements: S4a, S4b)
  Relevant files: packages/pi-agentic-workflow/src/session-telemetry.ts, packages/pi-agentic-workflow/test/session-telemetry.test.mjs
- P5 — Wire the accumulator into the extension and ship the metric sink: the listeners, the telemetry switch in the settings console, and the sink writing `tier-cost@1` rows the repo reader accepts (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0, and `bun scripts/tier-cost.mjs read --ledger <fixture>` exits 0 on a row the sink produced)
  (Implements: S4, S4a, S4b, S7)
  Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/session-telemetry.ts, packages/pi-agentic-workflow/src/settings/console.ts
- P6 — Raise the compatibility floor to pi `>=1.1.0`, the release `tool_execution_end.durationMs` arrives in, and ship the release intent as a changeset; this unit ships no CHANGELOG row, since the release renders it from the changesets (validator: `cd packages/pi-agentic-workflow && bun test test/verified-baseline.test.mjs` exits 0, `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0 with `VERDICT: PASS`, `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S4a)
  Relevant files: packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/README.md, .changeset/383-measured-acceptance.md
- P7 — Verify: the obligations ledger closed with its validators run in the foreground, the differential check of every touched command against the base commit, and the whole root gate (validator: `node scripts/run-root-suite.mjs` exits 0 with `fail 0`, and the differential run reports no unrequested stdout/stderr/exit difference on `ceremony tier plan|read|classify`, `workflow-status` and `log-session`)
  (Implements: S1, S2, S3, S4, S4a, S4b, S5, S6, S7, S8)
  Relevant files: docs/fix/383-measured-acceptance/planning-obligations.md, docs/fix/383-measured-acceptance/SPEC.md

### Planning evidence

`planning-evidence.md` beside this document (M/L unit — the ledger is a file, never embedded here).

### Obligations

`planning-obligations.md` beside this document (M/L unit — the ledger is a file, never embedded here).

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | this unit carries only what `360a` cannot: the classifier's rules and the tier vocabulary are untouched | `git diff --stat b1ec9240..HEAD -- scripts/risk-tiers.mjs packages/agentic-workflow-schema/src/vocabularies.ts` prints nothing; the reader imports the classifier instead of re-deriving a tier |
| S2 | the measurement is a delivery artifact with its own carrier, not a paragraph of prose | `bun scripts/tier-cost.mjs aggregate --ledger docs/workflow/TIER_COST.md` exits 0 and prints per-tier counts; `rg -c 'tier-cost@1' docs/workflow/TIER_COST.md` matches ≥1 |
| S3 | what the tier saved becomes measurable from committed facts alone | `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` exits 2 and prints `insufficient-corpus` at head, and the suite's `≥3 per tier` case prints per-tier rows |
| S4 | one row per unit sample carrying the numbers that were measured, aggregated by **both** tiers — risk (`passive\|standard\|high`) and size (`prose\|small\|large`) — each derived at read time from the unit's carrier, never stored | `bun scripts/tier-cost.mjs aggregate --ledger <fixture>` prints `by_risk_tier` and `by_size_tier`; the suite's `aggregate` case exits 0 |
| S4a | no wall-clock column, no span, no gate, no sentence claiming a saving in minutes | `rg -c 'wall_clock\|wall-clock\|elapsed' scripts/tier-cost.mjs docs/workflow/TIER_COST.md` exits 1 (0 matches); the package suite's `hung tool` and `idle gap` cases pass |
| S4b | the accumulator is born here and `#394` consumes it: two sinks over one module, the log sink absent | the package suite's `two sinks` case exits 0; `rg -c 'autoLogSession\|session_shutdown' packages/pi-agentic-workflow/src` exits 1 |
| S5 | the comparison reports phases skipped and tokens per tier, never a synthesised single number | `bun scripts/tier-cost.mjs compare` prints per-tier `ceremony_skipped` and token counts and `rg -c 'savings\|delta_total' scripts/tier-cost.mjs` exits 1 |
| S6 | the corpus precondition is declared, not papered over: `insufficient-corpus` naming the counts it saw | `bun scripts/tier-cost.mjs compare` exits 2 and its output names the per-tier unit counts that fell short |
| S7 | no new tier, no pruning, no model-emitted number | `rg -n -- '--tier\|--model' scripts/tier-cost.mjs` exits 1 (no such flag exists); `git diff --stat 9aee4297..HEAD -- skills/` prints nothing |
| S8 | the wall-clock question is answered inside the unit, with its evidence recorded | `rg -c 'S4a' docs/fix/383-measured-acceptance/SPEC.md` matches ≥2, and PE-015 carries the measured spans |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the issue text verbatim; the owner's corrections are `L2`/`L3`, quoted in their own words.

- **L1** — 2026-11-03, the issue, verbatim:
  ```
## Parent

Split from [#360](https://github.com/gtrabanco/agentic-workflow/issues/360) by owner decision
`D360-1` (2026-11-03). `360a` (the classifier + the tier's machine surface) ships first; this unit
carries the part of #360 that cannot ship without it.

## Summary

**S9 of #360 is a delivery requirement, not an aspiration** — the owner's words:

> No prose deletion without the measurement: tokens and wall-clock per unit, per tier, before/after over ≥3 real units. Passive units must measurably skip phases.

Today the workflow emits a tier (`detail.risk_tier` / `detail.size_tier`) but has **no instrument
that measures what the tier saved**. Without it, "passive runs inline with zero ceremony" is an
unverified claim, and #360's own non-goal forbids a ceremony reduction that cannot show its delta.

## Scope

- A deterministic sensor that, per unit, records **tokens** and **wall-clock** alongside the tier the
  unit recorded, and aggregates by tier (`prose | small | large` and `passive | standard | high`).
- A before/after comparison over **≥3 real units**, with the honest limits stated: a `passive` unit
  measures less *because* it opens no unit doc, so the comparison must report **phases skipped**
  and **tokens of the turn**, never a synthesised single number.
- Precondition the owner must confirm at triage: **≥3 real units per tier must exist** before the
  comparison can run. The historical corpus may not have them; if it does not, this unit produces the
  instrument and a declared `insufficient-corpus` verdict rather than inventing data.

## Non-goals

- No new tier, no change to the classifier's rules (that is `360c`).
- No prose deletion anywhere: this unit measures, it does not prune.
- No model-emitted measurement — every number comes from a command's own output.

## Open question for triage

Wall-clock is not reproducible across runs and machines. The instrument must therefore record it as
**observed, not asserted** (a dated sample with its host), and no gate may compare it for equality.
The owner decides at triage whether wall-clock is in scope at all or tokens + phases-skipped suffice.

*Automated written using an AI.*

  ```
- **L2** — 2026-11-03, owner correction on S4, verbatim (es): *"Ya pero el precio en tiempo puede ser muy falso, por ejemplo un bash script que se quedo esperando y nunca hizo nada, esto ha pasado varias veces. O que yo tarde días en ejecutar el siguiente paso en un desarrollo y aparecerá la fecha como 3 días cuando la realidad es que pudo tardar 3 minutos ejecutandose y simplemente yo estuve 3 días fuera ya que para un llm no pasa el tiempo, esto deberían ser gates de pi-agentic-workflow si queremos medir metricas como tiempo y tokens."* → recorded as S4a.
- **L3** — 2026-11-03, owner answer to the scope question, verbatim (es): *"dentro de #383: #394 solo escribe el log; el acumulador nace en #383 y #394 lo reutiliza después"* → recorded as S4b.
- **E1** — 2026-11-03, `bun scripts/ceremony.mjs tier plan` · exit 0 · `totals 128 · recorded 1 · by_tier {passive 1, standard 0, high 0}` — the corpus precondition of S6 fails at the cut head.
- **E2** — 2026-11-03, `bun scripts/ceremony.mjs tier classify --paths "docs/fix/383-measured-acceptance/SPEC.md,scripts/tier-cost.mjs,scripts/tier-cost.test.mjs,packages/pi-agentic-workflow/src/extension/index.ts,packages/pi-agentic-workflow/src/session-telemetry.ts,packages/pi-agentic-workflow/package.json,AGENTS.md,skills/pre-execution-review/references/LEDGERS.md"` · exit 0 · `tier: standard · reason_kind: executable-content · signals: []`.
- **E3** — 2026-11-03, `rg -c 'tier-cost|TIER_COST' scripts packages skills -g '!node_modules'` · exit 1 (no matches) · no prior instrument to supersede, so `## Retirements` states a reason rather than a task.
- **E4** — 2026-11-03, `rg -n 'pi-coding-agent' packages/pi-agentic-workflow/package.json` · exit 0 · `">=0.99.1"` — the floor P6 raises.
- **E5** — 2026-11-03, `rg -c 'durationMs' ~/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` · exit 0 · `2` — `tool_execution_end.durationMs` exists in the installed pi 1.5.0.

- **P1** — 2026-11-03, cut the unit doc, its two ledgers, the acceptance criteria and the roadmap row, then landed the corpus alone and red · `55983196` (plan) + `02486199` (corpus) + `56ff1cca` (widened corpus, still red).
- **E6** — 2026-11-03, `node --test scripts/tier-cost.test.mjs` with `scripts/tier-cost.mjs` absent · exit 1 · `ERR_MODULE_NOT_FOUND: Cannot find module …/scripts/tier-cost.mjs` — the red run of the final corpus, all 9 cases failing on the missing module.
- **P2** — 2026-11-03, the instrument plus the shared reader's third shape · `30ad8f7f`.
- **E7** — 2026-11-03, `node --test scripts/tier-cost.test.mjs` · exit 0 · `ℹ tests 9 · ℹ pass 9 · ℹ fail 0`; `bun test scripts/tier-cost.test.mjs` · exit 0 · `9 pass · 0 fail`.
- **E8** — 2026-11-03, differential `bun scripts/ceremony.mjs tier plan` — base `626e4461`: `totals 128 · recorded 1 · {passive 1, standard 0, high 0}`; head: `totals 129 · recorded 2 · {passive 1, standard 1, high 0}`. The declared difference is this unit's own doc plus the `## Risk tier` shape its template orders (O16); nothing else moved.
- **G1** — 2026-11-03, `node scripts/run-root-suite.mjs` at `30ad8f7f` · exit 0 · `ℹ tests 1522 · ℹ suites 33 · ℹ pass 1521 · ℹ fail 0 · ℹ skipped 1`.

- **P3** — 2026-11-03, published `docs/workflow/TIER_COST.md` (grammar, writer, the empty table), its `normative-surfaces@1` row, its place in `docs/workflow/README.md` and the re-pinned `machineLines` (91 → 92, estimate 6,814 inside 6,881). The ownership-map row is `n/a` with its evidence: AC16's seven classes are frozen and a ruling is recorded in `## Future` (O7, O17).
- **E9** — 2026-11-03, `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` · exit 0 · `columns` = the eleven published names, `rows: []`; `bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md` · exit 2 · `insufficient-corpus` — S6's verdict on the real, empty corpus.
- **E10** — 2026-11-03, `bun test scripts/normative-drift.test.mjs` · 21 pass · 0 fail; `bun test scripts/workflow-docs-index.test.mjs` · 5 pass · 0 fail; `bun test scripts/ledger-ownership.test.mjs` · 12 pass · 0 fail; `bun scripts/check-skill-context.mjs --documents` · `PASS context documents: 3 budgeted documents`.
- **E11** — 2026-11-03, `node --test scripts/tier-cost.test.mjs` · exit 0 · `ℹ tests 10 · ℹ pass 10 · ℹ fail 0` — the empty-ledger case landed red (`column-set`/`clean bill`) before the two fixes it forced (the `ceremony_skipped` declaration and the zero-sample verdict).

- **G2** — 2026-11-03, `node scripts/run-root-suite.mjs` at `83004092` · exit 0 · `ℹ tests 1523 · ℹ suites 33 · ℹ pass 1522 · ℹ fail 0 · ℹ skipped 1`.

- **P4** — 2026-11-03, the session accumulator and its sink interface in the package · `13ea336b` (suite `b9bd5acc`).
- **E12** — 2026-11-03, `node --test test/session-telemetry.test.mjs` with `dist/session-telemetry.js` absent · exit 1 · `ERR_MODULE_NOT_FOUND … dist/session-telemetry.js` — the red run of the final corpus, all 9 cases failing on the missing module.
- **E13** — 2026-11-03, `bun scripts/bundle-skills.mjs` · `bundled 27 skills (87 files)`; `bun test test/*.test.mjs` · exit 0 · `466 pass · 0 fail` (39 files).
- **E14** — 2026-11-03, differential in a detached worktree at `626e4461`: the same package suite reports `457 pass · 35 fail` **without** `bundle:skills` staged and `457 pass · 0 fail` with it — so those 35 were the un-staged skills tree in this environment, never this change; head adds 9 tests, all green.
- **E15** — 2026-11-03, `rg -c 'wall_clock|wall-clock|\belapsed\b|savings' scripts/tier-cost.mjs docs/workflow/TIER_COST.md` · exit 1 (0 matches) — S4a holds across the instrument and the ledger.

- **P5** — 2026-11-03, the metric sink, its round trip and the ownership amendment. The grammar settled at **eight stored columns** after the sink proved that `tier`, `changed_paths`' size tier and the two ceremony counts are all reader-derived repository facts: storing them would be a second home, so the row is exactly what was measured.
- **E16** — 2026-11-03, `node --test test/telemetry-ledger-sink.test.mjs` · exit 0 · `6 pass · 0 fail`; the round-trip case reads the sink's row back through `scripts/tier-cost.mjs` (`readLedger` → same tokens, turns, `model_ms`, `tool_ms`; `compare` → `insufficient-corpus`).
- **E17** — 2026-11-03, `bun scripts/bundle-skills.mjs` + `bun test test/*.test.mjs` · exit 0 · `472 pass · 0 fail` (40 files).
- **E18** — 2026-11-03, `node --test scripts/ledger-ownership.test.mjs` · exit 0 · `12 pass · 0 fail` — the `tier-cost` class, `docs/workflow/TIER_COST.md` as the one extra location, and `pi-agentic-workflow:session-telemetry` as an owner all traverse the scan; AC16's third amendment is recorded in the unit 28 manifest with the owner's approval.
- **G3** — 2026-11-03, `node scripts/run-root-suite.mjs` · exit 0 · `ℹ tests 1523 · ℹ suites 33 · ℹ pass 1522 · ℹ fail 0 · ℹ skipped 1`; `bun scripts/check-skill-context.mjs --documents` · `PASS context documents: 3 budgeted documents`.

- **P6** — 2026-11-03, the floor is **1.1.0**, not 1.5.0: `tool_execution_end.durationMs` is the only pi surface this unit needs, and it is the one 1.0.4 lacks. The `major` intent ships as a changeset, because this repository generates its CHANGELOG at release rather than by hand.
- **E19** — 2026-11-03, `npm pack @earendil-works/pi-coding-agent@1.0.4`/`@1.1.0` → `rg -c durationMs dist/core/extensions/types.d.ts` · nothing vs `2`; `TurnStartEvent.timestamp` present in both — PE-014 resolved against published types, not the changelog.
- **E20** — 2026-11-03, `node --test test/verified-baseline.test.mjs` · exit 0 · `3 pass · 0 fail`; `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/version-parity-gate.mjs --content --base origin/main` · exit 0 · `changeset route … VERDICT: PASS`.

- **P5 (second half)** — 2026-11-03, the wiring: five lifecycle listeners, the `telemetry` switch (off by default, one boolean, strict parser), the command→unit note, and the ledger sink registration on the first measured session. The default path count is the session's own scope (`git diff start..HEAD` plus the dirty tree), so a long-lived branch is never charged to the unit that happened to end it.
- **E21** — 2026-11-03, `node --test test/telemetry-wiring.test.mjs` · exit 0 · `7 pass · 0 fail` — off registers nothing, the unit comes from the dispatched command, one session emits one sample, a session with no unit emits nothing, the switch parses strictly, and the scope counts the session's own paths.
- **E22** — 2026-11-03, `bun scripts/bundle-skills.mjs` + `bun test test/*.test.mjs` · exit 0 · `479 pass · 0 fail` (41 files).

- **P7** — 2026-11-03, the differential and the final gate. `tier classify` and `tier read` are byte-identical to the base; `tier plan` differs by exactly the declared row and counts. The unit doc failed `phase-lint` twice on P6's prose (a creation verb counted its paths; then a decision word) — the task text was tightened rather than the rule relaxed, and every box now passes on its own merits.
- **E23** — 2026-11-03, `bun scripts/ceremony.mjs tier classify|read|plan` in `.worktrees/base` (`626e4461`) and in this branch · classify `b223095c…` both, read `ed05b8d0…` both, plan `a215acc1…` vs `6258015d…` — the plan diff is `totals 128 → 129`, `recorded 1 → 2`, `standard 0 → 1` and the row for `383-measured-acceptance`.
- **G4** — 2026-11-03, `bun scripts/phase-lint.mjs docs/fix/383-measured-acceptance/SPEC.md` · exit 0 · `verdict PASS`; `node scripts/run-root-suite.mjs` · `ℹ tests 1523 · suites 33 · pass 1522 · fail 0 · skipped 1`; package suite · `479 pass · 0 fail`.

## Next

P1 — cut row in `docs/ROADMAP.md`, then land `scripts/tier-cost.test.mjs` alone as the red commit.

## References

- Issue `#383` (`360b`), parent `#360` (`D360-1`), sibling `#394` (auto log-session, consumes this unit's accumulator), the shipped first third `docs/fix/360-risk-tiered-ceremony/`.
- `skills/execute-phase/references/risk-tiers.md` (block `risk-tier-verdict@1`, the four ceremony steps, `passive-record@1`).
- `skills/pre-execution-review/references/LEDGERS.md` (`ledger-ownership@1`, `block` grammar shapes).
- pi 1.5.0 extension types: `dist/core/extensions/types.d.ts` (`TurnStartEvent`, `TurnEndEvent`, `ToolExecutionEndEvent.durationMs`).

## Branch

`fix/383-measured-acceptance`

## Depends on

None. `360a` is merged (`b1ec9240`); `#394` depends on this unit, not the reverse (S4b).

## Regression scope

| Scenario | Verified by |
|---|---|
| `ceremony tier classify \| read \| plan` emit the same JSON and exit codes as at the base commit, with one declared exception: `plan` now counts this unit's own doc and the template shape (`recorded 1 → 2`, `totals 128 → 129`), which is O16 | differential run in P7 against a `/tmp` copy of the base commit — that declared difference and nothing else |
| `workflow-status` emits byte-identical Envelope v2 (no new field, no new `detail` key) | differential run in P7; `bun test scripts/workflow-status-sensor.test.mjs` exits 0 |
| the `/log-session` skill writes nothing new and no hook exists yet (`#394` is not this unit) | `rg -c 'session_shutdown\|autoLogSession' packages/pi-agentic-workflow/src` → 0 |
| the package's existing extension behaviour (routing, receipt guard, restore-after-settle) is unchanged with telemetry off | `cd packages/pi-agentic-workflow && bun run test` exits 0 |
| the whole root gate stays green | `node scripts/run-root-suite.mjs` exits 0 with `fail 0` |
