# Elicitation layer — the pre-spec before triage

**Layer 0 of the input path.** A vague request becomes a structured pre-spec
before the lane triages anything: a checklist does the structuring, and only the
questions whose answers change behaviour are asked — one at a time. The layer
produces an artifact; it is **not a gate**, and it is **not a second ask
mechanism racing the design step's**.

```
request ──▶ pre-spec@1 ──▶ triage ──▶ design (DESIGN.md's ask stage) ──▶ …
             │              │
             │              └─ one-shot eligibility reads `questions:`
             └─ the design step seeds the unit doc's `## Specs` from it
```

| This layer owns | It never owns |
|---|---|
| pre-triage intent: what the request is, which shape it has, whether it is answerable | design-tier questions — the batched ask is `DESIGN.md`'s, unchanged |
| the checklist bank and the artifact's grammar | the ask grammar — that is `open-questions@1`, read through its crate owner |
| the qualification, the calibration and the family rule | any verdict, tier or approval: nothing here blocks a transition |

## The order, fixed

1. **Fill the checklist from what is already known** — the request's own words,
   the tree, the docs, prior units. Checklist-first beats a free interview on
   quality *and* tokens (`docs/research/2026-11-12-input-quality-and-editing/`).
2. **Take the cheap default** where the bank declares one and nothing answers it:
   a dated assumption, correctable by the owner.
3. **Ask** only what survives both, one question per turn, through the published
   ask grammar.
4. **Route** — the pre-spec is handed to triage; the design step reads it.

A layer that asks before step 1 has inverted the mechanism: every question the
tree could have answered costs a turn and buys nothing.

## The checklist bank

Per-domain means **per request family**, never per stack: `feature`, `fix`,
`refactor`, `docs`, `dependency`, `performance`, plus `any` for a row every
family pays.

```text
elicitation-checklist@1
cell | shape | what it orders
id | <FAMILY-nn> | the stable row id a pre-spec row cites (`FEA`, `FIX`, `REF`, `DOC`, `DEP`, `PER`, `ANY`)
shape | feature | fix | refactor | docs | dependency | performance | any | the request family the row belongs to; `any` applies to every family
field | <slug> | the field name a pre-spec row carries, and the only name a pre-spec may use for it
asks | <one interrogative sentence> | the question the checklist puts to the request, never a topic label
applies-when | <condition> | when the row applies at all — no condition means no row
toggles | <answer> → <behaviour>; <answer> → <behaviour> | the two plausible answers and the workflow behaviour each one changes: the row's qualification
default | <answer> | <`none — <why>`> | the cheap value recorded as a dated assumption when nothing answers the row; `none — <why>` means the row must be asked
source | <author, work, year> or <repository rule> | what the row is adapted from — an attribution, never a copied passage
```

| id | shape | field | asks | applies-when | toggles | default | source |
|---|---|---|---|---|---|---|---|
| FEA-01 | feature | user-scenario | Which actor sees the change, and how is it observed working? | always | one actor → the criteria are written for that actor; several → each criterion names its actor | none — an unobserved outcome is not a deliverable | Cockburn, *Writing Effective Use Cases* (2001) — primary actor and goal |
| FEA-02 | feature | non-goals | What is explicitly out of scope? | always | bounded → the deferral is recorded in the unit doc's `## Future`; unbounded → scope creep is undetectable at review | none — an unbounded scope cannot be frozen | Cockburn (2001) — the use case's scope boundary |
| FEA-03 | feature | observation | Which command or capture shows it working? | always | a command → the criterion carries a validator; prose only → the criterion fails closed with `manual:` | none — a criterion with no observation cannot pass | Humble & Farley, *Continuous Delivery* (2010) — evidence as a pipeline artifact |
| FIX-01 | fix | reproducer | What fails, and which command reproduces it? | always | a failing command → the fix starts from a red test; no reproducer → the work is an investigation, not a fix | none — a fix with no reproducer cannot be verified | Feathers, *Working Effectively with Legacy Code* (2004) — the failing test as the starting point |
| FIX-02 | fix | expected-behaviour | What must be true after the fix, and what must not change? | always | the regression surface named → a differential check is pinned; unnamed → a silent regression is unverifiable | none — the difference between a fix and a rewrite is unstated | Fowler, *Refactoring* (2nd ed., 2018) — behaviour held constant is the contract |
| FIX-03 | fix | blast-radius | Which siblings share the failing code path? | always | enumerated → the touched set derives from them; unknown → the impact sweep runs before the first edit | `unknown — the impact sweep runs` | repository rule — the derived test set (`skills/execute-phase/references/TEST_IMPACT.md`) |
| REF-01 | refactor | held-constant | Which observable behaviour is held constant, and by which test? | always | named → characterize before restructuring; unnamed → the refactor is unverifiable | none — a refactor with no held behaviour is a rewrite | Feathers (2004) — characterization tests |
| REF-02 | refactor | boundary | Which module boundary moves, if any? | always | moved → its enforcement is updated in the same change; none → no boundary claim is made | `no boundary moves` | Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules* (1972); Evans, *Domain-Driven Design* (2003) |
| DOC-01 | docs | reader | Who reads this, and what do they do with it? | always | a named reader → the document's home is that reader's path; unnamed → prose with no consumer | none — a document addressed to nobody is not a deliverable | repository rule — `skills/unit-lane/references/DESIGN.md` §document-or-don't-coin |
| DOC-02 | docs | superseded | Which existing prose does this supersede? | always | named → deleted in the same change; unnamed → two sources of truth | `none — no existing prose states this` | repository rule — documentation currency (`skills/unit-lane/references/DOCS.md`) |
| DEP-01 | dependency | version-target | Which exact version is the target, and where is it read? | always | the pinned version → the upgrade is reproducible; a range → an unrecorded drift window | none — a floating target is not a decision | Wiggins, *The Twelve-Factor App* (2011) — declare and isolate dependencies explicitly |
| DEP-02 | dependency | removal-cost | What breaks when this dependency is the wrong choice? | always | reversible by reverting the lockfile → land it; expensive → a decision row before the change | none — a one-way dependency choice is the design step's question | the design step's cost table (`skills/unit-lane/references/DESIGN.md` §Stage 2 orient) |
| PER-01 | performance | measurement | What is the current number, and which command produced it? | always | a measured number → the result is checkable; no number → "faster" is unverifiable | none — an unmeasured performance change cannot be believed | Beyer, Jones, Petoff & Murphy, *Site Reliability Engineering* (2016) — measure before optimizing |
| PER-02 | performance | budget | What is the target, and what may not regress? | always | a budget → the gate pins it; none → a regression is invisible | none — an unpinned target is an opinion | Humble & Farley (2010) — the pipeline as verification |
| ANY-01 | any | lane-collision | Does another unit already occupy these files? | always | a collision → the batch scheduler orders the lanes; none → the lane is free to start | `unchecked — batch-scheduler names the lane's surface` | repository rule — `skills/batch-scheduler/references/PLAN.md` |
| ANY-02 | any | reversibility | Is this undone by reverting its own diff? | always | reversible → the cheapest route is legal; not reversible → the `one-shot` route is disqualified | none — an irreversible change is never one-shot | repository rule — the `one-shot` eligibility (`skills/triage-issue/references/ISSUE_PROCESS.md`) |

