---
name: plan-fix
user-invocable: true
version: 2.2.0
argument-hint: <issue-number> [<issue-number> …]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Plan a fix: a senior-architect persona that drafts docs/fix/<n>-<topic>/SPEC.md
  from a GitHub issue, scopes it tightly, surfaces blockers and risks — always
  with a phased execution ledger (≥ 2 phases; the final one is Hardening & PR) —
  then commits locally on a fix branch and stops for review. The fix-flow
  analogue of plan-feature → execute-phase: hands implementation off to
  execute-phase --fix.
  On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "plan a fix for issue N", "draft the fix spec for #N", "scope fix #N",
  "plan-fix N".
---

# Plan Fix

The fix-flow counterpart of `plan-feature`: draft the fix SPEC and **stop for
review**, then `execute-phase --fix` implements it (`plan-* → execute-*`).

## Turn contract — verify before ending the turn

```
✓ The fix SPEC is committed on its `fix/<n>-<topic>` branch (commit sha pasted) — NOT pushed, NO PR
✓ The Hand-off block was printed exactly as specified
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## Persona

Senior software architect. Skeptical, scope-disciplined, evidence-based. Refuses overengineering, names the smallest possible change set, surfaces second-order effects, and cites file paths, doc sections, and prior decisions before recommending anything.

## Input

One or more GitHub issue numbers from this repo, space-separated.

- **One number** → `plan-fix 17`. Today's single-issue behavior, unchanged.
- **Multiple numbers** → `plan-fix 71 72 73`. Semantics deferred to Algorithm
  step 5 (Multi-issue resolution): all issues are ingested, then a fixed
  shared-root-cause checklist decides whether they merge into ONE unit or the
  skill refuses and prints the split.
- **Invalid input** (a non-number token, or an issue number that doesn't
  exist in this repo) → usage error naming the bad token; never proceed
  partially (see step 5).

## Output

- `docs/fix/<primary-issue-number>-<topic>/SPEC.md` — filled from
  `docs/fix/_TEMPLATE/SPEC.md` plus the extra sections below, including its
  `## Phases` execution ledger (**always ≥ 2 phases**; final =
  `Hardening & PR`). `<primary-issue-number>` is the single issue number for
  a one-number invocation, or the **lowest** issue number when multiple
  issues merge into one unit (Algorithm step 5). When issues merge, the SPEC
  scope lists every merged issue with its own acceptance criteria.
- Branch `fix/<primary-issue-number>-<topic>` created from `main`.
- One commit on that branch with the SPEC and the updated `docs/fix/README.md`
  entry (status `pending`, referencing every merged issue when applicable).
- **Stop. Do not push. Do not open the PR.** Hand off to `execute-phase --fix`.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR — create the `fix/<n>-<topic>` branch first, never `main`; gate; docs-language; evidence — every codebase claim cites a file path, every doc claim its section; track-don't-inline — new problems found become separate `docs/fix/` entries or roadmap items, never part of this SPEC).
- **Language precedence for every artifact**: explicit user instruction > the project's declared docs language > English — the conversation language never decides. If the issue body isn't in the artifact language, translate silently; if translation is ambiguous, inconsistent, or technically nonsensical, ask the user before committing to a meaning.
- Never push, never open the PR — that's `execute-phase --fix`.

## Algorithm

