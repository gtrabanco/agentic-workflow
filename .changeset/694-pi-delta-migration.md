---
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": minor
---

feat(pi): retire the picker filter reimplementation and adopt the 1.2→1.6 host surfaces

Pi host delta (1.2 → 1.6): the settings pickers narrow through pi-tui's public `fuzzyFilter` — case-insensitive, best match first — and the package's own subsequence filter is deleted with no shim; the trailing `/` still constrains the list to a provider, now case-insensitively. Both Pi packages ship a versioned `CHANGELOG.md` behind `pi.changelogPath`, written by the release cut, so *Extension Updates* has something to show. The settings picker overlay passes the host's `blocked` option (OSC 7501), the NaN preset documents the `models.json` `$schema` and `compat.*` channel beside the recorded `max_completion_tokens` workaround, and the README's verified baseline is re-pinned to the host this release was checked against.
