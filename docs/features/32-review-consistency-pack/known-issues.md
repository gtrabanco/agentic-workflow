# known-issues — 32-review-consistency-pack

## Tracked boundaries

- **B-01 — the two `LEDGERS.md` projections are not the `template/` export
  mirror.** This unit updates the live map
  (`skills/pre-execution-review/references/LEDGERS.md`) and both projections the
  scaffold reads (`docs/features/_TEMPLATE/LEDGERS.md`,
  `docs/fix/_TEMPLATE/LEDGERS.md`). The exportable mirror
  (`template/docs/*/_TEMPLATE/LEDGERS.md`) is already drifted and stays
  untouched — re-syncing it is feature 28's `c6daf5ec` surface, recorded in the
  SPEC's out-of-scope bullet.

- **B-02 — `audit-pr`'s closure-warning note is not a result scale.** The
  unit aligns the closure-integrity *scale* to `pass | blocker | n-a`;
  `skills/audit-pr/references/04_VERDICT.md` keeps its co-occurring
  closure-warning note (an added non-blocking line printed beside a verdict).
  A later reviewer who reads `warning` there as a scale value has a product
  question, not a defect: ED-32-5 records the distinction, and AC-08's pin is
  scoped to the scale lines.

- **B-03 — the schema package stays regression-only.** The missing-NRS notice
  rides `detail`, which is schema-unconstrained, so no schema member, no
  `envelope.schema.json` change, and no package version bump is in scope. A
  later promotion of the notice into the typed envelope vocabulary would be a
  schema change with its own release and review cycle.

- **B-04 — GATE-RAN has no reader outside the contract text.** This unit ships
  the mark, its ownership cell, and the reuse/re-run rules. The mechanical
  consumption (a shared gate-run reader) is not in the SPEC's scope; the
  contract text plus the discipline pins are the deliverable, and
  `audit-pr` keeps consuming CI as today.

- **B-05 — budget re-basis growth.** The touched skills' contract text grows;
  the P4 re-basis uses the tool's own declared re-basis
  (`ceil(measured × 1.10)` with the growth source named), the feature-38/59
  precedent. If an unrelated route is over ceiling at execution, that is the
  pre-existing repository condition, not this unit's defect; name it in the
  phase handoff rather than widening this unit's scope.
