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
- **D14 — Distributed internal marking:** `evidence-grounding` ships as
  `user-invocable: false` without `metadata.internal: true`, registered in
  `.claude-plugin/plugin.json` and `skills.sh.json`, because that flag is the
  skills-CLI exclusion lever (#96) and a distributed skill wrongly carrying it
  is silently omitted from installs (#141). Lint rule 7 and the
  `bounded-delivery-loops` guard keep the marking valid.
- **D15 — One PR releases both packages:** the schema package releases as
  additive `3.5.0` from P1 and the Pi package bumps `0.1.0 -> 0.2.0` in P5's
  terminal pre-merge step after the last bundle rebuild;
  `publish-pi-package.yml` publishes on merge only when its version is newer
  than the registry, so the final hardening step makes the terminal candidate
  release-ready.
- **D16 — Parent topology is binding-time, not well-formedness:** the red-first
  receipt suite pins that a plain-reviewer receipt carrying parents passes
  `validatePreExecutionReviewReceiptV1` and is refused with `invalid-topology`
  only by `validatePreExecutionReceiptAgainstSnapshot`. The shared rule engine
  therefore gained an `enforcement: "walk" | "binding"` flag: the Draft-07
  projection renders `parent-topology-shaped`/`parent-topology-restrained`, the
  plain walk skips binding rules, and the binding authority re-applies them over
  the same captured document via the exported `applyCrossRule`. One definition,
  no second inline copy of the constraint.
- **D17 — Published-surface fidelity on the shared canonicalizer:** (a) the
  verification family's over-budget `TypeError` keeps its pinned `D14` marker
  (`F91`) through a `budgetTag` option on the shared canonicalizer — the
  pre-execution family leaves it unset; (b) the projection test's path-rule
  fragment `or ".." segments` is matched in its SERIALIZED form, because
  `JSON.stringify` always escapes the description's double quotes and a raw
  quoted fragment can never appear in serialized bytes — the assertion as first
  written was unsatisfiable under any implementation and was amended, not
  weakened (the rule, its pattern, and its description are unchanged).
- **D18 — `evidence-grounding` carries no model tier:** it is internal and
  always composed inside its caller's turn, so its work already runs at the
  caller's tier (`design-feature` = opus/high). `model-routing.yml` routes only
  entrypoints, and the precedent is explicit: `phase-contract`,
  `verification-contract` and `planning-preflight` are referenced from routed
  entrypoints and carry no route of their own. Adding a route for it would
  imply it can be invoked, which the SPEC forbids (`SKILL.md:133`).
- **D19 — P2 recalibrated the frozen route budgets:** the frozen manifest pinned
  `plan-feature:scoped` at 6337/536 and `plan-feature:issue` at 7786/687, both
  measured *before* the Product-review gate existed. A gate this skill must
  emit cannot fit the old ceiling, so the two routes were raised to
  7610/643 and 9970/814 and the two new routes registered
  (`design-feature:product` 11950/864, `review-spec:default` 4690/352). This
  follows the recorded feature-21 precedent ("budget manifest recalibrated to
  the new steady state") rather than truncating mandatory contract text. Each
  figure is a measured steady state, not a padded maximum: `check-skill-context
  --routes` passes with the smallest route-specific buffer in the manifest.
- **D20 — XS/S embeds both planning ledgers in the SPEC:** the snapshot then marks
  the `planning-evidence` and `obligations` context rows `absent` because their
  bytes are already bound by the whole-`spec` row, rather than splitting the SPEC
  to manufacture two files. Symmetrically an M/L unit that embedded its tables is
  a `review-plan` finding: one artifact, one complete table, and the reviewer
  always reads the whole table while execution reads a phase slice.
- **D21 — Route budgets model steps, not skills:** after P3 a planning invocation
  loads the shared owners, so `plan-feature` split into `:scoped` (router + gates,
  7610) and `:scaffold` (authoring + ledgers, 12700) and `design-feature` into
  `:product` (11950) and `:repair` (15800, the only step that loads
  `pre-execution-review`'s cycle policy). Inflating one ceiling to the worst-case
  union of every step would have hidden the real per-turn cost; each declared
  ceiling is the measured steady state of the step that actually loads those files.
- **D22 — `pre-execution-review` is the single owner of the shared cycle and the
  ledger shapes, not of verdicts:** `review-spec`/`review-plan` emit verdicts, the
  authoring skills emit readiness, and this internal owner emits nothing — the
  suite asserts that the three ledger column lists appear in exactly one file in
  the tree, which is what keeps the P2 spec-side text and the P3 plan-side text
  from drifting apart later.
