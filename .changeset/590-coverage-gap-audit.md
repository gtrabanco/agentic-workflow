---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(audit): coverage-gap join, the Coverage gaps dimension and the evolution gate (issue #590)

product-audit answered the retrospective question — what already went wrong, and
where the process injected it — and had nothing for the forward-looking one:
which declared verification criteria have no detector, which recurring finding
classes have no preventive gate, and which declared detectors consume no
criterion.

`scripts/coverage-gap.mjs` is that join, deterministic and read-only: it crosses
the project's verification-criteria catalogue with the installed detectors (the
gate inventory through its one reader, plus the review surfaces the ceremony
profile leaves paid) and the findings corpus (through the corpus's own reader),
and emits the `coverage-gap@1` receipt. Three gap classes, no severity and no
route — the script emits the gap and the dimension judges it. An absent carrier
is named and its edge reads `n/a`; a project with no input at all is
`insufficient-input`, never a vacuous clean. `scripts/product-audit-gap-fixture.mjs`
writes seeded/clean twins as real git repositories, so the class admission the
receipt depends on is demonstrated instead of assumed.

product-audit's `Coverage gaps` dimension consumes that receipt in its producer
pre-pass and routes every gap through the existing `finding-route@1` hand-offs:
an external skill to the discovery route, an own gate to `/unit-lane`, an
obsolete criterion back to the catalogue's upgrade route.

`scripts/dimension-regression.mjs` is the evolution-regression gate: a unit that
adds or changes a review dimension, a review skill or an audit producer
re-verifies that the previously present dimensions still pass. Over the push
range it refuses a dropped dimension with no recorded owner decision and a
review-surface change with no recorded run; a range touching none is
`not-applicable`. The frozen dimension set is re-asserted by its suite on every
push, and the reason is measured: unconstrained self-evolution degrades
previously acquired capabilities (arXiv 2605.09315).
