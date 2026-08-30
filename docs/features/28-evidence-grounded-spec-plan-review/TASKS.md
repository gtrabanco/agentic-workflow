# TASKS — 28-evidence-grounded-spec-plan-review

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit.

## P1 — Publish pre-execution evidence contracts

Layer: schema/db · Done-when: `cd packages/agentic-workflow-schema && npm test`
-> exit 0 with all new and existing suites green.

- [ ] Write red-first public-entry tests for strict snapshot/receipt shapes, closed vocabularies, undeclared fields, stage matrices, bounds, normalized paths, identities, timestamps, and bounded redacted diagnostics.
- [ ] Add one internal canonical definition for both contracts and normalized DTO constructors; expose only the SPEC-approved validation entries and types.
- [ ] Implement `spec-product-v1` exact Markdown selection with missing, duplicate, and out-of-order heading rejection plus stage-aware artifact-set construction from caller-supplied bytes.
- [ ] Implement canonical UTF-8 serialization, lowercase SHA-256 digests, readonly independently checked vectors, and deterministic repeatability tests.
- [ ] Implement Product-parent lineage, policy/context/source freshness precedence, `artifactRevisionId` causal invalidation, author-exclusion semantics, and mutate/revert non-resurrection tests.
- [ ] Generate the two Draft-07 structural projections from the canonical definition, mark them non-authoritative, and add projection drift/parity checks.
- [ ] Extend package-root intents, evidence vocabulary, capability profiles, and deterministic transition fixtures for `review-spec` and `review-plan` without changing existing intent meaning.
- [ ] Export/package/document the additive surface, bump `3.4.0 -> 3.5.0`, and prove existing candidate-review and staged-verification contracts remain compatible.

## P2 — Ground and review product specifications

Layer: docs · Done-when: `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0 for grounding and SPEC-review
fixtures.

- [ ] Add the internal `evidence-grounding` skill/reference with the fixed claim-authority-evidence-freshness-unknown map, bounded questions, `CONTEXT-PREPARED | NEEDS-EVIDENCE | NEEDS-DESIGN`, and no-progress rule.
- [ ] Integrate grounding and per-write `artifactRevisionId` handoff into `design-feature` without granting it review/approval authority or engineering scope.
- [ ] Add public `review-spec` with the exact Product checks, clean-context falsification prompt, read-only artifact boundary, three verdicts, and stage-specific receipt/finding output.
- [ ] Define SPEC repair/upsert semantics: mechanical intent-preserving changes remain with `design-feature`; scope/authority/outcome gaps require the human and a new revision/review.
- [ ] Narrow `plan-feature-from-issue` so issue-derived feature work stops after Product design and current `review-spec`; remove same-turn Engineering planning bypass while retaining the internal name for compatibility.
- [ ] Gate `plan-feature` on a valid current Product receipt and exact parent snapshot; fail closed on missing/stale/wrong-stage/candidate receipts.
- [ ] Add SPEC-review fixtures for complete, empty, contradictory, unsupported, self-approved, stale, causal-revert, same-model-clean-context, and issue-export cases.
- [ ] Bump/changelog every P2 skill through repository tooling and keep each entrypoint within progressive-context limits.

## P3 — Review engineering plans and freeze obligation closure

Layer: docs · Done-when: `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0 for Plan/fix, ledger,
independence, and no-progress fixtures.

- [ ] Add public `review-plan` with feature/fix input contracts, engineering checks, three verdicts, read-only boundary, and exact parent Product/Plan receipt output.
- [ ] Integrate grounding and revision rotation into `plan-feature`, `plan-feature-scaffold`, and `plan-fix`; fixes retain reproduction/root-cause/regression/rollback authority without a fake Product half.
- [ ] Add the frozen obligation-ledger format and require every normative behavior, affected use case/invariant, failure state, phase, task, owner, validator, evidence, and terminal status.
- [ ] Add stage-aware `planning-findings.md` ownership and resolution evidence; reviewers append findings, author skills repair/replan, and no reviewer mutates its approved artifact.
- [ ] Implement unioned findings, counter-evidence-only dismissal, truthful model-diversity labels, author exclusion where enforceable, bounded critique/synthesis/arbitration, and no quorum.
- [ ] Implement no-progress detection: another review needs a new snapshot or a named falsifiable question plus new evidence route; unchanged repetitions stop.
- [ ] Add Plan fixtures for feature/fix happy paths, unsupported assumptions, missing obligations, bad phase cuts, scenario omissions, wrong parent, Product conflict, wording-only repair, causal revert, and automatic-issue attempts.
- [ ] Bump/changelog every P3 skill and keep shared policy in one progressive reference/internal owner rather than duplicating it.

## P4 — Enforce upstream gates and backward routing

Layer: docs · Done-when: `node --test
scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs
scripts/audit-pr-receipt.test.mjs` -> exit 0.

- [ ] Extend `workflow-status` sensing and the existing transition/profile authority to recommend review, author repair, replan, design, or execute only from current exact evidence.
- [ ] Make `execute-phase` fail closed before implementation on missing/stale/wrong-stage Plan PASS while reserving the post-PASS pre-write slot for feature 29 discovery.
- [ ] Update `ship-roadmap` stage sequencing to design -> review-spec -> plan -> review-plan -> execute, preserving human product authority and its existing merge policy.
- [ ] Update `review-change` classification and `loop-review-fold` routing so source-local findings fold locally, Plan-rooted findings replan/re-review, and Product-rooted findings return to design/review-spec.
- [ ] Update `audit-pr` to require current upstream lineage and fully verified obligation rows while retaining exclusive `MERGE-READY` authority and current candidate receipts.
- [ ] Define legacy planned/in-progress adoption: construct/review current artifacts, never coerce old evidence, never mutate frozen acceptance, and resume only from current PASS.
- [ ] Prohibit automatic forge issue creation and follow-up deferral across all affected routes unless the user first amends the governing SPEC.
- [ ] Add end-to-end route fixtures covering current/stale/missing receipts, fix/feature paths, later review root causes, crash/re-entry, no-progress, and no partial-success envelopes.

## P5 — Harden and qualify the workflow

Layer: hardening · Done-when: every frozen validator passes and the exact
candidate has current independent review evidence with no unresolved fix-now
finding.

- [ ] Synchronize package README EN/ES, workflow/orchestration/feature/fix/migration/skill-catalog docs EN/ES, portable manual prompts, templates, and distribution metadata without duplicating machine semantics; rebuild feature 27's Pi skill bundle only through its canonical bundle script.
- [ ] Run all package gates, generated-projection drift/parity, package-content checks, full existing root tests, and regression/read verification of unchanged candidate/verification contracts.
- [ ] Run Pi bundle/parity/package tests, `node scripts/check-skill-context.mjs`, and `npx skills add . --list`; repair only the canonical owner/progressive references/metadata and re-run to PASS.
- [ ] Execute and log the golden fixture with the weakest supported executor path across the new review gates and every changed executor-path skill/version.
- [ ] Record the canary baseline/post-change fields for comparable manual units; use observed values or `not yet measured`, never an inferred savings claim.
- [ ] Run independent context-clean `review-change` on the exact candidate, fold every fix-now finding through its root-cause route, and repeat only on a changed snapshot/new falsifiable question until PASS.
- [ ] Mark progress/testing/known-issues/obligation ledgers truthfully, flip roadmap row 28 to `done`, and verify the complete frozen acceptance manifest at terminal HEAD.
- [ ] Commit/push the terminal candidate and open one PR against `main` with `Closes #146`, exact verification evidence, package release note, compatibility boundary, and no self-authorship line.
