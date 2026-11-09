---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(config): unified config file schema, CLI/API and the config-extension plugin contract (issue #427)

The package config is no longer scattered across unrelated files. The base
`agentic-workflow.json` holds the cross-tool feature sections (`logSession`,
`memory`, `telemetry`, `guards`, `advance`, `pathProtection`) and each package
publishes its own extension section and file (`pi-agentic-workflow.json` for the
pi adapter) through a discoverable `config-extension@1` descriptor. Resolution
is fill-in-the-gaps: project over global, shipped defaults only for keys the
operator left undefined, JSONC accepted, unknown keys refused and never merged.

`agentic-workflow config` (library API included) exposes `get`, `set`, `list`,
`show`, `validate` (`--sanitize`, `--no-warn-unknown`), `init` and `reset` over
both scopes, validates against the schema before every write and never coerces.
`config.schema.json` is generated from the same section descriptors the runtime
validator uses.

`autoLogSession` is replaced by the boolean-like `logSession`; routing and
profile keys keep their names but now live in the pi section/file. The
migration table is in `docs/workflow/CONFIG.md`.
