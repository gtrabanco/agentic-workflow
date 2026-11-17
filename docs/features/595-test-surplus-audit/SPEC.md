---
type: feature
scope: medium
roadmap_summary: Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595) (S/M): product-audit's Tests dimension gains the **surplus** direction — three checks (dead-surface test, obligation-level duplicate, cost-over-value test), a `verified: no surplus tests` evidence row, the weakening-vs-deletion boundary, and normative registration. Triaged promote 2026-11-17 (promoted label applied). Unit doc: [features/595-test-surplus-audit](features/595-test-surplus-audit/SPEC.md)
---

# 595 — test-surplus-audit

> One-line: answer the missing half of the Tests dimension — which tests should not
> exist — with three evidence-standard checks, a `verified: no surplus tests`
> receipt, and the boundary that keeps deletion legal without turning weakening
> into policy.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Apply issue 595 in this repository.**
> Apply to this repository: issue #595

**S2 — Surplus direction in the Tests dimension.**
> 1. **Surplus direction in the Tests dimension.** Three surplus checks, mirroring the owner's deletion-legality rule (2026-11-16):
>    - **Dead-surface test**: a test (or suite) whose tagged/claimed protecting surface no longer exists — the test-code analog of the dimension's existing dead-code check (the `prose citation is not evidence of a consumer` rule, same file).
>    - **Obligation-level duplicate**: two or more tests asserting the same behavioral obligation on the same surface. Evidence standard: obligation-level (asserted behavior), **not line coverage** — Rothermel et al. 1998/2004 showed coverage-safe minimization still severely compromises fault detection, and Inozemtseva & Holmes 2014 show line coverage does not track effectiveness. Selective mutation kill-rate is the confirmation mechanism for contested clusters, never an exhaustive sweep (cost precedent: gentle-ai issue 5092).
>    - **Cost-over-value test**: a test whose execution and maintenance cost exceeds the behavioral risk it covers (risk-based testing; Myers 1979: testing is executing a program with the intent of finding errors — a test that cannot usefully fail is not a test).

**S3 — The verified evidence row.**
> 2. **The verified evidence row.** Every audit pass that reaches the Tests dimension records `verified: no surplus tests` when clean, or carries findings — the check is "verified", not a reward for deletion.

**S4 — Deletion route.**
> 3. **Deletion route.** A surplus finding classifies `fix-now (delete)` **only** with the evidence standard above (dead-surface proof or obligation-level duplication evidence). Deletion is executed by the owner/fold-findings, never by the audit itself.

**S5 — Distinct from weakening.**
> 4. **Distinct from weakening.** The audit wording states the boundary: deleting a test with evidence is legal; weakening a test to pass is never (AGENTS.md "a test is never edited to pass" — deletion is not an exception to the red-first/no-weakening rules, it is a separate, evidence-gated action).

**S6 — Normative registration.**
> 5. **Normative registration.** The new finding class and the `verified` row enter the repo's normative surface inventory (`docs/workflow/GATE_INVENTORY.md`, the owner table in AGENTS.md) with one owner.

**S7 — A pass reaches the dimension and records the receipt.**
> - [ ] A product-audit pass on this repo reaches the Tests dimension and records the `verified: no surplus tests` row or evidence-backed findings.

**S8 — The three checks are in the dimension inventory.**
> - [ ] The three surplus checks are in the dimension inventory with their evidence standards.

**S9 — The boundary is stated where the check is defined.**
> - [ ] The weakening-vs-deletion boundary is stated where the check is defined.

**S10 — The repository ceremony holds.**
> - [ ] `bun scripts/check-skill-context.mjs` green; no stack/vendor references; changeset per repo rule.

**S11 — The declared non-goals hold.**
> - No deletion mechanism inside product-audit (findings only; the skill never edits code).
> - No new scripts or gates in this unit — the duplication evidence is produced by the relevance-sweep unit (soft Related below); until then the audit uses the tags/claims a test carries and manual-owner evidence.
> - No decision-model dependency — this unit is deterministic prose and audit route only. A future decision-substrate upgrade is recorded in #444, not here.
> - No translation artifacts (English-only rule).

**S12 — Direct application, no self-machinery, no self-approval.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change.

