---
"execute-phase": minor
"unit-lane": minor
---

fix(skills): a new script and its sibling suite land red-first

The tests step commits a new suite alone — observed failing on the missing
module or the failing assertion (the red commit) — before the implementation
commits, observed green; the unit doc's `## Log` records both runs as `E`
lines naming both commit SHAs, so the TDD ceremony leaves reproducible
evidence in git instead of narration. `unit-lane`'s implement reference
gains the one sanctioned exception to "Never commit red" so the two rules
cannot collide, and `execute-phase`'s implement step carries the same
wording to the executor's tier.
