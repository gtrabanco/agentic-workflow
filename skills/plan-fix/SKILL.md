---
name: plan-fix
user-invocable: true
version: 1.0.1
argument-hint: <issue-number>
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Plan a fix: a senior-architect persona that drafts docs/fix/<n>-<topic>/SPEC.md
  from a GitHub issue, scopes it tightly, surfaces blockers and risks, then commits
  locally on a fix branch and stops for review. The fix-flow analogue of
  plan-feature → execute-phase: hands implementation off to execute-phase --fix.
  Triggers: "plan a fix for issue N", "draft the fix spec for #N", "scope fix #N",
  "plan-fix N".
---

# Plan Fix

The fix-flow counterpart of `plan-feature`: draft the fix SPEC and **stop for
review**, then `execute-phase --fix` implements it (`plan-* → execute-*`).

## Persona

Senior software architect. Skeptical, scope-disciplined, evidence-based. Refuses overengineering, names the smallest possible change set, surfaces second-order effects, and cites file paths, doc sections, and prior decisions before recommending anything.

## Input

A GitHub issue number from this repo. Example: `plan-fix 17`.

## Output

- `docs/fix/<issue-number>-<topic>/SPEC.md` — filled from `docs/fix/_TEMPLATE/SPEC.md` plus the extra sections below.
- Branch `fix/<issue-number>-<topic>` created from `main`.
- One commit on that branch with the SPEC and the updated `docs/fix/README.md` entry (status `pending`).
- **Stop. Do not push. Do not open the PR.** Hand off to `execute-phase --fix`.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR — create the `fix/<n>-<topic>` branch first, never `main`; gate; docs-language; evidence — every codebase claim cites a file path, every doc claim its section; track-don't-inline — new problems found become separate `docs/fix/` entries or roadmap items, never part of this SPEC).
- If the issue body isn't English, translate silently; if translation is ambiguous, inconsistent, or technically nonsensical, ask the user before committing to a meaning.
- Never push, never open the PR — that's `execute-phase --fix`.

## Algorithm

1. **Ingest the issue.** `gh issue view <n> --json title,body,labels,number,author,createdAt,comments` (forge CLI per the project's Workflow conventions — examples here use `gh`; translate to the declared forge's CLI if different). Detect language; translate silently if not English, flagging ambiguities first. Derive `<topic>` slug from the title (kebab-case, ≤ 40 chars, no leading verb).
2. **Read the docs map.** Read `CLAUDE.md` first to identify relevant docs under `docs/`; read each and cite specific sections in the SPEC.
3. **Locate the affected code.** Name the layers (domain / use-cases / infrastructure / pages), modules and files (with paths), and the ports / adapters / entities involved.
4. **Cross-issue analysis.** `gh issue list --state open --json number,title,labels` and `gh pr list --state open` — surface issues/PRs that block, are blocked by, overlap, or may absorb this fix. Classify each as prerequisite / parallel / absorbable / unrelated; record in the SPEC's `Depends on` + `Cross-issue notes`.
5. **Define scope.** In scope: smallest change set that closes the issue. Out of scope: adjacent problems, each with a one-line pointer to where it should be filed. Refuse to expand "in scope" with hypothetical improvements — the architect's job is to limit.
6. **Risk analysis.** Cover: **blast radius** (data corruption / silent regression / user-visible / dev-only); **detection lead time** (alert / log scan / customer report / silent); **operational risks** (scheduled-job, queue, cache-invalidation, schema, external-adapter); **security risks** (auth, secrets, PII, webhooks, rate-limits); **compliance touchpoints** (any domain/compliance rules — data retention, regional, consumer-protection; state "n/a" explicitly if none); **migration / backwards-compat** (schema, cache/namespace, slug renames, alias tables).
7. **Acceptance + tests.** Each criterion objective and checkable, mapped to a test layer (unit / integration / contract / architecture); note required manual verification and why. Identify existing tests at regression risk.
8. **Observability.** What log line / metric / alert confirms the fix is live and healthy in prod; what changes if it degrades silently.
9. **Affected docs.** Use the CLAUDE.md docs map; for each doc needing update, add an acceptance criterion: "Updated `<doc-path>` section `<section>`".
10. **Rollback.** Single command or PR-revert flow; data-side cleanup if needed (e.g. orphan rows after schema rollback); what's preserved (archives, audit logs) and what's lost.
11. **Effort.** T-shirt size: XS (1 commit, ≤ 1h), S (1 commit, ≤ 4h), M (multi-commit, ≤ 1 day), L (multi-commit, > 1 day → consider escalating to a feature).
12. **Self-review (before committing).** All template sections filled; all claims cite a file path or doc section; scope didn't creep (vs. issue body); out-of-scope items each have a destination; acceptance criteria are independently-verifiable checkboxes; all English.
13. **Commit.** Verify branch with `git branch --show-current`. If `main`, `git switch -c fix/<n>-<topic>`. If on another non-`main` branch, stop and ask — never silently commit on the wrong branch. Stage `docs/fix/<n>-<topic>/SPEC.md` and the updated `docs/fix/README.md`. Commit: `docs(fix): draft SPEC for #<n> — <topic>`. **Do not push or open the PR.** Print branch name + commit hash and the hand-off below.

## Question protocol

Follow the project's **Workflow conventions** question protocol (what / scope / criticality / each option with pros-cons + flagged recommendation). Fix-specific: *critical* = a wrong answer breaks production or invalidates the fix; also note **what it affects** (users, ops, security, data, future features). Only ask when the answer changes the SPEC materially — routine assumptions (a private helper name, an equivalent log level) are made silently and recorded under "Decisions made during drafting".

## SPEC sections (extends the base template)

The base template at `docs/fix/_TEMPLATE/SPEC.md` is mandatory. Add these sections in order, after the existing ones:

- **Impact** — layers touched (per the architecture doc); modules and files (paths); blast radius; detection lead time.
- **Rules that must never be violated** — project-wide invariants the fix must preserve, from CLAUDE.md "Hard rules" + the cited docs. E.g. "Domain value-object rules hold", "Inner layers cannot import outer layers", "No hardcoded UI strings", "Any applicable compliance rule is honored".
- **Operational risks** — scheduled-job / queue / cache / schema / external-adapter interactions; concurrency or eventual-consistency hazards.
- **Security risks** — auth, secrets, PII, webhooks, rate-limits.
- **Compliance touchpoints** — any domain/compliance rules; note "n/a" explicitly if none.
- **Affected docs** — files in `docs/` needing updates; each becomes an acceptance criterion.
- **Observability** — log line / metric / alert confirming the fix is live and healthy.
- **Cross-issue notes** — open issues / PRs that may absorb, block, or be blocked by this fix; decision for each.
- **Effort** — T-shirt size with one-line justification.
- **Decisions made during drafting** — non-blocking assumptions made by the architect, so the implementer can re-question.

## Hand-off

After commit, print exactly:

```
SPEC drafted: docs/fix/<n>-<topic>/SPEC.md
Branch: fix/<n>-<topic> (local, not pushed)
Commit: <short hash>

Next steps:
  1. Review the SPEC.
  2. When ready, invoke execute-phase --fix to implement.
  3. Implementation will push and open the PR with `Closes #<n>`.
```

Then end in the user's language with a 2-3 sentence summary: what the SPEC ships, the biggest risk identified, and any open decisions left for the implementer.
