# Skill system reference

The skills that make up the agentic workflow, grouped by role.

**12 user-facing skills** (one menu entry each) + **4 internal** steps composed for
you (the `plan-feature` router's three planning steps + the `review-change`
findings engine, `review-implementation`). Of the 12: 10 core workflow skills, a
`log-session` journal helper, and the repo-only `bump-skill` maintenance helper.

## Setup

| Skill | Role | Hands off to |
|---|---|---|
| `init-workspace` | Fetch the `template/` scaffold and adapt it to the project by interview; suggest the platform's companion review skills; offer to install the skills | `design-feature` |

## Design

| Skill | Role | Hands off to |
|---|---|---|
| `design-feature` | **Product definition.** Folds in the raw-idea interview, runs proportional research, and walks the **capability-closure** checklist (per entity → CRUD + state transitions + UI + API + test or explicit `n/a`; per capability → entry point + ACL; per role → assign/revoke/view) into exhaustive acceptance criteria. Writes the SPEC's **product half** and stamps `## Design status: designed`. Upserts on re-run; never destroys recorded decisions | `plan-feature <slug>` |

## Plan

| Skill | Role | Hands off to |
|---|---|---|
| `plan-feature` | **Router, engineering-planning only.** Given an undesigned feature (no `## Design status: designed`), **STOPS and redirects** to `/design-feature <slug>` (no bypass flag). Given a designed feature or issue `#N` (issue → scoped product half → `design-feature` for thin issues), routes to fill the **engineering half**, **sizes the feature** (`XS/S/M/L`), then registers the roadmap entry | `execute-phase <NN> P1` (M/L) or `execute-phase <NN>` single-pass (XS/S) |
| `plan-fix` | Architect-drafts a tightly-scoped fix SPEC from an issue; commits on a fix branch; stops for review | `execute-phase --fix` |

### Internal steps (hidden from the menu; composed for you)

| Skill | Role |
|---|---|
| `plan-feature-from-issue` | Feature-request issue → scoped SPEC product half (satisfies capability closure), with `Closes #N` (invoked by `plan-feature`) |
| `plan-feature-scaffold` | Fills the SPEC's **engineering half** + planning artifacts **scaled to the feature's size** (XS/S → SPEC-only; M/L → full set ending in a mandatory hardening phase); registers in roadmap (docs only) (invoked by `plan-feature`) |
| `review-implementation` | Two-phase find → classify → decision table (fix-now / postpone / ignore / intentional-tradeoff); findings only, no refactor. `user-invocable: false` — the engine `review-change` composes (and `audit-pr` / `product-audit` reuse) |

## Execute

| Skill | Role |
|---|---|
| `execute-phase` | Execute one feature phase (default), a small `XS/S` feature in a single pass, or a fix (`--fix`); **tests-first** on domain/orchestration work, never commits red, P1 commits planning artifacts separately; branch safety + per-phase doc discipline + gate; **recommends a `review-change` checkpoint every 2 phases (skippable) and hands off once at the end (mandatory)**; a finished unit **always opens its PR and flips to `done`** (built, not merged) |

## Review & audit — *change → PR → product*

