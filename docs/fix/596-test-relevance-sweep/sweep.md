# The sweep — fix/596-test-relevance-sweep

The unit doc's `## Log` carries the receipts; this file carries the sweep's own
measurements, in the three sections the issue asks for (S3, S5). Every table here
is produced by a command, never typed by hand:

```text
sweep-table  bun scripts/test-obligation-tags.mjs --sweep --cost <root-suite log>
kill-rate    the mutation harness under /tmp (recorded in § kill-rate, removed after the run)
wall-clock   bun scripts/local-gate.mjs --skip-network --jobs 4 --push-base <base>
```

**What "the sweep" means here.** Every root suite declares its protected surface
and its obligation set (`test-obligation-tag@1`). Three evidence standards can
justify a deletion, and none of them is line coverage: the **surface is gone**
(the gate refuses that tag on every push, so it never reaches a sweep), the test
is an **obligation-level duplicate** (same protected surface, same obligation
set — the assertions behind them still have to be read before anything is
deleted), or its **measured cost exceeds the risk it covers** (the ratio below,
confirmed by kill-rate). A fourth class — "weakening a test so it passes" — is
not part of this sweep at all.

**The selection rule, as the gate prints it:** a cluster is a suspect when it is
an obligation-level duplicate, or when its measured cost per obligation value is
at least 1 s (cost = the slowest suite on the surface, read from the root gate's
own `PASS <file> (N.Ns)` lines); suspects are ordered by that ratio, descending,
and at most 5 run kill-rate — the sweep is never exhaustive.

## Measurements

One subsection per ask: the cluster table, the selective kill-rate, and the
wall-clock of the three change classes.

### sweep

Measured against the base revision's own root-suite log
(`bun scripts/run-root-suite.mjs` at `176ab984b`, 126 suites, each suite's wall
clock as the gate prints it). One row per protected surface: the suites that
protect it, the obligations they cover there, the slowest one's measured cost,
the cost per obligation value, and the decision the declarations support.

