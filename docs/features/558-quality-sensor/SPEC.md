---
type: feature
scope: medium
roadmap_summary: deterministic forge/git quality metrics envelope (DORA + reversion ratio), the talk-mapped point 5 end-to-end
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

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S1) | `reversion_ratio` reports revert commits over total commits inside the window, from git history, with the heuristic named in the row | `bun test packages/agentic-workflow/test/quality-metrics.collect.test.mjs` (the reversion cases) |
| AC-2 (S2) | `change_failure_rate` reports reverted deploys over deploys merged in the window, linked by the revert's target oid, and declares the linkage rule | same suite (the change-failure cases) |
| AC-3 (S3) | `lead_time_for_change` reports the median hours from a merged PR's first commit to its merge | same suite (the lead-time cases) |
| AC-4 (S4) | `pr_volume` reports opened pulls with merged beside them, and `review_latency` reports the median hours from open to first review | same suite (the volume and latency cases) |
| AC-5 (S5) | `escaped_defects` reports the open rows of the unit-doc findings corpus, or `unavailable` with `unavailable-findings-corpus` when no corpus exists | same suite (the corpus cases) |
| AC-6 (S6) | `--window <days>` (default 90) sets the trailing window and the document carries `days`/`since`/`until`; an out-of-range value is refused | `bun test packages/agentic-workflow/test/quality-metrics.cli.test.mjs` |
| AC-7 (S7) | every metric row carries one of `measured`/`derived`/`unavailable`, and `unavailable` implies `value: null` plus a declared reason | `bun test packages/agentic-workflow-schema/test/quality-metrics.test.mjs` |
| AC-8 (S8) | the metric definitions — formula, unit, confidence rule, heuristics, degradation codes — have one home in the crate README | `rg -c '^quality-metrics@1$' packages/agentic-workflow/README.md` matches 1, and `bun test scripts/normative-drift.test.mjs` exits 0 |
 packages/agentic-workflow/README.md` matches 1, and `bun test scripts/normative-drift.test.mjs` exits 0 |
| AC-9 (S9) | stdout is exactly the envelope JSON, every feedback line is on stderr, and the document validates against the published contract before it is printed | `bun test packages/agentic-workflow/test/quality-metrics.cli.test.mjs` (the stderr-only and self-check cases) |
| AC-10 (S10) | a run leaves the repository byte-identical, and `--out` is the only write it may perform | same suite (the read-only and `--out` cases) |
| AC-11 (S11) | the command emits a valid envelope on this repository and its numbers are reconciled by hand once, recorded here | the `## Log` pilot lines (envelope bytes + reconciliation) |
| AC-12 (S12) | an unreadable forge or a history that truncates the window degrades the affected rows to `unavailable` with a declared code, never a zero value | `bun test packages/agentic-workflow/test/quality-metrics.collect.test.mjs` (the degradation matrix) |
| AC-13 (S13) | the two vocabularies and the field grammar are registered in `normative-surfaces@1`, claimed by the gate inventory, and the guide's machine-region pin moves with them | `bun test scripts/normative-drift.test.mjs` exits 0, `bun scripts/prose-gate-inventory.mjs` exits 0, `bun scripts/check-skill-context.mjs --documents` exits 0 |

## Impact

- New `agentic-workflow quality-metrics` CLI command in the runner crate (dispatched
  from `src/runner/cli.mjs`, documented in the crate README).
- New schema types for the quality-metrics envelope
  (`packages/agentic-workflow-schema/src/quality-metrics.ts` + its published
  `quality-metrics.schema.json`), re-exported from the package index.
