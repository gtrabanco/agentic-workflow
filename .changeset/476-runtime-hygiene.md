---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat: runtime-hygiene guards — temp-leak floor, /tmp GC, worktree audit, test timeouts (issue #476)

A real incident saturated `/tmp` with 494k files and blocked pi-web: a hung
`bun test` at 6.4 GB, 14 test suites creating temp dirs with zero cleanup
capability, and worktrees left behind by finished sessions — some with severed
`.git` links. Four guards land. The static floor (`scripts/temp-hygiene.mjs`,
new offline gate step) makes any file that creates temp dirs without `rmSync`
or the tracked `tempRoot` helper (`scripts/temp-root.mjs` — exit-hook cleanup
that survives a failed or killed run) a red push. The runtime backstop
(`scripts/tmp-gc.mjs`, also an offline gate step) sweeps TMPDIR, `/tmp` and
`/var/tmp` for entries whose names start with a prefix the repository's own
sources declare, older than the age bound — never a fresh directory, never an
undeclared name, never a filesystem root. The worktree audit
(`scripts/worktree-guard.mjs`, offline gate step) flags corrupted links
(`CORRUPTED` — repaired non-destructively with `git worktree repair`, never
pruned: git reports a severed link as `prunable` and a naive prune destroys
the recovery path), vanished directories, worktrees outside the legal home,
detached HEADs and clean worktrees on merged branches (`--prune` removes the
clean ones, skips dirty ones, never deletes a branch). Every bun and node test
path carries a 60 s per-test timeout — the root gate's node leg via
`--test-timeout`, the two packages' `test` scripts via `bun test --timeout` —
so a hung test dies instead of eating the machine. The 14 leak-capable suites
moved onto `tempRoot`; `UnitDoc.mjs` drops its dead `mkdtempSync`/`tmpdir`
imports.
