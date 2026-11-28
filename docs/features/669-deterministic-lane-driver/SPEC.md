---
type: feature
scope: medium
roadmap_summary: Issue [#669](https://github.com/gtrabanco/agentic-workflow/issues/669) (M): two pi entry points into one deterministic program — `/flow` completes a unit to done (triage → pre-spec → design → plan → phases → review → docs → release → PR), `/draft` stops after design+plan with an approval block. Step order comes from the closed catalog (`unit-route --triage`), the model only executes the step it is handed, session composition derives from the recorded tier/size verdict, `--yes` is the owner-typed post-plan override recorded as a `decisions.md` row, and the approval block is a declared grammar registered in `normative-surfaces@1`.
---

# 669 — deterministic-lane-driver

> One-line: two pi entries, one deterministic program — `/flow` drives a unit step
> by step from machine state to done, `/draft` drives the same program and always
> stops after the plan with a machine-readable approval block.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
pr-body.md | trimmable
external-verify.md | trimmable
```

## Issue

`#669` — tracked issue in the project's forge, labelled `feature` + `promoted`.
The PR closes it via `Closes #669`.

The issue is a **scope decision from three owner rounds (2026-11-20)**: the split
is approved, but the mechanism must be programmatic and deterministic — the loop
decides *what is next* from the closed catalog and the model only executes the
step it is handed. A preset or config that injects a skill prompt was explicitly
rejected. The define command's name closed as `/draft`; `/flow` was already
decided.

## Specs

**S1 — Two entry points, one program, guardrails intact.**
> - **`/flow`** *(owner-decided working name)* — the full command: reconciles state and runs the whole ceremony to done (triage → pre-spec → design → plan → phases → review → docs → release → PR) with the existing guardrails intact: ask-don't-infer, the design interview when an answer is unknown, `needs-input` halts — it never invents what it does not know.
> - **`/draft`** *(name decided 2026-11-20)* — the same program but **stops after design+plan** with an approval block. Stopping is its purpose; it always stops, `--yes` plays no role there. Continuing after its stop = invoking `/flow`, which is why a resume-`--yes` is redundant.

**S2 — Deterministic ordering from the closed catalog.**
> The split is approved; the mechanism must be **programmatic and deterministic** — the loop decides *what is next* from the closed catalog (`src/runner/catalog.json` via `unit-route --triage`), the model only *executes* the step it is handed (bounded prompt: the step's reference + the unit's state pointers). A preset/config that injects a skill prompt was explicitly rejected.

**S3 — State reconciliation; a planned unit implements directly.**
> **`/flow` reconciles state**: the sense step reads the unit doc, roadmap and index (zero model tokens); an interrupted unit resumes where its progress log says; **an already-planned unit implements directly** — the closed catalog does not re-run done steps, and re-planning a planned unit is `--retriage`'s explicit job, never an implicit side effect.

**S4 — Stop rules live in the decision layer, not in a hard-coded flag.**
> **Post-plan stop rules belong to the decision layer, not to a hard-coded flag.** v1 ships fixed defaults (tier `high` stops after plan; `standard` does not). Once **#444** (decision-substrate) lands, the owner sets the rules via SystemOne — e.g. *no plan review for fixes*, *no review for docs-only changes*, or any rule they establish. The define command is the manual "always review" entry; `/flow` is "rules decide, `--yes` overrides".

**S5 — `--yes` is the owner-typed override, recorded as a D row.**
> **`--yes` on `/flow`** = owner-typed override: *under no circumstance stop after the plan is done* — including the `high`-tier default. This **supersedes** the earlier ruling ("tier high always stops, even with `--yes`"): the stop stays the default rule, and a human typing `--yes` consciously overrides it. Every `--yes` is recorded in the unit's `decisions.md` as a human-owner D row (who, what was overridden, when) — the audit trail is the safety.

**S6 — Session composition derived from the recorded verdict.**
> **Session composition is decided by the program from the unit's recorded verdict** (tier/size): one session for one-shot units; phase-per-turn, orchestrate subagents, or Relay legs where the existing verdicts route to them — never a human choice at the keyboard.

**S7 — The two names, and what continuing means.**
> **`/flow`** — the full command: reconciles state, completes the unit, rules (then SystemOne) decide post-plan stops, `--yes` overrides.
> **`/draft`** — the design+plan command: always stops after plan with the approval block; continuing = invoking `/flow`.
> The pair reads as a lifecycle: draft it, review it, flow it.

**S8 — `--stop-after plan` and its approval block.**
> The stop-after-plan capability as a driver flag (`--stop-after plan`) backing the define entry: prints the approval block (plan summary, what unlocks, the tier-derived cost estimate as the `Tiers:` line) and halts; re-invocation without continuing to `/flow` re-prints the block and proceeds **never**.

**S9 — The approval block is a declared surface.**
> Envelope/grammar work: the approval block becomes a declared, machine-readable surface (registered in `normative-surfaces@1`), reusing `needs-input`'s reader patterns where applicable.

**S10 — Command surface, routing, and the lifecycle page.**
> The pi package's command surface: the two entries as first-class commands (naming/config finalized in design), per-command model routing rides the existing routing files (define-class command → strong model; execution phases → their catalog tiers).
> Docs: `docs/workflow/SKILLS.md` flow narrative, README "The skills"/pi package README, budgets re-pins. **Additionally, this unit owns the lifecycle narration** — one end-to-end page composing the feature and issue lifecycles as driven by `/flow`, `/draft` and `/unit-lane`, the review ladder until a `MERGE-READY` receipt after a repair pass (review-change → fold-findings → re-review under the correction budget → audit-pr), and the command decision tree so a newcomer knows which command serves what.

**S11 — Bounds: no fork, no substrate, no split.**
> - No `unit-lane` skill split, no rename, no catalog fork — the portable skill stays one conductor; the program consumes it at the steps it already defines.
> - No SystemOne rules implementation in this unit — only the seam they will own (#444 owns the substrate and its rule surface).
> - No pi-durable adoption (that is #284's decision; this unit's design cites its flip conditions).

## Acceptance criteria

1. **S1/S7/S8 — the define entry always halts.** `/draft <unit>` runs the lane's
   triage → design → plan decision and stops with the approval block on every
   path, including a unit that is already planned and including `--yes`; the
   block's `next:` names `/flow <unit>` and nothing else. Check:
   `bun test packages/agentic-workflow/test/flow.test.mjs` (draft cases) and
   `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs`.
2. **S2 — the step list is the closed catalog's.** A `flow` run's `steps:`/`next:`
   lines are derived from `runTriage` (the same function `unit-route --triage`
   prints) and from `unit-route`'s route decision; no second catalog reader
   exists. Check: `bun test packages/agentic-workflow/test/flow.test.mjs` (the
   parity case) — the block names the same steps byte-for-byte.
3. **S3 — a planned unit implements directly, and `--retriage` is the only way
   back to planning.** A unit whose `## Tasks` carries a `P<n> —` bullet answers
   `next-step: implement` with `/execute-phase …` and never a planning command;
   `--retriage` answers the planning command and names the flag in its receipt.
   Check: `bun test packages/agentic-workflow/test/flow.test.mjs`.
4. **S4/S5 — the stop rule is a seam and `--yes` is recorded.** The stop decision
   is produced by an injectable rule set (v1 defaults: `high` stops, `standard`
   does not); `--yes` cancels the tier rule only; a `--yes` run appends one
   human-owner row to the unit's `decisions.md` naming the override. Check:
   `bun test packages/agentic-workflow/test/flow.test.mjs` (seam + D-row cases).
5. **S6 — session composition is derived, declared and recorded.** The block
   carries `session:` from the declared table over the recorded tier/size (or the
   Relay packet's state), and `--record` writes that composition into the unit's
   own `decisions.md` before execution (the ledger-ownership map forbids any
   script from writing `SPEC.md`, so the unit's decision ledger is where a
   process records its own decision — D11). Check: `bun test
   packages/agentic-workflow/test/flow.test.mjs` (composition + record cases).
6. **S9 — the approval block and the driver's tables are declared surfaces.** The
   four blocks live in `docs/workflow/LIFECYCLE.md` and each has a row in
   `AGENTS.md`'s `normative-surfaces@1`. Check:
   `bun test scripts/normative-drift.test.mjs` exits 0.
7. **S10 — both entries are first-class pi commands and the lifecycle page
   exists.** `createExtension` registers `flow` and `draft`; the page narrates the
   three entries, the review ladder to `MERGE-READY` and the command decision
   tree; `docs/workflow/README.md`, `LANE_FLOW.md` and `SKILLS.md` link it. Check:
   `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs` exits 0 and
   `bun test scripts/audit-docs.test.mjs` (or the doc-map link check) exits 0.
8. **S1/S2 — no invented answer.** The driver never decides an unknown: an
   unreadable unit, an unknown step name, an absent unit doc, an unknown
   `--stop-after` value and an unsupported stop point (a `--stop-after` naming
   any catalog step but `plan`, the one v1 stop) each refuse by name, exit
   non-zero and print no `next:` line. Check: `bun test
   packages/agentic-workflow/test/flow.test.mjs` (refusals).

## Impact

- The crate's CLI surface gains one subcommand (`flow`), so the usage line, the
  `Commands` table, `help.mjs`, `runner.dispatch.test.mjs`'s exact key list and
  `cli.surface.test.mjs`'s token parity all move in the same change.
- `unit-route.mjs`'s route computation becomes an exported function
  (`computeRoute`) so the driver reuses it instead of keeping a second router;
  `runTriage` becomes exported for the same reason. Neither print path changes.
- The pi package's `knownCommands` set and factory wiring gain the two entries;
  `advance`'s conductor is untouched (the driver is not the conductor: `advance`
  is the unattended loop, `flow` is the attended step hand-off).
- `AGENTS.md` gains four `normative-surfaces@1` rows and one documentation-map
  row; `docs/generated/**` is regenerated by its emitter, never hand-written.
- Neither skill tree changes: `/flow` and `/draft` are pi commands over the
  existing skills, so no context budget is re-pinned.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `docs/workflow`

## Retirements

Strictly additive: no surface is retired. The inventory the change adds is the
one new module, its suite, the two pi command registrations and the lifecycle
page; each has its consumer in the same change (the subcommand's dispatch entry,
the factory's registration and the doc map's link). `runner residual-classify
--inventory --base main` is re-run at verification and its receipt is recorded as
evidence.

## Non-goals

- No SystemOne rule implementation (#708 owns the consumer; this unit ships the
  seam and its v1 defaults).
- No pi-durable adoption (#284).
- No change to the conductor (`advance`) or to the review pack's composition.
- No new config key: the driver reads flags and machine state only (see `D2`).
- No `unit-lane` rename or split, and no catalog fork.

## Risk tier

- **Tier** — `standard` · **Task Size** — `Contained`
- **Named high-risk item** — `none — not a high-tier unit`

The tier is recorded as `standard` for the ceremony this unit runs (the change is
additive code plus one new documented grammar). It is also load-bearing for the
driver: a `high` unit is the case that stops after its plan, and the suite's
fixture carries `high` explicitly so the rule is exercised by the tree, not by
this document's own tier.

## Future

- open — 2026-11-27: `/draft --yes` as a deliberate "draft and keep going" spelling (rejected here: continuing is `/flow`; revisit only if operators ask for one command).

## Future cost

- Signing the approval block's `next:` line binds every later driver entry to the
  `/flow <unit>` spelling for continuation; a renamed command moves that field
  and the `flow-approval@1` block in `docs/workflow/LIFECYCLE.md` together.
- `flow-step-commands@1` binds one command per catalog step; adding a catalog
  step without a row is a driver refusal (`unknown-step`), so the catalog's
  owner and the driver's owner must move together (cross-unit, recorded below).

## Applicable tests

`packages/agentic-workflow/test/flow.test.mjs` (the driver), and
`packages/pi-agentic-workflow/test/flow-command.test.mjs` (the two entries).
Both are declared below with their obligation tags. `scripts/normative-drift.test.mjs`
and `packages/agentic-workflow/test/cli.surface.test.mjs` are the pre-existing
suites the change re-runs unchanged.

## Known pre-existing issues

- `loadCatalog`'s closed-step check is a literal list in `unit-route.mjs`
  (`catalog: must have exactly 9 steps…`) — does-not-affect this unit: the
  driver reads the catalog through that same loader, so it inherits the check
  rather than duplicating it.
- `unit-route.mjs`'s `main()` exits the process on a refusal — affects this unit:
  the driver's own refusals (unknown flag, unknown unit, ambiguous token, absent
  or unreadable doc, unknown step, unsupported stop point) take `flow.mjs`'s own
  exit path (`FLOW REFUSAL — `), while a doc the triage reader rejects and a
  malformed ceremony profile surface through `runTriage`'s own `TRIAGE ERROR —`
  exit — exit 2, stderr, no `next:` line either, re-branded by the pi door as
  `/flow: …`. Recorded as PE-004.

## Tasks

- P1 — Freeze this unit's ledgers: this document, `planning-evidence.md`,
  `planning-obligations.md` and `decisions.md`, before the first line of code
  (validator: `bun scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11)
  - Relevant files: docs/features/669-deterministic-lane-driver/SPEC.md, docs/features/669-deterministic-lane-driver/planning-evidence.md, docs/features/669-deterministic-lane-driver/planning-obligations.md, docs/features/669-deterministic-lane-driver/decisions.md
- P2 — RED: the driver's suite lands and fails on the missing `flow` subcommand
  (validator: `bun test packages/agentic-workflow/test/flow.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S8, S9)
  - Relevant files: packages/agentic-workflow/test/flow.test.mjs
- P3 — GREEN: `flow.mjs` implements the sense → decide → hand-off loop and the
  crate's dispatch/help/usage/README surfaces name it
  (validator: `bun test packages/agentic-workflow/test/flow.test.mjs` exits 0 and
  `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0 and
  `bun test scripts/ledger-ownership.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9)
  - Relevant files: packages/agentic-workflow/src/runner/flow.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/src/runner/unit-route.mjs, packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- P4 — RED then GREEN: the pi package registers `/flow` and `/draft` and hands
  the step to the router
  (validator: `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs`
  exits 0)
  (Implements: S1, S7, S10)
  - Relevant files: packages/pi-agentic-workflow/test/flow-command.test.mjs, packages/pi-agentic-workflow/src/extension/flow-command.ts, packages/pi-agentic-workflow/src/extension/factory.ts
- P5 — The lifecycle page and the declared grammars, with the cross-links
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S9, S10)
  - Relevant files: docs/workflow/LIFECYCLE.md, docs/workflow/README.md, docs/workflow/LANE_FLOW.md, docs/workflow/SKILLS.md, AGENTS.md, packages/pi-agentic-workflow/README.md
- P6 — Verification: the declared suites green, the projection regenerated by its
  emitter, the unit doc verified
  (validator: `bun scripts/docs-generate.mjs --check` exits 0 and
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/669-deterministic-lane-driver/SPEC.md`
  exits 0)
  (Implements: S1, S9, S10)
- P7 — The external-verify correction batch, code half (2026-11-28): B1 closes
  `--stop-after` to `plan` with a named refusal for every other catalog step,
  moving the whole symbol's texts (USAGE, `USAGE_LINE`, the rule table's `when`
  cell, `help`, the crate README row, the RUNNER.md row, `flow-stop-rules@1`);
  A2 arms the two doors' no-unit guard through an `operatorTokens` seam so a
  bare `/draft` or a draft carrying only its own flags warns before the runner
  runs (validator: `bun test packages/agentic-workflow/test/flow.test.mjs`
  exits 0 with the unsupported-stop refusal case and `bun test
  packages/pi-agentic-workflow/test/flow-command.test.mjs` exits 0 with the
  no-unit guard cases)
  (Implements: S1, S7, S8)
  - Relevant files: packages/agentic-workflow/src/runner/flow.mjs, packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/README.md, skills/runner-contract/references/RUNNER.md, docs/workflow/LIFECYCLE.md, packages/pi-agentic-workflow/src/extension/flow-command.ts, packages/agentic-workflow/test/flow.test.mjs, packages/pi-agentic-workflow/test/flow-command.test.mjs
- P8 — The external-verify correction batch, prose and evidence half (2026-11-28):
  B2's changeset write target, PE-004's observed refusal branding, O11's
  declared field name, the `residual-classify` receipt, and the dated rows
  re-dated to the day each line landed (validator: `bun scripts/version-parity-gate.mjs
  --content` exits 0, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  verify docs/features/669-deterministic-lane-driver/SPEC.md` exits 0, and the
  O19-O22 `rg` receipts in `planning-obligations.md` answer their exits)
  (Implements: S2, S5, S9, S10)
  - Relevant files: .changeset/669-deterministic-lane-driver.md, docs/features/669-deterministic-lane-driver/SPEC.md, docs/features/669-deterministic-lane-driver/decisions.md, docs/features/669-deterministic-lane-driver/planning-obligations.md

## Triaged steps

```text
TRIAGE — 669-deterministic-lane-driver (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-27, the issue, verbatim:
  ```
  ## Goal

  Give the lane **two pi entry points into one deterministic program** — not a second skill, not a prompt preset:

  - **`/flow`** *(owner-decided working name)* — the full command: reconciles state and runs the whole ceremony to done (triage → pre-spec → design → plan → phases → review → docs → release → PR) with the existing guardrails intact: ask-don't-infer, the design interview when an answer is unknown, `needs-input` halts — it never invents what it does not know.
  - **`/draft`** *(name decided 2026-11-20)* — the same program but **stops after design+plan** with an approval block. Stopping is its purpose; it always stops, `--yes` plays no role there. Continuing after its stop = invoking `/flow`, which is why a resume-`--yes` is redundant.

  Owner decisions recorded 2026-11-20 (issue #663 thread, three rounds):

  1. The split is approved; the mechanism must be **programmatic and deterministic** — the loop decides *what is next* from the closed catalog (`src/runner/catalog.json` via `unit-route --triage`), the model only *executes* the step it is handed (bounded prompt: the step's reference + the unit's state pointers). A preset/config that injects a skill prompt was explicitly rejected.
  2. **`/flow` reconciles state**: the sense step reads the unit doc, roadmap and index (zero model tokens); an interrupted unit resumes where its progress log says; **an already-planned unit implements directly** — the closed catalog does not re-run done steps, and re-planning a planned unit is `--retriage`'s explicit job, never an implicit side effect.
  3. **Post-plan stop rules belong to the decision layer, not to a hard-coded flag.** v1 ships fixed defaults (tier `high` stops after plan; `standard` does not). Once **#444** (decision-substrate) lands, the owner sets the rules via SystemOne — e.g. *no plan review for fixes*, *no review for docs-only changes*, or any rule they establish. The define command is the manual "always review" entry; `/flow` is "rules decide, `--yes` overrides".
  4. **`--yes` on `/flow`** = owner-typed override: *under no circumstance stop after the plan is done* — including the `high`-tier default. This **supersedes** the earlier ruling ("tier high always stops, even with `--yes`"): the stop stays the default rule, and a human typing `--yes` consciously overrides it. Every `--yes` is recorded in the unit's `decisions.md` as a human-owner D row (who, what was overridden, when) — the audit trail is the safety.
  5. **Session composition is decided by the program from the unit's recorded verdict** (tier/size): one session for one-shot units; phase-per-turn, orchestrate subagents, or Relay legs where the existing verdicts route to them — never a human choice at the keyboard.
  6. Command names: `/flow` decided for the full command; the define command's name is open (see revision log).

  The `sensor → decide → invoke` shape is the one #284's spike validated; this issue is the non-durable, in-session adoption surface. pi-durable adoption itself stays #284's flip-condition decision, not this unit's.
  ```
- **L2** — 2026-11-27, the operator's order for this session, verbatim:
  ```
  Apply to this repository: issue #669
  ```
  applied through the local, unpublished workflow for changing
  agentic-workflow itself: the §5 ledgers are frozen before code, the work is
  applied inline (no `review-change`, no `audit-pr`, no fold cycle, no
  self-granted gate exception), and the operator is the external verifier.
- **D1** — 2026-11-27, applied inline; the operator is the external verifier (see `decisions.md` D1).
- **P1** — 2026-11-27, the planning ledgers are frozen before the first line of code (this document, `planning-evidence.md`, `planning-obligations.md`, `decisions.md`) · 363db1f6f.
- **P2** — 2026-11-27, the driver's suite lands alone and is observed failing on the missing `flow` subcommand · 62a82bb2b.
- **E1** — 2026-11-27, `bun test packages/agentic-workflow/test/flow.test.mjs` · exit 1 · `0 pass / 14 fail` (observed red: `flow` is not in the dispatch table).
- **P3** — 2026-11-27, `flow.mjs` implements the sense → decide → hand-off loop and the crate's dispatch, help, usage and README surfaces name it · cdcfe653b.
- **E2** — 2026-11-27, `bun test packages/agentic-workflow/test/flow.test.mjs` · exit 0 · `14 pass / 0 fail`.
- **E3** — 2026-11-27, `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs packages/agentic-workflow/test/cli.surface.test.mjs packages/agentic-workflow/test/cli.help.test.mjs` · exit 0 · `37 pass / 0 fail`.
- **E4** — 2026-11-27, `bun test scripts/unit-route.test.mjs` · exit 0 · `64 pass / 0 fail` (the router's refactor is behaviour-preserving).
- **E5** — 2026-11-27, `bun test scripts/catalog.test.mjs` · exit 0 · `16 pass / 0 fail`.
- **E6** — 2026-11-27, `bun test scripts/normative-drift.test.mjs` · exit 0 · `24 pass / 0 fail` (the four new rows resolve).
- **P4** — 2026-11-27, `/flow` and `/draft` registered as code doors over the driver, the two command names published from `routing/types.ts` · c40fe65ca.
- **E7** — 2026-11-27, `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs` · exit 0 · `8 pass / 0 fail`.
- **E8** — 2026-11-27, `bun test --timeout=10000 test/*.test.mjs` in `packages/pi-agentic-workflow` · exit 1 · `1161 pass / 6 fail`; the same six fail on a `git archive main` copy with an identical build (the embedding-provider suites, no `NAN_API_KEY` in this environment) — pre-existing, recorded in `## Known pre-existing issues`.
- **P5** — 2026-11-27, the lifecycle page, its four declared grammars, the budgets re-pin, the cross-links, the changeset and the roadmap status · fad3e87da.
- **E9** — 2026-11-27, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 8 budgeted documents`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 33 skills`.
- **E10** — 2026-11-27, `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0 missing · 0 stale · 0 orphaned` · `verdict: PASS`.
- **E11** — 2026-11-27, `rg -l 'LIFECYCLE\.md' docs/workflow/README.md docs/workflow/LANE_FLOW.md docs/workflow/SKILLS.md AGENTS.md` · exit 0 · four files (the pages index, the lane cheat-sheet, the skills reference and the guide's deep-references index).
- **E12** — 2026-11-27, `bun test scripts/ledger-ownership.test.mjs` · exit 0 · `15 pass / 0 fail` (the driver's one sanctioned write is the unit's decision ledger; `SPEC.md` stays closed to scripts).
- **E13** — 2026-11-27, `bun test scripts/guide-split.test.mjs scripts/reading-coverage.test.mjs scripts/runner-launcher-drift.test.mjs scripts/telemetry-coverage.test.mjs scripts/workflow-docs-index.test.mjs scripts/prose-gate-inventory.test.mjs` · exit 0 · `66 pass / 0 fail`.
- **E14** — 2026-11-27, `bun scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS` (the changeset declares all three touched packages).
- **E15** — 2026-11-27, `bun test scripts/structural-sibling-pins.test.mjs scripts/test-obligation-tags.test.mjs scripts/cli-coverage.test.mjs` · exit 0 · `38 pass / 0 fail`.
- **E16** — 2026-11-27, the differential check against a `git archive main` copy: `unit-route <unit>`, `unit-route --triage <unit>`, `help unit-route` and `unit-route --help` are byte-identical on the same fixture tree, stdout, stderr and exit code; `help` differs only by the new `flow` row, which is the change itself.
- **D2** — 2026-11-27, `--record` writes the composition into the unit's `decisions.md` instead of the unit doc's `## Log`: the ledger-ownership map forbids any script from writing `SPEC.md`, and the decision ledger is the one place a process records its own decision (`decisions.md` D11). The pair list moved from one script per ledger to a set so two scripts can be sanctioned for one ledger without losing either pin.
- **E17** — 2026-11-27, `bun test scripts/telemetry-coverage.test.mjs` and `bun run --cwd packages/agentic-workflow-schema build && bun test test/telemetry.test.mjs` · exit 0 · the two new commands join `PHASE_LABELS` and the mirror suite agrees.
- **G1** — 2026-11-27, HEAD `fad3e87da`, `bun scripts/local-gate.mjs --jobs auto --no-bail` · exit 1 · every step `PASS` except `crate-suite-bun`, whose only red suites are `doc.query` and `doc.hybrid` — measured failing identically on a `git archive main` copy (the embedding provider is absent in this environment). The four steps depending on it were skipped, not failed.
- **E18** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/669-deterministic-lane-driver/SPEC.md` · exit 0 · `verify@1` receipt, obligations ledger closed.
- **P6** — 2026-11-28, verification ran in the foreground (`E9`–`E18`, `G1`), the obligations ledger closed and the PR opened as [#749](https://github.com/gtrabanco/agentic-workflow/pull/749) · 1eb65d180.
- **P7** — 2026-11-28, the external-verify correction batch, code half: ledgers frozen first (tasks P7/P8, AC8's unsupported stop point, obligations O17–O22, PE-015, decisions D12/D13), red corpus observed, then the fix · f19bb183c, 1dbee3557.
- **E19** — 2026-11-28, `bun test packages/agentic-workflow/test/flow.test.mjs` and `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs` at f19bb183c · exit 1 each · observed red on the two new corpus cases (`14 pass / 1 fail`; `8 pass / 1 fail`).
- **E20** — 2026-11-28, the same two suites at 1dbee3557 · exit 0 · `15 pass / 0 fail` and `9 pass / 0 fail`; `bunx tsc` in `packages/pi-agentic-workflow` exits 0.
- **E21** — 2026-11-28, the differential against the pre-change baseline: twelve `flow`/`unit-route`/`help` cases replayed in order on the same fixture tree — ten byte-identical, every exit code identical, and `help`/`helpflow` differ only by B1's synopsis move (`[--stop-after <step>]` → `[--stop-after plan]` and its flag paragraph), the asked-for difference; a non-plan stop answers `FLOW REFUSAL — unsupported stop point '…'` · exit 2 · empty stdout.
- **D3** — 2026-11-28, the batch's triage: B1 closes `--stop-after` to `plan` with named refusals (decisions.md D12, PE-015); A1/A3/A4/A6 are text-truth corrections with per-line re-dating (decisions.md D13); A5 stays a base-proven environmental disposition already carried by E8/G1.
- **E22** — 2026-11-28, the batch's prose receipts, every exit as required by O17/O19/O20/O21/O22: the changeset's stale-target pattern exits 1 and its `writes it into the unit's \`decisions.md\`` phrase exits 0; `rg -n 'TRIAGE ERROR' SPEC.md` exit 0; `rg -n 'line carries the same command' planning-obligations.md` exit 0; the five-surface `--stop-after <step>` sweep exits 1; the O22 void-date sweep over SPEC + decisions exits 1 (36 dated rows re-dated per line to the commit that landed them) with `2026-11-2[78]` present; `bun packages/agentic-workflow/bin/agentic-workflow.mjs residual-classify --inventory --base main` · exit 0 · 28 `used` (the new `operatorTokens` among them) and 5 `no-plan-claim` file/symbol orphans, all five surfaces present before this batch — `orphan` is an exit-0 classification, not a failure.

## Next

PR [#749](https://github.com/gtrabanco/agentic-workflow/pull/749) is open against `main`, awaiting the operator's review and merge. Merge authority stays with the operator; nothing in this unit merges.

## References

- Issue [#669](https://github.com/gtrabanco/agentic-workflow/issues/669) — the tracked feature request; the PR closes it via `Closes #669`.
- Issue [#444](https://github.com/gtrabanco/agentic-workflow/issues/444) — the decision substrate the stop-rule seam cites, not consumed here.
- Issue [#708](https://github.com/gtrabanco/agentic-workflow/issues/708) — the SystemOne stop-rules consumer, `blocked-by` this unit's seam.
- `packages/agentic-workflow/src/runner/catalog.json` — the closed catalog the driver's step order comes from.
- [`docs/workflow/LIFECYCLE.md`](../../workflow/LIFECYCLE.md) — the lifecycle page and the four declared grammars this unit ships.

## Branch

`feat/669-flow-driver`

## Depends on

None (soft order relations only: #444 and #603 are recorded as better-order, not blockers).

## Regression scope

| Scenario | Verified by |
|---|---|
| `unit-route --triage` prints the same block it always did | `bun test scripts/catalog.test.mjs` exits 0 |
| `unit-route <unit>` prints the same route block and fingerprint | `bun test scripts/unit-route.test.mjs` exits 0 |
| The crate's dispatch table refuses a foreign name and names every legal one | `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs` exits 0 |
| `agentic-workflow help <cmd>` answers for every dispatched subcommand | `bun test packages/agentic-workflow/test/cli.help.test.mjs` exits 0 |
