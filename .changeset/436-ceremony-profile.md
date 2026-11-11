---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
"unit-lane": minor
"execute-phase": minor
"init-workspace": minor
"product-audit": patch
---

feat(436): ceremony-profile@1 — piecewise ceremony adoption enforced by code

One versioned machine-readable block owned by the project charter declares
which ceremony pieces the project pays (`docs-step`, `captures`,
`review-passes`, `publish-gate`, `test-policy`), and the dispatcher/catalog
check (`unit-route.mjs --triage`) reads it in code before emitting its next
step: a profile-discarded step is skipped with a recorded receipt — never
emitted as a hand-off, never an error. Anti-gaming is code: closed
vocabularies, refuse-don't-optimize parsing, and a profile that can only
narrow ceremony relative to the catalog default (a `paid` declaration on a
catalog-skipped step earns a no-expansion refusal; a malformed block fails
closed, exit 2). An absent block is today's full-ceremony behavior, byte for
byte. `init-workspace` authors the block at charter time; the lane's and the
executor's prose record a discard as a valid `n/a` route; `product-audit`'s
profile-aware scope names the same machine grammar.
