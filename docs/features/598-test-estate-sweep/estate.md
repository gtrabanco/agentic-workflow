test-obligation-tags@1 estate — 136 root suite(s) · 227 package suite(s) · 363 row(s) · standards fired: 71 · cost-over-risk: 67 · selected: 5 · adjudications missing: 0
adjudications: docs/features/598-test-estate-sweep/adjudications.md
selection rule: a cluster is a suspect when it is an obligation-level duplicate, or when its measured cost per obligation value is at least 1 s (cost = the slowest suite on the surface, read from the root gate's own `PASS <file> (N.Ns)` lines); suspects are ordered by that ratio, descending, and at most 5 run kill-rate — the sweep is never exhaustive.

| suite | scope | surface | obligations | cost (s) | evidence | verdict |
|---|---|---|---|---|---|---|
| `packages/agentic-workflow-schema/test/batch-plan.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/candidate-snapshot.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/canonical-core.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/canonical-legacy-compat.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/capabilities.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/ceremony-profile.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/config-contract.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/config-jsonc.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/config-schema-artifact.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/content-guard.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/continuation.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/src/sha256.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/doc-provenance.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/doc-retention.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/edge-matrix.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/evidence-row-grammar.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/gate-receipt.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/guard-plugin.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/index.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/journal-entry.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/lockfile-policy.test.mjs` | packages/agentic-workflow-schema | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/machine-contract.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/materialization.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/passes-vocabulary.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/phase-batching.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-canonical.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/src/sha256.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-docs.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-intents.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-lineage.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-schema.test.mjs` | packages/agentic-workflow-schema | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-snapshot.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/pre-execution-timeline.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/projection.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/quality-metrics.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/release-contract.test.mjs` | packages/agentic-workflow-schema | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/review-receipt.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/telemetry.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-authority.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/scripts/generate-verification-schemas.mjs`, `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/src/pre-execution-contract.ts`, `packages/agentic-workflow-schema/src/pre-execution.ts`, `packages/agentic-workflow-schema/src/verification-contract.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-bounds.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-core.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-defense.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-docs.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-freshness.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-gates.test.mjs` | packages/agentic-workflow-schema | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-hostile-input.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-payload.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-plan.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/src/verification-contract.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-preflight.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-receipt.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/src/verification-contract.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-scenarios.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-semantics.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/verification-timeouts.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/workflow-decision-property.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/workflow-decision-review-loop-cap.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow-schema/test/workflow-decision.test.mjs` | packages/agentic-workflow-schema | `packages/agentic-workflow-schema/src/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/budgets.route-ceilings.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/Budgets.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/charter.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/charter/interview.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/cli.surface.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/config-cli.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/content-guard.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/content-guard.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc-retention-cli.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc-retention.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/retention/retention.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.chunks.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/chunks.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.degradations.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/envelope.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.docops.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/grammar.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.embed-rejection.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/embeddings.mjs`, `packages/agentic-workflow/src/doc/sqlite.mjs`, `packages/agentic-workflow/src/doc/store.mjs`, `packages/agentic-workflow/src/doc/sync.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.embeddings.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/embeddings.mjs`, `packages/agentic-workflow/src/doc/sqlite.mjs`, `packages/agentic-workflow/src/doc/store.mjs`, `packages/agentic-workflow/src/doc/sync.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.envelope.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/envelope.mjs`, `packages/agentic-workflow/src/doc/grammar.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.hybrid.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/embeddings.mjs`, `packages/agentic-workflow/src/doc/grammar.mjs`, `packages/agentic-workflow/src/doc/query.mjs`, `packages/agentic-workflow/src/doc/retrieval.mjs`, `packages/agentic-workflow/src/doc/sqlite.mjs`, `packages/agentic-workflow/src/doc/store.mjs`, `packages/agentic-workflow/src/doc/sync.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.query.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/envelope.mjs`, `packages/agentic-workflow/src/doc/grammar.mjs`, `packages/agentic-workflow/src/doc/query.mjs`, `packages/agentic-workflow/src/doc/store.mjs`, `packages/agentic-workflow/src/doc/sync.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.roundtrip.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/section-locator.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.section-locator.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/section-locator.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.store.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/config.mjs`, `packages/agentic-workflow/src/doc/manifest.mjs`, `packages/agentic-workflow/src/doc/sqlite.mjs`, `packages/agentic-workflow/src/doc/store.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.structure.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/chunks.mjs`, `packages/agentic-workflow/src/doc/docops.mjs`, `packages/agentic-workflow/src/doc/manifest.mjs`, `packages/agentic-workflow/src/doc/structure-schema.mjs`, `packages/agentic-workflow/src/doc/structure.mjs`, `packages/agentic-workflow/src/runner/unit-doc-phases.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doc.sync.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/manifest.mjs`, `packages/agentic-workflow/src/doc/sqlite.mjs`, `packages/agentic-workflow/src/doc/store.mjs`, `packages/agentic-workflow/src/doc/sync.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doctor.checks.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doctor/checks.mjs`, `packages/agentic-workflow/src/doctor/doctor.mjs`, `packages/agentic-workflow/src/doctor/vocabulary.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doctor.cli.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doctor/checks.mjs`, `packages/agentic-workflow/src/doctor/vocabulary.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doctor.inventory.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doctor/checks.mjs`, `packages/agentic-workflow/src/doctor/inventory.mjs`, `packages/agentic-workflow/src/doctor/vocabulary.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doctor.vehicle.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doctor/checks.mjs`, `packages/agentic-workflow/src/doctor/doctor.mjs`, `packages/agentic-workflow/src/doctor/vehicle.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/doctor.wizard.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/edit.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/Budgets.mjs`, `packages/agentic-workflow/src/edit/Changelog.mjs`, `packages/agentic-workflow/src/edit/Manifest.mjs`, `packages/agentic-workflow/src/edit/Roadmap.mjs`, `packages/agentic-workflow/src/edit/UnitDoc.mjs`, `packages/agentic-workflow/src/writer/driver.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/elicitation.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/elicitation/prespec.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/feedback.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/feedback/index.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/forge-read.shim.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/content-guard.mjs`, `packages/agentic-workflow/src/forge-read/grammar.mjs`, `packages/agentic-workflow/src/forge-read/index.mjs`, `packages/agentic-workflow/src/forge-read/shim.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/forge-read.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/content-guard.mjs`, `packages/agentic-workflow/src/forge-read/grammar.mjs`, `packages/agentic-workflow/src/forge-read/index.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/forge.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/forge.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/fullauto-merge.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/fullauto-merge.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/git-identity.hook.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/guard/git-identity.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/guard.command.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/guard/command.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/guard.payload.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/guard/payload.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/hook-shims.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/journal.driver.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/journal/aggregate.mjs`, `packages/agentic-workflow/src/journal/driver.mjs`, `packages/agentic-workflow/src/journal/drivers/markdown.mjs`, `packages/agentic-workflow/src/journal/drivers/sqlite.mjs`, `packages/agentic-workflow/src/journal/entry.mjs`, `packages/agentic-workflow/src/journal/fragment.mjs`, `packages/agentic-workflow/src/log/publish.mjs`, `packages/agentic-workflow/src/log/render.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/journal.headless.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/journal/aggregate.mjs`, `packages/agentic-workflow/src/journal/fragment.mjs`, `packages/agentic-workflow/src/journal/headless.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/journal.surfaces.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/journal/entry.mjs`, `packages/agentic-workflow/src/journal/fragment.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/journal.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/journal/aggregate.mjs`, `packages/agentic-workflow/src/journal/fragment.mjs`, `packages/agentic-workflow/src/log/publish.mjs`, `packages/agentic-workflow/src/log/render.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/journal.write.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/journal/fragment.mjs`, `packages/agentic-workflow/src/log/render.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/log.publish.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/log/publish.mjs`, `packages/agentic-workflow/src/log/render.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/log.render.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/log/render.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/materialize.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/materialize/materialize.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/memory-probe.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/memory/probe.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/path-guard.engine.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/path-policy.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/provenance.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/Provenance.mjs`, `packages/agentic-workflow/src/edit/UnitDoc.mjs`, `packages/agentic-workflow/src/verify/Verify.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/provision.cli.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/provision/rg.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/provision.permissions.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/provision/permissions.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/quality-metrics.cli.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/quality-metrics.collect.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/runner/sensors/quality-metrics.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/resolve-passes.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/passes/names.mjs`, `packages/agentic-workflow/src/passes/resolve.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/resources.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/resources/admit.mjs`, `packages/agentic-workflow/src/resources/check.mjs`, `packages/agentic-workflow/src/resources/detect.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/roadmap-check.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/Roadmap.mjs`, `packages/agentic-workflow/src/index-document.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/runner.ceremony-p0.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/UnitDoc.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/runner.dispatch.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/runner.distribution.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/runner/cli.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/runner.resolve.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/runner/resolve.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/runner.sensors.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/UnitDoc.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/section.cli.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/doc/section-locator.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/settled-carrier.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/edit/UnitDoc.mjs`, `packages/agentic-workflow/src/edit/schema.mjs`, `packages/agentic-workflow/src/retention/retention.mjs`, `packages/agentic-workflow/src/verify/Verify.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/skills.cli.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/skills.discovery.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/skills/discovery.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/skills.register.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/skills/register.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/skills.screen.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/skills/screen.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/telemetry-merge-install.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/telemetry/merge-install.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/telemetry/ledger.mjs`, `packages/agentic-workflow/src/telemetry/reconstruct.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/temp.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/temp.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/tool-choice.policy.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/tool-choice/availability.mjs`, `packages/agentic-workflow/src/tool-choice/policy.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/turn-contract.engine.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/turn-contract.forge.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/turn-contract.parity.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/verify.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/verify/Verify.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/workflow-status-retention.test.mjs` | packages/agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/writer.driver.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/writer/conformance.mjs`, `packages/agentic-workflow/src/writer/driver.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/agentic-workflow/test/writer.merge.test.mjs` | packages/agentic-workflow | `packages/agentic-workflow/src/telemetry/ledger.mjs`, `packages/agentic-workflow/src/writer/merges.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/alias-coverage.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/scripts/bundle-skills.mjs`, `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/extension/index.ts`, `packages/pi-agentic-workflow/src/routing/catalogue.ts`, `packages/pi-agentic-workflow/src/routing/dispatch.ts`, `packages/pi-agentic-workflow/src/routing/types.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/argument-forwarding.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/load.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/auto-log-session.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/auto-log-session.ts`, `packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts`, `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/auto-log-session.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/auto-log-session.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/aw-index-command.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/aw-index-command.ts`, `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/routing/catalogue.ts`, `packages/pi-agentic-workflow/src/routing/types.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/bundle-lifecycle.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/scripts/bundle-skills.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-closeout.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-config-single-source.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts`, `packages/pi-agentic-workflow/src/conductor/types.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-config.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-crash-resume.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-decide.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-invoke.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-journal.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-loop-resume.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-loop.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-resume.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-snapshot.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-supervisor.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/conductor-urgency.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/conductor/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-extension.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/extension.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-jsonc.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/load.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-merge-passes.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-merge-stateflow.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/merge.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-merge-subagents.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-merge.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-schema-passes.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/schema.ts`, `packages/pi-agentic-workflow/src/config/types.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-schema-phase-batching.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/extension.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-schema-preset-profile.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-schema-stateflow.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-schema-subagents.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/config-schema-tier-routing.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/default-inherit.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/load.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/path-policy.ts`, `packages/pi-agentic-workflow/src/routing/types.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/dispatch-refusals.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/load.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/embed-profile-console.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/presets.ts`, `packages/pi-agentic-workflow/src/settings/console.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/embed-profile.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/embed-profile.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/embed-profile.ts`, `packages/pi-agentic-workflow/src/config/presets.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/engram-provision.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/engram.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/event-reliability-matrix.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/first-run-hint.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/routing/state.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/folded-description.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/routing/catalogue.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/index.ts`, `packages/pi-agentic-workflow/src/guards/git-identity-consent.ts`, `packages/pi-agentic-workflow/src/guards/git-identity.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/guard-plugin-config.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/extension.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/guard-plugin-core.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/guards/plugin-core.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/hooks-config.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/hooks/config.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/hooks-dispatcher.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/hooks/dispatcher.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/hooks-runner.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/hooks/runner.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/hooks-wiring.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/hooks-wiring.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/lockfile-policy.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/log-session-command.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/extension/index.ts`, `packages/pi-agentic-workflow/src/extension/log-session-command.ts`, `packages/pi-agentic-workflow/src/log-session-invocation.ts`, `packages/pi-agentic-workflow/src/routing/catalogue.ts`, `packages/pi-agentic-workflow/src/routing/types.ts`, `packages/pi-agentic-workflow/src/runtime.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/log-session-invocation.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/model-profiles.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/presets.ts`, `packages/pi-agentic-workflow/src/config/profiles.ts`, `packages/pi-agentic-workflow/src/config/schema.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/mutation-table.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/scripts/mutation-check.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/on-settle-keep.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/paged-select.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/settings/picker.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/path-protection.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/path-policy.ts`, `packages/pi-agentic-workflow/src/extension/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/permission-layer.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/picker-component.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/settings/picker.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/picker-filter.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/settings/picker.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/preset-profiles.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/presets.ts`, `packages/pi-agentic-workflow/src/config/profiles.ts`, `packages/pi-agentic-workflow/src/settings/view.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/profile-fallback.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/routing/state.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/projection.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/scripts/projection.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/provider-presets.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/config/presets.ts`, `packages/pi-agentic-workflow/src/config/profiles.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/receipt-guard.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/receipt-guard.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/restore-after-settle.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/runner-launch.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/runner-bin.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/runner-prose.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/runtime.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/runtime.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/serena-activation-check.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/serena-readiness.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/routing/serena-readiness.ts`, `packages/pi-agentic-workflow/src/routing/state.ts`, `packages/pi-agentic-workflow/src/routing/types.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/session-telemetry.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/session-telemetry.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/settings-console-jsonc.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/load.ts`, `packages/pi-agentic-workflow/src/settings/console.ts`, `packages/pi-agentic-workflow/src/settings/jsonc-write.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/settings-console.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/load.ts`, `packages/pi-agentic-workflow/src/config/presets.ts`, `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/extension/index.ts`, `packages/pi-agentic-workflow/src/routing/types.ts`, `packages/pi-agentic-workflow/src/settings/console.ts`, `packages/pi-agentic-workflow/src/settings/picker.ts`, `packages/pi-agentic-workflow/src/settings/store.ts`, `packages/pi-agentic-workflow/src/settings/view.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/load.ts`, `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/extension/index.ts`, `packages/pi-agentic-workflow/src/routing/catalogue.ts`, `packages/pi-agentic-workflow/src/routing/types.ts`, `packages/pi-agentic-workflow/src/settings/console.ts`, `packages/pi-agentic-workflow/src/settings/picker.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/skill-parity.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/scripts/bundle-skills.mjs`, `packages/pi-agentic-workflow/scripts/projection.mjs` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/stateflow-dispatch.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/stateflow-lifecycle.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/stateflow/lifecycle.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/telemetry-extension.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/index.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts`, `packages/pi-agentic-workflow/src/telemetry-sinks.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/telemetry-sinks.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/merge.ts`, `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/types.ts`, `packages/pi-agentic-workflow/src/extension/index.ts`, `packages/pi-agentic-workflow/src/guards/tool-choice.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/unavailable-stop.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/untrusted-project-config.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/config/defaults.ts`, `packages/pi-agentic-workflow/src/config/load.ts`, `packages/pi-agentic-workflow/src/config/merge.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/vendor-neutral.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/verified-baseline.test.mjs` | packages/pi-agentic-workflow | - | undeclared | unmeasured | undeclared | keep |
| `packages/pi-agentic-workflow/test/workflow-tools.test.mjs` | packages/pi-agentic-workflow | `packages/pi-agentic-workflow/src/extension/factory.ts`, `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` | packages/pi-nan-agentic-workflow | `packages/pi-nan-agentic-workflow/src/embed-profile.ts`, `packages/pi-nan-agentic-workflow/src/phase-batching.ts`, `packages/pi-nan-agentic-workflow/src/preset.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-nan-agentic-workflow/test/docs-parity.test.mjs` | packages/pi-nan-agentic-workflow | `packages/pi-nan-agentic-workflow/src/preset.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-nan-agentic-workflow/test/embed-profile.test.mjs` | packages/pi-nan-agentic-workflow | `packages/pi-nan-agentic-workflow/src/embed-profile.ts`, `packages/pi-nan-agentic-workflow/src/extension.ts`, `packages/pi-nan-agentic-workflow/src/preset.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-nan-agentic-workflow/test/phase-batching.test.mjs` | packages/pi-nan-agentic-workflow | `packages/pi-nan-agentic-workflow/src/extension.ts`, `packages/pi-nan-agentic-workflow/src/phase-batching-command.ts`, `packages/pi-nan-agentic-workflow/src/phase-batching.ts`, `packages/pi-nan-agentic-workflow/src/preset.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-nan-agentic-workflow/test/registration.test.mjs` | packages/pi-nan-agentic-workflow | `packages/pi-nan-agentic-workflow/src/extension.ts`, `packages/pi-nan-agentic-workflow/src/preset.ts` | undeclared | unmeasured | undeclared | keep |
| `packages/pi-nan-agentic-workflow/test/tier-routing.test.mjs` | packages/pi-nan-agentic-workflow | `packages/pi-nan-agentic-workflow/src/preset.ts` | undeclared | unmeasured | undeclared | keep |
| `scripts/activity-fusion.test.mjs` | root | `packages/agentic-workflow/src/runner/catalog.json`, `skills/unit-lane/references/PLAN.md` | contract,convention | 3.8 | cost-over-risk | keep |
| `scripts/adversarial-verdict.test.mjs` | root | `scripts/adversarial-verdict.mjs` | contract,failure-path | 0.8 | declared | keep |
| `scripts/audit-pr-receipt.test.mjs` | root | `scripts/review-receipt.mjs`, `skills/audit-pr/SKILL.md` | contract,failure-path | 3.1 | cost-over-risk | keep |
| `scripts/batch-scheduler.test.mjs` | root | `scripts/batch-scheduler.mjs` | boundary,contract,failure-path | 3.6 | cost-over-risk | keep |
| `scripts/capabilities.test.mjs` | root | `packages/agentic-workflow/src/runner/capabilities.mjs` | contract,failure-path | 0.4 | declared | keep |
| `scripts/capability-inventory.test.mjs` | root | `docs/CAPABILITIES.md`, `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` | contract,convention | 0.2 | declared | keep |
| `scripts/catalog.test.mjs` | root | `packages/agentic-workflow/src/runner/catalog.json` | contract,failure-path | 6.4 | cost-over-risk | keep |
| `scripts/ceremony-docs.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony/docs.mjs` | contract,failure-path | 21.1 | cost-over-risk | keep |
| `scripts/ceremony-findings-ledger.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony/findings.mjs`, `packages/agentic-workflow/src/runner/ceremony/ledger.mjs` | contract,failure-path | 58.7 | cost-over-risk | keep · selected |
| `scripts/ceremony-passive.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony/passive.mjs` | contract,failure-path | 23.4 | cost-over-risk | keep |
| `scripts/ceremony-profile.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony-profile.mjs` | contract,failure-path | 6.7 | cost-over-risk | keep |
| `scripts/ceremony-unit-plan.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony/plan.mjs`, `packages/agentic-workflow/src/runner/ceremony/unit.mjs` | contract,failure-path | 55.5 | cost-over-risk | keep · selected |
| `scripts/ceremony-workspace.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony/workspace.mjs` | contract,failure-path | 25.2 | cost-over-risk | keep |
| `scripts/ceremony.test.mjs` | root | `packages/agentic-workflow/src/runner/ceremony/index.mjs` | contract,failure-path | 6.5 | cost-over-risk | keep |
| `scripts/changeset-create.test.mjs` | root | `scripts/changeset-create.mjs` | contract,failure-path | 3.9 | cost-over-risk | keep |
| `scripts/check-changelog-row.test.mjs` | root | `scripts/check-changelog-row.mjs` | contract,failure-path | 0.6 | declared | keep |
| `scripts/check-skill-context.test.mjs` | root | `scripts/check-skill-context.mjs` | boundary,contract,convention | 17.3 | cost-over-risk | keep |
| `scripts/cli-coverage.test.mjs` | root | `packages/agentic-workflow/README.md`, `packages/agentic-workflow/bin/agentic-workflow.mjs`, `skills`, `skills/runner-contract/references/RUNNER.md`, `template` | convention,distribution-contract | 2.1 | cost-over-risk | keep |
| `scripts/config-guards-doc.test.mjs` | root | `docs/workflow/CONFIG.md`, `packages/agentic-workflow-schema/src/config.ts` | contract,convention | 0.3 | declared | keep |
| `scripts/content-guard-discipline.test.mjs` | root | `packages/agentic-workflow/src/content-guard.mjs` | contract,convention | 1.1 | declared | keep |
| `scripts/continuation-discipline.test.mjs` | root | `docs/workflow/REPOSITORY_STATE.md`, `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` | contract,failure-path | 5.8 | cost-over-risk | keep |
| `scripts/correction-budget.test.mjs` | root | `scripts/correction-budget.mjs` | contract,failure-path | 5 | cost-over-risk | keep |
| `scripts/coverage-gap.test.mjs` | root | `scripts/coverage-gap.mjs` | contract,failure-path | 2.2 | cost-over-risk | keep |
| `scripts/decision-promotion.test.mjs` | root | `scripts/decision-promotion.mjs` | contract,failure-path,fixture-support | 0.7 | declared | keep |
| `scripts/dependency-advisory-pass.test.mjs` | root | `scripts/dependency-advisory-pass.mjs` | contract,failure-path | 0.2 | declared | keep |
| `scripts/dependency-gate.test.mjs` | root | `scripts/local-gate.mjs` | contract,failure-path | 0.1 | declared | keep |
| `scripts/diff-guard.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/diff-guard.mjs` | contract,failure-path | 6.4 | cost-over-risk | keep |
| `scripts/differential-baseline.test.mjs` | root | `scripts/differential-baseline.mjs` | contract,failure-path | 2.2 | cost-over-risk | keep |
| `scripts/dimension-regression.test.mjs` | root | `scripts/dimension-regression.mjs` | contract,failure-path | 1 | declared | keep |
| `scripts/doc-discipline.test.mjs` | root | `packages/agentic-workflow/src/doc` | contract,convention | 3 | cost-over-risk | keep |
| `scripts/docs-generate.test.mjs` | root | `scripts/docs-generate.mjs` | contract,distribution-contract | 8.8 | cost-over-risk | keep |
| `scripts/docs-generated-merge.test.mjs` | root | `scripts/docs-generated-merge.mjs` | boundary,contract,failure-path | 4 | cost-over-risk | keep |
| `scripts/findings-corpus.test.mjs` | root | `scripts/findings-corpus.mjs` | contract,failure-path | 1.7 | declared | keep |
| `scripts/forge-read-drift.test.mjs` | root | `scripts/forge-read-drift.mjs` | contract,failure-path | 0.3 | declared | keep |
| `scripts/gate-receipt.test.mjs` | root | `scripts/gate-receipt.mjs` | contract,failure-path | 3.9 | cost-over-risk | keep |
| `scripts/git-config-writes.test.mjs` | root | `scripts/git-config-writes.mjs` | contract,convention,failure-path | 2.5 | declared | keep |
| `scripts/git-env.test.mjs` | root | `scripts/git-env.mjs` | contract,failure-path | 0.3 | declared | keep |
| `scripts/golden-fixture.test.mjs` | root | `docs/workflow/GOLDEN_FIXTURE.md`, `scripts/fixtures/golden-fixture` | contract,fixture-support | 2.2 | cost-over-risk | keep |
| `scripts/guide-split.test.mjs` | root | `AGENTS.md`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | convention | 0.3 | declared | keep |
| `scripts/identity-hook-parity.test.mjs` | root | `scripts/git-config-writes.mjs`, `scripts/push-identity-check.mjs` | contract,failure-path | 22.1 | cost-over-risk | keep |
| `scripts/index-document.test.mjs` | root | `packages/agentic-workflow/src/index-document.mjs` | contract,failure-path | 0.5 | declared | keep |
| `scripts/inviolable-rules.test.mjs` | root | `AGENTS.md`, `docs/workflow/GATE_INVENTORY.md` | contract,convention,failure-path | 3.4 | cost-over-risk | keep |
| `scripts/invocation-drift.test.mjs` | root | `scripts/invocation-drift.mjs` | contract,failure-path | 2.4 | cost-over-risk | keep |
| `scripts/journal-corpus.test.mjs` | root | `scripts/journal-corpus.mjs` | contract,failure-path | 0.8 | declared | keep |
| `scripts/knowledge-honesty-contract.test.mjs` | root | `skills/unit-lane/references/RESEARCH.md` | convention | 0.2 | declared | keep |
| `scripts/lane-era-lineage.test.mjs` | root | `packages/agentic-workflow/src/runner/unit-route.mjs` | contract,failure-path | 15.5 | cost-over-risk | keep |
| `scripts/ledger-ownership.test.mjs` | root | `skills/pre-execution-review/references/LEDGERS.md` | contract,convention | 1.9 | declared | keep |
| `scripts/ledger-provenance.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/ledger-provenance.mjs` | contract,failure-path | 45.2 | cost-over-risk | keep |
| `scripts/lint-changeset.test.mjs` | root | `scripts/lint-changeset.mjs` | contract,failure-path | 1.5 | declared | keep |
| `scripts/local-config-contract.test.mjs` | root | `packages/agentic-workflow-schema/src/config.ts` | contract,failure-path | 0.4 | declared | keep |
| `scripts/local-gate.test.mjs` | root | `scripts/local-gate.mjs` | contract,failure-path | 11.6 | obligation-duplicate | keep |
| `scripts/log-immutability.test.mjs` | root | `scripts/log-immutability.mjs` | contract,failure-path | 12.2 | cost-over-risk | keep |
| `scripts/needs-input.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/needs-input.mjs` | contract,failure-path | 18.1 | cost-over-risk | keep |
| `scripts/next-recommendations.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` | contract | 0.1 | declared | keep |
| `scripts/next-step-ranking.test.mjs` | root | `packages/agentic-workflow/src/index-document.mjs` | contract | 51.2 | cost-over-risk | keep · selected |
| `scripts/normative-drift.test.mjs` | root | `AGENTS.md`, `packages/agentic-workflow-schema/src/vocabularies.ts` | contract,failure-path | 4.2 | cost-over-risk | keep |
| `scripts/npm-availability-wait.test.mjs` | root | `scripts/npm-availability-wait.mjs` | contract,failure-path | 0.2 | declared | keep |
| `scripts/npm-version-gate.test.mjs` | root | `scripts/npm-version-gate.mjs` | contract,failure-path | 0.5 | declared | keep |
| `scripts/path-protection.test.mjs` | root | `packages/agentic-workflow/src/path-policy.mjs` | contract,failure-path | 8.7 | cost-over-risk | keep |
| `scripts/phase-lint.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/phase-lint.mjs` | contract,failure-path | 86.2 | cost-over-risk | keep · selected |
| `scripts/pi-durable-spike.test.mjs` | root | `scripts/pi-durable-spike.mjs` | contract,failure-path | 0.2 | declared | keep |
| `scripts/pin-watch.test.mjs` | root | `scripts/pin-watch.mjs` | contract,failure-path | 0.2 | declared | keep |
| `scripts/pr-evidence-pack.test.mjs` | root | `skills/audit-pr/SKILL.md`, `template/.github/PULL_REQUEST_TEMPLATE.md` | convention,distribution-contract | 0.2 | declared | keep |
| `scripts/pre-execution-attribution.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs` | contract | 0.4 | declared | keep |
| `scripts/pre-execution-quality.test.mjs` | root | `skills/pre-execution-review/references/LEDGERS.md`, `skills/pre-execution-review/references/POLICY.md` | contract,convention | 0.3 | declared | keep |
| `scripts/pre-execution-receipt-parent.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/pre-execution-contract.mjs` | contract,failure-path | 0.2 | declared | keep |
| `scripts/pre-execution-sensor.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs` | contract,failure-path | 35.7 | cost-over-risk | keep |
| `scripts/pre-execution-timeline.test.mjs` | root | `packages/agentic-workflow-schema/src/pre-execution.ts` | contract,failure-path | 6.7 | cost-over-risk | keep |
| `scripts/pre-execution-wording-only-manifest.test.mjs` | root | `packages/agentic-workflow/src/index-document.mjs` | contract,failure-path | 6.1 | obligation-duplicate | keep |
| `scripts/precondition-closure.test.mjs` | root | `skills/unit-lane/references/DESIGN.md` | convention | 0.1 | declared | keep |
| `scripts/product-audit-rescope.test.mjs` | root | `skills/product-audit/SKILL.md` | contract,convention | 0.3 | declared | keep |
| `scripts/product-audit-surplus.test.mjs` | root | `skills/product-audit/references/AUDIT_DIMENSIONS.md` | contract,convention | 0.3 | declared | keep |
| `scripts/promise-coherence.test.mjs` | root | `scripts/promise-coherence.mjs` | contract,failure-path | 8.3 | cost-over-risk | keep |
| `scripts/prose-gate-inventory.test.mjs` | root | `scripts/prose-gate-inventory.mjs` | contract,failure-path | 1 | declared | keep |
| `scripts/published-refs.test.mjs` | root | `scripts/published-refs.mjs` | contract,failure-path | 1.6 | declared | keep |
| `scripts/push-identity-check.test.mjs` | root | `scripts/push-identity-check.mjs` | contract,failure-path | 9 | cost-over-risk | keep |
| `scripts/reading-coverage.test.mjs` | root | `docs/fix/646-docs-skills-reconciliation/second-read.md`, `scripts/reading-coverage.mjs` | convention,failure-path | 0.8 | declared | keep |
| `scripts/red-first.test.mjs` | root | `scripts/red-first.mjs` | contract,failure-path | 34.4 | cost-over-risk | keep |
| `scripts/relay-packet.test.mjs` | root | `scripts/relay-packet.mjs` | contract,failure-path | 4 | cost-over-risk | keep |
| `scripts/relay-route.test.mjs` | root | `packages/agentic-workflow/src/relay`, `packages/agentic-workflow/src/runner/catalog.json` | contract,failure-path | 7.3 | cost-over-risk | keep |
| `scripts/release-workflows.test.mjs` | root | `.github/workflows` | convention,distribution-contract | 0.2 | declared | keep |
| `scripts/release.test.mjs` | root | `scripts/release.mjs` | contract,distribution-contract,failure-path | 10 | cost-over-risk | keep |
| `scripts/relevant-files.test.mjs` | root | `scripts/relevant-files.mjs` | contract,failure-path | 1.6 | declared | keep |
| `scripts/repository-state.test.mjs` | root | `docs/workflow/REPOSITORY_STATE.md`, `skills/resolve-repository-state/references/STATE_CONTRACT.md` | contract,failure-path | 1.3 | declared | keep |
| `scripts/residual-classify.test.mjs` | root | `scripts/residual-classify.mjs` | contract,failure-path | 7.3 | cost-over-risk | keep |
| `scripts/residue-dimensions.test.mjs` | root | `AGENTS.md`, `skills/product-audit/references/AUDIT_DIMENSIONS.md` | convention | 0.4 | declared | keep |
| `scripts/restatement-sweep.test.mjs` | root | `AGENTS.md`, `skills/audit-docs/references/RESTATEMENT.md` | convention,failure-path | 1.1 | declared | keep |
| `scripts/retention-debt.test.mjs` | root | `scripts/retention-debt.mjs` | contract,failure-path | 0.8 | declared | keep |
| `scripts/retention-declaration.test.mjs` | root | `scripts/retention-declaration.mjs` | contract,failure-path | 0.3 | declared | keep |
| `scripts/review-loop-discipline.test.mjs` | root | `skills/execute-phase/references/FOLDING.md` | contract,convention | 3.5 | cost-over-risk | keep |
| `scripts/review-receipt.test.mjs` | root | `scripts/review-receipt.mjs` | contract,failure-path | 5 | cost-over-risk | keep |
| `scripts/review-state.test.mjs` | root | `scripts/review-state.mjs` | contract,failure-path | 2.9 | cost-over-risk | keep |
| `scripts/rigidity-review.test.mjs` | root | `scripts/rigidity-review.mjs` | contract,failure-path | 2 | cost-over-risk | keep |
| `scripts/risk-tier-ceremony.test.mjs` | root | `skills/execute-phase/references/risk-tiers.md` | contract,failure-path | 4.9 | cost-over-risk | keep |
| `scripts/risk-tier-classifier.test.mjs` | root | `packages/agentic-workflow/src/runner/risk-tiers.mjs` | boundary,contract,failure-path | 0.2 | declared | keep |
| `scripts/roadmap-moved.test.mjs` | root | `docs/ROADMAP.md` | convention | 2.7 | cost-over-risk | keep |
| `scripts/roadmap-settle.test.mjs` | root | `scripts/roadmap-settle.mjs` | contract,failure-path | 4.3 | cost-over-risk | keep |
| `scripts/run-root-suite.test.mjs` | root | `scripts/run-root-suite.mjs` | boundary,contract,failure-path | 7.2 | cost-over-risk | keep |
| `scripts/scaffold-guide.test.mjs` | root | `template/AGENTS.md` | convention,distribution-contract | 0.1 | declared | keep |
| `scripts/scaffold-parity.test.mjs` | root | `template` | convention,distribution-contract | 0.2 | declared | keep |
| `scripts/scope-manifest.test.mjs` | root | `scripts/scope-manifest.mjs` | contract,failure-path | 4.4 | cost-over-risk | keep |
| `scripts/secret-scan.test.mjs` | root | `template/.agentic-workflow/hooks/secret-scan.mjs` | contract,failure-path | 9.5 | cost-over-risk | keep |
| `scripts/session-close.test.mjs` | root | `scripts/session-close.mjs` | contract,failure-path | 5.6 | cost-over-risk | keep |
| `scripts/setup-env.test.mjs` | root | `scripts/setup-env.mjs` | contract,failure-path | 14.6 | cost-over-risk | keep |
| `scripts/shared-doc-merge.test.mjs` | root | `scripts/shared-doc-merge.mjs` | contract,failure-path | 9.4 | cost-over-risk | keep |
| `scripts/skill-lint.test.mjs` | root | `scripts/skill-lint.mjs` | contract,failure-path | 2 | cost-over-risk | keep |
| `scripts/spec-by-reference.test.mjs` | root | `docs/features/_TEMPLATE/SPEC.md`, `docs/fix/_TEMPLATE/SPEC.md` | contract,convention | 5.9 | cost-over-risk | keep |
| `scripts/structural-sibling-pins.test.mjs` | root | `scripts/structural-sibling-pins.mjs` | convention | 0.5 | declared | keep |
| `scripts/substrate.test.mjs` | root | `docs/workflow/LANE_FLOW.md`, `packages/agentic-workflow/src/runner/sensors/substrate.mjs`, `skills/orchestration-envelope/references/TURN_CONTRACT.md` | contract,failure-path | 7.8 | cost-over-risk | keep |
| `scripts/telemetry-coverage.test.mjs` | root | `packages/agentic-workflow/src/telemetry`, `packages/pi-agentic-workflow/src/extension/log-session-command.ts` | contract,convention | 0.2 | declared | keep |
| `scripts/telemetry-report.test.mjs` | root | `scripts/telemetry-report.mjs` | contract,failure-path | 5.6 | cost-over-risk | keep |
| `scripts/temp-hygiene.test.mjs` | root | `scripts/temp-hygiene.mjs` | contract,convention | 0.7 | declared | keep |
| `scripts/temp-root.test.mjs` | root | `scripts/temp-root.mjs` | contract,failure-path | 0.1 | declared | keep |
| `scripts/test-impact.test.mjs` | root | `scripts/test-impact.mjs` | boundary,contract,failure-path | 3.5 | cost-over-risk | keep |
| `scripts/test-obligation-tags.test.mjs` | root | `scripts/test-obligation-tags.mjs` | contract,convention,failure-path | 1.4 | declared | keep |
| `scripts/test-route.test.mjs` | root | `scripts/test-route.mjs` | contract,failure-path | 0.5 | declared | keep |
| `scripts/tier-cost.test.mjs` | root | `scripts/tier-cost.mjs` | contract,distribution-contract,failure-path | 1.5 | declared | keep |
| `scripts/tmp-gc.test.mjs` | root | `scripts/tmp-gc.mjs` | contract,failure-path | 0.8 | declared | keep |
| `scripts/tool-choice-parity.test.mjs` | root | `packages/agentic-workflow/src/tool-choice/policy.mjs` | contract,convention | 0.2 | declared | keep |
| `scripts/triage-rescope.test.mjs` | root | `skills/triage-issue/SKILL.md` | contract,convention | 0.3 | declared | keep |
| `scripts/triage-setup-defect.test.mjs` | root | `packages/agentic-workflow/src/doctor/vehicle.mjs`, `skills/triage-issue/references/ISSUE_PROCESS.md` | contract,failure-path | 0.2 | declared | keep |
| `scripts/turn-contract-grammar.test.mjs` | root | `skills/orchestration-envelope/references/TURN_CONTRACT.md` | contract,failure-path | 32.1 | cost-over-risk | keep |
| `scripts/turn-contract-single-owner.test.mjs` | root | `skills/orchestration-envelope/references/TURN_CONTRACT.md` | convention | 0.2 | declared | keep |
| `scripts/unit-cycle.test.mjs` | root | `scripts/unit-cycle.mjs` | contract,failure-path | 0.3 | declared | keep |
| `scripts/unit-doc-contract.test.mjs` | root | `docs/features/_TEMPLATE/SPEC.md`, `docs/fix/_TEMPLATE/SPEC.md`, `packages/agentic-workflow-schema/src/pre-execution.ts` | contract,convention | 2 | cost-over-risk | keep |
| `scripts/unit-route.test.mjs` | root | `packages/agentic-workflow/src/runner/unit-route.mjs` | contract,failure-path | 31.5 | obligation-duplicate | keep |
| `scripts/update-tools.test.mjs` | root | `scripts/update-tools.mjs` | contract,failure-path | 0.2 | declared | keep |
| `scripts/version-parity-gate.test.mjs` | root | `scripts/version-parity-gate.mjs` | contract,distribution-contract,failure-path | 0.6 | declared | keep |
| `scripts/vocabulary-parity.test.mjs` | root | `packages/agentic-workflow-schema/src/vocabularies.ts` | contract,convention | 1.2 | declared | keep |
| `scripts/vocabulary-probe.test.mjs` | root | `scripts/vocabulary-probe.mjs` | contract,failure-path | 0.3 | declared | keep |
| `scripts/workflow-docs-index.test.mjs` | root | `docs/workflow`, `docs/workflow/README.md` | convention | 0.1 | declared | keep |
| `scripts/workflow-status-compact.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` | contract | 16.9 | obligation-duplicate | keep |
| `scripts/workflow-status-pre-execution.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/pre-execution-contract.mjs`, `skills/workflow-status/references/PRE_EXECUTION.md` | contract,failure-path | 2.4 | cost-over-risk | keep |
| `scripts/workflow-status-sensor.test.mjs` | root | `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` | boundary,contract,failure-path | 75.4 | cost-over-risk | keep · selected |
| `scripts/workspace-lock-policy.test.mjs` | root | `bun.lock`, `package.json` | convention,distribution-contract | 0.2 | declared | keep |
| `scripts/worktree-guard.test.mjs` | root | `scripts/worktree-guard.mjs` | contract,failure-path | 4.4 | cost-over-risk | keep |

verdict: PASS
