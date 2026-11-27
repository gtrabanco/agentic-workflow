## 2026-11-27T13:24:37Z — fix/734-log-session-subcommand-shape — manual
- **Commits:** 23 (`a494681e…20329b82`)
- **Files:** 22 files
- **Summary:** Debugged recurring Engram config-invalid banner on worktree sessions (feat-722-relay-seam-inline): reproduced the per-cwd schema-version catch-22, verified all configs against installed canary (5.0.0-canary.20261126.1), confirmed the banner was caused by the feat-722 worktree declaring the relay.seam config section before the canary train that includes it was published.
- **Decisions:** Owner chose wait-for-publish (merge #722, publish canary train, update package) rather than surgical surgery; consent was already true everywhere (initial check had a regex false-negative on a comment, verified with loader afterward).
- **Next:** Close #722, publish the canary train (schema + pi package together), update the package, and sessions in the feat-722 worktree will go clean.
