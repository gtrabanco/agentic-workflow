---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(flow): the deterministic lane driver — `/flow` completes a unit, `/draft` stops after the plan (issue #669)

Two pi entry points into one deterministic program, and the program is the crate's
new `flow` subcommand. It senses machine state only — the closed catalog through
`unit-route --triage`, the router's own route, and the unit doc's `## Tasks`,
`## Risk tier` and `## Log` through their one readers — decides the first pending
step, the post-plan stop rule and the session mode, and hands over one command
with a bounded read set (the step's reference plus the unit's state pointers) and
a turn-contract receipt. It never runs a step itself, and the loop closes through
the step's own hand-off.

`/flow <unit>` drives the unit from wherever it is: a planned unit implements
directly, and re-planning is `--retriage`'s explicit job, never an implicit side
effect. `/draft <unit>` is the same program with `--stop-after plan` always in
force and `--yes` dropped; it always stops with the approval block, whose
`continue:` line is `/flow <unit>` and nothing else.

The post-plan stop is a decision-layer seam, not a hard-coded flag: v1 ships two
rules as plain data (a `high`-tier unit stops after its plan; an explicit
`--stop-after` always stops) and `decideStop(verdict, rules)` takes an injectable
rule set, so the decision substrate that owns stop policy later supplies its own
without a grammar break. `--yes` cancels the tier rule only — never an explicit
stop — and every run that carries it appends one human-owner row to the unit's
`decisions.md`.

Session composition is derived from the recorded verdict (a live Relay packet,
then the recorded tier, then the size), and `--record` writes it into the unit
doc's `## Log` before execution starts. The four tables — the step references,
the stop rules, the approval block and the session modes — are declared in
`docs/workflow/LIFECYCLE.md` and registered in `AGENTS.md`'s
`normative-surfaces@1`, so the driver's text and its code are one surface.

`unit-route.mjs` exports the two answers the driver consumes (`runTriage`,
`computeRoute`, `projectRoot`) instead of the driver keeping a second router; its
printed blocks are unchanged.
