# Engineering interview — charter layer 3

The third charter layer: **what this repository is for** and **how this team
engineers**. Layers 1–2 (identity, domain) are owned by
[`BOOTSTRAP_DISCOVERY`](BOOTSTRAP_DISCOVERY.md) §Charter; this reference is
loaded only when the bootstrap route reaches the interview round, never on
every turn (the entrypoint cites it, so the route pays for it once).

Two parts, one round:

- **Objectives** — the repo's purpose, its users, the team's shape, what the
  team optimizes for, and how much automation it wants. Every answer is
  recorded with the workflow behaviour it toggles.
- **Technical posture** — six areas of *why-grade* engineering decisions
  (testing, boundaries, dependencies, production verification, decision
  records, API posture), each asked only where a plausible answer changes what
  a later workflow step does.

An answer is worth recording only because a later step reads it. The bank's
`toggles` and `lands-in` cells are what make that claim checkable, so a
question that cannot fill both does not belong here.

## The qualification rule — two answers, or no question

Checklist-first, not a questionnaire: a question earns its place only when
**two plausible answers change a workflow behaviour downstream**. Each row
carries both halves:

- `toggles` — the two answers and the behaviour each one changes;
- `applies-when` — the condition under which the question is asked at all, so
  a simple install never earns the full bank.

The evidence base is the checklist-first measurement recorded in
`docs/research/2026-11-12-input-quality-and-editing/` (a structured checklist
beat both a raw prompt and a free clarifying round, at fewer tokens), and the
owner-directed mapping in `docs/research/2026-11-15-all-code-is-slop-mapping.md`
(the talk's point 2: a boundary kept only in a reviewer's memory is not a
boundary). The rule is mechanical: `charter check` refuses a row with one
toggled behaviour or with no ask condition.

## The team-adaptation knob

**A team convention always wins.** The bank's `default` is a recommendation
recorded *only* where the project has said nothing:

- **what the project already declares is `kept`** — the reader reports the slot
  and the landing pass never rewrites its bytes, whatever the bank recommends;
- **an unanswered slot** lands as `assumed <YYYY-MM-DD> — <default>`, a dated
  assumption a later unit surfaces and re-confirms, never a silent default;
- **a blocking identity question** (layer 1) is still never defaulted — an
  unanswered one halts the run through the open-question flow.

The bank therefore never overrides a rule: it proposes, the project decides, and
the answer's provenance (`project-declared` or `stamped assumption (dated)` in
`docs/workflow/VERIFICATION_CRITERIA.md`) says which it was.

## How the answers land

Every row's `lands-in` names a **keyed slot** in the guide's
`## Project charter` section — the same tier-0 section the ceremony profile and
the unit router already read. Slots are written by the deterministic writer,
never by hand:

```text
runner charter state --guide AGENTS.md
runner charter land  --guide AGENTS.md --answers <payload>
runner charter check --guide AGENTS.md --bank <this file>
```

- `state` is the run's first read: it reports every keyed slot of the guide's
  `## Project charter` section as `filled` or `placeholder` (a value that is
  still one `<…>` token, or a ` · `-separated list whose every entry carries
  one, is a placeholder — a documented shape is not an answer), so the round
  asks only what the project has not declared.
- `land` writes an answer into a placeholder slot, records a default as a dated
  assumption, reports a filled slot as `kept`, and refuses an unknown key or a
  payload whose defaults carry no date — before any byte moves.
- `check` is this bank's own check: it validates the table's cells, cell
  contract, landing targets and the boundary-enforcement shape.

## The bank

The cell contract is the block below; the rows are the table after it. The
check compares the table's header with the declared cells, so a column added to
one side alone is a finding rather than a silent drift.

