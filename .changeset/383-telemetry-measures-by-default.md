---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat: session telemetry measures by default (owner re-decision on #383)

The shipped `telemetry.enabled` default flips from `false` to `true`. The
sample stays local and anonymized by construction — no prompt text, no model
output, no diff, no file content, no remote sink — so an opt-in default cost
every project its own cost corpus for no privacy gain. `\"enabled\": false` is
now a project's explicit opt-out; the JSONL path default is unchanged
(`.pi/.telemetry/sessions.jsonl`, gitignored).

The flip also surfaced and fixed two latent defects: the extension's
`session_start` handler read `ctx.sessionManager.getSessionId()` unguarded and
crashed on a context without a session manager once the branch ran by default
(the defensive `sessionIdOf` reader the same file already owns is now used),
and the shipped-adapter test double stored one handler per event
(last-writer-wins), so a second listener on the same event silently replaced
the extension's own — a real host invokes every listener, and the double now
composes them in registration order.
