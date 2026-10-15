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

## Path-protection justifications — unit 73

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/unit-route.mjs,scripts/catalog.json | P1 | 2026-10-15 | execute-phase | issue #291 AC4: triage emits per-step catalog budget_tier, aggregate derived; implement tier flipped to cheap per decision D1
justification | scripts/unit-route.test.mjs,scripts/catalog.test.mjs | P1 | 2026-10-15 | execute-phase | tests-first for the #291 AC4 tier output and derived-aggregate behavior change
justification | scripts/unit-route.mjs | P2 | 2026-10-15 | execute-phase | issue #291 AC3: execute route names exactly one phase and the execution tier, never the bare whole-unit command
justification | scripts/unit-route.test.mjs | P2 | 2026-10-15 | execute-phase | tests-first for the phase-named execute route and its fail-closed no-phase case
justification | scripts/phase-lint.mjs | P2 | 2026-10-15 | execute-phase | export parseUnitDocPhases so unit-route reuses the one phase parser (DRY), no behavior change
justification | skills/unit-lane/SKILL.md,skills/unit-lane/references/ | P3 | 2026-10-15 | execute-phase | issue #291 AC1-AC4: per-phase hand-off contract and close-out ladder in the lane
justification | skills/execute-phase/SKILL.md | P4 | 2026-10-15 | execute-phase | issue #291 AC3/AC4: closing hand-off names the next single phase + tier, resumes the lane after the last phase
justification | docs/workflow/LANE_FLOW.md | P5 | 2026-10-15 | execute-phase | issue #291 AC5: flow docs match the phase-named route and tiered triage block
```
