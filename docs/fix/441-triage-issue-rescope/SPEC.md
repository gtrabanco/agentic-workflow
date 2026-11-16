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

**S9 — Fix the gate's five concurrency defects in this unit.**
> Prefiero arreglarlo en esta misma unidad

Scope adopted with that answer (the owner's selection of option A-441 over the
enumerated plan table; the enumeration below is the adopted plan, not the
requester's prose): (a) the `DEPS` graph lets `crate-suite-bun` /
`crate-suite-node` re-emit `packages/agentic-workflow-schema/dist/` while
`root-suite` imports it — and the two package-script `tsc` runs also overlap
each other; (b) a suite killed by `--bail` is reported `FAIL` with all-green
output; (c) the spawn-heavy suites that cross the 10s per-test budget under
load are undeclared in `scripts/test-timeout-allowlist.json`; (d) `tmp-gc`
reds when a concurrent sweep removes a candidate between its `readdir` and
its `lstat`; (e) the pre-push hook runs the offline subset at the full worker
count with no regard for the load other sessions already put on the machine.

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

**Scope amendment S9 (2026-11-15, owner):** the same unit now also repairs the
gate's five concurrency defects — see `S9`, tasks P10–P14 and obligations
O14–O19. Surfaces: `scripts/local-gate.mjs` (the dist-writer chain, `--jobs
auto`, the hook body), `scripts/run-root-suite.mjs` (the bail-kill line),
`scripts/test-timeout-allowlist.json` (two measured entries),
`scripts/tmp-gc.mjs` (the `ENOENT` skip), their three sibling suites, and one
inline clause in `AGENTS.md`'s gate paragraph. The one-PR override over
"one PR per unit" is the owner's and is recorded as D9.

## Retirements

Nothing is retired: this is a strictly additive unit. The computed surface
inventory is the receipt.

```text
bun scripts/residual-classify.mjs --inventory --base 4eedcf61
```

prints one row per added surface it recognizes — the added export symbols
(`TRIAGE_VERDICTS`, `TRIAGE_CRITERIA_PROVENANCE` and their two type aliases,
each `used`) and the added non-documentation file
(`scripts/triage-rescope.test.mjs`, state `orphan`, reason `no-plan-claim`).
The five reference sections are edits, not additions, and the new
`references/RECEIPTS.md` is documentation, so neither is a row; the suite's
`created` row in this document's `path-protection-plan@1` is what claims it for
the plan — the classifier's consult order (live tree → roadmap rows →
open-unit tasks → forward promises → charter planned work) ends a claim at a
terminal row, and this unit's row already reads `done`. No existing verdict, label, route or section is removed: the
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
- **`local-gate --install-hook` refuses a worktree** (`ENOTDIR` at
  `scripts/local-gate.mjs:848`: `installHook` builds `<root>/.git/hooks`, but a
  worktree's `.git` is a file and the hooks live in the common dir). **Does
  not affect this unit's gate**: the push runs the already-installed hook, and
  the S9 hook body installs after merge from a checkout where `.git` is a
  directory. Reported, not repaired — it is pre-existing (the same line sits
  at `e864c710`) and outside S9's adopted five; smallest action: resolve the
  hooks directory with `git rev-parse --git-common-dir`, as its own unit.

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
11. **AC11 (S9)** — the five gate defects are gone and the gate still passes:
    `bun test scripts/local-gate.test.mjs` exits 0 (the dist-writer chain, the
    `--jobs auto` policy, the hook's jobs flag),
    `bun test scripts/run-root-suite.test.mjs` exits 0 (the two declared
    budgets and the `KILLED` wire format),
    `bun test scripts/tmp-gc.test.mjs` exits 0 (the concurrent-sweep skip),
    `bun scripts/check-skill-context.mjs --documents` exits 0 (the AGENTS
    clause), and `bun scripts/local-gate.mjs` exits 0.

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
- P10 — Land the S9 RED corpus across the three sibling suites: the dist-graph edges, the hook's jobs flag and `--jobs auto`, the two declared budgets, the `KILLED (bail)` wire format and the concurrent-sweep skip (validator: `bun test scripts/local-gate.test.mjs`, `bun test scripts/run-root-suite.test.mjs` and `bun test scripts/tmp-gc.test.mjs` each exit 1, naming their missing piece)
  (Implements: S9)
  - Relevant files: scripts/local-gate.test.mjs, scripts/run-root-suite.test.mjs, scripts/tmp-gc.test.mjs
- P11 — `tmp-gc`: an `ENOENT` between `readdir` and `lstat` is a candidate a peer sweep already took — skipped, never a `GC-ERROR` (validator: `bun test scripts/tmp-gc.test.mjs` exits 0)
  (Implements: S9)
  - Relevant files: scripts/tmp-gc.mjs
- P12 — `run-root-suite`: report a bail-killed suite as `KILLED … (bail)` without dumping its partial output, and declare the two measured spawn-heavy suites in the timeout allowlist (validator: `bun test scripts/run-root-suite.test.mjs` exits 0)
  (Implements: S9)
  - Relevant files: scripts/run-root-suite.mjs, scripts/test-timeout-allowlist.json
- P13 — the graph and the hook: chain every dist writer, order every dist reader after the last writer, keep `root-suite` in its slot; add `--jobs auto` (load-aware, in the gate) and pass it from the hook with the env override; document both where the gate is documented (validator: `bun test scripts/local-gate.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S9)
  - Relevant files: scripts/local-gate.mjs, AGENTS.md
- P14 — Verify the amendment: the three suites, the touched documents and the full gate, with every S9 obligation closed on a foreground run (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S9)
  - Relevant files: docs/fix/441-triage-issue-rescope/planning-obligations.md

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

- **G1** — 2026-11-15, HEAD 6e9e9e45e6aca014aeb5de4bc89fbd41f0d9a27d — `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/441-triage-issue-rescope/SPEC.md` · exit 0 · zero violations (13/13 obligations closed, every cited path present).
- **G2** — 2026-11-15, HEAD 6e9e9e45e6aca014aeb5de4bc89fbd41f0d9a27d — `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 19 step(s) in 289s` (run over that HEAD's tree, before this Log-only delta).
- **D6** — 2026-11-15, disclosure: the same gate failed twice before it passed, with three spawned-ceremony suites (`ceremony-findings-ledger`, `ceremony-unit-plan`, `ceremony-workspace`) killed mid-run under the pool — each passes standalone (exit 0), and the base commit `4eedcf61` passed the same pool at `--jobs 6`, so the class is load sensitivity, not this change. The two later runs, including the green one at G2, carried the identical step set. Recorded rather than hidden: a load-sensitive kill is not a passing suite.

- **L2** — 2026-11-15, the correction request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
  Resolved against this unit's own state before acting: the latest
  `EXTERNAL VERIFY` receipt ([`external-verify.md`](external-verify.md),
  7 blockers / 6 advisories, `NEEDS-DECISION`, 2026-11-15) selects the repair
  route — one correction batch, then one blocker-limited recheck.
- **D7** — 2026-11-15, correction triage (authority: the receipt's own
  reproducers, each re-read in context before it was touched): all 7 blockers
  deserved the fix and were repaired in one batch; of the advisories, A1/A2/A4
  were repaired with them, **A3 left** because `scripts/batch-scheduler.mjs`'s
  `BODY_TRIAGE_RE` matches `skills/batch-scheduler/references/PLAN.md`'s row
  exactly — only the code could change, and that is its own decision, **A5
  left** because S5 is a frozen verbatim quote of the issue, and **A6 left**
  because it is a closed unit's frozen SPEC. No executable behaviour changed:
  every edit is prose or a comment.
- **E9** — 2026-11-15, HEAD `76602376` — `bun test scripts/triage-rescope.test.mjs` · exit 1 · 12 pass / 8 fail: the receipt's eight reproducers observed RED against the pre-correction bytes, the twelve pre-existing assertions still green (the regression control).
- **E10** — 2026-11-15, HEAD `bcbdef33` — `bun test scripts/triage-rescope.test.mjs` · exit 0 · 20 pass / 0 fail (the same eight, after the batch).
- **E11** — 2026-11-15, HEAD `bcbdef33`, the blocker-limited recheck of every touched obligation row's validator, run in the foreground: `bun test scripts/normative-drift.test.mjs` · 21/0 (O1); `bun test scripts/triage-rescope.test.mjs` · 20/0 (O2–O12); `bun test scripts/review-loop-discipline.test.mjs` · exit 0 (O12); `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/441-triage-issue-rescope/SPEC.md` · `ok: true`, 0 violations (O13); plus the batch's own surfaces — `bun run --cwd packages/agentic-workflow-schema test` · 853/0 (B7), `bun scripts/check-skill-context.mjs` and `--documents` · `PASS context budgets: 30 skills` / `PASS context documents: 4 budgeted documents`, `bun scripts/docs-generate.mjs --check` · `verdict: PASS` (B6's row), `bun scripts/roadmap-settle.mjs` · PASS, 0 violations across 204 unit docs, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/features/83-odd-hybrid-direction/SPEC.md` · PASS, 0 violations, `bun scripts/residual-classify.mjs --inventory --base 4eedcf61` · the five rows B5 now describes (four `used` symbols, the suite `orphan`/`no-plan-claim`), and `bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/fix/441-triage-issue-rescope --phase P9 --base b8505a8f` · `PATH-GUARD pass — justified`, offenders: none (the P9 record for the suite's modify). Differential vs the receipt head `b8505a8f`: every command above exited 0 there too, and the only output delta is the asked-for one (the suite 12 → 20 tests). All O1–O13 statuses stay `verified`; none flipped back.
- **G3** — 2026-11-15, HEAD `bcbdef33` — `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 19 step(s) in 350s` (run over that HEAD's tree, before this Log-only delta).
- **D8** — 2026-11-15, owner decision (authority: the pre-push hook's own documented escape hatch, `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`, authorized by the owner when the push was blocked): push with the hook's gate skipped, the reason recorded here and owed to the PR note. Five hook runs failed — every red a load artifact of three concurrent sessions on six CPUs, never this change: `ceremony-passive` C6 timed out at 10058ms against the 10s per-test budget (10035ms on an earlier attempt), `ceremony-unit-plan` / `ceremony-findings-ledger` / `ceremony-docs` bailed the same way (bail then kills the in-flight suites, which is why fast suites show FAIL with all-pass output), and `tmp-gc` once swept stale fixtures left by killed runs and exited 1. Counter-evidence for this head: the same suites green standalone (9/0, 18/0, 19/0), `bun scripts/run-root-suite.mjs` exit 0 at `ba91951c`, G3's full-gate PASS at `bcbdef33`, and a 10-minute poll that found no quiet window (8 concurrent gate processes; load peaked 11.6 on 6 CPUs). Not a self-granted exception — §4 of the apply order reserves that to the owner, who gave it.

- **L3** — 2026-11-15, the scope-amendment request, verbatim:
  ```
  Prefiero arreglarlo en esta misma unidad
  ```
  Asked where the five gate fixes should land (a new unit or this one), the
  owner selected A-441: this unit and PR #559. The five-item scope is the plan
  table adopted with that answer (S9 says so); the one-PR override over "one PR
  per unit" is D9.
- **D9** — 2026-11-15, owner decision: the gate fixes ride this unit's PR
  instead of opening `fix/gate-concurrency-robustness`. I recommended the
  separate unit (two concerns in one PR); the owner chose this one — recorded
  here and in decisions.md (D-441-3) — and the amendment still pays full
  price: S9, AC11, P10–P14, O14–O19, PE-011–PE-015, a red-first corpus.
- **D10** — 2026-11-15, plan decision (S9a): the dist bytes get a chain, not
  a patch — every writer after the reader it would race, the writers
  serialized among themselves, every reader after the last writer, and
  `root-suite` keeps its slot so the common red never waits. Chosen over
  removing the `build &&` from the crate package scripts (they must stay
  self-contained for standalone runs) and over putting `root-suite` last
  (feedback latency on the most-run red).
- **D11** — 2026-11-15, plan decision (S9d): only the `lstat` TOCTOU becomes
  a skip, and only for `ENOENT` — the peer's success is this sweep's own goal.
  `rmSync` already runs `force:true`; every other stat failure still fails
  closed, and an unreadable root is still an error.
- **D12** — 2026-11-15, plan decision (S9e): the load policy lives in the
  gate as the pure `autoJobs(load, cpus, cap)` (testable against a fixture
  load; `os.loadavg` works where `/proc` does not), the hook passes
  `--jobs ${AGENTIC_WORKFLOW_GATE_JOBS:-auto}`, and an explicit `--jobs <n>`
  still overrides everything — chosen over a fixed `--jobs 2` (which punishes
  idle pushes) and over shell arithmetic in the hook (untestable).
- **E12** — 2026-11-15, HEAD `a64e0194` — the S9 RED corpus: `bun test scripts/local-gate.test.mjs` · exit 1 · 49 pass / 4 fail; `bun test scripts/run-root-suite.test.mjs` · exit 1 · 23 pass / 2 fail; `bun test scripts/tmp-gc.test.mjs` · exit 1 · 11 pass / 1 fail — seven reproducers, every pre-existing assertion still green.
- **E13** — 2026-11-15, HEAD `a88108ff`, foreground recheck after the three fixes: `bun test scripts/local-gate.test.mjs` · 53 pass / 0 fail; `bun test scripts/run-root-suite.test.mjs` · 25/0; `bun test scripts/tmp-gc.test.mjs` · 12/0; `bun test scripts/triage-rescope.test.mjs` · 20/0 (the first batch's corpus untouched); `bun scripts/check-skill-context.mjs` · `PASS context budgets: 30 skills` and `--documents` · `PASS context documents: 4 budgeted documents` (AGENTS.md 707 lines / 144 machine / 12,322 est); `bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/fix/441-triage-issue-rescope --phase P10 --base e864c710` · `PATH-GUARD pass — justified`, offenders: none.
- **G4** — 2026-11-15, HEAD `a88108ff` — `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 19 step(s) in 404s` (the amended graph included: the crate suites now serialize after `root-suite`).
- **E14** — 2026-11-15 — O14–O19 flipped to `verified` on the runs above (19/19 rows closed); `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/441-triage-issue-rescope/SPEC.md` · exit 0 · `ok: true`, 0 violations.

## Next

PR [#559](https://github.com/gtrabanco/agentic-workflow/pull/559) is open against
`main` and awaits the owner's merge — the owner is this workflow's external
verifier, so the merge (not the gate) is what closes #441. The 2026-11-15
correction batch (`76602376` red corpus + `bcbdef33` repairs) closed all seven
blockers of [`external-verify.md`](external-verify.md), and the S9 scope
amendment (`305b79af` ledgers → `a88108ff` fixes, G4 green) rides the same PR
— the delta re-verdict now covers both.

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
| No dist writer overlaps a dist reader, and the two package-script `tsc` runs never overlap each other | `bun test scripts/local-gate.test.mjs` exits 0 (the S9 chain assertions, acyclicity included) |
| A suite killed by `--bail` never reads as a failing suite in the tally | `bun test scripts/run-root-suite.test.mjs` exits 0 (the end-to-end `KILLED` line) |

## Superseded record:

- **`local-gate --install-hook` refuses a worktree** — repaired. Issue
  [#580](https://github.com/gtrabanco/agentic-workflow/issues/580) (PR
  [#581](https://github.com/gtrabanco/agentic-workflow/pull/581)) resolves the
  hooks directory by asking git (`git rev-parse --git-path hooks`) instead of
  composing `<root>/.git/hooks`, so the installer writes the shared hook from a
  worktree, and a directory that is not a checkout is still a usage error
  (exit 2). The record above stays as written — it states what this unit knew
  at its own time, and the `--git-common-dir` action it named belongs to the
  same git query the repair uses.
