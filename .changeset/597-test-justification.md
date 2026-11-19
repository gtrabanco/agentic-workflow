---
"unit-lane": minor
"execute-phase": minor
"fold-findings": minor
---

feat(tests): a new test justifies itself, and a deletion says who may execute it (issue #597)

The workflow could answer *which tests does this change affect* and, since #596,
*which obligations does a suite cover* — but a test arrived with no record of what
it bought, and a test removal had no authority anywhere: `product-audit` and the
`review-*` pack are findings-only by contract, `execute-phase` says never weaken a
test, and a `fix-now (delete)` row reached `fold-findings` with nothing authorizing
the execution it names.

A test a unit adds now carries **one justification line** naming the independent
obligation it covers — the observable contract, the required failure path or the
boundary edge, never the implementation under test. It rides the run's evidence row
(`— justifies: <the obligation>`), so the clause lands where the failing first run
already names its tests, and the published five-column evidence contract is not
extended. An absent line is a review finding, not a silent pass, and a line naming
an obligation its suite's tag does not declare is the same finding — the clause and
the tag cannot disagree.

Deletion gains an authority where it is executed, not where it is described: a
scheduled task in the unit's triaged step list lets `execute-phase` delete the test
that task names — retirement-shaped, its evidence row citing the ground and the
evidence source — and a `fix-now (delete)` row lets `fold-findings` execute the
deletion the row already evidences, recorded by the commit and the `folded: yes`
flip while the frozen classification stays frozen. Nobody else deletes: the audit
and review surfaces emit findings, and test-impact targeting names tests without
removing one.

The grounds are the surplus checks' own — dead surface, obligation-level duplicate,
cost over value — cited from their owner rather than restated, and the boundary is
written once beside them: an evidenced deletion is a separate, evidence-gated
action, never an exception to red-first and never a way to turn a red suite green,
because a suite that went red when a guard was removed was a planning error routed
back to its owner. The guide links that boundary instead of restating it, both new
grammars enter the normative-surface inventory, and the touched document and route
ceilings are re-based by measurement.
