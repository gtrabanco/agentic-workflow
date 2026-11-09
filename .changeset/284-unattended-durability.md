---
"@gtrabanco/pi-agentic-workflow": minor
---

feat(284): unattended durability — run journal, `advance --resume`, operator supervisor

An `advance` run now survives process death without a human. Every run opens and
closes a boundary in the run log (`run/start` / `run/stop`); a run that never
closed it is an interrupted run. `advance --resume` (automatic when the journal
shows an interruption) reads the sensor's own `crash_recovery` verdict and
continues only on `CLEAN` / `RESUMABLE` — `AMBIGUOUS`, or a verdict it cannot
read, halts before any invocation with `stop-crash-ambiguous`. `advance
--print-supervisor` prints a dependency-free POSIX shell restarter the operator
installs ask-first under systemd-run, cron or launchd; it re-invokes the run only
when the previous attempt left no terminal row, bounds its restarts, and exits 3
on a human-decision stop. No new runtime dependency; no `skills/**` change.
