---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(product-audit): sweep the tests dimension's surplus direction (issue #595)

The Tests dimension asked one direction only — which tests are missing — so a
full audit pass could complete without ever putting the other question: which
tests should not exist. A suite grows by accretion and nothing in the workflow
asked for a test's justification, while the measured evidence says neither "it
passes" nor "it covers lines" justifies one: line coverage stops tracking
effectiveness once suite size is controlled, a test's value unit is the
obligation it asserts, and coverage-safe minimization still compromises fault
detection.

The applicability row now names both directions and points at a pass-only-if
section that publishes three checks in a versioned `test-surplus@1` block, each
with its own evidence standard: a **dead-surface** test needs the live-tree
search that proves its surface gone and rides the residue sweep's dead-code rule
by reference; an **obligation-level duplicate** is decided on the asserted
behaviour, never on line coverage; a **cost-over-value** test needs the risk it
covers plus the cost it charges, so intensity follows complexity rather than
surface visibility. Selective mutation kill-rate is a confirmation for a
contested cluster, never an exhaustive sweep.

The receipt is a verification, not a reward for deletion: every pass that reaches
the Tests dimension writes `verified: no surplus tests` on the dimension's health
line when the sweep found nothing, or the finding ids when it did — so an audit
that skipped the sweep cannot write the row, and the report's fixed format grows
no field. A surplus finding is typed `fix-now (delete)` only with its check's
evidence standard and routed through the published `finding-route@1` hand-off to
`/fold-findings`; the audit emits and never deletes.

Deletion and weakening are different acts, and the boundary is stated where the
check is defined: deleting a test with the evidence above is a separate,
evidence-gated action, while weakening a test so it passes is never legal and is
not an exception to the red-first rule. The surface enters the guide's normative
inventory as `test-surplus-grammar` with exactly one claimed owner, and
`scripts/product-audit-surplus.test.mjs` pins the prose so it cannot silently
vanish after a compaction — a pin, not a producer: the duplication-evidence
machinery stays with its own unit.
