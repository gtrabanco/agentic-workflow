---
type: feature
scope: xs
---

# 99 — csv-export-command

> The golden fixture's toy unit, cut in the spec-by-reference shape: this file
> is the conversion corpus's second member, derived from
> `scripts/fixtures/golden-fixture/toy-spec.md` and converted by the same rule
> as `258-harden-needs-input-contracts/SPEC.md`.

## Specs

Requirement ids are `S#`; phases are `P#`. One id per requirement below, each
quoting the toy user's own words from `toy-spec.md` — the toy project's
request record — or the converter's marked restatement where the toy corpus
only carries a bullet.

**S1 — a CSV export command exists.**
> Add a `export-csv` command to the toy CLI that writes the current in-memory record list to a CSV file at a given path.

**S2 — the file's shape.**
> Running `export-csv out.csv` creates `out.csv` with a header row and one data row per record.

**S3 — the empty case.**
> Running it with no records writes a header-only file (exit 0).

## Impact

- **Consumes:** the toy CLI's in-memory record list and the project's existing
  file-write helper (`toy-spec.md` §Engineering).
- **Consumed by:** the golden fixture's deterministic half
  (`scripts/golden-fixture.test.mjs`), which asserts this unit's tool runs.
- **Stops being true:** "records are view-only" — the toy CLI now writes files.
- **Ask before touching:** the project's file-write helper, shared with other
  commands.

## Non-goals

- Filtering, sorting, or partial export — always exports the full record set.

## Future

none

## Future cost

- The command grows with the record model: a new record field changes the CSV
  header, so the writer stays the only place that shape is decided.

## Applicable tests

`node --test scripts/golden-fixture.test.mjs` — the fixture's deterministic
half.

## Known pre-existing issues

none recorded.

## Tasks

- P1 — Implement `export-csv`: the command handler writes a header row plus one
  row per record, and an empty record set writes a header-only file.
  (Implements: S1, S2, S3)
  (validator: `node --test scripts/golden-fixture.test.mjs` exits 0)
  Relevant files: scripts/golden-fixture.test.mjs
- P2 — Hardening and PR: re-run the project's gate, flip the roadmap row, push
  and open the PR with its URL printed.
  (Implements: S1)
  (validator: `git status --porcelain -- docs/` is empty)
  Relevant files: docs/features/ROADMAP.md

### Planning evidence

One row per Engineering claim. Embedded here: this is an XS unit.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | file-read | the toy CLI keeps its records in memory only, so the export reads one list | `scripts/fixtures/golden-fixture/toy-spec.md` §Context | verified 2026-06-30 | O1 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | `S1`/`S2`/`S3` | the exported file always carries the header row, with or without records | P1 | P1 | execute-phase | `node --test scripts/golden-fixture.test.mjs` exits 0 | Evidence row for S2 and S3 | verified |

## Findings

OPEN rows only; a folded row becomes a `## Log` line. This unit has none.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; `E<n>` is an evidence run, `G<n>` a
gate run, `F<n>` a folded finding, `D<n>` an owner decision, `P<n>` phase
progress.

- **L1** — 2026-06-30, the request, verbatim:
  ```
  Add a `export-csv` command to the toy CLI that writes the current in-memory
  record list to a CSV file at a given path.
  ```
- **L2** — 2026-06-30, the shape, verbatim (`S2`, `S3`):
  Running `export-csv out.csv` creates `out.csv` with a header row and one data
  row per record. Running it with no records writes a header-only file (exit
  0).
- **L3** — 2026-06-30, the boundary, verbatim (`## Non-goals`):
  Filtering, sorting, or partial export — always exports the full record set.
- **E1** — 2026-06-30, `node --test scripts/golden-fixture.test.mjs` · exit 0 ·
  the toy plan lints `verdict PASS` and the non-atomic variant `verdict
  BLOCKED`.
- **G1** — 2026-06-30, `node --test scripts/*.test.mjs` · exit 0.
- **P1** — 2026-06-30, `export-csv` implemented; header row plus one row per
  record, header-only on an empty set · `fixture`.
- **P2** — 2026-06-30, roadmap row flipped to `done`, PR opened · `fixture`.

## Next

The unit is complete; the toy repository's own merge gate is next.

→ Next: `/audit-pr` — merge gate after REVIEW-PASS
  · findings (REVIEW-FAIL) → /fold-findings repairs them; a fresh /review-change follows the fold

## References

- `scripts/fixtures/golden-fixture/toy-spec.md` — the pre-conversion source of
  this corpus member

## Branch

`feat/99-csv-export-command`

## Depends on

none

## Regression scope

The toy CLI's existing view commands — `node --test
scripts/golden-fixture.test.mjs` stays green.
