# decisions — 28-evidence-grounded-spec-plan-review

## Product decisions

- **PD1 — Human product authority:** `design-feature` may structure and
  challenge intent, but missing scope/outcome/role/authority choices return to
  the user.
- **PD2 — Two public review stages:** expose `review-spec` and `review-plan`;
  do not expose generic closure or separate fix/fold commands.
- **PD3 — Existing author repairs:** Product findings return to
  `design-feature`; Engineering findings return to `plan-feature` or
  `plan-fix`.
- **PD4 — No majority closure:** material findings are unioned and dismissed
  only by counter-evidence. Same-model clean contexts are not called diverse.
- **PD5 — Complete current unit:** no automatic issue or deferred row may stand
  in for a reviewed current-unit obligation without a user-approved amendment.
- **PD6 — Manual first-class:** sequential fresh conversations can run the
  complete workflow; AWL automates rather than defines it.
- **PD7 — One repair is normal, two is anomalous:** correctness remains
  fail-closed, but release qualification treats entry into a second
  repair/re-review cycle as evidence that readiness, evidence, design, planning,
  or routing is defective and requires root-cause correction.

## Engineering decisions

- **D1 — One additive contract family:** pre-execution contracts are distinct
  from candidate review and staged verification but reuse canonical package
  patterns and `SkillOutcome` routing.
- **D2 — Stable Product projection:** `spec-product-v1` selects the title,
  Goal, Branch, Size, Dependencies, Product half, and Design status; a Plan
  snapshot binds the resulting Product snapshot digest and the whole applicable
  plan artifact set.
- **D3 — Causal plus content identity:** exact hashes catch content drift;
  authoring-owned `artifactRevisionId` catches a new causal revision with the
  same bytes. Neither is misrepresented as sufficient alone.
- **D4 — Runtime semantic authority:** one package validator path owns PASS;
  JSON Schemas are generated structural projections.
- **D5 — Internal grounding owner:** authors share one non-authoritative
  claim/evidence/freshness/unknown contract and cannot convert its result into
  approval.
- **D6 — Existing state machine:** add review intents/evidence/profiles/routes
  to current schema owners; do not build a parallel SDD lifecycle.
- **D7 — Fix compatibility:** `plan-fix -> review-plan` verifies reproduction,
  root cause, regression, scope, and rollback without a feature Product half.
- **D8 — Keep internal name:** narrow `plan-feature-from-issue` to Product
  ownership and a SPEC-review handoff; defer renaming because it adds no
  correctness value.
- **D9 — Additive release:** bump the schema package from 3.4.0 to 3.5.0 and
  version/changelog every changed skill using repository tooling.
- **D10 — Evidence before claims:** ship a canary protocol and record observed
  or explicitly unavailable data; do not claim token/rework reduction from the
  design alone.
- **D11 — Progressive readiness:** authors inventory, evidence, draft, and run a
  deterministic readiness preflight before independent review. The preflight
  cannot approve its author's artifact.
- **D12 — Compact planning evidence:** bind `planning-evidence.md` (M/L) or the
  equivalent SPEC section (XS/S) into Plan authority; pass only phase-relevant
  rows to execution, never the raw exploration transcript.
- **D13 — Convergence diagnosis:** the first unioned findings set is repaired as
  one owner-bounded batch. A second cycle emits `CONVERGENCE-ANOMALY`; operational
  budgets never convert the anomaly or an open finding into PASS.
