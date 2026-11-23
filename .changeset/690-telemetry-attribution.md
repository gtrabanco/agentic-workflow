---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(telemetry): the runner door attributes the session, and a refusing sink is reported (issue #690)

Automatic samples never landed. The attribution gate had one door — the
slash-command registrar — while the work itself is dispatched through the
deferred tools, so a session that never typed a slash command never resolved a
unit: `build()` returned `null`, no accumulator existed, and every turn, tool and
settled run no-opped. `agentic_workflow_run` now notes its subcommand and
arguments before spawning, so `runner execute-phase 690`-shaped work attributes
the session exactly as `/execute-phase 690` does, and `AG_WF_PHASE` is set before
the child inherits the environment. A command that names no unit still produces
no sample, and a seam that throws costs the session its sample, never the command
the operator asked for.

The second half was silent by construction. `writeCurrent` swallowed every sink
failure in a bare `catch`, and the adapter resolved the configured JSONL path as
`resolve(relative, root)` — which answers with the root itself, pointing the sink
at a directory so every write failed with `EISDIR`. The project root is now the
base, so `.pi/.telemetry/sessions.jsonl` receives the sample it was configured
for, and a sink that still refuses is reported once per sink per session through
the operator's `notify` (stderr when a caller named no channel) with the writer's
own reason.
