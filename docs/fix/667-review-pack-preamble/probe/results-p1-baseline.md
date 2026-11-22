# P1 — pre-change baseline report (issue #667)

Run 2026-11-22, cell `A` (the pre-change `skills/review-code/SKILL.md`, verbatim),
3 reps, `nan/qwen3.6` temperature 0, thinking on, `max_tokens` 16000. Raw
responses and the byte-exact prompts: `runs/p1/`.

| rep | finish | prompt tok | completion tok (reasoning) | tally | coherent | recall | decoys | format |
|---|---|---|---|---|---|---|---|---|
| A-1 | stop | 2629 | 5729 (4919) | `19 evaluated, 0 pass, 10 findings, 9 n/a` | yes (10+9=19) | 9/11 | 0/2 | ok |
| A-2 | stop | 2629 | 6600 (5846) | `20 evaluated, 3 pass, 13 findings, 4 n/a` | **no — 20 > 19, fabricated** | 8/11 | 0/2 | ok |
| A-3 | stop | 2629 | 6903 (6075) | `19 evaluated, 2 pass, 9 findings, 2 n/a` | **no — 2+9+2=13 ≠ 19, undercount** | 9/11 | 0/2 | ok |

## Per-rep recall

| rep | not found |
|---|---|
| A-1 | D9 (boolean third state), D10 (`legacy` warned and ignored) |
| A-2 | D1 (unguarded `JSON.parse`), D9, D10 |
| A-3 | D9, D10 |

D5 and D6 were counted as found when the run named the seeded symbol as dead code
without naming its shallow-freeze / off-by-one half; the rubric asks for the defect
to be named or unmistakably described, and the dead-code half of both seeds is
described at `file:line`. D9 and D10 were found by zero reps — the issue's own
"honesty seeds", missed by the floor models in 30/30 recorded baseline runs too.

## Reading (the comparison's same-day control)

- **Recall mean 8.67/11** (9, 8, 9) against the 2026-11-21 recorded baseline's
  7.5 (7–8). Higher than the recorded reference, so the comparison must use this
  run's numbers, exactly as the issue's P4 contract says.
- **Tally coherence 1/3.** Two of three control runs are incoherent — one fabricated
  an over-count, one under-reported its `n/a` bucket. This reproduces the issue's
  finding that tally bookkeeping is fragile for the floor model **in every
  composition, control included**, and at n = 3 the batch variance is larger than
  any composition effect the comparison can claim.
- **Decoys 0/3.** The materiality bar held in every rep of the control.
- **Format 3/3.** All three rendered the header line, the 6-column table and the
  `Checklist:` / `Summary:` / `Decision:` lines.

Consequence for P4: `degrades` is decided by (a) any fabricated tally exceeding
19, (b) any decoy row, (c) recall below `8.67 − 1 = 7.67`. An incoherent tally
that stays within 19 (A-3's shape) is *not* by itself a degradation — the control
already produces it — but a post-change run whose tally fabrication rate is not
better than the control's is `neutral` at best, never `surpasses`.