S11's second bullet and this unit's pin suite: the non-goal refuses a *producer* and a
*gate* — the duplication-evidence machinery #596 owns. The one file this unit adds
under `scripts/` is a prose pin with no producer and no gate step: it is the carrier
that keeps the new normative surface from silently vanishing after a compaction
(the reason `docs/workflow/GATE_INVENTORY.md` exists at all). Recorded as D2.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S1) | every expected behaviour issue #595 declares is delivered in this repository, each covered by the row below | `bun test scripts/product-audit-surplus.test.mjs` exits 0 |
| AC-2 (S2, S8) | the dimension inventory carries the three surplus checks — `dead-surface`, `obligation-duplicate`, `cost-over-value` — each with its own evidence standard, inside the `test-surplus@1` block the drift gate resolves | `bun test scripts/product-audit-surplus.test.mjs` exits 0 (the block and the per-check evidence cases) |
| AC-3 (S3) | every pass that reaches the Tests dimension records `verified: no surplus tests` on a clean sweep, or the finding ids on a non-clean one, and a clean sweep is never rewarded with a deletion | `bun test scripts/product-audit-surplus.test.mjs` exits 0 (the receipt case, both references) |
| AC-4 (S4) | a surplus finding takes `fix-now (delete)` only with an evidence standard, routes through `finding-route@1` to `/fold-findings`, and the audit repairs nothing | `bun test scripts/product-audit-surplus.test.mjs` exits 0 (the class/route case) |
| AC-5 (S5, S9) | the delete-vs-weaken boundary is stated where the check is defined and cites the guide's rule by pointer instead of restating it | `bun test scripts/product-audit-surplus.test.mjs` exits 0 (the boundary case) |
| AC-6 (S6) | `normative-surfaces@1` declares `test-surplus-grammar`, one gate-inventory row claims it, and both resolve from committed source | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0 |
| AC-7 (S7) | the receipt is mandatory for any pass that reaches the Tests dimension (structural half); the observation half needs an owner-triggered audit pass, which this unit does not run — see the `n/a` evidence on O13 | `bun test scripts/product-audit-surplus.test.mjs` exits 0 (the process-receipt case) |
| AC-8 (S10) | both product-audit references sit inside their declared ceilings after re-basing, the guide's machine region is re-pinned exactly, and the release intent ships | `bun scripts/check-skill-context.mjs --documents` exits 0, `bun scripts/check-skill-context.mjs --skill product-audit` exits 0, `bun scripts/lint-changeset.mjs .changeset/595-test-surplus-audit.md` exits 0 |
| AC-9 (S10) | no stack, product or vendor reference enters the new prose | `bun scripts/skill-lint.mjs` exits 0 |
| AC-10 (S11) | no schema vocabulary, no local-gate step and no deletion mechanism land: the audit still repairs nothing | `git diff --name-only <base>...HEAD -- packages/agentic-workflow-schema scripts/local-gate.mjs` prints nothing |
| AC-11 (S12) | no review, audit or fold machinery ran on this change and every validator above ran in the foreground | `rg -c '^- \*\*R' docs/features/595-test-surplus-audit/SPEC.md` matches 0 |

## Impact

- **Changed skill surfaces**: `skills/product-audit/references/AUDIT_DIMENSIONS.md`
  (the Tests dimension row's swept scope plus one pass-only-if section carrying the
  `test-surplus@1` grammar) and `references/AUDIT_PROCESS.md` (the receipt step and
  the deletion route in the numbering step). Both ride the reference budget the
  manifest declares for product-audit.
- **Guide layer**: one `normative-surfaces@1` row (`test-surplus-grammar`) and its
  claim in `docs/workflow/GATE_INVENTORY.md`; the guide's `machineLines` and
  `linesMax` are re-pinned exactly to the measured tree.
