# Phase append — the replan write

The router said `replan`; this file owns the only write that follows. It is
loaded by `replan-findings` and binds the append to the unit's SPEC ledger, the
phase contract, and the artifact-revision duty.

## What gets appended

For every finding the router's `rows:` line selected, append one or more phases
to the unit's SPEC `## Phases` ledger. Each appended phase is an in-scope repair
phase, not a plan-vs-build split:

- One deliverable, one declared layer, ≤ 8 tasks, machine-checkable done-when —
  the 8-box [phase contract](<../../phase-contract/SKILL.md>) in full.
- Its done-when is a command with an expected outcome, never a judgement.
- It carries the finding ids it closes in its task text, so the fold can prove
  the row's work landed.

The ledger's own numbering continues: `P9`, `P10`, … after the highest phase
already present. Never renumber, reparse, or delete an existing phase.

## Placement (the hardening rule)

- **Final `Hardening & PR` phase not yet executed** → insert the new phase(s)
  **before** it. The existing close-out stays last and covers the new work.
- **Final `Hardening & PR` phase already executed** → append the new phase(s)
  **after** it, then append one fresh final `Hardening & PR` closing them out.
  A completed hardening never vouches for work added after it ran, so the ledger
  must always end with an unexecuted hardening close-out covering every phase.

Insertion is textual and ordered: the new phases sit in the position the rule
above names, and the ledger's phase order is the execution order.

## Writing the phases

1. Read the router's `read-set` paths only (the bounded intake).
2. Draft each phase against the finding's own evidence — the row's `file:line`
   and route cells are the authority; do not reopen the whole repository.
3. Lint every phase with `phase-contract` and record
   `Phase-lint: PASS (8/8) · fingerprint P<n>:<layer>:<n-tasks>:<slug>` in the
   SPEC's `### Phase-lint` block, exactly as the planners do.
4. Update the SPEC's phase-lint list and, when a phase changes an acceptance
   surface, propose the ACCEPTANCE amendment to the **user** — the executor
   never self-authorizes a manifest change.
5. Commit the ledger write on the unit's own branch, then hand off.

## Artifact-revision duty

This write is an authoring write of a governed artifact, so it owes the
rotation `evidence-grounding` owns:

- The write rotates `artifactRevisionId`: one write, one new opaque id for the
  whole set it touched. Record it in the hand-off.
- **A revert to previously published bytes is a new write** and gets a new id —
  that is what stops an old `PLAN-REVIEW-PASS` from reviving after a
  mutate-and-revert.
- The same id may be reused by several reviews of unchanged bytes, never across
  a write.
- The current id travels with the hand-off so the reviewer binds it into the
  snapshot it reviews. The executor does not review its own rotation; a fresh
  `/review-plan <unit>` is the only verdict over these bytes.

## Hand-off — never straight to execution

After the ledger write and its commit, print exactly:

```text
Replan appended: docs/<features|fix>/<unit>/SPEC.md
Phases: P<n> (+ P<n+1> …) · pid: <artifactRevisionId>
Findings closed by the append: <F1> + <F2> + …

→ Next: /review-plan <unit> — a fresh independent review of the re-cut plan
  · PLAN-REVIEW-PASS → /execute-phase <unit> (all remaining phases)
  · PLAN-REVIEW-FAIL → repair here as one batch, rotate the artifact revision, re-review
  · a finding owned by product → /design-feature <unit>, then /review-spec, then replan
```

The executor runs only after the fresh PASS; a plan-owned finding that reaches
code before its plan is re-reviewed is the dead end this contract removes.

## Guardrails

- **Never fold here.** The fold belongs to `execute-phase`'s fold cycle; this
  route repairs the plan the fold will read.
- **Never touch `review-findings.md`.** Classification and `folded` are owned by
  `review-change` and `fold-findings`.
- **Never widen scope** past the selected rows; a new need is a user decision.
- **Never skip the re-review.** The write invalidates the current plan receipt
  by design; only `/review-plan` restores currency.
