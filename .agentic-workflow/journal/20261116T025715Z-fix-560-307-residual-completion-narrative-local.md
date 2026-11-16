## 2026-11-16T02:57:15Z — fix/560-307-residual-completion — fix-560-307-residual-completion-advisory-batch
- **Commits:** 10 (`0a37c272…1a1dfa02`)
- **Files:** 10 files
- **Summary:** Owner-directed correction batch on fix #560's external-verify advisories (0 blockers, 4 advisories): the four 2026-12-18 roadmap date cells corrected through the crate writers to their introducing commits' date 2026-11-15 (fixture-validated in mktemp, normalized-identical differential), 435's two closed Future rows (#436, #366) resolved in place with original text kept, the 560 Impact cell settled to done - #577 beside the intermediate state; advisory A1 wontfixed as the row-union driver's designed product with no ordering contract; 435's verify/promise-coherence reds proved byte-identical at base (pre-existing legacy debt, reported not fixed). Gate: local-gate PASS 15/15 (394s).
- **Decisions:** D13: A1 wontfix, A2/A3/A4 fixed, decisions.md D9 left (append-only); batch commits 8b9857d6 + 1a1dfa02
- **Next:** Owner verdicts the batch (one correction batch done, recheck green); push and merge PR #577; 435's legacy verify debt awaits an owner decision.
