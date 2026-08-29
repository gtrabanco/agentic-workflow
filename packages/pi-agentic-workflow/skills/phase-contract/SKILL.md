---
name: phase-contract
user-invocable: false
version: 1.0.1
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal contract: the single owner of the eight phase-lint rules, the fixed
  PASS/BLOCKED result, and the normalized phase fingerprint. Consumed by
  plan-feature-scaffold, plan-fix, and execute-phase. Not a menu entry.
---

# Phase Contract (internal)

The one authoritative owner of phase shape for this workflow. Planners lint
every phase they emit against the eight rules below; `execute-phase` re-checks
the same rules before any edit. Nothing else may define what a valid phase is.

## When to use

- `plan-feature-scaffold` — lint every phase of a feature plan before emission.
- `plan-fix` — lint every phase of a fix SPEC before commit.
- `execute-phase` — phase-lint pre-flight guard before editing a phase.
- Templates store the contract version + fingerprint + lint result, never the
  eight rules (they point here).

## The eight phase-lint rules

Every implementation phase must pass all 8 boxes before it is emitted (planner
skills) or executed (`execute-phase` pre-flight). Fail-closed: any unticked box
blocks emission/execution until the phase is re-cut or split.

1. **Title names ONE deliverable** — FAIL if it joins nouns with `+`, `,`, `&`,
   `and`/`y`, or `/`.
2. **One declared layer** — each phase declares exactly one of the fixed enum
   `schema/db | domain | api | ui | config/infra | docs | hardening | close-out`;
   FAIL if any task's target file belongs to another. Tests for the phase's own
   layer belong to the phase; a test-only phase declares `hardening`.
3. **≤ 8 tasks** (close-out phase: ≤ 10, only the literal close-out chain).
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
