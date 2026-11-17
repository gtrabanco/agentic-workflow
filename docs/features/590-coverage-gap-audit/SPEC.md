---
type: feature
scope: medium
roadmap_summary: Issue [#590](https://github.com/gtrabanco/agentic-workflow/issues/590) (M): product-audit process extensibility — a deterministic `coverage-gap@1` join over the verification-criteria catalogue, the installed detectors and the findings corpus; a pass-only-if `Coverage gaps` dimension that routes every gap through `finding-route@1`; the evolution-regression gate against self-erosion; and the emission-only self-improvement principle. Unit doc: [features/590-coverage-gap-audit](features/590-coverage-gap-audit/SPEC.md)
---

# 590 — coverage-gap-audit

> One-line: answer the forward-looking coverage question — which declared verification
> criteria have no detector, which recurring finding classes have no preventive gate,
> and which declared detectors consume no criterion — with one deterministic receipt
> that product-audit consumes and routes, plus the gate that keeps a review-dimension
> change from eroding the dimensions it lands beside.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Apply issue 590 in this repository.**
> Apply to this repository: issue #590

**S2 — The coverage-gap join, deterministic and script-owned.**
> 1. **Coverage-gap join (deterministic, script).** Extend `scripts/findings-corpus.mjs` (or a sibling sharing its carriers) to emit a `coverage-gap@1` receipt crossing:
>    - the project's **verification-criteria catalogue** (init-workspace charter, `audit-docs` check 16),
>    - the **installed detectors** (`docs/workflow/GATE_INVENTORY.md`, the review passes available to the project, profile-declared producers),
>    - the **findings corpus** (recurring classes with no named preventive gate).
>    Output: criteria with no detector · corpus classes with no preventive gate · detectors declared but consuming no criterion (reverse edge). No model judgment in the script — the judgment is the dimension's.

**S3 — The `review-gaps` dimension, pass-only-if.**
> 2. **`review-gaps` dimension in product-audit (pass-only-if).** A dimension in `references/AUDIT_DIMENSIONS.md` + a step in `references/AUDIT_PROCESS.md` that consumes the receipt (deterministic-producer pre-pass pattern, never re-derived by inspection) and routes each gap through the existing `finding-route@1` grammar:
>    - a recommended **external skill** covers it → the skill-discovery route (registries → security lint → owner consent; separate unit),
>    - an **own skill / gate** is warranted → proposal, never auto-built (`/unit-lane`),
>    - the criterion is obsolete or unverifiable → re-triage the catalogue (init-workspace upgrade route).
>    Pass-only-if like the residue sweeps: a gap is a finding only when the surface is evidenced (declared criterion or corpus class) — never speculative. Seed fixture like the residue fixture: one seed per gap class yields exactly one finding on `seeded/` and zero on `clean/`.

**S4 — The evolution-regression gate.**
> 3. **Evolution-regression gate (anti-erosion, arXiv 2605.09315).** When a unit adds or changes a review dimension, review skill, or audit producer, the unit's evidence must re-verify that the previously present dimensions still pass (the workflow-side analogue of the residue sweeps' features-preserved-without-it check). Unconstrained self-evolution measurably degrades previously acquired capabilities — this closes that channel for process changes.

**S5 — Emission-only self-improvement.**
> 4. **Emission-only self-improvement principle (constraint, not mechanism).** The system emits evidence (corpus, receipts, findings); improvement lands through owner decision and `/unit-lane` with its gates — an agent never self-edits `AGENTS.md` or workflow prose in response to its own findings.

**S6 — Receipt from committed carriers, absent inputs named.**
> - [ ] The join emits the typed receipt from committed carriers only (catalogue × inventory × corpus); absent inputs are named, never guessed.

**S7 — The seed fixture, one finding per class.**
> - [ ] Fixture: one seeded gap per class → exactly one finding; clean twin → zero findings.

**S8 — The dimension consumes the receipt and uses no bespoke route.**
> - [ ] The dimension consumes the receipt via the deterministic-producer pre-pass pattern and routes every finding through `finding-route@1`; no bespoke routes.

