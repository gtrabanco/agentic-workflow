# known-issues — 28-evidence-grounded-spec-plan-review

No unresolved product or engineering decision blocks implementation.

## Known boundaries to preserve

1. **Out-of-band causal history** — content plus `artifactRevisionId` prevents
   resurrection only when every authoring write rotates the id. A direct edit
   and revert outside the authoring/runtime protocol is not observable from
   final bytes alone; documentation must not claim otherwise.
2. **Same-model reviewers** — clean context reduces authoring contamination but
   does not create model-family independence. Outputs must state the actual
   diversity used.
3. **JSON Schema authority** — structural projections cannot express all
   lineage, stage, digest, identity, and PASS semantics. Package runtime
   validators remain authoritative.
4. **Legacy evidence** — older planned/in-progress units have no compatible
   pre-execution receipt. They must be freshly reviewed; migration cannot
   coerce historical prose or candidate receipts.
5. **Context pressure** — broad skill changes risk oversized entrypoints. Move
   shared detail to progressive references/internal ownership and enforce the
   existing budget, without hiding mandatory rules from the selected route.
6. **Pi bundle sequencing** — feature 27 / PR #150 is merged and provides the
   canonical-to-Pi bundling/parity gate this feature must satisfy. Revalidate
   the bundle command at execution time and never hand-edit packaged copies.
7. **Effect size unknown** — this design should prevent categories of wrong
   work, but latency/token/rework improvement is unknown until canaries run.
8. **Cycle-count gaming** — a low cycle count is not evidence of quality when a
   reviewer is weak or findings are discarded. Union/counter-evidence rules and
   complete obligation closure remain authoritative; the second-cycle threshold
   is qualification evidence, never a PASS shortcut.
9. **Receipt authority is contractual at the skill layer:** a `spec-review-pass`
   receipt is validated for shape, stage and snapshot binding by the rules in
   `skills/review-spec/references/OUTPUT.md`; nothing in this repository can
   cryptographically attest that the turn which produced it was clean, only
   that it declared and evidenced the required context. Independence claims in
   an OUTPUT must therefore name the actual model and context used
   (`AC-REVIEW-002`).
10. **Ledger naming is a convention, not a schema constraint:** the snapshot
    binds `planning-evidence` and `obligations` by path and digest, so a unit that
    mis-names those files still validates. The skill contracts own the names
    (`planning-evidence.md`, `planning-obligations.md`, `planning-findings.md`, and
    the XS/S embedded headings per D20); `review-plan`'s L3–L6 checks are what
    catch a unit that invented a fourth home.
11. **Routing is enforced by contract text, not by a runtime validator:** the P4
    fixtures model the published decision tables (sensor labels, executor admission,
    autopilot order, fold routing) and pin them to the exact sentences that carry
    them, but nothing at runtime recomputes a `detail.pre_execution[]` row — the
    envelope keeps `detail` opaque by design, so a driver cannot schema-validate those
    rows. P5's canary runs the routes for real; a mismatch there is a defect in the
    tables, not in the fixtures.
