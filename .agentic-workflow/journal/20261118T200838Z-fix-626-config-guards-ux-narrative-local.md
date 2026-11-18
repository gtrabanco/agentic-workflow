## 2026-11-18T20:08:38Z — fix/626-config-guards-ux — narrative
- **Commits:** 16 (`2007a121…ab955029`)
- **Files:** 40 files
- **Summary:** Applied issue #626 inline: one guard section with allow/deny/ask dispositions. Resolved CONFIG.md merge conflict from PR #629. Created PR #636. Key finding: out-of-band commit during push gate rewrote repo config to retired key; config reader silently ignores unknown sections — new suite scripts/local-config-contract.test.mjs prevents this from repeating silently.
- **Decisions:** Guard disposition: single guard section with per-guard mode; only behavior guards (gitIdentity, toolChoice, receipt) get dispositions; pathProtection/contentGuard remain always-on. Published history stays owner-written: no rebase. New suite red-first: ac3a570e (guards=red), 9b05bc79 (guard=green). GATE_INVENTORY row added for local-config-contract.
- **Next:** PR #636 open, awaiting owner review/merge. gh api still returns mergeable:null/merge_state:unknown for the PR.