**S9 — The evolution-regression rule is pinned by a suite test.**
> - [ ] The evolution-regression rule is pinned by a suite test (a change adding a dimension without re-verification evidence fails).

**S10 — The repository ceremony holds.**
> - [ ] `check-skill-context` green (SKILL.md + both references within budget); root suites green; changeset per repo rule.

**S11 — Attribution close-out in the same PR.**
> - [ ] The adopting PR appends/confirms its `ATTRIBUTION.md` adoption rows (documentation close-out, same PR).

**S12 — Continue once the blocker is done.**
> #560 it is done, continue

S12 resolved from state, not from the number: #560 (`307-residual-completion`) closed
2026-11-16T13:22:50Z and was never this unit's blocker; the native `blocked-by` was
**#564** (`init-workspace verification materialization`), closed 2026-11-17T01:55:59Z
by PR #601. Both facts are read from the forge, not taken from the message.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S2) | one deterministic script emits the `coverage-gap@1` receipt from the catalogue, the gate inventory and the findings corpus, naming an absent input instead of guessing it | `bun test scripts/coverage-gap.test.mjs` (the absent-input and resolution cases) |
| AC-2 (S2) | the receipt prints exactly three gap classes — `criterion-uncovered`, `class-uncovered`, `detector-idle` — and no judgment about a gap's severity or route | `bun test scripts/coverage-gap.test.mjs` (the receipt-shape and corpus cases) |
| AC-3 (S3) | `AUDIT_DIMENSIONS.md` carries the `Coverage gaps` dimension with the producer pre-pass and a pass-only-if contract; `AUDIT_PROCESS.md` consumes the receipt as a step | `bun test scripts/coverage-gap.test.mjs` (the prose-pin cases) and `bun scripts/prose-gate-inventory.mjs` exits 0 |
| AC-4 (S3) | every gap row becomes exactly one finding routed through one of the three `finding-route@1` hand-offs; no bespoke route exists | `bun test scripts/coverage-gap.test.mjs` (the route-vocabulary case) and `bun test scripts/product-audit-rescope.test.mjs` exits 0 |
| AC-5 (S7) | the fixture's `seeded/` tree yields exactly one gap per class and its `clean/` twin yields zero | `bun scripts/product-audit-gap-fixture.mjs <dir>` then `bun test scripts/coverage-gap.test.mjs` (the seeded/clean cases) |
| AC-6 (S4) | a change that adds a review dimension without re-verification evidence is refused; a dropped prior dimension needs a recorded owner decision | `bun test scripts/dimension-regression.test.mjs` exits 0 with the four change vectors |
| AC-7 (S4) | the frozen dimension set is asserted on the live tree, so adding a dimension cannot silently drop a prior one | `bun test scripts/dimension-regression.test.mjs` (the live-tree case) |
| AC-8 (S4) | the gate runs on a push range: a range touching a review surface without the recorded re-verification line is refused, and a range touching none is `not-applicable` | `bun scripts/local-gate.mjs --only dimension-regression --push-base <rev>` on the fixture ranges, pinned by `bun test scripts/local-gate.test.mjs` |
| AC-9 (S5) | the emission-only principle is stated once in the dimension's own reference and cites its two sources; it is a constraint, with no mechanism that edits prose | `bun test scripts/coverage-gap.test.mjs` (the emission-only case) |
| AC-10 (S10) | the two references stay inside their declared budgets after the rows land, and the guide's machine region is re-pinned exactly | `bun scripts/check-skill-context.mjs --documents` exits 0 |
| AC-11 (S6) | the new block grammar is registered in `normative-surfaces@1`, claimed by a gate-inventory row, and resolves from committed source | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0 |
| AC-12 (S10) | the root suites pass and the release intent ships | `bun scripts/run-root-suite.mjs` exits 0 and `bun scripts/lint-changeset.mjs .changeset/590-coverage-gap-audit.md` exits 0 |
| AC-13 (S11) | the two 2026-11-16 attribution rows this unit adopts flip from `evidence only` to `idea adapted` with this unit as the landing site | `rg -c 'coverage-gap join' docs/research/ATTRIBUTION.md` matches 2 |

