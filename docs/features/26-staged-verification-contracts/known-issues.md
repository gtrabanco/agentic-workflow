# known-issues — 26-staged-verification-contracts

Deferred items destined for issues, never inline work:

- **Consumer-side wiring** — `execute-phase` / `review-change` emitting real
  verification plans and receipts (the producer-side adoption of these
  contracts). Deferred by SPEC decision; file a new issue when demand lands.
- **Shell composition / command strings** — pipelines, redirects,
  interpolation reserved for a future versioned contract by the issue itself.
  File a new issue when a consumer needs it.
- **Receipt identity field** — v2 contract decision; not in the issue's
  closed enumeration. File a new issue if consumers need stable receipt ids.

None of these are defects of this unit; they are recorded so future
surprises stop being surprises.
