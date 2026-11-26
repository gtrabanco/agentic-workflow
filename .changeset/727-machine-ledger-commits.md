---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

fix(ledger): machine-owned ledgers commit by machinery, and the dirty-tree verdict exempts them

The new `telemetry commit` operation commits the machine-owned ledger class —
`docs/workflow/TIER_COST.md`, `docs/LOGS.md` and the journal fragments in the
auto zone; the roadmap rows and the unit-doc ledgers in the writer-step zone —
behind a lock and with a pathspec commit, never `git add -A`. Four call sites
answer to it: the pi telemetry teardown (after the final flush, through the
crate at the runtime that launched pi), `session-close close`, `telemetry
reconstruct write`, and a prelude step the local gate runs before it dispatches
any step, so a push carries the ledger committed. Box 5 of the turn contract
filters the class out of its dirty-tree verdict while a human-uncommitted file
still blocks, the class's one policy lives beside the ownership map
(`machine-ledger-commit@1`), and `needs-triage` gains its exit state: a triage
pass that reaches a published verdict removes it, loudly. Issue #727.

Post-verification correction batch (owner order 2026-11-26): the same class now
reaches every dirty-tree consumer atom through one filter (`foreignPorcelainLines`/
`foreignPorcelainPaths` on the class's own module) — the audit merge gate's
`tree-clean`, the lane loop's guard, the conductor's closeout park and the
pi settled-turn notice all judge foreign files only.
