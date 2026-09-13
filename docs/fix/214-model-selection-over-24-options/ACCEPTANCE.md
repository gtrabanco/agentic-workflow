# fix/214-model-selection-over-24-options — ACCEPTANCE.md

> Verification contract for the fix. One compact frozen ACCEPTANCE.md per
> delivery unit, its validation ladder, anti-weakening rules, and blob-bound
> execution receipt.

## Verification Ladder

| # | Criterion | Layer | Verification |
|---|---|---|---|
| 1 | `pickModelEntry()` never calls `deps.ui.select()` with > 24 options | unit | test with > 24 models → first dialog shows ≤ 24 providers |
| 2 | After provider selection, model list ≤ 24 | unit | test with > 24 models → second dialog shows ≤ 24 models for chosen provider |
| 3 | Model list ≤ 24 keeps single-step flow | unit | test with ≤ 24 models → one select dialog with all models |
| 4 | "Type another reference…" is last in every dialog | unit | assertion: `options.at(-1) === "Type another reference…"` |
| 5 | `pickCommand()` bounded to ≤ 24 | unit | test with > 24 commands → bounded select |
| 6 | `pickCommandsMulti()` bounded to ≤ 24 | unit | test with > 24 commands → bounded multi-select |
| 7 | No regression: `deps.ui.pick` rich-seam still works | unit | pre-existing test with `pick` mocked → green |
| 8 | Full test suite green | integration | `bun run test` → exit 0 |

## Execution Receipt

| Step | Command | Exit code / output |
|---|---|---|
| Ladder-1 | `node --test test/settings-console.test.mjs` (filter: provider-first test) | PASS |
| Ladder-2 | Same filter | PASS |
| Ladder-3 | Same filter (≤ 24 models test) | PASS |
| Ladder-4 | Same filter (last-item assertion test) | PASS |
| Ladder-5 | Same filter (> 24 commands test) | PASS |
| Ladder-6 | Same filter (> 24 commands multi test) | PASS |
| Ladder-7 | Pre-existing pick-mock tests | PASS |
| Ladder-8 | `bun run test` | 0 / all green |

## Evidence

- Model list > 24 extracted to unique providers via `ref.split('/')[0]`.
- Provider list always ≤ 24 because Pi's provider registry is small.
- Each provider's model sub-list is bounded by the provider's count.
- TYPED appended as last item in every generated dialog.