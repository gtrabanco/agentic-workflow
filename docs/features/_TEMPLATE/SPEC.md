# NN — <unit-slug>

> One-line: what this unit doc is. Copy to docs/features/NN-<slug>/.

## Objective

What this unit delivers and why it exists now (2-4 lines).

## Why

The problem or gap this unit addresses; what already exists, what is missing.

## User outcome

From the user's perspective: what they can do or observe after this unit ships.

## Acceptance criteria

Numbered list. Each AC is induced from a concrete user scenario ("I do X and observe Y").
Make each AC command-verified where possible. If the request is too vague to state an AC,
STOP and ask the user with concrete options — never invent one.

## Non-goals

What this unit is NOT. Findings discovered during implementation never expand scope.

## Future cost

Standing obligations this unit imposes on future work. Each row: the rule + who it binds.

## Applicable tests

The tests this unit will run (triage-decided). Write exactly `n/a — no tests step for this unit`
when there is none.

## Known pre-existing issues

Each: `<issue/observation>` + explicit `affects` or `does-not-affect` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification when the unit has behavior. Each task carries its validator — a backticked command plus its expected outcome (for example
`(validator: \`node --test scripts/x.test.mjs\` exits 0)`) — and may carry a nested `Relevant files: <path, path…>` line naming that task's read set: **metadata, never a task**. `phase-lint` accepts these bullets and full `## P<n> —` blocks alike (owner: `skills/phase-contract/SKILL.md`), and a file absent from the list is never out of scope for the executor.

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

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes absorbed issues via `Closes #N`. `none` if empty.