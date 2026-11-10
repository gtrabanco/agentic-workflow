# 505 — worktree-prune · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

The frozen test this unit edits is the guard's own sibling suite; the extension
is the unit's planned P1 RED corpus. Every row below is an *expansion* — no
pre-existing assertion is deleted, relaxed or narrowed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/worktree-guard.test.mjs | P1 | 2026-11-10 | execute-phase | the guard's sibling suite gains the four cases the issue's AC3 names (nested-container ADMIN_NAMESPACE finding, basename-collision double finding, shipped default home `<repo>/.worktrees`, `.worktrees/` clean) plus a no-`--home` spawn helper and a local escapeRegExp helper; every pre-existing case keeps its exact expectations (the suite's explicit `--home <root>/wts` overrides isolate them from the default-home change)
```

## Decisions

- **D1** (2026-11-10) — the new finding's code is `ADMIN_NAMESPACE`, matching
  the guard's single-token code family (CORRUPTED, PRUNABLE, OUTSIDE, DETACHED,
  STALE) and naming the mechanism: the path sits inside git's private
  worktree-administration namespace.
- **D2** (2026-11-10) — `--prune` never removes or moves an `ADMIN_NAMESPACE`
  worktree: relocating a live checkout underneath a running session is the
  collateral-damage class this unit closes. The guard prints a `SKIP <path> —
  relocate` line and the finding stays, so `--prune` cannot reach PASS while
  the lethal layout exists.
- **D3** (2026-11-10) — no `.changeset/` intent file: the change touches
  `scripts/` and `AGENTS.md` only, no package or skill surface (the changeset
  format declares packages and skills; `scripts/lint-changeset.mjs` with an
  empty set is valid, and the version-parity content gate covers
  `packages/` + `skills/` sources, neither of which this unit touches).
