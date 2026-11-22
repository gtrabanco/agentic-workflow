# Probe cells — issue #667

The reproduction contract is the issue body's `## The probe` section. This file
records how each of its cells is materialized by `runner.mjs` on **this** tree, so
a reader can re-run a cell instead of trusting a report.

Both probes read `skills/review-code/SKILL.md` from disk at run time: P1 runs it on
the pre-change tree, P3 on the post-change tree. Every run stores the byte-exact
prompt it sent (`runs/<phase>/<cell>-<rep>.prompt.txt`) beside the raw response.

| cell | pass file | owner content | measures |
|---|---|---|---|
| `A` | live `review-code/SKILL.md`, verbatim | — | the pre-change control |
| `A+` | as `A` | `FINDER_CONTRACT.md` spliced before `## Checklist` | whether dereferencing the pre-change pointers changes anything |
| `B+` | live post-change `review-code/SKILL.md` | `FINDER_CONTRACT.md` spliced before `## Checklist` | the post-change pass **with** the owner dereferenced |
| `B-` | live post-change `review-code/SKILL.md` | — | the post-change pass with the pointer **not** dereferenced — the citation-only failure mode the design must preclude |

Two deviations from the issue's simulated 2026-11-21 harness, both recorded here
rather than smoothed over:

1. **`B+` is not a simulated rewrite.** The 2026-11-21 run hand-rewrote the pass
   file (`## Checklist` heading without its parenthetical, two pointer lines for
   `## Scope` / `## Materiality bar`) and injected a *simulated* preamble. After P2
   the real post-change file exists, so P3 measures the real bytes: the delivered
   pass file plus the real owner. The preamble no longer exists as a separate
   artifact — the owner absorbed it — so there is nothing else to inject.
2. **The owner is the only injection.** The simulated harness injected the
   preamble *and* the contract. `FINDER_CONTRACT.md` is now the preamble's owner,
   so injecting it once is the same dereference the simulated cell made twice.

Call shape, temperature, thinking posture and `max_tokens` are the issue's:
temperature 0, thinking on, `max_tokens` 16000, retry ×3 on 429 or 5xx.