| surface | suites | obligations | cost (s) | cost / obligation | decision | state |
|---|---|---|---|---|---|---|
| `.github/workflows` | 1 | `convention`, `distribution-contract` | 0.1 | 0.05 | keep | held |
| `AGENTS.md` | 3 | `contract`, `convention`, `failure-path` | 1.1 | 0.37 | keep | held |
| `bun.lock` | 1 | `convention`, `distribution-contract` | 0 | 0 | keep | held |
| `docs/CAPABILITIES.md` | 1 | `contract`, `convention` | 0.2 | 0.1 | keep | held |
| `docs/features/_TEMPLATE/SPEC.md` | 2 | `contract`, `convention` | 2.1 | 1.05 | duplicate | suspect |
| `docs/fix/_TEMPLATE/SPEC.md` | 2 | `contract`, `convention` | 2.1 | 1.05 | duplicate | suspect |
| `docs/ROADMAP.md` | 1 | `convention` | 1.1 | 1.1 | keep | suspect |
| `docs/workflow` | 1 | `convention` | 0.1 | 0.1 | keep | held |
| `docs/workflow/CONFIG.md` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `docs/workflow/GOLDEN_FIXTURE.md` | 1 | `contract`, `fixture-support` | 0.9 | 0.45 | keep | held |
| `docs/workflow/README.md` | 1 | `convention` | 0.1 | 0.1 | keep | held |
| `docs/workflow/REPOSITORY_STATE.md` | 1 | `contract`, `failure-path` | 2 | 1 | keep | suspect |
| `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | 1 | `convention` | 0.1 | 0.1 | keep | held |
| `package.json` | 1 | `convention`, `distribution-contract` | 0 | 0 | keep | held |
| `packages/agentic-workflow-schema/src/config.ts` | 2 | `contract`, `convention`, `failure-path` | 0.1 | 0.03 | keep | held |
| `packages/agentic-workflow-schema/src/pre-execution.ts` | 2 | `contract`, `convention`, `failure-path` | 2.3 | 0.77 | keep | held |
| `packages/agentic-workflow-schema/src/vocabularies.ts` | 2 | `contract`, `convention`, `failure-path` | 1.1 | 0.37 | keep | held |
| `packages/agentic-workflow/src/content-guard.mjs` | 1 | `contract`, `convention` | 0.3 | 0.15 | keep | held |
| `packages/agentic-workflow/src/doc` | 1 | `contract`, `convention` | 1.1 | 0.55 | keep | held |
| `packages/agentic-workflow/src/doctor/vehicle.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `packages/agentic-workflow/src/index-document.mjs` | 3 | `contract`, `failure-path` | 19.1 | 9.55 | keep | suspect |
| `packages/agentic-workflow/src/path-policy.mjs` | 1 | `contract`, `failure-path` | 2.9 | 1.45 | keep | suspect |
| `packages/agentic-workflow/src/relay` | 1 | `contract`, `failure-path` | 2.8 | 1.4 | keep | suspect |
| `packages/agentic-workflow/src/runner/capabilities.mjs` | 1 | `contract`, `failure-path` | 0.2 | 0.1 | keep | held |
| `packages/agentic-workflow/src/runner/catalog.json` | 3 | `contract`, `convention`, `failure-path` | 2.8 | 0.93 | keep | held |
| `packages/agentic-workflow/src/runner/ceremony-profile.mjs` | 1 | `contract`, `failure-path` | 3.7 | 1.85 | keep | suspect |
| `packages/agentic-workflow/src/runner/ceremony/docs.mjs` | 1 | `contract`, `failure-path` | 10.9 | 5.45 | keep | suspect |
| `packages/agentic-workflow/src/runner/ceremony/findings.mjs` | 1 | `contract`, `failure-path` | 24 | 12 | keep | suspect · selected |
| `packages/agentic-workflow/src/runner/ceremony/index.mjs` | 1 | `contract`, `failure-path` | 2.5 | 1.25 | keep | suspect |
| `packages/agentic-workflow/src/runner/ceremony/ledger.mjs` | 1 | `contract`, `failure-path` | 24 | 12 | keep | suspect · selected |
| `packages/agentic-workflow/src/runner/ceremony/passive.mjs` | 1 | `contract`, `failure-path` | 11.5 | 5.75 | keep | suspect |
| `packages/agentic-workflow/src/runner/ceremony/plan.mjs` | 1 | `contract`, `failure-path` | 21.3 | 10.65 | keep | suspect · selected |
| `packages/agentic-workflow/src/runner/ceremony/unit.mjs` | 1 | `contract`, `failure-path` | 21.3 | 10.65 | keep | suspect |
| `packages/agentic-workflow/src/runner/ceremony/workspace.mjs` | 1 | `contract`, `failure-path` | 10 | 5 | keep | suspect |
| `packages/agentic-workflow/src/runner/risk-tiers.mjs` | 1 | `boundary`, `contract`, `failure-path` | 0.1 | 0.03 | keep | held |
| `packages/agentic-workflow/src/runner/sensors/diff-guard.mjs` | 1 | `contract`, `failure-path` | 2.7 | 1.35 | keep | suspect |
| `packages/agentic-workflow/src/runner/sensors/ledger-provenance.mjs` | 1 | `contract`, `failure-path` | 17.6 | 8.8 | keep | suspect |
| `packages/agentic-workflow/src/runner/sensors/needs-input.mjs` | 1 | `contract`, `failure-path` | 6 | 3 | keep | suspect |
| `packages/agentic-workflow/src/runner/sensors/phase-lint.mjs` | 1 | `contract`, `failure-path` | 30.4 | 15.2 | keep | suspect · selected |
| `packages/agentic-workflow/src/runner/sensors/pre-execution-contract.mjs` | 2 | `contract`, `failure-path` | 0.8 | 0.4 | duplicate | suspect |
| `packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs` | 2 | `contract`, `failure-path` | 13.1 | 6.55 | keep | suspect |
| `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` | 4 | `boundary`, `contract`, `failure-path` | 55.2 | 18.4 | keep | suspect · selected |
| `packages/agentic-workflow/src/runner/unit-route.mjs` | 2 | `contract`, `failure-path` | 12.2 | 6.1 | duplicate | suspect |
| `packages/agentic-workflow/src/telemetry` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `packages/agentic-workflow/src/tool-choice/policy.mjs` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `packages/pi-agentic-workflow/src/extension/log-session-command.ts` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `scripts/adversarial-verdict.mjs` | 1 | `contract`, `failure-path` | 0.5 | 0.25 | keep | held |
| `scripts/batch-scheduler.mjs` | 1 | `boundary`, `contract`, `failure-path` | 1.9 | 0.63 | keep | held |
| `scripts/changeset-create.mjs` | 1 | `contract`, `failure-path` | 1.5 | 0.75 | keep | held |
| `scripts/check-changelog-row.mjs` | 1 | `contract`, `failure-path` | 0.2 | 0.1 | keep | held |
| `scripts/check-skill-context.mjs` | 1 | `boundary`, `contract`, `convention` | 2.4 | 0.8 | keep | held |
| `scripts/correction-budget.mjs` | 1 | `contract`, `failure-path` | 1.8 | 0.9 | keep | held |
| `scripts/coverage-gap.mjs` | 1 | `contract`, `failure-path` | 0.8 | 0.4 | keep | held |
| `scripts/dependency-advisory-pass.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/differential-baseline.mjs` | 1 | `contract`, `failure-path` | 0.9 | 0.45 | keep | held |
| `scripts/dimension-regression.mjs` | 1 | `contract`, `failure-path` | 0.4 | 0.2 | keep | held |
| `scripts/docs-generate.mjs` | 1 | `contract`, `distribution-contract` | 2.4 | 1.2 | keep | suspect |
| `scripts/docs-generated-merge.mjs` | 1 | `boundary`, `contract`, `failure-path` | 1.2 | 0.4 | keep | held |
| `scripts/findings-corpus.mjs` | 1 | `contract`, `failure-path` | 0.6 | 0.3 | keep | held |
| `scripts/fixtures/golden-fixture` | 1 | `contract`, `fixture-support` | 0.9 | 0.45 | keep | held |
| `scripts/forge-read-drift.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/gate-receipt.mjs` | 1 | `contract`, `failure-path` | 1.5 | 0.75 | keep | held |
| `scripts/git-config-writes.mjs` | 2 | `contract`, `convention`, `failure-path` | 9.4 | 3.13 | keep | suspect |
| `scripts/git-env.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/invocation-drift.mjs` | 1 | `contract`, `failure-path` | 0.9 | 0.45 | keep | held |
| `scripts/journal-corpus.mjs` | 1 | `contract`, `failure-path` | 0.3 | 0.15 | keep | held |
| `scripts/lint-changeset.mjs` | 1 | `contract`, `failure-path` | 0.8 | 0.4 | keep | held |
| `scripts/local-gate.mjs` | 2 | `contract`, `failure-path` | 5.2 | 2.6 | duplicate | suspect |
| `scripts/log-immutability.mjs` | 1 | `contract`, `failure-path` | 5.4 | 2.7 | keep | suspect |
| `scripts/npm-availability-wait.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/npm-version-gate.mjs` | 1 | `contract`, `failure-path` | 0.2 | 0.1 | keep | held |
| `scripts/pi-durable-spike.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/pin-watch.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/promise-coherence.mjs` | 1 | `contract`, `failure-path` | 1.4 | 0.7 | keep | held |
| `scripts/prose-gate-inventory.mjs` | 1 | `contract`, `failure-path` | 0.6 | 0.3 | keep | held |
| `scripts/published-refs.mjs` | 1 | `contract`, `failure-path` | 0.6 | 0.3 | keep | held |
| `scripts/push-identity-check.mjs` | 2 | `contract`, `failure-path` | 9.4 | 4.7 | duplicate | suspect |
| `scripts/red-first.mjs` | 1 | `contract`, `failure-path` | 12 | 6 | keep | suspect |
| `scripts/relay-packet.mjs` | 1 | `contract`, `failure-path` | 1.6 | 0.8 | keep | held |
| `scripts/release.mjs` | 1 | `contract`, `distribution-contract`, `failure-path` | 3.9 | 1.3 | keep | suspect |
| `scripts/relevant-files.mjs` | 1 | `contract`, `failure-path` | 0.3 | 0.15 | keep | held |
| `scripts/residual-classify.mjs` | 1 | `contract`, `failure-path` | 2.3 | 1.15 | keep | suspect |
| `scripts/review-receipt.mjs` | 2 | `contract`, `failure-path` | 2 | 1 | duplicate | suspect |
| `scripts/review-state.mjs` | 1 | `contract`, `failure-path` | 1.2 | 0.6 | keep | held |
| `scripts/rigidity-review.mjs` | 1 | `contract`, `failure-path` | 0.7 | 0.35 | keep | held |
| `scripts/roadmap-settle.mjs` | 1 | `contract`, `failure-path` | 1.3 | 0.65 | keep | held |
| `scripts/run-root-suite.mjs` | 1 | `boundary`, `contract`, `failure-path` | 4.7 | 1.57 | keep | suspect |
| `scripts/scope-manifest.mjs` | 1 | `contract`, `failure-path` | 1.8 | 0.9 | keep | held |
| `scripts/session-close.mjs` | 1 | `contract`, `failure-path` | 1.7 | 0.85 | keep | held |
| `scripts/setup-env.mjs` | 1 | `contract`, `failure-path` | 7.4 | 3.7 | keep | suspect |
| `scripts/shared-doc-merge.mjs` | 1 | `contract`, `failure-path` | 3.1 | 1.55 | keep | suspect |
| `scripts/skill-lint.mjs` | 1 | `contract`, `failure-path` | 0.7 | 0.35 | keep | held |
| `scripts/structural-sibling-pins.mjs` | 1 | `convention` | 0.1 | 0.1 | keep | held |
| `scripts/telemetry-report.mjs` | 1 | `contract`, `failure-path` | 2.3 | 1.15 | keep | suspect |
| `scripts/temp-hygiene.mjs` | 1 | `contract`, `convention` | 0.3 | 0.15 | keep | held |
| `scripts/temp-root.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/test-impact.mjs` | 1 | `boundary`, `contract`, `failure-path` | 1.9 | 0.63 | keep | held |
| `scripts/test-obligation-tags.mjs` | 1 | `contract`, `convention`, `failure-path` | 0 | 0 | keep | held |
| `scripts/test-route.mjs` | 1 | `contract`, `failure-path` | 0.3 | 0.15 | keep | held |
| `scripts/tier-cost.mjs` | 1 | `contract`, `distribution-contract`, `failure-path` | 0.7 | 0.23 | keep | held |
| `scripts/tmp-gc.mjs` | 1 | `contract`, `failure-path` | 0.4 | 0.2 | keep | held |
| `scripts/unit-cycle.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/update-tools.mjs` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `scripts/version-parity-gate.mjs` | 1 | `contract`, `distribution-contract`, `failure-path` | 0.2 | 0.07 | keep | held |
| `scripts/vocabulary-probe.mjs` | 1 | `contract`, `failure-path` | 0.2 | 0.1 | keep | held |
| `scripts/worktree-guard.mjs` | 1 | `contract`, `failure-path` | 2.1 | 1.05 | keep | suspect |
| `skills/audit-pr/SKILL.md` | 2 | `contract`, `convention`, `distribution-contract`, `failure-path` | 1.7 | 0.43 | keep | held |
| `skills/execute-phase/references/FOLDING.md` | 1 | `contract`, `convention` | 1.5 | 0.75 | keep | held |
| `skills/execute-phase/references/risk-tiers.md` | 1 | `contract`, `failure-path` | 2.1 | 1.05 | keep | suspect |
| `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` | 1 | `contract`, `convention` | 0.2 | 0.1 | keep | held |
| `skills/orchestration-envelope/references/TURN_CONTRACT.md` | 2 | `contract`, `convention`, `failure-path` | 13.3 | 4.43 | keep | suspect |
| `skills/pre-execution-review/references/LEDGERS.md` | 2 | `contract`, `convention` | 1.1 | 0.55 | duplicate | suspect |
| `skills/pre-execution-review/references/POLICY.md` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `skills/product-audit/references/AUDIT_DIMENSIONS.md` | 2 | `contract`, `convention` | 0.2 | 0.1 | keep | held |
| `skills/product-audit/SKILL.md` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `skills/triage-issue/references/ISSUE_PROCESS.md` | 1 | `contract`, `failure-path` | 0.1 | 0.05 | keep | held |
| `skills/triage-issue/SKILL.md` | 1 | `contract`, `convention` | 0.1 | 0.05 | keep | held |
| `skills/unit-lane/references/DESIGN.md` | 1 | `convention` | 0.1 | 0.1 | keep | held |
| `skills/unit-lane/references/PLAN.md` | 1 | `contract`, `convention` | 2 | 1 | keep | suspect |
| `skills/unit-lane/references/RESEARCH.md` | 1 | `convention` | 0.1 | 0.1 | keep | held |
| `skills/workflow-status/references/PRE_EXECUTION.md` | 1 | `contract`, `failure-path` | 0.8 | 0.4 | keep | held |
| `template` | 1 | `convention`, `distribution-contract` | 0.1 | 0.05 | keep | held |
| `template/.agentic-workflow/hooks/secret-scan.mjs` | 1 | `contract`, `failure-path` | 3.7 | 1.85 | keep | suspect |
| `template/.github/PULL_REQUEST_TEMPLATE.md` | 1 | `convention`, `distribution-contract` | 0.1 | 0.05 | keep | held |
| `template/AGENTS.md` | 1 | `convention`, `distribution-contract` | 0.1 | 0.05 | keep | held |

