## 2026-11-28T15:11:08Z — fix/755-hoisted-peer-stale — narrative
- **Commits:** 2 (`3e1fa408…f242e7e5`)
- **Files:** 10 files
- **Summary:** Applied fix #755 locally, unpublished: the durable-subagents shim now checks the resolved host against the package's declared peer range instead of trusting the extension sandbox's hoisted copy, prefers a satisfying host module over a stale one, and reports the resolved version plus the one-line bun-add repair. Frozen evidence/obligation ledgers under docs/fix/755-hoisted-peer-stale/, red suite committed before the implementation. Pre-existing failures logged, not repaired: two stale worktrees break worktree-guard, and six embed-profile/#719 cases fail on the base commit too.
