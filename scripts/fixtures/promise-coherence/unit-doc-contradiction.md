# 99 — boundary-contradiction

> Frozen-failure fixture · issue #305 · replay of unit 258 finding **F56**: the
> Non-goals denied "any new runtime script" while the same document's tasks
> required, and the diff shipped, a 391-line `scripts/review-receipt.mjs`. The
> boundary and the plan cannot both be true.

## Non-goals

- No new runtime script or machine gate for interactive input.
- No rewriting of historical unit docs.

## Tasks

- P1 — Build the dispatcher the acceptance criteria require: `scripts/review-receipt.mjs` reads the unit folder and prints the `open-questions@1` block (validator: `grep -q "export" scripts/review-receipt.mjs` exits 0)
  - Relevant files: scripts/review-receipt.mjs