```text
interview-bank@1
cell | shape | what it orders
id | <AREA>-<nn> | the stable row id a later unit cites (`OBJ`, `TST`, `ARC`, `DEP`, `VER`, `DEC`, `API`)
layer | objectives \| technical | which half of the round the question belongs to
question | <one interrogative sentence> | the question as it is asked, never a topic label
applies-when | <condition> | the condition that earns the question; no condition means no question
source | <author, work, year> | the bibliography entry the idea is adapted from, never a copied passage
toggles | <answer> → <behaviour>; <answer> → <behaviour> | the two plausible answers and the workflow behaviour each one changes
default | <answer> | the recommendation recorded as a dated assumption when the project is silent
lands-in | <keyed slot> | the `## Project charter` slot the answer is written to
```

| id | layer | question | applies-when | source | toggles | default | lands-in |
|---|---|---|---|---|---|---|---|
| OBJ-01 | objectives | What is this repository for, beyond its project kind — which job does it do? | always | Norman, *The Design of Everyday Things* (1988) — the artifact is judged by the job it does | unclear purpose → the design step's scope questions widen; sharp purpose → a unit that cannot state its job is refused early | one sentence naming the job | Repo purpose |
| OBJ-02 | objectives | Who uses it, and whose workflow wins when two user groups conflict? | the identity layer left users unanswered, or more than one group uses it | Cockburn, *Writing Effective Use Cases* (2001) — primary actor and goal | one group named → acceptance criteria are written for it; several groups → each criterion names its group | the identity layer's answer, else the single primary group | Users |
| OBJ-03 | objectives | How many people work in this repository, and in what shape (solo, small, large)? | always | Brooks, *The Mythical Man-Month* (1975) — coordination overhead scales with team size | solo → PR review is self-review plus the deterministic gate; several people → review-change's pass stays a separate step | small (2–5 contributors) | Team shape |
| OBJ-04 | objectives | Does the team optimize for speed, for stability, or for compliance, when they conflict? | always | Forsgren, Humble & Kim, *Accelerate* (2018) — throughput and stability are measured apart | speed → the smallest green gate ships a unit; stability or compliance → the declared gate plus the manual checklist blocks a unit | stability | Optimization target |
| OBJ-05 | objectives | How much automation does the team want before the inner loop is stable? | the team proposes trigger-driven work | Humble & Farley, *Continuous Delivery* (2010); the stabilized-inner-loop sequence in the mapping note | eager → batch scheduling adds a lane only after the lane's own gate is green; conservative → units land sequentially | automations only after the gate is stable | Automation appetite |
| TST-01 | technical | Which test layer carries the project's regression safety — end-to-end, or unit plus integration? | the project ships code | Cohn, *Succeeding with Agile* (2009) — the test pyramid | system-first → evidence rows name the project's driver command; unit-first → validators stay narrow and cheap | unit plus integration, with a system flow per user-facing path | Testing strategy |
| TST-02 | technical | Does uncovered existing code get pinned before it changes? | the tree carries code with no tests | Feathers, *Working Effectively with Legacy Code* (2004) — characterization tests | pin-first → a unit touching that code lands a characterization test before the change; no pin → refactors need an approval line | pin-first: a characterization test before touching uncovered code | Testing strategy |
| TST-03 | technical | Does the team want property or fuzz tests where the input space is large? | the tree carries a parser, a state machine or a money-shaped path | Claessen & Hughes, *QuickCheck* (2000) — properties as executable specifications | properties → validators may name a property suite; examples only → validators stay example-based | examples, with property tests for parsers and state machines | Testing strategy |
| ARC-01 | technical | Which module boundaries matter, and who owns each one? | more than one module or context exists | Evans, *Domain-Driven Design* (2003) — bounded contexts; Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules* (1972) — information hiding | boundaries named → review-design audits the diff against them; none named → no boundary claim is enforced | one row per deployable context, or the module split the tree already carries | Architectural boundaries |
| ARC-02 | technical | For each declared boundary: is it enforced by a machine (lint, dependency analysis, CI), or by prose only? | at least one boundary is declared | Parnas (1972); the reviewer-memory failure named in the mapping note | machine → the rule exists and the materialization step wires it; prose-only → the boundary is an item to materialize, never a silent assumption | prose-only, recorded as such | Architectural boundaries |
| DEP-01 | technical | How are third-party dependencies pinned, and when is vendoring cheaper than a dependency? | the project has third-party dependencies | Wiggins, *The Twelve-Factor App* (2011) — declare and isolate dependencies explicitly | exact pins → the gate refuses a floating range; ranges → the gate reports the drift window | exact pins in one lockfile, vendoring only with a provenance header | Dependency policy |
| DEP-02 | technical | What does deprecation handling look like — who removes a deprecated surface, and when? | a surface is deprecated or a dependency is retired | Fowler, *Refactoring* (2nd ed., 2018) — the smell vocabulary | remove-in-unit → the change that supersedes a surface deletes it; keep-for-consumers → a pin keeps the old line alive | remove in the same change, no compatibility shim | Dependency policy |
| VER-01 | technical | Is the deploy pipeline the verification — does a unit need a green pipeline job, or is the local gate the whole check? | the project deploys something, or runs CI jobs | Humble & Farley, *Continuous Delivery* (2010) — the pipeline as verification | pipeline-gated → a unit's evidence names the job; local-only → the declared gate is the receipt | the declared local gate, plus the pipeline job where one exists | Production verification |
| VER-02 | technical | Which service-level signals matter, and what error budget does the team accept? | the project runs a service | Beyer, Jones, Petoff & Murphy, *Site Reliability Engineering* (2016) — SLIs and error budgets | signals declared → a unit changing a service names its signal; none → no service-level claim is made | n/a for a project with no running service | Production verification |
| DEC-01 | technical | Where do architecture decisions live, and which decisions must be recorded before a unit plans work? | the project makes structural decisions | Nygard, *Documenting Architecture Decisions* (2011) — the ADR | ADRs kept → the design step cites the ADR it continues; none → decisions land as the charter's dated assumptions | one ADR per irreversible decision | Decision records |
| API-01 | technical | Is the API designed for misuse — are errors contracts at the boundary — or is exception-first the team's style? | the project exposes an API, a CLI or a module surface | Meyer, *Object-Oriented Software Construction* (1988) — design by contract | safer-API → review-code checks signatures that invite misuse; exception-first → errors surface at the boundary with their cause | safer-API: reject the misuse at the boundary | API posture |

`Users` reuses the identity layer's answer when it has one: layer 3 records it
at this slot because the later steps read the slot, and never re-asks the same
question twice.

## Boundary enforcement rows

`Architectural boundaries` carries one entry per declared boundary, in one line,
separated by ` · `:

```text
- **Architectural boundaries:** `<boundary> → machine: <mechanism>` · `<boundary> → prose-only`
```

The right half is machine-checked, because the materialization step reads it:

- `machine: <mechanism>` names the rule that fails a violation (a lint rule, a
  dependency-analysis config, a CI job) — not a stage of intent;
- `prose-only` is a legal answer and an honest one: it marks a boundary to
  materialize, never a boundary that is enforced.

A value outside those two shapes is refused by the check, which is what keeps a
declared boundary from quietly becoming reviewer memory again.

## Authoring a new question

Before a row enters the table:

1. Name the two plausible answers and the behaviour each one changes — if you
   cannot, the question does not earn a row.
2. Name the condition that asks it, so a simple install skips it.
3. Cite the idea's source (author, work, year), adapted — attribution never
   needs a copied passage.
4. Name the slot the answer lands in; a row whose slot is not in the guide fails
   the check.
5. Run `charter check` — a refused row is fixed or dropped, never shipped.
