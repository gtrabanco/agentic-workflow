## 2026-11-10T10:49:31Z — feat/388-extract-nan-vendor-coupling — narrative
- **Commits:** 9 (`baa3320f…b8b9cf3d`)
- **Files:** 43 files
- **Summary:** Apply issue #388: extract NaN vendor coupling into optional companion package @gtrabanco/pi-nan-agentic-workflow, making main pi layer provider-neutral with quota-tier routing. Owner integrated main/#427 (integrate-now) resolving 3 conflicts. All gates verified green post-merge.
- **Decisions:** Owner chose integrate-now: merge main (19 commits including #427 unified config) resolving 3 conflicts inline; tierRouting re-homed beside routing keys the pi section owns including #427's published descriptor (PI_CONFIG_EXTENSION + agentic-workflow.config.json, byte-pin intact). Planning ledgers cut before code. Test-first: RED corpus observed failing then implementation delivered. Vendor-neutral lock-in gate enforced: zero nan literals in main package.
- **Next:** Owner verdict on integrated diff, then npm Trusted Publisher record for the 4th package name before first publish. One correction batch per section 9 for any blockers reported.
