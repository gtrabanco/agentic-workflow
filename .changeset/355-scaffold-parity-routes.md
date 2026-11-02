---
"product-audit": minor
"review-implementation": patch
---

fix(skills): the audit's findings carry a `route:` at flight and a half-planned unit routes to `replan-in-unit` rather than a fold

`product-audit`'s fixed finding line gains `route:` — the next command for that
finding plus, optionally, the one reference that command loads; `none` costs no
context. The route is the progressive-loading decision taken during the audit and
stated in its report, and stating it never executes it: the report file stays the
only mutation. `review-implementation`'s decision table routes a delivered feature
whose missing half is *planned work* to `replan-in-unit` so the plan step learns
the unit was cut short, while a one-line consumer still folds.

The exported scaffold (`template/docs/**/_TEMPLATE/`) is now compared with the
mechanics it ships: `scripts/scaffold-parity.test.mjs` fails when an exported
unit-doc template drifts from its repo twin's section sequence or when any
scaffold file names an artifact this repository retired, and the two exported
templates join `scripts/unit-doc-contract.test.mjs`'s existing re-cut pin.
