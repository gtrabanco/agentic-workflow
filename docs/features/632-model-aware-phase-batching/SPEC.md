---
type: feature
scope: medium
---

# 632 — model-aware-phase-batching

> One-line: the preset that owns the model knowledge stops guessing how much of
> a unit one context can hold. Each routed model carries a capability record
> derived from the recorded catalog — its documented tool harness, its context
> window, its cache posture — and one deterministic, config-gated policy turns
> an eligible unit plus that record into a typed recommendation: N phases in one
> context, or one phase per turn. It ships OFF, and every input it cannot read
> fails closed to the posture the workflow already has.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` quoting the requester's own words verbatim.
The requester adopted issue #632 as the request ("Apply to this repository:
issue #632"), so `S1` is the turn's instruction and `S2…S9` quote the issue.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #632

**S2 — The goal: a model-aware, evidence-backed default instead of an operator choice.**
> A deterministic, config-gated phase-batching policy in the pi-nan preset: per-model capability metadata (one-shot suitability, max phases per context, cache posture) plus a policy that decides N-phases-per-context vs one-phase-per-turn for eligible units — turning whole-unit execution from an explicit operator choice into an evidence-backed, model-aware default, in the package where the model knowledge lives (#388's seam).

**S3 — The runtime prerequisites already exist.**
> - The runtime prerequisites already exist: whole-unit execute-phase mode (operator choice today), activity fusion at standard tier (#434), per-phase Relevant-files read sets (#269), risk-tier ceremony.

**S4 — Model capability metadata in the preset, mirrored and pinned.**
> - Model capability metadata in the preset (`src/preset.ts`: `NAN_MODELS` + `PROFILE_LADDERS`), mirrored in the catalog snapshot (`catalog/nan-catalog-2026-11.jsonc`, provenance header kept current) and pinned by `test/catalog-parity.test.mjs`.

**S5 — A deterministic policy with a typed output that fails closed.**
> - A deterministic policy: eligible unit (risk tier ≤ standard, XS/S size or small fix, no Relay in the flow) + model metadata → recommend N-phases-per-context vs one-phase-per-turn; typed output (envelope), fail-closed on unknown models.

**S6 — The config key is OFF until the measurement says otherwise.**
> - Config key in the extension section per the config policy's four questions. Default OFF until the trigger below is met.
> - **Default-on trigger, recorded here**: the default flips only when the tier-cost corpus (the blocked-by issue's surface) shows, over ≥3 real units per tier, a measured saving at equal first-review PASS parity.

**S7 — The gates never change.**
> - The gates never change: one phase = one commit, diff guard per phase, evidence rows per AC — batching changes who runs where, never which gates run.

**S8 — Out of scope.**
> - No core behavior change when only `pi-agentic-workflow` is installed (the preset seam is additive, #388).
> - No tier-cost logic (owned by the blocked-by issue), no Relay changes, no triage/catalog grammar changes.
> - No claim-staleness work (parked separately, own trigger).

**S9 — The issue's surfaces and its own acceptance criteria.**
> - packages/pi-nan-agentic-workflow
> - packages/pi-agentic-workflow (extension config documentation only)
> - docs/workflow (config docs)
>
> - With the preset installed and the config key OFF: byte-identical behavior to today.
> - With the key ON: the policy emits a typed recommendation; unknown models fail closed (inline degradation, stated).
> - `catalog-parity` test pins the new metadata; sibling suites red-first; root suite passes.

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it.

| AC | Criterion | Check |
|---|---|---|
| AC-1 (S1) | The unit is applied on `feat/632-model-aware-phase-batching` with its ledgers frozen in this document and its sibling ledgers, and every obligation row closed before hand-off | `sed -n '/^| O/p' docs/features/632-model-aware-phase-batching/planning-obligations.md \| rg -c 'planned\|in-progress'` matches 0 |
| AC-2 (S2) | Every routed model carries one capability record — context window, tool harness, phases per context, cache posture — and the policy answers both decisions from it without reading anything else | `bun test test/phase-batching.test.mjs` exits 0 (the `capability record` cases, in `packages/pi-nan-agentic-workflow`) |
| AC-3 (S3) | The policy takes the unit's eligibility facts as inputs (risk tier, size tier, Relay, phases remaining) and changes no route, tier or gate: the whole-unit executor path is recommended, never driven | `git diff --name-only main...HEAD \| rg -c 'routing/\|risk-tiers\|stateflow\|conductor/'` matches 0 |
| AC-4 (S4) | The capability record is preset data mirrored by the snapshot and pinned: every chat model's context window, tool harness and cache posture equal the values the recorded catalog implies, and the four paid entries the snapshot stated only in prose carry the numeric field | `bun test test/catalog-parity.test.mjs` exits 0 (the `capability record` cases, in `packages/pi-nan-agentic-workflow`) |
| AC-5 (S5) | The policy is deterministic and total: every eligibility fact, the config switch and both fail-closed states reach exactly one published reason, and a document the validator accepts is the only shape the policy emits | `bun test test/phase-batching.test.mjs` exits 0 in `packages/agentic-workflow-schema` and `packages/pi-nan-agentic-workflow` |
| AC-6 (S6) | The key exists in the extension section, resolves to OFF when absent, is refused by name when misspelled, and the default-on trigger is recorded beside it | `bun test test/config-schema-phase-batching.test.mjs` exits 0 and `rg -c 'tier-cost corpus' docs/workflow/CONFIG.md` matches 1 |
| AC-7 (S7) | The gates are untouched: no phase, commit, diff-guard or evidence rule moves, and no existing assertion is weakened, removed or narrowed — every touched suite only gains cases | `git diff main...HEAD -- '*.test.mjs' \| rg -c '^-[^-]'` matches 0 |
| AC-8 (S8) | Nothing changes for an install that has only `pi-agentic-workflow`: the key is a documented no-op without the preset and the preset's routing ladders are byte-identical to the pre-change tree | `bun test test/tier-routing.test.mjs` exits 0 (the `routing-off byte-match` and `default resolution` cases) |
| AC-9 (S9) | The new suites landed red first, the touched packages' suites pass, the registered surfaces resolve, and the root gate passes | `bun scripts/local-gate.mjs` exits 0, `bun test scripts/normative-drift.test.mjs` exits 0, `bun test scripts/prose-gate-inventory.test.mjs` exits 0 |

## Impact

**What consumes this unit's deliverable.** `execute-phase`'s whole-unit mode
(operator choice today, #434/#269/#360 its prerequisites) is the caller the
policy describes: the recommendation answers "how many phases does one context
hold on this model", and `/nan-phase-batching` is the command that prints it
from a live session. The default-on flip belongs to the tier-cost corpus (#631,
merged as #641) and is recorded in `docs/workflow/CONFIG.md`, not here.

**What this unit consumes.** The recorded catalog snapshot
(`catalog/nan-catalog-2026-11.jsonc`) for every model fact; the published
`RISK_TIER_KINDS` and `SIZE_TIER_KINDS` vocabularies for the eligibility facts;
the preset seam (`PresetResolutionInput.config`) for the merged config; the
main package's `loadConfig` for the command's config read.

**What stops being true.** Nothing. There is no earlier phase-batching policy,
no shipped default and no prose claiming one: the whole-unit mode is documented
as an operator choice and stays one until the trigger in `S6` fires.

**What must be asked before touching something live.** Nothing outside the
paths this unit names. The catalog snapshot is a recorded third-party document:
it gains four numeric fields its own `description` prose already states, under
its provenance header, and nothing else.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/pi-nan-agentic-workflow`
- `packages/pi-agentic-workflow`
- `docs`

