---
name: audit-pr
user-invocable: true
version: 4.1.0
argument-hint: <pr-number> (optional — defaults to the current branch's PR)
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Audit a whole PR against the delivery contract and return MERGE-READY or
  evidenced blockers with the full URL. Posts a SHA-bound ready comment; never
  edits or merges. Triggers: "audit-pr", "is this PR ready", "merge gate".
---

# Audit PR

The manager's **"can this ship?"** gate. A read-first audit over the *entire* PR —
its SPEC, all phases, docs, tests, CI, and review axes — that returns a single
verdict: **merge-ready** or a ranked list of **blockers**. **Never edits,
refactors, or merges.** The human merges, or an active
`ship-roadmap --fullauto` invocation consumes the SHA-bound verdict and performs
its separate fail-closed merge step.

## Turn contract — verify before ending the turn

```
✓ The verdict block was printed in the fixed format: `VERDICT: MERGE-READY | BLOCKED` with ranked, evidenced blockers
✓ The PR's FULL URL is printed in the verdict header (the user may be juggling
  several projects and agents without a CI monitor — the link in the chat is
  the contract, never "PR #N" alone)
✓ MERGE-READY verdict? Then the MERGE-READY comment was POSTED on the PR
  (`gh pr comment --body-file` RUN, idempotent by SHA marker) — a comment,
  never a commit-message tag. BLOCKED → no comment posted
✓ Nothing was edited, refactored, or merged; merge authorization is outside
  this skill and cannot be inherited from docs or an earlier session
✓ Closure integrity was evaluated and its result stated explicitly: pass /
  blocker / warning / n-a (fix-governed PRs are always n-a; never skipped
  silently)
✓ Scope integrity (descope) was evaluated and its result stated explicitly:
  pass / blocker / n-a (no unit-referencing issues born on the branch → n-a;
  never skipped silently)
✓ Architectural-invariant preservation was evaluated and its result stated
  explicitly: pass / blocker / n-a (no project document → n-a; never skipped)
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- After the work is "done" and before merging — the final gate once `review-change`
  is clean and all phases are committed.
- When you want one defensible answer to "is this PR actually ready?" rather than
  trusting that every loose end was tied off.

`review-change` reviews the *diff* for quality; `audit-pr` audits the *PR as a unit
of delivery* — that everything the SPEC promised is present, traceable, and green.

## Scope

The whole pull request: the branch vs. the default base, **plus** its SPEC and
planning artifacts, the roadmap entry, the doc map, the PR body, issue links, and
CI. Default target is the current branch's PR; accept a PR number to target another.

## Step 0 — Discover the project & the PR (always first)

1. **Project contract.** Per the agent guide's **Workflow conventions** +
   **documentation map**, then read what THIS skill needs: the roadmap, the
   feature/fix templates, and the project's verification gate (type-check / tests
   / build / CI).
2. **The PR.** Identify it and read it in full (forge CLI per the project's
   Workflow conventions — examples use `gh`):
   ```sh
   gh pr view <N> --json number,title,body,baseRefName,headRefName,isDraft,mergeable,mergeStateStatus,files,commits,statusCheckRollup,closingIssuesReferences
   ```
   If no PR number is given, resolve the current branch's PR
   (`gh pr view --json ...`). If none exists yet, audit the branch vs. the default
   base and say "no PR open yet" — the contract still applies.
3. **The SPEC.** Locate the governing SPEC — `docs/features/<NN>-<slug>/` (feature)
   or `docs/fix/<n>-<topic>/` (fix) — and its planning artifacts (`PLAN.md`,
   `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`, `decisions.md`) when
   present. The SPEC is the source of truth for what "done" means.


## Progressive loading — mandatory audit route

The reference allowlist is exactly the six linked paths below. Never invent or
read another `references/` path. After discovery, every audit loads and applies
exactly these five mandatory resources in order:

1. [01 merge gates](references/01_MERGE_GATES.md) for delivery, CI, traceability,
   review, and mergeability evidence.
2. [02 closure and scope gates](references/02_CLOSURE_AND_SCOPE_GATES.md) for
   capability closure and descope provenance.
3. [03 audit process](references/03_AUDIT_PROCESS.md) to gather, decide, persist
   blockers, and post the SHA-bound MERGE-READY comment.
4. [04 verdict](references/04_VERDICT.md) before output, then
   [05 routing and guardrails](references/05_ROUTING_AND_GUARDRAILS.md). These
   mandatory resources own the `docs/workflow/REPOSITORY_STATE.md` evidence
   rules and Architectural invariants gate.

Read [portability](references/PORTABILITY.md) only when the declared forge or
agent actually lacks a named primitive; otherwise skip it. The project artifact
`docs/workflow/REPOSITORY_STATE.md` is evidence, not a skill reference. All
resources are one hop from this file. Missing evidence or a missing required
resource is a blocker; never infer a pass.

## Merge ownership

This skill **never merges**, including when project docs contain `merge: auto`,
the user previously approved a merge, or a tool retained an earlier permission.
Those signals cannot change this skill's read-first boundary.

The **sole automated merge authority** is the AUDIT stage of an actively invoked
`ship-roadmap --continue --fullauto` run. It requires both the flag on that
invocation and `merge: fullauto` in `SHIP_DECISIONS.md`, then calls the repository
wrapper only after consuming this turn's MERGE-READY verdict. The wrapper owns
fresh head/CI/sync checks, transient state, merge execution, cleanup, and the
automerge PR comment. A standalone/manual call to this skill always hands the
MERGE-READY URL to the human.


## Portability

Translate forge commands, never the gate semantics. Use the explicit fallbacks
in [portability](references/PORTABILITY.md).

## Relationship to other skills

```
execute-phase (all phases done) ─▶ review-change (axes clean) ─▶ audit-pr ─▶ merge
                                                                    │
                          blockers ─┬─ in-scope  ▶ execute-phase ──┘ (re-audit)
                                    ├─ out-of-scope ▶ plan-fix
                                    └─ deferral     ▶ triage-issue
```

- Consumes `review-change` (axis cleanliness) and the artifacts of `plan-feature` /
  `plan-fix` / `execute-phase` (SPEC, phases, docs, `Closes #N`).
- `audit-docs` is the cross-document coherence check; `audit-pr` is per-PR merge
  readiness; `product-audit` is the periodic, product-wide full sweep.

## Done when

- Every applicable gate has a pass / blocker / n-a verdict backed by cited evidence.
- A single top-line verdict (**MERGE-READY** or **BLOCKED** with ranked blockers) is
  reported **with the PR's full URL in the header**, each blocker routed, with the
  human's manual-verification list explicit.
- On MERGE-READY the merge owner is explicit: a standalone audit hands the URL
  to the human; an active `ship-roadmap --fullauto` AUDIT stage receives the
  SHA-bound verdict and owns every later merge check.
- The **closing `→ Next:` block is printed** (merge link → then the next unit via
  `/plan-feature --next` or `/triage-issue`; BLOCKED → the routed fix, then re-audit).
- Nothing was edited, refactored, or merged.
