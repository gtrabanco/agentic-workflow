## 2026-11-17T21:16:57Z — main — narrative
- **Commits:** 0
- **Files:** —
- **Summary:** Fixed batch-scheduler to verify claimed surfaces against actual branch diffs and mark local worktrees
- **Decisions:** Added new claimed_surface field (string[]) to batch-plan@3 schema: surfaces declared by an issue but unverified against the actual branch diff, so the operator knows which issues may have merge conflicts. Tagged [worktree] on branches with local worktrees for visibility. 87 tests pass, 0 fail. Created PR #622.
- **Next:** Wait for PR #622 (fix-621-batch-scheduler-surface-verification) to be reviewed and merged. The batch-scheduler now correctly reports unverified surfaces and local worktree presence, improving parallel planning accuracy.
