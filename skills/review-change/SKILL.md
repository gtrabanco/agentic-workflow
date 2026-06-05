---
name: review-change
user-invocable: true
argument-hint: [path-or-glob]
model: opus
effort: high
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

- Before opening a PR, or mid-feature (`execute-phase` calls it every 2 phases).
- When you want the *right* reviews for this change without running irrelevant
  passes (e.g. accessibility on a backend change).

## Scope

Default target is the **current change** (branch diff vs the default branch);
accept a path/glob to widen or narrow. State the scope at the top of the report.

## Step 0 — Discover the project & the change (always first)

Decide which axes apply from two inputs:

1. **Project nature** — read the agent guide and its documentation map. Is there a
   UI (`docs/frontend/` present)? Is it web, mobile, console/CLI, library/SDK, or
   backend/infra? Note the companion review skills the project expects (its
   `init-workspace` records them).
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
2. **Applicable externals.** For each axis the matrix + footprint mark as relevant,
   invoke the project's review skill for it (`code-review`, `security-review`,
   `verify`, `design-review`, `accessibility-review`, `brand-review`, `tech-debt`,
   the perf/SEO skills). **Skip the rest** and say which you skipped and why.
3. **Missing companions.** If an applicable skill isn't installed, note the gap and
   do a best-effort inline pass for that axis rather than failing.
4. **Synthesize.** Merge all findings into **one** decision table, deduped by
   `file:line`. Keep `review-implementation`'s columns (Sev, Class, WHY, impl risk,
   long-term impact, premature-opt?, route) and add an **Axis** column.
5. **Manual-verification checklist.** List what automated review **cannot** confirm
   and a human must check — visual correctness, real-device/locale behavior, UX
   feel, perf under load, anything marked *verify*. Be explicit so the dev has zero
   doubt about what to eyeball.

## Routing

- **fix-now** → `plan-fix` → `execute-phase --fix`, or fold into the current phase
  if it's unmerged work.
- **postpone** → open a tracked issue with a trigger; `triage-issue` owns it.
- **intentional-tradeoff** → record it (comment / `decisions.md` / issue).
- **ignore** → note the rationale.

## Guardrails

- **Findings + tables only. Never refactor or edit code.**
- Run only applicable axes; never an irrelevant pass (no a11y/SEO/brand for
  CLI/lib/infra). Always report what was skipped and why.
- Evidence-backed: cite `file:line`; mark uncertainties *verify*, don't assert.
- Report language = the project's docs language.

## Relationship to other skills

- Composes `review-implementation` (engine) + the project's companion review skills.
- Sits in Stage 4 of the feature workflow; `execute-phase` triggers it every 2
  phases. `fix-now` → `plan-fix`; `postpone` → `triage-issue`.
- `audit-pr` is the PR-level gate; `product-audit` the periodic full sweep.

## Done when

- One synthesized, classified decision table across all **applicable** axes exists,
  the skipped axes are listed with reasons, the manual-verification checklist is
  explicit, every finding is routed — and **no code changed**.
