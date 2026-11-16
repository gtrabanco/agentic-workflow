---
type: feature
scope: medium
roadmap_summary: Issue [#565](https://github.com/gtrabanco/agentic-workflow/issues/565) (M): a read-only `agentic-workflow quality-metrics` command — the DORA four keys plus the reversion ratio over a trailing window (default 90 days) as one validated `quality-metrics@1` envelope, every row labelled `measured`/`derived`/`unavailable`, an unreadable forge or a truncated history degrading declared instead of reporting a zero, the definitions owned by the crate README. Unit doc: [features/558-quality-sensor](features/558-quality-sensor/SPEC.md)
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
- `scripts/next-step-ranking.test.mjs` — `Reason codes are from the closed set`
  spawns `workflow-status` six times and overruns bun's 5 s per-test budget on this
  machine (`5012ms`, exit 1), and once overran node's 10 s budget under the
  parallel gate workers. Reproduced on the untouched `main` checkout at `d1287c3d`,
  so it is pre-existing and environmental (this host's forge reads are slow), not
  caused by this unit: it passes in the `--no-bail` gate run recorded below.
  **Does not affect this unit** — the command it exercises is `workflow-status`,
  which this change does not touch.

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

Append-only. `L` is a request or correction, `D` an owner decision, `P` a phase's
progress, `E` an evidence run, `G` a gate run. A line never edits an earlier one.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
```

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
- D6 — 2026-11-16, the escaped-defect slot counts the corpus exactly as the fold
  queue reads it — a migrated unit's `## Findings` rows **and** a legacy ledger's
  unticked rows — so on this project it reports 279 (27 doc-carrier rows across 7
  documents plus 252 legacy rows). It is an **upper bound**, not a defect tally:
  a legacy ledger can still show `folded: no` on a unit that merged long ago. The
  row's `detail` and the README say so; narrowing it to one carrier was rejected
  because it would be a second definition of "open" beside the fold queue's own.
- P1 — 2026-11-16, the unit doc and both planning ledgers are frozen before the
  first line of code · `36271cc3`.
- P2 — 2026-11-16, the `quality-metrics@1` contract lands with its red-first suite
  and its draft-07 projection · `3b7d8dc6`.
- P3 — 2026-11-16, the collector lands: six rows, three readers, the declared
  failure states · `63e0aab1`.
- P4 — 2026-11-16, the command is dispatched and documented in the three places the
  surface test reads · `da593086`.
- P5 — 2026-11-16, the metric definitions get their one home in the crate README ·
  `5416169b`.
- P6 — 2026-11-16, the three normative surfaces are registered and the guide's
  machine pin moves · `1988c2ba`.
- P7 — 2026-11-16, a self-review repair inside the phase, caught before the
  handoff and not deferred: a capped **deploy** read truncated the denominator of
  `change_failure_rate`, `lead_time_for_change` and `pr_volume` while their
  confidence stayed `measured` — the rule S12 forbids. `merged_truncated` now
  demotes all three and each detail line names the cap; the new collect case is
  the reproducer the repair was measured against. Test count for the collector
  moves 35 → 36 · `5655a989`.
- P8 — 2026-11-16, closeout: the tier re-classified over the real diff, the
  roadmap row settled through the emitter, the changeset and the journal fragment
  shipped, the projection regenerated, and the whole local gate run.
- E1 — 2026-11-16, `cd packages/agentic-workflow-schema && bun test test/quality-metrics.test.mjs` · exit 0 · `32 pass 0 fail`.
- E2 — 2026-11-16, `cd packages/agentic-workflow-schema && bun run test` · exit 0 · `885 pass 0 fail · 49 files`.
- E3 — 2026-11-16, `cd packages/agentic-workflow && bun test test/quality-metrics.collect.test.mjs` · exit 0 · `35 pass 0 fail` (36 after P7's repair, E14).
- E4 — 2026-11-16, `cd packages/agentic-workflow && bun test test/quality-metrics.cli.test.mjs` · exit 0 · `14 pass 0 fail`.
- E5 — 2026-11-16, `cd packages/agentic-workflow && bun run test` · exit 0 · `885 pass 0 fail · 49 files · 251s`.
- E6 — 2026-11-16, `bun test scripts/normative-drift.test.mjs` · exit 0 · `21 pass 0 fail`.
- E7 — 2026-11-16, `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS`.
- E8 — 2026-11-16, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 712 lines / 148 machine / 564 prose / 12468 est · PASS context documents`.
- E9 — 2026-11-16, `rg -c '^quality-metrics@1$' packages/agentic-workflow/README.md` · exit 0 · `1`; `cd packages/agentic-workflow && bun test test/cli.surface.test.mjs` · exit 0 · `3 pass 0 fail`.
- E10 — 2026-11-16, the pilot: `node packages/agentic-workflow/bin/agentic-workflow.mjs quality-metrics --until 2026-11-16T12:00:00.000Z` · exit 0 · 2810-byte document, `sha256 a5fcb2a75c4e2ff6ea0edaa3a60901c5072df06b00ab2ee89555886abf163d61`,
  `reversion_ratio 0.0007 (3/4360, derived) · change_failure_rate 0 (0/230, derived) ·
  lead_time_for_change 5.21 h (25 of 230 sampled, derived) · pr_volume 236 opened
  (230 merged, measured) · review_latency 14.94 h (1 reviewed of 236, measured) ·
  escaped_defects 279 open rows of 214 unit documents (measured) · degraded []`.
- E11 — 2026-11-16, the pilot numbers reconciled by hand, each against an
  independent read: `git log --since=2026-08-18T12:00:00Z --until=… | wc -l` →
  `4360` commits and `3` reverts by subject, by body and by the union;
  `gh pr list --state merged --limit 1000` → `230` merged inside the window and
  none of the three revert targets is any merged pull's merge commit, so
  `change_failure_rate` is `0/230` with the reason the detail line names (those
  three went in by direct push or rebase, which the linkage cannot see);
  `gh pr list --state all --search "created:>=2026-08-18"` → `236` created;
  `gh pr view 351` → created `2026-11-01T21:14:12Z`, first review
  `2026-11-02T12:10:42Z` = `14.94 h`, the only reviewed pull in the window; the
  first-commit sample recomputed independently → `median 5.21 h over 25 samples`;
  the corpus counted independently → `214 documents`, `27` rows in doc carriers,
  `252` legacy rows (D6).
- E12 — 2026-11-16, `bun scripts/lint-changeset.mjs .changeset/565-quality-sensor.md` · exit 0 · `ok 565-quality-sensor.md`.
- E13 — 2026-11-16, the live-tree guard: every mutating fixture ran under
  `mkdtemp` (`qm-git-`, `qm-corpus-`, `qm-cli-`, `qm-out-`, `qm-norepo-`), the pilot
  is the only run against this worktree, and `ls -d /tmp/qm-* 2>/dev/null` matches
  `0` lines after cleanup.
- E14 — 2026-11-16, after the P7 repair: `cd packages/agentic-workflow && bun test
  test/quality-metrics.collect.test.mjs test/quality-metrics.cli.test.mjs` · exit 0
  · `50 pass 0 fail` (36 collector cases, 14 CLI cases).
- G1 — 2026-11-16, `bun scripts/docs-generate.mjs` · exit 0 · `1 written · 0 deleted ·
  2 unchanged · Roadmap: updated · verdict: PASS`; then, after the unit doc and the
  ledgers settled, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked ·
  0 missing · 0 stale · 0 orphaned · verdict: PASS`.
- G2 — 2026-11-16, `bun scripts/local-gate.mjs --skip-network --no-bail` · exit 0 ·
  `local-gate: PASS — 15 step(s) in 789s` (crate-suite-bun 312s, root-suite 214s,
  crate-suite-node 203s, pi-node-compat 46s, schema-node-compat 12s). Four network
  steps are skipped by `--skip-network` and are reported as skipped, not passed:
  `workspace-install`, `pi-compat-guard`, `dependency-pin-gate`,
  `dependency-advisories`.
- G3 — 2026-11-16, `node packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/558-quality-sensor/SPEC.md` · exit 0 · `VERIFY PASS` (sections, obligations closure, provenance stamp, receipt marks, log kinds, cited paths, cited gates).
- G4 — 2026-11-16, `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/558-quality-sensor/SPEC.md` · exit 0 · `P1–P8 Phase-lint: PASS (6/6)` and `verdict PASS`.
- G5 — 2026-11-16, `bun test scripts/pre-execution-quality.test.mjs` · exit 0 · `1 pass 1 skip 0 fail` (the ledger-shape case: both planning ledgers are one contiguous table).
- G6 — 2026-11-16, the gate re-run that this receipt is: after the P7 repair and the
  definition caveat landed, `bun scripts/local-gate.mjs --skip-network --no-bail` ·
  exit 0 · `local-gate: PASS — 15 step(s) in 501s` (root-suite 182s, crate-suite-bun
  202s, crate-suite-node 95s, schema-node-compat 6s, pi-node-compat 15s). This
  supersedes G2 as the receipt for the final tree; the same four network steps are
  skipped and reported as skipped, not passed: `workspace-install`,
  `pi-compat-guard`, `dependency-pin-gate`, `dependency-advisories`.

## Next

Hand the diff to the owner. Nothing in this unit is left to open a follow-up for:
the six rows, the CLI, the definitions, the registration and the pilot all ship
here. The only open items are the owner's verdict and the PR itself.

## References

- Depends on: #504 (soft — envelope/naming coordination), #437 (soft — findings corpus for escaped-defect slot)
- Evidence: `docs/research/2026-11-15-all-code-is-slop-mapping.md` (talk point 5/6)
- Complements: `workflow-status` (measures workflow state; this measures workflow quality)
- DORA four keys: *Accelerate* (Forsgren, Humble, Kim) — change-failure rate and lead time for change are cited definitions, not invention
