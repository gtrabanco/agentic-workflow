---
name: loop-review-fold
user-invocable: true
version: 1.0.3
argument-hint: <NN> | --fix <n> [--max-cycles N] [--adversarial N]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Drive one bounded context-clean review/fold loop for an open feature or fix
  PR: reuse a current receipt, review immutable HEAD, batch compatible fixes,
  and stop on pass, decision, blocker, no progress, or budget exhaustion.
---

# Loop Review Fold

Remove the human relay from `review-change → fold-findings → review-change`
without merging, creating issues, weakening checks, or letting the reviewer edit
its candidate.

## Turn contract

```text
✓ Unit, PR, remote HEAD, and frozen acceptance blob were verified before review
✓ A current exact-SHA REVIEW-PASS was reused; otherwise every review ran in a fresh read-only context
✓ Every correction used fold-findings' frozen classification and atomic batches; every commit was pushed
✓ No unchanged HEAD was reviewed twice; repeated evidence stopped NO-PROGRESS
✓ At most --max-cycles correction cycles ran (default 2); no hidden retry budget
✓ No issue or merge command ran; independent work remained proposals
✓ One terminal state and its evidence were printed; closing → Next: block was last
✓ When findings are open, the matching terminal recommendation names every finding ID once, joined with ` + `
```

Any unchecked box means the turn is not done.

## Input

- `loop-review-fold <NN>` — feature unit and its open PR.
- `loop-review-fold --fix <n>` — fix unit whose primary issue is `<n>`.
- `--max-cycles N` — positive correction budget; default `2`. A review does not
  consume a cycle; each mutating fold pass does.
- `--adversarial N` — forwards the final-review mode to `review-change`.

Invalid/missing unit, no open PR, dirty/unpushed branch, or non-positive budget
stops as `BLOCKED` with the recovery command.

## Process

Read [loop policy and terminal states](references/LOOP_POLICY.md), then the
[review/fold process](references/LOOP_PROCESS.md). Read
[portability and model routing](references/PORTABILITY.md) only when a named
fresh-context/tier primitive is unavailable.

## Portability (agents other than Claude Code)

- Without native fresh contexts, subagents, or tier controls, use the
  `PORTABILITY.md` fallbacks; never claim a context-clean review after the same
  context authored a correction.
- Without `/loop`, re-invoke this skill manually and follow the terminal
  `→ Next:` block.

## Done when

Return the terminal state required by `LOOP_POLICY.md`.

```text
→ Next: (terminal-dependent; use LOOP_POLICY.md's exact block and repeat every open finding ID joined with ` + `)
```
