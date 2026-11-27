---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(pi-agentic-workflow): the /log-session hand-off speaks the runner door's call shape

The extension's /log-session directive rendered `"subcommand": "journal write"`
and `"subcommand": "session-close close"` as single spaced strings. The runner
door forwards `subcommand` as one argv token, so the crate received a literal
service name with a space and refused with `Unknown service: journal write`.

The directive now renders the service and the operation separately —
`"subcommand": "journal"` with `"args": ["write", …]` and
`"subcommand": "session-close"` with `"args": ["close"]` — and the
`runner-mapping@1` block states the rule, so a packaged session reads the same
contract the emitter follows. A case renders the invocation and runs it against
the crate in a fixture, so the seam cannot drift silently again.

- Resolves: #734
