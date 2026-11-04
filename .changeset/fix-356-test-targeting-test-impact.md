---
"execute-phase": minor
"unit-lane": minor
"verification-contract": minor
---

feat(356): the TDD rule gains its "which tests" half

Tests before implementation prescribes a procedure without context: TDD
instructions with no impact map measured a worse test-level regression rate than
no instructions at all, while TDD plus an impact map cut it by 70%. The rule now
carries the half it was missing.

`scripts/test-impact.mjs` derives a change's **test impact set** — the committed
tests it can affect — from four static sources: the identifiers the diff touches
resolved to the test files that reference them (`rg`, falling back to `grep` with
the degradation stated in the block), a test that names the changed file's own
path, the suite beside each changed file, and an LSP-resolved reference list the
caller hands in. It answers `empty` for a prose-only change: that recorded
verdict replaces the silent skip and never invents a test.

`execute-phase` gains a new reference — `skills/execute-phase/references/TEST_IMPACT.md` —
owning the block, the two tiers, the `empty` verdict and the RED-evidence shape,
and its turn contract carries the derived-set box. `verification-contract` states
which layer runs which tests and that an empty impact set is a receipt. `unit-lane`'s
tests step points at the same owner instead of restating it. The guide's working
rules state the obligation with its owner pointer.
