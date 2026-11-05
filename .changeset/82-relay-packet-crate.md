---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
"unit-lane": patch
---

fix(relay): give the packet checker one owner and a second entry point

The Relay packet checker's 500 lines lived only in `scripts/relay-packet.mjs`,
so the grammar, the fixed block and the exit codes were reachable only from a
workspace that carries the workflow's scripts — while `RELAY.md` (which ships in
`@gtrabanco/pi-agentic-workflow`) tells the reader to run exactly that path.

The contract now lives in `packages/agentic-workflow/src/relay/Packet.mjs` — the
one owner of the three-document packet grammar, the baton reader `unit-route`
consumes, the `REVIEW-VERDICT` reader and the four block shapes — and two thin
entry points print it byte-identically: the workspace script (`bun
scripts/relay-packet.mjs …`) and the crate (`agentic-workflow relay …`). A
project that installs the crate and nothing else gets `check`, `budget`, `tiers`
and `obligations` with no `scripts/` at all; `RELAY.md` names both forms and
says which owns what.

Nothing about pi-web changes: the packet is still pi-web's format in its own data
directory, `dispatch_relay` is still the tool, and the lane still degrades to the
per-phase hand-off when `PI_WEB_SESSION` is absent. The checker stays read-only
— it reads the workspace and two manifests and writes nothing.