## Impact

- **New deterministic producer**: `scripts/coverage-gap.mjs`, consumed by
  product-audit's new dimension (prose) and by its sibling suite. It imports
  `buildCorpus`/`makeGitFoldResolver` from `scripts/findings-corpus.mjs`, so the
  corpus has one parser and this unit adds no second reader of the ledgers.
- **New evolution gate**: `scripts/dimension-regression.mjs`, wired as a
  `pushBase` step of `scripts/local-gate.mjs`; the step id set is pinned in
  `scripts/local-gate.test.mjs` and `scripts/release-workflows.test.mjs`, so both
  pins move in this change.
- **Changed skill surfaces**: `skills/product-audit/references/AUDIT_DIMENSIONS.md`
  (one dimension row, one pass-only-if section, the evolution-regression and
  emission-only rules) and `references/AUDIT_PROCESS.md` (the consuming step).
  Both files ride the reference budget declared in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`.
- **Guide layer**: one `normative-surfaces@1` row (`coverage-gap-grammar`) plus
  its claim in `docs/workflow/GATE_INVENTORY.md`; the guide's `machineLines` and
  `linesMax` are re-pinned exactly to the measured tree.
- **Consumed from other units**: #437's corpus (`findings-corpus@1`, the admitted
  classes and their `axis`), #564's catalogue shape (`template/docs/workflow/VERIFICATION_CRITERIA.md`,
  whose closed provenance set `audit-docs` check 16 owns), #591's discovery route
  (`agentic-workflow skills discover`), and #436's `ceremony-profile@1`
  (`review-passes` narrows the pass set; absent profile = the full pack).
- **What stops being true**: the claim that product-audit has no consumer for the
  verification-criteria catalogue (audit 2's recorded gap) — the join consumes it;
  and the claim that a review-dimension change is verified only by whatever suites
  the author remembered to run.
- **Ask before touching**: the catalogue's provenance vocabulary (owned by the
  template + `audit-docs` check 16) and the local-gate step graph (the push hook's
  contract). Both are read, never redefined, here.

## Retirements

Strictly additive: nothing is retired. Every surface this unit adds lands with its
consumer named — the join is consumed by the dimension and its suite, the dimension
by product-audit's own progressive loading, the gate by the push hook, the block
grammar by the drift gate, the fixture by the dimension's pass-only-if contract, and
the `coverage-gap@1` receipt by any reader of the audit report.

| Added surface | Named consumer |
|---|---|
| `scripts/coverage-gap.mjs` (`coverage-gap@1`) | `skills/product-audit/references/AUDIT_DIMENSIONS.md` § Coverage-gap sweep; `scripts/coverage-gap.test.mjs` |
| `scripts/dimension-regression.mjs` | `scripts/local-gate.mjs` step `dimension-regression`; `scripts/dimension-regression.test.mjs` |
| `scripts/product-audit-gap-fixture.mjs` | the same reference's pass-only-if contract; `scripts/coverage-gap.test.mjs` |
| `coverage-gap-grammar` (block) | `AGENTS.md#normative-surfaces@1`; `docs/workflow/GATE_INVENTORY.md` `normative-surface-grammar` row |

## Non-goals

- No new standalone review skill: the dimension lives inside `product-audit`, and
  the retrospective halves stay with #437's corpus, `audit-docs` and the gate
  inventory.
- No auto-installation, no auto-remediation, no self-editing of workflow prose:
  every gap is a finding whose route a human or a later lane picks up.
- No adversarial pre-triage and no quality metrics (their units own those).
- Findings discovered during implementation never expand scope.

## Risk tier

