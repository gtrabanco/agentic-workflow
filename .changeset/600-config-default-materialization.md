---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(config): `config default` materializes the documented defaults (issue #600)

The unified config resolved its defaults in code, so an operator opening
`agentic-workflow.json` saw only what they had written and had to consult
`config list` to learn the rest of the surface. `agentic-workflow config default`
now writes every declared option explicitly into every file of the requested
scopes, each with its shipped default and an English comment naming the option,
its type and that default — the same data `config list` exposes, read from the
schema so the comment cannot drift. Operator values are preserved exactly, an
option the schema no longer declares is dropped, and an existing file is copied
to `<file>.bak-<timestamp>` before anything changes (`--no-backup` skips only the
copy). A second run changes no byte, so the operation is safe after every
upgrade. Extension files follow the installed packages through the existing
`config-extension@1` discovery, and the receipt is JSON on stdout while the
progress lines are stderr only. The `/aw-settings` console offers the same
engine with a pre-run explanation and no opt-out, the doctor reports a config
file whose key set diverges from the schema, and `init-workspace` asks once —
in the engineering interview's own bank — whether to materialize now.

Two shipped defaults the schema refused were surfaced by the operation and
repaired: `logSession.publisher` accepts `null` (the value the default and the
resolver already used), and `gitIdentity.agentGuard.mode` — retired by the guard
section in 4.10 — no longer sits in the section's default.
