---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"unit-lane": minor
---

feat(relay): ask the owner and stop at the unapproved seam (issue #722)

The lane's Relay seam stops being an undefined state. With pi-web present and
the unit packet `bootstrap-needed` or `draft`, the conductor asks one question —
relay legs, or the inline per-phase hand-off — and stops for the answer; it
never degrades to inline on its own. `relay.seam` records which answer that
question preselects (`ask`, the shipped default and what an absent key means, or
`inline`), and the router prints the resolved value on its `relay-seam:` line as
the key's runtime consumer. `inline` never skips the question and never bypasses
pi-web's own `dispatch_relay` human-consent gate, so there is no `auto` value.
The degradation keeps its `relay: unavailable`-only meaning, and the per-phase
fallback is byte-identical when pi-web is absent.
