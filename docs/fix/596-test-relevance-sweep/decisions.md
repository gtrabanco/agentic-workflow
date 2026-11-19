# Decisions — fix/596-test-relevance-sweep

Owner decisions taken at cut, plus the `path-protection-records@1` rows the
path-protection policy requires for the protected paths this unit creates and
edits. A record is a justification for a change to a test file, never an
approval, and this unit changes no assertion anywhere.

- **D1 — the obligation taxonomy is the issue's, adopted verbatim.** The six
  values, their meanings and the deletion evidence standard are the issue body's
  own text (`O1`…`O19` cite it as authority). This unit asserts nothing about the
  papers the issue cites beyond what it states (`PE-012`), so no literature claim
  enters code from memory.
- **D2 — `distribution-contract` is the issue's `prompt-byte`/`distribution-contract`
  pair resolved to one token.** Two spellings for one obligation would make the
  set ambiguous for a tag author and for the sweep's duplicate comparison; the
  distribution spelling is the wider of the two and covers the narrow one.
- **D3 — the sweep's cost input is the root gate's own output.** The gate already
  prints `PASS <file> (N.Ns)` per suite; this unit parses that log instead of
  adding a timing store nobody asked for.
- **D4 — `must-name: no` for the vocabulary's normative row.** The tag values are
  a write-time declaration per suite, not a choice an agent makes between two
  turn outcomes, so the clamp on that direction would misdescribe it. The value
  set is still pinned: the gate parses the committed const, and the owner doc's
  block is asserted to name every value (`O2`).
- **D5 — the tag names paths, not prose.** "The protected surface" is a
  repository-relative path (a file or a directory), because that is the only
  form a deterministic gate can resolve. A suite whose subject is a convention
  names the file that states the convention.
