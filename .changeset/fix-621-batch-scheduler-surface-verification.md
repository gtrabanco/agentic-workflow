---
"@gtrabanco/agentic-workflow-schema": patch
"batch-scheduler": patch
---

fix(batch-scheduler): verify claimed surfaces against branch diffs and mark local worktrees

- New field `claimed_surface` (string[]) in batch-plan@3: surfaces declared by
  an issue but unverified against the actual branch diff. A merge conflict is
  possible when the surface is broader than the actual changes.
- `surfaceKeyFor(file)`: inverse of surfaceKey, maps a file path to its
  surface key for the cross-reference pass.
- `inFlightEvidence` now tags branches with `[worktree]` when a local
  worktree exists for that branch.
- Human summary prints a deduplicated claimed-surface section so the operator
  sees which issues carry unverified surfaces before merging.
- 3 new tests (CS) cover partial-coverage, no-branch, and full-coverage cases.

Addresses batch-scheduler issue #621 follow-up.
