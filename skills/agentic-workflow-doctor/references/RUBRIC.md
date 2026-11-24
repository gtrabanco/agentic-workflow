# The doctor's triage rubric

The rubric is **data**: one row per marker kind the mine receipt can carry, with
the verdict and the reason a class of that kind takes. Classify by lookup — copy
the row, cite the evidence, write the sentence. Never weigh, never average, never
invent a verdict or a reason: the bundle refuses a token outside these sets by
name, and a guessed class is worse than a refused one.

Two vocabularies are closed (`S6`), and a class carries exactly one of each:

- **verdict** — `report` (a maintainer can act on it) or `discard` (counted, not
  filed). A `report` class cites one to five `W<n>` ids and states its defect
  shape; a `discard` class cites none and states why.
- **reason** — the `discard` column is `operator-error`, `env-specific`,
  `covered-upstream`, `one-off-human`; the `report` column is
  `reproducible-defect`, `contract-vs-behavior`, `cross-project-recurrence`.

```text
doctor-triage-rubric@1
kind | verdict | reason | what the row means, and the one documented exception
gate-red | report | reproducible-defect | a gate line recorded a non-zero exit; the exception is a line whose own text records the red-first receipt (it says red before green, observed red or red-first) — cite those under a class named gate-red-expected and discard it as one-off-human
evidence-red | report | reproducible-defect | an evidence line recorded a non-zero exit; the exception is a line that records the harness refusing its own invocation once — cite it under evidence-red-expected and discard it as one-off-human
review-fail | report | contract-vs-behavior | a review line carries a failing verdict: the contract and the behaviour disagreed
fold-over-budget | report | cross-project-recurrence | one unit folded more findings than the correction budget; a class that recurs is the strongest upstream signal this record carries
review-cycles-over-budget | report | cross-project-recurrence | one unit spent more review cycles than the budget, which is the rework the correction budget exists to stop
correction | report | contract-vs-behavior | the journal carries a correcting line: something the record asserted turned out wrong
refuted-finding | discard | covered-upstream | a finding the record itself refuted (false positive, self-refuted, discarded): the reproducer already covers it
rework | discard | one-off-human | several sessions on one unit is the workflow working, not a defect; the blocker a session records is mined under its own kind
```

A kind absent from the mine receipt is absent from the triage file — an empty
class is noise, and `unclassified` already reports the rows no class claims.

A class you split (the `-expected` rows above) is a legal class name: it is a
slug, it cites its rows, and the reason is the one the table gives it. Splitting
is a lookup too — the row's own text either carries the declared expectation or it
does not.

## What the defect sentence may say

The `defect` field is the only free text in the bundle, and it is the one thing a
maintainer reads first. Write it as one sentence about the **shape** of the
failure, in the project's own terms:

- good: `the root suite exits non-zero on the same assertion in two units`
- good: `a review verdict flips between the contract and the shipped behaviour`
- forbidden: a path, a file name, a branch name, a log line, an issue title, a
  user name, an e-mail, a token — the command refuses a secret-shaped value
  outright and redacts a path or an address, but a sentence that needs redacting
  is already the wrong sentence.

## What the evidence cell is

`unit:<slug> lg:<token>` — the unit's own slug (the family the issue mentions) and
the `## Log` token the row came from. `jn:correction` names a journal line,
`agg:fold×3` an aggregate. That is deliberately all: a maintainer re-checks the
class from the project's public description, never from its content.

## How to file

1. Show the rendered bundle and the routing receipt verbatim.
2. Ask **one** question: which issue(s), or hand the draft over.
3. Only on an explicit yes: `runner workflow-doctor publish --issue <n> --bundle
   <file> --repo gtrabanco/agentic-workflow --yes` (or `--new-title` for a new
   issue). The consent refusal without `--yes` is the gate, not an obstacle.
4. A declined filing ends the run: `no filing`, and the draft is the user's.
