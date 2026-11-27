---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": patch
---

feat(config): read JSON5, resolve configs by stem, create `.json5` (issue #740)

Every config file is read as JSON5 — identifier keys, single-quoted strings
with the ES5 escapes, hex and leading/trailing-dot numbers, a leading `+`, and
`Infinity`/`NaN` — through the one hand-written parser, which keeps its
line/column reporting and its strict end-of-input check (`#521` D1). The writer
stays standard JSON, so a value only JSON5 can spell is refused by the validator
(`must be a finite number`) instead of being silently written as `null`.

A config is now located by stem: `<stem>.json`, `<stem>.jsonc` or `<stem>.json5`,
the first existing candidate winning silently. The config CLI store, the pi
package loader, `gitIdentity`, the doctor's divergence probe and extension
drop-in discovery all use the one resolver; a write stays in the file that
already exists and a new file is created as `<stem>.json5`.

Breaking for consumers of the published vocabulary: `BASE_CONFIG_FILE` becomes
`BASE_CONFIG_STEM` (the identity is the stem, never a file name) and a
`config-extension@1` descriptor's `file` must be a bare stem — a `.json`-suffixed
value is refused with that rule. No compatibility shim is kept.

A config that parses but no longer matches the schema degrades at load: an
unknown key or section and a value that no longer validates are dropped and the
shipped default fills in; only a file that does not parse refuses. `config
validate` and the doctor's divergence report are the on-demand trail, and
`config validate --sanitize` now drops invalid values as well as unknown keys.

This repository's own config moves from `.json` to `.jsonc` to exercise the
middle extension. The `pi-nan-agentic-workflow` companion's README and its
phase-batching command comment narrate the same stem identity (docs only).
