# 460 — batch scheduler verification · planning evidence

One row per Engineering claim the change rests on. Column order and
vocabularies owned by `skills/pre-execution-review/references/LEDGERS.md`.
`freshness`: when the claim was last verified against its source.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | Four gaps are real and evidence-backed: no lifecycle delta, no triage-readiness signal, cross-lane soft deps invisible, prose parser fails open (observed 2026-11-08 relaying a live plan over 24 open issues; the #307 false-findings case and the #441 case are named in the issue) | issue [#460](https://github.com/gtrabanco/agentic-workflow/issues/460) body | read 2026-11-09 (this session) | O1–O9; the whole change |
| PE-002 | committed-source | The schema package's core is closed and mandates a version bump when a core field is added ("adding or changing a core field bumps this") — so S2–S4's new fields force `batch-plan@2` | `packages/agentic-workflow-schema/src/batch-plan.ts` header + `BATCH_PLAN_VERSION` | read 2026-11-09 (this session) | D1; O10 |
| PE-003 | committed-docs | The roadmap `## Fixes` row's third column is the status machine (`idea → defined → planned → in-progress → done`), and "a unit is executable only once the lane's triage produced its Tasks (`planned`+)" — the triage signal's location for S3 | `docs/ROADMAP.md` §Status legend + §Conventions | read 2026-11-09 (this session) | D3; O4, O5 |
| PE-004 | committed-source | Degradation entries are constrained to `unavailable-<source>-<cause>` (`^unavailable-[a-z0-9-]+$`), so S5's degradation must name the issue inside the cause segment | `packages/agentic-workflow-schema/src/batch-plan.ts` (`DEGRADED`) | read 2026-11-09 (this session) | O8 |
| PE-005 | committed-source | `extractProseDependencies` has exactly one consumer — the batch scheduler itself; fail-closing it changes no other surface | `rg -ln 'extractProseDependencies' scripts/ skills/ packages/` → `scripts/batch-scheduler.mjs` + its suite only | verified 2026-11-09 (this session) | O7, O8 |
| PE-006 | committed-source | The crate mirror (`packages/pi-agentic-workflow`) does not read the batch-plan contract, so the schema change needs no crate edit | `rg -l 'batch.plan' packages/pi-agentic-workflow/src` → no match | verified 2026-11-09 (this session) | O10 |
| PE-007 | committed-source | The Fixes table has no deterministic emitter — the unit-449 evidence (its PE-006) and `scripts/docs-generate.mjs`'s emitters (feature/fix pages, not the index table) — so the `#460` row's status is hand-edited, as unit 449's O16 recorded | `scripts/docs-generate.mjs` emitters; `docs/fix/449-batch-scheduler-sensor/planning-evidence.md` PE-006 | re-verified 2026-11-09 (this session) | O13 |
| PE-008 | committed-source | Baseline green at the cut head `6f5d5453`: `bun test scripts/batch-scheduler.test.mjs` (28 pass) and `cd packages/agentic-workflow-schema && bun run test` (775 pass) — the regression floor the change must hold | this session's baseline run (§0) | run 2026-11-09 (this session) | O11, O12, O14 |
