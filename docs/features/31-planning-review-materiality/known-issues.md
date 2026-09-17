# known-issues — 31-planning-review-materiality

No unresolved product or engineering decision blocks implementation. The
boundaries below are recorded so qualification and review do not rediscover
them.

## Known boundaries to preserve

1. **Pre-existing snapshot-context drift (outside this unit).**
   `skills/review-spec/references/CHECKS.md` §1 prose lists five context kinds
   (`governing-issue`, `normalized-repository-state`,
   `architectural-invariants`, `dependency-unit`, `project-guide`) while the
   machine contract binds three (`CONTEXT_SOURCES` in
   `scripts/pre-execution-contract.mjs`). The drift predates this unit,
   belongs to the snapshot-owning surface (feature 28), and is outside #171's
   scope; recorded by the Product-half reviewer in `progress.md`. Destiny: a
   future feature/fix against the snapshot contract, never folded into this
   PR (AC8 pins the diff scope).

2. **N31-001 / N31-002 stay open (`info`, class product).** The Product-half
   review's two `info` rows route to `design-feature` (the spec-stage
   product-class owner) — `plan-feature` never resolves `class: product`
   rows. Under the semantics this feature ships they are report-notes, so
   they cannot block any PASS; `design-feature` resolves them at its next
   repair cycle on this unit.

3. **One version bump per skill per PR (E-D31-1).** P2/P3 re-edit files of
   skills already bumped in P1 (`POLICY.md`, `OUTPUT.md` ×2). The shipped
   version describes the PR's net change; reviewers must not expect a second
   bump per phase.

4. **No tutorial mirror.** `docs/workflow/REVIEW_AND_CLASSIFY.md` gains no
   severity/materiality text in this unit (PE-15; AC8's file-list guard).
   Tutorial drift is `audit-docs`' inventory↔docs sweep.

5. **No retroactive reclassification.** `low` rows already persisted in
   existing units' `planning-findings.md` keep their recorded semantics; the
   new line binds at each unit's next review cycle (POLICY §6
   construct-never-coerce, preserved by Out-of-scope bullet 5).
