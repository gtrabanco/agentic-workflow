---
name: audit-docs
user-invocable: true
version: 4.10.0
argument-hint: "[--fix]"
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Audit cross-document coherence: docs ↔ READMEs ↔ roadmap ↔ code ↔ fix index ↔ issues.
  Finds drift — features in docs/ not in the roadmap (or vice versa), fix-index
  entries already merged/closed, broken documentation-map links, dependency
  cycles, artifacts in the wrong language, naming-convention violations,
  project-charter coverage — and reports them ranked by severity, fixing only
  low-risk items on request.
  Model-agnostic: the skill inherits whatever model and effort your agent
  session is already using.
  Triggers: "check doc consistency", "are the docs in sync", "audit the docs",
  "doc coherence review", "did the docs drift", "validate the roadmap".
---

# Audit Docs

> **Runner commands** below are `bunx @gtrabanco/agentic-workflow@<pin> …` — read `<pin>`
> from [references/RUNNER.md](../runner-contract/references/RUNNER.md). It is stamped at
> release and never guessed: a hard-coded version re-opens the per-release sweep the
> contract removes, and `latest` is not a legal pin.

A read-first audit answering "do the docs still match reality?" Produces a
findings report; it does not silently rewrite docs.

## Turn contract

Load and verify the **canonical** [Turn contract](../orchestration-envelope/references/TURN_CONTRACT.md) (11 boxes) before ending every turn (the `--fix` path commits and pushes like any editing turn). Skill-specific additions (the `→ Next:` box is canonical-owned and not restated here):

```
✓ The AUDIT DOCS fixed-format report was printed, ending in `Decision: PASS | FAIL`
✓ No doc was rewritten without explicit --fix / user go-ahead
```

Missing reference → STOP. About to end the turn with any box unchecked? The
turn is NOT done — complete the missing box first (weak models drop
end-of-document duties; this list is first on purpose).

## When to use

- Before a release or milestone, after merging several features/fixes, or
  whenever the doc set might have drifted from the code and issues.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the roadmap, the fix index + template, and the feature
folder layout — the map tells you which links and invariants to check.

## Checks

Run these and collect findings (cite paths/lines/issue numbers each):

1. **Roadmap ↔ feature folders.** Every `docs/features/<NN>-<slug>/` is in the
   roadmap, and every roadmap entry has a folder (or is explicitly "scheduled").
2. **Feature dependencies.** SPEC `Depends on` / `Branch` fields are valid; no
   dependency cycles; ordering is consistent with the roadmap.
3. **Fix index hygiene.** Every entry maps to an **open** issue and an unmerged
   branch; flag entries whose issue is closed or whose PR merged (should have
   been removed). Flag open fix branches missing from the index.
4. **Documentation-map links resolve.** Every file the map references exists;
   flag "scheduled, not yet authored" items so they aren't mistaken for drift.
5. **Broken intra-doc links.** Relative links/anchors point at real
   files/sections.
6. **Issue references.** Acceptance/known-issues lines referencing `#N` aren't
   pointing at long-closed issues without note.
7. **Language & naming conventions.** Artifacts in the project's docs language
   (this repo: **English**); file/dir naming matches conventions (e.g.
   kebab-case TS files, PascalCase components).
8. **Invariant tags.** If the project uses invariant/decision IDs (e.g.
   INV-/D-/KI-), spot-check that referenced IDs exist where claimed.
9. **PR-link integrity on `done` rows.** Every roadmap row (and fix-index
   entry) with status `done` carries a linked PR reference —
   `done · [#<pr>](<pr-url>)`. For each bare `done`, find its PR in the forge
   (`gh pr list --state all --head feat/<NN>-<slug>` or by title) and propose
   the row update; a `done` with no PR found at all is HIGH severity (the unit
   may never have been closed out).

**Workflow discipline (checks 10–14)** — the executor skills enforce these at
write time; this audit verifies they actually held. Each check is mechanical:
run the command shown, don't infer.

