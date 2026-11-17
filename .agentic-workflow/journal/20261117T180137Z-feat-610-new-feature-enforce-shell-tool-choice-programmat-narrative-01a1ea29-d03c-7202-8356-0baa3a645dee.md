## 2026-11-17T18:01:37Z — feat/610-new-feature-enforce-shell-tool-choice-programmat — narrative
- **Commits:** 9 (`aaa3ca12…d87d01ff`)
- **Files:** 30 files
- **Summary:** Apply issue #610: programmatic shell-tool enforcement (rg/bun) — policy module, pi carrier, config, gate integration, parity test, AC4 measurement, and PR #617
- **Decisions:** 1) grep-as-search vs pipe filter: only block search, let filters pass (18/31 grep segments in corpus were filters); 2) rg 15 flags map differently from grep (-E=encoding, no -r/-R); 3) n/a row closed with evidence n/a: shape for O14; 4) dimension-regression run recorded in SPEC.md before the gate requires it; 5) the pre-push hook refused on dimension-regression (not-applicable at the 9de62e1c base) so a post-push re-run was needed
- **Next:** Owner merge PR #617 after resolving the two shared-document conflicts (CONFIG.md and SKILL_CONTEXT_BUDGETS.json), then the published canary cut + pi install refresh so the carrier reaches owner's own sessions
