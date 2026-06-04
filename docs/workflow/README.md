# Agentic workflow

How we build with agentic programming in this repo: the end-to-end flow for a
**feature** and for an **issue**, the **skills** that drive each step, and how to
**replicate** the whole system in another project.

This is the versioned, in-repo copy. A reader-friendly multi-page mirror lives in
Notion ("Agentic Workflow").

## Pages

| Doc | What it covers |
|---|---|
| [FEATURE_WORKFLOW.md](FEATURE_WORKFLOW.md) | Idea/issue → SPEC + artifacts → phase execution → hardening → review → PR |
| [ISSUE_WORKFLOW.md](ISSUE_WORKFLOW.md) | Triage → classify (fix-now / postpone / wontfix / promote) → route → report |
| [SKILLS.md](SKILLS.md) | Every skill in the system, what it does, and how they compose |
| [REVIEW_AND_CLASSIFY.md](REVIEW_AND_CLASSIFY.md) | When & how to use `review-implementation` (find → classified decision table) |
| [RECOMMENDED_SKILLS.md](RECOMMENDED_SKILLS.md) | Agnostic software-quality & architecture skills for good agentic programming — universal vs. conditional-by-project-nature; stack/infra skills out of scope |
| [REPLICATE.md](REPLICATE.md) | `npx skills` install + portable prompt to set this up in any project |

## Core principles

1. **Docs drive the work.** Every skill reads the project's own guide
   (`CLAUDE.md`/`AGENTS.md`), documentation map, architecture, roadmap, and style
   docs *first*, and respects them. The workflow adapts to the project, not the
   other way around.
2. **Plan before code.** Features get a SPEC + planning artifacts before a line
   is written.
3. **One phase at a time.** Execution is phase-by-phase, each verified and
   committed separately.
4. **One PR per unit, always against the default branch.** Never work on `main`
   directly; never stack PRs.
5. **Decisions are evidence-backed.** Issue triage verifies triggers against the
   real code; deferred work is tracked, not implemented inline.
6. **Verification gate before every commit.** Type-check, tests, and build must
   pass (use the project's own gate commands).

## The map at a glance

```
                 ┌─────────────── ISSUE ───────────────┐
                 │            triage-issue              │
                 │   fix-now │ promote │ postpone │ wontfix
                 └─────┬──────────┬──────────┬──────────┘
                       │          │          └─ leave open + dated comment
                       │          │
        draft-fix-spec │          │ feature-from-issue
                       │          │
                       ▼          ▼
   FEATURE:   design-feature ─▶ plan-feature ─▶ execute-phase ─▶ review ─▶ PR
   FIX:                          draft-fix-spec ─▶ execute-phase --fix ─▶ PR

   audit-docs ── audit docs ↔ roadmap ↔ code ↔ fix index (anytime)
```
