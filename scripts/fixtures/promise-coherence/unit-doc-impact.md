# 99 — impact-surface

> Frozen-failure fixture · issue #305 · the `## Impact` surface: one path that
> exists (a passing claim) and one that does not and is not declared as created
> (the F18 shape — a narration naming a surface the same branch deleted).

## Impact

- `scripts/needs-input.mjs` is the dispatcher this unit consults.
- `docs/features/_TEMPLATE/LEDGERS.md` stops existing when the ledger work lands.
- `scripts/fixtures/promise-coherence/unit-doc-planned-only.mjs` is created by
  this unit (declared below, so its absence is legal).

## Tasks

- P1 — Build the fixture surface (validator: `grep -c "export" scripts/fixtures/promise-coherence/unit-doc-planned-only.mjs` matches 1)
  - Relevant files: scripts/fixtures/promise-coherence/unit-doc-planned-only.mjs
