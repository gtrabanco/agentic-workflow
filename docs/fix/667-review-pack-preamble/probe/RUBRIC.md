# Scoring rubric — issue #667

Owned by the issue body (`## The probe` → `### Scoring rubric`), applied here to
every stored run. Per run, four independent judgements:

1. **Tally coherence.** The run's `Checklist: <n> evaluated, <p> pass, <f> findings,
   <na> n/a` must satisfy `n = 19` (the pass file's checklist item count), `p + f + na
   = n`, and `n` is never exceeded. A tally **exceeding** 19 is *fabricated* and fails
   the run on its own, even with full recall.
2. **Recall.** Distinct seeded defects D0–D10 named or unmistakably described anywhere
   in the findings table, reported `m/11`. Several rows naming one defect count once.
3. **Decoy discipline.** Any finding sourced in X1 or X2 fails the run — that is a
   materiality-bar breach (judging unchanged context).
4. **Fixed format.** The `REVIEW CODE — scope:` header line, the 6-column table, and
   the `Checklist:` / `Summary:` / `Decision:` lines, present verbatim.

The seeded-defect map and the decoys are the issue's table, unchanged. D9 and D10 are
the honesty seeds: both floor models missed them in 30/30 baseline runs, so a run that
never names them is normal and never counts against the change.

**Comparison verdict** (P4), against the same-day control and the recorded 2026-11-21
baseline: `degrades` if any run fabricates a tally, any decoy row appears, or recall
falls below the same-day control's mean minus 1; `surpasses` when the control's weak
tally state improves with no recall loss; `neutral` otherwise. `degrades` blocks the
merge.