10. **Phase naming — keyed on the carrier, like check 11.**
    - **lane-era** — `bunx @gtrabanco/agentic-workflow@<pin> phase-lint <unit-doc>` (owner
      `skills/phase-contract/SKILL.md`) must print `verdict PASS`, and
      `bunx @gtrabanco/agentic-workflow@<pin> ceremony docs check-phase-labels --slug <slug>` must
      answer `valid: true`. A `S#` hit in a lane-era doc is not a phase label:
      since #308 `S#` is the requirement id.
    - **legacy carriers only** — `grep -rnE '\bS[0-9]+\b|\bStep [0-9]' docs/features/*/{PLAN,TASKS,progress}.md`
      must return nothing: plans use `P1, P2, …` ("phases") only. Any hit: LOW
      (rename), plus check the executor argument still resolves; a hit quoting only
      the required `Step 0 — Discover the project` section is no phase label, and no
      count is restated here — the checker's own output enumerates them.
11. **Per-phase doc discipline — keyed on the unit's own carrier.** Pick the
    carrier mechanically, never by guess: `TASKS.md` in the unit folder means
    legacy carriage; its absence means the unit doc's `## Tasks`/`## Log`.
    - **lane-era** — `bunx @gtrabanco/agentic-workflow@<pin> ceremony docs check-tasks-ticks --slug <slug>`
      and `bunx @gtrabanco/agentic-workflow@<pin> ceremony docs check-progress-entry --slug <slug>` must
      both report `valid: true`: every `- [x] P<n>` has its `P<n>` line in
      `## Log`, and no task lacks one. Cite those two fields, never `check-all`
      (its `commit-format`/`docs-language` fields are checks 14 and 7). A doc with
      no `## Tasks` section answers `n/a` (`no ## Tasks section — legacy carrier`),
      so the vacuous case routes to the legacy branch, never to a silent pass.
    - **legacy** — the original assertions on that unit's own files: completed
      phases ticked in `TASKS.md`, one `progress.md` entry per completed phase,
      the literal close-out tasks in the final phase.
    - **Severity** — a ticked task with no `P<n>` log line, or a log naming a task
      never ticked: HIGH on a `done` unit (the doc claims a receipt its carrier
      lacks), LOW on an open one (still settling). A `done` unit written before
      the tick grammar (`- P<n>` bullets, receipts in `E` lines) is red on
      `check-progress-entry` by construction — LOW, recorded, **never repaired**
      (`MIGRATION.md`: a closed unit keeps the shape it was written in).
    - **Close-out** is `audit-pr`'s contract (receipt + ordered gates): cite its
      verdict, never re-derive the retired literal tasks here.
12. **Branch & PR discipline vs the forge.** For every `done` unit: its PR
    exists, targets the default branch, has a non-empty body, and carries
    `Closes #<n>` when the unit is issue-born (SPEC references an issue).
    Also scan recent default-branch history (`git log --first-parent`) for
    feature/fix-scoped changes committed directly without a PR: HIGH.
