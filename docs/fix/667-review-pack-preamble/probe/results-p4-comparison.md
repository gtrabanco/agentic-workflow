# P4 — comparison report and verdict (issue #667)

Written by the implementing model, 2026-11-22, from the two stored reports and
nothing else: `results-p1-baseline.md` (control, `A`) and
`results-p3-post-change.md` (`B+` dereferenced, `B−` citation-only). No new
observation is added here; every cell below is read from those two files.

## Metric by metric

| metric | recorded baseline 2026-11-21 | P1 control 2026-11-22 (`A`) | P3 `B+` (owner dereferenced) | P3 `B−` (citation only) |
|---|---|---|---|---|
| complete runs | 4/4 (3 of 4 cells) | 3/3 | 3/3 | 3/3 |
| recall mean of 11 (range) | 7.5 (7–8) | 8.67 (8–9) | 8.0 (8–8) | 8.67 (8–9) |
| tally coherent | 4/4 in the controlled batch, 0/2 in the exploratory batch | **1/3** | **3/3** | **3/3** |
| fabricated tally (> 19) | 1 of 30 (the `B−` cell) | 1 of 3 (A-2, `20 evaluated`) | **0 of 3** | **0 of 3** |
| decoy rows | 0/30 | 0/3 | 0/3 | 0/3 |
| fixed-format block | 3/3 cells | 3/3 | 3/3 | 3/3 |

## The two questions the issue asks

1. **Does the post-change run degrade?** No. No fabricated tally, no decoy row,
   and recall never falls below the same-day control's mean minus 1
   (`8.67 − 1 = 7.67`; `B+` 8.0, `B−` 8.67).
2. **Does it degrade *or* neutral/surpass?** The control's weak tally state — one
   fabricated count and one undercount in three runs — does not appear in either
   post-change cell (6/6 coherent). Recall moves −0.67 (`B+`) and 0.00 (`B−`)
   against the control. A 0.67 drop is inside the ±1 comparator band the rubric
   sets for "degradation", but it is not zero, so this report does not claim
   "surpasses" on a single day of three reps: at n = 3 an observed difference of
   0.67 and 0 are the same measurement.

**Verdict: neutral.** Merge may proceed. The one composition-linked hard failure
the 2026-11-21 baseline found — the fabricated tally in the pointer-only cell —
does not reproduce against the delivered pass: the citation-only cell is coherent
in 3/3, because the every-item protocol now lives in the pass file itself.

## What the numbers do not say

- **n = 3 per cell.** The control itself moved between the recorded baseline
  (4/4 coherent) and this re-run (1/3), so batch variance is larger than any
  composition effect measurable here. The verdict is `neutral`, and claiming more
  from six runs would be the overclaim the issue's own history already corrected
  once.
- **One pass, one model, one fixture.** D9 and D10 were missed by every run of
  every cell, as in the recorded baseline; they measure the floor model, not the
  composition. No other `review-*` pass was probed (PE-015).
- **Cost moved.** The pass file grew 74 est (`review-code` 1 700 → 1 774); the
  owner is 867 est. A reviewer that dereferences the pointer reads ~2.1 k est
  more than before, which no ceiling measures (a cross-skill read is invisible to
  `check-skill-context.mjs`). The extraction bought single ownership, not a
  smaller brief.
