---
type: feature
scope: medium
roadmap_summary: Issue [#565](https://github.com/gtrabanco/agentic-workflow/issues/565) (M): deterministic forge/git quality metrics envelope (DORA + reversion ratio), the talk-mapped point 5 end-to-end
---

# 558 — quality-sensor

> One-line: add a deterministic, read-only quality sensor — a fixed machine envelope of project quality/cost metrics computed from git/forge data (DORA keys + reversion ratio).

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Reversion ratio metric.**
> "reverted commits / total commits over the window (git history, forge-confirmed where available)."

**S2 — Change-failure rate metric.**
> "DORA: deploys causing failure (revert/rollback/fix-forward linkage, best-effort with declared confidence per metric)."

**S3 — Lead time for change metric.**
> "first commit → merge."

**S4 — PR volume + review latency metrics.**
> "opened, merged, median time-to-review (forge read; degrades declared when the forge is unreadable)."

**S5 — Escaped-defect slot.**
> "from the findings corpus (#437) when its ledger exists; `n/a` otherwise, never invented."

**S6 — Measured window parameter.**
> "default trailing 90 days"

**S7 — Confidence labels.**
> "per-metric confidence labels (`measured` / `derived` / `unavailable` — a metric that cannot be computed from available data is declared, never silently dropped)."

**S8 — Documented metric definitions.**
> "one home so review-change / product-audit can cite them."

**S9 — Fixed envelope output.**
> "The command emits one fixed machine envelope (same feedback-channel and stderr-only discipline as every CLI)."

**S10 — Read-only invariant.**
> "Read-only: the command writes nothing outside the optional `--out` envelope file."

**S11 — Pilot on this repo.**
> "The command emits a valid fixed envelope on this repo (we have reverts, PRs and review data to reconcile by hand once — the pilot named in the mapping note)."

**S12 — Fail-closed degradation.**
> "an unavailable forge or shallow history degrades declared (fail-closed), never to zero-values presented as measurements."

**S13 — Normative surface registration.**
> "Metric definitions are documented in one place and the envelope field vocabulary is registered per the normative-surfaces rule before merge."

## Impact

- New `agentic-workflow quality-metrics` CLI command in the runner crate
- New schema types for quality-metrics envelope
- `workflow-status` can consume the envelope (read-only composition)
- `review-change` / `product-audit` can cite metrics
- Depends on findings corpus (#437) for escaped-defect slot

## Retirements

none — strictly additive

## Non-goals

- Workflow-usage telemetry (#504 owns that surface)
- Auto-fixing, threshold gate, or advisory verdict (read-only reporter)
- Token-spend metrics (harness-side, not forge-derivable)

## Risk tier

`standard` (new CLI command + schema types; read-only, no behavioral change to the pipeline)

**Tier** — `standard` · **Task Size** — `standard`
**Named high-risk item** — `none — not a high-tier unit`

## Future

per-metric alerting thresholds (currently out of scope: no auto-fixing or advisory verdicts).

## Future cost

DORA change-failure rate needs deploy markers many projects do not have — hence the confidence labels.

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — Define the quality-metrics envelope schema + vocabulary (validator: `bun run test` in schema package exits 0)
  (Implements: S8, S13)
  - Relevant files: packages/agentic-workflow-schema/src/quality-metrics.ts
- P2 — Implement the git/forge read for each metric (validator: `bun run test` in crate exits 0)
  (Implements: S1, S2, S3, S4, S5, S12)
  - Relevant files: packages/agentic-workflow/src/quality-metrics.mjs
- P3 — Add the CLI subcommand (validator: `bun run test` in crate exits 0)
  (Implements: S6, S7, S9, S10)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — Pilot on this repo — reconcile metrics by hand (validator: command emits valid envelope on this repo)
  (Implements: S11, S12)
- P5 — Document metric definitions (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S8, S9)
  - Relevant files: packages/agentic-workflow/README.md

### Planning evidence

none

### Obligations

none

## Triaged steps

> Awaiting `unit-route` execution after lane triage.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- L1 — 2026-11-15, the request (GitHub issue #565):
  ```
  NEW FEATURE: quality sensor — deterministic forge/git quality metrics envelope (DORA + reversion ratio), the talk-mapped point 5 end-to-end
  ```
- D1 — 2026-11-15, triaged as `promote` — valid feature proposal. Maps to the 2026-11-15 research note's talk point 5 (metrics detecting quality and cost alongside volume), the only one implementable to 100% as product. Clear DORA key alignment, honest degradation strategy, and read-only contract. Soft dep on #504 (envelope naming) is correct.

## Next

Run `/unit-lane 558-quality-sensor` to begin the design phase.

## References

- Depends on: #504 (soft — envelope/naming coordination), #437 (soft — findings corpus for escaped-defect slot)
- Evidence: `docs/research/2026-11-15-all-code-is-slop-mapping.md` (talk point 5/6)
- Complements: `workflow-status` (measures workflow state; this measures workflow quality)