---
name: plan-fix
user-invocable: true
version: 3.1.0
argument-hint: <issue-number> [<issue-number> …]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Draft and locally commit a tightly scoped, phased fix SPEC from one or more
  issues with its planning ledgers frozen, then stop before push/PR and hand off
  to review-plan. Triggers: "plan-fix", "plan a fix for issue N", "draft the fix
  spec".
---

# Plan Fix

Fix-flow counterpart of `plan-feature`: draft the SPEC plus frozen acceptance and
the two planning ledgers, then stop. `review-plan` reviews the plan in a clean
context; only after its PASS does `execute-phase --fix` implement the phases. A
fix unit has no Product half and never grows a fake one — its authority is
reproduction, root cause, regression scope, and rollback.

## Turn contract — verify before ending the turn

```
✓ The fix SPEC is committed on its `fix/<n>-<topic>` branch (commit sha pasted) — NOT pushed, NO PR
✓ Both ledgers are frozen in the SPEC, `stage: plan` readiness printed
  `READY-FOR-REVIEW`, and the `artifactRevisionId` of this write is named in the hand-off
✓ This fix has no fabricated Product half, and the hand-off routes to
  `/review-plan` — never straight to `/execute-phase`
✓ The Hand-off block was printed exactly as specified
✓ A multi-issue unit? The hand-off names every issue once as `#primary + #n2 + …`; a single-issue unit names only its issue
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English artifacts unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete the
missing box first (weak models drop end-of-document duties).

## Persona

Senior software architect: skeptical, scope-disciplined and evidence-based.
Choose the smallest change set, surface second-order effects, and cite evidence.

## Input

One or more GitHub issue numbers from this repo, space-separated.

- **One number:** unchanged single-issue behavior (`plan-fix 17`).
- **Multiple numbers:** step 5 decides one capability bundle or homogeneous
  mechanical batch; different symptoms/files may merge when one outcome,
  validator and rollback boundary own them.
- **Invalid input:** name the bad token and stop; never proceed partially.

## Output

- `docs/fix/<primary>-<topic>/SPEC.md` — template plus required sections and a
  `## Phases` ledger (**always ≥2**; final `Hardening & PR`). Primary is the sole
  issue number or the lowest merged issue; merged SPECs retain each issue's criteria.
- `docs/fix/<primary-issue-number>-<topic>/ACCEPTANCE.md` — the compact frozen
  finish line from `verification-contract`, retaining one criterion per issue.
- `### Planning evidence` and `### Obligations` inside that SPEC — the two frozen
  ledgers ([planning ledgers](<../pre-execution-review/SKILL.md>)), with the fix
  rows `evidence-grounding` names: reproduction, root cause with code evidence,
  regression scope, rollback path, and the affected invariant or use case. A
  missing reproduction row is `unknown` with an owner, not "probably this".
- Branch `fix/<primary>-<topic>` from `main`.
- One local commit with SPEC and `docs/fix/README.md` (`pending`, all merged issues).
- **Stop: do not push/open PR.** Hand off to `review-plan`, then `execute-phase --fix`.

## Research and reference trace (plan stage)

- **Conditional web research.** Plan-stage research runs only when a bounded
  question (ROWS.md Q1–Q5) cannot be answered from repository evidence: run
  exactly one web pass before the phases are emitted and freeze what it
  returns as evidence rows (URL and access date). A question the repository
  answers is never re-fetched.
- **Mandatory reference trace.** Affected code is located by symbol/reference
  search — LSP/serena when the environment offers it, grep otherwise — and the
  blast radius is derived from that search, never from model memory: added or
  changed code can break callers the plan must name.

## Hard rules

- Honor Workflow conventions: create `fix/<n>-<topic>` first, never `main`; gate,
  docs language and evidence apply. Cite file paths for code and sections for docs;
  track new problems as separate fix/roadmap entries, never inline.
- **Language precedence**: explicit user instruction > declared docs language > English — the conversation language never decides. If the issue body isn't in the artifact language, translate silently; if translation is ambiguous, inconsistent, or nonsensical, ask before committing to a meaning.
- Never push, never open the PR — that's `execute-phase --fix`.

## Progressive loading — validate before drafting

The allowlist is exactly these five paths:

1. Every invocation: read [planning process](references/PLANNING_PROCESS.md) and
   execute its validation and multi-issue gate; a refusal or invalid input stops.
2. Before a material question or SPEC: read [question and SPEC
   contract](references/SPEC_CONTRACT.md).
3. Any route that can write a fix SPEC: consume the [planning preflight](<../planning-preflight/SKILL.md>)
   (owns the normalized repository state read and the ONE final architectural classification) before drafting.
4. Before emitting phases: load the [phase contract](<../phase-contract/SKILL.md>) for the 8-box phase-lint and phase fingerprint.
5. Before commit: consume the [verification contract](<../verification-contract/SKILL.md>)
   and write the frozen `ACCEPTANCE.md`.
6. While drafting: ground per [`evidence-grounding`](<../evidence-grounding/SKILL.md>)
   and freeze both ledgers per
   [`pre-execution-review`](<../pre-execution-review/SKILL.md>); before the
   hand-off run evidence-grounding's `stage: plan` readiness preflight and paste
   the block. `READY-FOR-REVIEW` licenses the hand-off; it is never a review
   verdict, and this skill does not review its own plan.

Resources are normative and one hop from this file. Missing required resource →
stop; never approximate fixed blocks or phase rules.

## Hand-off

After commit, print exactly:

```
SPEC drafted: docs/fix/<primary>-<topic>/SPEC.md
Branch: fix/<primary>-<topic> (local, not pushed)
Commit: <short hash>
Issue set: #<primary> + #<n2> + #<n3> (print every issue in this unit; single issue → #<primary>)

→ Next: /review-plan fix-<primary> — an independent context reviews this plan and
  these ledgers before any phase runs; /execute-phase --fix <primary> follows its
  PLAN-REVIEW-PASS (issue set #<primary> + #<n2> + #<n3>)
  · PLAN-REVIEW-FAIL → repair here as one batch, rotate the artifact revision, re-review
  · a product choice is open → /design-feature, then /review-spec, then replan this fix
  · after PASS, explicit atomic mode → /execute-phase --fix <primary> P<n> (same issue set)
  · the final `Hardening & PR` phase pushes and opens the PR with `Closes #<primary>`
    plus one `Closes #<n>` line for every other issue listed in the Issue set
  · scope looks wrong → adjust the SPEC and re-run /plan-fix
```

Replace every placeholder with the complete actual issue set before printing;
never print `<n2>`, `<n3>`, or `…` in a live hand-off.

Then end in the user's language with a 2-3 sentence summary: what the SPEC ships, the biggest risk, and any open decisions left for the implementer.

## Portability (agents other than Claude Code)

Use explicit fallbacks when a primitive is absent: open named `SKILL.md` files in
a fresh context; run architect-level scoping on the strongest model, then hand
implementation to a cheaper worker.

## Done when

- The SPEC and frozen `ACCEPTANCE.md` follow canonical contracts, surface
  risks/blockers, register in `docs/fix/README.md`, and are committed locally on
  `fix/<n>-<topic>` (not pushed/no PR). The closing `→ Next:` Hand-off is printed.
