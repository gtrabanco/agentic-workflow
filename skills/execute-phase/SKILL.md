---
name: execute-phase
user-invocable: true
version: 3.0.1
argument-hint: <NN> [P<k>] | --fix <n> [P<k>] | [--max-attempts N] [--force]
allowed-tools: [Bash, Read, Edit, Write, MultiEdit]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Implement all remaining phases of a planned feature/fix by default, or one
  explicit P<n>, with frozen acceptance, phase-local gates, commits, recovery,
  and final PR close-out. Use --fix for fix SPECs; --force is user-only.
---

# Execute Phase

Modes: **unit loop** (default when `P<n>` is omitted) executes every remaining phase through close-out,
with one gate/commit per phase; **explicit phase** `P<n>` executes exactly that phase;
legacy SPECs without `## Phases` run once. `--fix` selects a fix unit.

First matching row wins:

| Invocation shape | Queue |
|---|---|
| target + explicit `P<n>` | only the literal `P<n>` argument; ignore other unfinished phases |
| target, no phase | only the literal unfinished phase IDs found in the ledger, in order |
| legacy SPEC without phases | one legacy pass |

Never infer a phase ID absent from the invocation/ledger.

## Turn contract

Load and verify the **canonical** [Turn contract](.claude/skills/orchestration-envelope/references/TURN_CONTRACT.md) (11 boxes) before ending every turn. Skill-specific additions and push policy live only in [PREFLIGHT.md](references/PREFLIGHT.md). Missing reference → STOP.

## Hard rules

- Honor Workflow conventions (branch/PR, gate-before-commit, docs language). Run
  `git branch --show-current` before editing/committing; if `main`, create the
  working branch first (unless the user explicitly uses `main`).
- **Phases are `P1, P2, …`.** The `<phase>` argument and every reference in `PLAN.md`/`TASKS.md`/`progress.md`/commits is `P1, P2, …` ("phase N") — **never** `S1`/`S2`/"Step N". If a plan you're handed uses `S1`-style labels, normalize it to `P1, …` before executing and note it in `decisions.md`.
- Implement only the requested scope: all remaining ledger phases when omitted,
  or exactly `P<n>`. Never invent/bundle across phase boundaries; unit-loop mode
  still gates and commits each phase.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).
- **Plan conflict:** update `TASKS.md`/`PLAN.md` and record why in `decisions.md`;
  never silently diverge.
- **Dependency gate before any work** — the preflight resource owns it. No edit,
  branch, or commit for an unmerged dependency closure unless the user passed `--force`.
- **Phase-lint before any edit** — the preflight resource runs it after
  dependency/own-status gates. Any FAIL stops unless the user passed `--force`.

## Context budget (hard rule — context is repaid every turn)

- **File cap:** read at most 10 full files per phase beyond `SPEC.md`, the phase
  `TASKS.md` section and `progress.md`. Targeted ≤50-line reads and greps do not
  count. If the cap would be exceeded, stop, record known/unknown facts in
  `Gotchas:`, then proceed only with targeted evidence or report the blocker.
- **Summarize:** record needed facts with `file:line`; never re-read summarized
  files or quote whole files.
- **Step 0:** read only Workflow conventions, the architecture section for the
  phase `Layer:`, and the optional invariant document named by the map.
- **Unit-loop reset:** after each commit retain only the `progress.md` receipt;
  use a fresh worker per phase where possible, otherwise never re-read prior files.

## Progressive loading — mandatory route before acting

This entrypoint carries the universal turn contract and handoff schema. Load only
the listed one-hop route resource immediately before its step.

1. Every invocation: consume [verification contract](<../verification-contract/SKILL.md>),
   read/run [preflight gates](references/PREFLIGHT.md), and stop on a contracted
   blocker before editing. This route owns NRS and Architectural invariants gates.
2. Without explicit `P<n>`, read [unit loop](references/UNIT_LOOP.md), then
   [execution contract](references/EXECUTION_CONTRACT.md), then exactly one
   workflow: [feature](references/WORKFLOWS_FEATURE.md),
   [small/phased](references/WORKFLOWS_SMALL_PHASED.md),
   [`--fix`](references/WORKFLOWS_FIX.md), or [legacy](references/WORKFLOWS_LEGACY.md).
   Never load another mode.
3. Read only the needed policy:
   - writing a forge body → [forge body policy](references/FORGE_BODY.md)
   - creating an issue → [descope guard](references/DESCOPE.md) first
   - finding out-of-scope work → [opportunistic finding policy](references/OPPORTUNISTIC_FINDING.md)
4. Before `progress.md`, read [handoff schema](references/HANDOFF.md).
5. For implementation/finish, read [closeout](references/CLOSEOUT.md); for a
   folded finding also [folding](references/FOLDING.md).
6. Only for `/loop`, external drivers, manual batching, or missing vendor
   primitives, read [batch and portability](references/BATCH_AND_PORTABILITY.md).

Fixed blocks in selected resources are normative and copied exactly. Missing or
unreadable required resource → STOP; never reconstruct from memory.

## Portability

The contract is vendor-neutral. When slash commands, tiers or a loop primitive
are absent, read [batch and portability](references/BATCH_AND_PORTABILITY.md) and
use its fallback; never skip the workflow step.

## Relationship to other skills

Planned by `plan-feature`/`plan-fix`; executes their SPEC. Explicit phases may
hand off to `review-change` at layer/accumulation/sensitivity checkpoints and must
at unit end. Unit-loop skips intermediate checkpoints and recommends
`loop-review-fold` after opening the PR; direct `review-change` remains manual.
Independent work stays a proposal. A finished unit always opens its PR and flips
to `done`; `audit-pr` gates merge. Every invocation prints the next step.

## Done when

- Requested scope is implemented (all remaining phases, one explicit phase, or
  legacy pass), gate is green, per-phase docs are updated, and the work is
  committed on the correct branch with nothing bundled beyond scope.
- `git status --porcelain` is empty and an open-PR branch has nothing unpushed.
- A finished unit is `done`, has an opened PR (URL printed), and recommends the
  mandatory `/loop-review-fold` hand-off with direct `/review-change` as manual alternative.
