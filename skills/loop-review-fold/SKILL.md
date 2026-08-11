---
name: loop-review-fold
user-invocable: true
version: 1.1.0
argument-hint: <NN> | --fix <n> [--max-cycles N] [--adversarial N]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Run one bounded context-clean review/fold loop for an open feature or fix PR.
  Triggers: "loop-review-fold", "run the review/fold loop", "review and fold
  this PR". This is an execution workflow, not a skill-authoring or
  installation task: reuse a current receipt, review immutable HEAD, batch
  compatible fixes, and stop on pass, decision, blocker, no progress, or budget
  exhaustion.
---

# Loop Review Fold

Remove the human relay from `review-change → fold-findings → review-change`
without merging, creating issues, weakening checks, or letting the reviewer edit
its candidate.

This is an execution entrypoint. When invoked with a target, run the bounded
loop against that unit's open PR. Do not create, edit, install, or merely
inventory this skill or its references. A missing target is a workflow
`BLOCKED` result, not a request to implement the skill.

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

## When to use

Use after `execute-phase` or `execute-phase --fix` has opened the unit's PR, or
when the user explicitly asks to run the bounded review/fold loop for an open
PR. Do not use this entrypoint to author, install, repair, or inspect the skill
itself.

## Input

- `loop-review-fold <NN>` — feature unit and its open PR.
- `loop-review-fold --fix <n>` — fix unit whose primary issue is `<n>`.
- `--max-cycles N` — positive correction budget; default `2`. A review does not
  consume a cycle; each mutating fold pass does.
- `--adversarial N` — forwards the final-review mode to `review-change`.

Invalid/missing unit, no open PR, dirty/unpushed branch, or non-positive budget
stops as `BLOCKED` with the recovery command.

## Step 0 — Discover and execute the target (always first)

1. Parse `<NN>` or `--fix <n>` as the unit target. Treat the target as work to
   execute, never as a request to inspect or implement this skill.
2. Read the target project's agent guide and establish the unit docs, current
   branch, open PR, remote HEAD, acceptance blob, receipt, and finding ledger.
   These target artifacts—not this skill's file inventory—are the work surface.
3. If any required target state is missing or invalid, return the fixed
   `BLOCKED` terminal output from `LOOP_POLICY.md` with the exact recovery
   command. Do not create a skill, add references, or substitute a completion
   summary.
4. Once target state is verified, load the references in `Process` and execute
   every numbered process step. Reading the references alone is not completion.

## Process

This entrypoint is a thin state router: it selects `PASS`, `fold-findings`
first, or `review-change` first from the target PR's durable evidence, then
alternates only after a changed HEAD. It does not reimplement either skill.
Read [loop policy and terminal states](references/LOOP_POLICY.md), then the
[review/fold process](references/LOOP_PROCESS.md). Read
[portability and model routing](references/PORTABILITY.md) only when a named
fresh-context/tier primitive is unavailable.

## Guardrails

- Allowed: inspect the target unit/PR, reuse or create the required review
  receipt, invoke `review-change` and `fold-findings` in the required fresh
  contexts, and push relevant fold commits.
- Forbidden: create or edit this skill or its references, install a skill,
  report a file inventory as the result, merge a PR, create an issue, weaken a
  check, or let a reviewer edit the candidate.

## Relationship to other skills

`execute-phase` hands off here after opening a PR; this conductor delegates
read-only review to `review-change` and mutation to `fold-findings`; only a
terminal `PASS` hands off to `audit-pr`.

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
