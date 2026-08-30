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
