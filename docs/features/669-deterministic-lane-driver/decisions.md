# 669 — deterministic-lane-driver · decisions

Each row is a decision this unit's plan rests on (`decision-scope@1`: every row
here is `unit-only`; the driver's grammars are product surfaces and live in
`docs/workflow/LIFECYCLE.md`, their one owner, where a later unit reads them).

| id | decision | scope | ground |
|---|---|---|---|
| D1 | **The unit is applied inline** against the frozen ledgers: the §5 freeze is the plan, `review-change`, `audit-pr` and the fold cycle are not run on it, and the repository's deterministic gates are the only ceremony. The operator is the external verifier. | unit-only | the operator's order, quoted verbatim as `## Log` L2; `IR3`/`IR4` still bind (no test is weakened to pass, the suite lands red first) |
| D2 | **No new config key ships.** The stop rules, the session-composition table and the step→command mapping are code constants plus flags, and the only config surface the two entries touch is the existing `pi.commands.<name>` routing entry (optional, `additionalProperties`). A key no runtime reads is not shipped, and the issue's own acceptance criterion makes the config shape an owner-interview artifact — v1 has nothing to interview because it adds nothing. | unit-only | S4, S10; PE-011, PE-012; `AGENTS.md` §"Config policy for new features" |
| D3 | **The unit's home is the feature tree** (`docs/features/669-deterministic-lane-driver/`), not the fix tree the inline workflow names as its default: the issue is labelled `feature` + `promoted`, its roadmap row is a `## Features` row, and the repo's location index says a promoted feature becomes `docs/features/<NN>-<slug>/`. | unit-only | S1; `docs/ROADMAP.md` row 669; `docs/ROADMAP.md` §intro (the two tables' rules) |
| D4 | **One program, two doors, and the program is a crate subcommand.** `agentic-workflow flow` is the deterministic sense → decide → hand-off; `/flow` and `/draft` are the pi package's two registrations over it. The step list comes from `runTriage` and the post-plan decision from the router's own `computeRoute`, both extracted from `unit-route.mjs` rather than re-implemented — a second catalog reader or a second router is the defect this avoids. | unit-only | S2, S3; PE-001, PE-002, PE-004; `IR11` |
| D5 | **One step per invocation; the loop closes through the step's hand-off.** `/flow` senses, decides and hands exactly one bounded step to the model, then returns. It never runs a hidden multi-step loop inside one command: the invoked skill must settle before the next sense can observe its effect (the conductor's own rule), and every step's closing hand-off re-enters `/flow`. This is also why `/flow` and the unattended `advance` conductor stay separate surfaces — `advance` is the headless loop, `flow` is the attended step hand-off. | unit-only | S1, S2; PE-006, PE-009 |
| D6 | **The post-plan decision is the router's, not the driver's.** Once a unit is planned, `flow` prints `computeRoute`'s route and its `next:` command; the driver adds only the stop rule, the session composition and the receipt. A driver that re-decided routes would be a second router. | unit-only | S2, S3; PE-004 |
| D7 | **`--yes` cancels the tier rule only.** An explicit `--stop-after <step>` is never cancelled, which is exactly what makes `/draft` always stop (`/draft` is `flow --stop-after plan` and ignores `--yes`). The rule set is injectable (`decideStop(verdict, rules)`) so #708's SystemOne consumer supplies rules without touching the grammar. | unit-only | S4, S5, S8; PE-003 |
| D8 | **Session composition is a declared table over the recorded verdict**, not a heuristic: `relay` when a pi-web Relay packet is live for the unit, otherwise `tier: high` → phase-per-turn, `scope: large/xlarge` → orchestrate, `scope: trivial/xs/small` → single-session, and phase-per-turn as the default. The table is `flow-session-modes@1` in `docs/workflow/LIFECYCLE.md`; the code reads it row for row. | unit-only | S6; PE-003 |
| D9 | **Four grammar blocks, one owner doc, four inventory rows.** The approval block, the stop rules, the step→command map and the session modes live in `docs/workflow/LIFECYCLE.md` and each earns a `normative-surfaces@1` row with `machine: n/a` and `must-name: no` — they order an agent's next action but publish no vocabulary the schema package owns. | unit-only | S9; PE-010 |
| D10 | **The `--yes` override is a `decisions.md` row and the composition is a `## Log` `D` line.** The issue names `decisions.md` for the override, so it lands there (`id \| decision \| scope \| ground`). The composition is a program decision, not an owner one: it lands as a `D` log line whose body names its authority (`flow driver`), which is what `log-kind@1`'s `D` row records. | unit-only | S5, S6; PE-008 |

```text
decision-scope@1
scope | meaning
unit-only | the decision binds this unit; its rationale stays in this file
cross-unit | the decision binds other units; it is promoted to exactly one permanent owner doc and this file cites it
```
