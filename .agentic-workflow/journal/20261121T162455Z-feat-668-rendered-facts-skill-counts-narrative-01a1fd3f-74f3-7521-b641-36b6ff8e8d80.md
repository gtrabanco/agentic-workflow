## 2026-11-21T16:24:55Z — feat/668-rendered-facts-skill-counts — narrative
- **Commits:** 12 (`a3ed50c2…b33d03e9`)
- **Files:** 16 files
- **Summary:** Issue #668 applied inline: created a deterministic counter (scripts/skill-surface-counts.mjs) that derives six skill-surface counts from the skills/ tree and frontmatter, pinned every hand-rendered count in README.md / SKILLS.md / REPLICATE.md as rendered-facts@1 rows, wired the counter into the normative-drift gate, and updated the count in ROADMAP and the unit doc. Branch pushed, PR #674 opened (MERGEABLE/CLEAN). External verification reported 2 blockers (AC2/AC7 commands stale); a correction batch fixed both: repaired the AC declarations, pinned the REPLICATE enumeration labels, and re-ran the affected gates (local-gate passed, normative-drift 24/24).
- **Decisions:** D7 — correction bounds: only the two external-verify blockers fixed; no other prose touched.
- **Next:** Owner merges PR #674 after external review, or runs the remote gate (gh workflow run root-suite.yml --ref feat/668-rendered-facts-skill-counts) for a remote receipt.
