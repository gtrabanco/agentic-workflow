# known-issues — 31-planning-review-materiality

No unresolved product or engineering decision blocks implementation, and no
planning-finding row is left open by this re-cut: R31-01/R31-02/R31-03 were
resolved at artifact revision `31-plan-3`, P31-01…P31-05 at `31-plan-4`, P31-06 at
`31-plan-5`, and P31-07…P31-11 at `31-plan-6` (`planning-findings.md`). The
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
   inventory↔docs sweep. The only `docs/` paths this PR touches outside the three
   AC13 groups' first two members are the unit's own records (group 3).

4. **No retroactive reclassification.** `low` rows already persisted in existing
   units' `planning-findings.md` keep their recorded semantics; the new machine
   line binds at each unit's next review cycle (Product half, Out of scope
   bullet 4).

5. **The wording-only route's judgment half stays prose.** The machine enforces
   the recorded determination, the rotated revision, the unmoved acceptance
   fingerprint and the unmoved bound context authorities; that "intent and
   authority are unchanged" is a human statement in the determination block is
   deliberate — the machine cannot judge wording, and the Product half keeps the
   judgment half out of code (In scope item 5). A reviewer reading the block is
   the second pair of eyes, not a second gate. The machine half's reach is
   deliberately narrow: any movement that leaves the acceptance manifest and the
   context authorities intact is exempted once a determination records the
   post-movement revision, and a second movement is refused because the recorded
   revision no longer matches (P31-01).

6. **The determination block is author-written, never script-written, and lives
   in the unbound `progress.md`.** `progress.md` is the one unit record neither
   stage's `STAGE_ARTIFACTS` row binds, which is why the record survives its own
   write: recording it in `planning-evidence.md`, `decisions.md` or the SPEC's
   `### Planning evidence` section would rotate the `artifactRevisionId` the block
   must name and make the identity check unsatisfiable (P31-01). Writer: the
   stage's author; the ledger-ownership map is untouched, and
   `scripts/ledger-ownership.test.mjs` still fails any script that writes a
   durable ledger it does not own. Precedent for an agent-written record block in
   this home: `## Dependency receipt v1`.

7. **Feature 38's A:12 invariant is preserved, and now enforced by a gate.**
   `decideWorkflowAction()` stays consumer-side: `scripts/workflow-status.mjs`
   derives the count and projects it as `detail.review_loop_cycles`, and never
   references the decider. The re-aimed `scripts/review-loop-discipline.test.mjs`
   block — a code carrier inside AC10's pack — pins the `detail.review_loop_cycles`
   projection and the decider's absence, so a future change cannot regress the
   invariant unseen (P31-03). The behavioral emission stays an observation, not a
   gate: see §10.

8. **`stop-review-loop-cap` is additive only.** The transition table's rows and
   every pre-existing decider vocabulary value keep their spelling; a consumer
   that switches exhaustively over the stop codes gains one arm, and no consumer
   loses one. Recorded here because the schema package ships as a published
   contract (E-D31-10).

9. **The acceptance manifest was re-frozen by the `31-plan-5` re-derivation
   (E-D31-20).** The live blob is
   `849af5ae7bccc7bc815d60d8ca2a9e0400161df9`, recorded in `PLAN.md` and receipted
   in `progress.md`; the superseded `31-plan-4` blob
   (`650c7c8b21fdd6b7e2ec7b6c2c91672732201166`) and older blobs no longer gate
   anything. The re-freeze records the new Product parent (`spec-review-31-11`);
   every validator in the manifest is byte-identical to the `31-plan-4` manifest's,
   because both Product patches were enumeration-only. Anyone holding an old blob
   must re-read the manifest.

10. **AC13's code-carrier group now enumerates every path this plan edits
    (RESOLVED at `31-plan-5`).** The `31-plan-4` cut recorded the gap — the frozen
    Product half named four code carriers while the plan edits
    `scripts/pre-execution-contract.mjs`, `scripts/workflow-status.mjs`,
    `scripts/workflow-status-pre-execution.test.mjs`,
    `scripts/pre-execution-attribution.test.mjs` and
    `scripts/pre-execution-sensor.test.mjs` by design — as `planning-findings.md`
    **P31-06** (`medium`, `class: product`). The owner-commissioned Product patches
    `31-spec-9`/`31-spec-10` enumerated all five, and `spec-review-31-11` passed the
    patched half (14/14, zero findings); the `31-plan-5` re-derivation then closed
    P31-06 and rebound the plan's parent. AC13's scope walk is satisfiable.

11. **The feature-38 suite is outside every gate, and red at this head.**
   `bun test scripts/workflow-status-sensor.test.mjs` → 59 pass / 3 fail at
   `7ace8dbc` (two forge-hang harness timeouts at the 5 s bound, one exit-status
   assertion on the same path). No phase done-when, AC10 pack or AC list runs that
   suite, so the workflow cannot see it — the live proof of the validator-blind
   class P31-06 named. This unit does **not** edit that suite and does not add it
   to the pack (a red suite in a frozen gate makes the gate unsatisfiable); the
   A:12 and projection invariants are pinned instead in the already-packed
   `scripts/review-loop-discipline.test.mjs`, and the red suite is recorded here so
   a future fix owns it deliberately.

12. **The `normative-drift` window P1→P4 is declared, not hidden.** P1 bumps the
    schema package to 4.3.0 while the `CHANGELOG.md` companion row cannot land in
    the same phase: `CHANGELOG.md` is a `docs` target and the canonical phase
    contract's box 2 refuses a `docs` target in the `config/infra` P1
    (`scripts/phase-lint.mjs` `layerForTarget`; P31-04, E-D31-18/E-D31-21). The
    repo gate is therefore expected red between P1 and P4, P1's done-when stays
    package-local, and P4's done-when runs `bun test
    scripts/normative-drift.test.mjs` to prove the closure.

13. **P1 is at the canonical phase budget, and it owns the bump's own reddened
    assertions and published limit.** The version bump reddens two existing
    package gates — `test/release-contract.test.mjs` and
    `test/verification-gates.test.mjs` both hard-pin `4.2.0` — and adding
    `reproducerChars` to `PRE_EXECUTION_LIMITS` reddens
    `test/pre-execution-docs.test.mjs`, which walks every published limit against
    the package README's `### Published limits` block. All three surfaces are
    `packages/**` (`config/infra`), so they belong to P1 and cannot ride the
    `docs` P4; P1 now carries eight tasks, the ceiling the phase contract's box 3
    allows a non-close-out phase. A further P1 requirement must split the phase,
    never grow the list silently (P31-07/P31-08, E-D31-22, PE-033/PE-034/PE-037).
