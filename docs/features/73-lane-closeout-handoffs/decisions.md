# Decisions — 73-lane-closeout-handoffs

## D1 — `implement` budget tier flips to `cheap` (2026-10-15)

**Decision:** `scripts/catalog.json`'s `implement` step carries
`"budget_tier": "cheap"` (was `"strong"`).

**Options considered:**
1. **Flip `implement` → `cheap`** (chosen) — implement phases are mechanical,
   per-task validator-gated work (`(validator: …)` on every task bullet), and
   the accumulated diff is reviewed at the strong tier twice before merge
   (the lane's review step + `review-change`'s receipted review). The shipped
   recommended profiles already route `/execute-phase` → cheap; keeping
   `implement: strong` made the catalog contradict the profiles (issue #291,
   expected behaviour 6).
2. Operator-configurable tier — rejected: adds a config surface no skill or
   script consumes today; the catalog is already the single knob an operator
   edits to re-route tiers.
3. Keep `strong` and document — rejected: leaves the contradiction the issue
   explicitly forbids ("recorded as a decision, not left contradictory").

**Consequence:** an operator who wants a specific phase run at the strong tier
chooses the session model for that turn — tiers are recommendations printed at
the hand-off, never enforced. The execution tier named on per-phase hand-offs
is the `implement` step's catalog tier (one source: `scripts/catalog.json`).

**Recorded by:** unit-lane design step, unit 73 (issue #291 AC4).
