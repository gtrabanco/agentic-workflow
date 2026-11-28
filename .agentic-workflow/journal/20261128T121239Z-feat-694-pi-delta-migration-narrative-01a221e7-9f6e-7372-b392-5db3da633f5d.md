## 2026-11-28T12:12:39Z — feat/694-pi-delta-migration — narrative

**Summary:** PR #750 (feat/694-pi-delta-migration) merged into origin/main by integrating 48 commits of main with a proper merge commit, resolving all content conflicts as the union of both sides (not picking a side). Also committed the full unit-lane review→fold cycle for 694 (SPEC written, review findings persisted, fold F1, planning evidence/obligations recorded, decisions documented).

**Decisions:**
- No rebase, no force push — merge commit preserves linear history and follows IR2 (never rewrite published history without explicit authorization).
- docs/ROADMAP.md: the shared-doc merge driver refused ("invalid-document — base: duplicate table header") because the merge base carried a stray blank line splitting the Fixes table into two headerless fragments. Main already removed it. Resolved by taking the union: our 694 row + main's 669 (done via #749) and 717 (done via #742).
- docs/generated/units.md: the driver resolved to the incoming projection which was stale and missing our 694 row. Regenerated from sources with `docs-generate`, which recovered the row.
- docs/workflow/SKILL_CONTEXT_BUDGETS.json: both sides measured the package README at 1416 independently; the union spends 1418 (the 694 settings-console prose + main's /flow and /draft rows). Re-pinned `linesMax` 1416→1418 with source note.
- scripts/findings-corpus.test.mjs: neither parent's total was merged total (merge base 184, ours +1, main +2 = 187). Measured actual tree (187), updated assertion, combined both sides' explanations.

**Status:** PR #750 merged (c1e3fbda9). Unit 694 done.

**Next:** Push the merge commit to remote. Then open/confirm PR to main and close unit 694.
