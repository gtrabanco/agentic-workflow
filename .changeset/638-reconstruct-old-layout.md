---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(telemetry): `telemetry reconstruct` walks both of Pi's store layouts and the ledger keys one row per session on the session id (issue #638)

Discovery read only the new layout (flat `.jsonl` beside the session
directory) and missed the old one (nested `<run>/session.jsonl` under the
session directory) — which a real store sweep showed holds only spawned
subagents, so the fix walks it and excludes what it marks: a `session_info`
name prefixed `subagent-` before the first message, wherever the transcript
sits, beside the artifact-name check the new layout already had. The old
layout never persisted an operator transcript, so nothing operator-side was
recoverable from it — the walker exists so the store's other half is read,
not guessed at.

The ledger's one-row-per-session guard compared the raw `source` string, so a
session reconstructed as `pi:reconstruct=<id>` that later flushed live as
`pi:session=<id>` appended a second row for the same session. The guard now
keys on the session id after either producer prefix (`sessionKeyOf`, re-homed
to `src/telemetry/ledger.mjs` as the grammar's owner), and a live emission
replaces the row a reconstruction wrote. `reconstruct.mjs` re-exports the
helper, so the module's published names are unchanged.
