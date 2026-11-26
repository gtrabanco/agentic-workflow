## 2026-11-26T20:41:33Z — feat/727-machine-ledger-auto-commit — narrative
- **Commits:** 25 (`936299bd…51bd470e`)
- **Files:** 55 files
- **Summary:** Issue #727 applied inline: machine-owned ledgers commit by machinery (pi teardown, crate  CLI, gate prelude), box 5 exempts the declared class from dirty-tree,  gains its exit state — PR #731 opened against main.
- **Decisions:** The machine-ledger class has one crate owner; the pi extension spawns the CLI (no second git implementation); the gate's commit is a prelude (sequential, before the pool) not a step (concurrent, would race suites reading the same bytes); no new schema vocabulary published (nothing consumes the class token-by-token); the worktree wipe at 16:18 UTC was disclosed, not guessed.
- **Next:** External verification of PR #731 (git diff main..HEAD, unit doc ## Log, the two base-reproduced reds) then merge; route  count pin (1173 vs 1178) and  suite bound (280s > allowlisted 240s) to their owners; investigate which prune removed two live worktrees mid-session.
