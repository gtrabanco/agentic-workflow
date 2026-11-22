# P3 — post-change probe report (issue #667)

Run 2026-11-22, after the extraction landed (`cf2fa4fbb` owner, `64ef2de2a`
passes), same harness, same rubric, same model and settings as P1. Two cells, 3
reps each; raw responses and the byte-exact prompts under `runs/p3-plus/` and
`runs/p3-minus/`:

- **`B+`** — the delivered `skills/review-code/SKILL.md` with the real
  `FINDER_CONTRACT.md` spliced before `## Checklist` (the owner dereferenced).
- **`B−`** — the delivered `review-code/SKILL.md` with **no** splice: the
  citation-only failure mode the design must preclude.

| rep | finish | prompt chars | completion tok (reasoning) | tally | coherent | recall | decoys | format |
|---|---|---|---|---|---|---|---|---|
| B+-1 | stop | 13756 | 3313 (23311) | `19 evaluated, 6 pass, 9 findings, 4 n/a` | yes (19) | 8/11 | 0/2 | ok |
| B+-2 | stop | 13756 | 1948 (23589) | `19 evaluated, 3 pass, 7 findings, 9 n/a` | yes (19) | 8/11 | 0/2 | ok |
| B+-3 | stop | 13756 | 3610 (26982) | `19 evaluated, 1 pass, 15 findings, 3 n/a` | yes (19) | 8/11 | 0/2 | ok |
| B−-1 | stop | 10212 | 3432 (35974) | `19 evaluated, 4 pass, 14 findings, 1 n/a` | yes (19) | 8/11 | 0/2 | ok |
| B−-2 | stop | 10212 | 4369 (27301) | `19 evaluated, 0 pass, 15 findings, 4 n/a` | yes (19) | 9/11 | 0/2 | ok |
| B−-3 | stop | 10212 | 1958 (24267) | `19 evaluated, 11 pass, 8 findings, 0 n/a` | yes (19) | 9/11 | 0/2 | ok |

## Per-rep recall

| rep | not found |
|---|---|
| B+-1 | D8 (swallowed exception), D9, D10 |
| B+-2 | D2 (the `lodash-es` duplication of `clampInt`), D9, D10 |
| B+-3 | D8, D9, D10 |
| B−-1 | D8, D9, D10 |
| B−-2 | D9, D10 |
| B−-3 | D9, D10 |

D5 and D6 are counted as found when the run names the seeded symbol as dead or
looping at `file:line`, the same reading the P1 report applies. D9 and D10 remain
the honesty seeds: zero reps found them, exactly as in the 2026-11-21 baseline.

## Reading

- **No fabricated tally in either cell.** Every one of the six post-change runs
  reports `19 evaluated` and a bucket sum of 19. The pre-change control produced
  one fabrication (`20 evaluated`) and one undercount in three runs.
- **No decoy row, in either cell.** The materiality bar held 6/6 as a pointer.
- **The citation-only cell no longer reproduces the failure.** `B−` — the pass
  read without the owner dereferenced — stayed coherent in 3/3, which is the
  outcome the inline discipline exists for: the always-on protocol is in the pass
  file, not in a pointer the model may skip.
- **Recall is flat within the comparator's noise.** `B+` 8.0 mean, `B−` 8.67,
  against the P1 control's 8.67: at most 0.67 of one defect lower or equal, never
  the 1-point drop that would mark a degradation.
- **The pass is ~1 100 characters longer in the prompt** (`B+` 13 756 vs `A`
  9 923) because the owner is dereferenced; the pass file itself grew by 74 est
  (`review-code` 1 700 → 1 774) once the inline protocol replaced the shortened
  copies. The owner is 3 468 B / 63 lines (est 867, measured with `wc -c -l`
  against the reference default of 2 200 est / 280 lines).
