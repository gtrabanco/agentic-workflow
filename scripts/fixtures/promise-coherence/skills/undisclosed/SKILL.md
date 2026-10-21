---
name: undisclosed
user-invocable: true
version: 1.0.0
description: >
  Frozen-failure fixture · issue #305 · replay of unit 258 findings F45 and F53:
  a Turn-contract box that runs the dispatcher against a unit folder while the
  skill never establishes the artifact the dispatcher requires, so a box-only
  run reproduces `missing-unit-doc`.
---

# Undisclosed

## Turn contract — verify before ending the turn

```
✓ Required user inputs were answered concretely (not defaulted). A gap runs
  `node scripts/needs-input.mjs <unit-dir>` and the block is pasted
✓ The scaffold was written
```

## Process

Ask for consent when something is ambiguous, then continue.
