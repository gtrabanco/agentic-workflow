# 99 — validator-count

> Frozen-failure fixture · issue #305 · replay of unit 258 findings **F16**,
> **F38**, **F48** and **F50**: an Obligation row, a task validator and an
> Evidence row that declare a count the command does not return, while the row
> still reads `verified`.

## Tasks

- P1 — Re-cut the three guard sections so the count claims hold (validator: `grep -c "Q" scripts/fixtures/promise-coherence/changelog-sample.md` matches 4 at the final head)
  - Relevant files: scripts/fixtures/promise-coherence/changelog-sample.md

- P2 — State the outcome the shipped command actually has (validator: `grep -c "input" scripts/fixtures/promise-coherence/ledger-sample.md` matches 1)

## Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | SPEC AC1 / issue #258 | the three skills keep the guard prose the count pins | P1 | P1 | `execute-phase` body | `grep -cE "requires [a-z ]*input" skills/execute-phase/SKILL.md` matches 4 | pointer text + box | verified |
| O2 | SPEC AC2 / issue #258 | the same invariant, stated on a fixture surface | P1 | P1 | fixture | `grep -c "Q" scripts/fixtures/promise-coherence/changelog-sample.md` matches 7 | seven rows | verified |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `grep -q "Required user inputs" skills/execute-phase/SKILL.md` exits 0 | exit 0 | the box exists | P1 |
| AC2 | `grep -c "Q" scripts/fixtures/promise-coherence/changelog-sample.md` matches 12 | exit 0 | seven rows, declared twelve | P1 |
