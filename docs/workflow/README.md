# Agentic workflow

How we build with agentic programming in this repo: the end-to-end flow for a
**feature** and for an **issue** through the adaptive lane, the **skills** that
drive each step, and how to **replicate** the whole system in another project.

This is the versioned, in-repo copy. A reader-friendly multi-page mirror lives in
Notion ("Agentic Workflow").

## Pages

| Doc | What it covers |
|---|---|
| [LANE_FLOW.md](LANE_FLOW.md) | How a unit flows through the adaptive lane: lifecycle, triage rules, guards, evidence, review, deterministic next-step, command cheat-sheet, and programmatic contract |
| [FEATURE_WORKFLOW.md](FEATURE_WORKFLOW.md) | Idea/issue → SPEC + artifacts → phase execution → hardening → review → audit → PR |
| [ISSUE_WORKFLOW.md](ISSUE_WORKFLOW.md) | Triage → classify (fix-now / postpone / wontfix / promote) → route → report |
| [SKILLS.md](SKILLS.md) | Every skill in the system, what it does, and how they compose |
| [REVIEW_AND_CLASSIFY.md](REVIEW_AND_CLASSIFY.md) | When & how to review — `review-change` (the right reviews per platform) and its `review-implementation` engine (find → classified decision table) |
| [RECOMMENDED_SKILLS.md](RECOMMENDED_SKILLS.md) | Agnostic software-quality & architecture skills for good agentic programming — universal vs. conditional-by-project-nature; stack/infra skills out of scope |
| [REPLICATE.md](REPLICATE.md) | `npx skills` install — replicate the skill system in another project |
| [PORTABLE_PROMPT.md](PORTABLE_PROMPT.md) | The self-contained prompt that regenerates the whole system inside a target repository, adapted to that project's stack — the bootstrap `REPLICATE.md` points at |
| [SETUP.md](SETUP.md) | Provisioning **this repo's** own authoring toolchain: `node scripts/setup-env.mjs`, the `--check` verification, committed vs local state, the worktree resetup, and the Windows-via-WSL note |
| [MIGRATION.md](MIGRATION.md) | Upgrading an existing install from the previous skill set — what was renamed, what to delete |
| [ORCHESTRATION.md](ORCHESTRATION.md) | Programmatic orchestration: the machine envelope and `workflow-status` result an external driver reads at the invocation boundary, and how it composes with the repository documents |
| [REPOSITORY_STATE.md](REPOSITORY_STATE.md) | The frozen Normalized Repository State — the evidence-backed snapshot of observed truth that `discover-repository-state` writes and `resolve-repository-state` alone may replace |
| [GOLDEN_FIXTURE.md](GOLDEN_FIXTURE.md) | Golden fixture: the manual judgment protocol (run a changed executor-path skill against the committed toy fixture with the weakest fleet model) plus the executable `scripts/golden-fixture.test.mjs` suite that asserts its deterministic half |
| [WORKFLOW_INVARIANTS.md](WORKFLOW_INVARIANTS.md) | Portable contract for optional project architectural invariants and their evidence-based evaluation |

## Data

Not pages — files this directory carries as machine input. Nothing here is a
reading surface, and `scripts/workflow-docs-index.test.mjs` keeps the split
exact: every other file in this directory must have a row above, and this one
must not have one.

| File | Consumed by |
|---|---|
| `SKILL_CONTEXT_BUDGETS.json` | `scripts/check-skill-context.mjs` (the enforced per-skill line/token budgets and route budgets) — read by the gate, never by a human, and cited as a claim source by `scripts/promise-coherence.mjs` |

## Core principles

1. **Docs drive the work.** Every skill reads the project's own guide
   (`AGENTS.md`), documentation map, architecture, roadmap, and style
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
7. **Review at the right altitude.** The change (`review-change`), then the PR
   (`audit-pr`), then — periodically — the whole product (`product-audit`).
8. **Architecture changes are explicit.** Applicable architectural invariants
   are evidenced and preserved, or changed through an explicit decision — never
   inferred from a feature SPEC or implementation.

## The map at a glance

```
                 ┌─────────────── ISSUE ───────────────┐
                 │            triage-issue              │
                 │   fix-now │ promote │ postpone │ wontfix
                 └─────┬──────────┬──────────┬──────────┘
                       │          │          └─ leave open + dated comment
                       │          │
              lane fix │   lane   │
                       │  feature │
                       ▼          ▼
   ISSUE──▶ triage ──▶ /unit-lane (conductor) ──▶ catalog steps ──▶ review-change ──▶ audit-pr ──▶ PR
              │           unit-lane│ (triage decides:            (auto after   (merge
              │                    implement, evidence, etc.)   all steps)   gate)
              │
              └─ promote ──▶ /unit-lane (feature mode)

   audit-docs ───── docs ↔ roadmap ↔ code ↔ fix index coherence            (anytime)
   product-audit ── product-wide health check → issues + roadmap proposals (periodic)

   # ship-roadmap is retired (feature 61 P9); its deterministic routing lives
   # in `workflow-status` / `unit-lane`.
   # The unattended-conductor role is deferred to roadmap row 62.
```
