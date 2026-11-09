## 2026-11-09T22:51:49Z — feat/427-config-unified-config-file-schema — narrative
- **Commits:** 12 (`2ee0b07e…08f4064d`)
- **Files:** 54 files
- **Summary:** Closed issue #427: unified config shipped, PR #494 created. Schema contract, CLI/API, pi config-extension. All suites + gate 13/13 green. Two test fixes: F4 loop guard and crate-projection parity.
- **Decisions:** review-change→review-code fix in F4; scriptedUi consume-once trap prevents infinite re-prompt loops; CRATE_COMMANDS includes config; dispatch-refusals fixture scoped to single file
- **Next:** PR #494 review (review-change + product-audit). If clean, owner merges. Release train handles version bumps.
