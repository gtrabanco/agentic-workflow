# 66 — reviewer brief

Restates the design step's questions and their status so a reviewer never
re-derives them. Kept in sync with `decisions.md` (the ledger) and
`sources.md` (the claim journal).

## Asked

| Asked | Resolution |
|---|---|
| Q1 — What carries the bounded health probe, and how is its verdict recorded in Evidence? | OPEN (2026-10-21) — options: deterministic probe subcommand + prose (recommended) / skill prose only / pi-session hook |
| Q2 — Canonical split between `docs/LOGS.md` (log-session) and `mem_session_summary`? | OPEN (2026-10-21) — options: LOGS = team journal, Engram = unit-keyed recall (recommended) / Engram mirrors LOGS / document-only |
| Q3 — How does the pi path provision Engram's MCP registration? | OPEN (2026-10-21) — options: package extension `registerMcpServer` behind consent (recommended) / docs-only `engram setup pi` / package ships the binary |

## Claim status

- 22 `INV-*` claims journaled in `sources.md`; 19 `confirmed` (tier 0,
  provenance), 2 `inferred` researched into the Q1/Q3 option sets, 1 `unknown`
  escalated to Q2.
- Research evidence rows `R1–R6` in the SPEC's Evidence section.

## Gate

`node scripts/needs-input.mjs docs/features/66-engram-memory-substrate` →
exit 0, 3 open questions, continuation `no-decision-available`. The lane halts
at the ask stage until all three carry `decision` rows.
