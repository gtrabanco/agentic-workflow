---
"@gtrabanco/agentic-workflow-schema": patch
"audit-docs": patch
"execute-phase": patch
"phase-contract": patch
---

docs: repair the retired-skill residue an audit sweep found

A `/audit-docs` sweep over the docs tree found live surfaces still naming the
skills feature 61 P8 retired. The bootstrap prompt re-lists six of them as the
set to create (they are catalog steps now: design, plan, review, evidence); the
executor's preflight told the writer to load a skill that no longer exists (the
bounded pre-write mapper it owns); the authoring reference's smoke-test set and
hand-off examples named `plan-feature`/`plan-fix`; and `phase-contract` cited a
retired skill's reference file for the replan-append exemption. The authoring
reference also stopped asserting per-skill `model`/`effort` frontmatter — no
skill pins a tier, so the tier comes from the invocation.

Roadmap hygiene from the same sweep: three rows whose issues were closed as
absorbed into `#410` now read `folded → 109` instead of `idea`
(`docs/ROADMAP.md`), the `## Fixes` legend covers a registered-but-untriaged
row, and row 83 records the one direction row that legally carries a pre-triage
draft. The guide now states the owner-applied inline batch as the single
exception to the branch/PR rule (`AGENTS.md`).
