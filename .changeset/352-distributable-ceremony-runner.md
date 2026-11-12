---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"runner-contract": minor
---

feat(352): ship the distributable runner inside the crate

The seven runtime sensors and the router answer as subcommands of the published
`agentic-workflow` bin, so a project that installs the skills gets every command
they cite without a clone of this repository. The ceremony registry moves into
the crate with them, the router's catalog ships as package data, and
`skills/runner-contract` carries the train-stamped invocation pin that
`scripts/release.mjs` stamps and `normative-drift` recomputes.