- **New carrier**: `scripts/product-audit-surplus.test.mjs` — a prose pin, no
  producer and no gate step (S11's declared boundary). Its consumer is the root
  suite, which discovers every `scripts/*.test.mjs`.
- **Consumed from other units, never redefined**: the classifier's closed class set
  and severity ladder (`skills/review-implementation/references/CLASSIFY.md`), the
  `finding-route@1` hand-off grammar (`skills/product-audit/SKILL.md`), the
  residue sweep's "a prose citation is not evidence of a consumer" rule and its
  `fix-now (delete)` notation (same reference), and the guide's
  tests-never-weakened rule (`AGENTS.md` § Working rules). Each is cited, never
  copied.
- **What stops being true**: the claim that the Tests dimension sweeps one
  direction only, and the audit 2 receipt that never asked "which tests should not
  exist" (owner observation 2026-11-16).
- **Ask before touching**: the classifier's class vocabulary and the residue
  sweep's dead-code rule. Both are read here; changing either is its own unit.

## Surfaces

- `skills/product-audit`
- `scripts`
- `docs`

## Retirements

Strictly additive: nothing is retired. Every added surface lands with its consumer
named.

| Added surface | Named consumer |
|---|---|
| `test-surplus@1` block in `AUDIT_DIMENSIONS.md` | `AGENTS.md#normative-surfaces@1` row `test-surplus-grammar`; `scripts/normative-drift.test.mjs` resolves it |
| `verified: no surplus tests` receipt | `AUDIT_PROCESS.md` step 3 (every pass reaching the Tests dimension) |
| `scripts/product-audit-surplus.test.mjs` | `scripts/run-root-suite.mjs` (every `scripts/*.test.mjs` is dispatched) |
| `test-surplus-audit` gate-inventory row | `docs/workflow/GATE_INVENTORY.md`'s one reader, `bun scripts/prose-gate-inventory.mjs` |

## Non-goals

- No deletion mechanism inside product-audit: findings only, the skill never edits
  code (S11).
- No duplication-evidence producer and no gate step: the per-suite obligation tags
  and the deterministic duplication sweep are #596's (S11).
- No decision-model dependency: deterministic prose and audit route only; the
  decision-substrate upgrade is #444's (S11).
- No translation artifacts (English-only rule, S11).
- Findings discovered during implementation never expand scope.

## Risk tier

- **Tier** — `standard` · **Task Size** — `unit-doc`
- **Named high-risk item** — `none — not a high-tier unit`.

The verdict is computed, never chosen: `agentic-workflow ceremony tier classify`
drops a path that does not exist yet, so a P1-time run over the documentation-only
set answers `passive — no-executable-effect`. The authoritative run happens at P2,
once `scripts/product-audit-surplus.test.mjs` exists, and its verdict is copied
verbatim into the D2 log line; this section is corrected to match if the verdict
differs from `standard`.

## Future

None deferred. Issue #595's non-goals are scope, not deferred work: #596 (the
relevance sweep), #597 (test justification and deletion authority) and #598 (the
dogfooding estate sweep) are their own units, already in the roadmap.

## Future cost

- **A dimension change triggers the anti-erosion gate**: touching
  `skills/product-audit/references/AUDIT_DIMENSIONS.md` makes
  `scripts/dimension-regression.mjs` require a recorded run, so every later unit
  that edits a dimension pays one `E` line. That is the gate working, not friction.
- **The dimension set is frozen in the suite**: `scripts/dimension-regression.test.mjs`
  asserts the exact ids, so a future unit that adds a *row* to the applicability
  table must move that constant in the same change; editing an existing row's
  swept scope (what this unit does) does not.
- **The pinned prose is now load-bearing**: a future edit to the surplus section
  that changes the check ids, the receipt wording or the class notation must move
  `scripts/product-audit-surplus.test.mjs` with it, or the root suite refuses.
