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
14. **The pre-execution review gate cannot gate the unit that develops the
    reviewed skills (self-hosting):** `review-spec`, `review-plan` and
    `pre-execution-review` are repo text, not installed commands — no global
    skill, no pi command — so the receipts the gate demands are producible only
    by this unit's own in-development process. Unit 28 proceeds P6–P8 under
    owner decision D32 (2026-09-01); the gate text is unchanged, and its first
    non-circular exercise is feature 29's post-merge dogfood (per SPEC
    Post-merge, which also requires unit 29's missing `planning-obligations.md`
    to be built first — RS10). Closure: the skills shipped (item 12's publish
    precondition) **and** one consuming unit reviewed through them.
12. **The merge-time Pi release depends on an npm account record, not on this
    repository:** `publish-pi-package.yml` publishes whenever
    `LOCAL != PUBLISHED` (an equality-based skip, so it does **not** verify
    "newer than the registry"), and its own header records that the npm Trusted
    Publisher record for `@gtrabanco/pi-agentic-workflow` is still pending — so any
    version past `0.1.0` fails the publish step with `npm error 403 … OIDC
    permission denied`. AC10's release row and P8's PR step are therefore only
    satisfiable once that record exists on npm; a green merge with a red publish job
    is not a shipped package, and no ledger may claim otherwise.
13. **Obligation-cell pipes are unchecked:** the `M/L` ledgers are nine-column
    text tables with no parser between the writer and `review-plan`, so a cell that
    quotes a closed `|`-separated vocabulary (the `SPEC-REVIEW-PASS |
    SPEC-REVIEW-FAIL | NEEDS-DESIGN` set) silently shifts every later column of
    that row and still validates as bytes. Found as RS4 on rows O3/O4 of this unit.
    The contract's vocabularies are quoted with commas inside ledger cells; a strict
    column-count check over `planning-obligations.md` is the mechanical guard this
    boundary is still missing.
