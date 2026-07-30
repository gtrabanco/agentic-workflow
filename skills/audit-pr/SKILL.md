---
name: audit-pr
user-invocable: true
version: 3.5.0
argument-hint: <pr-number> (optional — defaults to the current branch's PR)
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  PR-level merge gate. Audits the WHOLE pull request (not just the diff) against a
  merge-readiness contract: SPEC acceptance criteria met, all phases complete, docs
  updated per the doc map, Closes #N present when issue-born, tests added at the
  right layer, CI green, branch off the default branch and independently mergeable,
  the review-change axes clean (or consciously deferred to tracked issues), and the
  governing feature SPEC's capability closure taken and recorded (closure-integrity
  gate — legacy SPECs warn, never block).
  Verdict: merge-ready, or a ranked list of blockers — always with the PR's full
  URL printed, and on MERGE-READY a dated, SHA-bound comment posted on the PR
  itself. Never edits; never merges by default — with a documented auto-merge
  policy (or an explicit user instruction) it merges a MERGE-READY PR after a
  fail-closed pre-merge checklist (clean tree, nothing unpushed/unpulled, fresh
  green CI on the audited SHA).
  On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "is this PR ready to merge", "audit the PR", "merge gate for #N",
  "can this ship", "pre-merge review", "audit-pr".
---

# Audit PR

The manager's **"can this ship?"** gate. A read-first audit over the *entire* PR —
its SPEC, all phases, docs, tests, CI, and review axes — that returns a single
verdict: **merge-ready** or a ranked list of **blockers**. **Never edits, never
refactors.** By default it never merges either — the human decides and merges.
The one exception is the **opt-in auto-merge** below: a documented policy (or an
explicit user instruction) plus a fail-closed pre-merge checklist.

## Turn contract — verify before ending the turn

```
✓ The verdict block was printed in the fixed format: `VERDICT: MERGE-READY | BLOCKED` with ranked, evidenced blockers
✓ The PR's FULL URL is printed in the verdict header (the user may be juggling
  several projects and agents without a CI monitor — the link in the chat is
  the contract, never "PR #N" alone)
✓ MERGE-READY verdict? Then the MERGE-READY comment was POSTED on the PR
  (`gh pr comment --body-file` RUN, idempotent by SHA marker) — a comment,
  never a commit-message tag. BLOCKED → no comment posted
✓ Nothing was edited or refactored; nothing was merged UNLESS the auto-merge
  policy applied AND the pre-merge checklist was RUN with its output pasted
✓ Closure integrity was evaluated and its result stated explicitly: pass /
  blocker / warning / n-a (fix-governed PRs are always n-a; never skipped
  silently)
✓ Scope integrity (descope) was evaluated and its result stated explicitly:
  pass / blocker / n-a (no unit-referencing issues born on the branch → n-a;
  never skipped silently)
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

## Merge-readiness contract

Check each gate; cite evidence (file:line, criterion, check name, issue number).
A gate that can't be confirmed is a **blocker**, not a pass — never assume green.

| Gate | What it means | Blocker when |
|---|---|---|
| **Acceptance criteria** | Every SPEC acceptance criterion is satisfied, each mapped to concrete evidence (code, test, or doc). | Any criterion unmet, unverifiable, or silently dropped. |
| **All phases complete** | Feature: every phase in `PLAN.md`/`TASKS.md` is done and logged in `progress.md`. Fix: the SPEC is fully implemented. | Any unchecked task or unimplemented phase without an explicit, tracked deferral. |
| **Scope integrity (creep)** | The PR implements the SPEC and no more; out-of-scope work was split out. | Undocumented scope creep, or in-scope work missing. |
| **Docs updated** | Every "Affected docs" criterion is satisfied; per-phase docs (`progress`/`testing`/`known-issues`/`decisions`) reflect reality; the doc map still resolves. **Never merge with documentation still pending.** | A doc the map or SPEC requires is stale, missing, pending, or contradicts the code. |
| **Traceability** | `Closes #N` is in the PR body when the work is issue-born (from `plan-feature-from-issue` or `plan-fix`); the roadmap/fix-index entry matches, is **still present** (removed only *after* merge, never before), and carries the linked PR reference (`done · [#<pr>](<pr-url>)`). | Issue-born work without `Closes #N`; a roadmap/index entry out of sync; the entry dropped before merge; or a `done` row without its PR link. |
| **Tests** | New behavior is covered at the right layer (prefer integration); acceptance criteria map to tests; no regression-risk tests left red. | New behavior untested, or tests assert nothing meaningful. |
| **Verification gate / CI** | The project's gate passes — type-check, tests, build — and `statusCheckRollup` is green. | Any required check failing, pending, or absent where the project requires one. |
| **Mergeability** | Branch is off the default base, independently mergeable (no conflicts), not stacked on another PR, not draft. | Wrong base, conflicts, stacked dependency, or still draft. |
| **Review axes clean** | The applicable `review-change` axes are clean **or** every remaining finding is *consciously deferred* to a tracked issue with a trigger. | A `fix-now` finding still open, or a deferral with no issue/trigger behind it. |
| **Closure integrity** | The governing **feature** SPEC's capability closure was taken and recorded — `design-feature` was actually run, not bypassed. Fix-governed PRs: `n/a` (no closure block by design). | A present `Capability closure` block has a blank row, or a resolved non-`n/a` row with no matching acceptance criterion. |
| **Scope integrity (descope)** | An issue born during this unit that maps to an unmet SPEC acceptance criterion or phase task has a matching, user-approved, dated `## Amendments` entry — descoped scope was recorded, not silently exported. Detection is two-path: a slug/issue-number text match, **or** an issue linked from an `## Amendments` row (`#89`) — either is sufficient to enumerate the issue, so a descoped issue with a generic title/body is not invisible to the gate. | An issue born since branch divergence that references this unit (by either detection path) maps to an unmet criterion/task with no matching `## Amendments` entry, or an `## Amendments` row that is undated, unapproved, or unlinked to an issue. |

