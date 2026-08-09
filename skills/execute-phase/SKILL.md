---
name: execute-phase
user-invocable: true
version: 3.0.0
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

Execution modes:

- **unit loop** (default when `P<n>` is omitted) — execute every remaining
  phase through close-out, with one phase-local gate and commit per phase.
- **explicit phase** — passing `P<n>` executes exactly that phase and stops.
- **legacy single-pass** — a SPEC without `## Phases` runs end-to-end once.
- **`--fix`** selects a fix unit; the same omitted/explicit phase dispatch applies.

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

- Honor the project's **Workflow conventions** (branch/PR, gate-before-commit, docs-language). Run `git branch --show-current` before any edit/commit; if `main`, create the working branch first (assistant only; the user may use `main`).
- **Phases are `P1, P2, …`.** The `<phase>` argument and every reference in `PLAN.md`/`TASKS.md`/`progress.md`/commits is `P1, P2, …` ("phase N") — **never** `S1`/`S2`/"Step N". If a plan you're handed uses `S1`-style labels, normalize it to `P1, …` before executing and note it in `decisions.md`.
- Implement only the requested scope — all remaining planned phases when no
  phase is passed, or exactly the explicit `P<n>`. Never invent/bundle tasks
  across phase boundaries; unit-loop mode still gates and commits each phase.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).
- **When reality contradicts the plan** (a task is impossible, an assumption is wrong, a better path appears): update `TASKS.md`/`PLAN.md` and record why in `decisions.md` — never silently diverge from the written plan.
- **Dependency gate before any work** — the preflight resource owns it. No edit,
  branch, or commit for an unmerged dependency closure unless the user passed `--force`.
- **Phase-lint before any edit** — the preflight resource runs it after
  dependency/own-status gates. Any FAIL stops unless the user passed `--force`.

## Context budget (hard rule — small models re-pay full context every turn)

- **File cap: read at most 10 files in full per phase**, beyond the unit's
  own docs (`SPEC.md`, the phase's `TASKS.md` section, `progress.md`).
  Targeted reads (≤ 50 lines of a named range) and grep/glob results do NOT
  count against the cap. About to exceed it → STOP reading; record what you
  know and what's still unverified in the phase's `Gotchas:` line, then
  proceed on what targeted reads can confirm, or report the blocker — never
  sweep the codebase.
- **Summarize, don't hold.** The moment a file yields the fact you needed,
  write the fact (with its `file:line`) into your working notes / the
  progress entry and work from the note. Never re-read a file already
  summarized; never quote whole files into the conversation.
- **Step 0 minimum set (fixed).** Discovery reads exactly: the agent guide's
  Workflow conventions + the architecture doc section covering the phase's
  declared `Layer:` + the optional invariant document when the documentation
  map declares one. Nothing else by default; every additional doc counts
  against the file cap.
- **Unit-loop reset.** After each phase commit reduce working state to the
  phase receipt in `progress.md`; discard raw source/test output before selecting
  the next phase. Use a fresh worker context per phase when the host provides
  one; otherwise continue inline from receipts, never by re-reading prior files.

## Progressive loading — mandatory route before acting

This entrypoint carries only the universal turn contract and handoff schema.
Load route detail from the links below **before** the step that needs it. Read
only the listed files; every resource is one hop from this file.

1. Every invocation: consume the [verification contract](<../verification-contract/SKILL.md>),
   then read [preflight gates](references/PREFLIGHT.md), run them,
   and stop on any contracted blocker before editing. This mandatory route owns
   the `docs/workflow/REPOSITORY_STATE.md` and Architectural invariants gates.
2. When no explicit `P<n>` is passed, read [unit loop](references/UNIT_LOOP.md).
   Then, before implementation, read [execution contract](references/EXECUTION_CONTRACT.md),
   then select **exactly one** mode from the artifacts and read only its
   workflow: [feature](references/WORKFLOWS_FEATURE.md), [small/phased](references/WORKFLOWS_SMALL_PHASED.md),
   [`--fix`](references/WORKFLOWS_FIX.md), or [legacy](references/WORKFLOWS_LEGACY.md)
   (SPEC without `## Phases`). Do not load another mode's workflow.
3. Read the one policy your situation needs (each loads alone):
   - writing a forge body → [forge body policy](references/FORGE_BODY.md)
   - creating an issue → [descope guard](references/DESCOPE.md) first
   - finding out-of-scope work → [opportunistic finding policy](references/OPPORTUNISTIC_FINDING.md)
4. Before writing `progress.md`: read the fixed [handoff schema](references/HANDOFF.md).
5. For implementation guidance and review/finish routing: read
   [closeout](references/CLOSEOUT.md). On a folded review/audit finding also read
   [folding](references/FOLDING.md).
6. Only for `/loop`, an external driver, manual batching, or a missing vendor
   feature: read [batch and portability](references/BATCH_AND_PORTABILITY.md).

The fixed blocks in a selected resource are normative: copy them exactly.
Missing/unreadable required resource → STOP; never reconstruct it from memory.

## Portability

The core contract is vendor-neutral. When the platform lacks slash commands,
per-skill tiers, or a loop primitive, read
[batch and portability](references/BATCH_AND_PORTABILITY.md) and use its explicit
fallback; never skip the underlying workflow step.

## Relationship to other skills

- Planned by `plan-feature` (features) or `plan-fix` (fixes); executes their SPEC.
- In explicit-phase mode, **hands off** to `review-change` when a trigger-based checkpoint
  (layer boundary, accumulation, or sensitivity; skippable), **mandatory** when
  finishing a unit. Unit-loop mode skips intermediate checkpoints and recommends
  `loop-review-fold` after the PR opens; direct `review-change` remains the
  manual alternative. Independent work stays a proposal until user triage.
- A finished unit (single-pass, `--fix`, or final phase) **always opens its PR and
  flips to `done`**; `audit-pr` then gates the merge (it blocks on pending docs or a
  prematurely-dropped issue entry).
- **Every invocation ends by printing the next step.**

## Done when

- The requested scope is implemented (all remaining phases by default, one
  explicit phase, or the legacy single pass), the project's gate is green, per-phase docs are updated, and
  the work is committed on the correct branch — nothing bundled beyond the requested
  scope.
- **The tree is clean and the remote current:** `git status --porcelain` is empty
  (docs included) and, when the branch has an open PR, nothing is left unpushed.
- **A finished unit additionally:** is flipped to `done`, has its PR opened (never
  branch-only) with **the PR URL printed in the chat**, and prints the mandatory
  `/loop-review-fold` hand-off as the recommended next step, with direct
  `/review-change` listed as the manual alternative.
