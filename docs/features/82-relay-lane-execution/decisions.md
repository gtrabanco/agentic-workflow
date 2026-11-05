# Decisions — unit 82 (relay-lane-execution)

`open-questions@1` block (design/plan ask stage) and the `decision` rows that
close it. Append-only: a later correction is a new row, never an edit.

```text
open-questions@1
id | date | type | question | blocks | search-receipt | options | route
```

`none — no questions: every claim was settled by provenance or research`

## D-82-1 — pi-web detection is the session marker, never a probe (2026-11-05)

- **Decided:** the router treats `PI_WEB_SESSION=1` (inherited by every process
  this session spawns) as the pi-web presence marker, plus the packet's own
  on-disk state; it never tries to call or probe `dispatch_relay`.
- **Why:** the tool lives in the model's session, not in the router's process
  (`PE-013`). A probe would need a network/daemon round trip, break the router's
  read-only offline contract, and make its output non-deterministic. The marker
  is inherited, documented, and overridable in a fixture.
- **Discarded:** attempting a socket connect to `PI_WEB_SESSIOND_SOCKET` (I/O in
  a read-only route, non-deterministic under fixtures) and parsing
  `ps`/`$PPID` (environment-dependent, unavailable on other platforms).

## D-82-2 — The leg-handover ceiling is derived, then re-based from the first real packet (2026-11-05)

- **Decided:** the ceiling lives in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`
  (`relays.legHandoverEstimateMax`), is derived from the pointer-only shape, and
  is re-based by declared measurement the first time a live packet exists.
- **Why:** no live packet exists at cut, so any number is an assumption
  (`PE-014`). Declaring the assumption where the ceiling is owned beats a number
  in prose, and the checker fails closed when a packet outgrows it.
- **Discarded:** leaving the budget gate to prose (S25 asks for a check) and
  re-using `referenceEstimateMax` (that ceiling bounds a skill reference, a
  different artifact with a different purpose).

## D-82-3 — The coherence verdict reuses `REVIEW-VERDICT`; no new block (2026-11-05)

- **Decided:** `RELAY.md` points at `skills/unit-lane/references/REVIEW.md` for
  the verdict grammar; `scripts/relay-packet.mjs` parses that same shape and a
  drift test pins both.
- **Why:** S12 names "the existing `REVIEW-VERDICT` block" and the repo's one-owner
  rule forbids a second definition of an output contract.
- **Discarded:** a `RELAY-VERDICT` block (a second verdict vocabulary for the same
  gate) and a receipt-shaped output (S12/S20 forbid it).
