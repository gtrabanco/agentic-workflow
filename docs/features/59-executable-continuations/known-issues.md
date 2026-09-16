# known-issues — 59-executable-continuations

## Tracked boundaries

- **B-01 — scripts/ distribution gap (inherited from feature 38 B-01):** the pi
  package's `bundle:skills` copies skill trees only; root `scripts/` do not
  travel with installed skills, so an installed `workflow-status` skill cannot
  invoke the sensor script outside the repo root. Unchanged by this unit —
  tracked for `docs/features/44-per-skill-package-layout` (#198).

- **B-02 — v1 rendering is POSIX-only:** AC5 says rendering is derivable "per
  platform family"; v1 freezes the POSIX-shell rendering as the emitted string
  (E-59-5). Other families are derivable by the same rule but are not emitted
  until a SPEC change extends the class/family set (D-59-5 closure).

- **B-03 — class set is closed at 3:** status refresh, planning-gate re-run,
  review-receipt refresh. Any new class (e.g. #216's journey canary, folded row
  49) is a SPEC change, never an emitter extension (D-59-5).

- **B-04 — refusal visibility is `detail`-level:** refusal codes surface at
  `detail.continuation_refusal` because `detail` is schema-unconstrained
  (PE-003); a future promotion of refusals into the typed envelope vocabulary is
  a schema change with its own review cycle.

- **B-05 — budget re-basis growth:** the quote-surface and interview text
  additions grow the touched skills' measured context; the P4 re-basis uses the
  tool's own declared re-basis (`ceil(measured × 1.10)`, growth source named) —
  the feature 38 B-04 precedent. If an unrelated route is over ceiling at
  execution, that is the pre-existing repo condition, not this unit's defect;
  name it in the phase handoff rather than widening this unit's scope.
