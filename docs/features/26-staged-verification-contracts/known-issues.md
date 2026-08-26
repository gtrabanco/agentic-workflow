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

None of these are defects of this unit; they are recorded so future
surprises stop being surprises.
