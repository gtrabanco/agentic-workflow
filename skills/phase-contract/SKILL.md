---
name: phase-contract
user-invocable: false
version: 1.0.6
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal contract: the single owner of the eight phase-lint rules, the fixed
  PASS/BLOCKED result, and the normalized phase fingerprint. Consumed by
  `execute-phase` and the lane's `plan` step. Not a menu entry.
---

# Phase Contract (internal)

The one authoritative owner of phase shape for this workflow. Planners lint
every phase they emit against the eight rules below; `execute-phase` re-checks
the same rules before any edit. Nothing else may define what a valid phase is.

## When to use

- The lane's `plan` step — lint every phase before emission.
- `execute-phase` — phase-lint pre-flight guard before editing a phase.
- Templates store the contract version + fingerprint + lint result, never the
  eight rules (they point here).

## The eight phase-lint rules

Every implementation phase must pass all 8 boxes before it is emitted (planner
skills) or executed (`execute-phase` pre-flight). Fail-closed: any unticked box
blocks emission/execution until the phase is re-cut or split.

1. **Title names ONE deliverable** — FAIL if it joins nouns with `+`, `,`, `&`,
   `and`/`y`, or `/`. Sole authorized exception: the templates' literal closing
   title `Hardening & PR` (`docs/features/_TEMPLATE/SPEC.md`,
   `docs/fix/_TEMPLATE/SPEC.md`) is kept verbatim — its `&` is a *normalization
   separator*, not a deliverable joiner, and its title-deliverable normalizes to
   `hardening-pr`. Any other `&`-joined title still FAILs.
2. **One declared layer** — each phase declares exactly one of the fixed enum
   `schema/db | domain | api | ui | config/infra | docs | hardening | close-out`;
   FAIL if any task's target file belongs to another. Tests for the phase's own
   layer belong to the phase; a test-only phase declares `hardening`.
3. **≥ 1 task, ≤ 8 tasks** — every phase carries at least one checkbox task; a phase with zero tasks is BLOCKED (fail-closed). Final hardening/close-out phase: 1–10, only the literal close-out chain.
4. **One checkbox = one deliverable** — FAIL if a task contains a `→` chain of
   implementation steps, enumerates > 3 cases/scenarios, or creates > 1 file of
   distinct concerns.
5. **Zero decision words** — FAIL on `Decide`, `choose`, `OR` between
   alternatives, `If … then <change scope>`.
6. **No conditional scope mutation** — a task may not move work between phases
   at runtime.
7. **No external/manual gates inside implementation phases** —
   human/out-of-repo verifications live in the hardening/close-out phase,
   marked `manual`.
8. **Machine-checkable done-when** — every phase ends with one verifiable
   invariant (a command + expected outcome).

**The executed-phase exemption (boxes 3 and 7 only).** A fully-ticked phase is historical:
those two boxes are positional — box 3's budget and box 7's `gh pr`
placement both key off the plan's last phase — and a replan appends its work
*after* an executed hardening (`replan-findings`' `PHASE_APPEND.md`), which would
otherwise retro-block work that already passed this gate when it was emitted.
The exemption is scoped to those two boxes: boxes 1, 2, 4, 5, 6 and 8 stay armed for an
executed phase, and for an unemitted phase every box stays armed, so pre-ticking
a phase to dodge a check is a defect, never a pass.

## Result — fixed PASS/BLOCKED output

```text
Phase-lint: PASS (8/8)
```

or, on the first failing box:

```text
Phase-lint: BLOCKED — box <n>: <one-line reason>
```

A BLOCKED phase is re-cut or split; it is never emitted, committed, or executed
as-is (no `--force` bypass exists for a non-atomic phase — that decision belongs
to the user).

## Normalized phase fingerprint

Each phase's fingerprint is a deterministic string over the phase's shape:
`P<n>:<layer>:<n-tasks>:<title-deliverable>`. It binds the lint result to the
exact phase version a plan committed to — templates and plans record
`Phase-lint: PASS (8/8) · fingerprint <fingerprint>` so later re-lints and
`execute-phase` can confirm nothing in the phase shape drifted since planning.

## Guardrails

- Sole owner of the eight rules — planners and executor point here, never carry
  their own copy.
- Never relax a rule to let a phase pass; re-cut the phase instead.
- Docs only — no code, no branch.
