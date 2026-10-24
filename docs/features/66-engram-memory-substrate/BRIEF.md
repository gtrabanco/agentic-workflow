# 66 — reviewer brief

Restates the design step's questions and their status so a reviewer never
re-derives them. Kept in sync with `decisions.md` (the ledger) and
`sources.md` (the claim journal).

## Asked

| Asked | Resolution |
|---|---|
| Q1 — What carries the bounded health probe, and how is its verdict recorded in Evidence? | **D1 (2026-10-21, owner):** deterministic runner-crate probe subcommand (bounded timeout, JSON verdict, explicit DEGRADED) + skill prose pasting the verdict into Evidence; prose-only and pi-hook discarded |
| Q2 — Canonical split between `docs/LOGS.md` (log-session) and `mem_session_summary`? | **D2 (2026-10-21, owner):** LOGS = git-traveling team journal (log-session), Engram = local decision/gotcha recall keyed by unit id; mirroring and document-only discarded |
| Q3 — How does the pi path provision Engram's MCP registration? | **D3 (2026-10-21, owner):** package registers via consent-gated `registerMcpServer` and asks to install; documented route `pi install npm:gentle-engram@latest`, never `engram setup pi` (stale version until re-run). The update-script/weekly-check idea is deferred to `## Future`, not part of the answer |

## Plan stage (2026-10-21)

none — no questions: every claim was settled by provenance or research

15 `CLAIM-*` rows in `sources.md`, ledgers in `planning-evidence.md` /
`planning-obligations.md`, phases `P1…P6` in the SPEC (phase-lint PASS).

## Claim status

- 22 `INV-*` claims journaled in `sources.md`; 19 `confirmed` (tier 0,
  provenance), 2 `inferred` researched into the Q1/Q3 option sets, 1 `unknown`
  escalated to Q2 and now closed by `D2`.
- Research evidence rows `R1–R6`, design rows `R7–R8` in the SPEC's Evidence
  section.

## Gate

`node scripts/needs-input.mjs docs/features/66-engram-memory-substrate` →
exit 0, **0 open questions** (`Decision: none`) as of 2026-10-21 — the lane
proceeds to the plan step.
