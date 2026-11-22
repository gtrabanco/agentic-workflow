---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(678): the deferred tools answer pi's tool call, and run in the session's project

The six deferred workflow tools were registered as the package's Pi-free specs,
whose `execute(params, cwd)` is not the signature pi calls:
`execute(toolCallId, params, signal, onUpdate, ctx)`. The toolCallId arrived as
`params`, so the five params-reading tools threw their own argument check on
every call, and `agentic_workflow_status` — which reads no params — forwarded a
non-path argument as its cwd and silently sampled `process.cwd()`, reporting
another project's counts as the session's. The adapter now performs the
translation at the one registration site: a host tool receives its real params
and runs in `ctx.cwd`. The sensor no longer falls back to the process cwd —
an unreadable project is a `sensor-degraded` refusal naming the path.
A wiring suite calls every tool the way the host does, and the shipped entry's
assertion pins the five-argument arity, so a signature regression turns red
instead of shipping.
