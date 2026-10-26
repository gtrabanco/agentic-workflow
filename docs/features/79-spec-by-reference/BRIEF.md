# Brief — unit 79 (spec-by-reference)

A reviewer's two-minute restatement of what this unit changes and why, written
from `decisions.md` so no reviewer has to re-derive the step's questions.

## What the change is

The unit document re-cuts to **spec-by-reference** (issue #308, direction #307 —
Gentleman-Programming's ODD): requirements become numbered `S#` that quote the
owner's words verbatim, tasks link to their `S#`, and one append-only `## Log`
inside the doc carries the request, the corrections, the evidence runs and the
gate runs. A change appends a Log entry, rewrites only the affected `S#` and
reopens only its task. The per-unit findings ledger (`review-findings.md`)
collapses into the same document: OPEN rows in `## Findings`, folded history
and the marks as Log lines.

## The three questions the design step asked, and how they closed

| Asked | Resolution |
|---|---|
| Q1 — section-set strategy: full re-cut + mirrored schema change, or keep `#308`'s "no schema-package break" non-goal? | **A — full re-cut, both shapes accepted** (owner, `D1`): the new 14-section set replaces Evidence/Progress log; constant, selector, producer, SDK copy and router accept BOTH shapes so closed units keep validating; the non-goal is amended by that row. B discarded — a re-cut template fails triage and the Product selector without the machine change (the D-77-1 defect class). |
| Q2 — unit sizing: one unit or split the ledger collapse? | **A — one unit, `scope: large`, one PR** (owner, `D2`): #307's "one recoverable feature document"; splitting would migrate the same reader set twice. The whole-unit diff budget is met by a recorded exception, never a shrunk diff. |
| Q3 — where OPEN findings live once `review-findings.md` disappears? | **A — its own `## Findings` section** (owner, `D3`): `## Log` stays strictly append-only, which is the contract a change-append-and-rewrite document depends on. |

Assumptions taken instead of asking (dated, correctable) live in
`decisions.md` §Assumptions — A1 unit number 78 (superseded 2026-10-26: the unit
is **79**), A2 `scope: large` pending Q2,
A3 this unit's own doc stays in the current shape until its next touch, A4
`S#` = requirement ids / `P#` = phase labels with the guide wording amended in
P6, A5 fixtures under `scripts/fixtures/spec-by-reference/`.

## What a reviewer can check, mechanically

- `bun scripts/unit-route.mjs --triage 79-spec-by-reference` — exit 0, the
  nine-step block pasted verbatim in the SPEC.
- `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` —
  `verdict PASS`, P1–P7 `PASS (6/6)`.
- `node scripts/promise-coherence.mjs` — `verdict PASS` at the head.
- `node scripts/needs-input.mjs docs/features/79-spec-by-reference` — exit 0,
  zero pending questions once `D1`–`D3` are read.
- `node --test scripts/*.test.mjs` — 775/775 at `39e2aa3a`.

## What this unit deliberately does not do

- No review-machinery change: `review-on-slices` / `review_due` is a follow-up
  unit once slices exist (#308 Non-goals, `## Future` row).
- No migration of closed/historical unit docs.
- No change to this repository's own workflow docs before the owner has
  reviewed the converted fixture corpus (AC7, gate `O2`).
- Findings discovered during implementation never widen the unit.
