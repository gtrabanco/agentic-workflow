---
name: review-plan
user-invocable: true
version: 1.0.0
argument-hint: <NN-slug | fix-N | path/to/SPEC.md> [--adversarial N]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Independent read-only review of a frozen Engineering plan before execution, in a
  context that did not cut it: feature or fix snapshot, obligation ledger sweep,
  phase and validator checks. Returns only PLAN-REVIEW-PASS, PLAN-REVIEW-FAIL, or
  NEEDS-DESIGN with a snapshot-bound receipt. Never edits a plan artifact.
  Triggers: "review-plan", "review the plan", "review the phases".
---

# Review Plan

The Engineering gate. A planned unit is reviewed here, by a context that did not
cut it, **before** any phase is implemented. Findings and one verdict only — the
repair belongs to `plan-feature` / `plan-fix`, and source belongs to
`execute-phase`.

```text
Planned ≠ reviewable. `Status: planned` proves the planner's own readiness
preflight ran; this skill is what lets `execute-phase` trust the plan.
```

## Turn contract

Load and verify the **canonical** [Turn contract](.claude/skills/orchestration-envelope/references/TURN_CONTRACT.md) (11 boxes) before ending every turn. This skill's additional boxes live only in [OUTPUT.md](references/OUTPUT.md). Missing reference → STOP. An about-to-end turn with an unchecked box is not done.

```text
✓ Unit kind and stage row chosen from the roadmap row, never from a guess
✓ Plan snapshot bound to the exact bytes: every applicable artifact row present,
  digest computed at one revision, parent SPEC digest copied from the receipt
✓ Every Engineering check ticked with evidence or turned into a finding; the
  obligation ledger was read row by row
✓ One verdict printed from the closed set, with the receipt block persisted and
  findings appended to `planning-findings.md`
✓ Zero writes to any reviewed artifact (`SPEC.md`, `PLAN.md`, `TASKS.md`,
  `ACCEPTANCE.md`, `planning-evidence.md`, `planning-obligations.md`, roadmap)
```

## When to use

- `plan-feature-scaffold` or `plan-fix` finished a unit and `execute-phase` is
  about to start: `/review-plan <NN-slug>` (fix: `/review-plan fix-<N>`).
- After a replan batch produced a new `artifactRevisionId` for a failed plan.
- `execute-phase` refuses to edit without a current PASS from this skill; it
  redirects here instead of proceeding.
- Not for the Product half (`review-spec`), not for source diffs
  (`review-change`), not for merge gating (`audit-pr`).

## Step 0 — Discover the project (always first)

