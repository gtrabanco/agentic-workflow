# Feature workflow (end-to-end)

From an idea or a feature-request issue to a merged PR — every step and the skill
that drives it. The lifecycle, per `CLAUDE.md`, is:

```
SPEC → PLAN → TASKS → execution by phase → hardening → verification → PR
```

## Stage 0 — Decide what you're building

Pick the entry point that matches where the work comes from:

| You have… | Use | Result |
|---|---|---|
| A rough idea, no issue | `design-feature` | An interview that fills the SPEC |
| A GitHub issue requesting a feature | `feature-from-issue` | Issue → filled SPEC, with `Closes #N` |
| An already-scoped feature/SPEC | `plan-feature` | Straight to artifact scaffolding |

All three **read the project first** (agent guide, documentation map,
architecture, roadmap, domain/style docs) so the feature respects the codebase's
real constraints.

### `design-feature` — the agentic interview

Restates your idea, then proactively asks — in small batched rounds, each with a
recommended default — about: problem & goal, scope (and what's OUT), architecture
impact (layers, ports, use-cases, adapters), data/schema, cross-cutting concerns
(i18n, SEO, a11y, domain rules, security), **dev scenarios** (happy path *and*
failure modes), acceptance criteria, dependencies, risks, and non-goals. It only
asks what the docs don't already answer, and offers to open a tracking issue.

### `feature-from-issue` — issue → feature

Reads the issue, **confirms it's actually a feature** (a bug/tech-debt gets
routed to `triage-issue`), translates to the docs language if needed, maps it to
the roadmap (number, slug, dependencies, conflicts), closes scope gaps with you,
and wires `Closes #N` for the eventual PR.

## Stage 1 — Plan: SPEC + artifacts (`plan-feature`)

`plan-feature` writes **docs only** into `docs/features/<NN>-<slug>/`:

- `SPEC.md` — every section filled (goals, architecture impact, acceptance,
  branch, dependencies, testing, dev scenarios).
- `PLAN.md`, `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`,
  `decisions.md`, `architecture-notes.md` — mirroring the set recent features use.

It then **registers the feature in the roadmap** (numbering, ordering,
dependencies). It does **not** create the branch or write code.

> Unknowns become open questions in `decisions.md` — never blank placeholders.

## Stage 2 — Execute, one phase at a time (`execute-phase`)

`execute-phase` (default mode) implements **one phase** per run:

1. Verifies the branch — creates `feat/<NN>-<slug>` if you're on `main`
   (it never works on `main`).
2. Reads `SPEC.md` + `TASKS.md` for the requested phase.
3. Implements **only that phase** (no bundling, no premature abstraction, no
   unrelated refactors).
4. Runs the project's verification gate (type-check, tests, build).
5. Updates `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` (and
   `decisions.md` if architecture moved).
6. Commits in conventional format — one commit per phase.
7. Stops for review.

Repeat for each phase (P1, P2, …). Small features are handled by `execute-phase`
in a single pass — no separate skill.

During execution, domain knowledge skills auto-load as guardrails: the
project's stack/domain guardrail skills (architecture pattern, domain rules,
framework, ORM, runtime/platform).

## Stage 3 — Hardening

A dedicated pass (run as a phase via `execute-phase`): edge cases, failure
modes from the SPEC's dev scenarios, empty/degraded states, races, idempotency,
error mapping, and disclosure rules (e.g. don't hide user-facing
limitations). Still
docs-updated and gate-verified like any phase.

## Stage 4 — Verification & review (whole branch)

Before opening the PR, run the review skills over the completed branch:

- `review-implementation` — two-phase review across bugs, architecture
  violations, removable/dead code (minus planned-feature code), security,
  platform/runtime incompatibilities, overengineering, bundle risks, and tests
  (failing **and** missing) → a **classified decision table** (fix-now /
  postpone / ignore / intentional-tradeoff), with WHY, implementation risk,
  long-term impact, and a premature-optimization flag. Findings only, no
  refactor; `fix-now` routes to `draft-fix-spec`, `postpone` to `triage-issue`.
- `/code-review` — correctness bugs + simplification over the diff.
- `/security-review` — security pass on the changes.
- `/verify` — run the app and confirm the change does what it claims.
- For UI features: `design-review`, `ux-audit`.

Re-run the gate (type-check, tests, build) green.

## Stage 5 — PR

- Base **always** `main`; the branch must be **independently mergeable**.
- **Never stack PRs.** If a feature is too large, split into independently
  shippable slices — never by internal phases.
- Conventional title; body includes `Closes #N` if it came from an issue.
- The pre-commit checklist (from `CLAUDE.md`): the gate (type-check, tests,
  build) green, no architecture violations, no hardcoded secrets, no hidden
  user-facing limitations, and any other project-mandated rules satisfied.

## Worked example

```
/design-feature  "<your feature>"
   → interview → SPEC dimensions resolved → offers to open issue
/plan-feature                       (invoked by design-feature)
   → docs/features/NN-<slug>/{SPEC,PLAN,TASKS,…}.md + roadmap entry
/execute-phase  NN  P1           → data/domain layer, gate green, commit
/execute-phase  NN  P2           → orchestration + adapter, gate green, commit
/execute-phase  NN  hardening    → edge cases, gate green, commit
/review-implementation              → findings + decision table (fix-now/postpone/ignore/tradeoff)
/code-review  ·  /security-review  ·  /verify
gh pr create --base main            → "Closes #<issue>"
```
