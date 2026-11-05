# Decisions — 96 prose-gate-inventory

## D1 — the unit lives in `docs/features/`, not `docs/fix/`

Roadmap row 96 is a **feature** row (`docs/ROADMAP.md` §Features) and the
triage verdict is `promote-to-feature`, so the unit doc, the planning ledgers and
the roadmap registration all follow the feature path. The branch keeps the
harness-assigned name `fix/359-prose-gate-inventory`, which is a branch label,
not the unit's type.

## D2 — the inventory enumerates gates, not surfaces

A normative surface's grammar is enforced by `scripts/normative-drift.test.mjs`,
which is itself one inventoried gate. The inventory therefore carries one row per
*gate*, and its `surfaces` cell lists the `normative-surfaces@1` ids that row
enforces — so a new surface row fails the inventory until it is claimed, without
duplicating the drift gate's own coverage.

## D3 — the shipped carrier vocabulary has three values

`script` (a root suite or the local gate re-runs it), `cli` (a deterministic
check exists but its inputs are per-run, so no fixed head assertion is possible),
and `prose` (only prose states it). The issue's two-value vocabulary is refined,
not contradicted: a CLI-only check is closer to prose than to an automatic pin —
nobody runs it after a compaction either — and collapsing the two would overstate
what is enforced.

## D4 — the tier is arithmetic, and `migrate` must be empty at the head

`safety × recurrence ≥ 6` with `checkability: 3` derives `migrate`; every other
non-`script` row stays with a recorded reason. `migrate` is therefore a *planning*
state: this unit ships with zero `migrate` rows because the top tier was wired in
P4–P6, and the validator refuses any `migrate` row left behind.

## D5 — the three migrations, and why not the four producer families the issue names

The issue's parenthetical list (`promise-coherence`, `unit-route`,
`pre-execution-snapshot verify`, schema validators) is exemplary: "the existing
producer families". Each of those four already carries its gates (the claim-kind
set is closed and extending it is a SPEC change in its owning reference; the
router already derives the step list; `verify` already binds the ledgers; a new
schema vocabulary needs a version mirror). The top-tier survivors measured at the
cut live in the documentation, ceremony and ledger families, so the migrations
land there: `check-docs-language` wired over the head, the working-copy activation
mount asserted against the index, and the one-findings-carrier rule asserted over
every unit directory.

## D6 — the commit-format check stays `cli`

A whole-history assertion is impossible here (151 of 3,524 subjects are merges or
legacy shapes) and a branch-delta assertion is not stable inside a fixture suite.
The row records `checkability: 2`, which is the ceiling every stay row must
respect — no `checkability: 3` row may stay prose without failing the validator.

## D7 — no changeset, because the repo's own rule refuses an empty one

The issue's acceptance criterion says "changeset per repo rule". The rule is
`scripts/changeset-create.mjs` (D-40-16): the affected packages and skills are
derived from the change, and "a change that touches no package or skill is
refused — an empty changeset would be silent intent". This change adds a
reference document, a read-only repo script, a test and three assertions; it
touches no `packages/` source and no `skills/` file. Running the producer is
therefore the answer, and its refusal is recorded as evidence instead of a
hand-written intent for a surface that did not change.

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/prose-gate-inventory.test.mjs, scripts/doc-discipline.test.mjs, scripts/ledger-ownership.test.mjs | P1 | 2026-11-05 | execute-phase | new gate suite lands red before its validator (repo red-first rule), and the two existing suites gain one assertion each for the mandated S2 migrations — no existing assertion is edited, relaxed or deleted
```
