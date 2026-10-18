# 76 — lane-product-route · decisions

Recorded by the lane's design step (cheap defaults taken without a user turn —
each is cheap to change and none is scope-, stack-, architecture-, data-model-,
deployment- or security-shaped). Expensive-to-undo gaps: none remained open —
the issue (#293) states the scope, the ACs, and the non-goals.

| Date | Decision | Why (chosen) | Alternative considered |
|---|---|---|---|
| 2026-10-17 | Route priority order stays `replan → decision → product → fold` (product inserts immediately before the fold fall-through) | A `decision` row blocks all safe work until the user decides, so it must stay above an actionable product route; the issue only demands product beats `fold` | `product` above `decision` — rejected: a mixed ledger would route to actionable work while an open decision blocks it |
| 2026-10-17 | `PRODUCT_ROUTE` vocabulary: `product[- ]owner|product[- ]owned|owned by product` (case-insensitive), matching the `Route` cell that `review-change` persists (`product owner — …`) | Aligns with the exact cell spelling the issue quotes and with `CLASSIFY.md`'s owner table; mirrors the existing `PLAN_ROUTE`/`DECISION_ROUTE` style | Matching the `klass` cell — rejected: a product-owned row's class is `fix-now`, indistinguishable from a foldable one |
| 2026-10-17 | The product route's `next` command mirrors the replan route's per-kind lane command (`/unit-lane <slug>` feature · `/unit-lane --fix <n>` fix) | Issue #293 non-goals: the repair route lands in the lane; `CLASSIFY.md`'s owner table already names `/unit-lane <unit>` | A dedicated repair command — rejected: invents a new surface (non-goal: no new schema/envelope surface) |
| 2026-10-17 | `triage-issue`'s verdict vocabulary gains `product-repair` (name follows the route id) | The issue's scope table says "add the product verdict"; naming it after the route keeps one vocabulary across router and triage | Keeping `fix-now` and adding prose — rejected: A4 is precisely that the closed verdict set cannot express the outcome |
| 2026-10-17 | Issue AC3–AC7 (Axis B) are verification-only in this unit | Feature 73 (PR #297) already implemented them; re-implementing violates DRY and the issue's own triage (2026-10-17) recorded Axis B resolved | Re-landing Axis B — rejected: duplicate work on a merged surface |
| 2026-10-18 | F19 fold (cycle 7): patch `scripts/check-skill-context.test.mjs` with a raw-text duplicate-key assertion (F18's required guard) | The context-budget manifest is a machine-read artifact read only through `JSON.parse` (silent last-wins); without a raw-text scan the suite cannot catch key collisions. The guarded file is a script-owned test, not a UI/infra surface. | No alternative — `JSON.parse` alone cannot surface duplicates |

path-protection-records@1
justification | scripts/check-skill-context.test.mjs | P4 | 2026-10-18 | execute-phase | F19 fold: adding a raw-text duplicate-key assertion to the context-budget suite (F18's part c); the manifest is read only through `JSON.parse` which silently keeps the last duplicate

