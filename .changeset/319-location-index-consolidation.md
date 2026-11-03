---
"@gtrabanco/agentic-workflow": major
"@gtrabanco/agentic-workflow-schema": major
"execute-phase": major
"init-workspace": major
"pre-execution-review": major
"triage-issue": major
"unit-lane": major
"workflow-status": major
---

feat(roadmap)!: consolidate the location indexes into `docs/ROADMAP.md`

The roadmap moves to `docs/ROADMAP.md` (out of `docs/features/`), which becomes the
workflow's single location index: `## Features` (columns unchanged), `## Fixes`
(the active-fixes index absorbed from `docs/fix/README.md`, with its status
legend and its "row removed only after the PR merges" life cycle verbatim), and
the status machine and conventions both tables follow. `docs/fix/README.md` is
now a one-line pointer stub; the `docs/fix/<issue-number>-<topic>/` SPEC folders
did not move, and no historical unit doc was rewritten.

The path is published instead of hardcoded: `@gtrabanco/agentic-workflow` exports
`ROADMAP_DOCUMENT`, `FIX_INDEX_DOCUMENT`, the two table headings, the
`roadmap-moved` code and the alias flag from `src/index-document.mjs`, and
`@gtrabanco/agentic-workflow-schema` publishes the same values from
`src/paths.ts` (re-exported from the package root). **The migration window is
closed** (decision D4): every reader resolves the published path only and
refuses a repository still carrying the pre-move one with a `roadmap-moved`
pointer at its new home — never a silent empty parse, never an empty index.
`ROADMAP_LEGACY_READ` remains as the documented rollback lever
(`AGENTIC_WORKFLOW_ROADMAP_LEGACY_READ=1` re-opens it at run time). The refusal
is a clean diagnostic on every deterministic consumer (the `agwo` CLI's `roadmap
check`, the router, the sensor, the unit cycle, the vocabulary probe, the settle
validator, the ceremony CLI and the schema snapshot), pinned by
`scripts/roadmap-moved.test.mjs` and the schema's own `machine-contract` suite.

The schema package's published canonical vectors are re-blessed for the one
fixture payload that cited the pre-move path (plan-stage receipt, finding F-1's
evidence ref): a declared contract-data change, not a serializer change.
