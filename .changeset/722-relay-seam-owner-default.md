---
"@gtrabanco/agentic-workflow-schema": minor
---

feat(schema): the relay config section carries the lane seam's owner default

Adds a `relay` feature section to the unified config (issue #722): the owner's
default answer at the lane's Relay seam. `ask` keeps the question open,
`inline` preselects the inline per-phase hand-off, absent means `ask` — the
value preselects, it never skips the question or bypasses the dispatch consent
gate, so no `auto` value exists. Ships with the `RELAY_SEAMS` vocabulary,
the `RELAY_SEAM_DEFAULT` constant and the `normalizeRelaySeam` normalization,
plus the regenerated `config.schema.json` projection.
