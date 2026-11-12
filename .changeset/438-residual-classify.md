---
"unit-lane": minor
---

feat(unit-lane): the additive-unit surface inventory and the recorded promise grammar

Issue #438: `scripts/residual-classify.mjs` answers "unused — and then what?" with
the four plan-decided states (`used` / `andamio` / `half-built` / `orphan`) plus
the fail-closed `ambiguous`, consulting the live tree, roadmap rows, open-unit
tasks, recorded `residual-promise@1` rows and charter planned-work rows, and
printing the path it consulted for every conditional.

A strictly additive unit now answers `## Retirements` with the classifier's
`--inventory --base <rev>` manifest (one row per added file and added `export`
symbol, with its state) instead of prose, and a real retirement leaves the
`--receipt` record plus the dated decision row — `orphan` is the only
retire-legitimate state. The four unit-doc templates teach the answer, the
design step publishes the `residual-promise@1` block, and
`normative-surfaces@1` registers it.
