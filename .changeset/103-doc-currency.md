---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
"@gtrabanco/pi-agentic-workflow": patch
"audit-docs": patch
"unit-lane": patch
---

docs(readme): repair the READMEs against what shipped, and require the check

Documentation currency: repair the READMEs against what shipped, and make the check required

The root `README.md` and the three package READMEs are repaired against the tree
(the runner crate and its `doc` retrieval index are documented for the first
time; retired `plan-feature`/`plan-fix` examples, the two-package count, the
fix-index-README pointer, the independent-version claim and the duplicated
`log-session` row are gone), the guide states the documentation-currency rule
with its scaffold twin, the lane's `docs` step carries it as required checklist
items, and `audit-docs` gains check 15 (`n/15`) auditing it.