- `workflow-status` can consume the envelope (read-only composition) — no change is
  made to it here; the two envelopes stay separate (naming coordination only, the
  soft dependency on #504).
- `review-change` / `product-audit` can cite the metric definitions in the crate
  README (S8); no skill prose changes in this unit.
- The findings corpus (#437) supplies the escaped-defect slot through the existing
  `findingsRows`/`openRows` readers — no second parser.
- The guide's `normative-surfaces@1` inventory and its machine-region pin grow by
  three rows; `GATE_INVENTORY.md`'s `normative-surface-grammar` row claims them.
- **Named high-risk item** (copied from the classifier's `signals[]`):
  `destructive (packages/agentic-workflow/bin/agentic-workflow.mjs · ../src/doc/retrieval.mjs · (module-level))`.
  The bin change here is additive (one usage-line token and the runner-table
  dispatch the existing default case already performs); the destructive signal is
  the bin's pre-existing import graph, not this unit's code. The `high` ceremony
  asks for the full review pass; this unit runs under the owner's local unpublished
  workflow, where the owner is the external verifier and no self-review runs (§4/§8
  of the request) — recorded as D3 in the `## Log`.

## Retirements

Strictly additive: nothing is retired. Every added surface lands with its consumer
named — the CLI (`quality-metrics`, consumed by the pilot and by any reader of the
definitions), the contract module and its two published vocabularies (consumed by
the collector and bound by the `normative-surfaces@1` rows this unit adds), and the
JSON Schema projection (compiled by the package suite and shipped for consumers).
No rename, no deletion, no superseded token.

## Non-goals

- Workflow-usage telemetry (#504 owns that surface)
- Auto-fixing, threshold gate, or advisory verdict (read-only reporter)
- Token-spend metrics (harness-side, not forge-derivable)

## Risk tier

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "high",
  "reason": "1 path(s) touch a named high-risk surface: destructive (packages/agentic-workflow/bin/agentic-workflow.mjs · ../src/doc/retrieval.mjs · (module-level))",
  "reason_kind": "named-high-risk",
  "task_size": {
    "understood": true,
    "contained_risk": "named",
    "resumable_from_diff": true,
    "ceremony": "unit-doc+review-change",
    "verification": "review-change"
  },
  "signals": [
    {
      "path": "packages/agentic-workflow/bin/agentic-workflow.mjs",
      "signal": "destructive"
    }
  ]
}
```

- **Tier** — `high` · **Task Size** — `named` (understood · contained_risk `named` · resumable-from-diff)
- **Named high-risk item** — `destructive (packages/agentic-workflow/bin/agentic-workflow.mjs · ../src/doc/retrieval.mjs · (module-level))`

## Future

none — nothing was deferred.

## Future cost

- Every metric row added later is a version bump of `quality-metrics@1` (the core is
  closed) plus a `QUALITY_METRIC_NAMES` token, a grammar-block row and a parity pin —
  binds whoever extends the envelope.
- The revert and change-failure heuristics are documented with their false-positive
  and false-negative shapes; anyone tightening them amends the definitions' one home
  and the metrics' confidence rule in the same change — binds the next author.

## Applicable tests

| Suite | Covers |
|---|---|
| `bun test packages/agentic-workflow-schema/test/quality-metrics.test.mjs` | the closed core, the vocabularies, the window rules, the confidence/value pairing, and validator ↔ JSON Schema agreement |
| `bun test packages/agentic-workflow/test/quality-metrics.collect.test.mjs` | every metric's formula over fixture git/forge/corpus sources, the degradation matrix, and determinism |
| `bun test packages/agentic-workflow/test/quality-metrics.cli.test.mjs` | dispatch, `--window`/`--until`/`--out`/`--repo`, refusals, read-only, stderr-only feedback, exit codes |
| `bun test packages/agentic-workflow/test/cli.surface.test.mjs` | the bin's usage line, the crate README's usage line and the Commands row agree |
| `bun test scripts/normative-drift.test.mjs` | the three registered surfaces resolve, and the guided vocabularies carry one declaration |
| `bun scripts/prose-gate-inventory.mjs` | the gate inventory claims every registered surface |
| `bun scripts/check-skill-context.mjs --documents` | the guide's budgets and its exact machine-region pin |
| `bun scripts/local-gate.mjs --skip-network` | no existing suite regressed |

## Known pre-existing issues

- The agentic-workflow checkout used as the pilot is a **shallow clone**
  (`git rev-parse --is-shallow-repository` → `true`) whose oldest commit
  (`0f196d2835`) predates the 90-day window, so its history covers the window and
  the coverage rule — not the shallow flag — decides the degradation.
  Does not affect this unit: it is exactly the case the coverage rule exists for.
- `gh pr list --json commits` builds a GraphQL query whose `authors` connection
  explodes past GitHub's 500,000-node ceiling at ~100 pull requests (measured:
  `--limit 40` succeeds, `--limit 100` fails). Does not affect this unit: the lead-time
  sample is bounded to 25 pulls and the truncation is declared.

## Tasks

- P1 — Publish the `quality-metrics@1` contract: closed vocabularies, the document types and the dependency-free validator, re-exported from the package index (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S7, S9, S13)
  - Relevant files: packages/agentic-workflow-schema/src/quality-metrics.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/test/quality-metrics.test.mjs
- P2 — Publish the JSON Schema projection and pin schema ↔ validator agreement under strict Ajv (validator: `cd packages/agentic-workflow-schema && bun test test/quality-metrics.test.mjs` exits 0 with the agreement cases)
  (Implements: S9, S13)
  - Relevant files: packages/agentic-workflow-schema/quality-metrics.schema.json, packages/agentic-workflow-schema/package.json
- P3 — Collect every metric from git, forge and the findings corpus behind injected sources, with the declared failure states (validator: `cd packages/agentic-workflow && bun test test/quality-metrics.collect.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S7, S12)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/quality-metrics.mjs, packages/agentic-workflow/test/quality-metrics.collect.test.mjs
- P4 — Dispatch the CLI: `--window`/`--until`/`--repo`/`--out`, the refusal contract and the read-only invariant (validator: `cd packages/agentic-workflow && bun test test/quality-metrics.cli.test.mjs` exits 0)
  (Implements: S6, S9, S10)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/test/quality-metrics.cli.test.mjs
- P5 — Document the metric definitions and the envelope grammar in the crate README (validator: `cd packages/agentic-workflow && bun test test/cli.surface.test.mjs` exits 0)
  (Implements: S8, S9)
  - Relevant files: packages/agentic-workflow/README.md
- P6 — Register the three normative surfaces and move the guide's machine-region pin with a declared growth source (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S13)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P7 — Pilot on this repository and reconcile the numbers by hand once (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs quality-metrics --window 90` exits 0 and its stdout validates against the published contract)
  (Implements: S11)
- P8 — Close the unit: re-classify the tier over the real diff, settle the roadmap row, ship the changeset and the session log, run the whole gate (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S11, S13)

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Frozen in `planning-evidence.md` beside this document — the M/L home, so the ledger
is never embedded twice.

### Obligations

Frozen in `planning-obligations.md` beside this document. Every row flips to
`verified` only after its validator ran in the foreground.

## Triaged steps

> Produced by `node packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 558-quality-sensor` at the cut; the lane never re-derives it. The pi-web relay addendum that follows the block in a pi-web session is omitted: it describes a transport, not a step.

```text
TRIAGE — 558-quality-sensor (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- L1 — 2026-11-15, the request (GitHub issue #565):
  ```
  NEW FEATURE: quality sensor — deterministic forge/git quality metrics envelope (DORA + reversion ratio), the talk-mapped point 5 end-to-end
  ```
- D1 — 2026-11-15, triaged as `promote` — valid feature proposal. Maps to the 2026-11-15 research note's talk point 5 (metrics detecting quality and cost alongside volume), the only one implementable to 100% as product. Clear DORA key alignment, honest degradation strategy, and read-only contract. Soft dep on #504 (envelope naming) is correct.
- L2 — 2026-11-16, the request this session applies (verbatim, the owner's local unpublished workflow):
  ```
  Apply to this repository: issue #565

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:
  ```
  The workflow's numbered rules are the process authority; S1–S13 above are the
  functional authority and are unchanged.
- D2 — 2026-11-16, the planning ledgers are frozen at the cut by the request's §5
  (that command substitutes for the lane's plan step), so `planning-evidence.md` and
  `planning-obligations.md` are written before the first line of code. File placement
  moved from the triage draft to the repository's convention: the sensor lives in
  `packages/agentic-workflow/src/runner/sensors/` (every other sensor does) and is
  dispatched from `src/runner/cli.mjs` (the crate's closed runner table), not from a
  bare `src/quality-metrics.mjs` the top-level switch would have to know about.
- D3 — 2026-11-16, the classifier returned `high` (named high-risk: the bin's
  pre-existing destructive import graph). The `high` ceremony's full review pass is
  replaced by the owner's own external verification because the request forbids
  running this repository's review machinery on its own surgery (§4). Every
  deterministic gate still runs, and the named item is quoted in `## Impact`.
- D4 — 2026-11-16, the measured window ends at the report's `until` instant
  (`--until` pins it, default: now) rather than at the head commit's date, so a
  trailing report is fresh by default and reproducible when the caller pins the
  instant. `window.days`/`since`/`until` travel in the document, so a number is
  always auditable against the window that produced it.
- D5 — 2026-11-16, quantities the issue left to the executor, recorded so a reader
  does not have to infer them from code: (a) reversion ratio counts **revert
  commits** over total commits (no linkage needed), while the *reverted-deploy*
  view is `change_failure_rate`'s numerator; (b) `pr_volume` reports **opened**
  pulls as its value and carries `merged` beside it; (c) the lead-time, revert-link
  and latency definitions each name their heuristic and its false-positive/negative
  shape in the crate README (S8's one home).

## Next

P1 — publish the `quality-metrics@1` contract with its red-first suite.

## References

- Depends on: #504 (soft — envelope/naming coordination), #437 (soft — findings corpus for escaped-defect slot)
- Evidence: `docs/research/2026-11-15-all-code-is-slop-mapping.md` (talk point 5/6)
- Complements: `workflow-status` (measures workflow state; this measures workflow quality)
- DORA four keys: *Accelerate* (Forsgren, Humble, Kim) — change-failure rate and lead time for change are cited definitions, not invention
