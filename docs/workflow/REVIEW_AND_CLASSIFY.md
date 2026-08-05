# Review & classify — `review-change` + `review-implementation`

> 🇪🇸 [Versión en español](REVIEW_AND_CLASSIFY.es.md)

How to review a change. **`review-change`** is the platform-adaptive
**orchestrator**: it runs only the reviews that apply to this project + change and
synthesizes one report. **`review-implementation`** is its **findings engine** —
the two-phase, **no-refactor** review that ends in a **classified decision
table**. Reach for `review-change` for the full, right-sized review; call
`review-implementation` directly for a quick classified pass. Full specs live in
the skills (`.claude/skills/review-change/SKILL.md`,
`.claude/skills/review-implementation/SKILL.md`); this is the practical when/how.

## When to use it

- **Stage 4 of the feature workflow** — over the completed branch, right before
  opening the PR.
- **Mid-feature**, when you want a triaged read of what's wrong and what to
  actually do about it (not just a flat bug list).
- Whenever you'd otherwise run your two manual prompts — *"review for X, Y, Z —
  findings only"* then *"classify those findings into a decision table"*. This
  skill collapses both into one pass.
- Before a release cut or after a large refactor.

**Not for:** actually fixing code (it never refactors), or routine
type/test/build gating — that's the project's verification gate (type-check,
tests, build).

## How to invoke

- `/review-change` — the orchestrator: runs the applicable axes for this platform
  — each pass **isolated by default** (context-clean, returns only its findings
  table; in-turn composition is the fallback for agents that can't spawn fresh
  contexts) — and synthesizes one table + a manual-verification checklist. Use
  this before a PR.
- `/review-implementation` — just the engine; defaults to the **current branch diff
  vs `main`**.
- Pass a path/glob to widen or narrow scope, e.g. *"review-implementation on
  src/payments/"*.
- Both print the **scope** at the top, so you know what was and wasn't covered.

## What it produces (two phases, no refactor)

**Phase 1 — Find.** Findings (id + `file:line` + evidence) across: bugs,
architecture violations, removable/dead code, security/cybersecurity,
platform/runtime incompatibilities, overengineering & premature optimization,
bundle-size risk, and tests (failing **and** missing) — plus any project-rule
violations (whatever the project's docs mandate).

> **Dead-code exception:** code intentionally staged for an in-progress or
> planned feature is **not** dead. The skill cross-checks the roadmap, the
> feature SPEC/`TASKS.md`, and `known-issues.md`; if it can't tell, it marks the
> finding *verify* and asks — it never asserts "dead" on a guess.

**Phase 2 — Classify.** Every finding lands in a decision table:

| Finding | Axis | Sev | Class | WHY | Impl risk | Long-term impact | Premature-opt? | Route |
|---|---|---|---|---|---|---|---|---|
| API token committed to a config file | security | high | fix-now | Credential exposure | Low (move to secret store) | Incident risk | no | fold into phase |
| Fixing this backend bug pulls in an auth redesign | correctness | high | decision-required | Unavoidable product/architecture decision | — | Blocking | no | surface decision, block |
| Rate limiter reusable across the fleet | architecture | low | proposal | Independent of this unit (D3) | — | — | yes | batch proposal + trigger |
| Single-caller wrapper around a stdlib call | overengineering | low | ignore | Indirection with no payoff | — | Negligible | no | note rationale |

Classes: **fix-now / replan-in-unit / decision-required / proposal / ignore** — where `ignore`
claims "this is not a real defect" (decided first, on the claim alone). For current-unit work
only **fix-now** (folds into the open phase), **replan-in-unit** (new user-confirmed phases),
and **decision-required** (blocks until the user decides) exist; `postpone` / `tradeoff` /
`wontfix` / `disputed` and reviewer-created issues are **forbidden** for current-unit work
(AC 10). Only a truly independent future capability becomes a **proposal**.

## What you do with the output

`review-change` is **mandatory before every merge** (every unit gets it). Every
finding gets a real destination — never silently lost, and no backlog created by
the review (D3):

- **fix-now** → folds directly into the current unit's open phase. Never a
  tracked issue, never `plan-fix` (AC 12).
- **fix-now / replan-in-unit** → new user-confirmed phase(s) appended to the
  unit's SPEC `## Phases` ledger (before the hardening close-out, or after it
  plus a fresh final hardening phase if it already ran), then `execute-phase`
  on the same branch — never a downgrade (AC 12).
- **fix-now / decision-required** → stop and surface the decision; the unit
  blocks until the user decides.
- **proposal** (independent future capability) → batched in the report with a
  trigger; the **user** decides whether to route it to `triage-issue` (D3).
- **ignore** → note the rationale in the report; no further action.

Then it prints the next step (clean → `/audit-pr`).

## Adversarial multi-reviewer (opt-in)

`review-change --adversarial N` runs **N independent, context-clean, diff-only
reviewers** — each carrying the standard adversarial "assume the diff is
wrong" stance — in parallel, then merges and dedupes their findings by
`file:line` (+axis) into the same one classified decision table above. A
finding raised by **≥1** reviewer is included; there is no majority/quorum
gate, because the whole point is to catch what one reviewer would miss.

- **Three spawn tiers**, platform-adaptive: Claude Code → N parallel
  **subagents**; an agent with headless invocation → N parallel **headless
  invocations**; neither → N **sequential fresh conversations** (slower, the
  documented fallback of last resort).
- **Default OFF.** No flag → today's single-reviewer behavior, unchanged.
  `review-change` **auto-recommends** the mode (never forces it) for `L` or
  sensitive-flagged changes (auth, payments, destructive migrations, secrets,
  CI config) — the user decides whether the extra assurance is worth the cost.
- **Cost note: 2–3× the most expensive review stage**, because N reviewers each
  run the full findings engine. That cost is exactly why the mode stays
  opt-in for interactive use.
- **`ship-roadmap` enables it as a hard floor** — `--adversarial 2` for
  `L`/sensitive-flagged features in its unattended REVIEW stage, because no
  human is present to exercise the skip judgment the interactive advisory
  relies on. This floor is deliberately **not aligned** with the interactive
  advisory (which stays opt-in) — the two serve different contexts on purpose.

## Where it sits

Stage 4 (verification & review), alongside `/code-review`, `/security-review`,
`/verify`. It adds the **classification + project-aware axes** those don't, in
one pass. Routes **fix-now** into the current unit's open phase, **replan-in-unit**
into new user-confirmed SPEC phases, surfaces **decision-required** to the user,
and batches independent **proposals** for the user to route to `triage-issue`.
