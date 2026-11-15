---
type: fix
scope: medium
ac-hash: dd7656cc109c3326a07847023fd4cdabcd3b5846629fc792fce5ab917b6d5704
---

# fix/441-triage-issue-rescope

> One-line: `triage-issue` becomes the router the ODD-hybrid direction needs —
> two new verdicts (`one-shot`, `remove`), the ceremony profile's declared
> surfaces, the provenance of every criterion a verdict used, typed-receipt
> input, and the fold→repair switch that stays **off** until its retirement
> triggers are green. The core verdict/label contract is untouched.
>
> Applied through the owner's local unpublished workflow (§5 ledger freeze
> substitutes for the lane's plan step); no repo review/fold machinery runs on
> this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#441` — "ISSUE: triage-issue re-scope — one-shot and removal verdicts,
ceremony-profile integration, typed-receipt input, fold→repair route switch"
(`enhancement`, `backlog`, `fix-next`). The PR closes it via `Closes #441` in
the body.

Its own `## Path` says it is a fix unit whose items 1–4 land when their inputs
exist; #436, #437 and #438 (its declared inputs) are all closed at this
branch's base, so all seven behaviours are implementable now.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. `S1` is
the owner's apply instruction and its routing answer; `S2`–`S8` are the issue's
`## Expected behaviour` items in the order the issue states them.

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #307

and the owner's routing answer to the resolution question:

> selected a-then-b

