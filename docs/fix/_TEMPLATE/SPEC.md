# fix/<issue-number>-<topic>

> Fix specification — one single unit document. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. This is the same closed unit doc
> `scripts/unit-route.mjs --triage` reads for a feature, in the re-cut
> `spec-by-reference` shape; the fix template keeps four extra sections
> (`Issue`, `Branch`, `Depends on`, `Regression scope`) on top. A unit opened
> before the re-cut keeps the legacy 14-section shape — both are accepted, and a
> legacy doc is never rewritten to migrate it.

## Issue

`#<n>` — tracked issue in the project's forge. Required. The PR must close it
via `Closes #<n>` in the body (or the forge's equivalent auto-close
convention).

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order the
issue states them. **A later correction is appended under its own id**
(`S1a`, `S2a`, …) and never rewrites the id it corrects.

**S1 — <short title in your own words>.**
> <the issue's words, verbatim and unedited>

**S2 — <short title>.**
> <the issue's words, verbatim and unedited>

## Impact

What the fix touches beyond its own lines: the callers of what changes, the
consumers of what it delivers, the mentions that stop being true when it lands
(comments, docs, declared validators, narrations), and what to ask before
touching something live on the other side. Cut at plan time; the fix sweeps
this surface, it is not rediscovered at review.

## Non-goals

What this fix is NOT. Regression scope is declared below; findings discovered
during implementation never expand scope beyond the declared regression boundary.

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a
date and a status: `open`, `planned`, or `discarded <YYYY-MM-DD>`. This unit
never implements, specs, or tasks a row here. Write `none` when nothing was
deferred. Reviewed at unit close, on session resume, and whenever later work
returns to the same area — each open row is then offered as
plan-now / keep-deferred / discard.

## Future cost

Standing obligations this fix imposes on future work. Each row: the rule + who it binds.
Write `none` if it imposes none.

## Applicable tests

The tests this fix will run (triage-decided). Write exactly
`n/a — no tests step for this fix` when there is none.

## Known pre-existing issues

Each: `<issue/observation>` + explicit `affects` or `does-not-affect` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification
when the unit has behavior. Each task carries its validator — a backticked
command plus its expected outcome (for example
``(validator: `node --test scripts/x.test.mjs` exits 0)``) — an
`(Implements: S1, S2)` line naming the requirements it delivers, and may carry a
nested `Relevant files: <path, path…>` line: **metadata, never a task** (owner:
`skills/phase-contract/SKILL.md`).

- P1 — <task> (validator: `<command>` exits 0)
  (Implements: S1)
  Relevant files: <path>

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
yet. A folded row leaves this table and becomes a `## Log` line. Rows are
appended by `review-change` and `triage-issue`; no other writer touches them.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

Append-only. `L1` is the issue text verbatim; every later line carries one kind
token from the closed set in `log-kind@1` below — a request or correction
(a verbatim quote), an evidence run, a gate run, a folded finding, an owner
decision, a phase's progress. A correction never edits an earlier line: it
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
```

- **L1** — <YYYY-MM-DD>, the issue, verbatim:
  ```
  <the issue as it was written>
  ```
- **E1** — <YYYY-MM-DD>, `<command>` · exit 0 · <output, ≤2 lines>.
- **P1** — <YYYY-MM-DD HH:MM>, <what was done> · <commit sha>.

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes the tracked issue via
`Closes #<n>`. `none` if empty.

## Branch

`fix/<issue-number>-<topic>`

## Depends on

Other fixes (by folder name) that must merge first. Empty if independent.

## Regression scope

What previously-working behaviour must NOT break. Each row: the scenario
and the test/command that verifies it. Write `n/a` if the fix cannot regress
existing behaviour.
