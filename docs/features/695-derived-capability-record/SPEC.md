---
type: feature
scope: medium
roadmap_summary: Issue [#695](https://github.com/gtrabanco/agentic-workflow/issues/695) (M): the preset's phase-batching capability record is generated from `@gtrabanco/pi-nan-provider`'s exported model facts instead of hand-transcribed — per-cell provenance, the exact provider version recorded beside the cells, a materiality check so an immaterial provider release lights no package, and `max_phases_per_context` still policy-owned.
ac-hash: 688faa755715944e21d14aec3b17d3ed8a0e09f70d0c6d48f9b35457420db946
---

# 695 — derived-capability-record

> One-line: the preset's phase-batching capability record stops being a hand
> transcription and becomes a generated artifact derived from the provider's
> exported model-facts catalog — every cell inheriting the provider's own
> provenance and the exact provider version it came from, with a materiality
> check so an immaterial catalog change lights no package.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` quoting the requester's own words verbatim.
The requester adopted issue #695 as the request ("Apply to this repository:
issue #695"), so `S1` is the turn's instruction and `S2…S13` quote the issue.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #695

**S2 — The goal: derive the capability record from provider data, not a hand snapshot.**
> Incorporate the **model-facts catalog that `pi-nan-provider` will export** (gtrabanco/pi-nan-provider#47) so the preset `@gtrabanco/pi-nan-agentic-workflow` derives its capability record from provider data instead of a hand-transcribed snapshot — and so every future model change NaN ships reaches the phase-batching policy through the provider's release cadence, not through a manual patch of this repo's four packages.

**S3 — The exported fact set this unit consumes.**
> The upstream issue exports, per model, typed facts with per-cell provenance: `contextWindow`, the `cost` pair (input/cacheRead), `toolCalling` (`openai-tools` | `xml` | `unmeasured`), `maxTokensSemantics`, `thinkingBudget`, `coldCeilingTokens`, `cacheMode`, `billingClass`, `parallelToolCalls`, `structuredOutput`. This unit consumes them.

**S4 — Why the hand snapshot cannot stay: it is churn-bound.**
> - **The hand-transcribed snapshot is churn-bound.** `packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc` (feature #632) froze four facts per model by hand. NaN changes its catalog every one-to-three weeks; most of those changes do not move any decision (fail-closed keeps the answer identical), but a change touching one of the four executor rungs (`glm5.3`, `glm5.3-flash`, `deepseek-v4-flash`, `mimo-v2.6-flash`) forces a patch release across all four packages of the single version train — manual transcription included.

**S5 — The derivation step and its provenance contract.**
> - A **derivation step** in `pi-nan-agentic-workflow` (build/publish-time, like the provider's own `generate-models`) that reads the exported facts and emits the perishable snapshot: `context_window`, `cache_posture`, and `tool_harness` per billed model, each cell carrying its inherited provenance (source URL, author, version copied, license name — the vendored-code header rule applies to generated data too).

**S6 — Policy stays policy: the thresholds never come from provider data.**
> - The **declared thresholds stay here**: `max_phases_per_context` derives from the preset's policy thresholds (`NAN_PHASE_THRESHOLDS`), never from provider data — policy is not a fact.

**S7 — The tool-harness residue is named per cell, not defaulted.**
> - The **tool-harness residue**: the provider cannot classify `openai-tools` vs XML from models.dev; up to its `unmeasured` values landing, the preset keeps whatever hand-recorded overrides the design decides to keep, and the derivation names the gap per cell.

**S8 — Release-cadence wiring and the materiality check.**
> - Release-cadence wiring: the derivation runs before publish, and a materiality check answers "did this provider diff change any decision the policy emits?" — an immaterial catalog change produces no snapshot bump, so only decision-relevant changes touch the train.

**S9 — `catalog-parity` re-anchored to the artifact and its provider pin.**
> - `catalog-parity` re-anchored to the generated artifact + the provider version it was derived from, recorded beside the snapshot.

**S10 — The docs the change owes.**
> - Docs: `docs/workflow/CONFIG.md` (the `phaseBatching` section), the preset README's capability-record table, normative-surface rows if the snapshot's grammar changes.

**S11 — Out of scope: no runtime read of the provider's catalog.**
> - Runtime reads of the provider's live catalog — the contract is frozen-at-build; that decision is feature #632's and stays.
> - The `/flow` driver itself (#669 owns it); this unit only feeds its model-ceiling input.
> - The default-on flip of `phaseBatching.enabled` — flip conditions belong to the tier-cost corpus trigger already recorded in `docs/workflow/CONFIG.md`.
> - Upstream export design — any new field, naming or provenance-rule change is negotiated in gtrabanco/pi-nan-provider#47, not here.

**S12 — The surfaces the change occupies.**
> - `packages/pi-nan-agentic-workflow` — the derivation step, the snapshot, the README capability table
> - `packages/pi-nan-agentic-workflow/catalog` — the generated snapshot artifact and its provenance header
> - `packages/agentic-workflow-schema` — only if a mapping needs a vocabulary value the schema does not yet publish (e.g. an exported `unmeasured` that must map into `tool_harness`'s ladder)
> - `docs/workflow/CONFIG.md`, preset README, normative-surfaces rows as needed

**S13 — The unit's own acceptance criteria.**
> - [ ] The capability record's three data cells (`context_window`, `tool_harness`, `cache_posture`) are generated from the exported provider facts, and the hand-transcribed source is retired in the same change (IR6: no keyed-by-hand copy survives alongside the generator).
> - [ ] Every generated cell carries provenance naming the provider package version and the upstream source class; a cell the provider states as `unmeasured` arrives as an explicit `unmeasured` value, never `null`-by-default-and-silent.
> - [ ] `catalog-parity` fails when the generated artifact disagrees with the provider facts it claims to derive from, and passes at the recorded provider version pin.
> - [ ] An immaterial catalog change (new model, dropped non-executor model, price move outside the executor rungs) produces zero lit packages — the policy's emitted documents are byte-identical before and after.
> - [ ] With only `pi-agentic-workflow` installed, nothing changes: the preset stays optional and the `phaseBatching` key stays a documented no-op without it (feature #632's AC-8 posture holds).
> - [ ] Unit's evidence shows the matrix test coverage: every fail-closed reason still reachable, thresholds still policy-owned, `bun scripts/local-gate.mjs` green.

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it.

| AC | Criterion | Check |
|---|---|---|
| AC-1 (S1) | The unit is applied on `feat/695-phase-batching-model-facts` with its ledgers frozen here and beside this document, and every obligation row is closed before hand-off | `rg -c '^\| O[0-9]+ \|.*\| (planned\|in-progress) \|$' docs/features/695-derived-capability-record/planning-obligations.md` matches 0 |
| AC-2 (S2) | The runtime record is the generated artifact: `packages/pi-nan-agentic-workflow/src/phase-batching.ts` declares no capability fact of its own and the hand map no longer exists | `rg -c 'RECORDED_FACTS' packages/pi-nan-agentic-workflow/src` matches 0 and `bun test test/model-facts.test.mjs` exits 0 (the record-from-artifact case) |
| AC-3 (S3) | Only the three cells the policy reads reach the artifact; the other exported facts are ignored rather than carried or refused | `bun test test/model-facts.test.mjs` exits 0 (the cell-set and unknown-fact cases) |
| AC-4 (S4) | The recorded snapshot stops being a second capability source: it is corrected to the provider's own values and the harness residue is closed by the provider's documented fact | `bun test test/catalog-parity.test.mjs` exits 0 in `packages/pi-nan-agentic-workflow` |
| AC-5 (S5) | Every generated cell inherits its provenance — provider package, version, upstream source class, author and license at the module level, one source id per cell — and the generator refuses to write an artifact without it | `bun test test/model-facts.test.mjs` exits 0 (the provenance case) |
| AC-6 (S6) | Policy stays policy: `max_phases_per_context` is computed here from `NAN_PHASE_THRESHOLDS` and no threshold value appears in the generated artifact | `rg -c 'largeContextWindow' packages/pi-nan-agentic-workflow/src/model-capabilities.generated.ts` matches 0 and `bun test test/phase-batching.test.mjs` exits 0 |
| AC-7 (S7) | A cell the provider states as `unmeasured` arrives as the explicit token `unmeasured` and still fails closed through the published reason | `bun test test/model-facts.test.mjs` exits 0 (the unmeasured matrix) and `bun test test/phase-batching.test.mjs` exits 0 (both unmeasured reasons) |
| AC-8 (S8) | An immaterial catalog change rewrites nothing and lights no package, while a material one is named and blocks: `--check` exits 0 on the committed artifact and 1 on a moved cell | `bun test test/model-facts.test.mjs` exits 0 (the materiality matrix) and `bun scripts/derive-model-facts.mjs --check` exits 0 |
| AC-9 (S9) | `catalog-parity` is anchored to the generated artifact and the recorded provider pin, so a stale artifact reds the suite | `bun test test/catalog-parity.test.mjs` exits 0 and `bun test test/model-facts.test.mjs` exits 0 |
| AC-10 (S10) | The docs the change owes are current: `CONFIG.md`'s phase-batching section states the derivation and the pin, and the README's capability table matches the generated record | `rg -c 'generated artifact' docs/workflow/CONFIG.md` matches 1 and `bun test test/model-facts.test.mjs` exits 0 (the README-table case) |
| AC-11 (S11) | Nothing reads the provider at runtime and nothing outside the preset's `devDependencies` names it: `src/` carries no provider import, the shipped `dist/` carries no provider specifier | `rg -c 'from "@gtrabanco/pi-nan-provider' packages/pi-nan-agentic-workflow/src packages/pi-nan-agentic-workflow/dist` matches 0 and `rg -c '@gtrabanco/pi-nan-provider' packages/pi-nan-agentic-workflow/package.json` matches 1 |
| AC-12 (S12) | The change occupies the surfaces it declared and no others: the schema package is untouched, so the mapping targets vocabularies that already exist | `git diff --name-only main...HEAD \| rg -c 'packages/agentic-workflow-schema/'` matches 0 |
| AC-13 (S13) | Every fail-closed reason stays reachable, the shipped OFF posture is byte-identical, and the repository gate passes with the change in the tree | `bun run test` exits 0 in `packages/pi-nan-agentic-workflow` and `bun scripts/local-gate.mjs` exits 0 |

## Impact

**What consumes this unit's deliverable.** The phase-batching policy
(`packages/pi-nan-agentic-workflow/src/phase-batching.ts`) and, through it, `/nan-phase-batching` and the lane
driver #669's model-ceiling input read one capability record. After this unit
that record is `packages/pi-nan-agentic-workflow/src/model-capabilities.generated.ts`, produced by
`packages/pi-nan-agentic-workflow/scripts/derive-model-facts.mjs` from `@gtrabanco/pi-nan-provider`'s exported
`NAN_MODEL_FACTS`; nothing else in the tree reads it.

**What this unit consumes.** The provider's exported facts module
(`@gtrabanco/pi-nan-provider@1.6.1`, `src/model-facts.ts`) at build time only;
the recorded credit tariff snapshot
(`packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc`) for the cache-discount comparison; the
schema package's two closed vocabularies (`PHASE_BATCHING_TOOL_HARNESSES`,
`PHASE_BATCHING_CACHE_POSTURES`); the preset's own `NAN_MODELS` routed fleet and
`NAN_PHASE_THRESHOLDS`.

**What stops being true when the change lands.** The comment in
`packages/pi-nan-agentic-workflow/src/phase-batching.ts` that says the record is "transcribed here because the
runtime reads `src/` and never the snapshot" retires with `RECORDED_FACTS`; the
README's per-model harness column ("not documented" on the four paid entries)
retires; the parity claim "the capability record mirrors the recorded snapshot's
`capabilities[]`" is replaced by "the record equals the generated artifact and
the artifact equals the provider's facts at the recorded pin". The four paid
models (`kimi-k3.1-pro`, `qwen3.8-max`, `deepseek-v4-pro`, `hy4`) move from
`tool_harness: unmeasured` to the provider's documented `openai-tools` — with
the key ON they now earn four phases instead of one. That is the gap closing,
not a regression: with the key OFF the document is byte-identical (reason
`config-off`, nothing inspected).

**What must be asked before touching something live.** Nothing. The provider
package is a build-time devDependency (never shipped, never imported by `dist/`),
the recorded snapshot gains corrected cells under its own provenance header, and
no live service is read: the derivation imports committed package data and
performs no network call.

## Surfaces

- `packages/pi-nan-agentic-workflow`
- `docs`

## Retirements

Two surfaces retire, each with its replacement:

| Retired | Replacement | No-consumer evidence |
|---|---|---|
| `RECORDED_FACTS` (the hand map in `packages/pi-nan-agentic-workflow/src/phase-batching.ts`) | `packages/pi-nan-agentic-workflow/src/model-capabilities.generated.ts`, written by `packages/pi-nan-agentic-workflow/scripts/derive-model-facts.mjs` | `rg -c 'RECORDED_FACTS' packages/pi-nan-agentic-workflow/src` → 0 after the change |
| the parity claim "the record mirrors the snapshot's `capabilities[]`" | the record ↔ artifact ↔ provider-pin parity in `packages/pi-nan-agentic-workflow/test/model-facts.test.mjs` plus the `--check` run | `rg -c 'impliedHarness' packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` → 0 after the change |

Nothing else is retired: the policy, the vocabulary, the config key, the
command and the thresholds all stay exactly as they are.

## Non-goals

- No runtime read of the provider's catalog, and no live endpoint read by the
  derivation (S11).
- No new capability cell, no new reward vocabulary, no change to
  `phase-batching@1`'s shape or reasons.
- No default-on flip (S11).
- No upstream field/naming negotiation (S11).
- No change to `packages/agentic-workflow-schema`: the two vocabularies the
  mapping targets already exist (verified by `PE-005`).

## Risk tier

Computed, never chosen, with the planned path set (existing paths read from the
tree, the four new files forced as unknown-content — `classifyTier(files,
{force})` in `packages/agentic-workflow/src/runner/risk-tiers.mjs`, receipt in
`E1`):

- **Tier** — `standard` · **Task Size** — `standard`
- **Reason** — `9 path(s) carry executable content: bun.lock, packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc, packages/pi-nan-agentic-workflow/package.json, …`
- **Named high-risk item** — none — not a high-tier unit

Task Size = Understood + Contained risk + Resumable-from-diff: the change is one
package plus two docs, the risk is contained to an opt-in policy path (the key
ships OFF), and the diff is resumable from any point.

## Future

none

## Future cost

- The provider pin moves on a deliberate cadence: `@gtrabanco/pi-nan-provider`
  is a build-time devDependency, so a provider release is adopted by bumping the
  pin and re-running `bun run derive:model-facts`; the gate's `--pins` half reads
  `dependencies` only, so nothing nudges it automatically (`PE-007`). Binds every
  session that touches the preset.
- The generator requires bun, because the provider publishes TypeScript sources
  and node refuses type stripping under `node_modules` (`PE-008`). Binds whoever
  changes `packages/pi-nan-agentic-workflow/scripts/derive-model-facts.mjs`.

## Applicable tests

- `packages/pi-nan-agentic-workflow/test/model-facts.test.mjs` — the derivation matrix, the materiality rule, the
  provenance contract and the record-from-artifact equality (new).
- `packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` — the recorded snapshot ↔ record parity, with
  the threshold claim re-cut to the band floor it actually states.
- `packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs`, `packages/pi-nan-agentic-workflow/test/docs-parity.test.mjs`,
  `packages/pi-nan-agentic-workflow/test/tier-routing.test.mjs`, `packages/pi-nan-agentic-workflow/test/registration.test.mjs`,
  `packages/pi-nan-agentic-workflow/test/embed-profile.test.mjs` — unchanged, run to prove the policy's previous
  behaviour still holds.

## Known pre-existing issues

- `packages/pi-nan-agentic-workflow`'s suite has no step in
  `scripts/local-gate.mjs` (`STEPS` does not name the package) — `does-not-affect`
  this unit: the package's suite is run in the foreground by this unit's own
  evidence, exactly as #632 ran it, and adding a gate step edits the id set a
  different unit pins.
- `.worktrees/fix-704-prose-only-delivery-stall` exists on the same commit —
  `does-not-affect`: different branch, different files.

## Tasks

- P1 — Land the RED corpus: the derivation matrix, the materiality rule, the
  provenance contract and the record-from-artifact equality, observed failing on
  the absent module (validator: `bun test test/model-facts.test.mjs` exits 1 with
  the new cases red)
  (Implements: S5, S7, S8, S9, S13)
  - Relevant files: packages/pi-nan-agentic-workflow/test/model-facts.test.mjs
- P2 — Land the pure derivation core: the shared JSONC reader, the fact→cell
  mapping, the cache-posture rule, the materiality decision and the artifact
  renderer, with no provider import (validator: `bun test test/model-facts.test.mjs`
  exits 0 for the matrix and materiality cases)
  (Implements: S3, S5, S7, S8)
  - Relevant files: packages/pi-nan-agentic-workflow/scripts/jsonc.mjs, packages/pi-nan-agentic-workflow/scripts/derive-model-facts.mjs
- P3 — Land the CLI half: the provider import, `--check` / `--write`, the
  routed-fleet read, and the declared bun boundary (validator:
  `bun scripts/derive-model-facts.mjs --check` exits 0)
  (Implements: S8, S9)
  - Relevant files: packages/pi-nan-agentic-workflow/scripts/derive-model-facts.mjs
- P4 — Land the generated artifact and make the runtime read it; retire the hand
  map (validator: `bun test test/model-facts.test.mjs` exits 0 and
  `rg -c 'RECORDED_FACTS' packages/pi-nan-agentic-workflow/src` matches 0)
  (Implements: S2, S5, S6, S7, S13)
  - Relevant files: packages/pi-nan-agentic-workflow/src/model-capabilities.generated.ts, packages/pi-nan-agentic-workflow/src/phase-batching.ts
- P5 — Re-anchor the recorded snapshot and the parity suite: the corrected
  `context` cells, the four paid entries' documented harness, the provenance
  note, and the threshold claim re-cut to its band floor (validator:
  `bun test test/catalog-parity.test.mjs` exits 0)
  (Implements: S4, S9, S13)
  - Relevant files: packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc, packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs
- P6 — Wire the cadence and the docs: the package scripts, the README's
  capability-table section and `docs/workflow/CONFIG.md` (validator:
  `rg -c 'derive:model-facts' packages/pi-nan-agentic-workflow/README.md` matches 1
  and `rg -c 'generated artifact' docs/workflow/CONFIG.md` matches 1)
  (Implements: S8, S10, S12)
  - Relevant files: packages/pi-nan-agentic-workflow/package.json, packages/pi-nan-agentic-workflow/README.md, docs/workflow/CONFIG.md
- P7 — Ship the release intent, the roadmap row and the session record through
  their emitters (validator: `bun scripts/lint-changeset.mjs` exits 0 and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1)
  - Relevant files: .changeset/695-derived-capability-record.md, docs/ROADMAP.md
- P8 — Verify: the preset suite, the untouched sibling suites, the root gate
  (validator: `bun run test` exits 0 in
  `packages/pi-nan-agentic-workflow` and `bun scripts/local-gate.mjs` exits 0)
  (Implements: S13)

### Planning evidence

The M-scope ledger lives beside this document — `planning-evidence.md` — and is
not embedded here.

### Obligations

The M-scope ledger lives beside this document — `planning-obligations.md` — and
is not embedded here.

## Triaged steps

`n/a` — the owner's local unpublished workflow substitutes for the lane's triage
(see `## Log` `L1`); this document's `## Tasks` is the authoritative step list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-23, the request, verbatim:
  ```
  Apply to this repository: issue #695
  ```
- **D1** — 2026-11-23, owner decision (carried by the request's own workflow):
  the unit's home is `docs/features/695-derived-capability-record/`, not the
  request's default `docs/fix/<issue>-<topic>/`, because #695 is labeled
  `feature` and `docs/ROADMAP.md` makes `## Features` rows
  emitter-synced while `## Fixes` rows are owner-managed and must never be
  hand-written.
- **D2** — 2026-11-23, owner decision: the derivation imports the provider's
  facts-only module (`src/model-facts.ts`), never the package entry point, which
  pulls the provider's runtime plumbing (pi-ai loader, MCP bridge) for data that
  the facts module carries alone.
- **D3** — 2026-11-23, owner decision: `cache_posture` is a joint derivation —
  the provider's `cacheMode` says whether the cache engages, this repository's
  credit tariff says whether a cached read is cheaper. The provider's own `cost`
  pair is all-zero by the credit-pool decision, so it cannot answer the second
  half.
- **D4** — 2026-11-23, owner decision: materiality and the pin. The recorded
  pin advances only when a recorded cell moves; an immaterial provider release
  reports `immaterial` and rewrites nothing, so no package is lit and the
  emitted documents stay byte-identical.
- **D5** — 2026-11-23, owner decision: the recorded snapshot is corrected rather
  than forked — its `context` cells take the provider's exact value and the four
  paid entries gain the `capabilities[]` cell the same docs publish — so the
  snapshot stays a faithful quote and the record keeps one source (IR6/IR11).
- **D6** — 2026-11-23, owner decision: the threshold claim is re-cut to what the
  policy states. `largeContextWindow` remains `1_000_000` and is pinned as the
  fleet's largest window rounded down to a whole million, instead of asserting
  equality with the fleet maximum that the provider's exact 2^20 values no
  longer satisfy (elaborated in `decisions.md` §D6).
- **E1** — 2026-11-23, the risk tier over the planned path set (`classifyTier` from `packages/agentic-workflow/src/runner/risk-tiers.mjs`, existing paths read from the tree and the four new files forced) · exit 0 · `standard` / `standard`, reason `9 path(s) carry executable content`.
- **E2** — 2026-11-23, `bun install` in this worktree · exit 0 · one `bun.lock` entry: `@gtrabanco/pi-nan-provider@1.6.1` (sha512 recorded) and the preset's `devDependencies` line — the build-time pin, never a runtime dependency.
- **E3** — 2026-11-23, `bun -e 'import("@gtrabanco/pi-nan-provider/src/model-facts.ts")' · exit 0 · 13 models, facts build `2026-11-23T00:46:05.244Z`; windows `1048576`×8 routed, `1000000` for the two `max` entries, `262144`×2; `toolCalling` `openai-tools`×9 / `xml`×3 on the routed fleet; `cacheMode` `automatic`×9 / `unmeasured`×2; `cost` all-zero.
- **E4** — 2026-11-23, the recorded snapshot read through `packages/pi-nan-agentic-workflow/scripts/jsonc.mjs` · exit 0 · `context 1000000` on the eight non-cluster routed models and no `capabilities` key on the four paid entries (the drift `D5` corrects).
- **E5** — 2026-11-23, `node --test` on a throwaway `/tmp` probe importing the installed provider subpath · exit 0 with `PROBE-FAIL ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` printed · node refuses type stripping under `node_modules` on every version, so the generator's bun boundary is measured, not assumed (`PE-006`).
- **E6** — 2026-11-23, `bun test test/model-facts.test.mjs` at the RED commit `b28a3b53a` · exit 1 · `0 pass, 1 fail, 1 error — Cannot find module '../scripts/derive-model-facts.mjs'` (the corpus landed alone, before any implementation).
- **E7** — 2026-11-23, `bun test test/model-facts.test.mjs` in `packages/pi-nan-agentic-workflow` at `10ab0008a`/`0ba0182e4` · exit 0 · 21 pass, 0 fail.
- **E8** — 2026-11-23, `bun run test` in `packages/pi-nan-agentic-workflow` · exit 0 · 85 pass, 0 fail across 7 files, then `derive-model-facts: identical — src/model-capabilities.generated.ts matches @gtrabanco/pi-nan-provider@1.6.1`.
- **E9** — 2026-11-23, the differential run of `phaseBatchingCommand` over 162 invocations (every routed model × the key OFF/ON × six eligibility shapes, plus three refusals) against a `git archive 15bcab21c` copy in `/tmp` and against the change · exit 0 · **84/84 OFF-and-refusal cases byte-identical**; the 10 ON cases that differ change only `capability.context_window` (the exact 2^20 value); four models flip `one-phase-per-turn → batched-phases` with reason `tool-harness-unmeasured → phases-batched` (`kimi-k3.1-pro`, `qwen3.8-max`, `deepseek-v4-pro`, `hy4` — the requested residue closing); **0 unexplained differences**.
- **E10** — 2026-11-23, `bun test test/catalog-parity.test.mjs` · exit 0 · 12 pass, 0 fail; `bun test test/phase-batching.test.mjs` · exit 0 · 23 pass, 0 fail.
- **E11** — 2026-11-23, the retirement and boundary counts · exit 0 · `rg -c 'RECORDED_FACTS' packages/pi-nan-agentic-workflow/src` matches 0; `rg -c 'from "@gtrabanco/pi-nan-provider' src dist` matches 0; `rg -c '@gtrabanco/pi-nan-provider' package.json` matches 1; `rg -c 'generated artifact' docs/workflow/CONFIG.md` matches 1.
- **E12** — 2026-11-23, `bun scripts/docs-generate.mjs` · exit 0 · `PASS`, the Features row for 695 appended by the emitter (never hand-written) and the `docs/generated` projection refreshed.
- **G1** — 2026-11-23, GATE-RAN · HEAD 4dd04d2c1 · `bun scripts/local-gate.mjs` · exit 0 · `PASS — 20 step(s) in 675s`, 1070 pass / 1 skipped across the suite-bearing steps.
- **E13** — 2026-11-23, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/695-derived-capability-record/SPEC.md` · exit 0 · the `verify@1` receipt reports no violation.
- **E14** — 2026-11-23, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` · exit 0 · `{"ok":true,"checked":26,"refusals":[]}`.
- **E15** — 2026-11-24, `bun run test:node` in `packages/pi-nan-agentic-workflow` · exit 0 · 85 pass, 0 fail under node — the suites stay runtime-neutral; only the generator is bun-bound;
- **G4** — 2026-11-24, GATE-RAN · HEAD dda3f7454 · `bun scripts/local-gate.mjs` · exit 0 · `PASS — 20 step(s) in 857s` on the final tree (the run G1 records re-confirmed after the docs landed).

## Next

The owner is the external verifier: review the branch (`feat/695-phase-batching-model-facts`) against this document's acceptance criteria and the differential receipt `E9`. No obligation row is open.

## References

- Issue [#695](https://github.com/gtrabanco/agentic-workflow/issues/695) — this
  unit. `Closes #695`.
- Upstream: gtrabanco/pi-nan-provider#47 (closed 2026-11-23) — the exported
  catalog this unit consumes.
- Feature #632 — `docs/features/632-model-aware-phase-batching/` — introduced the
  record this unit makes generated.
- Related: #669 (the lane driver, the record's intended consumer), #631 (the
  tier-cost corpus that owns the default-on trigger).
