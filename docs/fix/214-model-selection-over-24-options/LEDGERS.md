# fix/214-model-selection-over-24-options — LEDGERS.md

> Execution ledger. Ticked by `execute-phase` as each task completes.

## Planning Ledgers

### Evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|
| E1 | A flat list of > 24 model references sent to `deps.ui.select()` crashes with "A select dialog must not offer more than 24 options" | reproduction | `src/settings/console.ts:269` | HEAD | AC: model selection never crashes when list > 24 | current | verified | code read |
| E2 | The same crash pattern exists for command lists in `pickCommand()` and `pickCommandsMulti()` | root cause | `src/settings/console.ts` lines 363, 382 | HEAD | AC: command selection dialogs also bounded | current | verified | code read |
| E3 | The rich-picker path (`deps.ui.pick`) is unlimited but the fallback (`deps.ui.select`) is not | regression scope | `src/settings/console.ts:261` | HEAD | fix must not regress the `pick` path | current | verified | code read |
| E4 | Tests mock both `pick` and `select`; they verify the `select` path with small lists | rollback path | `test/settings-console.test.mjs` | HEAD | revert the provider-grouping logic | current | verified | code read |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|
| O1 | Issue AC | Model selection never crashes with > 24 models — splits to provider → model | P1 | extract providers, group models, two-step select | console.ts:pickModelEntry() | test + manual | green suite | planned |
| O2 | Issue AC | Model selection ≤ 24 keeps the existing single-step flow | P1 | guard the provider-split behind the 24-item threshold | console.ts | test | small-list assertion | planned |
| O3 | Issue AC | Command selection also bounded to ≤ 24 entries | P1 | apply the same bounded-list logic to pickCommand and pickCommandsMulti | console.ts | test | green suite | planned |
| O4 | Issue AC | The "Type another reference…" option survives in every dialog | P1 | append TYPED as last item after any grouping | console.ts | test | last-item assertion | planned |
| O5 | Issue AC | No regression: tests still exercise the `pick` and `select` paths | P2 | run full test suite | package | `bun run test` | green suite | planned |

## Findings

No audit findings — this is a new fix.

## Progress

Not yet started.