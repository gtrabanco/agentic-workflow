# Progress — 55-executable-golden-fixture

Ledger of stage receipts and gate traces for this unit. One receipt per review.

## Pre-execution review receipts

### spec — 2026-09-16

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-55-20260916-1 · Snapshot: 48f3977ae8ff4fb85ec489ed1b6b54b5b6fef9dadb78ef3793c5af1ecccb4cb7 · Verdict: spec-review-fail
- Unit: 55-executable-golden-fixture · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 83726ab37e437030f0ea6b02699acb9cdbeab8e2 · Artifact revision: 83726ab37e437030f0ea6b02699acb9cdbeab8e2
- Reviewer: review-spec · Session: 01a0aca3-201c-7302-a9d2-ceaae2a3b8f6 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-16T23:52:46Z/2026-09-16T23:59:30Z · Findings: 5 (material open: 3)
```

Snapshot built by `scripts/pre-execution-snapshot.mjs build --stage spec --unit
55-executable-golden-fixture` (in-repo canonical serializer over the
`@gtrabanco/agentic-workflow-schema` package resolved from the in-repo
`packages/agentic-workflow-schema/dist`). The builder derived both
`sourceRevision` and `artifactRevisionId` from the newest commit that touched a
bound path (`83726ab3`, the commit that last wrote `SPEC.md`); the design
handoff named no explicit artifact revision, so the derived sha is the record.
The snapshot bound one artifact (`spec` → `SPEC.md`, selector
`spec-product-v1`, 23005 bytes, sha256 `90fa6256…`) and three contexts:
`project-guide` present (`CLAUDE.md`), `normalized-repository-state` present
(`docs/workflow/REPOSITORY_STATE.md`), `architectural-invariants` absent
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
The roadmap row is routing data and is deliberately unbound. Findings rows for
this snapshot: `planning-findings.md` (`SPEC55-F1`…`SPEC55-F5`).

### spec — 2026-09-17

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-55-20260917-2 · Snapshot: 20b088bc4b28997a2ade6fb700c78e08284b610c43b392121f53f4e41a11aa0e · Verdict: spec-review-fail
- Unit: 55-executable-golden-fixture · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 98d8e6a4b66b27a43c14ffe2675f22528fad3434 · Artifact revision: 98d8e6a4b66b27a43c14ffe2675f22528fad3434
- Reviewer: review-spec · Session: 01a0ae4a-b667-7302-a9d2-ceb238cb36a4 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T07:35:27Z/2026-09-17T07:45:00Z · Findings: 5 (material open: 4)
```

Snapshot rebuilt by `scripts/pre-execution-snapshot.mjs build --stage spec --unit
55-executable-golden-fixture` (in-repo canonical serializer over
`@gtrabanco/agentic-workflow-schema`). The builder derived both revisions from
the newest commit that touched a bound path (`98d8e6a4`, the repair batch that
last wrote `SPEC.md`); the ledger commit `42d094ab` touched only unbound files.
The snapshot bound one artifact (`spec` → `SPEC.md`, selector `spec-product-v1`,
24147 bytes, sha256 `1807294d…`) and three contexts: `project-guide` present
(`CLAUDE.md`), `normalized-repository-state` present
(`docs/workflow/REPOSITORY_STATE.md`), `architectural-invariants` absent
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
Roadmap row 55 is routing data and is deliberately unbound. Second cycle:
`CONVERGENCE-ANOMALY` printed in the review report (repair 1 closed SPEC55-F1…F5
but left the AC5/run-log contradiction and two producer-lineage slips). New
findings rows: `SPEC55-F6`…`SPEC55-F10`.
