# architecture-notes — 31-planning-review-materiality

## Position in the pre-execution review loop

```text
design-feature / plan-feature (author turn)
  → writes SPEC engineering half / plan artifacts        [artifactRevisionId rotates]
  → readiness preflight (READY-FOR-REVIEW)               [unchanged]
  → review-spec / review-plan (reviewer turn)
      → findings ledger (planning-findings.md)
          · material = medium+   (MOVED — was "anything above info")
          · low = persisted report-note: visible, non-blocking,
            never by itself a re-review trigger          (NEW semantics)
          · anti-deflation: mislabeled defect → medium minimum (carried over)
      → verdict
          · FAIL → ONE root-caused repair batch
              · wording-only determination recorded     (NEW route)
                → no full snapshot re-review
                · artifactRevisionId still rotates
              · otherwise → re-review of the new snapshot
          · second cycle → CONVERGENCE-ANOMALY printed before any further edit
          · third cycle → never starts without explicit user instruction
          · unconverged → NEEDS-DESIGN routed to the human (existing verdict)
```

## Surfaces and layers

| Surface | Layer | Change |
|---|---|---|
| `skills/pre-execution-review/references/LEDGERS.md` §3 | docs | materiality line moves; row shape, writers, append-only contract untouched |
| `skills/pre-execution-review/references/POLICY.md` §3 + §4 | docs | wording-only consequence + hard cap; §1, §2, §5–§8 byte-identical |
| `skills/review-spec/references/CHECKS.md` / `skills/review-plan/references/CHECKS.md` | docs | materiality restatement + anti-deflation |
| `skills/review-spec/references/OUTPUT.md` / `skills/review-plan/references/OUTPUT.md` | docs | cap mirror; receipt-literal lines + verdict grammar untouched |
| `skills/design-feature/references/REPAIR.md` §4 | docs | cap mirror |
| `scripts/review-loop-discipline.test.mjs` | config/infra (test) | additive planning-side pin sections; existing assertions untouched |
| schema package, sensor, snapshot builder | n/a | negative integration — untouched (AC10) |
| `docs/workflow/*` tutorial | n/a | no edit (AC8 scope guard) |

## Binding impact

- **No new machine grammar**: the cap terminates in the existing `NEEDS-DESIGN`
  verdict and reuses the byte-stable `CONVERGENCE-ANOMALY` block — no new
  fenced block, no normative-surfaces table row added or changed in
  `CLAUDE.md`.
- **No schema change**: the receipt severity set (`info|low|medium|high|critical`)
  and the schema package are untouched; only the materiality line moves.
- **Cycle counting basis**: persisted receipts + repair records across the
  unit's `progress.md` and `planning-findings.md` — no new store, no new
  ledger, no counter to write (E3 of the SPEC's entity closure).
- **Version bumps**: `pre-execution-review` 2.2.1→2.3.0, `review-spec`
  1.7.1→1.8.0, `review-plan` 1.6.1→1.7.0, `design-feature` 3.4.0→3.5.0 — minor
  per the #176 freeze; one bump per skill per PR (E-D31-1).
