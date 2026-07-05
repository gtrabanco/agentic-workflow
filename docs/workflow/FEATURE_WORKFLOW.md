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
(i18n, SEO, a11y, domain rules, security), a **UI design reference** when the
feature has a UI surface (build against a design, or flag a design pass before
coding), **dev scenarios** (happy path *and* failure modes), acceptance criteria,
dependencies, risks, non-goals, and a **size estimate** (`XS/S/M/L`) that decides
how much ceremony follows. It only asks what the docs don't already answer, and
offers to open a tracking issue.

### The issue path — `plan-feature-from-issue`

Reads the issue, **confirms it's actually a feature** (a bug/tech-debt gets
routed to `triage-issue`), translates to the docs language if needed, maps it to
the roadmap (number, slug, dependencies, conflicts), closes scope gaps with you,
and wires `Closes #N` for the eventual PR.

## Stage 1 — Plan: SPEC + artifacts (`plan-feature-scaffold`)

Once the feature is scoped, the router runs `plan-feature-scaffold`, which writes
**docs only** into `docs/features/<NN>-<slug>/`. **The artifact set scales to the
SPEC's `Size`:**

- **XS/S** (≤ one commit / ≤ half a day) — `SPEC.md` is the **only** planning
  artifact; no PLAN/TASKS ceremony. Next step: `execute-phase <NN>` (single-pass).
- **M/L** (phased work) — the full set:
  - `SPEC.md` — every section filled (goals, architecture impact, acceptance,
    branch, size, dependencies, testing, dev scenarios).
  - `PLAN.md` — phased plan whose **last implementation phase is always a
    hardening phase** (edge cases + the SPEC's dev-scenario failure modes,
    implemented and tested — not just documented).
  - `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`,
    `decisions.md`, `architecture-notes.md` — mirroring the set recent features use.
  - **L** also prompts: consider splitting into independently shippable features.

It then **registers the feature in the roadmap** (numbering, ordering,
dependencies). It does **not** create the branch or write code.

> Unknowns become open questions in `decisions.md` — never blank placeholders.

## Stage 2 — Execute, one phase at a time (`execute-phase`)

`execute-phase` (default mode) implements **one phase** per run:

1. Verifies the branch — creates `feat/<NN>-<slug>` if you're on `main`
   (it never works on `main`). **On P1 it first commits the planning artifacts
   separately** (`docs(NN-slug): planning artifacts`), so planning history
   stays apart from implementation.
2. Reads `progress.md` (what prior phases did), then `SPEC.md` + `TASKS.md`
   for the requested phase.
3. Implements **only that phase** — **tests first** on core/domain and
   orchestration work: the phase's acceptance/integration tests are written
   red, then implemented to green (the SPEC's dev scenarios are the test
   list). No bundling, no premature abstraction, no unrelated refactors.
4. Runs the project's verification gate (type-check, tests, build). **Never
   commits red** — an unfixable-within-scope failure goes to
   `known-issues.md` and execution stops with a report.
5. Updates `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` (and
   `decisions.md` if architecture moved). When reality contradicts the plan,
   `TASKS.md`/`PLAN.md` are updated and the why recorded in `decisions.md` —
   never a silent divergence.
6. Commits in conventional format — one commit per phase.
7. Stops for review (intermediate phases). The **final phase / single-pass instead
   flips the roadmap row to `done` and opens the PR** (never branch-only) — see
   Stage 5 — then the mandatory `/review-change` → `/audit-pr`.

Repeat for each phase (P1, P2, …). Small features (`Size: XS/S`) are handled by
`execute-phase <NN>` in a single pass — no separate skill; the single pass ends by
flipping the roadmap row to `done` and opening the PR, then the mandatory
`/review-change` → `/audit-pr`. To run all phases unattended (the per-2-phase
checkpoints are skipped, but the **mandatory** end review is not — it still runs once
before the PR), see the **batch execution with `/loop`** pattern in the
`execute-phase` skill.

> Want the **whole roadmap** built this way — every feature through every stage,
> with you only at the merges? That's the `ship-roadmap` autopilot: one upfront
> interview, then a `/loop`-driven run of this exact flow, feature by feature,
> ending in a final report. See its entry in [SKILLS.md](SKILLS.md).

During execution, domain knowledge skills auto-load as guardrails: the
project's stack/domain guardrail skills (architecture pattern, domain rules,
framework, ORM, runtime/platform).

## Stage 3 — Hardening

**Always the last implementation phase in `PLAN.md`** (the scaffold puts it
there for every M/L feature — it is not optional). Run as a phase via
`execute-phase`: edge cases, failure modes from the SPEC's dev scenarios,
empty/degraded states, races, idempotency, error mapping, and disclosure rules
(e.g. don't hide user-facing limitations). Still docs-updated and gate-verified
like any phase.

## Stage 4 — Review & audit (whole branch)

`execute-phase` **recommends** a `review-change` checkpoint every 2 phases (a
skippable suggestion — continuing to the next phase is a listed alternative)
**and hands off once at the end (mandatory — every unit gets a final review
before its merge gate)**. A finished unit
**always opens its PR and flips to `done`** (built, not merged — merge state lives in
the forge); the final review and the merge gate then run over the PR:

- **`review-change`** — the orchestrator. Runs only the reviews that **apply to
  this platform**, checks **SPEC drift** (does the diff actually do what the
  SPEC promises — nothing contradicted, silently exceeded, or left untouched?),
  and synthesizes one **classified decision table** plus an explicit
  manual-verification checklist. It composes:
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
  current phase if it's unmerged work); **every non-fix-now finding goes through
  `triage-issue`** (issue / documented decision / justified drop), never silently lost.
- **`audit-pr`** — the merge gate. Acceptance criteria met, all phases complete,
  docs/tests/CI green (**never merge with pending docs**), `Closes #N` present, the
  issue/fix-index entry still tracked (removed only after merge), branch independently
  mergeable, and the review axes clean → **merge-ready or a list of blockers**.

Re-run the gate (type-check, tests, build) green.

## Stage 5 — PR

- **The PR always opens — every unit, including a single-pass `XS/S` feature or a
  fix, never ends branch-only.** Opening the PR is the unit's last step and flips its
  roadmap/fix-index status to `done` (built, not merged).
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
   → recommended review checkpoint (every 2 phases, skippable): /review-change → classified table + manual checks
/execute-phase  NN  hardening       → edge cases, gate green, commit
   → final phase: flip roadmap to `done`, open the PR ("Closes #<issue>")
/review-change                      → mandatory final review; non-fix-now → triage-issue
/audit-pr                           → merge gate: merge-ready or blockers (never merge with pending docs)
   → human merges
```

(For a single-pass `XS/S` feature or a `--fix`, `execute-phase` does the implement →
mark-done → open-PR in one go, then the same mandatory `/review-change` → `/audit-pr`.)
