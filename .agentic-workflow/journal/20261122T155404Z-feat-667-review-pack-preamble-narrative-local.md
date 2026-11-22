## 2026-11-22T15:54:04Z — feat/667-review-pack-preamble — narrative
- **Commits:** 12 (`ab2fcf88…be2d027e`)
- **Files:** 47 files
- **Summary:** Applied the external-verify correction batch for fix/667: fixed both blockers (the roadmap row's false "No budget re-pin was needed" claim, rewritten through the CAS roadmap writer, and the SPEC Impact/Retirements records that claimed a test move D8 says never happened) plus advisory A1 (P1's validator count 1→2), then re-ran the full gate loop.
- **Decisions:** A2/A3 triaged NOT to fix in this batch (D16): each edits a skill surface, which moves check-skill-context cells past O20's frozen 'only the nine estimate/line cells' differential, and a frozen validator cell moves only by owner SPEC amendment — named as an owner decision, never silently skipped. A4 stays because a dated research record must not be rewritten. The two SUITE TIMEOUTs in the default-bound node run are the pre-existing D13/E18 box-load class on byte-untouched suites.
- **Next:** Owner recheck of the two blockers against external-verify.md, then decide A2/A3 (skill-surface edits + O20 amendment) and push the branch for PR #687.
