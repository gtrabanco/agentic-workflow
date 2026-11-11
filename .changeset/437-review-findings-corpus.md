---
"fold-findings": minor
"review-implementation": patch
---

feat(437): harvest the review findings into a measured corpus, a computed budget, a differential baseline and a `nimio` disposition

The repo has produced years of classified review findings as per-unit ledgers
and never aggregated them once. This unit adds the reader, and the loop
economics that reader makes computable:

- `scripts/findings-corpus.mjs` joins both committed carriers (the legacy
  `review-findings.md` ledger and the migrated `## Findings` + `## Log` carrier)
  into one corpus, every row bound to its `file:line` and a digest of the bytes
  it was parsed from; admission applies CIVER's two halves as deterministic
  gates (a `· fold <sha>` commit that touches the named path, and recurrence of
  the same `class × axis` across distinct units) and everything else stays
  annotated data; each recurring class is attributed to the phase that should
  have caught it, with the `GATE_INVENTORY.md` row its migration would feed;
  the reader also computes findings-per-cycle and the ARW code-net ratio.
- `scripts/correction-budget.mjs` measures the batch size from the corpus,
  computes the bounded budget, classifies below-floor findings as `nimio`, and
  stops with a typed `NEEDS-YOUR-DECISION` instead of granting another round.
- `scripts/differential-baseline.mjs` runs the declared validators at the base
  commit and at the head, classifies the pair (a base failure is an advisory,
  never a correction round), and judges review staleness in the two layers the
  owner selected: the scope-digest mechanism with a declared trivial-path policy.
- `fold-findings` gains the `NIMIO` per-finding output and
  `references/NIMIO.md`: a below-floor finding records a dated note with a
  re-trigger condition and never spends the budget.
- `review-implementation/references/CLASSIFY.md` now cites the run that proves
  cause (`scripts/differential-baseline.mjs`, its four verdicts and its
  `--reviewed` staleness answer) instead of describing the check as pending,
  pinned by `scripts/differential-baseline.test.mjs`.
