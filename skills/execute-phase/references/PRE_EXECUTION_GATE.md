## Pre-execution review gate (after the own-status gate, before the acceptance manifest)

A `planned` unit is a *proposed* unit: the roadmap status says the artifacts exist,
never that an independent reviewer accepted them. Before any edit, sense this unit's
`stage: plan` evidence the way the sensor defines it (newest `## Pre-execution review receipt v1 — plan` block in `progress.md`,
digest recomputed with `git hash-object` over each bound artifact, `stage: plan`,
verdict in the fixed set, reviewer is not the phase's author), and require
`PLAN-REVIEW-PASS`. In fix mode the same check runs against the fix unit's own
receipt (`/review-plan fix-<N>` produced it; there is no Product hop to substitute).

**Fail closed on all three states** — missing, stale, or wrong-stage:

```
PRE-EXECUTION GATE — <NN|fix-n>-<slug> BLOCKED (<missing|stale|wrong-stage|substitute|self-approved|author-readiness>)
Expected: current plan-review-pass receipt bound to snapshot <digest>
Actual:   <receipt state — what was read, and which bound file moved>

→ Next: /review-plan <NN>-<slug> — the plan needs a current independent review
  · the review returned NEEDS-DESIGN / a Product-rooted finding → /design-feature <NN>-<slug>
  · a bound artifact is genuinely wrong → /plan-feature <NN>-<slug> (re-cut), then re-review
  · no bypass flag exists for this gate: --force has never covered it and does not now
```

- **`--force` is out of scope here by construction.** It overrides the dependency and
  own-status stops, because those guard *ordering* the user may legitimately reorder.
  This gate guards a verdict only an independent reviewer can produce, so there is
  nothing for the executor to assert: `--force` does not downgrade, waive, or
  "record and continue" past it, and an executor that prints this block must stop the
  turn — writing `--force` into `decisions.md` is not an escape hatch either.
- **Never refresh a receipt.** Editing the block, re-hashing after a cosmetic change,
  or accepting a `SPEC-REVIEW-PASS` in its place (wrong-stage) is forgery, not
  recovery. Only a new review of a new snapshot yields a current receipt.
- **Legacy units** (`planned`/`in-progress` before feature 28, no ledgers, no
  receipt): adopt through `pre-execution-review`'s legacy rule — add exactly the two
  missing ledgers built from the artifacts as they stand, change nothing else, and
  resume only after `/review-plan` returns a current `PLAN-REVIEW-PASS`. `legacy`
  means "predates the gate", `missing` means "never reviewed"; never launder an old
  phase into looking reviewed, and never treat a missing ledger as a defect claim.

- **Order is fixed:** dependency → own-status → pre-execution review → acceptance
  manifest → phase-lint. The slot immediately after this gate and before the first
  write is **reserved for feature 29's bounded implementation discovery** — one
  internal, read-only pre-write mapper, `READY | REPLAN | NEEDS-DESIGN | BLOCKED`.
  Nothing else may claim it: do not scatter reads, speculative refactors, or a
  home-grown "orientation" pass into that position, and do not implement 29 here.