- **Tier** — `standard` · **Task Size** — `unit-doc`
- **Named high-risk item** — `none — not a high-tier unit` (computed by
  `agentic-workflow ceremony tier classify --paths …` → `tier: "standard"`,
  `reason_kind: "executable-content"`, `signals: []`; the verdict is in the
  `## Log` D2 line).

## Future

None deferred. (The issue's own non-goals are scope, not deferred work; no row
here is offered at close.)

## Future cost

- **A new review dimension must extend the frozen set**: `scripts/dimension-regression.test.mjs`
  carries the expected dimension ids, so adding one means touching that constant in
  the same change — the gate that forbids an unannounced drop also forbids an
  unannounced addition.
- **A new detector must be claimed or consumed**: a new `GATE_INVENTORY.md` row
  becomes `detector-idle` in the next audit until either a criterion names it or the
  row is removed; the inventory gate keeps the row resolvable meanwhile.
- **A ceremony profile narrows the pass set**: a project that declares
  `review-passes` gets those surfaces only, so a dimension the profile discards is
  reported `n/a — not declared by the project's ceremony profile` by the consumer,
  never silently swept.
- **The catalogue's provenance vocabulary stays the template's**: extending the
  closed set is a change to `template/docs/workflow/VERIFICATION_CRITERIA.md` +
  `audit-docs` check 16 + the join's reader in one PR.

## Applicable tests

- `bun test scripts/coverage-gap.test.mjs` — join, receipt shape, absent inputs,
  catalogue resolution, corpus classes, the seeded/clean fixture, the prose pins.
- `bun test scripts/dimension-regression.test.mjs` — the four change vectors, the
  refused drop, the missing-evidence refusal, the live-tree frozen set.
- `bun test scripts/local-gate.test.mjs` and `bun test scripts/release-workflows.test.mjs`
  — the new step id in both pinned sets.
- `bun test scripts/normative-drift.test.mjs`, `bun scripts/prose-gate-inventory.mjs`,
  `bun scripts/check-skill-context.mjs --documents` — registration and budgets.
- `bun scripts/run-root-suite.mjs` — the whole root suite at the handoff head.

## Known pre-existing issues

- **This repository carries no verification-criteria catalogue** —
  `docs/workflow/VERIFICATION_CRITERIA.md` is absent (only
  `template/docs/workflow/VERIFICATION_CRITERIA.md` exists; `audit-docs` check 16
  states an install that declares neither the section nor the row `n/a`). **Affects**
  the dogfooding receipt only: the join reports `catalogue | absent` and the two
  catalogue-dependent edges `n/a`, which is the declared failure state this unit
  implements, not a defect it introduces.
- **Concurrent sessions share this checkout**: during this unit's cut another
  session removed the worktree registration and its tracked files (the directory
  was left with one untracked file; `git worktree list` no longer listed it). The
  worktree was re-created from `feat/590-product-audit-extensibility` at
  `a370cc84` before P1 was committed. **Affects** every commit here: HEAD is re-read
  before each commit and the plan is committed as soon as it is cut.
- **Snapshots of the catalogue shape are transcriptions**: the join reads the
  template's column names and the closed provenance set; a template rename is a
  same-PR follow-up, and the suite's fixture pins the reader against the template
  bytes it ships with. **Does not affect** the precedence: the template owns the
  shape, the join only reads it.

## Tasks