**S2 — New verdict `one-shot`.**
> **New verdict `one-shot`** (the #307 Layer-1 organic route): work that is small, understood, and meets deterministic eligibility (single surface, no pending design decision, no contract consumed by others, existing validator, resumable-from-diff, reversible) runs inline with the gate only + owner consent — not as a unit. 今天 the router cannot decide "this is not even a unit".

**S3 — New verdict `remove`.**
> **New verdict `remove`** (#307 note 11): the deletion decision is a triage verdict over measurements — inputs are the deterministic `residual-classify` states (#438: orphan is the only retire-legitimate state; scaffold/half-built adjust it), the ARW code-net ratio (#437 band), and the impact sweep. The verdict carries its inputs as receipts; no measured verdict, no removal.

**S4 — ceremony-profile integration.**
> **ceremony-profile integration** (#436): triage reads the profile to route only to declared surfaces (which review passes/audits this project pays); the anti-gaming guard holds in both directions — the profile never authorizes skipping tier gates, verification or non-negotiables.

**S5 — Criteria provenance surfaced.**
> **Criteria provenance surfaced** (#435 charter note): triage matches the unit against the charter's criteria catalogue; open-with-default criteria it touches are surfaced to the owner (help-mode per the charter question protocol), and each verdict records the provenance of the criteria it used (`workflow-generic` / `project-declared` / `dated assumption`).

**S6 — Typed-receipt input mode.**
> **Typed-receipt input mode** (#307 notes 5/6): findings live as typed envelopes (`EnvelopeFixNowFinding` shape); audit-finding mode accepts receipts in addition to markdown audit files; the local-flow `EXTERNAL VERIFY` block is a candidate input in the same shape.

**S7 — Conditional route switch.**
> **Conditional route switch** (gated strictly by the fold-findings retirement triggers of note 6): `--prioritize-now` and the fix-in-unit fold route switch from `/fold-findings` to `execute-phase --repair <receipt>` **only when those triggers are green** — switching earlier reopens the unbounded loop the bound was built to close.

**S8 — Batch flow unchanged.**
> **Batch flow unchanged**: fixed-format verdict blocks, labels applied by verdict per the contract, summary table + `→ Next` map with one command per issue.

## Impact

The sweep this unit owes — cut here, not rediscovered at review:

- **The skill's five references** are the contract's own homes, all edited in
  one change: `ISSUE_PROCESS.md` (classification + verdict block),
  `REVIEW_FINDING_PROCESS.md` (the conditional route switch),
  `AUDIT_FINDINGS.md` (the receipt input mode), `LABELS.md` (no new label — the
  obligation is stated so the next reader does not invent one), and the new
  `RECEIPTS.md` (the typed-receipt grammar's citation site).
- **The machine surface**: `packages/agentic-workflow-schema/src/vocabularies.ts`
  publishes two closed sets; `src/index.ts` re-exports them;
  `scripts/vocabulary-parity.test.mjs` pins their non-emptiness;
  `AGENTS.md`'s `normative-surfaces@1` inventory declares them, which is what
  makes `scripts/normative-drift.test.mjs` refuse a verdict the machine no
  longer publishes.
- **Consumers that read the verdicts today** and must keep working untouched:
  `fold-findings` (the fold route), `review-change`/`audit-pr` (the findings
  they persist), `workflow-status` (labels-only presence signal),
  `batch-scheduler` (roadmap fix rows), `unit-route` (the `route:`/`class:`
  cells of a findings carrier). None of them gains a new branch: the two new
  verdicts never write a label and never write a findings row.
- **Documentation surfaces** that enumerate verdicts and become false when the
  set grows: `docs/workflow/ISSUE_WORKFLOW.md`, `docs/workflow/SKILLS.md`,
  `README.md`, and the generated projection (emitter, never hand-written).
- **A live side on the other side of the change**: the repo's own
  `docs/ROADMAP.md` rows are what `triage-issue` reads for the scope-membership
  check. Two rows were reconciled in this session's settle commit (83, 434) and
  fourteen others are stale (`idea`/`planned`/`in-progress` while every cited
  issue is closed) — so the scope-membership step must not treat a stale
  `in-progress` row as an open unit without checking the issue's state. That
  is recorded as a known pre-existing issue below and is **not** repaired here.

## Retirements

Nothing is retired: this is a strictly additive unit. The computed surface
inventory is the receipt.

```text
bun scripts/residual-classify.mjs --inventory --base 4eedcf61
```

prints one row per added surface (the two vocabularies, the five reference
sections, the new reference file, the new suite) with the state the plan
decides for it. No existing verdict, label, route or section is removed: the
five-verdict classification keeps its five verdicts, `fold-findings` keeps its
route until S7's triggers are green, and the label vocabulary is byte-unchanged
(S8 + the issue's own Non-goals).

## Non-goals

Verbatim from the issue:

> - No change to label ownership/injection-safety invariants.
> - No auto-implementing of any verdict outcome (the lane/fold owns fixes as today).
> - No route switch before the fold-findings retirement triggers are green.

Plus, from this unit's own plan: no repair of the fourteen stale roadmap rows
(observed, reported, and owned by its own unit), and no new CLI command — the
profile and the receipts are read through the surfaces that already publish
them.

## Risk tier

`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths skills/triage-issue/SKILL.md,skills/triage-issue/references/ISSUE_PROCESS.md,skills/triage-issue/references/REVIEW_FINDING_PROCESS.md,skills/triage-issue/references/AUDIT_FINDINGS.md,AGENTS.md,packages/agentic-workflow-schema/src/vocabularies.ts,scripts/vocabulary-parity.test.mjs`
answered, verbatim:

- **Tier** — `standard` · **Task Size** — understood: `true`, contained risk:
  `contained`, resumable-from-diff: `true`
- **reason** — `2 path(s) carry executable content:
  packages/agentic-workflow-schema/src/vocabularies.ts,
  scripts/vocabulary-parity.test.mjs`
- **reason_kind** — `executable-content`
- **signals** — `[]`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

none — nothing was deferred by the owner.

## Future cost

- **The stale-status class stays open.** Fourteen feature rows still claim
  `idea`/`planned`/`in-progress` while every issue they cite is closed; a
  consumer reading the roadmap as an open-unit list inherits the false signal.
  Binds: whoever builds the roadmap-settle unit (the deterministic writer exists
  — `ceremony roadmap settle` — but only settles an `in-progress` row whose
  summary already carries a pull-request URL).
- **The typed-receipt input mode binds the future repair route.** When
  `execute-phase --repair <receipt>` lands with the fold-findings retirement
  (S7's triggers), it consumes the same `EnvelopeFixNowFinding` rows this unit's
  receipt mode reads. Binds: the retirement's implementing unit.

## Applicable tests

- `bun test scripts/triage-rescope.test.mjs` — the new suite (S2–S8).
- `bun test scripts/normative-drift.test.mjs` — the two vocabularies resolve as
  declared normative surfaces.
- `bun test scripts/vocabulary-parity.test.mjs` — the published sets are
  non-empty and the cites stay pinned.
- `bun test scripts/spec-by-reference.test.mjs` and
  `bun test scripts/skill-lint.test.mjs` — the skill-authoring contract and the
  unit-doc grammar this unit's prose lives inside (previous behaviour holds).
- `bun run --cwd packages/agentic-workflow-schema test` — the schema package's
  own suite over the new exports.
- `bun scripts/check-skill-context.mjs` — the context budgets.

## Known pre-existing issues

- **Fourteen stale roadmap rows** (`33, 45, 53, 68, 81, 91, 108, 109, 436, 438,
  443, 476, 498, 552`): `idea`/`planned`/`in-progress` while every cited issue
  is closed. **Does not affect this unit** — the scope-membership step is
  written to confirm the issue's own state before treating a row as an open
  unit, which is what makes the false signal harmless here; the row repair
  remains its own unit (Future cost row 1).
- **`execute-phase --repair` does not exist yet** (`rg -c '\-\-repair'
  skills/execute-phase/SKILL.md` → 0). **Affects this unit by design**: S7 can
  only describe the switch as conditional and must keep `/fold-findings` as the
  live route. The prose never emits the future command as a live `→ Next:`.

## Acceptance criteria

One observable criterion per requirement; each names the check that proves it.

1. **AC1 (S1)** — the unit doc carries `S1`–`S8` frozen, its ledgers exist in
   the M/L shape and the document verifier accepts it:
   `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/441-triage-issue-rescope/SPEC.md` exits 0.
2. **AC2 (S2)** — `TRIAGE_VERDICTS` publishes `one-shot` (with the six other
   verdicts) and the triage surface names it:
   `bun test scripts/triage-rescope.test.mjs` exits 0 (test: the published set
   and the `triage-verdict@1` block agree token for token).
3. **AC3 (S2)** — the `one-shot` eligibility checklist carries all six
   conditions plus the owner-consent requirement, and a `standard`/`high` tier
   disqualifies it: `bun test scripts/triage-rescope.test.mjs` exits 0
   (test: the six conditions are named; the disqualification sentence exists).
4. **AC4 (S3)** — `remove` names its three measured inputs and the
   no-measurement-no-removal rule: `bun test scripts/triage-rescope.test.mjs`
   exits 0 (test: the three commands are cited in the verdict's own block).
5. **AC5 (S4)** — the skill reads `ceremony-profile@1` before routing and states
   the two-way anti-gaming rule: `bun test scripts/triage-rescope.test.mjs`
   exits 0 (test: the profile read and both directions are present).
6. **AC6 (S5)** — every verdict block records `Criteria:` with a token from the
   published provenance set, and a touched open-with-default criterion is
   surfaced: `bun test scripts/triage-rescope.test.mjs` exits 0 (test: the block
   grammar carries the line; the three tokens match the schema export).
7. **AC7 (S6)** — a typed-receipt input mode exists and its reference is in the
   skill's progressive-loading allowlist:
   `bun test scripts/triage-rescope.test.mjs` exits 0 (test: the allowlist names
   the reference and the mode accepts both carriers).
8. **AC8 (S7)** — the route switch is conditional on the named triggers, with
   `/fold-findings` still the live route:
   `bun test scripts/triage-rescope.test.mjs` exits 0 (test: both routes named;
   the trigger gate present; no live `→ Next:` names the future command).
9. **AC9 (S8)** — the batch flow is unchanged: per-issue verdict block, one
   summary table grouped by home unit, one `→ Next:` line per verdict:
   `bun test scripts/triage-rescope.test.mjs` exits 0 (test: the four closing
   grammar elements survive verbatim; the pre-existing assertions in
   `scripts/review-loop-discipline.test.mjs` stay green).
10. **AC10 (all)** — the repository gate accepts the change:
    `bun scripts/local-gate.mjs` exits 0.

## Tasks

The plan declaration the protected-path gate reads (one home: this block; an
escape record, when one is needed, lives in
[`decisions.md`](decisions.md)):

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | scripts/triage-rescope.test.mjs | The unit's frozen reproducers: every S2-S8 rule of issue #441 asserts here, landed alone and observed red at P1 before any implementation (the repo's red-first rule). No existing suite is edited by this unit (D-441-1), so a create is all the gate has to see.
```

- P1 — Land the RED corpus alone: `scripts/triage-rescope.test.mjs` asserting the two unpublished vocabularies, the verdict block, the `one-shot` eligibility, the `remove` inputs, the profile read, the criteria provenance, the receipt mode and the conditional switch (validator: `bun test scripts/triage-rescope.test.mjs` exits 1, naming the unpublished vocabularies and the missing grammars)
  (Implements: S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: scripts/triage-rescope.test.mjs, skills/triage-issue/SKILL.md
- P2 — Publish `TRIAGE_VERDICTS` and `TRIAGE_CRITERIA_PROVENANCE` in the schema package and re-export them from its index (validator: `bun run --cwd packages/agentic-workflow-schema test` exits 0)
  (Implements: S2, S3, S5)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts
- P3 — Declare both vocabularies as normative surfaces in `AGENTS.md` (the `schema-export` declaration home, `must-name: no`) (validator: `bun test scripts/normative-drift.test.mjs` exits 0 with both surfaces fault-free and `bun test scripts/triage-rescope.test.mjs` exits 0)
  (Implements: S2, S3, S5)
  - Relevant files: AGENTS.md
- P4 — Rewrite the classification in `ISSUE_PROCESS.md`: the seven-verdict table with `one-shot` and `remove` as their own entries, the six-condition eligibility checklist with the consent and tier-disqualification clauses, and the removal verdict's three measured inputs (validator: `bun test scripts/triage-rescope.test.mjs` exits 0 for the verdict-grammar, eligibility and removal assertions)
  (Implements: S2, S3)
  - Relevant files: skills/triage-issue/references/ISSUE_PROCESS.md
- P5 — Wire the skill's front matter and body: the `one-shot`/`remove` modes, the profile read in Step 0, the two-way anti-gaming statement, the turn-contract box and every `→ Next:` line the new verdicts need (validator: `bun test scripts/triage-rescope.test.mjs` exits 0 for the profile and hand-off assertions)
  (Implements: S2, S3, S4, S8)
  - Relevant files: skills/triage-issue/SKILL.md
- P6 — Add the `Criteria:` line to the verdict block with the published provenance tokens, and state in `LABELS.md` that neither new verdict applies a label (validator: `bun test scripts/triage-rescope.test.mjs` exits 0 for the criteria-provenance assertion)
  (Implements: S5)
  - Relevant files: skills/triage-issue/references/ISSUE_PROCESS.md, skills/triage-issue/references/LABELS.md
- P7 — Add the typed-receipt input mode (`references/RECEIPTS.md` plus the audit-mode and review-mode wiring) and the conditional fold→repair switch (validator: `bun test scripts/triage-rescope.test.mjs` exits 0 for the receipt-mode and switch assertions)
  (Implements: S6, S7)
  - Relevant files: skills/triage-issue/references/RECEIPTS.md, skills/triage-issue/references/AUDIT_FINDINGS.md, skills/triage-issue/references/REVIEW_FINDING_PROCESS.md
- P8 — Ship the documentation currency: the `docs/workflow/SKILLS.md` row, `docs/workflow/ISSUE_WORKFLOW.md`'s verdict list, `README.md`'s verdict sentences, the changeset intent and the roadmap row (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S3, S4, S5, S6, S7)
  - Relevant files: docs/workflow/SKILLS.md, docs/workflow/ISSUE_WORKFLOW.md, README.md, .changeset/
- P9 — Verify: the new suite, the schema package suite, the context budgets, the document verifier and the full local gate, with every obligation row closed by a foreground run (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: docs/fix/441-triage-issue-rescope/SPEC.md, docs/fix/441-triage-issue-rescope/planning-obligations.md

## Planning evidence

M/L unit: the ledger lives in
[`planning-evidence.md`](planning-evidence.md) (10 rows, `PE-001`–`PE-010`).

## Obligations

M/L unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) (13 rows, `O1`–`O13`).

## Triaged steps

```text
triaged-steps@1
step | reason | basis
tests-first | every requirement has a frozen assertion in the new suite, landed red before implementation | S2–S8
implementation | schema vocabulary first, then the inventory, then the skill surface, then the references | ## Tasks P2→P7
docs-and-state | the four documentation surfaces, the changeset, the roadmap row and the projection | S8, §7
verification | the full gate plus the document verifier, obligations closed only on foreground runs | AC10
```

The machine's `unit-route --triage` cannot answer for this unit — the lane never
opened it (`unit not found`), which is exactly the substitution the apply order
performs: the step list above is this unit's authoritative steps, recorded at
freeze (D1).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-15, the request, verbatim:
  ```
  Apply to this repository: issue #307
  ```
  The direction's own issue resolved to `a-then-b`; this unit is `B`. The
  issue's `## Expected behaviour` items are quoted verbatim as `S2`–`S8`.
- **D1** — 2026-11-15, owner decision (the routing answer): `selected a-then-b`
  — settle the direction's row first (committed as `35bc7f56`), then build the
  residual router slice as this unit rather than inventing requirements for the
  direction.
- **D2** — 2026-11-15, plan decision: the two new verdicts are published as
  versioned grammar (`TRIAGE_VERDICTS`, `TRIAGE_CRITERIA_PROVENANCE`) instead of
  living in prose only. Authority: the repo's `whatever can be computed is
  computed` rule (`AGENTS.md`, `normative-surfaces@1`) — a verdict an executor
  chooses between is exactly what that inventory exists for.
- **D3** — 2026-11-15, plan decision: neither new verdict applies a disposition
  label. Authority: the issue's Non-goal *"No change to label ownership/
  injection-safety invariants"* and the existing contract where `fix-now` and
  `fix-in-unit` also carry no disposition label.
- **D4** — 2026-11-15, plan repair after the cut (recorded, no requirement
  changed): P3's scope drops the `scripts/vocabulary-parity.test.mjs` and
  `scripts/normative-drift.test.mjs` edits. Both are `**/*.test.*` protected
  paths and a post-cut modify needs the owner's recorded `approval`, which an
  agent may never write for itself; the two vocabularies are instead pinned by
  this unit's own suite, and the inventory rows are declared `must-name: no`
  because the surface that *orders* the verdicts is the skill's reference, not
  an inventoried file. Authority: the path-protection policy (the guard refused
  the edit) and [`decisions.md`](decisions.md) D-441-1.
- **D5** — 2026-11-15, budget re-base: `docs/workflow/SKILL_CONTEXT_BUDGETS.json`
  gains its first `triage-issue` entry (main 3491, reference 3255), both exact
  `ceil(measured x 1.10)` over what the seven behaviours measured at this change,
  and `AGENTS.md`'s `machineLines` pin moves 142 → 144 for the two inventory
  rows. Authority: the manifest's own declared re-basis rule ("ceiling =
  ceil(measured x 1.10) at each declared re-basis", growth source named here and
  in the commit); no ceiling this unit did not spend was re-based.
- **P1** — 2026-11-15, the RED corpus landed alone at `2c9dd42c`: twelve
  assertions, one per rule, 1 pass / 11 fail (the pass is the regression control
  proving the rest target real base text).
- **P2** — 2026-11-15, the two vocabularies published in the schema package and
  re-exported from its index.
- **P3** — 2026-11-15, both declared as normative surfaces in
  `AGENTS.md` and claimed by `docs/workflow/GATE_INVENTORY.md`'s
  `normative-surface-grammar` row.
- **P4** — 2026-11-15, `ISSUE_PROCESS.md`: the seven-verdict `triage-verdict@1`
  block, the six-condition `one-shot` checklist with consent and the tier
  disqualification, the `remove` verdict's three measured inputs, the
  `triage-verdict-block@1` verdict block with its `Criteria:` line, the stale-row
  guard in the scope-membership check and `rg`-first in the evidence step.
- **P5** — 2026-11-15, `SKILL.md`: the ceremony-profile read with both anti-gaming
  directions, the `one-shot`/`remove`/typed-receipt modes, the criteria box in the
  turn contract, the six-path allowlist and every `→ Next:` line the new verdicts
  need.
- **P6** — 2026-11-15, criteria provenance wired through the verdict block and
  `LABELS.md`'s explicit no-label obligation for both new verdicts.
- **P7** — 2026-11-15, `references/RECEIPTS.md` (the typed-receipt input mode)
  plus the audit-mode and review-mode wiring, and the conditional fold→repair
  switch with its three-gate condition.
- **P8** — 2026-11-15, documentation currency: the `SKILLS.md` rows, the
  `ISSUE_WORKFLOW.md` verdict table, the `README.md` classifier row, the
  changeset intent, the roadmap row (feature 152 → `in-progress · carried by fix
  #441`, `## Fixes` row written by `roadmap fixrow`) and the re-rendered
  projection.
- **E1** — 2026-11-15, `bun test scripts/triage-rescope.test.mjs` · exit 0 · 12 pass / 0 fail (the red commit `2c9dd42c` measured 1 pass / 11 fail, exit 1).
- **E2** — 2026-11-15, `bun run --cwd packages/agentic-workflow-schema test` · exit 0 · tsc clean, 853 pass / 0 fail across 48 files.
- **E3** — 2026-11-15, `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass / 0 fail (both surfaces fault-free); `bun test scripts/vocabulary-parity.test.mjs` · exit 0 · 22 pass / 0 fail.
- **E4** — 2026-11-15, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · 22 pass / 0 fail (the two new surface ids are claimed).
- **E5** — 2026-11-15, `bun test scripts/unit-doc-contract.test.mjs` · exit 0 · 21 pass / 0 fail; `bun test scripts/spec-by-reference.test.mjs` · exit 0 · 17 pass / 0 fail; `bun test scripts/skill-lint.test.mjs` · exit 0 · 20 pass / 0 fail.
- **E6** — 2026-11-15, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 30 skills` (triage-issue 3173 est / 216 lines against the re-based 3491); `--documents` · exit 0 · `PASS context documents: 4 budgeted documents`.
- **E7** — 2026-11-15, `bun scripts/lint-changeset.mjs` · exit 0 · `ok triage-issue-rescope.md`; `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`.
- **E8** — 2026-11-15, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/441-triage-issue-rescope/SPEC.md` · exit 0 · `verdict PASS`, P1–P9 all `PASS (6/6)`.

## Next

Owner verdict on the branch diff; then `Closes #441` on the PR.

## References

- Issue [#441](https://github.com/gtrabanco/agentic-workflow/issues/441) — this
  unit's SPEC-by-reference source
- Issue [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) — the
  direction (design notes 5, 6, 7, 11, 12, 13); settled 2026-11-15 to roadmap
  row 83 `done · folded → 441`
- Issue [#436](https://github.com/gtrabanco/agentic-workflow/issues/436) — the
  `ceremony-profile@1` grammar and its anti-gaming guard (closed; the profile
  this unit reads)
- Issue [#437](https://github.com/gtrabanco/agentic-workflow/issues/437) — the
  findings corpus, the n code-net metric and the typed receipts
- Issue [#438](https://github.com/gtrabanco/agentic-workflow/issues/438) — the
  `residual-classify` states the `remove` verdict consumes
- Issue [#435](https://github.com/gtrabanco/agentic-workflow/issues/435) — the
  project charter's verification-criteria catalogue and its provenance rule
- `docs/ROADMAP.md` row 152 — this unit's index row
- `docs/fix/260-subagent-first-execution/SPEC.md` — the four non-negotiables the
  anti-gaming clause protects

## Branch

`feat/441-triage-issue-rescope`

## Depends on

Empty — every declared input (#436, #437, #438) is closed at the branch base.

## Regression scope

| Scenario | Verified by |
|---|---|
| A forge-issue triage still returns the five original verdicts with their labels and routes (`fix-now`/`fix-in-unit`/`promote`/`postpone`/`wontfix`) | `bun test scripts/review-loop-discipline.test.mjs` exits 0 and `bun test scripts/triage-rescope.test.mjs` exits 0 (the five verdicts stay named in the block) |
| The batch flow still groups `fix-in-unit` issues by home unit and maps every id to its own command | `bun test scripts/triage-rescope.test.mjs` exits 0 (the summary-table and per-verdict `→ Next:` grammar assertions) |
| A `fix-now` finding is still routed to `/fold-findings` and never implemented in the triage turn | `bun test scripts/triage-rescope.test.mjs` exits 0 (the live route assertion in the review-mode reference) |
| No new label is created or applied by the two new verdicts | `bun test scripts/triage-rescope.test.mjs` exits 0 (the `LABELS.md` obligation assertion) |
| The skill still fits its declared context budget | `bun scripts/check-skill-context.mjs` exits 0 |
