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

- **Ledger fold provenance is still incomplete (P20 owns it)** — after P16 and P17, 82 of the 100
  `folded: yes` rows in `review-findings.md` still name no fold commit or phase, and the phase-labelled
  rows F97/F107/F110 bind their SHA only in the following phase's reconciliation. F106's "62 token-less
  rows" undercounts: a bare 7-hex scan also matches review-round markers like `@3112e34`, so the
  recount must test for a *fold* citation, not for any hex token. Not a defect of the shipped package;
  tracked so the close-out recount cannot pass quietly.

None of these are defects of this unit; they are recorded so future
surprises stop being surprises.