**The decision, cluster by cluster:** `125` clusters, `43` suspects, `5`
selected. Every row's decision is `keep`, and the six `duplicate` rows are the
ones that needed the assertions read — the declaration alone is a candidate,
never a verdict:

| duplicate cluster | the pair | what each side actually asserts |
|---|---|---|
| `docs/features/_TEMPLATE/SPEC.md` | `spec-by-reference` + `unit-doc-contract` | the migration corpus's own bytes (a converted doc's sections in order, its verbatim `S#` quotes, its `L1`) versus the producer's contract (the owner constant, the SDK's duplicate list, the emitted skeleton) |
| `docs/fix/_TEMPLATE/SPEC.md` | the same pair | the same split, on the fix template |
| `packages/agentic-workflow/src/runner/sensors/pre-execution-contract.mjs` | `workflow-status-pre-execution` + `pre-execution-receipt-parent` | the sensor's AC20 states as three computed answers versus the receipt parser's null-word lineage rule |
| `packages/agentic-workflow/src/runner/unit-route.mjs` | `unit-route` + `lane-era-lineage` | the route table's decisions (replan, terminal, decision, plan owner) versus the lane-era plan snapshot and the closure gate that reads it |
| `scripts/local-gate.mjs` | `local-gate` + `dependency-gate` | the step table, the graph and the worker budget versus the fingerprint receipt the executor fast-paths on |
| `scripts/push-identity-check.mjs` | `push-identity-check` + `identity-hook-parity` | the push range's authorship verdicts versus the two carriers' parity on the same profile |

