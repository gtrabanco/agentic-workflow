---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
---

fix(repo): re-point the retired-runtime citations at their shipped homes

Comments and one assertion message in the crate and the schema package still
named the scripts/ runtimes issue #524's retirement deleted — the catalog, the
unit-doc-phase helpers, the ledger annotator and the snapshot sensor; each now
names the crate module that carries the code
(`packages/agentic-workflow/src/runner/catalog.json`,
`packages/agentic-workflow/src/runner/unit-doc-phases.mjs`) — comment and
assertion-message text only: no behaviour, flag or output shape changes
(fix #538 amendment batch, S9/S12).