Adding a row is a bank change: it needs two behaviour-changing answers, a
default (or a stated `none — <why>`), an ask condition and a source, because the
check refuses a row without them.

## The qualification rule is owned elsewhere

The rule — *two plausible answers, or no question* — is
`skills/init-workspace/references/ENGINEERING_INTERVIEW.md` §The qualification
rule. This layer **applies** it and never restates it: `toggles` is the same
cell, the same `answer → behaviour` shape, checked the same way. The mechanical
half matters because a rule only prose enforces is a rule a compaction can
erase (`docs/workflow/GATE_INVENTORY.md` §Why this exists).

## Fill, then assume-or-ask

For every **applicable** row (its `shape` is the declared one, or `any`), the
pre-spec carries exactly one row:

| The row's state | `provenance` | `receipt` |
|---|---|---|
| the request says it | `request` | — (the request itself is the evidence) |
| the tree or the docs say it | `repository` | the `path:line`, or the grep that found it |
| the owner answered it | `answer` | the `Q<n>` it answers |
| nothing answers it and the bank declares a default | `assumption` | `assumed <YYYY-MM-DD> — <the bank row's default>` |
| nothing answers it and the bank declares `none — <why>` | `unknown` | the `Q<n>` the row became |

`assumption` is never an invented value: it is the bank's declared default or
nothing. A row that declares `none` cannot be assumed away — it is exactly the
expensive-to-decide item the cost table in `skills/unit-lane/references/DESIGN.md`
§Stage 2 says to ask.

## Uncertainty calibration

- **One focused question per turn.** The block carries at most one
  `open-question` row; the next question waits until the first has its
  `decision` row. Two failure modes are measured — implement-too-fast and
  ask-about-everything — and one-at-a-time against a filled checklist is the
  policy that avoids both (`docs/research/2026-11-12-input-quality-and-editing/`).
- **`questions: none` needs its why.** Simple work earning no question is a
  legitimate, recorded answer (`none — the request names the actor, the
  observation and the non-goals`); an unexplained `none` is the ask-everything
  failure's mirror image, a silent assumption.
- **Fail closed to the published grammar.** An open question is a row of the
  `open-questions@1` block published by
  `skills/orchestration-envelope/references/TURN_CONTRACT.md`, with its search
  receipt and its researched options; the block's column set is imported from the
  crate's reader (`packages/agentic-workflow/src/runner/sensors/needs-input.mjs`),
  so the layer cannot drift from the mechanism that consumes it.
