# Verification materialization — declared answers become recorded outcomes

The engineering interview records, per boundary, whether it is enforced by a
machine or **by prose only** (`ENGINEERING_INTERVIEW.md` §Boundary enforcement
rows). A `prose-only` answer is honest, and it is the exact defect the mapped
analysis names: *a boundary that lives in a reviewer's memory is not a boundary*
(`docs/research/2026-11-15-all-code-is-slop-mapping.md`, point 2). This round is
the last mile the workflow can own — it materializes **the decision**, never the
verification:

| The workflow owns | The project owns |
|---|---|
| the question, the record, the check, the consent gate | the rule's content: which lint rule, which dependency-analysis config, which CI job |
| `docs/workflow/BOUNDARY_ENFORCEMENT.md` — one row per declared boundary | the rule file itself, and the mechanism's name |

Never write a stack-specific rule the project did not ask for, never name a tool
the project does not carry, and never mark a boundary enforced because a
plausible rule could exist. The "adapt, don't ship" boundary is what makes this
round stack-agnostic: detection proposes, the team decides, `apply` records.

## When the round runs

Bootstrap only, immediately after the write step lands the charter answers
(`BOOTSTRAP_WRITE.md` step 4, `charter land`) and before the closing report. The
upgrade route never replays it: an existing install keeps whatever record it has,
and `materialize check` reports what is still unanswered.

## Read the answer before proposing anything

```text
runner materialize plan --guide AGENTS.md
```

One row per declared boundary, plus the feature map and the evidence driver, plus
a `residual:` line per unanswered item. `enforced` and `declined` need no
proposal; `recorded-issue` needs nothing; everything `pending`, `missing` or
`undeclared` is this round's work.

## Detection — propose from what the project declares, never from memory

For each `prose-only` boundary, name the mechanism the project **already**
declares, in its own words: the gate command in its guide, its lint or
dependency-analysis configuration, its CI job. Ask one focused question per
boundary, with the detected answer as the recommended option and the other two
routes offered explicitly:

1. the detected mechanism, naming the file it came from (recommended when one is
   detected);
2. *file it as an issue* — the team builds the rule itself;
3. *leave it prose-only and record why* — a recorded decision, never silence.

A project with no detected tooling gets route 2 or 3, never an invented
mechanism. An ambiguous detection is one question, not a guess
(`ask-dont-infer`: `skills/unit-lane/references/DESIGN.md`).

## The three outcomes

- **`scaffold`** — the project's rule file lands in the target repository (the
  project's own tool's shape, consented before writing), then
  `materialize apply` records it in the boundary record and flips the charter
  answer to `` `machine: <mechanism>` ``. A scaffold whose file the tree does not
  carry blocks the whole batch: nothing is recorded materialized when nothing
  materialized it.
- **`issue`** — the item is filed on the target forge with the **target's own**
  issue template and conventions, and the reference (`#<n>` or the URL) is
  recorded. A repository with no forge, or no authenticated forge CLI, is not a
  failure: say so, record the residual, and let the team file it manually with the
  title and body you wrote.
- **`declined`** — the team answered no. The reason is recorded; the row exists so
  the answer cannot quietly reappear as prose-only debt in the next session.

## The consent gate — one question per item, never a batch

Nothing is written and nothing is filed without an explicit yes for that item.
`materialize apply --guide AGENTS.md --outcomes <path|->` takes one payload:

```json
{ "consent": "yes",
  "items": [ { "boundary": "domain", "outcome": "scaffold",
               "mechanism": "<the project's own mechanism name>",
               "path": "<the rule file, repo-relative>" } ] }
```

- `"consent": "no"` writes **nothing** and prints one `residual:` per item; the
  report lists them. That is the correct outcome of a refusal, not an error.
- a payload with **no** consent (or any value but `yes`/`no`) is refused with
  exit 2 before any byte moves — a caller that forgot to ask is a defect, never a
  default yes.
- `--date <YYYY-MM-DD>` is the recorded day; without it the run uses today, so a
  replayed invocation pins it.

## The evidence driver — one charter answer, one command

Ask `VER-03` ("how are artifact captures produced?") and land the answer in the
guide's `Evidence driver` slot. A criterion naming
`artifact: screenshot|video|state-snapshot` then records `digest: sha256:<hex>`
and this command in its evidence carrier; with no driver declared the criterion
fails closed with a `manual:` label instead of passing on prose:

```text
runner materialize evidence --guide AGENTS.md --unit docs/features/<NN>-<slug>/SPEC.md
```

The convention itself is owned by `skills/verification-contract/SKILL.md`.

## The feature map

Copy `template/docs/workflow/FEATURE_MAP.md` to
`docs/workflow/FEATURE_MAP.md`, seed one row per user-facing flow from the
discovery evidence (what exists, how a user reaches it, what demonstrates it),
and register its documentation-map row. A flow nobody has evidence for is written
`none — <why>`, never a placeholder: a placeholder cell is exactly what the check
reports. Every unit that adds, changes or removes a user-facing flow updates its
own row in the same change (`skills/unit-lane/references/DOCS.md`).

## Where the check runs

```text
runner materialize check --guide AGENTS.md
```

Reads the charter's boundary slot, `docs/architecture/ARCHITECTURAL_INVARIANTS.md`
(every invariant section must state `Enforcement: machine: <mechanism>` or
`prose-only`; the shape example inside the template's fenced block is never read
as a declaration) and the feature map. Each finding is typed — one of
`boundary-declared-unenforced`, `boundary-artifact-missing`,
`feature-map-missing`, `feature-map-shape`, `evidence-driver-missing`,
`artifact-evidence-missing` — and carries a `finding-route@1` route
(`continue — init-workspace`, `fix — <path>`), never a bespoke prose route.
`audit-docs` check 17 runs this command; exit 0 passes, 1 blocks, 2 refuses.

## Refusals and residuals

Every refusal is reported, never absorbed: an unreadable guide, a malformed
boundary slot (run `charter check` first — it owns the shape), a payload without
consent, an incomplete item. The closing report lists each residual with its
reason, so the next session sees the same list instead of rediscovering it.
