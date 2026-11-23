---
"@gtrabanco/agentic-workflow": patch
---

feat(693): gate worktree prunes behind `aw.worktreePrunePolicy`

`scripts/worktree-prune-guard.mjs` reads a closed policy vocabulary from git
config and gates a `git worktree prune` with it: `deny` (the absent-key and
unrecognised-value default) refuses with exit 1 naming `git worktree remove
<path>`, `ask` prompts with the real candidate count and proceeds only on an
affirmative answer, `allow` delegates and returns git's status.
`worktree-guard --prune` routes its prune through the guard, so one policy
governs the workflow's own prunes; the gate's audit step invokes the guard
without `--prune`, so the push path is unchanged.

Git offers no interception point for the `worktree` builtin — an
`alias.worktree` entry never runs and no `prune` hook exists — so the policy
binds the prunes that go through the guard rather than pretending to catch a
hand-typed one. `git worktree lock` is what protects a worktree from `git gc`'s
automatic prune, and a prune reclaims metadata only for a directory that is
already gone: a present tree and its uncommitted files are never touched, which
the suite pins with a planted uncommitted file.
