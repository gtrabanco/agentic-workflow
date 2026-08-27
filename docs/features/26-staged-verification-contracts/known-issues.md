# known-issues — 26-staged-verification-contracts

Deferred independent items; no issue exists unless the user routes one:

- **Consumer-side wiring** — AWL emitting real verification plans/receipts and
  calling the package's authoritative validators. Deferred by D15 until AWL
  upgrades to the released schema package; only the user may route a new issue.
- **AWL validation dialect/runner** — consumer/runtime architecture, explicitly
  outside this package feature. Trigger: post-upgrade AWL needs a runtime-
  specific dialect or execution adapter; only the user may route a new issue.
- **Shell composition / command strings** — pipelines, redirects,
  interpolation reserved for a future versioned contract by the issue itself.
  File a new issue when a consumer needs it.
- **Receipt identity field** — v2 contract decision; not in the issue's
  closed enumeration. File a new issue if consumers need stable receipt ids.

- **Ledger fold provenance is still incomplete (P20 owns it)** — after P16 annotated the six
  run-2 rows, 57 `folded: yes` rows in `review-findings.md` still name no commit, and F107/F110
  carry a phase label whose SHA P17 must bind. Not a defect of the shipped package; tracked so the
  close-out recount cannot pass quietly.

None of these are defects of this unit; they are recorded so future
surprises stop being surprises.