- P1 — Cut the unit doc, both planning ledgers, the roadmap row and the triage block.
  (validator: `bun test scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12)
  - Relevant files: docs/features/590-coverage-gap-audit/SPEC.md, docs/features/590-coverage-gap-audit/planning-evidence.md, docs/features/590-coverage-gap-audit/planning-obligations.md, docs/ROADMAP.md
- P2 — Land the join's suite alone, observed failing on the missing module (the red commit).
  (validator: `bun test scripts/coverage-gap.test.mjs` exits 1, naming the missing `scripts/coverage-gap.mjs`)
  (Implements: S2, S6)
  - Relevant files: scripts/coverage-gap.test.mjs
- P3 — Implement the join and its seeded/clean fixture; all join cases green.
  (validator: `bun test scripts/coverage-gap.test.mjs` exits 0)
  (Implements: S2, S3, S6, S7)
  - Relevant files: scripts/coverage-gap.mjs, scripts/product-audit-gap-fixture.mjs
- P4 — Land the evolution-regression suite alone, observed failing on the missing module.
  (validator: `bun test scripts/dimension-regression.test.mjs` exits 1, naming the missing `scripts/dimension-regression.mjs`)
  (Implements: S4, S9)
  - Relevant files: scripts/dimension-regression.test.mjs
- P5 — Implement the gate, wire the push-range step, register both gate rows.
  (validator: `bun test scripts/dimension-regression.test.mjs` exits 0 and `bun test scripts/local-gate.test.mjs` exits 0)
  (Implements: S4, S9)
  - Relevant files: scripts/dimension-regression.mjs, scripts/local-gate.mjs, scripts/local-gate.test.mjs, scripts/release-workflows.test.mjs, docs/workflow/GATE_INVENTORY.md
- P6 — Write the dimension and its consuming step; register the block grammar; re-pin the budgets.
  (validator: `bun test scripts/coverage-gap.test.mjs` exits 0, `bun scripts/prose-gate-inventory.mjs` exits 0, `bun scripts/check-skill-context.mjs --documents` exits 0, `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S5, S8, S10)
  - Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md, skills/product-audit/references/AUDIT_PROCESS.md, AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P7 — Close the documentation and state: changeset, attribution rows, projection, roadmap settlement, journal entry, every obligation verified.
  (validator: `bun scripts/lint-changeset.mjs .changeset/590-coverage-gap-audit.md` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S10, S11)
  - Relevant files: .changeset/590-coverage-gap-audit.md, docs/research/ATTRIBUTION.md, docs/ROADMAP.md, docs/generated/, docs/LOGS.md

The planning ledgers live beside this file, for a medium unit:
[planning-evidence.md](planning-evidence.md) and
[planning-obligations.md](planning-obligations.md).

## Triaged steps

```text
TRIAGE — 590-coverage-gap-audit (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the request, verbatim:

  ```
  Apply to this repository: issue #590
  ```

- **L2** — 2026-11-17, the owner's continuation, verbatim:

  ```
  #560 it is done, continue
  ```

- **D1** — 2026-11-17, the blocked-by resolves from the forge, not from the message:
  #590's native `blockedBy` was `#564` (`CLOSED` 2026-11-17T01:55:59Z, merged as PR
  #601) — `#560` closed 2026-11-16T13:22:50Z and was never this unit's blocker.
- **D2** — 2026-11-17, the risk tier is computed, not chosen:
  `agentic-workflow ceremony tier classify --paths scripts/coverage-gap.mjs …` →
  `tier: "standard"`, `reason_kind: "executable-content"`, `signals: []`.
- **D3** — 2026-11-17, the worktree was removed under the cut by a concurrent
  session (registration gone, tracked files deleted, one untracked file left). It
  was re-created from the same branch at `a370cc84` and the plan re-cut before any
  code landed; nothing of this unit was published from the lost tree.

## Next

P1 — commit the cut, then the join's red suite.

## References

- Issue [#590](https://github.com/gtrabanco/agentic-workflow/issues/590) — the
  request this unit implements.
- [#437](https://github.com/gtrabanco/agentic-workflow/issues/437) —
  `findings-corpus@1`, the retrospective half this unit reads.
- [#435](https://github.com/gtrabanco/agentic-workflow/issues/435) —
  `audit-docs` check 16 and the verification-criteria catalogue shape.
- [#564](https://github.com/gtrabanco/agentic-workflow/issues/564) — the
  materialization unit whose delivery unblocked this one.
- [#591](https://github.com/gtrabanco/agentic-workflow/issues/591) — the
  skill-discovery route a gap's external-skill branch hands off to.
- `docs/research/2026-11-16-product-audit-extensibility.md` — the direction note.
- `docs/research/ATTRIBUTION.md` — the two 2026-11-16 rows this unit adopts.
