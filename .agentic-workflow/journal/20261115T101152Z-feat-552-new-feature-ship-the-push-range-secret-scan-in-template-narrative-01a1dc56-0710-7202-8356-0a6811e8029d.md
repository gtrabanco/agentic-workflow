## 2026-11-15T10:11:52Z — feat/552-new-feature-ship-the-push-range-secret-scan-in-template — narrative
- **Commits:** 11 (`8d836493…3cc784a9`)
- **Files:** 22 files
- **Summary:** Applied issue #552: moved the push-range secret scan from scripts/secret-scan.mjs into the template as a single-source implementation with a consent-gated pre-push hook runner (secret-scan.sh). Created PR #557, mergeable/clean, 11 commits across 22 files.
- **Decisions:** Push-range secret scan runner chosen as consent-gated pre-push hook (not crate bin or manual-only); local-gate switches to shared implementation in-unit to avoid two-copy drift; corpus test stays in scripts/ as gate carrier while template gets its own hook test; push gate skipped on documented hatch (AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1) — full serial gate green, host worker-flake in unrelated suites
- **Next:** Owner external verify on PR #557, then merge