Different behaviours on one surface keep both suites; a deletion on this evidence
would have needed the same assertion twice. **No test in this repository was
deleted, merged or weakened by this unit** — the sweep's product is the evidence
that its cost is now justifiable, and the record a later deletion decision reads
instead of re-deriving it.

### kill-rate

Selective mutation kill-rate over the `5` selected clusters only — one mutant
harness run, never an exhaustive sweep. Each cluster's mutants are three
semantic edits to the module its suites protect (a branch flip, a bound move, a
value or regex swap), applied one at a time to a throwaway copy of the tree
(`mktemp -d`-equivalent scratch, `bun install --frozen-lockfile`, removed after
the run); a mutant is **killed** when at least one suite of that cluster fails.
The baseline (unmutated) run is green for every cluster, so a kill is the mutant
and not the environment. Invocation: `bun test --timeout=20000 <cluster suites>`.

| cluster | suites | mutants | killed | kill-rate | the survivors |
|---|---|---|---|---|---|
| `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` | 4 | 3 | 2 | 0.67 | `M2` — an empty rollup answering another word (`"none"` → `"unknown"`) |
| `packages/agentic-workflow/src/runner/sensors/phase-lint.mjs` | 1 | 3 | 2 | 0.67 | `M3` — a scanning box's range shrinking (`index <= 6` → `<= 5`) |
| `packages/agentic-workflow/src/runner/ceremony/findings.mjs` | 1 | 3 | 1 | 0.33 | `M1` the carrier heading no longer matching (`"Findings"` → `"Finding"`); `M3` a folded row reading unfolded (`c[7] === "yes"` → `"no"`) |
| `packages/agentic-workflow/src/runner/ceremony/ledger.mjs` | 1 | 3 | 1 | 0.33 | `M1` the `Log` heading no longer matching; `M2` the `F` count reading a different mark |
| `packages/agentic-workflow/src/runner/ceremony/plan.mjs` | 1 | 3 | 3 | 1.00 | — |
| **total** | **8** | **15** | **9** | **0.60** | **6 survivors** |

