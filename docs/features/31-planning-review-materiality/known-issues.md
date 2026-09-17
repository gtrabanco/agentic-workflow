# known-issues — 31-planning-review-materiality

No unresolved product or engineering decision blocks implementation, and no
planning-finding row is left open by this re-cut (R31-01/R31-02/R31-03 are
resolved in `planning-findings.md` at artifact revision `31-plan-3`). The
boundaries below are recorded so qualification and review do not rediscover them.

## Known boundaries to preserve

1. **Pre-existing snapshot-context drift (outside this unit).**
   `skills/review-spec/references/CHECKS.md` §1's context table lists five
   context kinds (`governing-issue`, `normalized-repository-state`,
   `architectural-invariants`, `dependency-unit`, `project-guide`) while the
   machine contract binds three (`CONTEXT_SOURCES` in
   `scripts/pre-execution-contract.mjs`). The drift predates this unit, belongs
   to the snapshot-owning surface (feature 28), and is outside #171's scope;
   this unit's `CHECKS.md` edits are scoped to §4, so the drift stays where it
   is. Destiny: a future feature/fix against the snapshot contract, never folded
   into this PR (AC13 pins the diff scope).

2. **One version bump per skill per PR (E-D31-1).** A skill edited by two phases
   of this PR is bumped once, in the phase that first edits it; the shipped
   version describes the PR's net change. Reviewers must not expect a second bump
   per phase.

3. **No tutorial mirror.** `docs/workflow/` gains no materiality, cap or
   wording-only text in this unit (PE-015 of the superseded set is retired;
   AC13's scope guard keeps the path out). Tutorial drift is `audit-docs`'
   inventory↔docs sweep.

4. **No retroactive reclassification.** `low` rows already persisted in existing
   units' `planning-findings.md` keep their recorded semantics; the new machine
   line binds at each unit's next review cycle (Product half, Out of scope
   bullet 4).

5. **The wording-only route's judgment half stays prose.** The machine enforces
   the recorded determination, the rotated revision, the unmoved acceptance
   fingerprint and the unmoved bound authorities; that "intent and authority are
   unchanged" is a human statement in the determination block is deliberate —
   the machine cannot judge wording, and the Product half keeps the judgment
   half out of code (In scope item 5). A reviewer reading the block is the
   second pair of eyes, not a second gate.

6. **The determination block is author-written, never script-written.** Its
   homes (`planning-evidence.md`, `decisions.md`, the SPEC's
   `### Planning evidence`) sit under `LEDGERS.md`'s `# no-script-writer`
   directive: `verify` and the sensor only read them. A future writer must go
   through the owning authoring skill, never through a generator.

7. **`stop-review-loop-cap` is additive only.** The transition table's rows and
   every pre-existing decider vocabulary value keep their spelling; a consumer
   that switches exhaustively over the stop codes gains one arm, and no consumer
   loses one. Recorded here because the schema package ships as a published
   contract (E-D31-10).

8. **The acceptance manifest was re-frozen by this re-cut (E-D31-13).** The
   superseded `31-plan-2` blob (`d85e217acad1322d3caf4968715ef5d00e9189c0`) no
   longer gates anything; the live blob is recorded in `PLAN.md` and receipted in
   `progress.md`. Anyone holding the old blob must re-read the manifest.
