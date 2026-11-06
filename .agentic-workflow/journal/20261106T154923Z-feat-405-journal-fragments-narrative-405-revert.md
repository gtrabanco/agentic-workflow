## 2026-11-06T15:49:09Z — feat/405-journal-fragments — manual
- **Commits:** 9 (`805a2618…74cb1de1`)
- **Files:** 37 files
- **Summary:** fix(journal): revert the autoLogSession config switch that broke /log-session (SPEC D8)
- **Decisions:** autoLogSession config was reverted because the running PI session daemon cached an older config validator that rejected the key (the on-disk canary accepts it, but the daemon module cache didn't reload)
- **Next:** wait for external verdict on the 405 branch, then push and merge
