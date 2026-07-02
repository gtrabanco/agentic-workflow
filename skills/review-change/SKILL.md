---
name: review-change
user-invocable: true
version: 1.4.0
argument-hint: <path-or-glob>
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Platform-adaptive review orchestrator. Reviews the current change by running
  review-implementation (find → classify) AND invoking only the review skills that
  apply to this project and this change (code, security, verify, design,
  accessibility, brand, tech-debt, perf, SEO) — never the inapplicable ones (no
  accessibility/SEO/brand for a CLI, library, or infra change). Synthesizes one
  classified report plus an explicit manual-verification checklist. Findings only —
  never refactors. Triggers: "review this change", "full review before merge",
  "review-change", "run the right reviews for this", "what should I check before PR".
---

# Review Change

The quality gate for a change: get every review that *applies* — and skip the ones
that don't — in one synthesized, classified report. **Findings only; never edits
or refactors.**

## When to use

- **Mandatory before every merge** — every unit (feature, single-pass, or fix) gets a
  `review-change` pass; it's never skipped. `execute-phase` hands off to it every 2
  phases and once more at the end.
- When you want the *right* reviews for this change without running irrelevant
  passes (e.g. accessibility on a backend change).

## Scope

Default target is the **current change** (branch diff vs the default branch);
accept a path/glob to widen or narrow. State the scope at the top of the report.

## Step 0 — Discover the project & the change (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
decide which axes apply from two inputs:

1. **Project nature** — from the guide/map: is there a UI (`docs/frontend/`
   present)? Is it web, mobile, console/CLI, library/SDK, or backend/infra? Note
   the companion review skills the project expects (its `init-workspace` records
   them).
2. **Change footprint** — what the diff actually touches (UI components? an API?
   infra? domain logic?). An axis applies only if **both** the project has it
   **and** the change touches it.

## Applicability matrix (default; the project's docs refine it)

