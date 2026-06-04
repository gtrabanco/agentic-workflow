# Skill system reference

The skills that make up the agentic workflow, grouped by role. The six at the
top are added by this system; the rest already exist in the repo and compose with
them.

## Planning & creation (this system)

| Skill | Role | Hands off to |
|---|---|---|
| `design-feature` | Interactive interview from a raw idea; proactively asks to fill the SPEC | `plan-feature` |
| `feature-from-issue` | Feature-request issue → scoped SPEC, with `Closes #N` | `plan-feature` |
| `plan-feature` | Scaffolds SPEC + all planning artifacts; registers in roadmap (docs only) | `execute-phase` |

## Decision & audit (this system)

| Skill | Role | Hands off to |
|---|---|---|
| `triage-issue` | Classify fix-now / promote / postpone / wontfix; verify triggers vs. real code | `draft-fix-spec`, `feature-from-issue`, or a dated comment |
| `audit-docs` | Audit docs ↔ roadmap ↔ code ↔ fix index for drift | report (+ optional low-risk fixes) |
| `review-implementation` | Two-phase review (find → classify) → decision table: fix-now / postpone / ignore / intentional-tradeoff; findings only, no refactor | `draft-fix-spec` / `triage-issue` |

## Execution & review (already in the repo)

| Skill | Role |
|---|---|
| `execute-phase` | Execute one feature phase (default) or a fix (`--fix`); branch safety + per-phase doc discipline + gate |
| `implement-feature` | Take a SPEC end-to-end in one pass (small features) |
| `draft-fix-spec` | Draft a fix SPEC from an issue; commit on a fix branch |
| `/code-review` | Correctness + simplification over the diff |
| `/security-review` | Security pass on branch changes |
| `/verify` | Run the app; confirm the change behaves |

## Domain guardrails (per project — not bundled)

Stack/domain guardrail skills auto-load during execution but are
**project-specific**, so they live in each target repo rather than here — e.g.
an architecture-pattern skill, a domain-rules skill, and stack skills
(framework, ORM, runtime, platform). See `RECOMMENDED_SKILLS.md`.

## How they compose

```
IDEA ─▶ design-feature ─┐
ISSUE(feature) ─▶ feature-from-issue ─┼─▶ plan-feature ─▶ execute-phase ─▶ review skills ─▶ PR
SCOPED ─────────────────┘

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ draft-fix-spec ─▶ execute-phase --fix ─▶ PR
                            ├─ promote ─▶ feature-from-issue ─▶ (planning chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

review-implementation ── find + classify a branch before PR (Stage 4);
                         fix-now ─▶ draft-fix-spec · postpone ─▶ triage-issue
audit-docs ── audits everything above, anytime
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
