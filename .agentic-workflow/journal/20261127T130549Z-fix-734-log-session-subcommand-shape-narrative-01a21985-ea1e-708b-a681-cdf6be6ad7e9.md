## 2026-11-27T13:05:49Z — fix/734-log-session-subcommand-shape — narrative
- **Commits:** 16 (`a494681e…49ec2b5f`)
- **Files:** 15 files
- **Summary:** Fix #734: the /log-session hand-off now renders the runner door's call shape — pin the agentic_workflow_run call shape, write the test, ship the change, PR #737 open.
- **Decisions:** Selected call-shape (not runner-contract reference) as the hand-off format: the /log-session skill's entry target must match exactly what the extension passes to runner. Added test to pin the shape (a shape regression has happened before). The fix landed, tests verified, PR #737 open with mergeable state UNKNOWN pending GitHub computation.
- **Next:** Wait for PR #737 mergeable status. Then run /audit-pr 737 and decide on merge.
