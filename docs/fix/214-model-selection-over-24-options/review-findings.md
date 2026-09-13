# review-findings — fix-214 (model-selection-over-24-options)

Fix-now fold ledger for this unit, written by `/review-change` (Cycle 1,
2026-09-13, reviewed head `c1f89f79da8bf6ea861654da4685866f5691b806`, PR #217).
Schema: `| id | file:line | axis | severity | class | route | folded |` — each
row is followed by its `finding-mark@1` verification row. `folded` is flipped
only by the fold cycle (`/fold-findings`). Low findings are report-only notes
in the review report, never rows here.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | packages/pi-agentic-workflow/src/settings/console.ts:299-302 | code | med | fix-now | fold | yes |
| VF-1 | console.ts:299-302 · reviewer review-change · HEAD c1f89f79da8bf6ea861654da4685866f5691b806 · recheck direct read of all three sites — `providerOf` (console.ts:299-302, `indexOf("/")`/`slice`), `parseModelReference` (src/config/schema.ts:32 docstring + :39-43 split, stricter: validates/rejects, not a drop-in for the lenient split), inline `ref.split("/")[0]` (picker.ts:119); split semantics identical for every input, concept triplicated | code | confirmed | finding-mark | n/a | n/a |
| F2 | packages/pi-agentic-workflow/src/settings/picker.ts:49-63 · :84-92 | code + api-ergonomics | med | fix-now | fold | yes |
| VF-2 | picker.ts:49-63 · :84-92 · reviewer review-change · HEAD c1f89f79da8bf6ea861654da4685866f5691b806 · recheck failing reproducer (bun script in /tmp importing src/settings/picker.ts, 44 options → 3 pages): data option `"More options…"` answered on page 0 is intercepted by the navigation guard (page 1 shown, value never returned); last page returns it (`page < pageCount - 1` false) — JSDoc :57-58 "data entries are returned to the caller" violated on non-last pages; reservation undocumented | code + api-ergonomics | confirmed | finding-mark | n/a | n/a |
| F3 | CHANGELOG.md:95 · CHANGELOG.es.md:97 | brand | med | fix-now | fold | no |
| VF-3 | CHANGELOG.md:95 · CHANGELOG.es.md:97 · reviewer review-change · HEAD c1f89f79da8bf6ea861654da4685866f5691b806 · recheck direct read: EN "Lists at or below the cap keep the previous single-dialog behavior byte-identical" / ES "Las listas en el tope o por debajo mantienen byte a byte el comportamiento de un solo diálogo" vs console.ts:264-267 routing `models.length > SELECT_OPTION_LIMIT - 1` (24 models included) to the two-step — false at the exact boundary (unit Decision 1) | brand | confirmed | finding-mark | n/a | n/a |
| F5 | packages/pi-agentic-workflow/src/settings/picker.ts:56 | api-ergonomics | med | fix-now | fold | yes |
| VF-5 | picker.ts:56 · reviewer review-change · HEAD c1f89f79da8bf6ea861654da4685866f5691b806 · recheck direct read: JSDoc "pages 21 data entries at a time" vs :44 `PAGED_SELECT_PAGE_SIZE = SELECT_OPTION_LIMIT - 3` and :28-30 constant JSDoc "the single knob if a future host enforces a different bound" — a sanctioned knob edit silently falsifies the hardcoded count (sibling comment :41-42 `21 + 2 + 1 = 24`) | api-ergonomics | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD c1f89f79da8bf6ea861654da4685866f5691b806 | n/a | n/a | review-mark | n/a | n/a |
