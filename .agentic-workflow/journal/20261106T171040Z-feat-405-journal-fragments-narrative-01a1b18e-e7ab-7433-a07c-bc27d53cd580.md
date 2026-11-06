## 2026-11-06T17:10:39Z — feat/405-journal-fragments — manual
- **Commits:** 16 (`805a2618…9f1f66a8`)
- **Files:** 43 files
- **Summary:** Owner directed a /log-session invocation and the model read it and narrated about it instead of executing its flow. Structural cause confirmed: pi skills are prose injection, no executor. Diagnosed fix as pi.registerCommand extension command (the #383 precedent). Opened issue #429 with origin/goal/ACs/dependencies. Added owner's note: unit-lane is prime suspect, full audit of 14 workflow skills needed — fits #408 mechanization taxonomy. Roadmap row 429 added, PR #430 pushed (prose-only, gate pass). Corrected the external-verify batch for branch 405: carrier fragment-only, --log honor, AC5/AC7/AC9/O9/O16/L14/L20 corrections, 4 commits on reviewed head, all suites green.
- **Decisions:** Installed extension 5.0.0-canary.20261105.2 predates the 405 branch — expected; working tree's copy is correct. Fix is pi.registerCommand with invocation marking and close-time detection. All 14 workflow commands are prose dispatch; unit-lane is the prime suspect.
- **Next:** Owner verdict on the corrected 405 branch: re-verify the 7 blockers, then push and merge
