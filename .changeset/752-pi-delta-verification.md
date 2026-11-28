---
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": patch
---

feat(pi): re-pin the verified baseline to Pi 1.7.0 and declare the dialogs' blocked kind (issue #752)

The delta verification covers Pi 1.6.1 and 1.7.0 for both packages: the two-leg
`tsc --noEmit` (peer floor 1.1.0 and `latest` at 1.7.0) is clean, the event
catalogue is unchanged at 41 events, and the README's single dated baseline is
replaced with `Pi 1.7.0 (2026-11-28)`. The peer floor stays `>=1.1.0`.

Pi 1.6.1 taught `ctx.ui.select()`, `confirm()` and `input()` to report the kind
of blocked program status (OSC 7501) they wait for. The settings seam now
carries that kind and the adapter forwards it, and the console states its own
intent instead of inheriting the host default: every prompt reports `question`,
and the dialogs that authorize a write or destroy a draft report `permission`
explicitly. `Add another?` was the one prompt the host default would have
rendered as a permission request.

The preset's README records the 1.7.0 diagnostics fix beside its `models.json`
compatibility channel: a malformed file is now reported as a warning in print,
JSON and RPC modes, so a headless run names the parse error instead of only
`No API key found`. The three capabilities this delta routes to other owners
(cache-preservation re-measure, `after_provider_response` HTTP error visibility,
`--agent-dir` / OSC 7577) are recorded as decisions and not implemented here.
