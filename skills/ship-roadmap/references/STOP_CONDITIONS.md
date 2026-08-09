### Stop conditions

| Banner | Fires when |
|---|---|
| `SHIP: COMPLETE` | Every roadmap feature is `done` **and its PR merged** (default mode: the human merged them all; `--fullauto`: merged under the floors) — `done` alone is not enough, since it only means *built + PR open* — **AND the issue sweep ran to completion**: existing issues inventoried/triaged, every fix-now issue shipped or parked, and untracked residue deduplicated as report proposals without creating backlog. Features merged but sweep pending → the run is NOT complete. Report written, report PR open. |
| `SHIP: BLOCKED` | Everything remaining is `done`-but-pr-open awaiting human merges, or planned with unmerged deps (default mode); or a parked feature transitively blocks the rest. Always includes the unblock map. |
| `SHIP: STOPPED` | Budget/iteration cap; a Round-5 milestone stop line; substrate invariant broken (gate unrunnable, roadmap unparseable, unexplained dirty default branch, decision record missing); forge unavailable (no stage that depends on PR state may proceed on guesses). |
| (feature parked, run continues) | Repeated red gate (retry cap), review ping-pong (2 cycles), audit ping-pong (2 cycles), capacity guard (3 partials), planning contradiction, **undesignable-from-record** (DESIGN stage `NEEDS_INPUT` — the recorded gap is a human-only unpark, never a mid-run re-ask). |
| **Systemic drift stop** | `review-change` flags SPEC drift on **two consecutive features** → the locked founding assumptions are probably stale; the whole run stops rather than auto-merging a compounding error. |
