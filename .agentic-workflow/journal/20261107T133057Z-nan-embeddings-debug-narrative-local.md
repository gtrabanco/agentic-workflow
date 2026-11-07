## 2026-11-07T13:30:57Z — docs/journal-aggregate-pr-batch — manual
- **Commits:** 0 (GitHub issues only)
- **Files:** docs/LOGS.md (uncommitted, appended), GitHub issue #443
- **Summary:** Debugged whether embeddings are actually used in nan: confirmed via NaN usage API that embeddings were called 302 times (1,610,728 tokens) only on 2026-11-06 at indexing time, with zero query-side embedding calls since. Root cause: CLI defaults to keyword mode, no skill passes --mode hybrid, and embedPendingChunks has no retry/backoff/pacing (429 aborts the pass).
- **Decisions:** Owner selected: (1) auto-hybrid when provider configured + chunks embedded, (2) --sync embeds by default with backoff, (3) query stays read-only, (4) /aw-index as native command (code only, not skill), (5) backfill approved (~2.6M tokens), (6) Open WebUI excluded from scope.
- **Next:** Create issue #443 with needs-triage tag (done); owner reviews issue and routes to unit-lane
