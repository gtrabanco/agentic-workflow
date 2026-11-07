---
"unit-lane": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(unit-lane): model memory is never tier-0 — the journals record provenance and the ceiling is enforced by the pinned suite

Fix #432, slice 1 (prose rule + journal grammar). The design step's `sources.md`
journal grows a `provenance` column over the closed set `repository /
version-pinned doc / owner answer / model memory`, owned once in DESIGN.md next
to the no-assumption rule it evidences: a `model memory` row carries `inferred`
at best — never `confirmed`, and never tier-0, because it does not settle a
claim. An external implementation-detail claim (CI schema, tool flag, API
version, shell syntax) verifies against the version the project actually pins
before it guides a task, carried as a one-fetch receipt in the research/design
evidence row, with the deterministic checks preferred as scripts (actionlint,
schema validation, type-check — #359's migration). PLAN.md's `CLAIM-*` table
journals the same columns under that owner, and RESEARCH.md gains the
repo-answered exit: a descriptive question the repository answers skips
external research and its receipt names the claim and the `path:line`, while a
normative question never closes on precedent.

The `model-memory-provenance` gate lands as a prose row of
`prose-gate-inventory@1` (stay-reason `judgment-needed`; the scripted half is
the deferred second slice), and the adopted papers are attributed in
`docs/research/ATTRIBUTION.md`.
