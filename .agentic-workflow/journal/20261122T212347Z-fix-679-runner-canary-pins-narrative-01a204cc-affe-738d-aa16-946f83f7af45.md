## 2026-11-22T21:23:47Z — fix/679-runner-canary-pins — narrative
- **Commits:** 21 (`15d265a7…cf63dfdd`)
- **Files:** 25 files
- **Summary:** Applied Issue #679 — two canary invocation traps: the canary tag records its staged tree so skills resolve services younger than the stable pin, the CLI names itself with a scoped pin, and a version-aware refusal repairs the Unknown service path
- **Decisions:** The canary-tag mechanism (stage → snapshot → restore → record) is the only way to keep the exact-pin invariant while solving the stale-pin gap; the pi bundle projection was deliberately left untouched because it pointerizes the invocation section and the scoped usage anchor in the package suites is sufficient
- **Next:** The owner's external verdict on PR #689 (Closes #679); the canary publish path is exercised by the owner's next canary cut
