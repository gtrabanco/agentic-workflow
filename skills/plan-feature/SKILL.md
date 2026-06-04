---
name: plan-feature
user-invocable: true
description: >
  Scaffold a feature's full planning artifact set (SPEC + PLAN + TASKS +
  progress/testing/known-issues/decisions/architecture-notes) from the project's
  template and register it in the roadmap. The planning half that runs BEFORE
  phase execution. Use when a feature is scoped (an idea, a slug, or a filled
  SPEC) and you need the docs/features/NN-slug/ folder generated and roadmap-
  registered. Triggers: "plan the feature", "scaffold the feature docs",
  "generate the planning artifacts", "create SPEC and TASKS for NN".
---

# Plan Feature

Turn a scoped feature into the project's complete planning artifact set, ready
for phase-by-phase execution. This skill writes **docs only** — never code.

## When to use

- A feature is decided (from `design-feature`, `feature-from-issue`, or a direct
  ask) and you need its `docs/features/<NN>-<slug>/` folder filled out.
- You need the roadmap updated with numbering, ordering, and dependencies.

Do NOT use to write code — that is `execute-phase` (phase execution). Do NOT
use to decide *whether* to build something — that is `design-feature` /
`feature-from-issue` / `triage-issue`.

## Step 0 — Discover the project (always first)

Never assume paths or formats. Read, in this order, whatever exists:

1. The agent guide at the repo root (`CLAUDE.md` / `AGENTS.md`) — especially any
   **documentation map** and **feature workflow** section.
2. The feature SPEC **template** (e.g. `docs/features/_TEMPLATE/SPEC.md`).
3. The **roadmap** (e.g. `docs/features/ROADMAP.md`) — the source of truth for
   feature numbering, ordering, and dependencies.
4. One or two **recent feature folders** (e.g. the highest-numbered ones) to
   mirror the *exact* artifact set and section style the project actually uses.
5. The **architecture** doc and any domain/style docs the map points to for the
   feature's area.

If the project has no template or roadmap, fall back to the conventions in the
agent guide and state the assumption explicitly before proceeding.

## Process

1. **Resolve identity.** From the roadmap, pick the next free feature number and
   a kebab-case slug. Record dependencies (features that must land first) and
   note any ordering conflicts.
2. **Fill the SPEC.** Copy the template to `docs/features/<NN>-<slug>/SPEC.md`
   and complete *every* section — goals, architecture impact, acceptance
   criteria, branch name (`feat/<NN>-<slug>` or per project convention),
   dependencies, testing requirements, and **dev scenarios** (happy path **and**
   failure modes: empty/degraded state, races, outages — and how to reproduce
   each locally). Leave no placeholder unfilled; if a value is genuinely unknown,
   record it as an open question in `decisions.md`, not as a blank.
3. **Generate the planning artifacts**, mirroring the set the project's recent
   features use. Typically:
   - `PLAN.md` — phased implementation plan (P1, P2, …). Phases are an
     *implementation* sequence, not a delivery boundary.
   - `TASKS.md` — per-phase checklists the executor will tick off.
   - `progress.md` — running log, one entry per phase.
   - `testing.md` — what gets tested at which layer (prefer integration).
   - `known-issues.md` — deferred items, each linked to (or destined for) an
     issue. Do **not** plan to implement deferred work inline.
   - `decisions.md` — architecture/scope decisions + open questions.
   - `architecture-notes.md` — layer impact, ports, schema, bindings touched.
4. **Register in the roadmap.** Add the feature with its number, ordering, and
   dependencies.
5. **Do not branch or code.** Phase execution (and the branch) is owned by
   `execute-phase`. Record the branch name in the SPEC only.
6. **Hand off.** Tell the user the artifacts are ready and that the next step is
   `execute-phase` for P1.

## Guardrails

- Docs only. No source edits, no migrations, no dependencies.
- Respect the architecture: when describing impact, honor the project's layer
  rules (e.g. inner layers do not import outer ones) and any
  domain/i18n/SEO/a11y rules from the docs map.
- All artifacts in the project's documentation language convention (this repo:
  **English**), even if the request came in another language.
- One PR per feature, based on the project's default branch — never stack PRs.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap with an
  existing feature) before writing, not after.

## Relationship to other skills

```
design-feature ─┐
feature-from-issue ─┼─▶ plan-feature ─▶ execute-phase (executes phases)
direct ask ─────┘                         │
                                          └─▶ audit-docs (audit anytime)
```

## Done when

- `docs/features/<NN>-<slug>/` exists with SPEC + every planning artifact filled.
- The roadmap lists the feature with correct number, order, and dependencies.
- No code changed; open questions captured in `decisions.md`.
