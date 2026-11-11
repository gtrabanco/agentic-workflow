# 269 — efficient-context-targeting · decisions

Owner-scoped decisions and the path-protection escape records for this unit.
The records are append-only (`n`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the relevant
planning decisions (D1–D5) live in the SPEC's `## Log`.

## Path-protection escape records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/relevant-files.test.mjs | P2 | 2026-11-10 | execute-phase | a NEW sibling suite for a NEW script (`scripts/relevant-files.mjs`, P3): the repo's red-first rule requires `scripts/x.test.mjs` beside `scripts/x.mjs`, and `scripts/structural-sibling-pins.test.mjs` refuses an unpaired file — no frozen test is edited, no existing assertion is weakened
```
