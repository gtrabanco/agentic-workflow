---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(auto-log-session): one mechanical journal entry per session, off by default

The pi package can now append the session's git facts to the project's
`docs/LOGS.md` on shutdown — branch, commit count and range, the paths the session
touched, and why it ended. Nothing else: no model runs, no prose is invented, and
no prompt text, model output or file content enters the entry. `autoLogSession`
is `off` by default, a missing journal means the project never opted in, and the
marker (`.pi/.session-<id>.start`) is only ever read back by the session that
wrote it, so a crashed session's marker is never adopted.

The entry's bytes have exactly one owner: `@gtrabanco/agentic-workflow`'s
`src/log/render.mjs`, reachable without a session through the new
`agentic-workflow log render --facts <path|->` command (JSON on stdout, `--raw`
for a byte diff, exit 2 on a refused payload). A test runs
`template/.claude/hooks/log-session-end.sh` in a throwaway repository and diffs
the bytes it appends, so the pi writer and the template hook cannot drift.

Publishers are a Strategy over the same frozen `log-facts@1` payload: the local
append ships, and an operator-declared argv (`autoLogSession.publisher.command`,
facts JSON on stdin, bounded by `timeoutMs`) reaches an HTTP endpoint, a queue, a
path outside the repo or a log sink without a client in this package. The local
entry is written first and always kept; a failing publisher is reported and
forgotten, never retried, never blocking a shutdown. The switch is independent of
`telemetry.enabled`: either can be off without costing the other.