Per Workflow conventions + documentation map, then read exactly: the roadmap row
(unit, size, status, dependencies), the governing SPEC, `ACCEPTANCE.md`,
`planning-evidence.md` (or the SPEC's embedded tables for XS/S),
`planning-obligations.md`, `TASKS.md`, `PLAN.md` when present, `testing.md`,
`decisions.md`, `architecture-notes.md` when present, and the newest
`## Pre-execution review receipt v1 — spec` block in `progress.md`. Only with
`--adversarial N` load
[pre-execution-review policy](.claude/skills/pre-execution-review/references/POLICY.md)
and the [ledgers](.claude/skills/pre-execution-review/references/LEDGERS.md).
Nothing else — reading implementation source to judge a plan is out of scope
except the `path:line` rows the evidence ledger cites.

## Progressive loading

The reference allowlist is exactly the three paths below plus, for the shared cycle
and the findings-ledger shape, `pre-execution-review`'s `POLICY.md` / `LEDGERS.md`
(one hop up and over, loaded only at the step that names it). Never invent or read
another `references/` path.

| Condition now | LOAD now | DEFER / SKIP now |
|---|---|---|
| Roadmap row read, unit kind known (feature or fix) | [checks](references/CHECKS.md) — snapshot construction, falsification, the L1–L6 ledger sweep | [eng-checks](references/ENG-CHECKS.md) and [output](references/OUTPUT.md) |
| Snapshot bound and the ledgers swept clean enough to judge the plan | [eng-checks](references/ENG-CHECKS.md) — P1–P12, plus F1–F4 for a fix unit | [output](references/OUTPUT.md) until every check has a result |
| Any check failed, the parent receipt is missing/stale, or a product choice is open | [output](references/OUTPUT.md) for the FAIL / `NEEDS-DESIGN` block and route | — |
| A prior Plan receipt exists for this unit | [output](references/OUTPUT.md) §Repeats for the no-progress / convergence gate before re-running anything | never blend rows from two snapshots |

## Guardrails

- **Read-only on plan authority.** Never edit `SPEC.md`, `PLAN.md`, `TASKS.md`,
  `ACCEPTANCE.md`, the two ledgers, or the roadmap row. Appending findings and
  the receipt block is writing *evidence*, not editing authority — and it is the
  only writing this turn does.
- **A fix unit has no Product half and never grows a fake one (D6).** No
  fabricated actors/roles/capability closure to satisfy a Product check: its
  authority is reproduction, root cause, regression scope, and rollback (F1–F4),
  and its receipt says plainly that no Product review preceded it.
- **No substitute evidence.** A `SPEC-REVIEW-PASS` proves the Product half. A
  candidate `ReviewReceipt` or a staged `VerificationReceipt` answers different
  questions and never stands in for a Plan review. A missing parent receipt is
  reported, not repaired by assumption.
- **Three verdicts only.** Exactly `PLAN-REVIEW-PASS | PLAN-REVIEW-FAIL |
  NEEDS-DESIGN`. No partial pass, no "approve with caveats", no SPEC verdict, no
  generic "approved" verb (PD1).
- **No engineering decisions invented.** Where the right phase cut, validator, or
  migration depends on a product choice this review cannot make, return
  `NEEDS-DESIGN` and route it to the human through `design-feature` — invalidating
  downstream Plan evidence is the point.
- **No source fixes.** A plan defect that this turn could "just patch" is still a
  defect: report it and route it. Implementing while reviewing collapses the gate.
- **Obligations are not suggestions.** An uncovered, blank, `deferred`, or
  unowned obligation row blocks PASS; so does a validator that cannot fail. This
  skill may not narrow a check to make the plan pass.
- **Context-clean or stop.** If this conversation wrote or replanned the target
  Engineering half, do not review it: report that the review needs a fresh
  context and hand off.
- Docs-language and commit conventions per the project's Workflow conventions.

## Portability (agents other than Claude Code)

- **No slash menu** — open this `SKILL.md` and follow it in a fresh conversation
  that never saw the planning turns.
- **No model tiers** — review with a model at least as strong as the one that cut
  the plan; never review planning with a weaker model.
- **No subagents** — `--adversarial N` degrades to one clean reviewer plus a
  second pass in another conversation; findings still union, and same-model
  stays labelled `same-model`.
- **No runtime enforcement** — compute the digests yourself (`git hash-object` /
  `sha256sum`) and carry the `artifactRevisionId` from the planner's handoff.
  Where nothing rotates the id, say so in the receipt notes: mutate-and-revert
  detection then depends on the manual handoff.

## Relationship to other skills

- `plan-feature-scaffold` / `plan-fix` author the plan and must have returned
  `stage: plan READY-FOR-REVIEW` from `evidence-grounding` before this review;
  readiness is not approval and is never accepted as one.
- `review-spec` owns the parent: this review binds its receipt digest and the
  Product snapshot digest it reviewed.
- `pre-execution-review` owns the shared cycle (independence, union, dismissal,
  no-progress, `CONVERGENCE-ANOMALY`) and the ledger shapes. This file restates
  neither.
- `execute-phase` is the consumer and fails closed without a current PASS here;
  `audit-pr` keeps exclusive `MERGE-READY` authority and this skill takes none.

## Done when

- The snapshot, check table, obligation sweep, and exactly one verdict block were
  produced; the receipt is persisted in `progress.md` and findings appended to
  `planning-findings.md`.
- No plan artifact changed.
- **The closing `→ Next:` block is printed last** — see
  [output contract](references/OUTPUT.md).