13. **Generated-docs provenance (only when the documentation map declares a
    `Docs site` block; otherwise state n/a).** Scan the declared content dir
    for pages carrying the renderer's own header (`Generated by
    scripts/docs-generate.mjs`). For each page that also carries
    `source-unit`/`updated`: (a) its `source-unit` exists in the roadmap or fix
    index — no match is an **orphan** (low: propose deletion or
    re-attribution); (b) the unit's PR merged **after** the page's `updated`
    date with commits touching the page's subject paths — that page is
    **stale** (LOW: propose `bun scripts/docs-generate.mjs` to re-render it).
    A renderer that emits no provenance fields answers
    `n/a — no provenance fields`, never a silent pass. Cite page path + unit
    per finding.
14. **Commit format & dependency discipline.** Sample the unit branches'
    commits: `<type>(<scope>): <summary>` conventional format (violations:
    LOW). Every `in-progress`/`done` row's `Depends on:` closure was merged —
    a unit built on unmerged deps is HIGH unless `decisions.md` records a
    user-forced override (`--force`), which downgrades it to LOW (documented
    risk).
15. **README currency against what shipped.** Run each README against the
    tree: `rg -n '<a retired name or stale claim>' README.md packages/*/README.md`
    and every hit that names a surface the tree no longer carries (a retired
    skill in an install/uninstall example, a command count or package count the
    tree contradicts, a "none yet" beside shipped subcommands) is **HIGH** —
    the claim misleads a reader who acts on it. Its mirror: a shipped,
    consumer-facing surface with no README entry at all is **HIGH** (the
    document-or-don't-coin residue read at README scope — `product-audit` owns
    the product-wide sweep, this check is the docs-tree half). Superseded prose
    left standing beside its replacement is **LOW**. Owners: the rule is
    `AGENTS.md` §Working rules, the step is `skills/unit-lane/references/DOCS.md`.
16. **Project-charter coverage (issue #435).** Applies when the agent guide
    declares the charter — a `## Project charter` section or a documentation-map
    row for the criteria catalogue; an older install that declares neither is
    stated `n/a` (absent structure, never a finding). Mechanical, the
    CAPABILITIES pattern — run the commands, never infer:
    - the declared map row's file exists — a row naming
      `docs/workflow/VERIFICATION_CRITERIA.md` with no such file is **HIGH**
      (the map points at nothing);
    - the charter section is present when either the section or the row is
      declared — a missing `## Project charter` section is **HIGH** (identity
      answers with no tier-0 home push agents back to guessing);
    - no unfilled charter slot survives — a bullet whose entire value is a `<…>`
      placeholder is the raw-template failure. The scan is **bounded to the
      `## Project charter` section**, because the guide's other honest
      placeholders — the Hard-rules stubs `init-workspace` leaves unfilled by
      design — are not the charter's finding, and a guide-wide scan reports them
      forever:

      ```text
      awk '/^## Project charter/{f=1; next} f && /^## /{f=0} f && /^- \*\*[^*]+:\*\* `?<[^>]+>`?$/ {print FILENAME":"FNR":"$0}' AGENTS.md   → prints nothing
      ```

      (the template's own file is the positive case — its 11 slots print with
      `path:line`; a legal `unresolved — <question>` value never matches; an
      identity bullet — the five the template names — is **HIGH**, a domain
      bullet **LOW**);
    - the catalogue carries no raw placeholder cell — same scan as the
      capability seed: `rg -n '\| *\`?<[^>]+>\`? *\|' docs/workflow/VERIFICATION_CRITERIA.md`
      must print nothing, and every criterion row's provenance cell is one of
      the closed set (`workflow-generic` / `project-declared` /
      `stamped assumption (dated)`) — a row naming none is **LOW** (it cannot
      be consumed as declared);

Adapt the list to what the project has; skip checks for absent structures and
say so.

## Process

1. Discover, then run the checks with `grep`, file reads, and the forge CLI
   (per Workflow conventions; examples use `gh`).
2. Produce the findings report — **return exactly** (fixed output contract):

   ```
   AUDIT DOCS — scope: <docs tree / roadmap / fix index / issues checked>

   | # | Check (1-16) | Finding | Sev | Evidence | Proposed fix |
   |---|-------------|---------|-----|----------|--------------|
   | 1 | <which>     | <what>  | high|low | <path:line / #issue> | <smallest action> |

   Checks run: <n>/16 (skipped: <which + why — absent structures only>)
   Summary: <1-2 sentences>
   Decision: PASS | FAIL   (FAIL if any high-severity finding is open)
   ```

   Sev: **high** = misleading or broken; **low** = cosmetic.
   Only `high` and `low` are defined in this legend
3. **Fix only on request.** With explicit `--fix` (or user go-ahead), apply the
   low-risk corrections (remove a merged fix-index row, fix a dead link, register
   a missing roadmap entry, add a verified PR link to a bare `done` row). Leave judgment calls to the user.

## Guardrails

- Read-first; never bulk-rewrite docs unprompted.
- Distinguish genuine drift from intentionally "scheduled/deferred" items —
  don't report deliberate tradeoffs as errors.
- Keep changes surgical and within docs; no code or behavior changes.

## Portability (agents other than Claude Code)

Preamble + no-slash-menu fallback: owned by `skills/orchestration-envelope/references/PORTABILITY.md` — this section
keeps only its own fallbacks:
- **No per-skill `model:`/`effort:`** — no skill pins a tier; pick tiers yourself:
  these are mostly mechanical cross-document checks — a mid-tier model is
  enough; escalate to your strongest only for a deep audit.

## Relationship to other skills

- Complements `unit-lane` (which *creates* the docs this audits) and
  `triage-issue` (which keeps the fix index honest).
- Run standalone anytime; no required predecessor.

## Done when

- A severity-ranked findings report exists, and any approved low-risk fixes are
  applied — with genuine deferrals left untouched and labeled as such.
- **The closing `→ Next:` block is printed:**

  ```
  → Next: apply the approved low-risk fixes, then re-run /audit-docs to confirm clean
    · real drift (not cosmetic) → /triage-issue   · a concrete defect → /unit-lane --fix <n>
    · already clean → nothing to do
  ```
