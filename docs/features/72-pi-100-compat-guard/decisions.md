# 72 — pi-100-compat-guard — Decisions

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/pi-agentic-workflow/test/restore-after-settle.test.mjs | P6 | 2026-10-12 | execute-phase | scope extension (pi 1.1.0 sweep, AC6/AC7)
justification | packages/pi-agentic-workflow/test/shipped-adapter.test.mjs | P6 | 2026-10-12 | execute-phase | scope extension (pi 1.1.0 sweep, AC6/AC7)
justification | packages/pi-agentic-workflow/src/extension/index.ts | P6 | 2026-10-12 | execute-phase | scope extension (pi 1.1.0 sweep, AC6/AC7)
justification | packages/pi-agentic-workflow/src/routing/dispatch.ts | P6 | 2026-10-12 | execute-phase | scope extension (pi 1.1.0 sweep, AC6/AC7)
```

## AC7 — Aborted-settle design decision

- **Decision:** `settle()` gains an optional `aborted` parameter; when `true`, the
  turn is cleared (latch released) but the snapshot is **not** restored — matching
  the backing-off stance for an operator mid-turn model change.
- **Why:** An aborted run is when half-applied edits can be left behind. Silently
  swapping the session model underneath the operator would erase the routed model
  without consent. The dirty-worktree warning still fires (the aborted run may have
  edited files).
- **Scope:** Only the settle path changes. Non-aborted settle is byte-for-byte
  unchanged. No config schema change (the flag is an event-level boolean, not a
  user-facing setting).
- **Where:** `src/routing/dispatch.ts` (settle handler),
  `src/extension/index.ts` (handler forwards `aborted`), test fakes in
  `restore-after-settle.test.mjs` and `shipped-adapter.test.mjs`.