- **D6 — one declaration per suite, at the head.** A central registry was
  rejected by the issue for the deadcode-ratchet reason: a registry rots silently
  while the suites it describes keep passing.

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/test-obligation-tags.test.mjs | P3 | 2026-11-19 | execute-phase | The new gate's sibling suite, landed alone first and observed failing on the missing module (the red commit), then observed green with the implementation. Every case is an added assertion: the three refusals (missing, misplaced, dead surface), the shape faults, the vocabulary parity, the cluster/duplicate/suspect rules and the CLI contract. No existing assertion is relaxed, skipped, narrowed or deleted, and no case asserts a weaker property to make a run pass.
justification | scripts/activity-fusion.test.mjs, scripts/adversarial-verdict.test.mjs, scripts/audit-pr-receipt.test.mjs, scripts/batch-scheduler.test.mjs, scripts/capabilities.test.mjs, scripts/capability-inventory.test.mjs, scripts/catalog.test.mjs, scripts/ceremony-docs.test.mjs, scripts/ceremony-findings-ledger.test.mjs, scripts/ceremony-passive.test.mjs, scripts/ceremony-profile.test.mjs, scripts/ceremony-unit-plan.test.mjs, scripts/ceremony-workspace.test.mjs, scripts/ceremony.test.mjs, scripts/changeset-create.test.mjs, scripts/check-changelog-row.test.mjs, scripts/check-skill-context.test.mjs, scripts/config-guards-doc.test.mjs, scripts/content-guard-discipline.test.mjs, scripts/continuation-discipline.test.mjs, scripts/correction-budget.test.mjs, scripts/coverage-gap.test.mjs, scripts/dependency-advisory-pass.test.mjs, scripts/dependency-gate.test.mjs, scripts/diff-guard.test.mjs, scripts/differential-baseline.test.mjs, scripts/dimension-regression.test.mjs, scripts/doc-discipline.test.mjs, scripts/docs-generate.test.mjs, scripts/docs-generated-merge.test.mjs, scripts/findings-corpus.test.mjs, scripts/forge-read-drift.test.mjs, scripts/gate-receipt.test.mjs, scripts/git-config-writes.test.mjs, scripts/git-env.test.mjs, scripts/golden-fixture.test.mjs, scripts/guide-split.test.mjs, scripts/identity-hook-parity.test.mjs, scripts/index-document.test.mjs, scripts/invocation-drift.test.mjs, scripts/journal-corpus.test.mjs, scripts/knowledge-honesty-contract.test.mjs, scripts/lane-era-lineage.test.mjs, scripts/ledger-ownership.test.mjs, scripts/ledger-provenance.test.mjs, scripts/lint-changeset.test.mjs, scripts/local-config-contract.test.mjs, scripts/local-gate.test.mjs, scripts/log-immutability.test.mjs, scripts/needs-input.test.mjs, scripts/next-recommendations.test.mjs, scripts/next-step-ranking.test.mjs, scripts/normative-drift.test.mjs, scripts/npm-availability-wait.test.mjs, scripts/npm-version-gate.test.mjs, scripts/path-protection.test.mjs, scripts/phase-lint.test.mjs, scripts/pi-durable-spike.test.mjs, scripts/pin-watch.test.mjs, scripts/pr-evidence-pack.test.mjs, scripts/pre-execution-attribution.test.mjs, scripts/pre-execution-quality.test.mjs, scripts/pre-execution-receipt-parent.test.mjs, scripts/pre-execution-sensor.test.mjs, scripts/pre-execution-timeline.test.mjs, scripts/pre-execution-wording-only-manifest.test.mjs, scripts/precondition-closure.test.mjs, scripts/product-audit-rescope.test.mjs, scripts/product-audit-surplus.test.mjs, scripts/promise-coherence.test.mjs, scripts/prose-gate-inventory.test.mjs, scripts/published-refs.test.mjs, scripts/push-identity-check.test.mjs, scripts/red-first.test.mjs, scripts/relay-packet.test.mjs, scripts/relay-route.test.mjs, scripts/release-workflows.test.mjs, scripts/release.test.mjs, scripts/relevant-files.test.mjs, scripts/residual-classify.test.mjs, scripts/residue-dimensions.test.mjs, scripts/review-loop-discipline.test.mjs, scripts/review-receipt.test.mjs, scripts/review-state.test.mjs, scripts/rigidity-review.test.mjs, scripts/risk-tier-ceremony.test.mjs, scripts/risk-tier-classifier.test.mjs, scripts/roadmap-moved.test.mjs, scripts/roadmap-settle.test.mjs, scripts/run-root-suite.test.mjs, scripts/scaffold-guide.test.mjs, scripts/scaffold-parity.test.mjs, scripts/scope-manifest.test.mjs, scripts/secret-scan.test.mjs, scripts/session-close.test.mjs, scripts/setup-env.test.mjs, scripts/shared-doc-merge.test.mjs, scripts/skill-lint.test.mjs, scripts/spec-by-reference.test.mjs, scripts/structural-sibling-pins.test.mjs, scripts/telemetry-coverage.test.mjs, scripts/telemetry-report.test.mjs, scripts/temp-hygiene.test.mjs, scripts/temp-root.test.mjs, scripts/test-impact.test.mjs, scripts/test-route.test.mjs, scripts/tier-cost.test.mjs, scripts/tmp-gc.test.mjs, scripts/tool-choice-parity.test.mjs, scripts/triage-rescope.test.mjs, scripts/triage-setup-defect.test.mjs, scripts/turn-contract-grammar.test.mjs, scripts/turn-contract-single-owner.test.mjs, scripts/unit-cycle.test.mjs, scripts/unit-doc-contract.test.mjs, scripts/unit-route.test.mjs, scripts/update-tools.test.mjs, scripts/version-parity-gate.test.mjs, scripts/vocabulary-parity.test.mjs, scripts/vocabulary-probe.test.mjs, scripts/workflow-docs-index.test.mjs, scripts/workflow-status-compact.test.mjs, scripts/workflow-status-pre-execution.test.mjs, scripts/workflow-status-sensor.test.mjs, scripts/workspace-lock-policy.test.mjs, scripts/worktree-guard.test.mjs | P4 | 2026-11-19 | execute-phase | The sweep adds exactly one declaration line to each suite's head — `// test-obligation: protects=<path> obligations=<kind,…>` — after the shebang and before the docblock. No test body, assertion, import, fixture, timeout or allowlist entry changes, and no suite is deleted, merged or skipped by this unit (the sweep's own decision records keep every cluster). The lines are additive metadata the suite does not execute.
```
