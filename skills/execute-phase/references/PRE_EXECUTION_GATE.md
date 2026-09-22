## Pre-execution unit-doc currency (after the own-status gate, before step execution)

A triaged unit is a *proposed* unit: the roadmap status says the artifacts exist,
never that an independent reviewer accepted them. Before any edit, require the
unit doc's Evidence rows to be current (one Evidence row per acceptance criterion,
each with a verified command/digest/output) and the triage block to be present
and current in the unit doc. The triage block was produced by
`scripts/unit-route.mjs --triage <slug>` and pasted verbatim; if the unit doc
has been edited since the triage block was written, the Evidence rows are stale.

**Fail closed on both states** — missing Evidence or stale unit doc:

```
PRE-EXECUTION GATE — <NN|fix-n>-<slug> BLOCKED (missing-evidence|stale-unit-doc)
Expected: Evidence rows current for the triage block, unit doc unedited since triage
Actual:   <what is missing or stale>

→ Next: /unit-lane <NN>-<slug> — re-triage and re-run the lane
  · a triaged step genuinely needs replanning → /unit-lane <NN>-<slug> --retriage
  · no bypass flag exists for this gate: --force has never covered it and does not now

GATE REJECTION — stale-unit-doc
Reason: <the label above>
Return route: /unit-lane <NN>-<slug>

GATE REJECTION — stale-or-missing-receipt
Reason: <the label above>
Return route: <the stage's review command>
```

- **`--force` is out of scope here by construction.** It overrides the dependency and
  own-status stops, because those guard *ordering* the user may legitimately reorder.
  This gate guards unit-doc currency — the unit doc must be in a consistent state
  before execution. `--force` does not downgrade, waive, or "record and continue"
  past it.
- **Never fabricate Evidence.** Writing Evidence rows without running the command
  is forgery, not recovery. Only a real run with its output produces a valid row.

- **Order is fixed:** dependency → own-status → pre-execution unit-doc currency →
  evidence-row gate → step-lint. The slot immediately after this gate and before
  the first write is **reserved for the bounded implementation discovery** —
  one internal, read-only pre-write mapper, `READY | REPLAN | NEEDS-DESIGN |
  BLOCKED`. Nothing else may claim it: do not scatter reads, speculative refactors,
  or a home-grown "orientation" pass into that position.

### Normalizer order (mutating steps before the freeze, check-only after)

The digest this gate binds — the plan snapshot a receipt records — is the
**freeze row**: the bytes at that moment are the bytes every current receipt
vouches for. So schedule by effect, not by habit. **Every source-mutating
normalizer runs strictly before the freeze row, and after it only check-only
steps follow**: a formatter, a generator, a version bumper, a bundler, a
docs generator, or anything else that rewrites a bound file — then the
snapshot, then the review. A step is check-only when it reports on bytes and
writes none (`--check`, a `verify`, a lint, a test run). Where one tool has
both a mutating and a check-only mode, **only the check-only mode may run
after the freeze**; the mutating mode stays before it.

**A byte change to a frozen input after the freeze voids every receipt that
bound it and forces a fresh review.** `SNAPSHOT.md` owns what a snapshot binds
and `POLICY.md` §7 owns the digest recompute; neither is restated here and
neither is optional. What this rule adds over those digests is a
**step-order guarantee** — not a claim that bytes were never re-written before:
a digest catches a late write after the fact and costs a re-review, while the
schedule keeps the late write from being planned at all.

Each project keeps its own **normalizer inventory** in one place, naming every
mutating step, its check-only mode where it has one, and the side of the freeze
it sits on. In this repository that list is in the `## Verification` section of
the project guide (`AGENTS.md`), which a plan snapshot already binds as its
`project-guide` context row.