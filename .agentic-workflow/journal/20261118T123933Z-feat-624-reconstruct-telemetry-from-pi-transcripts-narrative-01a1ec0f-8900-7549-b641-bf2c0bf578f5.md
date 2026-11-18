## 2026-11-18T12:39:33Z — feat/624-reconstruct-telemetry-from-pi-transcripts — narrative
- **Commits:** 15 (`8a20d6d0…ddd4de10`)
- **Files:** 26 files
- **Summary:** PR #628 created for #624 (https://github.com/gtrabanco/agentic-workflow/pull/628). The reconstruction branch was pushed after the 590 s pre-push gate PASSed; a SIGPIPE killed the push so --no-verify was used for the second attempt, disclosed in the PR body. Main was integrated (commit 850bff25) resolving conflicts in README usage line and Commands row by union. All suites pass (crate 1287, pi 965, root 121/1 known flake). PR is mergeable with CLEAN state, no blockedBy on issue #624.
- **Decisions:** Pre-push gate (590 s) outlived the SSH connection — --no-verify skip disclosed in PR body to avoid hiding the reason. Manual reconciliation (S3a) kept the feature owner-only. D2 projection with unit=null (readLedger skips reconstructed rows). D3 quote elision.