> Run `review-change` for the axis check if it hasn't been run on the final state,
> or read its latest report. Don't re-litigate findings already classified — verify
> each open one is either resolved or has a real, tracked home.

> **Closure integrity — fixed output.** Detection is purely mechanical: grep the
> governing SPEC for a `Capability closure` heading — match the heading text, not
> a fixed level (SPECs nest it as `### Capability closure` under `## Product half`;
> older ones use `## Capability closure`) — never dates, never versions, never
> judgment.
> - **Fix-governed PR** (`docs/fix/<n>-<topic>/SPEC.md`) → **n/a**, always. Fix
>   SPECs carry no closure block by design; never emit a warning for one.
> - **Feature SPEC, block present** → evaluate the three boxes, each a blocker
>   on failure:
>   1. the block exists in the SPEC (true whenever this path is reached)
>   2. zero blank rows — every entity/capability/role row is either filled
>      (UI + API + test) or carries an explicit `n/a: <reason>`
>   3. every resolved non-`n/a` row maps to a listed acceptance criterion
>   `n/a: <reason>` is a **fully valid, passing** row — the gate verifies the
>   decision was *taken and recorded*, never that UI/API surface exists. Never
>   push a blank row into inventing surface to pass this gate.
> - **Feature SPEC, block absent** → the SPEC predates or bypassed
>   `design-feature`. Never a blocker — emit a dated **warning**, PR still
>   merges:
>   ```
>   design-debt: closure absent, SPEC predates the rule (dated <YYYY-MM-DD>)
>   ```
>   This warning is itself the **retrofit trigger**: the next unit of work that
>   touches this feature must fill the closure via `/design-feature <slug>`
>   (upsert — fills only the missing rows, destroys nothing recorded) *before*
>   that new work is planned. See `design-feature`'s upsert semantics for the
>   other half of this contract.

> **`done` ≠ merge-ready.** A unit flips to `done` when its PR opens (built, not
> merged — merge state lives in the forge). So a `done` roadmap row is *not* evidence
> of merge-readiness: this gate still has to pass on its own. The two things this gate
> most often catches on a `done`-but-unmerged unit are **pending docs** and a
> **prematurely-removed issue/fix-index entry** — both are blockers.

