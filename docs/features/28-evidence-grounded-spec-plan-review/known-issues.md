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
6. **Pi bundle sequencing** — implementation cannot start until feature 27 /
   PR #150 merges because that PR creates the canonical-to-Pi bundling/parity
   gate this feature must satisfy. Never hand-edit the packaged copies.
7. **Effect size unknown** — this design should prevent categories of wrong
   work, but latency/token/rework improvement is unknown until canaries run.
