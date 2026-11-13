# 534 — prose-gate-worktree-scan · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

The frozen suite and the walk implementation this unit edits are the
self-inventory gate's own carrier files; the extension is the unit's planned P1
RED corpus and the skip-set line is P2's implementation surface. Every row below
is an *expansion* — no pre-existing assertion is deleted, relaxed or narrowed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/prose-gate-inventory.test.mjs | P1 | 2026-11-13 | execute-phase | the inventory's sibling suite gains the .worktrees-checkout fixture case (a parked full-checkout worktree carrying a GATE_INVENTORY.md copy is one home and zero errors) — every pre-existing case keeps its exact expectations, including the multiple-homes fixture for a docs/features/ copy and the live-head one-home check
justification | scripts/prose-gate-inventory.mjs | P2 | 2026-11-13 | execute-phase | the walk's skip set gains the literal `.worktrees` entry and its doc comment states the checkout exemption — the marker grammar, the row grammar, inspect()'s error vocabulary and every other export are byte-identical
```

## Decisions

- **D1** (2026-11-13) — the skip set stays a literal set, not a gitignore walk:
  `findHomes()` accepts an arbitrary root and the suite's fixtures are plain
  temp directories with no `.git` (PE-004), so a gitignore-aware walk cannot be
  exercised by the existing fixture strategy. The general remedy stays open in
  the unit's Future section as an owner decision.
- **D2** (2026-11-13) — no `.changeset/` intent file: the change touches
  `scripts/` and `docs/` only, no package or skill surface (the changeset
  format declares packages and skills; the version-parity content gate covers
  `packages/` + `skills/` sources, neither of which this unit touches). Same
  call as `docs/fix/505-worktree-prune/decisions.md` D3.
- **D3** (2026-11-13) — the two parked worktrees (`feat/352-…`, `feat/438-…`)
  are not relocated, removed or re-created by this unit: their presence at the
  documented location is exactly the state the gate must learn to accept, and
  their branches' merge order is the forge's, not this fix's.
