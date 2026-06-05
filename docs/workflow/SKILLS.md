# Skill system reference

The skills that make up the agentic workflow, grouped by role.

**10 user-facing skills** (one menu entry each) + **3 internal** planning steps the
`plan-feature` router invokes for you.

## Setup

| Skill | Role | Hands off to |
|---|---|---|
| `init-workspace` | Fetch the `template/` scaffold and adapt it to the project by interview; suggest the platform's companion review skills; offer to install the skills | `plan-feature` |

## Plan

| Skill | Role | Hands off to |
|---|---|---|
| `plan-feature` | **Router.** Detects the input — raw idea (interview), issue `#N` (issue → scoped SPEC), or scoped slug/SPEC (scaffold) — routes, then registers the roadmap entry | `execute-phase` |
| `plan-fix` | Architect-drafts a tightly-scoped fix SPEC from an issue; commits on a fix branch; stops for review | `execute-phase --fix` |

### Internal planning steps (hidden from the menu; invoked by `plan-feature`)

| Skill | Role |
|---|---|
| `plan-feature-interview` | Interactive interview from a raw idea; proactively asks to fill the SPEC |
| `plan-feature-from-issue` | Feature-request issue → scoped SPEC, with `Closes #N` |
| `plan-feature-scaffold` | Scaffolds SPEC + all planning artifacts; registers in roadmap (docs only) |

## Execute

| Skill | Role |
|---|---|
| `execute-phase` | Execute one feature phase (default), a small feature in a single pass, or a fix (`--fix`); branch safety + per-phase doc discipline + gate; **auto-runs `review-change` every 2 phases** |

## Review & audit — *change → PR → product*

| Skill | Scope | Role | Hands off to |
|---|---|---|---|
| `review-change` | the **change** | Run only the reviews that apply to this platform + classify → one decision table + manual-verification checklist | `plan-fix` (fix-now) / `triage-issue` (postpone) |
| `review-implementation` | the **change** (engine) | Two-phase find → classify → decision table (fix-now / postpone / ignore / intentional-tradeoff); findings only, no refactor | `plan-fix` / `triage-issue` |
| `audit-pr` | the **PR** | Merge gate: acceptance, phases, docs, tests, CI, `Closes #N`, review axes → merge-ready or blockers | `execute-phase` / `plan-fix` / `triage-issue` |
| `product-audit` | the **product** | Periodic full-spectrum health check; mines feature docs → proposes issues + roadmap add/remove (never auto-fixes) | `triage-issue` / `plan-feature` / `plan-fix` |
| `audit-docs` | the **docs** | Audit docs ↔ roadmap ↔ code ↔ fix index for drift | report (+ optional low-risk fixes) |

## Decide

| Skill | Role | Hands off to |
|---|---|---|
| `triage-issue` | Classify fix-now / promote / postpone / wontfix; verify triggers vs. real code | `plan-fix`, `plan-feature`, or a dated comment |

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
                   ┌──────────────── plan-feature (router) ────────────────┐
IDEA ──────────────┤  --interview → plan-feature-interview                 │
ISSUE(feature) ────┤  #N / --from-issue → plan-feature-from-issue          ├─▶ execute-phase ─▶ review-change ─▶ audit-pr ─▶ PR
SCOPED slug/SPEC ──┤  --scaffold → plan-feature-scaffold                   │      (auto review every 2 phases)
ROADMAP --next ────┘  registers the roadmap entry, prints the next step    │

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ plan-fix ─▶ execute-phase --fix ─▶ review-change ─▶ audit-pr ─▶ PR
                            ├─ promote ─▶ plan-feature (router → from-issue) ─▶ (feature chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

review-change ── runs the applicable reviews + classifies a change (Stage 4);
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ plan-fix · postpone ─▶ triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime
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
