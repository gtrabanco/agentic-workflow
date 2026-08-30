# testing — 28-evidence-grounded-spec-plan-review

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Contract unit/integration | strict shapes, normalized DTOs, selector, bounds, diagnostics, canonical vectors, semantic stage/lineage/freshness | `cd packages/agentic-workflow-schema && npm test` |
| Projection | both generated Draft-07 projections match the canonical definition and disclose runtime authority | `cd packages/agentic-workflow-schema && npm run check:pre-execution-schemas` |
| Package content | version 3.5.0 and both new schema files are publishable | `cd packages/agentic-workflow-schema && npm pack --dry-run` |
| Pi distribution | canonical root skills are rebuilt into the Pi package with byte parity and routed/package tests green | `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` |
| Workflow text contracts | progressive readiness, SPEC/Plan/fix review, planning-evidence/obligation ledgers, independence, batched repair, convergence anomaly, no-progress, legacy, routing | `node --test scripts/pre-execution-quality.test.mjs` |
| Existing loop/audit regression | local fold remains source-local; upstream defects route backward; audit authority unchanged | `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs` |
| Context/distribution | every entrypoint remains within budget and intended skills are installable | `node scripts/check-skill-context.mjs`; `npx skills add . --list` |
| Manual weak-executor route | no invented stage, bypass, automatic issue, or post-PASS artifact edit | dated PASS record in `docs/workflow/GOLDEN_FIXTURE.md` |
| Independent candidate review | exact candidate has no unresolved fix-now finding | current `review-change` PASS receipt |

## Mandatory matrices

### Snapshot and receipt

- Valid SPEC snapshot with `spec-product-v1`; missing/duplicate/out-of-order
  headings; normalized and invalid paths; absent/present context bindings.
- Valid Plan snapshot for XS/S and M/L artifact sets; missing acceptance,
  wrong Product parent, duplicate artifact kind/path, wrong unit/stage.
- Lower/upper bound and boundary-plus-one cases for every published cardinality,
  string, payload, findings, parent, and diagnostic limit.
- Product bytes/context/revision/source/policy mutations; Plan-only mutations;
  full causal revert with new revision id; unchanged same-revision repetition.
- Every verdict/stage pair, PASS with open material finding, wrong author under
  enforced exclusion, invalid synthesis topology, and receipt substitution.

### Skills and routes

- Complete feature Product review, reparable Product finding, missing product
  choice, unsupported external claim, and issue-export attempt.
- Complete feature Plan review, complete fix Plan review, unsupported
  architecture assumption, incomplete obligation, phase multi-concern,
  validator weakening, and missing failure scenario.
- Same-model clean reviewers labelled honestly; union of disagreements;
  material dismissal only with counter-evidence; identical repeat no-progress.
- Product/Plan readiness rejects missing evidence, unknown ownership, scenario
  gaps, uncovered obligations, bad phase cuts, or unresolved decisions without
  claiming review PASS.
- First findings are classified and repaired as one owner-bounded batch; one
  re-review may close; a second cycle emits `CONVERGENCE-ANOMALY` with finding,
  snapshot, evidence-deficit, and owner fields before any further edit.
- `workflow-status` and transition decisions for every missing/current/stale
  receipt; legacy adoption; crash/re-entry; Plan/Product root cause discovered
  during candidate review.

## Canary fields

Record comparable baseline and post-change observations for:

- elapsed time and model calls to first correct source edit;
- pre-edit replans and post-review repairs;
- `review-change` / `fold-findings` cycles;
- lines/files written then reverted or substantially rewritten;
- total latency and model tokens where the runtime exposes them;
- current-unit obligations exported to follow-up issues.

The mandatory qualification corpus contains at least one feature, one fix, and
one cross-boundary unit. Record correction cycles per stage. Any sample entering
a second repair/re-review cycle fails qualification until its Product/Plan/
source/environment/runtime cause is corrected and the sample is rerun. This
threshold is a release-quality target, never permission to suppress findings.

Use `not yet measured` for unavailable observations. Do not infer improvement
from the mechanism alone.

## Execution records

### P2 (2026-08-30) — Product authoring and the independent spec review

Gate commands, all on the final candidate state:

| Command | Result |
|---|---|
| `node --test scripts/pre-execution-quality.test.mjs` | 25/25 pass (13 pre-P2 + 12 P2 cases) |
| `node --test scripts/*.test.mjs` (root) | 82/82 pass, no regression from the 57-pass baseline |
| `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs` | 17/17 pass |
| `node scripts/check-skill-context.mjs` | PASS — 37 skills, largest entrypoint `plan-feature-scaffold` 14661 ≤ 15200 |
| `node scripts/check-skill-context.mjs --routes` | PASS — 20 routes |
| `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` | bundled 36 skills; 134/134 pass |
| `npx skills add . --list` | 38 skills, `evidence-grounding` and `review-spec` internal, the rest user-facing |

Route-specific coverage against the mandatory "Skills and routes" matrix:

- *complete feature Product review* → `review-spec` C1–C14 + verdict/receipt
  tests; *reparable Product finding* → `design-feature/references/REPAIR.md`
  batch test; *missing product choice* → C13 `NEEDS-DESIGN` rule + check table;
  *unsupported external claim* → `authority-kind`/`freshness` row test;
  *issue-export attempt* → `plan-feature-from-issue` terminal-handoff test.
- *Product readiness rejects missing evidence / unknown ownership / scenario
  gaps without claiming PASS* → readiness-vocabulary-preservation test plus the
  `READINESS.md` rule set and the `design-feature` "carries no review authority"
  guardrail.
- *first findings repaired as one owner-bounded batch; one re-review; second
  cycle → `CONVERGENCE-ANOMALY`* → batched-repair test; the cycle-count fields
  themselves are the schema package's P1 vectors (already green).
- Not yet exercised by text contracts (lands with P3/P4): Plan-review route
  coverage, `execute-phase`/`fold-findings`/`triage-issue` ledger behaviour, and
  the routing table for `review-spec`/`review-plan`.

Residual risks: (1) the P2 tests assert contract text, not an LLM performing a
review — the qualification corpus and the weak-model route in
`docs/workflow/GOLDEN_FIXTURE.md` remain P5 work; (2) `spec-review-pass`
authority is contractual (see `known-issues.md` item 9); (3) the Pi bundle was
rebuilt from canonical at P2 because skill changes must stay distributable
inside the unit — P5 still owns the terminal rebuild and version bump (D15).
