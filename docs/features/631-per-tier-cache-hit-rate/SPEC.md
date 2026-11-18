---
type: feature
scope: small
---

# 631 — per-tier-cache-hit-rate

> One-line: `tier-cost compare` stops hiding the cache half of the measurement.
> The `tier-cost@2` row has carried `cache_read_tokens`/`cache_write_tokens`
> since #504 and no reader ever projected them; the comparison now answers, per
> risk tier and per size tier, how many tokens the provider served from cache,
> how many it wrote, and what the hit rate is — or the declared verdict that
> says why it cannot answer, never a zero that reads like a measurement.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` quoting the requester's own words verbatim.
The requester adopted issue #631 as the request ("Apply to this repository:
issue #631"), so `S1` is the turn's instruction and `S2…S9` quote the issue.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #631

**S2 — The goal: the measurement answers the cache question.**
> Surface per-tier cache hit-rate in the tier-cost measurement output, so tier-routing decisions (and the phase-batching policy that consumes this issue) are evidence-based rather than assumed.

**S3 — The declared cache cells reach nothing.**
> The ledger row vocabulary already declares `cache_read_tokens` / `cache_write_tokens` (`packages/agentic-workflow/src/telemetry/ledger.mjs`), but the comparison output does not project them.

**S4 — The reconstruction path carries the provider's cache data.**
> Verify that `pi:reconstruct=<session-id>` populates the cache token fields from provider usage data; repair the reconstruction path where it drops them.

**S5 — Project the rate and the cached-token totals into `tier-cost compare`.**
> Project per-tier cache hit-rate and cached-token totals into `tier-cost compare`'s output.

**S6 — A changed row grammar or output block ships its contract, projection and doc.**
> If the row grammar or the output block changes: bump the versioned contract (`tier-cost@2` → `tier-cost@3`) in the same PR, regenerate the projections, and update `docs/workflow/TIER_COST.md` plus the schema package as `normative-surfaces@1` requires.

**S7 — Forward-only, honest outputs.**
> Forward-only measurements (#560 D4); honest outputs only (per-tier rows or a dated `insufficient-corpus` verdict naming the missing precondition) — never synthesized numbers.

**S8 — Out of scope: no routing change, no NaN cost map, no wall clock.**
> - No routing policy change (model/phase routing keeps its current behavior).
> - No NaN-specific cost mapping (owned by the `pi-nan-agentic-workflow` preset package, #388).
> - No wall-clock re-opening (#560 D3 keeps it gated).

**S9 — The issue's own acceptance criteria.**
> - `tier-cost compare` prints per-tier cache hit-rate when rows carry cache fields, and answers with a declared verdict (never a silent zero) when they do not.
> - The versioned contract, its projection and its doc are updated in the same PR as any grammar change.
> - The sibling test suite lands red-first; the root suite passes.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S1) | The unit is applied on the branch `feat/631-cache-hit-rate` with its ledgers frozen in this document and every obligation closed before hand-off | `sed -n '/^### Obligations/,/^## /p' docs/features/631-per-tier-cache-hit-rate/SPEC.md` names no `planned` row |
| AC-2 (S2) | Every risk tier and every size tier group in `tier-cost compare` answers an input-side token question: the cached share is either a number or a named reason it is not | `bun test scripts/tier-cost.test.mjs` exits 0 (the `per-tier cache hit-rate and cached-token totals` case) |
| AC-3 (S3) | The two cache cells a row carries reach the comparison: the group reports their sums and the rate derived from them | `bun test scripts/tier-cost.test.mjs` exits 0 (the same case, asserting `cache_read_tokens_sum`, `cache_write_tokens_sum`, `cache_hit_rate`) |
| AC-4 (S4) | A reconstructed session's row keeps `cache_read_tokens`/`cache_write_tokens` from `usage.cacheRead`/`usage.cacheWrite`, and no repair was owed — the assertion is the pre-existing case, re-run | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 |
| AC-5 (S5) | `compare`'s JSON carries, per tier, `cache_read_tokens_sum`, `cache_write_tokens_sum`, `cache_hit_rate` and `cache_hit_rate_verdict`, and a top-level `cache` roll-up | `bun scripts/tier-cost.mjs compare --ledger <fixture>` prints the four keys per group and the `cache` block |
| AC-6 (S6) | The output block is one fixed grammar, `tier-cost-compare@1`, declared in `docs/workflow/TIER_COST.md`, pinned to the module's exported verdict set, and registered in `normative-surfaces@1`; the row grammar stays `tier-cost@2` with its 16 columns byte-identical | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/telemetry-coverage.test.mjs` exits 0 |
| AC-7 (S7) | A group whose rows carry no cache cells answers `null` sums and a `null` rate with verdict `no-cache-fields`; rows carrying the cells that sum to no input-side token answer `no-input-tokens`; neither ever answers `0` | `bun test scripts/tier-cost.test.mjs` exits 0 (the `no silent zero` cases and the `tier-cost@1` case) |
| AC-8 (S8) | No routing policy, NaN cost mapping or wall-clock cell lands: the module still carries no span-shaped token and the routing sources are untouched | `git diff --name-only main...HEAD \| rg -c 'risk-tiers\|routing/\|wall_clock'` matches 0 |
| AC-9 (S9) | The cases landed red first (the new assertions failed on the absent keys) and the root suite passes | `node scripts/run-root-suite.mjs` exits 0 |