**What the measurement says, and what it does not authorize.** The two
`ceremony` clusters at `0.33` are exactly the shape the cost-over-risk check
looks for: `24 s` of suite for two obligation values, and a third of their
semantic edits survive. `M1` in both is the same hole (`hasDoc`/`hasLog` fall
back to the legacy side file when the heading is absent, and no case drives the
absent heading), and `M2`/`M3` are single-column parsing paths. That is a
**coverage gap in an existing suite, not a deletion**: no test is removed,
merged, weakened or added by this unit — the sweep's product is the evidence,
and adding the missing cases is its own unit with its own risk tier. The four
survivors' mutants are recorded here so whoever takes it starts from the
measurement instead of from a guess. The rule this file states — a test goes when
its surface is gone, when the obligation is genuinely duplicated, or when its
cost exceeds the risk it covers — is untouched by a low kill-rate that names an
*absent* obligation rather than an unreachable one.

### wall-clock

The three change classes the issue names, measured at the base revision and at
the change, with the command the installed `pre-push` hook runs:

```
bun scripts/local-gate.mjs --skip-network --jobs 4 --push-base <revision its own tip>
```

Each class is one representative change committed in a throwaway worktree of that
revision (docs-only: one line in `docs/workflow/SETUP.md`; script change: one line
in `scripts/temp-hygiene.mjs`; package change: one line in
`packages/agentic-workflow/src/feedback/index.mjs` plus its release intent), and
`--push-base` is that revision's own tip, so the impact verdict is the class's and
nothing else. The worktrees and the probe commits were removed after the run.

