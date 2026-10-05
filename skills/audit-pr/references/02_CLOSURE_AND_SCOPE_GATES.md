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
>   `unit-lane`. Never a blocker — emit a dated **warning**, PR still
>   merges:
>   ```
>   design-debt: closure absent, SPEC predates the rule (dated <YYYY-MM-DD>)
>   ```
>   This warning is itself the **retrofit trigger**: the next unit of work that
>   touches this feature must fill the closure via `/unit-lane <slug>`
>   (upsert — fills only the missing rows, destroys nothing recorded) *before*
>   that new work is planned. See `unit-lane`'s design-step upsert semantics for the
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

1. **Upstream lineage is current** — keyed by the surface the unit carries (fix/285;
   the lane-era pipeline structurally never writes `progress.md` or
   `ACCEPTANCE.md`, so demanding them made the gate unsatisfiable for every
   lane-era unit — issue #285):
   - **Lane-era unit** (feature 61's single-doc contract: no `progress.md`) —
     the unit doc's Evidence section carries the `## Triaged steps` block, and
     its `Steps:` line re-derives identically from the doc's own facts: run
     `bun scripts/unit-route.mjs --triage <unit>` and compare the block
     verbatim (steps, skipped, budget). The triage block is a pure function of
     the unit doc — a missing block, or a `Steps:`/`Skipped:`/`Budget:` line
     that differs → **BLOCKED**,
     `→ Next: /unit-lane <unit> --retriage`. An absent ledger section
     (`### Planning evidence` / `### Obligations`) on a lane-era unit is a
     producer defect, not an audit pass: the lane's plan step writes them
     (see item 2). The gate also requires ≥1 row in the obligation ledger
     — an empty `### Obligations` table (zero rows) is treated as **BLOCKED**
     and routed to the lane's plan step, because a vacuous obligations table
     cannot demonstrate that every obligation was verified; if there are truly
     no obligations, the section must carry a single `n/a: <reason>` row.
     An absent ledger section without any row (not even an `n/a:` placeholder)
     → **BLOCKED**,
     `→ Next: /unit-lane <unit> --retriage`.
     
     **Non-author-controlled discriminator.** The triage block re-derivation
     does not depend on any author-controlled artifact (`progress.md` /
     `ACCEPTANCE.md`); it is a pure function of the unit doc's own content,
     so a unit cannot choose a weaker gate by omitting an author-controlled
     marker. The triage `Steps:` line comparison is a deterministic, fixed-
     output check (not a subjective judgment) and is bounded by the unit's
     own scope.
     
     **Frozen digest anchor.** The triage block comparison is anchored by a
     frozen digest: `bun scripts/unit-route.mjs --triage <unit>` can emit a
     digest of the triage block alongside the block text; the audit compares
     both the block and the digest. The digest is derived from the unit doc's
     content at the time of the triage run, so a later tampering of the unit
     doc will produce a different digest. A digest anchor is optional: the
     block-verbatim comparison alone is sufficient for lane-era currency.
   - **Legacy unit** (carries `progress.md` receipts) — the unit's
     `progress.md` carries
     `## Pre-execution review receipt v1 — plan` whose digest re-derives
     identically (`scripts/pre-execution-snapshot.mjs verify --stage plan
     --parent <the receipt's Product digest>`; a fix unit binds no parent —
     `structural.reasonCode`/`changedPaths` name the drifted dimension), and —
     for a feature unit — its named `— spec` parent re-derives the same way.
     The acceptance manifest binds when present (fix/285): a unit that carries
     `ACCEPTANCE.md` still binds it in the snapshot. Bound artifacts
     are frozen: new implementation-phase files are allowed, edits to a bound
     artifact are not. Stale, missing, wrong-stage **or impossible-timeline**
     lineage → **BLOCKED**, `→ Next: /unit-lane <unit>` (the lane's `review`
     step re-derives the artifact).
   A `SPEC-REVIEW-PASS` never satisfies the plan hop, and vice versa.
2. **Obligations are closed.** Every row of the unit's obligation ledger —
   `### Obligations` inside the unit doc (embedded shape) or
   `planning-obligations.md` (separate-file shape, per the sizing rule in
   `pre-execution-review`'s `LEDGERS.md`; never both) — is
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