> **Scope integrity (descope) — fixed output.** A cheap way to look finished is
> to quietly convert unfinished SPEC scope into a follow-up issue — the unit
> reads as done, the scope silently moved to the backlog. This gate catches it
> mechanically, keyed off the same `## Amendments` log `execute-phase`'s
> descope guard writes to (single source — see that skill's *Descope guard*
> section):
> 1. List issues **born since the branch diverged**
>    (`git log <base>..HEAD --format=%ad --date=short | tail -1` for the
>    earliest commit date, then `gh issue list --state all --search
>    "created:>=<date>"`) that **reference this unit**, via **either** of two
>    detection paths — a hit on either is sufficient, run both, never only the
>    first:
>    - **text match** — title/body mentions the feature/fix slug or issue
>      number, or
>    - **`## Amendments` link** (`#89`) — the issue is linked from a row in
>      the governing SPEC's `## Amendments` section (the same log
>      `execute-phase`'s descope guard writes to — single source, see that
>      skill's *Descope guard*), **regardless of the issue's own title/body
>      text**. This closes the coverage gap a generic-titled or slug-unaware
>      descoped issue leaves in the text-match path alone: an issue linked
>      from an amendment row is unambiguously about this unit no matter what
>      it's titled.
> 2. For each such issue (from either path), run the per-issue checklist:
>    - ✓ the SPEC criterion/task it touches is still **met in the PR** — pass,
>      it's discovered work or already covered, or
>    - ✓ a matching `## Amendments` entry exists in the governing SPEC
>      (dated, **user-approved**, and **linked** to this issue's number) — pass,
>      the descope was properly recorded
>    - neither holds → **BLOCKER**.
> 3. Symmetrically, every `## Amendments` row in the governing SPEC must itself
>    be dated, user-approved, and link a real, existing issue — an `## Amendments`
>    row missing any of those is also a **BLOCKER** (a hollow amendment is the
>    same failure as no amendment at all).
> - **Scope:** any SPEC-governed PR — **feature and fix** alike, both carry
>   acceptance criteria a lazy run could export. No issues born during the unit,
>   or none referencing it → the gate **passes** (nothing was exported).
> - This gate never re-litigates whether the *original* criterion was reasonable
>   — only whether its descope, if any, was recorded and approved before the
>   issue was filed.
> - **Backstop, not primary.** `execute-phase`'s creation-time descope guard
>   (`skills/execute-phase/SKILL.md` *Descope guard*) is the **primary**
>   control — it stops a descope from ever reaching an issue without an
>   approved `## Amendments` entry first. This gate is the **backstop** that
>   catches what the primary control missed (a descope-filed issue from a
>   session that bypassed the guard, or a hand-filed issue). The `## Amendments`
>   -link detection path (`#89`) widens this backstop's *coverage* only — it
>   changes nothing about `execute-phase`'s own contract or precedence.

## Process

1. **Gather** — Step 0: project contract, PR, SPEC + artifacts, CI status.
2. **Walk the contract** — evaluate every gate above against evidence. For each,
   record pass / blocker / n-a with the specific artifact or check that proves it.
3. **Confirm deferrals are real** — for anything postponed (an unchecked task, a
   review finding, a known issue), verify a tracked issue + trigger exists. A
   deferral with no destination is a blocker, not a pass.
4. **Decide** — one verdict:
   - **MERGE-READY** — every applicable gate passes; list the few things the human
     should still eyeball (the manual-verification items `review-change` surfaced).
   - **BLOCKED** — one or more gates fail; output the ranked blocker list.
5. **Persist blockers to the fold ledger (BLOCKED verdict only).** Every blocker
   on a **BLOCKED** verdict is, by definition, fix-now — merge is gated on it.
   Append each to the unit's fix-now fold ledger `review-findings.md` (same
   location and fixed schema
   `| id | file:line | axis | severity | class | route | folded |` as
   `review-change`'s persist step) — the **same ledger**, not a separate one
   (D4: the fold cycle consumes one list). **Merged unit → no write** — check
   `gh pr view --json state`; `MERGED` skips the persist step entirely. For
   each blocker: `file:line` = the cited evidence location (the gate name
   when no single line applies); `axis` = the gate name (e.g. `Tests`,
   `Docs`, `Traceability`); `severity` = `high` (a blocker gates the merge by
   definition); `class` = `fix-now`; `route` = the routing this skill's own
   Routing section assigns to that kind of blocker; `folded` starts `no`.
   Re-runs **dedupe by `file:line` + axis**, identical to `review-change`'s
   rule — a blocker already on the ledger at that `file:line`+axis is not
   re-appended; a genuinely new blocker gets the next `Fn` id.
6. **Post the MERGE-READY comment on the PR (MERGE-READY only).** The verdict
   must be visible on the PR itself — as a **comment**, never in a commit
   message (a commit trailing "MERGE-READY" pollutes history and goes stale
   the moment the branch moves). Write the body to a file (Markdown rule —
   see Guardrails) and run
   `gh pr comment <N> --body-file <path>` with exactly this body:

   ```markdown
   <!-- audit-pr:merge-ready sha=<head SHA> -->
   ## ✅ audit-pr: MERGE-READY

   - **Audited head:** `<head SHA>` · CI: <green|local-gate-green>
   - **Date:** <YYYY-MM-DD>
   - **Before merge, a human should still verify:**
     - <manual-verification item — or "nothing">

   Any commit after `<head SHA>` voids this verdict — re-run `audit-pr`.
   ```

   **Idempotent:** first check the existing comments
   (`gh pr view <N> --json comments`) for the `<!-- audit-pr:merge-ready -->`
   marker — same SHA already commented → skip (say so); older SHA → post the
   new comment (the newest marker wins). Never post a comment for a BLOCKED
   verdict — blockers go in the chat report only, so the PR page never shows
   a stale green flag.
7. **Auto-merge check (only on MERGE-READY)** — evaluate the opt-in auto-merge
   section below. Policy present + pre-merge checklist green → merge and report
   the merge evidence. Otherwise the human merges — say so explicitly.
8. **Report** — the verdict block below, always headed by the PR's full URL.

## Auto-merge (opt-in — default is the human merges)

By default this skill **never merges**. It merges a MERGE-READY PR only when
**both** keys hold:

1. **Written authorization.** The project's docs state the policy — e.g.
   `merge: auto` / `merge: fullauto` in the agent guide's Workflow conventions
   or the committed decision record (`docs/features/SHIP_DECISIONS.md`) — **or**
   the user explicitly instructed it in this conversation ("merge it if
   merge-ready"). An inferred preference, a past session, or convenience is
   never authorization.
2. **Pre-merge checklist — RUN it fresh, paste the outputs; fail-closed** (any
   box that cannot be evaluated counts as failed):

   ```
   ✓ VERDICT is MERGE-READY, issued in THIS turn, bound to the PR's current
     head SHA (re-check the head via the forge — any later commit voids it)
   ✓ `git status --porcelain` → empty (nothing uncommitted — code or docs)
   ✓ `git fetch` + `git status -sb` (on the PR branch) → neither ahead nor
     behind its remote (nothing unpushed, nothing unpulled)
   ✓ Remote head SHA == the SHA this audit evaluated
   ✓ CI re-checked green on that exact SHA via the forge at merge time (no-CI
     project: a fresh local gate run on that SHA, output pasted)
   ✓ The PR touches no declared sensitive area and contains no destructive
     (data-deleting / schema-destructive) diff
   ✓ The forge accepts the merge (a refusal — branch protection, conflicts —
     parks the PR; never bypass, never force)
   ```

3. **Anything pending → do NOT merge, even with authorization.** Uncommitted or
   unpushed work would make the PR's CI result stale the moment it lands.
   The sequence is fixed: route the pending work (commit + push via
   `execute-phase`'s fold cycle) → wait for CI on the new head → **re-run
   `audit-pr`** → only a fresh MERGE-READY on the new SHA may merge. Never
   merge on a stale verdict.

After a successful merge: print the merged PR URL + merge SHA, and route the
post-merge close-out (pull the default branch; remove/archive the fix-index
entry per the project's convention — only now, never before).

## Verdict format

```
PR #<N> — <title>
URL: <full PR URL — always printed; the user works across several projects
     and not every agent shows a CI monitor or PR list>
Base: <default> ← Head: <branch> @ <head SHA>   CI: <green|failing|pending>

VERDICT: MERGE-READY | BLOCKED (<count> blockers)

Blockers (ranked):
  1. [<gate>] <what's wrong> — evidence: <file:line | check | criterion>
     → fix: <smallest action to clear it> (<route>)
  ...

Warnings (non-blocking — never change the verdict):
  - design-debt: closure absent, SPEC predates the rule (dated <YYYY-MM-DD>)

Non-blocking nits:
  - <minor item> — <pointer>

Before merge, a human should still verify:
  - <manual-verification item from review-change>

→ Next:
  Print the ONE verdict bullet that matches, THEN — if a closure warning fired —
  also print the closure bullet (a warning never blocks, so it co-occurs with a
  MERGE-READY verdict; the two lines print together, never one instead of the other):
  · MERGE-READY, no auto-merge policy → you merge: <full PR URL>, then
    /plan-feature --next (the next roadmap unit) or pick an issue with /triage-issue
  · MERGE-READY, auto-merge authorized → merged (URL + merge SHA above), then
    /plan-feature --next or /triage-issue
  · MERGE-READY but pending commit/push/pull found → NOT merged: commit + push,
    wait for CI, re-run /audit-pr (a fresh verdict on the new SHA decides)
  · BLOCKED → clear the top blocker (routed above), then re-run /audit-pr
  · Closure warning (in addition to the verdict above) or a closure blocker →
    /design-feature <slug> — fills the missing closure rows (upsert, destroys
    nothing) before further work on this feature is planned; re-run /audit-pr after
  · Scope-bleed blocker → record the missing `## Amendments` entry (user-approved,
    dated, linking the issue) in the governing SPEC, or re-classify the issue as
    genuinely discovered work via /triage-issue; re-run /audit-pr after
```

If MERGE-READY, omit the blocker list and state it plainly: nothing blocks merge.
The `→ Next:` block is always printed — on MERGE-READY it repeats the **full PR
URL** (merge it yourself, or the merged link) and points the user at the next
concrete unit so a finished feature never dead-ends at the merge.

Example (generic — substitute your project's numbers and gates):

```
PR #142 — Add CSV export to the reports view
Base: main ← Head: feat/14-csv-export   CI: green

VERDICT: BLOCKED (2 blockers)

Blockers (ranked):
  1. [Tests] Export handler has no test — acceptance criterion "export
     round-trips the rows" is unverified
     → fix: add an integration test for the handler (fold into the current phase)
  2. [Traceability] PR body is missing `Closes #131` for issue-born work
     → fix: add `Closes #131` to the PR body (execute-phase)

Non-blocking nits:
  - Help text wording diverges from the other commands — docs/USAGE.md

Before merge, a human should still verify:
  - The exported file opens cleanly in a spreadsheet app (visual)
```

## Routing (blockers, by kind)

- **Incomplete in-scope work** → fold into this branch via `execute-phase`
  (the relevant phase or `--fix`); re-run `audit-pr` after.
- **Out-of-scope defect surfaced** → `plan-fix` (new fix entry), not this PR.
- **Deferred finding lacking a home** → `triage-issue` to file + classify it.
- **Stale/missing docs** → update per the doc map (often a quick `execute-phase`
  doc commit), then re-audit.
- **Red CI / failing gate** → report the failing check; the dev fixes on-branch.

## Guardrails

## Normalized Repository State

Audit against frozen NRS facts in `docs/workflow/REPOSITORY_STATE.md` and report conflicts as contradictions. This audit
is read-only: only `resolve-repository-state` may update a frozen fact or decision.

- **Read-first verdict. Never push, edit, or refactor.** The only forge writes
  this skill may perform: (1) the **MERGE-READY comment** (Process step 6 —
  idempotent, comment-only, never a commit tag), and (2) the opt-in
  **auto-merge** — written policy or explicit instruction, MERGE-READY on the
  current SHA, pre-merge checklist green, outputs pasted. One key missing →
  the human ships.
- **Forge bodies are Markdown, not shell — never hand-escape.** The comment's
  backticks are formatting; a `\` before them renders literally. Write the
  body to a file and pass `--body-file <path>` — never inline `--body "…"` or
  a quoted heredoc. Verify with `gh pr view <N> --json comments` that no
  literal `` \` `` survived.
- **Never merge with anything uncommitted, unpushed, or unpulled** — even when
  auto-merge is authorized. Pending work makes the CI evidence stale: commit +
  push, wait for CI, re-audit, and only the fresh verdict may merge.
- Never report MERGE-READY on an unconfirmed gate — absence of evidence is a blocker.
- Don't re-run the full review from scratch; compose `review-change` and verify its
  open findings are resolved or tracked.
- Honor the project's **Workflow conventions** (gate, docs-language, evidence —
  every blocker cites file:line/check/criterion/issue — track-don't-inline:
  out-of-scope problems become issues/fix entries, never silent additions here).

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  the merge gate is the highest-stakes automated verdict — run it on your
  **strongest** model, never on the cheap tier that wrote the code.

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
- On MERGE-READY the auto-merge check was evaluated explicitly: merged with the
  checklist output pasted (authorized + clean), or handed to the human with the URL,
  or held back pending commit/push/pull with the re-audit sequence printed.
- The **closing `→ Next:` block is printed** (merge link → then the next unit via
  `/plan-feature --next` or `/triage-issue`; BLOCKED → the routed fix, then re-audit).
- Nothing was edited or refactored; any merge is traceable to the policy key and
  the pasted checklist.
