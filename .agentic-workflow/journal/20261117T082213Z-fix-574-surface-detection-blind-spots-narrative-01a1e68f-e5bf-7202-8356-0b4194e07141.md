## 2026-11-17T08:22:13Z — fix/574-surface-detection-blind-spots — narrative
- **Commits:** 13 (`8e47b2a6…0738067a`)
- **Files:** 29 files
- **Summary:** External verify of fix-574 (B1–B6 blockers, NEEDS-DECISION) then one correction batch closing all six in two commits (red-first green) pushed to PR #599.
- **Decisions:** persist-then-fix path selected (no external-verify.md existed yet; session ran verify in-memory then persisted). B1: extractFileClaims now matches base — ## Surfaces never narrows claims. B2: surfaceKey refuses <...> placeholder children at the single choke point. B3–B6 fixed alongside with their own targeted edits. One correction batch per §9; the red corpus was 2b7ad81e (77 pass, 2 fail) and green at 0738067a (79 pass). Root-suite load flake #291 F7 persists; diff-guard breach (1651/35) grows with the batch but stays reported, never force-fit.
- **Next:** Owner recheck of external-verify.md B1–B6 against 0738067a — one pass; if same blocker still fails, one second pass only; otherwise Needs your decision.
