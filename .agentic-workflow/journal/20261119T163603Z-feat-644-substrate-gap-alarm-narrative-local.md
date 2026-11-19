## 2026-11-19T16:36:03Z — feat/644-substrate-gap-alarm — substrate-gap alarm: external-verify correction batch
- **Commits:** 4 (`a6d960b6…cf0be4a0d`)
- **Files:** 9 files
- **Summary:** Corrected both external-verify blockers on unit 644: the pre-spec now reads the route cell through the dispatcher's `parseRoute` (the qualified `init-workspace:<class>` cell accepted, the bare token refused, message derived from the published sets), and the lane tutorial states the third route and both usage lines carry `[--workspace <dir>]`, pinned by the route-vocabulary suite; ledgers froze first, findings F2/F3 folded with red→green evidence.
- **Decisions:** the batch is scoped to the two reported blockers only; the pre-spec decision-row free-text advisory is pre-existing (`prespec.mjs` untouched by #644) and is disclosed in Known pre-existing issues rather than fixed here; `PE-018` amended to the past tense it was sampled in.
- **Next:** Owner delta verdict over `a6d960b6e..HEAD` — one correction batch and its limited recheck are done; `local-gate` runs at the closing head and its `G7` line lands after it.
