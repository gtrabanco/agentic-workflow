## Crash recovery (run every invocation)

A driver process can die mid-turn; on restart, the persisted state it holds is
a **hint, never a source** — everything below is recomputed from git, the
forge, and the docs. Nothing is cleaned up here (read-only stands): this
section *classifies*; the resume command it recommends does the acting.

**Checklist:**

- ✓ **Working tree per unit branch.** A dirty tree (`git status --porcelain`)
  or unpushed commits on a `feat/*`/`fix/*` branch → interrupted-turn
  candidate. Cite branch + files. Checking unpushed commits: **first check
  the branch has an upstream** (`git rev-parse --abbrev-ref <branch>@{u}` —
  non-zero exit = no upstream). No upstream → **every commit on the branch is
  unpushed by definition**, don't run `git log @{u}..` (it errors with
  `fatal: no upstream configured`, which is exactly the mid-crash
  never-pushed case, not an error to surface). Has an upstream → use
  `git log @{u}.. --oneline` / `git status -sb` as usual.
- ✓ **Phase-ledger coherence.** Compare the unit's `progress.md`/`TASKS.md`
  against the branch's actual commits: commits after the last closed phase
  entry, or ticked tasks with no matching commit, are cited as evidence.
- ✓ **Hint envelope (optional).** With `--last-envelope <json|path>`, diff the
  caller's persisted envelope against the recomputed state and report the
  divergence in one line. The hint never overrides recomputed state.
- ✓ **No-progress guard (optional, requires `--last-envelope`).** When the
  hint's `next.recommended` was `/plan-feature <slug>` or `/design-feature
  <slug>` for a given unit, and this run's own recomputed status for that
  **same unit** is still at the **same pre-advance status** the hint expected
  to move it off of (`defined` for a `/plan-feature` hint; `idea` for a
  `/design-feature` hint) — either the recommended command ran but its status
  write was dropped, or it never ran at all; this guard cannot distinguish the
  two from the envelope alone, so the note names it as a **suspected** stall,
  not a confirmed dropped write. Emit a `workflow_observations` note (see
  `## Machine envelope` for the exact note shape). This is strictly additive:
  the same `next.recommended` /
  `next.tier` still fire per the normal classification (step 6) — the guard
  only stops the silent, bland repeat by making the stall visible. Still
  read-only: no write, no repair, no new persistence.

**Classification (decision table — every row independently checkable; first
matching row wins per branch):**

| Evidence | Verdict |
|---|---|
| Clean tree, ledger coherent with commits | `CLEAN` |
| Dirty/unpushed on a unit branch AND the ledger points to a unique next task/phase | `RESUMABLE` — resume command: `execute-phase <NN> <phase>` |
| Dirty/unpushed AND ledger contradiction (ticks ahead of commits, unknown branch, detached HEAD) | `AMBIGUOUS` — a human looks first |

**Return exactly (appended to the report):**

```
CRASH RECOVERY — verdict: CLEAN | RESUMABLE | AMBIGUOUS
| Branch | Evidence | Classification | Resume command |
|---|---|---|---|
| <branch> | <dirty: n files; ledger: <state>> | RESUMABLE | execute-phase <NN> <phase> |
Hint envelope: matched | diverged: <one line> | not provided
```

(`CLEAN` with no unit branches in play → the table body is a single
`| — | clean tree, coherent ledgers | CLEAN | — |` row.)

**Multiple unit branches, multiple verdicts → one envelope `state` (fixed
precedence, worst wins):** `AMBIGUOUS` > `RESUMABLE` > `CLEAN`. A human
decision pending on ANY branch outranks a mechanical resume on another, which
outranks an all-clean state. The report's per-branch table still lists every
verdict; only the envelope's single `state` is reduced to the worst one.
