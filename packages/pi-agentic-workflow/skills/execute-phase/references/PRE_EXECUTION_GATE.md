## Pre-execution review gate (after the own-status gate, before the acceptance manifest)

A `planned` unit is a *proposed* unit: the roadmap status says the artifacts exist,
never that an independent reviewer accepted them. Before any edit, sense this unit's
`stage: plan` evidence the way the sensor defines it (newest `## Pre-execution review receipt v1 — plan` block in `progress.md`,
digest re-derived with the recipe owner's verify mode (`node
scripts/pre-execution-snapshot.mjs verify --stage plan --unit <id> --parent <the Product digest this plan descended from>` — a snapshot
digest is a canonical SHA-256, never a git blob id; a fix unit omits `--parent`
because it binds none, and `structural.reasonCode` + `structural.changedPaths` name
what stopped being true), `stage: plan`,
verdict in the fixed set, reviewer is not the phase's author), and require
`PLAN-REVIEW-PASS`. In fix mode the same check runs against the fix unit's own
receipt (`/review-plan fix-<N>` produced it; there is no Product hop to substitute).

**Fail closed on all three states** — missing, stale, or wrong-stage:

```
PRE-EXECUTION GATE — <NN|fix-n>-<slug> BLOCKED (<missing|stale|wrong-stage|substitute|self-approved|author-readiness>)
Expected: current plan-review-pass receipt bound to snapshot <digest>
Actual:   <receipt state — what was read, and `structural.changedPaths` +
          `structural.reasonCode` from the verify run naming which bound file moved>

→ Next: /review-plan <NN>-<slug> — the plan needs a current independent review
  · the review returned NEEDS-DESIGN / a Product-rooted finding → /design-feature <NN>-<slug>
  · a bound artifact is genuinely wrong → /plan-feature <NN>-<slug> (re-cut), then re-review
  · no bypass flag exists for this gate: --force has never covered it and does not now

GATE REJECTION — stale-or-missing-receipt
Reason: <the label and `structural.reasonCode` above>
Return route: /review-plan <NN>-<slug>
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

### Normalizer order (mutating steps before the freeze, check-only after)

The two digests this gate and the next one bind — the plan snapshot a receipt records,
and the acceptance manifest blob — are the **freeze row**: the bytes at that moment are
the bytes every current receipt vouches for. So schedule by effect, not by habit.
**Every source-mutating normalizer runs strictly before the freeze row, and after it
only check-only steps follow**: a formatter, a generator, a version bumper, a bundler, a
docs generator, or anything else that rewrites a bound file — then the snapshot, then the
review. A step is check-only when it reports on bytes and writes none (`--check`, a
`verify`, a lint, a test run). Where one tool has both a mutating and a check-only mode,
**only the check-only mode may run after the freeze**; the mutating mode stays before it.

**A byte change to a frozen input after the freeze voids every receipt that bound it and
forces a fresh review.** `SNAPSHOT.md` owns what a snapshot binds and `POLICY.md` §7 owns
the digest recompute; neither is restated here and neither is optional. What this rule
adds over those digests is a **step-order guarantee** — not a claim that bytes were
never re-written before: a digest catches a late write after the fact and costs a
re-review, while the schedule keeps the late write from being planned at all.

Each project keeps its own **normalizer inventory** in one place, naming every mutating
step, its check-only mode where it has one, and the side of the freeze it sits on. In
this repository that list is in the `## Verification` section of the project guide
(`CLAUDE.md`), which a plan snapshot already binds as its `project-guide` context row.