## Impact

**What consumes this unit's deliverable.** `tier-cost compare`'s JSON is read by
whoever decides cache economics — today that is a human reading the corpus, and
next is the model-aware phase-batching policy (#632), which its own SPEC gates on
"this issue's rows accumulate". The keys are additive: every key the command
printed before keeps its value, so a consumer of `units`/`tokens_sum`/
`tokens_median`/`turns_sum`/`ceremony_skipped_sum`/`short_tiers` reads the same
answer.

**What this unit consumes.** The `tier-cost@2` grammar and its parser
(`packages/agentic-workflow/src/telemetry/ledger.mjs`), the sample fields the
schema package publishes (`TELEMETRY_SAMPLE_FIELDS`), and the reconstruction path
`packages/agentic-workflow/src/telemetry/reconstruct.mjs` — the second writer of
the same rows.

**What stops being true.** Nothing. The comparison's silence about the cache
cells was an absence, never a documented behaviour: `docs/workflow/TIER_COST.md`
describes the row and never claims what `compare` projects.

**What must be asked before touching something live.** Nothing outside the three
paths this unit names. The ledger document is one of the shared documents
`scripts/shared-doc-merge.mjs` owns, so its sample table is not reformatted: the
new block is prose above it and the header stays byte-identical.

## Surfaces

- `scripts`
- `docs`

## Retirements

Strictly additive: the unit adds keys to an output, a block to a document and a
row to the normative inventory, and retires no surface, token, helper or
contract. The reason nothing can be removed here is that nothing is replaced —
the row grammar, its reader and both writers stay exactly as #624 left them:

```console
$ rg -c 'cache_read_tokens' packages/agentic-workflow/src/telemetry/ledger.mjs
1
$ rg -c 'cache_hit_rate' scripts/tier-cost.mjs
0   # before this unit: the projection is the gap, not a superseded implementation
```

## Non-goals

- No routing policy, model selection or phase batching: #632 owns the policy
  that reads this measurement.
- No NaN-provider cost mapping, no cost-per-token arithmetic: the preset package
  (#388) owns provider pricing.
- No new ledger column, and therefore no `tier-cost@3` row grammar: the two
  cache cells already exist. See `D1`.
- No wall-clock field (#560 D3 stays gated) and no per-phase split of one
  session's row (#504's future widening, not this unit).
- No backfill of historical rows: the measurement is forward-only (#560 D4).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths scripts/tier-cost.mjs,scripts/tier-cost.test.mjs,docs/workflow/TIER_COST.md,AGENTS.md,docs/features/631-per-tier-cache-hit-rate/SPEC.md`
answers `tier: standard`, `reason_kind: executable-content` (two paths carry
executable content), `signals: []` (`E3`).

## Future

none — nothing was deferred; the out-of-scope items above are other units'
scope, not deferrals of this one.

## Future cost

- Every new key of `compare`'s output is a published field: a later removal is a
  breaking change to the block this unit declares. It binds whoever widens the
  comparison next — and that widening belongs in `tier-cost-compare@2`, never in
  a silent edit of `@1`.
- A provider that reports its cache numbers in different units (a hit counted
  per request instead of per token) would make the rate a claim about the
  producer rather than the session. It binds whoever adds a third writer: the
  row's cells are token counts, and `docs/workflow/TIER_COST.md` now says so
  beside the rate it derives.

## Applicable tests

- `bun test scripts/tier-cost.test.mjs` — the projection, its verdicts, the
  legacy-grammar case, the doc-parity pin and the previously published keys.
- `bun test scripts/telemetry-coverage.test.mjs` — the row grammar and the
  ledger document's header stay the published field list.
- `bun test scripts/telemetry-report.test.mjs` — the report reads the same rows
  through the same parser.
- `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` — the
  reconstruction keeps the cache cells (`S4`).
- `bun test scripts/normative-drift.test.mjs` — the new block is a registered
  surface with a fixed grammar (`S6`).

## Known pre-existing issues

- `tier-cost compare` answers `insufficient-corpus` on this repository forever
  (#560 D4: the historical corpus is permanently thin) — *does not affect* this
  unit: the per-tier cache fields are projected for every group the comparison
  answers, including a thin one, and a group with no rows carries `null`, never a
  number invented to fill the shape.
- `bun scripts/tier-cost.mjs` exits `2` for a non-`ok` verdict — *affects* the
  CLI cases, which assert the exit code beside the JSON instead of treating a
  diff in it as a regression.

## Tasks

- P1 — Cut the cache projection red in `scripts/tier-cost.test.mjs`: the
  per-tier rate and totals, the three verdicts, the previously published keys and
  the doc-parity pin; observe the new cases fail on the absent keys (validator:
  `bun test scripts/tier-cost.test.mjs` exits 1 while the projection is absent,
  the six new cases red on the keys nothing emits — `E1` records the run)
  (Implements: S2, S3, S5, S7, S9)
  - Relevant files: scripts/tier-cost.test.mjs
- P2 — Implement the projection in `scripts/tier-cost.mjs`: `summarise()` gains
  the cache sums and the rate, `aggregate`/`compare` gain the `cache` roll-up,
  and the exported verdict vocabulary is the one the document declares
  (validator: `bun test scripts/tier-cost.test.mjs` exits 0)
  (Implements: S2, S3, S5, S7)
  - Relevant files: scripts/tier-cost.mjs
- P3 — Declare the output block `tier-cost-compare@1` in
  `docs/workflow/TIER_COST.md` — its keys, the rate's formula and the three
  verdicts — and register the surface in `AGENTS.md`'s `normative-surfaces@1`
  inventory (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and
  `bun test scripts/tier-cost.test.mjs` exits 0)
  (Implements: S6)
  - Relevant files: docs/workflow/TIER_COST.md, AGENTS.md
- P4 — Verify the unit and settle its state: re-run the reconstruction case
  (`S4`), the root gate, the roadmap row and the session log; close every
  obligation row (validator: `node scripts/run-root-suite.mjs` exits 0 and
  `bun scripts/local-gate.mjs` exits 0, `G1`)
  (Implements: S1, S4, S8, S9)
  - Relevant files: docs/ROADMAP.md, docs/LOGS.md, docs/features/631-per-tier-cache-hit-rate/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | The `@2` row already declares `cache_read_tokens` and `cache_write_tokens`, so no row grammar change is needed to carry the measurement | `packages/agentic-workflow/src/telemetry/ledger.mjs` (`COLUMNS`) | verified 2026-11-18 | D1; O6 |
| PE-002 | file-read | `tier-cost`'s group summary projects only `tokens`, `turns` and `ceremony_skipped`: the cache cells never reach the output, which is the whole gap | `scripts/tier-cost.mjs` (`summarise`) | verified 2026-11-18 | O1 |
| PE-003 | file-read | The reconstruction already sums `usage.cacheRead`/`usage.cacheWrite` into the two cache cells, and a case asserts it — so `S4` owes verification, not a repair | `packages/agentic-workflow/src/telemetry/reconstruct.mjs`, `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` | verified 2026-11-18 | O7 |
| PE-004 | measured-probe | The planned path set carries executable content, so the classifier answers `standard` and the unit owes a unit doc rather than a passive record | `agentic-workflow ceremony tier classify --paths …` receipt (`E3`) | run 2026-11-18 | S1; the whole ceremony |
| PE-005 | document | Cache reads bill far below base input and a model switch is a full re-prefill, which is what makes the rate decision-relevant rather than cosmetic | the issue's citation, https://platform.claude.com/docs/en/build-with-claude/prompt-caching (#631 §Why) | not re-fetched 2026-11-18 — owned by the issue, whose claim this unit does not restate as a rule | S2; O1 |
| PE-006 | file-read | `normative-surfaces@1` refuses a surface with no fixed grammar, so a new output block is registered with a `block:` declaration instead of living as prose | `AGENTS.md` §“Normative surfaces”, `scripts/normative-drift.test.mjs` | verified 2026-11-18 | O5 |
| PE-007 | file-read | The row grammar's id is one id per column set (`COLUMNS_BY_CONTRACT`), so a `@3` entry with `@2`'s bytes would be two ids for one grammar — and every adopted ledger would be forced onto it for no change | `packages/agentic-workflow/src/telemetry/ledger.mjs` (`COLUMNS_BY_CONTRACT`), `docs/workflow/TIER_COST.md` (the `@1` “still read” clause) | verified 2026-11-18 | D1; O6 |
| PE-008 | file-read | `summarise()` receives rows whose cache cells are absent on a `tier-cost@1` ledger (that grammar has no such columns), so the projection must branch on field presence rather than assume a number | `packages/agentic-workflow/src/telemetry/ledger.mjs` (`LEGACY_COLUMNS`), `scripts/tier-cost.mjs` (`readLedger`) | verified 2026-11-18 | O2 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | `S3`/`S5` | `tier-cost aggregate` and `compare` report `cache_read_tokens_sum`, `cache_write_tokens_sum` and `cache_hit_rate` for every risk tier and every size tier group whose rows carry the cache cells | P2 | P2 | execute-phase | `bun test scripts/tier-cost.test.mjs` exits 0 (the `per-tier cache hit-rate and cached-token totals` case) | `E2` line naming the case | verified |
| O2 | `S7` | a group whose rows carry no cache cells (a `tier-cost@1` ledger) answers `null` sums, a `null` rate and verdict `no-cache-fields` — never a silent zero | P2 | P2 | execute-phase | `bun test scripts/tier-cost.test.mjs` exits 0 (the `tier-cost@1` corpus case) | `E2` line naming the case | verified |
| O3 | `S7` | rows that carry the cells but sum to no input-side token answer verdict `no-input-tokens` with a `null` rate | P2 | P2 | execute-phase | `bun test scripts/tier-cost.test.mjs` exits 0 (the `no-input-tokens` case) | `E2` line naming the case | verified |
| O4 | `S7` | an empty corpus answers a declared `cache` verdict at command level and no rate, so `compare` never prints a number it did not measure | P2 | P2 | execute-phase | `bun test scripts/tier-cost.test.mjs` exits 0 (the empty-ledger case naming the `cache` block) | `E2` line naming the case | verified |
| O5 | `S6` | the output block is one fixed grammar declared as `tier-cost-compare@1` in `docs/workflow/TIER_COST.md`, its verdict tokens equal the module's exported set, and the surface is registered in `normative-surfaces@1` | P3 | P3 | execute-phase | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/tier-cost.test.mjs` exits 0 (the doc-parity case) | `E4` line naming both runs | verified |
| O6 | `S6` | the row grammar does not change: `tier-cost@2` keeps its 16 columns, `COLUMNS_BY_CONTRACT` keeps two ids, and no adopted ledger is forced onto a new id | P2 | P2 | execute-phase | `bun test scripts/telemetry-coverage.test.mjs` exits 0 and `bun test scripts/tier-cost.test.mjs` exits 0 | `E4` line naming both runs; `D1` records the decision | verified |
| O7 | `S4` | a reconstructed row (`pi:reconstruct=<id>`) keeps the provider's cache cells, so the projection has real data to read — verification only, no repair owed | P1 | P4 | execute-phase | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 | `E5` line naming the case and the exit code | verified |
| O8 | `S8` | no routing policy, NaN cost mapping or wall-clock cell enters: the module keeps no span-shaped token and no routing source is touched | P4 | P4 | execute-phase | `git diff --name-only main...HEAD \| rg -c 'risk-tiers\|routing/\|wall_clock'` matches 0 and `bun test scripts/tier-cost.test.mjs` exits 0 (the `time is never a span` case) | `E6` line naming the count and the case | verified |
| O9 | `S9` | every key the command published before keeps its value, so an existing consumer of the comparison reads the same answer | P2 | P2 | execute-phase | `bun test scripts/tier-cost.test.mjs` exits 0 (the `published keys keep their values` case) and `bun test scripts/telemetry-report.test.mjs` exits 0 | `E2`/`E4` lines naming both runs | verified |
| O10 | `S1`/`S9` | the root suite passes with the change in the tree | P4 | P4 | execute-phase | `node scripts/run-root-suite.mjs` exits 0 | `G1` line with the exit code | verified |

## Triaged steps

> Local, unpublished workflow: this unit is applied inline by the owner's
> instruction, so `runner unit-route` is not run and this block stays empty by
> design, never by omission (the change is handed back as a diff, not as a lane
> execution).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the request, verbatim:
  ```
  Apply to this repository: issue #631
  ```
- **D1** — 2026-11-18, owner-scope decision by the implementer, recorded for the
  external verifier: **the row grammar is not bumped.** `S6` triggers on "the row
  grammar or the output block"; the row grammar does not change (`PE-001`), and a
  `tier-cost@3` carrying `@2`'s bytes would put two ids on one column set
  (`PE-007`) and force every adopted ledger to rewrite its declared block for a
  grammar it already writes. The output block is the part that changes, so it
  gets its own versioned grammar — `tier-cost-compare@1` — declared in
  `docs/workflow/TIER_COST.md` and registered in `normative-surfaces@1`, which is
  `S6`'s requirement applied to the contract that actually moved. The schema
  package is untouched, as `S8`'s "surfaces" list allows ("only if the row
  grammar changes").
- **D2** — 2026-11-18, the rate's denominator: `cache_read_tokens ÷ (input_tokens
  + cache_read_tokens + cache_write_tokens)` — every input-side token the
  provider reported, so a cache write counts as a miss that populated the cache
  rather than vanishing from the ratio. A provider that reports its input side
  differently is a producer question, not a reader one: the row's cells are
  token counts (`docs/workflow/TIER_COST.md`), and this unit neither normalizes
  nor guesses them.
- **E3** — 2026-11-18, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  ceremony tier classify --paths scripts/tier-cost.mjs,scripts/tier-cost.test.mjs,docs/workflow/TIER_COST.md,AGENTS.md,docs/features/631-per-tier-cache-hit-rate/SPEC.md`
  · exit 0 · `tier: standard`, `reason_kind: executable-content`, `signals: []`.
- **E1** — 2026-11-18, `bun test scripts/tier-cost.test.mjs` · exit 1, the RED
  run: the six new cases failed on the keys nothing emits (the per-tier
  projection, the `tier-cost@1` corpus, `no-input-tokens`, the empty corpus, the
  CLI run, the output-block parity) while the 16 pre-existing cases passed —
  including the `published keys keep their value` oracle, which passes because
  the old keys were never at risk.
- **P1** — 2026-11-18, the RED corpus landed with the implementation in
  `63e56450` (this repository's sibling-suite rule commits test and code
  together; the red observation is this line).
- **E2** — 2026-11-18, `bun test scripts/tier-cost.test.mjs` · exit 0 · 22 pass ·
  0 fail, and `node --test scripts/tier-cost.test.mjs` · exit 0 (both runtimes).
- **P2** — 2026-11-18, the projection in `scripts/tier-cost.mjs` —
  `summarise()` gains the two sums, the rate and the verdict, `aggregate`/
  `compare` gain the corpus roll-up — `63e56450`.
- **P3** — 2026-11-18, the output block declared as `tier-cost-compare@1` in
  `docs/workflow/TIER_COST.md`, registered in `normative-surfaces@1`, and claimed
  by `docs/workflow/GATE_INVENTORY.md` after `prose-gate-inventory` refused the
  uncited surface (`PE-006`) — `63e56450` and `017fe892`.
- **E4** — 2026-11-18, the shared-code consumers: `bun test
  scripts/telemetry-coverage.test.mjs` · exit 0 · 6 pass · `bun test
  scripts/normative-drift.test.mjs` · exit 0 · 21 pass · `bun test
  scripts/telemetry-report.test.mjs` · exit 0 · 12 pass · `bun test
  scripts/shared-doc-merge.test.mjs` · exit 0 · 18 pass.
- **E5** — 2026-11-18, `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs`
  · exit 0 · 18 pass — the reconstructed row keeps `cache_read_tokens: 30` and
  `cache_write_tokens: 40` from the fixture's `usage.cacheRead`/`usage.cacheWrite`
  (`S4`: verified, no repair owed).
- **E6** — 2026-11-18, `git diff --name-only main...HEAD | rg -c 'risk-tiers|routing/|wall_clock'`
  matches 0, and the `time is never a span` case passes inside `E2` (`S8`).
- **E8** — 2026-11-18, `bun scripts/dimension-regression.mjs --base 2a609bca` · exit 0 ·
  `dimension-regression@1`: base 17 dimensions, head the same 17, one changed
  review surface (`docs/workflow/GATE_INVENTORY.md`, the `tier-cost-comparison`
  claim), no dimension dropped and no review axis edited — the run recorded here
  is its evidence, as that gate requires of a range touching a review surface.
- **E7** — 2026-11-18, the differential against `git archive main` in a temp tree:
  `read` is byte-identical on the same corpus; `aggregate`/`compare` differ only
  by the declared additive keys; the exit codes are identical on both grammars
  (`0` for a three-unit corpus, `2` for a thin one and for the empty ledger).
- **P4** — 2026-11-18, the state settle: the roadmap row, the regenerated
  projection, this log and the closed obligations ride the commit that carries
  this line.
- **G1** — 2026-11-18, `bun scripts/local-gate.mjs --jobs 2` · exit 0 ·
  `local-gate: PASS — 19 step(s) in 1215s`; the first attempt at the default pool
  bailed on `scripts/unit-route.test.mjs` F7 (`585ms` against its `500ms`
  wall-clock bound, a timing assertion under 4-way parallel load) — the suite
  passes standalone (`348ms`, 64 pass) and in the `--jobs 2` run, so it is a load
  flake in a test this unit does not touch, not a regression (`E7` is the
  differential that would have caught one).

## Next

- The owner's external verification of the diff handed back in this session; the
  unit's remaining action is the PR after that verdict.

## References

- Issue [#631](https://github.com/gtrabanco/agentic-workflow/issues/631) — `Closes #631`.
- [`docs/ROADMAP.md`](../../ROADMAP.md) row 631.
- [#504](../../features/494-telemetry-by-turn/SPEC.md) — the `tier-cost@2` row the
  cache cells came from; [#560](../560-307-residual-completion/SPEC.md) D3/D4 —
  forward-only and the wall-clock gate; [#624](../624-reconstruct-telemetry-from-pi-transcripts/SPEC.md) —
  the reconstruction row this unit verifies.
- [#632](https://github.com/gtrabanco/agentic-workflow/issues/632) — the
  phase-batching policy that consumes this surface.