| Axis / skill | Web | Mobile | Console/CLI | Lib/SDK | Backend/Infra |
|---|---|---|---|---|---|
| `review-implementation` (bugs, arch, security, dead code, perf, tests, rules) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `code-review` (correctness + simplification) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `security-review` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `verify` (run it, confirm real behavior) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tech-debt` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `design-review` (UI/UX) | ✓ | ✓ | TUI only | ✗ | ✗ |
| `accessibility-review` | ✓ | ✓ | rare | ✗ | ✗ |
| `brand-review` (voice/copy) | ✓ | ✓ | output text | ✗ | ✗ |
| perf (`web-perf` on web; complexity/profiling elsewhere) | ✓ | ✓ | ✓ | ✓ | ✓ |
| SEO | ✓ | ✗ | ✗ | ✗ | ✗ |
| API ergonomics / usage docs | if API | if API | flags/help | ✓✓ | ✓ |

## Process

1. **Findings engine.** Run `review-implementation` over the scope → its classified
   decision table (fix-now / postpone / ignore / intentional-tradeoff).
2. **SPEC drift check.** Locate the governing SPEC (feature or fix) and compare
   the diff against its scope and acceptance criteria: flag work that contradicts
   the SPEC, silently exceeds it, or leaves a claimed criterion untouched.
   Findings get axis `spec-drift` in the table. Catching drift at a phase
   checkpoint is far cheaper than at the `audit-pr` merge gate. (No SPEC found →
   note it and skip.)
3. **Applicable externals.** For each axis the matrix + footprint mark as relevant,
   invoke the project's review skill for it (`code-review`, `security-review`,
   `verify`, `design-review`, `accessibility-review`, `brand-review`, `tech-debt`,
   the perf/SEO skills). **Skip the rest** and say which you skipped and why.
4. **Missing companions.** If an applicable skill isn't installed, note the gap and
   do a best-effort inline pass for that axis rather than failing.
5. **Synthesize.** Merge all findings into **one** decision table, deduped by
   `file:line`. Keep `review-implementation`'s columns (Sev, Class, WHY, impl risk,
   long-term impact, premature-opt?, route) and add an **Axis** column.
6. **Manual-verification checklist.** List what automated review **cannot** confirm
   and a human must check — visual correctness, real-device/locale behavior, UX
   feel, perf under load, anything marked *verify*. Be explicit so the dev has zero
   doubt about what to eyeball.
7. **Triage everything not fixed now.** For **every** finding you don't route to
   `fix-now` (postpone / ignore / intentional-tradeoff), run it through
   `triage-issue` (compose in-turn — i.e. within this same conversation/run; equal
   tier) to decide and record its home: a
   tracked issue with a trigger, a documented decision (`decisions.md` / a comment),
   or a justified drop. **No non-fix-now finding may end without a destination** — the
   point is to never silently lose one, and to catch the few that actually deserve an
   issue or a doc note.
8. **Next step.** Close with the `→ Next:` block:

   ```
   → Next: /audit-pr — merge gate (when the table is clean)
     · fix-now findings → fold into the branch, then re-review
     · non-fix-now → /triage-issue (issue / documented decision / justified drop)
     · SPEC drift flagged here AND on a prior unit → /product-audit (the founding
       assumptions are probably stale — don't keep patching a compounding error)
   ```

   The `/product-audit` line fires **only on recurring drift** — the same kind of
   inconsistency surfacing a second time, not a single isolated finding.

## Example output (generic)

For a change to a backend export module (no UI surface):

> Scope: branch diff vs `main` (`src/export/**`). Skipped: design / a11y / SEO /
> brand — no UI surface.

| Axis | Finding | Sev | Class | WHY | Route |
|---|---|---|---|---|---|
| security | API token read from a committed file | high | fix-now | Credential exposure | `plan-fix` |
| tests | Export handler has no failure-mode test | med | fix-now | Untested error path | fold into phase |
| perf | Full table loaded before filtering | low | postpone | Fine at current size | issue + trigger (>100k rows) |

> Manual-verification (automation can't confirm):
> - The exported file opens cleanly in a spreadsheet app.
> - An empty result set still produces a valid (header-only) file.

## Routing

Every non-`fix-now` finding is routed **through `triage-issue`** (step 7) so its
disposition is a decision, not a default:

- **fix-now** → `plan-fix` → `execute-phase --fix`, or fold into the current phase
  if it's unmerged work.
- **postpone** → `triage-issue` → open a tracked issue with a trigger.
- **intentional-tradeoff** → `triage-issue` → record it (comment / `decisions.md` / issue).
- **ignore** → `triage-issue` → note the rationale (or confirm it truly needs nothing).

## Guardrails

- **Findings + tables only. Never refactor or edit code.**
- Run only applicable axes; never an irrelevant pass (no a11y/SEO/brand for
  CLI/lib/infra). Always report what was skipped and why.
- Honor the project's **Workflow conventions** (docs-language, evidence): cite
  `file:line`, mark uncertainties *verify*.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
  "Compose in-turn" means the opposite: run that step within this same
  conversation, as part of this review.
- **No per-skill `model:`/`effort:`** — the frontmatter tiers state intent:
  this review needs your **strongest** model. Never review a change with a
  model weaker than the one that wrote it.

## Relationship to other skills

- Composes `review-implementation` (engine), `triage-issue` (every non-fix-now
  finding — equal tier, in-turn), and the project's companion review skills.
- Sits in Stage 4 of the feature workflow; `execute-phase` hands off to it every 2
  phases and for the mandatory end review (it runs in its own turn). `fix-now` →
  `plan-fix`; everything else → `triage-issue`.
- `audit-pr` is the PR-level gate it feeds; `product-audit` the periodic full sweep.

## Done when

- One synthesized, classified decision table across all **applicable** axes exists,
  the skipped axes are listed with reasons, and the manual-verification checklist is
  explicit.
- **Every finding has a destination:** fix-now routed, and every non-fix-now finding
  put through `triage-issue` (issue / documented decision / justified drop) — none
  silently lost.
- The **closing `→ Next:` block is printed** (clean → `/audit-pr`; recurring drift →
  `/product-audit`), and **no code changed**.
