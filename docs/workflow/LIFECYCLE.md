# The lifecycle: `/draft`, `/flow` and the lane behind them

One page for the question a newcomer actually asks: **which command do I run,
what does it do next, and when does it stop?** The three entries are one program
with one state: `/flow` drives a unit step by step from machine state to done,
`/draft` drives the same program and always stops after the plan, and
`/unit-lane` remains the portable conductor the program hands its steps to.

The program's deterministic half is the runner's `flow` subcommand
(`runner flow <unit>`): it senses, decides and hands over — it never
runs a step itself. The two pi commands are thin doors over it, so a host that
carries only the crate still has the driver, and the two can never disagree about
what comes next.

## The three entries

| Entry | Runs | Stops when |
|---|---|---|
| `/draft <unit>` | the lane's planning pass — triage, pre-spec, design, plan | **always** after the plan, with the approval block. `--yes` plays no role: continuing is `/flow` |
| `/flow <unit>` | the same program, from wherever the unit is | per the post-plan rule below; a planned unit implements directly and is never re-planned unless `--retriage` is typed |
| `/unit-lane <unit>` | the portable conductor, step by step | at its own gates and at every `needs-input` halt |

Two rules make the trio predictable:

- **Continuing a draft is `/flow`.** A draft's approval block names `/flow <unit>`
  as its `continue:` field and nothing else, so there is no resume flag to
  remember and no second spelling of "go on".
- **`/flow` never invents an answer.** An unknown is a `needs-input` halt routed
  to the stage that owns the question (the skill's own open-questions block), and
  a driver refusal prints no hand-off at all.

## The decision

Every `/flow` turn is the same three moves, and every move reads a machine
source — zero model tokens are spent deciding *what* to do:

1. **Sense.** `unit-route --triage` answers the closed catalog's step list (the
   nine steps, their tiers, what is skipped and why); `unit-route` answers the
   route the unit takes now; the unit doc answers `## Tasks` (planned?),
   `## Risk tier` (the recorded tier) and `## Log` (what already ran). Each of
   those has one reader, and the driver imports it rather than parsing again.
2. **Decide.** The first pending step, the post-plan stop and the session mode.
   A unit with no phase plan is handed the lane; a planned unit is handed the
   router's own per-phase command.
3. **Hand off.** One command, one bounded read set, one receipt. The read set is
   the handed step's reference plus the unit's state pointers — never the
   transcript, never the whole unit doc "just in case".

The loop closes through the step's own hand-off: the invoked skill must settle
before the next sense can observe its effect, so the driver never chains two
steps inside one invocation. A step that ends without a hand-off has not
finished.

```text
flow-step-references@1
step | reference | handed-by
research | skills/unit-lane/references/RESEARCH.md | lane
design | skills/unit-lane/references/DESIGN.md | lane
plan | skills/unit-lane/references/PLAN.md | lane
implement | skills/unit-lane/references/IMPLEMENT.md | router
tests | skills/unit-lane/references/TESTS.md | router
evidence | skills/unit-lane/references/EVIDENCE.md | router
review | skills/unit-lane/references/REVIEW.md | router
docs | skills/unit-lane/references/DOCS.md | router
release | skills/unit-lane/references/RELEASE.md | router
```

`handed-by: lane` means the planning steps run as one conductor invocation;
`handed-by: router` means the router's own `next:` line is the command, because
the driver never re-decides a route.

## The post-plan stop

A stop is a **post-plan rule**, never a hard-coded flag. v1 ships two rules as
plain data, and the decision is one injectable function
(`decideStop(verdict, rules)`), so the decision substrate that owns stop policy
later supplies its own rule set without touching this grammar.

```text
flow-stop-rules@1
id | when | stop | overridable
explicit | the operator passed `--stop-after plan` | after the plan | no
tier-high | the unit recorded tier `high` | after the plan | yes, by a typed `--yes`
```

`tier-high` is the v1 default: a `high`-tier unit stops after its plan and a
`standard` one does not. `explicit` is what `/draft` is, which is why a draft
always stops; the v1 explicit stop point is the plan alone, so any other
`--stop-after` value is refused by name (the driver observes the planned bit,
never "step X completed").

**`--yes` is an owner decision, not a setting.** It cancels the overridable rule
only, so it can never cancel an explicit stop, and every run that carries it
appends one human-owner row to the unit's `decisions.md` — who typed it, what it
overrode, and the date. The audit trail is the safety that pays for the override.

## The approval block

When a stop fires the driver prints this block and halts. It is a declared,
machine-readable surface: the fields are fixed, and `continue:` is the only
command that proceeds.

