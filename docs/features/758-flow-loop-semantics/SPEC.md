---
type: feature
scope: medium
roadmap_summary: DECISION: /flow loop semantics — one step per invocation vs. driven sequences per session mode
---

# 758 — flow-loop-semantics

> One-line: decide as an owner design decision whether /flow remains strictly one-catalog-step-per-invocation or gains a driven-loop mode. This issue records the decision and its justification.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Record one owner decision: loop policy.**
> Decide — as an owner design decision, not an accidental default — whether /flow remains strictly one-catalog-step-per-invocation (today's contract, #669 S2: "the model only executes the step it is handed", the owner re-invokes) or gains a driven-loop mode: on each invocation the driver executes the handed step and re-senses, continuing until a stop rule or session-mode boundary (single-session → further; phase-per-turn → one phase; orchestrate/relay → unchanged). The owner's vision recorded in #669's interview is the more automatic /flow; the shipped v1 chose the stepped contract for turn-boundary discipline. This issue exists to make that a recorded decision with options and trade-offs, not to pre-judge it.

**S2 — Evaluate options against #669 boundaries.**
> A design analysis of each option against the boundaries #669 declared: un-paso-por-turn-commit discipline for judgment steps, execution phases routed across turn boundaries, Relay/orchestrate seams, and the token-savings intent (#669's horizon: chaining clean sessions where it makes sense).

**S3 — The follow-up unit derives AC from the decision.**
> Whatever the decision picks, the change lands as its own unit afterwards — this issue only records the decision and its justification. The follow-up unit's SPEC derives acceptance criteria mechanically from the decision.

## Impact

What the change touches beyond its own files: the /flow driver contract, the session-mode composition table (`flow-session-modes@1`), the normative surfaces inventory, and all docs surfaces.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `docs`
- `skills/unit-lane/references/RELAY.md` (flow-session-modes@1)

## Retirements

- If loop policy adopts any option beyond status quo: the documented "one invocation = one step" contract must be replaced with the chosen loop contract.

## Non-goals

- No implementation — this issue only records the decision. A follow-up unit carries the implementation.
- No bootstrap-from-issue consumption — owned by the related feature issue (#757).
- No stop-rule mechanics (--stop-after plan, tier-high, --yes) — already decided and shipped (#669 D7/D12).

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `<standard>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status.

- The follow-up unit that implements the decided loop policy (open, pending #758 decision).

## Future cost

- If loop policy is adopted: the follow-up unit must update the normative surfaces inventory to reflect the changed table rows.
- The decision must name the per-option contract for each of the four session modes in `flow-session-modes@1`, so the follow-up unit's SPEC can derive acceptance criteria mechanically.

## Applicable tests

The tests this unit will run (triage-decided).

- Owner decision recorded (this issue is the test — the SPEC carries the decision)
- If status quo: no test change needed
- If loop policy: all test suites pass for the new contract (to be defined in follow-up unit)
- Rendered-facts integrity: no normative-surface row regresses

## Known pre-existing issues

- **#669** — deterministic lane driver (parent: S2 "the model only executes the step it is handed"; D7/D12: stop rules already shipped). Affects: every option must be evaluated against #669's boundaries.
- **#757** — /flow bootstrap from issue (related: soft order, no blocker). Does not affect: this issue is independent of the bootstrap change.
- **#680** — relay closeout receipt orphan (related: Relay/orchestrate seams). Does not affect: this unit's design analysis considers the seam but does not fix it.

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Document the three options (a) status quo (stepped, re-invoke), (b) explicit --loop flag with per-session-mode bounds, (c) session-mode composition decides (single-session auto-continues) (validator: each option's trade-offs are clearly stated in the unit doc)
  (Implements: S1)
  - Relevant files: docs/features/758-flow-loop-semantics/SPEC.md

- P2 — Analyze each option against #669 boundaries: turn-boundary discipline, execution phases, Relay/orchestrate seams, token-savings (validator: the analysis covers all four boundaries per option)
  (Implements: S2)
  - Relevant files: docs/features/758-flow-loop-semantics/SPEC.md, docs/features/758-flow-loop-semantics/research.md

- P3 — Record the owner decision (or convert to human-revision-needed if owner prefers to hold) (validator: the issue body carries the decision or human-revision-needed label)
  (Implements: S3)
  - Relevant files: docs/features/758-flow-loop-semantics/SPEC.md

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned by `skills/pre-execution-review/references/LEDGERS.md`).

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and required failure state.

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage <slug>` here verbatim. This block is the machine's authoritative step list; the lane never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the request, verbatim:
  ```
  DECISION: /flow loop semantics — one step per invocation vs. driven sequences per session mode
  ```

## Next

The single next action: run triage and begin P1 (document the three options).

## References

- Issue: [#758](https://github.com/gtrabanco/agentic-workflow/issues/758)
- Roadmap: row 758
- #669 — deterministic lane driver (parent, S2/D7/D12)
- #757 — /flow bootstrap from issue (related, soft order)
- #680 — relay closeout receipt orphan (related: Relay/orchestrate seams)