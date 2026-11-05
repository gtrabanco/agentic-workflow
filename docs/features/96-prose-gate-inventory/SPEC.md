---
type: feature
scope: medium
---

# 96 — prose-gate-inventory

> One-line: every gate the workflow runs gets one committed row naming its
> enforcement carrier — an automatically re-run script, an on-demand CLI check, or
> prose with a durable anchor — and the table is a machine-checked gate of its own,
> so a gate that survives only in context cannot silently vanish at compaction.

## Specs

The requirements below are the promoted issue's own strings (issue #359, triage
verdict `promote-to-feature`), quoted verbatim between the markers. `S#` is a
requirement id; the issue's measured premise is quoted in `## Impact`.

**S1 — the deterministic inventory.**
> **Deterministic inventory**: a committed table (machine-checkable, same pattern as `normalizer-inventory@1`) listing every gate with its enforcement carrier: `script` (test- or CLI-pinned, cites the pin) vs `prose` (with the file:line that states it). Seed from `normative-surfaces@1` rows, the discipline tests, and POLICY/CHECKS prose rules.

**S2 — triage, not blanket migration.**
> **Triage, not blanket migration**: not every rule deserves a script — a docs-wording rule with low recurrence may stay prose under the re-decision-at-turn contract (#329). Rank candidates by **safety impact × recurrence × checkability**; migrate the top tier into the existing producer families (`promise-coherence`, `unit-route`, `pre-execution-snapshot verify`, schema validators); the rest carry a recorded reason for staying prose.

**S3 — post-compaction resilience note.**
> **Post-compaction resilience note**: prose gates that stay prose get their re-derivation anchored in a durable surface (unit doc / ledger row), never only in the conversation.

**S4 — the inventory is machine-checked.**
> Inventory committed and machine-checked (drift test fails when a gate surface changes without an inventory row).

**S5 — the top tier is migrated.**
> Top-tier prose gates migrated to scripts/tests; root suites green.

**S6 — every survivor records why.**
> Remaining prose-only gates each carry a recorded stay-prose reason (judgment-needed, low recurrence, or host-owned).

**S7 — budgets and release intent.**
> `check-skill-context` green; changeset per repo rule.

## Impact

The premise the issue states, verbatim:

> arXiv [2606.22528](https://arxiv.org/abs/2606.22528) (Governance Decay) measures that context compaction **silently erases prose constraints**: measured constraint-violation rates rise from 0% to 19–59% post-compaction depending on the model. In this repo, pi compacts long `execute-phase`/`fold-findings` runs today — so any gate enforced only by skill prose can silently vanish mid-run, and the run keeps going as if the gate never existed.

- **Consumes:** `AGENTS.md`'s `normalizer-inventory@1` (the pattern: one fenced
  grammar block, parsed from the document, never remembered) and its
  `normative-surfaces@1` block (the seed set of machine-bound surfaces); the
  root-suite discipline families (`scripts/*-discipline.test.mjs`,
  `*-contract.test.mjs`, `*-quality.test.mjs`, `*-parity.test.mjs`) as the
  automatically re-run carriers; `scripts/ceremony/docs.mjs`
  (`check-docs-language`, `check-commit-format`) and `scripts/skill-lint.mjs` as
  on-demand carriers; `skills/pre-execution-review/references/POLICY.md` and
  `AGENTS.md` as the prose owners; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` for
  the new reference's ceilings.
- **Its deliverables are consumed by:** the root suite (the new validator runs on
  every push, so a gate carrier that moves or disappears fails a push);
  `execute-phase` / `fold-findings` executors (the inventory is where a
  post-compaction agent re-derives which rules are still enforced and how);
  #227's deterministic unit-doc verifier (the inventory is the enumerated input
  its "which gates must this unit obey" question reads) and #174's state contract
  (an episode state can only carry gates that are enumerable).
- **Stops being true:** "a gate's enforcement is whatever the session remembers"
  — each inventoried gate now names a pin or an anchor that a script re-checks.
  The claims in `docs/workflow/SKILLS.md` that a gate is "enforced" without a
  carrier citation stop being unfalsifiable.
- **Ask before touching:** the `prose-gate-inventory@1` column set (a closed
  grammar read by a gate — extending it is a SPEC change in this unit's doc); the
  `normative-surfaces@1` rows this unit cites (owned by `AGENTS.md`, guarded by
  `scripts/normative-drift.test.mjs`); any decision to move a rule out of prose
  whose owner is a historical policy section (the policy is retained for legacy
  units and is never rewritten by this unit).

No named high-risk item: the change adds one reference document, one read-only
validator and three root-suite assertions; it moves no existing gate.

## Retirements

Nothing is retired. The change is additive by construction: the inventory cites
the existing carriers and never replaces one, so there is no surface whose
consumer disappears. An empty retirement list is the honest answer here, and the
reason is the issue's own non-goal ("no behavior change to gates that stay prose
beyond recording them").

## Non-goals

The issue's non-goals, verbatim:

> - No new schema; no behavior change to gates that stay prose beyond recording them.
> - No compaction-control features (pi host concern; see #174's scope).
> - No re-litigation of D-31-6 — this continues it.

Additional boundary this unit holds:

- No per-surface inventory row: the inventory enumerates **gates**. A normative
  surface's grammar stays `scripts/normative-drift.test.mjs`'s job, and that suite
  is itself one inventoried gate — so a new surface row needs no second row here.
- No new ranking machinery in a package: the score is arithmetic over three
  declared cells, recomputed by the validator, never a model judgment.

## Risk tier

- **Tier** — `standard` · **Task Size** — `standard`
- **Named high-risk item** — none — not a high-tier unit

Verdict source: `bun scripts/ceremony.mjs tier classify` over this unit's paths
at the cut head; the classifier's `signals[]` carried no high-risk signal (a new
document, a read-only validator, three test assertions).

## Future

none

## Future cost

| Rule | Binds |
|---|---|
| A new gate lands with its inventory row in the same PR, or the root suite fails on the uncited carrier | whoever adds a gate script, suite or discipline rule |
| A prose gate that stays prose carries a `rederive` pointer to a durable surface, never to the conversation | whoever cuts a prose rule into a skill or policy |
| The inventory's column set is closed grammar; extending it is a SPEC change in `docs/features/96-prose-gate-inventory/SPEC.md`, never a silent column | whoever edits `docs/workflow/GATE_INVENTORY.md` |
| `safety × recurrence ≥ 6` with `checkability: 3` is `migrate`: a gate that ranks there may not stay prose | every unit that adds a high-value checkable rule |

## Applicable tests

`bun test scripts/prose-gate-inventory.test.mjs`, plus the root suites the
migrations touch: `scripts/doc-discipline.test.mjs`,
`scripts/ledger-ownership.test.mjs`; and the repo gate
`bun scripts/run-root-suite.mjs`.

## Known pre-existing issues

- The four producer families the issue names in parentheses (`promise-coherence`,
  `unit-route`, `pre-execution-snapshot verify`, schema validators) already carry
  their gates: `promise-coherence`'s claim-kind set is closed and extending it is
  a SPEC change in its owning reference, `unit-route` already derives the step
  list, `pre-execution-snapshot verify` already binds the ledgers, and a new
  schema vocabulary needs a schema-package version mirror. `does-not-affect` this
  unit: the top-tier survivors this unit migrates live in the documentation,
  ceremony and ledger families, and S2's list is exemplary ("the existing producer
  families"), not exhaustive. Recorded so the choice is auditable rather than
  silent.
- `scripts/ceremony/docs.mjs`'s `check-commit-format` cannot be an automatic
  root-suite assertion: 151 of 3,524 historical subjects are merge commits and
  legacy shapes, so a whole-history assertion is impossible and a branch-delta one
  is not stable inside a fixture suite. `affects` this unit: the corresponding
  inventory row stays `cli` with `checkability: 2`, and every stay row may not
  score `checkability: 3`.

## Tasks

- [ ] P1 — Frozen-failure corpus first: the validator suite lands RED before the
      validator exists, with one reproducer per failure mode — a prose anchor whose
      sentence moved, a script pin whose token vanished, an uncited discipline
      suite, an unmigrated `migrate` tier, a stay row with no reason, a tier cell
      that disagrees with its own arithmetic, and a duplicate row id.
      (validator: `bun test scripts/prose-gate-inventory.test.mjs` exits 1 with the
      suite's own `ERR_MODULE_NOT_FOUND` before P2, exit 0 after)
      (Implements: S1, S4)
      Relevant files: scripts/prose-gate-inventory.test.mjs, scripts/fixtures/prose-gate-inventory/

- [ ] P2 — The inventory carrier: `docs/workflow/GATE_INVENTORY.md` publishes the
      `prose-gate-inventory@1` block (gate id, statement, carrier, anchor file,
      section, token, three scores, derived tier, stay reason, re-derivation
      pointer) and the prose that explains the ranking, the closed vocabularies and
      the post-compaction rule; the guide layer indexes it and its ceilings are
      declared.
      (validator: `bun scripts/prose-gate-inventory.mjs` exits 0 with `verdict: PASS`)
      (Implements: S1, S3, S6)
      Relevant files: docs/workflow/GATE_INVENTORY.md, AGENTS.md, docs/workflow/README.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json

- [ ] P3 — The validator: one read-only script parses the block strictly, resolves
      every script pin and prose anchor, recomputes `safety × recurrence` and the
      derived tier, refuses any `migrate` row left at the head, and fails closed on
      an uncited gate suite. Its report prints each resolved `file:line`.
      (validator: `bun scripts/prose-gate-inventory.mjs` exits 0 with `verdict: PASS`;
      a fixture tree with one broken anchor exits 1 naming the gate id)
      (Implements: S1, S4)
      Relevant files: scripts/prose-gate-inventory.mjs

- [ ] P4 — Migration 1, documentation language: `check-docs-language` becomes an
      automatic assertion over the repository head (it exists as a ceremony op and
      nothing re-runs it on a push), so a committed `.es.md` fails the root suite.
      (validator: `bun test scripts/doc-discipline.test.mjs` exits 0; a fixture
      `.es.md` added to a copied tree makes the same assertion exit 1)
      (Implements: S2, S5)
      Relevant files: scripts/doc-discipline.test.mjs, docs/workflow/GATE_INVENTORY.md

- [ ] P5 — Migration 2, the working-copy activation mount: the guide's rule that
      `.claude/skills` is a local, gitignored mount is asserted against the real
      index, so a force-added activation surface fails the root suite.
      (validator: `bun test scripts/doc-discipline.test.mjs` exits 0; a fixture
      index entry makes the assertion exit 1)
      (Implements: S2, S5)
      Relevant files: scripts/doc-discipline.test.mjs, docs/workflow/GATE_INVENTORY.md

- [ ] P6 — Migration 3, one findings carrier per unit: the ledger's "a unit with
      `## Findings` never reads a side ledger" becomes an assertion over every unit
      directory, so a second carrier added beside a migrated unit fails the suite.
      (validator: `bun test scripts/ledger-ownership.test.mjs` exits 0; a fixture
      unit carrying both carriers exits 1 naming the directory)
      (Implements: S2, S5)
      Relevant files: scripts/ledger-ownership.test.mjs, docs/workflow/GATE_INVENTORY.md

- [ ] P7 — Verification at the head: every obligation validator re-run in the
      foreground, the root suite green, the guide-layer budgets green, phase-lint on
      this doc green, and the changeset accepted.
      (validator: `bun scripts/run-root-suite.mjs` exits 0 and
      `bun scripts/check-skill-context.mjs --documents` exits 0)
      (Implements: S1, S2, S3, S4, S5, S6, S7)
      Relevant files: docs/features/96-prose-gate-inventory/SPEC.md, .changeset/

## Triaged steps

<!-- cut by the substituted plan step (this unit's process contract §5); the
     authoritative step list of the lane is not invoked on this change -->

```text
TRIAGE — 96-prose-gate-inventory (feature)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: the issue carries the research (arXiv 2606.22528) · design: mechanism follows normalizer-inventory@1 · release: settles at PR
Budget: strong
```

### Planning evidence

M/L unit — the ledger is frozen as `planning-evidence.md` in this folder (plan
step, sizing rule `skills/unit-lane/references/PLAN.md`), which also holds the
prior-decisions contradiction sweep; this section names it and does not
duplicate its rows.

### Obligations

M/L unit — the ledger is frozen as `planning-obligations.md` in this folder;
this section names it and does not duplicate its rows.

## Acceptance criteria

One observable criterion per `S#`, each naming the check that proves it.

- [ ] **S1** — `docs/workflow/GATE_INVENTORY.md` ships a
  `prose-gate-inventory@1` block listing every inventoried gate with its carrier,
  its pin or anchor, and its numeric ranking; the validator parses it strictly and
  prints each resolved `file:line`. Proof: `bun scripts/prose-gate-inventory.mjs`
  → `verdict: PASS` with a non-zero row count and every carrier in the closed set.
- [ ] **S2** — every row carries `safety | recurrence | checkability`, the tier is
  recomputed from them (`safety × recurrence ≥ 6` with `checkability: 3` ⇒
  `migrate`), no `migrate` row survives at the head, and each `stay` row names
  `judgment-needed | low-recurrence | host-owned`. Proof: the validator's tier
  arithmetic check plus the fixture that seeds an unmigrated top-tier row and
  reproduces exit 1.
- [ ] **S3** — every `prose`/`cli` row that stays carries a `rederive` pointer that
  resolves to a real file and section, and the document states the
  never-only-in-the-conversation rule. Proof: the anchor resolver's
  `missing-rederive` fixture and the head run.
- [ ] **S4** — the drift test fails when a gate surface changes without a row:
  removing a pinned token, moving a prose sentence out of its section, or adding a
  `*-discipline.test.mjs` / `*-contract.test.mjs` / `*-quality.test.mjs` /
  `*-parity.test.mjs` suite with no row each reproduces exit 1 naming the cause.
  Proof: four fixtures plus the base-tree run (the pre-change tree has no block).
- [ ] **S5** — the three top-tier migrations are automatic assertions in existing
  suites: no `.es.md` at the head, no committed `.claude/skills` activation mount,
  and no unit directory carrying both a `## Findings` table and a
  `review-findings.md`. Proof: `bun test scripts/doc-discipline.test.mjs` and
  `bun test scripts/ledger-ownership.test.mjs` exit 0, and each fixture proves the
  assertion bites.
- [ ] **S6** — zero prose-only rows without a recorded reason: the validator
  refuses a `stay` row with an empty or off-vocabulary reason and a reason that
  contradicts its own scores. Proof: the `stay-reason` fixtures and the head run's
  tally printing `stay: <n>`.
- [ ] **S7** — the guide layer stays inside its declared ceilings with the new
  reference budgeted, and the unit carries a changeset. Proof:
  `bun scripts/check-skill-context.mjs --documents` exits 0 and
  `bun scripts/lint-changeset.mjs .changeset/96-prose-gate-inventory.md` matches `ok`.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-05, the request (issue #359, verbatim):
  ```
  ## Summary

  arXiv [2606.22528](https://arxiv.org/abs/2606.22528) (Governance Decay) measures that context compaction **silently erases prose constraints**: measured constraint-violation rates rise from 0% to 19–59% post-compaction depending on the model. In this repo, pi compacts long `execute-phase`/`fold-findings` runs today — so any gate enforced only by skill prose can silently vanish mid-run, and the run keeps going as if the gate never existed.

  Feature 31's D-31-6 already moved the materiality predicate and the two-cycle cap into code; features 84/#315 moved vocabulary and sweep gates into scripts. **Nothing owns the inventory**: there is no maintained answer to "which gates are script/test-pinned and which are prose-only".

  ## Proposed fix

  1. **Deterministic inventory**: a committed table (machine-checkable, same pattern as `normalizer-inventory@1`) listing every gate with its enforcement carrier: `script` (test- or CLI-pinned, cites the pin) vs `prose` (with the file:line that states it). Seed from `normative-surfaces@1` rows, the discipline tests, and POLICY/CHECKS prose rules.
  2. **Triage, not blanket migration**: not every rule deserves a script — a docs-wording rule with low recurrence may stay prose under the re-decision-at-turn contract (#329). Rank candidates by **safety impact × recurrence × checkability**; migrate the top tier into the existing producer families (`promise-coherence`, `unit-route`, `pre-execution-snapshot verify`, schema validators); the rest carry a recorded reason for staying prose.
  3. **Post-compaction resilience note**: prose gates that stay prose get their re-derivation anchored in a durable surface (unit doc / ledger row), never only in the conversation.

  ## Non-goals

  - No new schema; no behavior change to gates that stay prose beyond recording them.
  - No compaction-control features (pi host concern; see #174's scope).
  - No re-litigation of D-31-6 — this continues it.

  ## Acceptance criteria

  - [ ] Inventory committed and machine-checked (drift test fails when a gate surface changes without an inventory row).
  - [ ] Top-tier prose gates migrated to scripts/tests; root suites green.
  - [ ] Remaining prose-only gates each carry a recorded stay-prose reason (judgment-needed, low recurrence, or host-owned).
  - [ ] `check-skill-context` green; changeset per repo rule.
  ```
- **P1** — 2026-11-05 20:30, lane: unit doc cut at `docs/features/96-prose-gate-inventory/`
  (the roadmap row is a **feature** row, so the unit lives in `docs/features/` — the
  branch keeps its `fix/359-…` name), S1–S7 quoted verbatim from issue #359,
  planning evidence and obligations frozen, roadmap row 96 → `in-progress` — next:
  P1 (frozen-failure corpus, red).

## Next

P1 — land `scripts/prose-gate-inventory.test.mjs` red (the base tree has no
inventory block), then P2/P3.

## References

- Issue: [#359](https://github.com/gtrabanco/agentic-workflow/issues/359)
- Research: arXiv [2606.22528](https://arxiv.org/abs/2606.22528) (Governance
  Decay) — the measured post-compaction constraint-violation rates.
- Roadmap row: `docs/ROADMAP.md` §Features row 96.
- Pattern source: `AGENTS.md` `normalizer-inventory@1`.
- Feeds #227's verifier half and unblocks #174's state contract; continues
  feature 31's D-31-6 and feature 84 / #315's script carriers.

## Branch

`fix/359-prose-gate-inventory`

## Depends on

`84-published-vocabulary-sweep-gate` (merged) — the sweep and vocabulary carriers
this inventory cites; `332-agents-md-split` (merged) — the guide layer the
inventory is indexed from.

## Regression scope

What must not break: the three suites the migrations touch keep every existing
assertion.

| Scenario | Verified by |
|---|---|
| The doc-discipline suite's retrieval-toolchain assertions still run | `bun test scripts/doc-discipline.test.mjs` exits 0 |
| The ledger-ownership map still passes both scans | `bun test scripts/ledger-ownership.test.mjs` exits 0 |
| The guide layer is still inside its declared ceilings and blocks | `bun scripts/check-skill-context.mjs --documents` exits 0 |
| The workflow docs index still covers `docs/workflow/` exactly | `bun test scripts/workflow-docs-index.test.mjs` exits 0 |
| Every skill still passes the authoring lint | `bun scripts/skill-lint.mjs` exits 0 |
