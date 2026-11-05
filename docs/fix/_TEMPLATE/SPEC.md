---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and to the requirement count (scope).
# type: feature | fix | docs | chore
# scope: trivial | xs | small | standard | medium | large | xlarge
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
---

# fix/<issue-number>-<topic>

> Fix specification — one single unit document. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in the `## Fixes` table of `docs/ROADMAP.md`. This is the same closed unit doc
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

What the fix touches beyond its own lines: the callers of what changes, the
consumers of what it delivers, the mentions that stop being true when it lands
(comments, docs, declared validators, narrations), and what to ask before
touching something live on the other side. Cut at plan time; the fix sweeps
this surface, it is not rediscovered at review.

## Retirements

What this fix makes obsolete: every surface, token, pane, helper, contract or
narrative this unit **retires**, each with its replacement or its no-consumer
evidence (`rg -c '<the removed name>' <scope>` → 0; `grep -c` is the fallback when rg is absent). A fix that only adds is
the exceptional case: an empty answer states *why nothing can be removed*, so
the omission is a reason rather than a gap. Cut at plan time — a retirement is a
planned task with its negative-capability pin, never a review-time discovery.

## Non-goals

What this fix is NOT. Regression scope is declared below; findings discovered
during implementation never expand scope beyond the declared regression boundary.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never
chosen**: `bun scripts/ceremony.mjs tier classify` reads the change's paths and
contents and emits `passive | standard | high` (owner:
`skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).
Copy the verdict below verbatim; a tier written from memory is not a tier.

- **`passive`** — documentation, images, comments, prose with no executable
  effect. This unit doc is **not created at all**: the readback lives in
  `docs/passive/<id>.md` (block `passive-record@1`: id, tier, paths, readback,
  gate), and the project's deterministic gate is the whole verification.
- **`standard`** — the ceremony this document describes.
- **`high`** — this document **plus** the named high-risk item from the
  verdict's `signals[]`, quoted in `## Impact`, plus the full review pass.

**Task Size = Understood + Contained risk + Resumable-from-diff.** File counts
never decide.

- **Tier** — `<passive | standard | high>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `<signals[0] or "none — not a high-tier unit">`

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

## Triaged steps

> Paste the `## Triaged steps` block from `bun scripts/unit-route.mjs --triage <slug>`
> here verbatim. This block is the machine's authoritative step list; the lane
> never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

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
severity | BLOCKER \| CRITICAL \| WARNING \| SUGGESTION | the published ladder (meanings owned by `skills/review-implementation/references/CLASSIFY.md` §Severity ladder): `BLOCKER` requires a reproducer and is never a conversion target
impact | blocking \| docs-only \| report-only | whether the finding affects behaviour, only documents, or nothing that blocks: `blocking`/`docs-only` for a `BLOCKER`, and `report-only` for a pre-existing advisory, which never earns a correction round
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the issue text verbatim; every later line carries one kind
token from the closed set in `log-kind@1` below — a request or correction
(a verbatim quote), an evidence run, a gate run, a folded finding, an owner
decision, a phase's progress, a review run, a finding's verification. The review
mark and the finding signatures that used to be rows in `review-findings.md` are
`R` and `V` lines here (#308 §Scope 3), so a migrated unit's whole receipt history
is one section. A correction never edits an earlier line: it
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