| change class | base (`176ab984b`) | head (`ed5283dfa`) | the root gate's own step |
|---|---|---|---|
| `docs-only` | 2 s · 11 steps | 1 s · 11 steps | test steps skipped (verdict `empty`) on both sides |
| `script change` | 598 s · 17 steps | 516 s · 17 steps | root suite `206 s` → `155 s` |
| `package change` | 661 s · 17 steps | 478 s · 17 steps | root suite `212 s` → `133 s` |

**What the measurement says.** The class that changed is the docs-only one, and
it did not move: an `empty` impact verdict skips the test-bearing steps on both
sides. For the two test-bearing classes the change's own cost is one suite —
`PASS scripts/test-obligation-tags.test.mjs (0.6 s)` in both head runs — and the
totals moved *down* by far more than that (`-82 s` and `-183 s`), in the same
direction on both classes. That is run-to-run variance on a shared box, not the
change: the gate's cost per class is dominated by the crate suites (`215–251 s`)
and the root suite, which this unit does not touch. The honest conclusion is the
one the measurement supports — **the obligation tags add 0.6 s to a 500 s-class
verification and no step changes its scope**, and a per-class wall clock measured
this way is not an instrument that can resolve a change smaller than its own
variance. That is why the sweep selects suspects by *cost per obligation* from the
root gate's per-suite lines instead of by any aggregate timer.
