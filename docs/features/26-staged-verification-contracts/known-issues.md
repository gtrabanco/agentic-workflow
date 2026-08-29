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

- **Ledger fold provenance is recovered and recounted mechanically** — closed by P20.
  `scripts/ledger-provenance.mjs` walks every historical version of `review-findings.md`,
  finds the commit that flipped each row `no → yes`, and accepts a cited sha only when that
  commit is the flip or its own message claims the id, so `@3112e34`-style review-round and
  persistence markers no longer read as provenance. 72 token-less rows now name their fold
  commit (`· fold <sha>`, plus `(ticked <sha>)` when the repair and the bookkeeping are
  different commits); none had to be re-opened. Re-trigger: any new `folded: yes` flip that
  does not name a commit fails `node scripts/ledger-provenance.mjs <ledger> --check`, which
  `node --test scripts/*.test.mjs` now runs against this unit's ledger.

None of these are defects of this unit; they are recorded so future
surprises stop being surprises.