- **Boundary.** Design-tier questions — scope, architecture, data model,
  deployment, security — stay `DESIGN.md`'s batched ask. This layer asks only
  what the pre-spec cannot be written without.

## Cross-family elicitation

The elicitor must not share the implementer's model family: same-model
elicitation measured **negative** strict pass@1 while a cross-model pipeline
gained 6.3 points (`docs/research/2026-11-12-input-quality-and-editing/`).

The pre-spec declares both families, and the check refuses a pair that is equal
**and silent**. An operator with one family cannot conjure a second, so the
degradation is declared and reported instead of being hidden:

- `elicitor:` / `implementer:` — the family tokens, as the run observed them;
- `same-family: <why one family had to run both>` — required when the two are
  equal and a question is open, and reported (never silently accepted) when
  present.

## Contextual approval

An answer the human gives binds against the **immediately preceding proposal**:
when the human unambiguously accepts a concrete action they already understand
("yes", "go ahead", "eso mismo"), that action proceeds within its agreed scope
without a re-ask. **Confirming a preference alone authorizes nothing**, and
genuinely unclear change intent still costs exactly one focused question — never
a re-clarification of what is already established.

The boundary holds in full: contextual approval **never waives** a
provider-owned consent, an exact-token authorization, a destructive-action
permission, or any gate, authority check or stop condition this repository
declares. It shortens the ask; it forgives nothing.

## The artifact: `pre-spec@1`

Home: `docs/pre-spec/<YYYY-MM-DD>-<slug>.md`, one file per request — the id
convention `docs/passive/` already uses, because a pre-unit request has no unit
folder yet. The file is written by the agent running the lane (a record, like
`decisions.md`), and it is the only artifact this layer produces.

```text
pre-spec@1
field | shape | what it holds
id | <YYYY-MM-DD>-<slug> | the filename stem, and the id triage's verdict cites
request | "<the requester's words, verbatim>" | never a paraphrase — what the pre-spec protects is the request itself
shape | feature | fix | refactor | docs | dependency | performance | the checklist family the request belongs to
elicitor | <model-family> | the family that ran the checklist and asked
implementer | <model-family> | the family that will implement
same-family | <why one family had to run both> | only when the two families are equal
questions | `none — <why>` or <Q-ids> | whether the request earned a question, and the why that earns the `none`
```

Then the checklist table, one row per applicable bank row:

```text
pre-spec-row@1
cell | shape | what it orders
field | <field> | a bank `field` value; a field the bank does not declare is refused
value | <the answer> or `unknown` | what the request, the tree or the owner answered
provenance | request | repository | answer | assumption | unknown | where the value came from, per §Fill, then assume-or-ask
receipt | <path:line> | `<grep>` | <Q-id> | `assumed <YYYY-MM-DD> — <value>` | — | the evidence that provenance demands; empty only for `request`
```

When a row is `unknown`, the file also carries the `open-questions@1` block with
that row's question — the same block, in the same file, so an answer closes the
row in place.

## Who reads it

| Reader | What it takes |
|---|---|
| `skills/triage-issue/references/ISSUE_PROCESS.md` | the `one-shot` verdict's second eligibility condition: `questions: none` is the evidence that no design decision is pending |
| `skills/unit-lane/references/DESIGN.md` | the `## Specs` seed: every answered row becomes a claim with its receipt, and the request's verbatim words become `S<n>` |
| the human owner | the recorded questions, each with its receipt and its options — the layer never answers on their behalf |

A pre-spec is not an approval: it records what is known, what was assumed and
what was asked. Nothing in it grants a route, and a `one-shot` still needs the
owner's explicit consent.

## Rules

- **Never ask what the request, the tree or the guide already answers** — the
  provenance search runs first, and its receipt is the row's `receipt`.
- **Never assume a value the bank did not declare** — `assumption` carries the
  bank's default, dated.
- **Never ask two questions in one turn**, and never a question the design step
  owns.
- **Never paraphrase the request** — verbatim, between the declared quotes.
- **Never let the elicitor be the implementer's family silently.**
- **Never treat the pre-spec as a gate**: it is read as evidence, argued with,
  and its verdict is triage's.
- **Never write the artifact by hand-editing a projection** — this file has no
  projection; it is one record per request.

## The check

`agentic-workflow elicitation check --bank <path> --spec <path>` is the layer's
deterministic half: it validates the bank's cells against the table that carries
them, then the pre-spec against the bank. It reads, writes nothing, and exits 0
with `ELICITATION CHECK PASS` or 1 with a finding per refusal.

The refusal codes are the implementation's (`packages/agentic-workflow/src/elicitation/prespec.mjs`),
which is their one home: the rules above are the contract, the codes are how it
is reported. A `2` exit is a usage or readability refusal — a missing file, a
malformed argument — never a finding.

A pre-spec is validated against the bank it names, so a project that extends the
bank is checked against its own rows: the layer ships one bank and refuses a
pre-spec written against a row that bank does not declare.
