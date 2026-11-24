# 695 — derived-capability-record · decisions

Decisions and the path-protection records this unit's writes require. The
record grammar is `path-protection-records@1`
(`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the reasons below
name the obligation each write serves.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/pi-nan-agentic-workflow/test/model-facts.test.mjs | P1 | 2026-11-23 | execute-phase | the RED corpus for the derivation; O7/O9 need its cases fixed before the core exists
justification | packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs | P5 | 2026-11-23 | execute-phase | the threshold claim is re-cut to its band floor and the capability cases re-anchored to the generated artifact (O6/O10, D5/D6)
justification | packages/pi-nan-agentic-workflow/src/phase-batching.ts | P4 | 2026-11-23 | execute-phase | the hand map retires and the record reads the generated artifact (O1/O4/O11)
justification | packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs | P4 | 2026-11-23 | execute-phase | two cases encode the retired hand facts (which models batch, which one is `unmeasured`); the claims are re-cut to the generated record and the failure state stays proven through the policy (O5/O6)
justification | packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc | P5 | 2026-11-23 | execute-phase | the snapshot is corrected to the provider's exact `context` values and its documented harness for the four paid entries, under a dated provenance note (D5)
justification | packages/pi-nan-agentic-workflow/README.md | P6 | 2026-11-23 | execute-phase | the capability table quotes the generated record and the section states where it comes from (O13)
```

## D1 — the unit's home is the feature carrier

`docs/features/695-derived-capability-record/`, not the request's default
`docs/fix/<issue>-<topic>/`: #695 carries the `feature` label, and
`docs/ROADMAP.md` makes `## Features` rows emitter-synced (`bun
scripts/docs-generate.mjs` appends a missing one) while `## Fixes` rows are
owner-managed and never hand-written. A `docs/fix/` carrier would force a
hand-edited index row — the defect this unit's own `§7` forbids.

## D2 — the derivation reads the facts-only module, never the package entry

`@gtrabanco/pi-nan-provider/src/model-facts.ts` imports only data modules
(`scripts/models.generated.ts`, `scripts/manual-overrides.ts`,
`scripts/model-facts.ts`, `./model-facts-core.ts`); the package entry
(`src/index.ts`) pulls the provider's runtime plumbing — the pi-ai loader, the
MCP bridge, the live-catalog overlay — for data that the facts module carries
alone. A build step that boots a provider runtime to read a number is a build
step that breaks for reasons unrelated to the number.

## D3 — `cache_posture` is a joint derivation

The provider states *whether* the prompt cache engages (`cacheMode`); this
repository states *whether a cached read is cheaper* (the credit tariff in
`catalog/nan-catalog-2026-11.jsonc`). The provider's own `cost` pair is pinned to
zero on every model by the credit-pool decision (`PE-004`), so it cannot answer
the second half, and the policy's question — "does re-reading a prefix cost less
than reading it fresh?" — needs both halves. The provider's `model-facts-core`
documents exactly this consumption: "Combined with the existing rate pair, this
lets a consumer tell *real savings* from *flat caching*."

## D4 — materiality, and the pin that only moves with a fact

Material = a change to one of the three recorded cells of a **routed** model, or
a routed model the provider stops exporting. Everything else — a new model, a
model dropped that this preset never routed, a fact this record does not carry,
a credit-rate move that does not cross the discount comparison — leaves the
artifact byte-identical and lights no package.

The recorded `version` therefore names **the provider release that first
asserted these facts**, not the release installed when the file was last
written: a provider patch that moves nothing reports `immaterial`, rewrites
nothing and keeps the pin. That is what makes `S8` and `S13`'s
"zero lit packages / byte-identical documents" hold across an immaterial
catalog release, while a material one still names exactly which cell moved.

## D5 — the recorded snapshot is corrected, not forked

`catalog/nan-catalog-2026-11.jsonc` gains the provider's exact `context` values
(`1048576`, the 2^20 the models.dev catalog publishes, replacing the rounded
`1000000`) and the four paid entries gain the `capabilities[]` cell the same
docs publish (`"Tool calling"`), each under a dated provenance note. Forking
would leave two capability sources in one tree and force the parity suite to
pick a winner; correcting keeps one owner (the provider) and one quoting
surface, and the parity suite then proves the snapshot and the derived record
still agree (`IR6`, `IR11`).

## D6 — the threshold claim is re-cut to what the policy states

`NAN_PHASE_THRESHOLDS.largeContextWindow` stays `1_000_000`; the parity case
that asserted equality with the fleet's exact maximum is re-cut to the rule the
constant's own doc states — the band floor is the fleet's largest window rounded
down to a whole million — plus the unchanged `smallContextWindow === min` and a
band table (`262144 → 2`, `1_000_000 → 4`, `1_048_576 → 4`, `1`) that a
regression cannot pass. The code under judgement does not move; the claim does,
because the exact 2^20 values make "equals the maximum" false for a rule the
policy never needed.
