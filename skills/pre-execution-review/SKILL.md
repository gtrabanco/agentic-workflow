---
name: pre-execution-review
user-invocable: false
version: 1.4.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal owner of the pre-execution review cycle and the planning ledgers:
  independence, unioned findings, counter-evidence dismissal, no-progress,
  `CONVERGENCE-ANOMALY`, and the evidence/obligation/findings tables. Consumed by
  `review-spec`, `review-plan`, and the authoring skills. Not a menu entry.
---

# Pre-Execution Review Policy (internal)

One owner for the rules that both pre-execution reviewers apply, so a Product
review and a Plan review cannot drift into two different definitions of
independence, union, or convergence. It states **policy**; it runs nothing,
writes nothing, and emits no verdict of its own.

```text
evidence-grounding  = how an author prepares and self-checks an artifact.
pre-execution-review = how any pre-execution reviewer judges it, and what the
                       frozen ledgers look like.
review-spec / review-plan = the only skills that emit a pre-execution verdict.
```

## When to use

- `review-spec` / `review-plan` — before the first check and again before any
  repeat, repair, or synthesis step.
- `design-feature`, `plan-feature`, `plan-feature-scaffold`, `plan-fix` — when
  writing the ledgers and when a review comes back failed.
- Nothing else. Candidate-source review (`review-change`), merge gating
  (`audit-pr`) and execution (`execute-phase`) keep their own contracts; this
  skill adds no authority over them.

## Hard rule — no verdicts, no edits

This skill never prints `SPEC-REVIEW-PASS`, `PLAN-REVIEW-PASS`,
`SPEC-REVIEW-FAIL`, `PLAN-REVIEW-FAIL` or `NEEDS-DESIGN` as a result of its own
reading, and it never writes a unit artifact. Quoting a verdict shape here is a
definition, not an issuance. A policy summary that reads like an approval is a
contract violation — the verdict belongs to the reviewer turn that binds the
snapshot.

## The three references

| Condition now | LOAD |
|---|---|
| Running or repairing a pre-execution review | [references/POLICY.md](references/POLICY.md) — independence, union, dismissal, diversity labels, author exclusion, untrusted content, critique/synthesis/arbitration bounds, no quorum, no-progress, batch repair, `CONVERGENCE-ANOMALY`, write-then-report |
| Building or re-checking a snapshot digest | [references/SNAPSHOT.md](references/SNAPSHOT.md) — the one executable recipe (`scripts/pre-execution-snapshot.mjs`), what each stage binds, how a consumer re-verifies a receipt, and why a snapshot digest is not a git blob id |
| Writing or validating a Plan-stage artifact | [references/LEDGERS.md](references/LEDGERS.md) — the planning-evidence table, the obligation ledger, the stage-aware `planning-findings.md`, and who may write each |

## Guardrails

- **Single owner.** A caller may restate a rule only as a one-line pointer plus
  the stage-specific detail it adds. Two copies of the union rule, the dismissal
  rule, or the convergence fields is the drift this skill exists to prevent.
- **Policy is not a receipt.** Reading this file proves nothing about any
  artifact; only a reviewer turn that binds a snapshot does.
- **No weakening.** The bounds here are ceilings *and* floors: a cycle may be
  shorter than the budget allows, never looser than the policy allows.
- **Vocabulary is closed.** Severity, class, role, verdict and status words are
  exactly those named in the references. Inventing `accepted`, `waived`,
  `mitigated`, or a fourth verdict is a contract break.
- Docs-language and commit conventions per the project's Workflow conventions.

## Done when

- Every pre-execution reviewer and authoring caller points here for the shared
  cycle and ledger rules instead of restating them, and each stage file keeps
  only the detail that is genuinely stage-specific.