## Retirements

Strictly additive: the unit adds a published contract, a capability record, a
policy function, a config key and one command, and retires no surface, token,
helper or contract. The reason nothing can be removed is that nothing is
replaced — the preset's billing tier map, its four ladders, its tier routing and
the whole-unit executor mode all stay exactly as they are:

```console
$ rg -c 'phaseBatching' packages/pi-agentic-workflow/src/config/types.ts
0   # before this unit: the key does not exist, which is why nothing can be retired
$ rg -c 'max_phases_per_context' packages/pi-nan-agentic-workflow/src/preset.ts
0   # the capability record is new data, never a superseded one
```

The anti-divergence receipt for the added surfaces —
`bun scripts/residual-classify.mjs --inventory --base main` — is recorded in the
`## Log` once the implementation lands. Every added surface names its consumer
in this document (the command, the config key, the published contract, the
capability record the policy reads), so no row is `orphan`.

## Non-goals

- No tier-cost logic and no cost arithmetic: the corpus (#631) owns the
  measurement, this unit reads none of it.
- No Relay change, no triage grammar change, no catalog *grammar* change: the
  snapshot only gains the numeric context field its prose already states.
- No claim-staleness work (parked, own trigger).
- No default-on flip: the key ships OFF and the trigger is recorded, not wired.
- No route, tier or gate movement — the policy recommends, the operator decides.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths packages/agentic-workflow-schema/src/phase-batching.ts,packages/agentic-workflow-schema/src/vocabularies.ts,packages/pi-nan-agentic-workflow/src/preset.ts,packages/pi-nan-agentic-workflow/src/phase-batching.ts,packages/pi-nan-agentic-workflow/src/extension.ts,packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs,packages/pi-agentic-workflow/src/config/types.ts,packages/pi-agentic-workflow/src/config/schema.ts,packages/pi-agentic-workflow/src/config/defaults.ts,packages/pi-agentic-workflow/src/config/extension.ts,packages/pi-agentic-workflow/agentic-workflow.config.json,docs/features/632-model-aware-phase-batching/SPEC.md`
answers `tier: standard`, `reason_kind: executable-content` (eleven paths carry
executable content), `signals: []` (`E2`).

## Future

none — nothing was deferred; the out-of-scope items above are other units'
scope, not deferrals of this one.

## Future cost

- The recommended phase count is a published value: a later change to the
  derivation is a bump of `phase-batching@1`, never a silent edit. It binds
  whoever widens the record first.
- The four `context` fields added to the recorded snapshot bind the next
  provider refresh: the snapshot's provenance rule already says a provider
  change is "edit this file, then follow the test failures", and
  `catalog-parity` now fails on a context window that disagrees with the
  preset's record.
- The config key's default-on trigger is a measurement contract with #631's
  corpus: flipping it without the recorded ≥3-units-per-tier evidence at equal
  PASS parity breaks `docs/workflow/CONFIG.md`'s own statement.

## Applicable tests

- `bun test test/phase-batching.test.mjs` (in `packages/agentic-workflow-schema`)
  — the envelope contract: closed vocabularies, the accept/refuse matrix, the
  decision↔reason↔count consistency, the degradation grammar.
- `bun test test/phase-batching.test.mjs` (in `packages/pi-nan-agentic-workflow`)
  — the capability record, the derivation from the snapshot's facts, every
  reason reachable, the fail-closed states, the command's flag parsing.
- `bun test test/catalog-parity.test.mjs` (in `packages/pi-nan-agentic-workflow`)
  — the record mirrored by the snapshot.
- `bun test test/config-schema-phase-batching.test.mjs` (in
  `packages/pi-agentic-workflow`) — the config key: default, refusal, resolution.
- `bun test test/tier-routing.test.mjs` (in `packages/pi-nan-agentic-workflow`)
  — the routing ladders are byte-identical (`S8`, `AC-8`).
- `bun test scripts/normative-drift.test.mjs` and
  `bun test scripts/prose-gate-inventory.test.mjs` — the new published
  vocabularies are registered normative surfaces that resolve.

## Known pre-existing issues

- `bun run test` in `packages/pi-nan-agentic-workflow` is not a step of
  `scripts/local-gate.mjs` — *affects* this unit: its sibling suite is run
  explicitly and its exit code recorded in the `## Log`, because no gate step
  would catch a red one.
- The snapshot's four paid chat entries state their context window only in
  `description` prose — *affects* this unit: `S4`'s mirror is only total if the
  numeric field exists, so the snapshot gains it under its own provenance rule.
- `tier-cost compare` answers `insufficient-corpus` on this repository (the
  corpus is forward-only) — *does not affect* this unit: the policy reads no
  tier-cost row, and the trigger is recorded prose, not a wired read.

## Tasks

- P1 — Cut the envelope contract red in
  `packages/agentic-workflow-schema/test/phase-batching.test.mjs`: the closed
  vocabularies, the accept/refuse matrix, the decision↔reason↔count consistency
  and the degradation grammar; observe the cases fail on the missing module
  (validator: `bun test test/phase-batching.test.mjs` exits 1 with the module
  absent, `E3` records the run)
  (Implements: S5, S7)
  - Relevant files: packages/agentic-workflow-schema/test/phase-batching.test.mjs
- P2 — Implement the contract in
  `packages/agentic-workflow-schema/src/phase-batching.ts` — the contract id,
  version, `schema` token, the four closed vocabularies, the record/recommendation
  interfaces and `validatePhaseBatching()` — and export it from `src/index.ts`
  (validator: `bun test test/phase-batching.test.mjs` exits 0 and `bun run build`
  exits 0)
  (Implements: S5)
  - Relevant files: packages/agentic-workflow-schema/src/phase-batching.ts, packages/agentic-workflow-schema/src/index.ts
- P3 — Cut the preset half red in
  `packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs` and extend
  `test/catalog-parity.test.mjs` with the mirror cases: the record for all eleven
  routed models, the derivation from the snapshot's `capabilities`/`context`/rate
  pair, every reason reachable, both fail-closed states, the command's flag
  parsing, and the byte-identical ladder pin (`S8`)
  (validator: `bun run test` exits 1 on the missing modules, `E4` records it)
  (Implements: S2, S4, S5, S8)
  - Relevant files: packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs, packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs
- P4 — Implement the preset half: `src/phase-batching.ts` (the capability record
  derived from the recorded facts, the thresholds, `recommendPhaseBatching()`),
  the four numeric `context` fields the snapshot's own prose states, and the
  exports from `src/preset.ts`
  (validator: `bun run test` exits 0 and `bun test test/tier-routing.test.mjs`
  exits 0)
  (Implements: S2, S3, S4, S5, S8)
  - Relevant files: packages/pi-nan-agentic-workflow/src/phase-batching.ts, packages/pi-nan-agentic-workflow/src/preset.ts, packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc
- P5 — Declare the config key in the extension section, test-first: cut
  `packages/pi-agentic-workflow/test/config-schema-phase-batching.test.mjs` red,
  then add `phaseBatching` to `src/config/{types,schema,defaults}.ts` and
  regenerate the committed `agentic-workflow.config.json` descriptor from the
  same source (validator: `bun test test/config-schema-phase-batching.test.mjs`
  exits 0 and `bun test test/config-extension.test.mjs` exits 0)
  (Implements: S6, S8)
  - Relevant files: packages/pi-agentic-workflow/src/config/types.ts, packages/pi-agentic-workflow/src/config/schema.ts, packages/pi-agentic-workflow/src/config/defaults.ts, packages/pi-agentic-workflow/src/config/extension.ts, packages/pi-agentic-workflow/agentic-workflow.config.json
- P6 — Add the command that prints the recommendation from a live session:
  `src/phase-batching-command.ts` (flag parsing, the config read through the
  main package's `loadConfig`, the rendered envelope) and its registration in
  `src/extension.ts`, guarded so a host without `registerCommand` is unaffected
  (validator: `bun run test` exits 0, the command cases included)
  (Implements: S5, S7)
  - Relevant files: packages/pi-nan-agentic-workflow/src/phase-batching-command.ts, packages/pi-nan-agentic-workflow/src/extension.ts
- P7 — Register and document the surfaces: the three `schema-export` rows in
  `AGENTS.md`'s `normative-surfaces@1`, their ids in `docs/workflow/GATE_INVENTORY.md`'s
  `normative-surface-grammar` row, the config row plus the default-on trigger in
  `docs/workflow/CONFIG.md`, the key in `packages/pi-agentic-workflow/README.md`,
  and the capability table plus the command in
  `packages/pi-nan-agentic-workflow/README.md`
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0, `bun test
  scripts/prose-gate-inventory.test.mjs` exits 0 and `bun run test` exits 0 in
  `packages/pi-nan-agentic-workflow`)
  (Implements: S6, S9)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/CONFIG.md, packages/pi-agentic-workflow/README.md, packages/pi-nan-agentic-workflow/README.md
- P8 — Verify and settle: the differential against the base commit, the
  anti-divergence inventory, the roadmap row, the journal fragment, this
  document's `## Log`, and the root gate
  (validator: `node scripts/run-root-suite.mjs` exits 0 and
  `bun scripts/local-gate.mjs` exits 0, `G5`/`G6`)
  (Implements: S1, S7, S8, S9)
  - Relevant files: docs/ROADMAP.md, docs/features/632-model-aware-phase-batching/SPEC.md

### Planning evidence

The ledger lives beside this document:
[`planning-evidence.md`](planning-evidence.md) — one row per Engineering claim
this change rests on (`PE-001…PE-011`).

### Obligations

The ledger lives beside this document:
[`planning-obligations.md`](planning-obligations.md) — one row per normative
behaviour, compatibility invariant and required failure state (`O1…O16`). Before
the unit ships every row is `verified`.

## Triaged steps

> Local, unpublished workflow: this unit is applied inline by the owner's
> instruction, so `runner unit-route` is not run and this block stays empty by
> design, never by omission (the change is handed back as a diff, not as a lane
> execution).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the request, verbatim:
  ```
  Apply to this repository: issue #632
  ```
- **D1** — 2026-11-19, owner-scope decision by the implementer, recorded for the
  external verifier: **the unit lives in `docs/features/632-model-aware-phase-batching/`,
  not `docs/fix/`.** The issue carries the `feature` label and the roadmap row
  the emitter already owns points at that path; a fix home would fork the
  emitter's row from the document it links.
- **D2** — 2026-11-19, **the config key is declared in
  `packages/pi-agentic-workflow`'s extension section, which is more than
  `S9`'s "documentation only"** — because the config policy's first question is
  "publish the consumer or keep the key out", and an unknown key is *refused*:
  the preset reads the merged `EffectiveConfig` through the seam (`PE-007`), so
  a key it reads must be declared where the section is owned. The rest of that
  surface's change is documentation, which is the reading `S9` states.
- **D3** — 2026-11-19, **every capability value is derived from a recorded
  fact, never from model memory.** The context window is the snapshot's
  `context`; the tool harness is the snapshot's own `capabilities[]`
  distinction between `"Tool calling"` and `"Tool calling (XML)"`; the cache
  posture is derived from the snapshot's `cached`-versus-`input` rate pair;
  the phases-per-context value is the preset's declared mapping from those two
  facts plus the window size. What the snapshot does not state stays
  `unmeasured` and the policy fails closed on it.
- **D4** — 2026-11-19, **the recommendation is not a route.** The policy returns
  a typed document and touches no dispatch: with the key OFF its answer is
  `one-phase-per-turn` / `config-off`, which is the posture the workflow already
  runs, so `S9`'s "byte-identical behavior" holds by construction and is pinned
  by the ladder suite.
- **D5** — 2026-11-19, **the closed vocabularies and the envelope type live in
  the schema package, the policy lives in the preset.** `vocabulary-residency@1`
  gives published closed sets one owner (`packages/agentic-workflow-schema/src`)
  and `S2` puts the model knowledge "in the package where the model knowledge
  lives (#388's seam)"; the preset imports the contract and never re-declares a
  token.
- **D6** — 2026-11-19, **the snapshot gains four numeric `context` fields.** The
  four paid entries state "1M context" in their own `description` prose and
  carry no machine-readable field, so `S4`'s mirror could only be total by
  transcribing the fact the file already asserts, under its own provenance
  rule ("update THIS snapshot, keep the provenance header current"). No rate,
  allowance or ladder value moves.
- **E2** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  ceremony tier classify --paths …` · exit 0 · `tier: standard`,
  `reason_kind: executable-content`, `signals: []`.

## Next

- The owner's external verification of the diff this unit's `## Log` records;
  nothing else is open on this unit.

## References

- Issue [#632](https://github.com/gtrabanco/agentic-workflow/issues/632) —
  `Closes #632`.
- [`docs/ROADMAP.md`](../../ROADMAP.md) row 632.
- [#631](../631-per-tier-cache-hit-rate/SPEC.md) — the per-tier cache hit-rate
  surface this unit's default-on trigger reads; [#388](../388-extract-nan-vendor-coupling/SPEC.md)
  — the preset seam the policy lives behind; [#434](../434-activity-fusion/SPEC.md)
  and [#269](../269-relevant-files-read-sets/SPEC.md) — the whole-unit executor
  prerequisites; [#360](../360-risk-tiered-ceremony/SPEC.md) — the tier
  vocabulary the eligibility rule reads.