- **The audit owes an observation**: the first owner-triggered product-audit pass
  after this lands is the run that records the receipt on a real product
  (AC-7's observation half).
- **Deletion authority stays elsewhere**: this unit grants the *route*, not the
  execution — a `fix-now (delete)` row is `/fold-findings`'s to execute, and #597
  owns registering that authority where deletions happen.

## Applicable tests

- `bun test scripts/product-audit-surplus.test.mjs` — the pin suite: the dimension
  row, the three checks and their evidence standards, the receipt, the class and
  route, the boundary, the registration, and the regression pins for the wording
  that must not move.
- `bun test scripts/normative-drift.test.mjs` and `bun scripts/prose-gate-inventory.mjs`
  — the new normative surface resolves in both directions.
- `bun test scripts/product-audit-rescope.test.mjs`, `bun test scripts/residue-dimensions.test.mjs`,
  `bun test scripts/coverage-gap.test.mjs`, `bun test scripts/dimension-regression.test.mjs`
  — the sibling suites that read the same two reference files: previous behaviour
  still holds.
- `bun scripts/skill-lint.mjs`, `bun scripts/check-skill-context.mjs --documents`,
  `bun scripts/check-skill-context.mjs --skill product-audit` — the authoring and
  budget gates.
- `bun scripts/run-root-suite.mjs` — the whole root suite at the handoff head.

## Known pre-existing issues

- **The workspace is uninstalled in this checkout** (`node_modules` absent at cut):
  `bun install --frozen-lockfile` was run at P1 to make the crate's CLI available
  (tier classify, journal write), which is a checkout-local, gitignored step and
  not part of the change. **Does not affect** any validator: the root suites read
  committed source and the two budget/registration gates are dependency-free.
- **`docs/audits/` carries no equivalent-scope audit of this dimension** — the
  owner observation of 2026-11-16 that motivates S2 has no persisted report row.
  **Affects** AC-7's observation half only: the receipt is proved structurally and
  the observation is recorded `n/a` on O13 with that reason, never claimed.
- **The guide's line ceiling is spent exactly, never re-based by arithmetic**
  (the fix #571 / #591 / #590 precedent): one new machine row moves `linesMax`
  723 → 724 and `machineLines` 160 → 161. **Affects** O9's evidence cells; it is
  the declared cost of registering a surface, not a defect.
- **Snapshots of the two references are transcriptions**: the pin suite asserts the
  wording this unit lands. A later unit that rewords the section must move the pin
  with it. **Does not affect** precedence: the reference owns the rule; the suite
  only proves it is still there.

## Tasks

- P1 — Cut the unit doc and both planning ledgers; record the intent resolution and
  the tier run.
  (validator: `bun test scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12)
  - Relevant files: docs/features/595-test-surplus-audit/SPEC.md, docs/features/595-test-surplus-audit/planning-evidence.md, docs/features/595-test-surplus-audit/planning-obligations.md
- P2 — Land the pin suite alone, observed failing on the assertions the prose does
  not satisfy yet (the red commit); record the tier verdict.
  (validator: `bun test scripts/product-audit-surplus.test.mjs` exits 1 with the surplus cases failing)
  (Implements: S2, S3, S4, S5, S6, S8, S9)
  - Relevant files: scripts/product-audit-surplus.test.mjs
- P3 — Write the Tests dimension row, the surplus sweep section and its
  `test-surplus@1` grammar in the dimensions reference.
  (validator: `bun test scripts/product-audit-surplus.test.mjs` exits 0)
  (Implements: S2, S3, S5, S8, S9)
  - Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md
- P4 — Write the receipt step and the deletion route in the process reference.
  (validator: `bun test scripts/product-audit-surplus.test.mjs` exits 0)
  (Implements: S3, S4, S7)
  - Relevant files: skills/product-audit/references/AUDIT_PROCESS.md
- P5 — Register the surface in the guide and the gate inventory; re-pin both budgets.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S6, S10)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P6 — Close documentation and state: changeset, regenerated projection, journal
  fragment, and every obligation row closed on its own validator's evidence.
  (validator: `bun scripts/lint-changeset.mjs .changeset/595-test-surplus-audit.md` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S10, S11, S12)
  - Relevant files: .changeset/595-test-surplus-audit.md, docs/generated/, .agentic-workflow/journal/, docs/features/595-test-surplus-audit/SPEC.md

The planning ledgers live beside this file, for a medium unit:
[planning-evidence.md](planning-evidence.md) and
[planning-obligations.md](planning-obligations.md).

## Triaged steps

```text
TRIAGE — 595-test-surplus-audit (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
```

Declared transcription, not the router's output: `runner unit-route --triage` could
not be executed at the cut in this checkout (the workspace's CLI needs an installed
`node_modules`, absent until P1's `bun install`). The block is the catalog's own
rule set for `type: feature` + `scope: medium` (`packages/agentic-workflow/src/runner/catalog.json`),
recorded as a transcription rather than passed off as a run. An owner-triggered
`runner unit-route --triage 595-test-surplus-audit` re-derives it.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the request, verbatim:

  ```
  Apply to this repository: issue #595
  ```

- **D1** — 2026-11-17, intent resolved from state before any action: `proceed`.
  The unit folder was absent, the worktree `feat/595-test-surplus-audit` was clean
  at `8b51f375` and no `human-revision-needed` label is present (`gh issue view 595
  --json labels` → `promoted` only), so the intent "apply issue #595" has no
  contradicting state and starts as a fresh cut.
- **D2** — 2026-11-17, the non-goal boundary is read narrowly, not waived: S11
  refuses a duplication-evidence *producer* and a new *gate*, both #596's. This
  unit adds one prose pin (`scripts/product-audit-surplus.test.mjs`) whose only
  job is to keep the new normative surface from silently vanishing after a
  compaction — the defect class `docs/workflow/GATE_INVENTORY.md` exists to
  prevent. No producer, no local-gate step, no schema vocabulary.

## Next

P2 — land the pin suite alone and observe it red.

## References

- Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595) — the PR
  closes it via `Closes #595`.
- `skills/product-audit/references/AUDIT_DIMENSIONS.md` § Residue sweeps — the
  dead-code rule and the `fix-now (delete)` notation this sweep composes.
- `skills/review-implementation/references/CLASSIFY.md` — the closed class set and
  the severity ladder, consumed and never restated.
- `skills/product-audit/SKILL.md` § Output format — the `finding-route@1` hand-off
  grammar.
- Soft order: #596 (per-suite obligation tags and the deterministic duplication
  evidence) strengthens this check's evidence source; #597 owns deletion authority
  where deletions happen; #598 is the dogfooding estate sweep. None blocks this
  unit.
