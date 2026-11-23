# Decisions — fix/693-worktree-prune-guard

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/worktree-prune-guard.test.mjs | P2 | 2026-11-23 | execute-phase | One assertion's matcher is repaired, never relaxed: it built `new RegExp("PRUNE " + path.basename(path))`, and once the guard prints the full candidate path — the path the deny message must name, since `git worktree remove` takes one — a basename inside a longer path cannot match under a regex's `/` boundary. The replacement asserts the stronger fact (`stdout.includes(`PRUNE ${vanished}`)`, the whole path), so the property it proves is unchanged and its input is broader, not narrower. The other ten cases keep their exact expectations.
```

## D1 — the policy binds the workflow's own prunes, and locking is the prevention

Git offers no interception point for `git worktree prune`: it is a builtin
(`alias.worktree` never runs — measured) and no `prune` hook exists among git's
documented hooks. The issue's two proposed mechanisms therefore cannot be built,
and this unit ships neither. What ships is the policy vocabulary the issue
specifies (`aw.worktreePrunePolicy` = `deny`/`ask`/`allow`), enforced on the
invocations that go through the guard — the workflow's own, routed from
`worktree-guard --prune`. A prune typed by hand elsewhere is not intercepted,
and the documentation says so instead of promising a wall that is not there.

## D2 — the guard is not a worktree remover

`git worktree prune` reclaims administration metadata for a worktree whose
directory is already gone; a present tree, its uncommitted files included, is
untouched (measured). The guard's candidate list is built from absent directories
only, so no policy value — `allow` included — can turn it into a remover. That is
the invariant the suite pins with a planted uncommitted file.

## D3 — `ask` honours a piped answer and refuses only when nothing can answer

A script or a CI job says yes by piping `y` to stdin, so `canPrompt()` treats a
readable stdin as an answer. Only the explicit `WORKTREE_PRUNE_GUARD_NO_TTY=1`
refuses, which is how the no-answer path is proved deterministically. Refusing on
`isTTY` alone would have made the guard unusable from the very automation the
policy exists to protect.

## D4 — no unified-config key

`aw.worktreePrunePolicy` is a git config key read by this repository's own
scripts, not a feature key of the workflow's unified config
(`docs/workflow/CONFIG.md` governs package-level keys with a runtime consumer).
No package reads it, so adding it to the unified config would ship a key with no
consumer — the config policy's own prohibition.
