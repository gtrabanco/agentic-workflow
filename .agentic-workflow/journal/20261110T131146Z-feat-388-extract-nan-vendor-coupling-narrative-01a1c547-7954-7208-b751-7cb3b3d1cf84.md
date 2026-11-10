## 2026-11-10T13:11:46Z — feat/388-extract-nan-vendor-coupling — narrative
- **Commits:** 11 (`baa3320f…a3ba40cb`)
- **Files:** 45 files
- **Summary:** Created PR #499: extract NaN vendor coupling into optional companion package @gtrabanco/pi-nan-agentic-workflow (feature #388). Integrated #427 (unified config schema) from main, applied inline per owner workflow. PR includes 11 commits, 45 files changed (1986 add, 553 del), vendor-neutral lock-in gate, tier-aware quota routing, and all gates passed (local gate 7/7, root suite 101 PASS).
- **Decisions:** Integrated #427 (unified config) into this PR via git merge main before push — resolved tierRouting re-homing beside the routing keys the pi section owns, kept both roadmap rows (427/388), preserved #427's published descriptor PI_CONFIG_EXTENSION and agentic-workflow.config.json byte-pin. Used gh API directly (not gh pr edit) to set PR body due to GraphQL Projects deprecation causing exit code 1.
- **Next:** Owner review and merge of PR #499; npmjs.com must register Trusted Publisher for @gtrabanco/pi-nan-agentic-workflow before first publish (E403 until done). After merge: run npm publish for the new package.
