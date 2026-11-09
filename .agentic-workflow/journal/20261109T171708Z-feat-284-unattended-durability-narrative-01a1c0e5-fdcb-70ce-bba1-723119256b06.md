## 2026-11-09T17:17:08Z — feat/284-unattended-durability — narrative
- **Commits:** 7 (`9c40e590…e479fec0`)
- **Files:** 26 files
- **Summary:** Complete #284 unattended durability (P1 + P2 spike) and open PR #485
- **Decisions:** P1: conductor writes run boundaries (run/start · run/stop), advance --resume reconciles from the sensor's crash_recovery verdict, --print-supervisor renders a POSIX operator restarter; all tests green (55 pass, 0 fail on change-affected suites), deterministic gates PASS. P2: spike a durable-task driver on pi-durable@1.5.0, killed twice with real SIGKILLs, resumes without a human; verdict REJECT (defer) — mechanism validated but substrate still explicitly experimental, 92 deps, token half unmeasurable without a provider. Worktree diagnosed as corrupt but no repair was needed (backup taken at /tmp/aw284-backup-20261109T160448); the only blocker was node/npm missing from PATH for the pre-push gate.
- **Next:** PR #485 (Closes #284) review and merge
