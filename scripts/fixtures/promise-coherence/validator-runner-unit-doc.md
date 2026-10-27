# validator-runner — the report-validator claim fixture

> Fixture for review F12 (`scripts/promise-coherence.mjs`). A unit doc's
> `(validator: …)` cells named `node --test` / `bun scripts/…` forms, none of
> which the reader allowlist could execute: the gate printed `verdict PASS` over
> `0 checked · N skipped`, a green that had examined nothing. The report
> validators are now re-run argv-style, and the prose-first binding below is the
> second half of the defect — the cell's *first* backticked span is `done · …`,
> which used to be taken as "the command" while the real validator went unread.

## Tasks

- P1 — Settle the row through the crate's writer (`agentic-workflow roadmap rowUpsert`, status `done · [#N](<pr-url>)`, every other cell preserved) (validator: `bun scripts/vocabulary-probe.mjs --root scripts/fixtures/vocabulary-probe/tree` exits 1)

- P2 — Keep the suite green (validator: `node --test scripts/*.test.mjs` exits 0)

- P3 — Re-run the gate over the tree (validator: `bun scripts/promise-coherence.mjs` exits 0)

- P4 — Re-triage the unit (validator: `bun scripts/unit-route.mjs --triage 99-validator-runner` exits 0)
