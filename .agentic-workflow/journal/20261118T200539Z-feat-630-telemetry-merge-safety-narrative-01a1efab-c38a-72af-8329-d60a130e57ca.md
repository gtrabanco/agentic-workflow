## 2026-11-18T20:05:39Z — feat/630-telemetry-merge-safety — narrative
- **Commits:** 16 (`ef64284c…6c05a596`)
- **Files:** 29 files
- **Summary:** Complete fix/630: EXTERNAL VERIFY (VERIFIED, 0 blockers, 6 advisories), apply correction batch (F1-F5 fixed, F6 wontfix), commit/push, integrate moved main (fix #623) via merge
- **Decisions:** 1. Applied advisory-scope batch from EXTERNAL VERIFY: folded findings F1-F5 (plain-form class inference fixed by fixing argv index in resolveMerge, bin docstring bun-prefixed, UPGRADE.md prose recounted) and F6 wontfix (bare-telemetry refusal is correct consequence); 2. Push SIGPIPE diagnosed: git opens SSH before pre-push hook, gate holds connection idle ~600s, first post-hook write SIGPIPEs git (exit 141); fixed with clone-local ServerAliveInterval config; 3. main moved mid-push (fix #623, 16 commits); integrated by merge, not rebase — auto-resolved cleanly (3 overlapping files, different regions); projection DRIFT after textual merge resolved by re-running docs-generate.mjs and amending merge commit
- **Next:** Delta EXTERNAL VERIFY of 6c05a596 by the owner; bind docs/fix/630-telemetry-merge-safety/external-verify.md as delta base
