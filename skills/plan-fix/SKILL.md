---
name: plan-fix
user-invocable: true
version: 2.5.0
argument-hint: <issue-number> [<issue-number> …]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Draft and locally commit a tightly scoped, phased fix SPEC from one or more
  issues, then stop before push/PR and hand off to execute-phase --fix. Triggers:
  "plan-fix", "plan a fix for issue N", "draft the fix spec".
---

# Plan Fix

The fix-flow counterpart of `plan-feature`: draft the fix SPEC and **stop for
review**, then `execute-phase --fix` implements it.

## Turn contract — verify before ending the turn

```
✓ The fix SPEC is committed on its `fix/<n>-<topic>` branch (commit sha pasted) — NOT pushed, NO PR
✓ The Hand-off block was printed exactly as specified
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English artifacts unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete the
missing box first (weak models drop end-of-document duties).

## Persona

Senior software architect. Skeptical, scope-disciplined, evidence-based. Refuses overengineering, names the smallest possible change set, surfaces second-order effects, and cites paths/sections/decisions before recommending anything.

## Input

One or more GitHub issue numbers from this repo, space-separated.

- **One number** → `plan-fix 17`. Today's single-issue behavior, unchanged.
- **Multiple numbers** → `plan-fix 71 72 73`. Planning-process step 5 ingests all
  issues, then a fixed shared-root-cause checklist decides whether they merge into
  ONE unit or the skill refuses and prints the split.
- **Invalid input** (a non-number token, or an issue number that doesn't exist in
  this repo) → usage error naming the bad token; never proceed partially (see
  planning-process step 5).

## Output

- `docs/fix/<primary-issue-number>-<topic>/SPEC.md` — filled from
  `docs/fix/_TEMPLATE/SPEC.md` plus the extra sections below, including its
  `## Phases` execution ledger (**always ≥ 2 phases**; final =
  `Hardening & PR`). `<primary-issue-number>` is the single issue number for
  a one-number invocation, or the **lowest** when multiple issues merge into
  one unit (planning-process step 5); merged SPECs list every issue with its own
  acceptance criteria.
- Branch `fix/<primary-issue-number>-<topic>` created from `main`.
- One commit on that branch with the SPEC and the updated `docs/fix/README.md`
  entry (status `pending`, referencing every merged issue when applicable).
- **Stop. Do not push. Do not open the PR.** Hand off to `execute-phase --fix`.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR — create the `fix/<n>-<topic>` branch first, never `main`; gate; docs-language; evidence — every codebase claim cites a file path, every doc claim its section; track-don't-inline — new problems become separate `docs/fix/` entries or roadmap items, never part of this SPEC).
- **Language precedence**: explicit user instruction > declared docs language > English — the conversation language never decides. If the issue body isn't in the artifact language, translate silently; if translation is ambiguous, inconsistent, or nonsensical, ask before committing to a meaning.
- Never push, never open the PR — that's `execute-phase --fix`.

## Progressive loading — validate before drafting

The reference allowlist is exactly the four paths below:

1. Every invocation: read [planning process](references/PLANNING_PROCESS.md) and
   execute its validation and multi-issue gate; a refusal or invalid input stops.
2. Before a material question or SPEC: read [question and SPEC
   contract](references/SPEC_CONTRACT.md).
3. Any route that can write a fix SPEC: consume the [planning preflight](<../planning-preflight/SKILL.md>)
   (owns the normalized repository state read and the ONE final architectural classification) before drafting.
4. Before emitting phases: load the [phase contract](<../phase-contract/SKILL.md>) for the 8-box phase-lint and phase fingerprint.

Resources are normative and one hop from this file. Missing required resource → stop; never approximate the fixed blocks or phase rules.

## Hand-off

After commit, print exactly:

```
SPEC drafted: docs/fix/<primary>-<topic>/SPEC.md
Branch: fix/<primary>-<topic> (local, not pushed)
Commit: <short hash>

→ Next: review the SPEC, then /execute-phase --fix <primary> — execute P1 (one phase per invocation)
  · the final `Hardening & PR` phase pushes and opens the PR with `Closes #<primary>`
    (and `Closes #<n2>`, `Closes #<n3>`, … — one line per merged issue, when applicable)
  · scope looks wrong → adjust the SPEC and re-run /plan-fix
```

Then end in the user's language with a 2-3 sentence summary: what the SPEC ships, the biggest risk, and any open decisions left for the implementer.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step it enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — pick tiers yourself: architect-level
  scoping is judgment work — run it on your **strongest** model. The
  implementation it hands off to may run cheaper.

## Done when

- The fix SPEC is drafted from `docs/fix/_TEMPLATE/SPEC.md` plus the extra sections,
  scoped tightly with risks/blockers surfaced, registered in `docs/fix/README.md`,
  and committed locally on the `fix/<n>-<topic>` branch (not pushed, no PR).
- **The closing `→ Next:` block is printed** — the Hand-off block above (review the
  SPEC, then `/execute-phase --fix`).
