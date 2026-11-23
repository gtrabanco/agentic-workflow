# Decisions — fix/693-worktree-prune-guard

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/worktree-prune-guard.test.mjs | P2 | 2026-11-23 | execute-phase | One assertion's matcher is repaired, never relaxed: it built `new RegExp("PRUNE " + path.basename(path))`, and once the guard prints the full candidate path — the path the deny message must name, since `git worktree remove` takes one — a basename inside a longer path cannot match under a regex's `/` boundary. The replacement asserts the stronger fact (`stdout.includes(`PRUNE ${vanished}`)`, the whole path), so the property it proves is unchanged and its input is broader, not narrower. The other ten cases keep their exact expectations.
justification | scripts/findings-corpus.test.mjs | P4 | 2026-11-23 | execute-phase | The tree's frozen finding count follows the tree, not a contract: this unit appends one OPEN row (F1) to its own unit doc, so `corpus.findings.length` moves 1164 → 1165. That is the same mechanism the suite documents at its own `reviewMarks` line 190 ("a unit that records one raises it"), and the fixture cases and every other pinned count are untouched.
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

## D2 — the guard never targets a worktree (corrected 2026-11-23)

`git worktree prune` reclaims administration metadata for a registration whose
directory is already gone, and the guard's candidate list is built from absent
directories only, so no policy value — `allow` included — can make the guard
*aim at* a working tree; the suite pins that with a planted uncommitted file
outside the admin namespace. Superseded clause: the first cut asserted the
absolute "a present tree … is untouched" — falsified for `.git/worktrees/`
layouts by the external-verify B1 reproducer (a stray checkout there is deleted
recursively by git's own prune, live tree included; PE-007). What the guard
cannot promise, the docs state instead of hiding: the protection for that
layout is `IR8`/`ADMIN_NAMESPACE`, never the policy.

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

## D5 — dispositions the correction batch leaves on record (2026-11-23)

- **S1** (`Apply to this repository: issue #693`) — disposition: `fulfilled`, no
  task carries `(Implements: S1)` because the request *is* this unit; the PR
  (#699) carries it against `main`. Recorded dated so the completeness check
  resolves S1 without inventing a task.
- **A3's `--json` half** — the envelope keeps `{policy, candidates, pruned,
  verdict}`; AC2's refusal text is printed on stderr (printed, not "in the
  envelope"). No field is added.
- **A5's count clause** — "the six ordered steps" stays dropped: a restated
  count is prose debt, and `docs/workflow/WORKTREES.md` still documents six
  steps. The read-first trigger that shared the sentence was restored to
  AGENTS.md in this batch.
- **A6** — `normative-drift`'s four failures are the pin watch's, identical on
  an untouched `origin/main` archive; not this unit's to repair.