1. **Ingest the issue(s).** For each issue number passed (one or many), run
   `gh issue view <n> --json title,body,labels,number,author,createdAt,comments`
   (forge CLI per the project's Workflow conventions — examples here use `gh`;
   translate to the declared forge's CLI if different). Any token that isn't a
   number, or that `gh issue view` fails to resolve, stops the run with the
   **invalid-input** usage error (step 5) — never proceed with a partial set.
   Detect language per issue; translate silently if not English, flagging
   ambiguities first. Derive `<topic>` slug from the primary issue's title
   (kebab-case, ≤ 40 chars, no leading verb) — see step 5 for which issue is
   primary.
2. **Read the docs map.** Read `CLAUDE.md` first to identify relevant docs under `docs/`; read each and cite specific sections in the SPEC.
3. **Locate the affected code.** Name the layers (domain / use-cases / infrastructure / pages), modules and files (with paths), and the ports / adapters / entities involved — per issue, when multiple.
4. **Cross-issue analysis.** `gh issue list --state open --json number,title,labels` and `gh pr list --state open` — surface issues/PRs (other than the ones passed as input) that block, are blocked by, overlap, or may absorb this fix. Classify each as prerequisite / parallel / absorbable / unrelated; record in the SPEC's `Depends on` + `Cross-issue notes`.
5. **Multi-issue resolution.** Runs regardless of how many issues were passed — it's the gate before scope/phases drafting.
   - **One number** → today's behavior, byte-for-byte unchanged; skip to step 6 with that issue as primary.
   - **Multiple numbers** → ingest ALL issues (step 1), then evaluate the fixed **shared-root-cause checklist**, every box independently checkable:
     - ✓ the issues name the same defect class in the same files/surfaces (cite paths)
     - ✓ one fix would naturally cover them in the same commits (no issue needs work the others' files don't touch)
     - ✓ no issue requires a design decision the others don't (a "needs design call" issue never merges into a mechanical unit)
     - ✓ no conflicting severities/routes recorded in their triage verdicts
   - **All boxes tick** → ONE unit: primary = the **lowest issue number**; branch `fix/<primary>-<topic>`, SPEC `docs/fix/<primary>-<topic>/SPEC.md` whose scope lists every issue with its own acceptance criteria; the fix-index row references all; the PR will carry `Closes #<n>` for **each** issue (one per line). Print the fixed **merge-summary** output, verbatim:
     ```
     MULTI-ISSUE MERGE — #<primary> (+#<n2>, #<n3>, …)
     Shared-root-cause checklist: ALL 4 boxes ticked
       ✓ same defect class/files: <paths>
       ✓ one fix covers all in the same commits
       ✓ no issue needs a design decision the others don't
       ✓ no conflicting severities/routes in triage verdicts
     Unit: docs/fix/<primary>-<topic>/SPEC.md
     Issues merged: #<primary> (primary), #<n2>, #<n3>, …
     PR will carry: Closes #<primary>
                   Closes #<n2>
                   Closes #<n3>
     ```
     Then continue to step 6 and draft ONE SPEC covering every merged issue.
   - **Any box fails** → STOP. Never silently plan a subset; never silently plan only the first number. No SPEC is written. Print the fixed **refusal** output, verbatim, naming the failing box per issue pair:
     ```
     MULTI-ISSUE REFUSAL — cannot merge #<a>, #<b>[, …]
     Failing box(es):
       #<a> vs #<b>: <failing box name> — <one-line evidence>
       [repeat per failing pair]
     No SPEC written. Plan these separately:
       /plan-fix <a>
       /plan-fix <b>
       ...
     ```
     End the turn here — no further Algorithm steps run.
   - **Invalid input** (a non-number token, or an unknown issue) → usage error naming the bad token; never proceed partially (precedent: `review-change` `--adversarial N` invalid-input → usage error, `skills/review-change/SKILL.md` L229–233):
     ```
     Usage: plan-fix <issue-number> [<issue-number> …]
     Invalid token: "<token>" — not a number, or not an issue in this repo.
     ```
6. **Define scope.** In scope: smallest change set that closes the issue (or, when merged, every issue in the unit). Out of scope: adjacent problems, each with a one-line pointer to where it should be filed. Refuse to expand "in scope" with hypothetical improvements — the architect's job is to limit.
7. **Risk analysis.** Cover: **blast radius** (data corruption / silent regression / user-visible / dev-only); **detection lead time** (alert / log scan / customer report / silent); **operational risks** (scheduled-job, queue, cache-invalidation, schema, external-adapter); **security risks** (auth, secrets, PII, webhooks, rate-limits); **compliance touchpoints** (any domain/compliance rules — data retention, regional, consumer-protection; state "n/a" explicitly if none); **migration / backwards-compat** (schema, cache/namespace, slug renames, alias tables).
8. **Acceptance + tests.** Each criterion objective and checkable, mapped to a test layer (unit / integration / contract / architecture); note required manual verification and why. Identify existing tests at regression risk. When merged, each issue's acceptance criteria stay separately identifiable.
9. **Observability.** What log line / metric / alert confirms the fix is live and healthy in prod; what changes if it degrades silently.
10. **Affected docs.** Use the CLAUDE.md docs map; for each doc needing update, add an acceptance criterion: "Updated `<doc-path>` section `<section>`".
11. **Rollback.** Single command or PR-revert flow; name the data-side cleanup or state "none" explicitly (e.g. orphan rows after schema rollback); what's preserved (archives, audit logs) and what's lost.
12. **Effort.** T-shirt size: XS (1 commit, ≤ 1h), S (1 commit, ≤ 4h), M (multi-commit, ≤ 1 day), L (multi-commit, > 1 day → propose escalating to a feature via `plan-feature`; the user decides).
13. **Phases.** Fill the SPEC's `## Phases` section — the execution ledger `execute-phase --fix` runs one phase per invocation: `P1..Pn` implementation phases (minimum 1; each task independently checkable **without judgement**, zero open design decisions, one layer/concern, gate runnable locally — split the phase if any box fails), plus the final `P(n+1) — Hardening & PR` phase. Keep the template's pre-written `Hardening & PR` tasks **literally** — never paraphrase them, never merge them into an implementation phase. The total is **always ≥ 2 phases**, even for an XS one-line fix. Every implementation phase must pass the canonical 8-box phase-lint (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — the authoritative copy) before it is emitted; any FAIL means re-cut or split the phase, never emit it unticked.
14. **Self-review (before committing).** All template sections filled; all claims cite a file path or doc section; scope didn't creep (vs. issue body); out-of-scope items each have a destination; acceptance criteria are independently-verifiable checkboxes; the `## Phases` section has ≥ 2 phases and ends with the literal `Hardening & PR` tasks; every implementation phase passes all 8 phase-lint boxes; all English.
15. **Commit.** Verify branch with `git branch --show-current`. If `main`, `git switch -c fix/<primary>-<topic>`. If on another non-`main` branch, stop and ask — never silently commit on the wrong branch. Stage `docs/fix/<primary>-<topic>/SPEC.md` and the updated `docs/fix/README.md`. Commit: `docs(fix): draft SPEC for #<primary>[+#<n2>+…] — <topic>`. **Do not push or open the PR.** Print branch name + commit hash and the hand-off below.

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
SPEC drafted: docs/fix/<primary>-<topic>/SPEC.md
Branch: fix/<primary>-<topic> (local, not pushed)
Commit: <short hash>

→ Next: review the SPEC, then /execute-phase --fix <primary> — execute P1 (one phase per invocation)
  · the final `Hardening & PR` phase pushes and opens the PR with `Closes #<primary>`
    (and `Closes #<n2>`, `Closes #<n3>`, … — one line per merged issue, when applicable)
  · scope looks wrong → adjust the SPEC and re-run /plan-fix
```

Then end in the user's language with a 2-3 sentence summary: what the SPEC ships, the biggest risk identified, and any open decisions left for the implementer.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  architect-level scoping is judgment work — run it on your **strongest**
  model. The implementation it hands off to may run cheaper.

## Done when

- The fix SPEC is drafted from `docs/fix/_TEMPLATE/SPEC.md` plus the extra sections,
  scoped tightly with risks/blockers surfaced, registered in `docs/fix/README.md`,
  and committed locally on the `fix/<n>-<topic>` branch (not pushed, no PR).
- **The closing `→ Next:` block is printed** — the Hand-off block above (review the
  SPEC, then `/execute-phase --fix`).
