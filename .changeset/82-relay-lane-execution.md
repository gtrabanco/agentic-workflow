---
"unit-lane": minor
"execute-phase": minor
---

feat(82): Relay-orchestrated lane execution — unit phases as Relay legs with a fresh-context coherence reviewer as the pre-PR gate

`skills/unit-lane/references/RELAY.md` publishes the leg contract: the
plan/continuity division (agentic-workflow owns the plan, pi-web Relay owns the
continuity), the packet as pointers (the charter names the unit doc and its
acceptance criteria, the baton carries the state, the leg cursor, the phase
cursor and evidence pointers, `decisions.md` is optional), the bootstrap with its
human approval, one phase per leg under the existing `execute-phase <NN> P<k>`
contract, and the four-item positive-verification coherence review whose output
is the existing `REVIEW-VERDICT` block — evidence, never a receipt.

`scripts/relay-packet.mjs` checks a packet offline in four read-only modes
(`check`, `budget`, `tiers`, `obligations`), `packages/agentic-workflow/src/runner/unit-route.mjs` prints the
relay bootstrap hint when a pi-web session is present and the per-phase
`/execute-phase` fallback when it is not, and `packages/agentic-workflow/src/runner/catalog.json` gains the
leg-to-step mapping so each leg's tier comes from the one `budget_tier` source.
`execute-phase` gains its one-phase parity sentence: a leg is that phase
contract, with the baton handed to the next leg instead of resuming the lane.
