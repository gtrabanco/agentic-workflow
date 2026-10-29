# NN — <unit-slug>

> One-line: what this unit doc is. Copy to docs/features/NN-<slug>/.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order the
request states them. **A later correction is appended under its own id**
(`S1a`, `S2a`, …) and never rewrites the id it corrects — that is what makes the
change diffable: a correction moves one line, everything else stays put.

**S1 — <short title in your own words>.**
> <the request's words, verbatim and unedited>

**S2 — <short title>.**
> <the request's words, verbatim and unedited>

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words. A
correction is its own line with its own id (`S1a`) — never a rewrite of the line
it corrects.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

What the change touches beyond its own files: what consumes this unit's
deliverables, what this unit consumes from others, what stops being true when
the change lands (comments, docs, declared validators, narrations naming the
old shape), and what must be asked before touching something live on the other
side. Cut at plan time — the executor sweeps this surface, it is not
rediscovered at review.

## Retirements

What this fix makes obsolete: every surface, token, pane, helper, contract or
narrative this unit **retires**, each with its replacement or its no-consumer
evidence (`grep -rc '<the removed name>' <scope>` → 0). A fix that only adds is
the exceptional case: an empty answer states *why nothing can be removed*, so
the omission is a reason rather than a gap. Cut at plan time — a retirement is a
planned task with its negative-capability pin, never a review-time discovery.

## Non-goals

What this unit is NOT. Findings discovered during implementation never expand scope.

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a
date and a status: `open`, `planned`, or `discarded <YYYY-MM-DD>`. This unit
never implements, specs, or tasks a row here. Write `none` when nothing was
deferred. Reviewed at unit close, on session resume, and whenever later work
returns to the same area — each open row is then offered as
plan-now / keep-deferred / discard.

## Future cost

Standing obligations this unit imposes on future work. Each row: the rule + who it binds.

## Applicable tests

The tests this unit will run (triage-decided). Write exactly
`n/a — no tests step for this unit` when there is none.

## Known pre-existing issues

Each: `<issue/observation>` + explicit `affects` or `does-not-affect` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification
when the unit has behavior. Each task carries its validator — a backticked
command plus its expected outcome (for example
``(validator: `node --test scripts/x.test.mjs` exits 0)``) — an
`(Implements: S1, S2)` line naming the requirements it delivers, and may carry a
nested `Relevant files: <path, path…>` line naming that task's read set:
**metadata, never a task**. `phase-lint` accepts these bullets and full
`## P<n> —` blocks alike (owner: `skills/phase-contract/SKILL.md`), and a file
absent from the list is never out of scope for the executor.

- P1 — <task> (validator: `<command>` exits 0)
  (Implements: S1, S2)
  Relevant files: <path>

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line, and `phase-lint` refuses a bullet
with no link, a link to an undeclared id, and a base requirement no bullet
implements.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned
by `skills/pre-execution-review/references/LEDGERS.md`). Embedded here for XS/S
units; for M/L the ledger lives in the unit folder's `planning-evidence.md` and
this section names it instead — never both.

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and
required failure state (`obligation-id | authority-source | affected-use-case-or-invariant | phase | task |
implementation-owner | validator | required-evidence | status` — shape owned by
`skills/pre-execution-review/references/LEDGERS.md`). Embedded here for XS/S
units; for M/L the ledger lives in the unit folder's `planning-obligations.md`
and this section names it — never both. Before the unit ships, every row is
`verified` (or an evidenced `n/a`).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line. Rows are appended
by `review-change` and `triage-issue` — the writers the `review-findings` truth
class of the ownership map (`skills/pre-execution-review/references/LEDGERS.md`)
declares; this section is that ledger's collapsed carrier, never a second ledger,
and no other writer touches it.

The carrier grammar (`findings-table@1`): the OPEN rows only, appended by
`review-change` and `triage-issue`. A folded row leaves the table and becomes a
`## Log` line, so this table never grows a history column.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | high \| med \| low | the ledger severity (the canonical scale)
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from the closed set in `log-kind@1` below — a request or correction
(a verbatim quote), an evidence run, a gate run, a folded finding, an owner
decision, a phase's progress, a review run, a finding's verification. The
review mark and the finding signatures that used to be rows in
`review-findings.md` are `R` and `V` lines here (#308 §Scope 3), so a migrated
unit's whole receipt history is one section. A correction never edits an earlier line: it
appends. Evidence and gate lines carry the command and its exit code, so a
reviewer re-runs a line instead of trusting a table.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — <YYYY-MM-DD>, the request, verbatim:
  ```
  <the request as it was made>
  ```
- **E1** — <YYYY-MM-DD>, `<command>` · exit 0 · <output, ≤2 lines>.
- **P1** — <YYYY-MM-DD HH:MM>, <what was done> · <commit sha>.

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes absorbed issues via `Closes #N`. `none` if empty.