| Skill | Scope | Role | Hands off to |
|---|---|---|---|
| `review-change` | the **change** | Run only the reviews that apply to this platform + a **SPEC drift check** (diff vs. the SPEC's scope and acceptance criteria) + classify → one decision table + manual-verification checklist; **mandatory before every merge** | `plan-fix` (fix-now) / `triage-issue` (every non-fix-now: postpone / ignore / intentional-tradeoff) |
| `audit-pr` | the **PR** | Merge gate: acceptance, phases, docs, tests, CI, `Closes #N`, review axes → merge-ready or blockers | `execute-phase` / `plan-fix` / `triage-issue` |
| `product-audit` | the **product** | Periodic full-spectrum health check; mines feature docs → proposes issues + roadmap add/remove (never auto-fixes) | `triage-issue` / `plan-feature` / `plan-fix` |
| `audit-docs` | the **docs** | Audit docs ↔ roadmap ↔ code ↔ fix index for drift | report (+ optional low-risk fixes) |

> `review-change`'s findings engine is the internal `review-implementation`
> (`user-invocable: false`) — the two-phase find → classify pass it composes, and
> that `audit-pr` / `product-audit` reuse. It's not a menu entry; see
> [Internal steps](#internal-steps-hidden-from-the-menu-composed-for-you).

## Decide

| Skill | Role | Hands off to |
|---|---|---|
| `triage-issue` | Classify fix-now / promote / postpone / wontfix; verify triggers vs. real code; accepts several issues in one batch | `plan-fix`, `plan-feature`, or a dated comment |

## Document

| Skill | Role | Hands off to |
|---|---|---|
| `generate-docs` | Turn a unit's diff into developer docs on the project's own docs site: incremental how-to guides via a discovered adapter (Starlight MDX reference, plain-markdown fallback), a knowledge/call map rendered from a project-declared deterministic command (never model-inferred), opt-in `--review` export of review reports. Provenance frontmatter (`generated-by`/`source-unit`) lets `audit-docs` catch orphan/stale pages | the unit's close-out commit (pages ride the unit's PR); `audit-docs` for drift |

## Autopilot — the whole flow, end to end

| Skill | Role | Hands off to |
|---|---|---|
| `ship-roadmap` | **Conductor.** One upfront interview (product, features, stack, architecture, quality, ops, autonomy, budget) → founds the project if needed → creates or adopts the complete roadmap → a `/loop`-driven loop ships it feature by feature: composes `plan-feature`, `review-change`, `audit-pr` in-turn (equal tier), delegates each `execute-phase` phase to a Sonnet subagent. Default: opens PRs, human merges; `--fullauto` merges under non-negotiable safety floors. Ends in a final report | human merges / `triage-issue` batch / `product-audit` (always a hand-off — its effort max exceeds the conductor's high) |

## Session

| Skill | Role | Hands off to |
|---|---|---|
| `log-session` | Append a structured entry to `docs/LOGS.md` — summary, files, decisions + *why*, next step — so a cold reader (or the next session) resumes without re-reading git. Manual + rich; `model: sonnet` (cheap). Complemented by free, opt-in `template/.claude/` hooks that auto-append a mechanical entry on `/clear`/exit and can re-inject the last entry on start | `/clear` (session captured) or the resume command in the entry's **Next** line |

## Repo maintenance (specific to the agentic-workflow repo)

| Skill | Role |
|---|---|
| `bump-skill` | After editing a SKILL.md: bump `version:`, add CHANGELOG.md + CHANGELOG.es.md rows, update the README skill/model tables. Repo-only — its description keeps it from triggering in other projects |

## Built-in companions (Claude Code)

`/code-review` (correctness + simplification), `/security-review` (security pass),
`/verify` (run the app, confirm behavior) — composed by `review-change` when they
apply to the change.

## Domain guardrails (per project — not bundled)

Stack/domain guardrail skills auto-load during execution but are
**project-specific**, so they live in each target repo rather than here — e.g.
an architecture-pattern skill, a domain-rules skill, and stack skills
(framework, ORM, runtime, platform). See `RECOMMENDED_SKILLS.md`.

## How they compose

```
IDEA / undesigned SPEC ─▶ design-feature (product half + capability closure)
                          → `## Design status: designed` ─┐
                   ┌──────────────── plan-feature (router, engineering-planning only) ─┐
DESIGNED slug/SPEC ┤  --scaffold → plan-feature-scaffold (engineering half)            │
ISSUE(feature) ────┤  #N / --from-issue → plan-feature-from-issue                      ├─▶ execute-phase ─▶ open PR (`done`) ─▶ review-change ─▶ audit-pr ─▶ merge
ROADMAP --next ────┘  registers the roadmap entry, prints the next step                │
                       (undesigned input → STOP, redirect to /design-feature, no bypass)

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ plan-fix ─▶ execute-phase --fix ─▶ open PR (`done`) ─▶ review-change ─▶ audit-pr ─▶ merge
                            ├─ promote ─▶ plan-feature (router → from-issue) ─▶ (feature chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

review-change ── runs the applicable reviews + classifies a change (Stage 4, mandatory);
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ plan-fix · every non-fix-now (postpone/ignore/tradeoff) ─▶ triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime

ship-roadmap ─── AUTOPILOT around the whole feature chain: interview → founding →
                 roadmap → /loop { plan-feature → execute-phase (sonnet subagents)
                 → review-change → PR → audit-pr → merge } → final report;
                 human at the merges (default) and at product-audit (always)
```

## Design rules every skill follows

1. **Discover first.** Read the agent guide, documentation map, architecture,
   roadmap, and relevant domain/style docs before acting. Adapt to the project.
2. **Respect architecture & style.** Layer rules, domain/i18n/SEO/a11y rules,
   runtime/platform limits, naming conventions — all honored, not bypassed.
3. **Plan before code; one phase at a time; one PR per unit against the default
   branch; never `main`, never stacked.**
4. **Evidence over reflex.** Verify triggers, cite paths/counts.
5. **Track, don't inline-implement, deferred work.** Keep issues and docs
   coherent and reported.
6. **Gate before commit.** Type-check + tests + build green.
7. **Docs-language discipline.** Artifacts in the project's docs language (this
   repo: English), regardless of the request's language.

## Skill anatomy

Each skill is a folder under `.claude/skills/<name>/` with a `SKILL.md`:

```
---
name: <kebab-case-name>
description: >
  One paragraph with concrete trigger phrases so the model knows when to load it.
---

# Title
## When to use
## Step 0 — Discover the project (always first)
## Process
## Guardrails
## Relationship to other skills
## Done when
```
