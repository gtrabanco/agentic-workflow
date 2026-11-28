# Sources — 634-claim-staleness-projection

Plan claim sources. Written by the plan step's investigate/orient stages. The
`staleness` column is written by the pre-execution snapshot sensor's `claims` op
(issue #634) — never by hand.

<!-- sources:start -->
| id | claim | source | provenance | certainty | staleness |
|---|---|---|---|---|---|
| CLAIM-001 | The git evidence a claim-staleness projection needs already exists: `changedBoundPaths(gitRun, revision, paths)` answers which of a set of paths differ between a recorded revision and the worktree, uncommitted and untracked included | `packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs:193` | repository | confirmed | |
| CLAIM-002 | A recorded phase is a `## Log` `P<n>` line and it carries the phase's commit sha, so a phase→revision map is readable without a second parser | `packages/agentic-workflow/src/runner/unit-doc-phases.mjs:327` | repository | confirmed | |
| CLAIM-003 | The claim ledger's table is `id \| claim \| source \| provenance \| certainty`, owned by the lane's design reference, with no cell-count pin and one reader that skips width-mismatched rows | `skills/unit-lane/references/DESIGN.md` | repository | confirmed | |
| CLAIM-004 | The `certainty` cell carries a meaning that survives a rotten citation (`confirmed` / `inferred`), so staleness is an independent axis and cannot share that cell | `skills/unit-lane/references/DESIGN.md` | repository | confirmed | |
| CLAIM-005 | Adding an op to an existing subcommand needs no usage-line or README-token change, because the surface suite pins only the top-level subcommand list | `packages/agentic-workflow/test/cli.surface.test.mjs` | repository | confirmed | |
| CLAIM-006 | A `spec-by-reference` unit doc requires its own section set and tolerates `## Acceptance criteria` as a shared section, so this unit can carry criteria without a re-cut | `packages/agentic-workflow-schema/src/pre-execution.ts:253` | repository | confirmed | |
| CLAIM-007 | Issue #634 is open under `postponed` with three un-fired triggers; the owner waived the gate rather than claiming one fired | `docs/features/634-claim-staleness-projection/decisions.md` | repository | confirmed | |
| INV-001 | The `build`, `verify` and `contract` ops keep their behaviour and exit contracts: the new op is additive and no existing reader changes | `scripts/pre-execution-sensor.test.mjs` | repository | confirmed | |
| INV-002 | The projection never blocks: `--check` answers an exit code a caller may honour, and no gate in this tree depends on the op | `docs/features/634-claim-staleness-projection/SPEC.md` | repository | confirmed | |
| INV-003 | Writing the mark is idempotent and confined to one column: a second run is byte-identical and prose outside the CLAIM/INV tables is untouched | `docs/features/634-claim-staleness-projection/SPEC.md` | repository | confirmed | |
| INV-004 | The mark vocabulary is runner-internal, so it ships as a frozen const in its own module and adds no schema const, mirror or parity pin | `docs/architecture/ARCHITECTURAL_INVARIANTS.md` | repository | confirmed | |
| INV-005 | #444's risk-scoring signal stays out of this unit: #444 is open and `postponed`, so S3 ships nothing and the deferral carries a re-trigger | `docs/features/634-claim-staleness-projection/known-issues.md` | repository | confirmed | |
<!-- sources:end -->
