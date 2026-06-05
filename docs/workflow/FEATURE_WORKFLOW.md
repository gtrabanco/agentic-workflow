# Feature workflow (end-to-end)

From an idea or a feature-request issue to a merged PR — every step and the skill
that drives it. The lifecycle, per `CLAUDE.md`, is:

```
SPEC → PLAN → TASKS → execution by phase → hardening → verification → PR
```

## Stage 0 — Decide what you're building

**One entry point** — `plan-feature` — detects where the work comes from and
routes to the right internal step:

| You have… | Invoke | The router runs | Result |
|---|---|---|---|
| A rough idea, no issue | `plan-feature "<idea>"` (or `--interview`) | `plan-feature-interview` | An interview that fills the SPEC |
| A GitHub issue requesting a feature | `plan-feature <N>` (or `--from-issue N`) | `plan-feature-from-issue` | Issue → filled SPEC, with `Closes #N` |
| An already-scoped feature/SPEC | `plan-feature <slug>` (or `--scaffold`) | `plan-feature-scaffold` | Straight to artifact scaffolding |
| Nothing — take the next roadmap item | `plan-feature --next` | picks the next `planned` entry | Scaffolds it (interviews if it's thin) |

All paths **read the project first** (agent guide, documentation map,
architecture, roadmap, domain/style docs) so the feature respects the codebase's
real constraints. You only ever call `plan-feature`; the internal steps below are
invoked for you (they never appear in the menu).

### The idea path — `plan-feature-interview`

Restates your idea, then proactively asks — in small batched rounds, each with a
recommended default — about: problem & goal, scope (and what's OUT), architecture
impact (layers, ports, use-cases, adapters), data/schema, cross-cutting concerns
(i18n, SEO, a11y, domain rules, security), **dev scenarios** (happy path *and*
failure modes), acceptance criteria, dependencies, risks, and non-goals. It only
asks what the docs don't already answer, and offers to open a tracking issue.

### The issue path — `plan-feature-from-issue`

Reads the issue, **confirms it's actually a feature** (a bug/tech-debt gets
routed to `triage-issue`), translates to the docs language if needed, maps it to
the roadmap (number, slug, dependencies, conflicts), closes scope gaps with you,
and wires `Closes #N` for the eventual PR.

## Stage 1 — Plan: SPEC + artifacts (`plan-feature-scaffold`)

Once the feature is scoped, the router runs `plan-feature-scaffold`, which writes
**docs only** into `docs/features/<NN>-<slug>/`:

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

## Stage 4 — Review & audit (whole branch)

`execute-phase` hands off to `review-change` at a checkpoint every 2 phases; before opening
the PR, run the final review and the merge gate over the completed branch:

- **`review-change`** — the orchestrator. Runs only the reviews that **apply to
  this platform** and synthesizes one **classified decision table** plus an
  explicit manual-verification checklist. It composes:
  - `review-implementation` — two-phase review across bugs, architecture
    violations, removable/dead code (minus planned-feature code), security,
    platform/runtime incompatibilities, overengineering, bundle risks, and tests
    (failing **and** missing), each classified fix-now / postpone / ignore /
    intentional-tradeoff with WHY, impl risk, long-term impact, and a
    premature-opt flag.
  - `/code-review`, `/security-review`, `/verify`, and — for UI —
    `design-review`, `accessibility-review`, `brand-review` (only the applicable
    ones; never an irrelevant pass).

  Findings only, no refactor; `fix-now` routes to `plan-fix` (or folds into the
  current phase if it's unmerged work), `postpone` to `triage-issue`.
- **`audit-pr`** — the merge gate. Acceptance criteria met, all phases complete,
  docs/tests/CI green, `Closes #N` present, branch independently mergeable, and
  the review axes clean → **merge-ready or a list of blockers**.

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
/plan-feature  "<your feature>"     → router detects an idea → interview
   → SPEC dimensions resolved (offers to open a tracking issue)
   → scaffolds docs/features/NN-<slug>/{SPEC,PLAN,TASKS,…}.md + roadmap entry
/execute-phase  NN  P1              → data/domain layer, gate green, commit
/execute-phase  NN  P2              → orchestration + adapter, gate green, commit
   → review checkpoint (every 2 phases): run /review-change → classified table + manual checks
/execute-phase  NN  hardening       → edge cases, gate green, commit
/review-change                      → final review: the applicable axes, classified
/audit-pr                           → merge gate: merge-ready or blockers
gh pr create --base main            → "Closes #<issue>"
```