```text
flow-approval@1
name | required | meaning
unit | yes | the unit the block stops
plan | yes | the plan's phase count and its phase ids
tiers | yes | the catalog's tiers for the steps the plan unlocks
unlocks | yes | the catalog steps the plan unlocks, in catalog order
tier | yes | the recorded risk tier, or `unset`
session | yes | the composed session mode (see below)
continue | yes | the one command that proceeds — `/flow <unit>`
```

A run that re-invokes the draft entry re-prints the same block and proceeds
never; a run that invokes `/flow` reads the state again and continues from there.

## Session composition

The mode is composed from the recorded verdict, never chosen at the keyboard:
a live Relay packet wins, then the recorded tier, then the size.

```text
flow-session-modes@1
mode | when
relay | a pi-web Relay packet is live for the unit (its state is `active` or `draft`)
phase-per-turn | the unit recorded tier `high`, or no other row applies
orchestrate | the unit's recorded size is `large` or `xlarge`
single-session | the unit's recorded size is `trivial`, `xs` or `small`
```

`--record` writes the composed mode into the unit's `decisions.md` as one row
before execution starts, so the mode is part of the unit's record rather than a
detail of one session's memory. It lands there and not in `SPEC.md` because the
ledger-ownership map forbids any script from writing the unit doc: the decision
ledger is the one place a process may record its own decision, and the row names
its authority (`flow driver`) so it never reads as an owner's verdict.

## The two lifecycles

**A feature unit.** Design and plan first, then execute phase by phase, then
review, then the merge gate:

1. `/draft <unit>` — the lane's triage, pre-spec, design and plan, ending at the
   approval block.
2. `/flow <unit>` — from the approval block onwards: implementation, tests and
   evidence per phase, then its own docs and release steps.
3. The review ladder below, until `MERGE-READY`.
4. `/audit-pr` — the merge gate. Merging stays a human action.

**An issue unit** (the fix lane: `docs/fix/<issue>-<topic>/`) runs the same
program with the same steps; the catalog decides which steps apply, so a
docs-only unit never plans, tests or reviews and a trivial fix never designs. The
only difference is the invocation spelling the lane uses for a fix
(`/unit-lane --fix <issue>`), which the driver prints itself.

## The review ladder

Review is a ladder, not a command. Each rung is a receipt the next rung reads:

1. **`/review-change`** — the applicable axes only, every finding classified,
   fix-now rows persisted in the unit doc's `## Findings`.
2. **`/fold-findings`** — the persisted rows repaired in atomic batches, the gate
   green, each row flipped folded and recorded as an `F` log line.
3. **Re-review** — re-run `/review-change` on the repaired head. The correction
   budget bounds how many times this repeats; a new finding after the budget goes
   to the owner instead of earning another cycle.
4. **`/audit-pr`** — the merge gate: it consumes the current `REVIEW-PASS` receipt
   instead of re-running the axes, and answers `MERGE-READY` or the evidenced
   blockers. A stale receipt is a blocker, not a formality.

`unit-route` reports the rung the unit is on (`fold`, `execute`, `close-out`), and
the driver hands that answer over unchanged — the ladder is the router's own
state machine, never a second one.

## The command decision tree

```text
Do you know the unit you are working on?
├─ no  → /workflow-status            (what can be built next)
└─ yes → does the unit have a plan (## Tasks with P<n> bullets)?
   ├─ no  → /draft <unit>            (plan it, then stop for approval)
   └─ yes → do you want the plan re-done?
      ├─ yes → /flow <unit> --retriage
      └─ no  → do you want to stop after the plan anyway?
         ├─ yes → /flow <unit> --stop-after plan
         └─ no  → /flow <unit>        (drives the unit; --yes cancels a tier stop)
Where a unit is in its ladder is never a judgement call:
   /flow <unit> says the route, the step and the one command.
```

## Where the pieces live

- The driver: `packages/agentic-workflow/src/runner/flow.mjs`, dispatched as
  `runner flow` (`packages/agentic-workflow/src/runner/cli.mjs`).
- The router it consumes: `packages/agentic-workflow/src/runner/unit-route.mjs`
  (its `--triage` and its route are the driver's only inputs).
- The closed catalog: `packages/agentic-workflow/src/runner/catalog.json`.
- The two commands: `packages/pi-agentic-workflow/src/extension/flow-command.ts`.
- The lane itself: [`skills/unit-lane/SKILL.md`](../../skills/unit-lane/SKILL.md).
