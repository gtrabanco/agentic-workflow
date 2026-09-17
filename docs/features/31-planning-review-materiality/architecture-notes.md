# architecture-notes — 31-planning-review-materiality

## Position in the pre-execution review loop

```text
design-feature / plan-feature (author turn)
  → writes SPEC engineering half / plan artifacts        [artifactRevisionId rotates]
  → readiness preflight (READY-FOR-REVIEW)               [unchanged]
  → review-spec / review-plan (reviewer turn)
      → findings ledger (planning-findings.md) + receipt
          · material = medium+        (MOVED — schema predicate, was "!== info")
          · low = persisted report-note: visible, non-blocking, never by
            itself a re-review trigger                    (NEW semantics)
          · finding.reproducer: bounded, optional          (NEW field)
          · anti-deflation: mislabeled defect → medium minimum (authored prose)
      → verdict
          · FAIL → ONE root-caused repair batch
              · wording-only determination recorded in the unit's evidence
                home + revision rotated
                  → verify answers fresh; material rows (ACCEPTANCE.md
                    fingerprint + bound context authorities) must be unmoved
                  → otherwise stale-artifact-content (exit 4), re-review owed
              · otherwise → re-review of the new snapshot
          · second cycle → CONVERGENCE-ANOMALY printed before any further edit
            (block byte-unchanged)
          · orchestrator → decideWorkflowAction refuses a third unconverged
            review→repair→re-review cycle with stop-review-loop-cap and names
            the human route (design-feature)
          · a PASS resets the derived count
```

## Surfaces and layers

| Surface | Layer | Change |
|---|---|---|
| `packages/agentic-workflow-schema/src/pre-execution-contract.ts` | config/infra | finding record gains the bounded optional `reproducer`; `PRE_EXECUTION_LIMITS.reproducerChars`; severity prose states the `medium`+ line |
| `packages/agentic-workflow-schema/src/pre-execution.ts` | config/infra | the materiality predicate becomes the `medium`+ membership test; no freshness code, verdict or enumeration value moves |
| `packages/agentic-workflow-schema/src/index.ts` | config/infra | `WorkflowDecisionInput.reviewLoopCycles`; one added stop code `stop-review-loop-cap`; the cap refusal inside `decideWorkflowAction` |
| `packages/agentic-workflow-schema/package.json` (+ projections) | config/infra | additive minor 4.3.0; the two Draft-07 projections regenerate from the canonical definition |
| `packages/agentic-workflow-schema/test/**` | config/infra (test) | materiality, `reproducer` bound/back-compatibility and cap-refusal vectors |
| `scripts/pre-execution-contract.mjs` | config/infra | the determination-block parser (same module as the receipt parser) |
| `scripts/pre-execution-snapshot.mjs` | config/infra | the wording-only branch inside `attributeFreshness` + the acceptance fingerprint read; exit codes unchanged |
| `scripts/workflow-status.mjs` | config/infra | derives the per-stage count and passes it into the decider input |
| `scripts/review-loop-discipline.test.mjs` | config/infra (test) | planning pins re-aimed at the code carriers; no assertion removed |
| `skills/pre-execution-review/references/LEDGERS.md` §3 | docs | materiality line moves; row shape, writers, append-only contract untouched |
| `skills/pre-execution-review/references/POLICY.md` §3 + §4 | docs | wording-only record/rotation + hard cap; §1, §2, §5–§8 byte-identical |
| `skills/review-spec/references/CHECKS.md` / `skills/review-plan/references/CHECKS.md` §4 | docs | materiality restatement + anti-deflation; §1–§3 untouched |
| `skills/review-spec/references/OUTPUT.md` / `skills/review-plan/references/OUTPUT.md` | docs | cap mirror; receipt-literal lines + verdict grammar untouched |
| `skills/design-feature/references/REPAIR.md` §4 | docs | cap mirror |
| `docs/workflow/*` tutorial | n/a | no edit (AC13 scope guard) |

## Binding impact

- **No new declared machine grammar.** The determination record reuses the
  repository's existing record-block family (`## <Name> v1` plus `- Field: value`
  lines) inside the unit's own evidence home, and it introduces no
  `block:`/`fenced:`/`schema-export:` grammar — so `CLAUDE.md`'s
  `normative-surfaces@1` and `rendered-facts@1` blocks stay unchanged and the
  `normative-drift` gate keeps its scope. Precedent: the pre-execution receipt
  block itself is not a `normative-surfaces@1` row (PE-011).
- **No new freshness code, flag or exit code.** `verify` keeps the ten closed
  codes and exits 0/1/3/4; a wording-only movement answers `fresh` with the
  determination named.
- **One added stop code.** `stop-review-loop-cap` is appended to the closed stop
  vocabulary; every existing sense/stop/invoke code and every transition-table
  row keeps its spelling and behavior.
- **One added finding field.** `reproducer` is optional and bounded, so the
  receipt contract id stays `agentic-workflow/pre-execution-review-receipt@1`
  and older receipts remain structurally valid.
- **Cycle counting basis**: the persisted stage receipts, recomputed on every run
  — no new store, no counter write (E3 of the Product half's entity closure).
- **Version bumps**: schema package 4.2.0 → 4.3.0 (additive minor, own row in
  the CHANGELOG companion-package table); `pre-execution-review` 2.2.1 → 2.3.0,
  `review-spec` 1.7.1 → 1.8.0, `review-plan` 1.6.1 → 1.7.0, `design-feature`
  3.4.0 → 3.5.0 — minor per the #176 freeze; one bump per skill per PR
  (E-D31-1). The Pi mirror re-bundles from the package root after the last
  `skills/` edit.
