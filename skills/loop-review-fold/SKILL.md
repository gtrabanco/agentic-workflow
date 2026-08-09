---
name: loop-review-fold
user-invocable: true
version: 1.0.0
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
```

## Input

- `loop-review-fold <NN>` — feature unit and its open PR.
- `loop-review-fold --fix <n>` — fix unit whose primary issue is `<n>`.
- `--max-cycles N` — positive correction budget; default `2`. A review does not
  consume a cycle; each mutating fold pass does.
- `--adversarial N` — forwards the final-review mode to `review-change`.

Invalid/missing unit, no open PR, dirty/unpushed branch, or non-positive budget
stops before review with the exact evidence and recovery command.

## Progressive loading

Read exactly, in order:

1. [loop policy and terminal states](references/LOOP_POLICY.md)
2. [review/fold process](references/LOOP_PROCESS.md)
3. [portability and model routing](references/PORTABILITY.md) only when a named
   fresh-context/tier primitive is unavailable.

Consume the internal [verification contract](<../verification-contract/SKILL.md>).
Compose `review-change` and `fold-findings`; never copy their finder,
classification, ledger, or correction checklists into this skill.

## Relationship to other skills

- Starts after `execute-phase` opens a PR.
- `review-change` owns immutable-candidate findings and the exact-SHA receipt.
- `fold-findings` owns all mutation and per-finding ledger transitions.
- `audit-pr` is the next gate only after terminal `PASS`.
- `ship-roadmap` may use this as its REVIEW stage; it does not change merge
  authority (`--fullauto` AUDIT wrapper only).

## Done when

- One terminal state is reached with HEAD/receipt/findings/cycle evidence.
- PASS has a current exact-SHA review receipt and zero open fix-now rows.
- Every non-PASS state names a deterministic resume or decision path.

```text
→ Next: (terminal-dependent; use LOOP_POLICY.md's exact block)
```
