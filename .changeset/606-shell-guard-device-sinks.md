---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(606): skip virtual device sinks in the shell write guard

The #567 shell write guard judged every literal redirect operand by
containment, and a device sink resolves outside any project root by
construction — so `> /dev/null 2>&1`, the shape nearly every bash call ends
with, fired the `path protection` approval prompt in a UI session (with its
3-minute auto-cancel) and blocked the call outright headless. `decideShellWrite`
now skips the virtual device sinks the issue names — `/dev/null`, `/dev/zero`,
`/dev/full`, `/dev/stdin`, `/dev/stdout`, `/dev/stderr`, `/dev/tty` and
`/dev/fd/*` — on the lexically normalized absolute path, before the call is
resolved: their write is discarded or routed to a stream the session already
owns, and the `/dev/std*` names are `/proc/self/fd/…` symlinks the fail-closed
resolver cannot canonicalize. A real durable out-of-root target in the same
command still blocks headless and still asks the owner, and the approval prompt
now names it instead of the sink. Nothing else in the verdict moves: the temp
carve-out, the in-root Tier 2 hand-off, the headless/interactive posture and the
dynamic-target boundary are unchanged, and `analyzeShellWrite` keeps reporting
the operand it exposes.