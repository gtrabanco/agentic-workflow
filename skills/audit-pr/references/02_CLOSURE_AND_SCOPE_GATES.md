## Closure and scope gates

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

## Pre-execution lineage and obligation closure (feature and fix PRs)

This gate sits downstream of both pre-execution reviews, so it verifies their
authority **survived the build** — it never re-reviews a plan and never re-judges a
verdict:

1. **Upstream lineage is current.** The unit's `progress.md` carries
   `## Pre-execution review receipt v1 — plan` whose digest re-derives
   to the same value (`scripts/pre-execution-snapshot.mjs verify --stage plan`;
   implementation-phase new-file additions are allowed, edits to a bound
   artifact are not), and — for
   a feature unit — the `— spec` receipt it names as its parent. Stale, missing, or
   wrong-stage lineage → **BLOCKED**, `→ Next: /review-plan <unit>` (or
   `/review-spec <unit>` when the parent is the broken link). A
   `SPEC-REVIEW-PASS` never satisfies the plan hop, and vice versa.
2. **Obligations are closed.** Every row of the unit's obligation ledger is
   `verified` — with the validator that ran on this candidate — or an explicit
   `n/a: <reason>`. Any `planned`, `in-progress`, blank, or `deferred` row is
   **BLOCKED**, naming the ids. `deferred` is legal only when the user amended the
   governing SPEC first (cite the amendment); without one it is an open obligation
   wearing a new name, and it may not be exported to a follow-up issue to clear the
   gate.
3. **Planning findings are resolved.** `planning-findings.md` holds no open row for
   the bound snapshot: a PASS may not coexist with an unresolved material finding.
4. **Authority is unchanged.** `audit-pr` remains the only emitter of `MERGE-READY`;
   a pre-execution PASS is upstream evidence, never a merge verdict, and nothing here
   merges, closes, comments down, or files an issue.

A legacy unit with no ledgers is not exempt: the missing ledgers must be constructed
and reviewed through the adoption route (the pre-execution gate in `execute-phase`'s
preflight) before MERGE-READY. The audit never coerces old evidence into the new
format, never edits `ACCEPTANCE.md`, and never accepts a hand-written table that the
plan snapshot does not bind.
