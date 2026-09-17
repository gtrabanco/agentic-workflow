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
