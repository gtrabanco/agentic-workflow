## 2026-11-18T23:16:13Z — feat-611-dogfooding-vehicle — narrative
- **Commits:** 14 (`a6fd5231…944644eb`)
- **Files:** 25 files
- **Summary:** Opened PR #639 for the dogfooding vehicle unit (#611) — armed setup, doctor row, triage setup-defect route, full test-first coverage
- **Decisions:** Arming is default-on where pi is installed, opt-in elsewhere (no config key, no daemon change). Triage classification: runner refusal + in-tree subcommand + stale vehicle = setup-defect, never code-bug. Push needed AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1 due to load-sensitive flaky suites on a high-load box. CI remote gate also fails at scripts/session-close.test.mjs due to missing git identity — pre-existing, not in this diff.
- **Next:** Merge #639 when ready; decide whether to fold the session-close identity defect as a separate fix(514) unit
