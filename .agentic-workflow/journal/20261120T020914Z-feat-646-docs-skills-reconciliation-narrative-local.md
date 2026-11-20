## 2026-11-20 02:09 — feat/646-docs-skills-reconciliation — 646 docs + skills reconciliation

**Summary:** Applied issue #646 across `docs/**`, `skills/**`, `template/` and
`scripts/`: the repository snapshot now has a machine-read freshness contract
(`repository-state@1` + `bun scripts/repository-state.mjs`) and is re-frozen
against the tree, the B-table and D-table copies of owned rules became owner
pointers (the inline-batch exception and the default-branch wording travel with
the rule again), the AI-001 template has one home, the retired external mirror
left no citation, the package count is recomputed from the tree instead of typed,
a durable restatement sweep with a declared corpus refuses the class the audits
missed, and `docs/workflow/LOADING.md` owns the loading ladder while the guide's
machine regions moved last.

**Decisions:** the AI-001 shape lives in `docs/architecture/ARCHITECTURAL_INVARIANTS.md`
(D3); the review-authority rule lives in
`skills/unit-lane/references/ORCHESTRATE.md` (D4); the red-first UI/adapter-glue
exception is **dropped** — an exception surviving only in a copy is the defect
(D5); the stack-agnostic rule gains the host-naming carve-out it was missing
(D6); the machine regions stay inline and last rather than split into a
late-loaded file, measured and rejected.

**Files:** `docs/workflow/REPOSITORY_STATE.md`, `WORKFLOW_INVARIANTS.md`,
`GATE_INVENTORY.md`, `README.md`, `SKILLS.md`, `FEATURE_WORKFLOW.md`,
`LOADING.md`, `SKILL_CONTEXT_BUDGETS.json`, `docs/design/REDESIGN.md`,
`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, `AGENTS.md`, `template/AGENTS.md`,
the D-table skills, `skills/resolve-repository-state/references/STATE_CONTRACT.md`,
`skills/audit-docs/references/RESTATEMENT.md`, `scripts/repository-state.mjs`,
`scripts/restatement-sweep.mjs`, `scripts/reading-coverage.mjs` and their suites.

**Next:** the owner's verdict on the two open items — the `ship-roadmap.png`
deletion (R1) and the external verification of the whole change.
