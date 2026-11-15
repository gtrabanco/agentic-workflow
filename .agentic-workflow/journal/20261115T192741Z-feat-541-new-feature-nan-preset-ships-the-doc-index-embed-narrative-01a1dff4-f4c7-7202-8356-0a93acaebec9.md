## 2026-11-15T19:27:41Z — feat/541-new-feature-nan-preset-ships-the-doc-index-embed — narrative
- **Commits:** 12 (`85caa101…44f03656`)
- **Files:** 27 files
- **Summary:** Implemented Issue #541: a provider preset ships the doc-index embedding profile (NaN), materialized by the settings console — crate schema + validation, per-key precedence, idempotent writes, end-to-end, all gates green, PR #561 open against main
- **Decisions:** D1 materialize into index.json (not unified config) because the runner reads that file only; D2 the console action is the surface (preset registry is in-process only); D3 ship 60 rpm + measured chunk_limit 6000 and batchSize 6, stating the key-global caveat; D4 the crate's provider-block validation is a declared tightening; D5 DEFAULT_PACING moves to the config owner
- **Next:** Review PR #561 as external verifier (the correction-batch bounds of §9: one batch on reported blockers, one recheck), optionally run the remote gate (gh workflow run root-suite.yml --ref feat/541-new-feature-nan-preset-ships-the-doc-index-embed), then merge
