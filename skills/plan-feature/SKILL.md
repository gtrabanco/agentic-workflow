---
name: plan-feature
user-invocable: true
argument-hint: <feature idea | NN-slug>
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
for phase-by-phase execution. **Docs only — never code.**

## When to use

- A feature is decided (from `design-feature`, `feature-from-issue`, or a direct
  ask) and needs its `docs/features/<NN>-<slug>/` folder filled out.
- You need the roadmap updated with numbering, ordering, and dependencies.

Not for writing code (that is `execute-phase`) or deciding *whether* to build
(that is `design-feature` / `feature-from-issue` / `triage-issue`).

## Step 0 — Discover the project (always first)

Never assume paths or formats. Read, in order, whatever exists:

1. The agent guide (`CLAUDE.md` / `AGENTS.md`) — especially its **documentation
   map** and **feature workflow**.
2. The feature SPEC **template** (e.g. `docs/features/_TEMPLATE/SPEC.md`).
3. The **roadmap** (e.g. `docs/features/ROADMAP.md`) — source of truth for
   numbering, ordering, dependencies.
4. One or two **recent feature folders** (highest-numbered) to mirror the exact
   artifact set and section style in use.
5. The **architecture** doc and any domain/style docs the map points to for this
   feature's area.

With no template or roadmap, fall back to the agent guide's conventions and
state the assumption explicitly before proceeding.

## Process

1. **Resolve identity.** From the roadmap, pick the next free number and a
   kebab-case slug. Record dependencies (features that must land first) and note
   ordering conflicts.
2. **Fill the SPEC.** Copy the template to `docs/features/<NN>-<slug>/SPEC.md`
   and complete *every* section — goals, architecture impact, acceptance,
   branch name (`feat/<NN>-<slug>` or per project convention), dependencies,
   testing, and **dev scenarios** (happy path **and** failure modes:
   empty/degraded state, races, outages — plus how to reproduce each locally).
   No unfilled placeholders; record genuinely-unknown values as open questions
   in `decisions.md`, not blanks.
3. **Generate the planning artifacts**, mirroring the recent features' set.
   Typically:
   - `PLAN.md` — phased plan (P1, P2, …); phases are an *implementation*
     sequence, not a delivery boundary.
   - `TASKS.md` — per-phase checklists the executor ticks off.
   - `progress.md` — running log, one entry per phase.
   - `testing.md` — what is tested at which layer (prefer integration).
   - `known-issues.md` — deferred items, each linked to (or destined for) an
     issue. Do **not** plan to implement deferred work inline.
   - `decisions.md` — architecture/scope decisions + open questions.
   - `architecture-notes.md` — layer impact, ports, schema, bindings touched.
4. **Register in the roadmap** with number, ordering, dependencies.
5. **Do not branch or code.** That belongs to `execute-phase`; record the branch
   name in the SPEC only.
6. **Hand off.** Tell the user the artifacts are ready; next step is
   `execute-phase` for P1.

## Guardrails

- Docs only. No source edits, migrations, or dependencies.
- Respect the architecture: honor layer rules (inner layers don't import outer)
  and any domain/i18n/SEO/a11y rules from the docs map.
- All artifacts in the project's docs language (this repo: **English**),
  whatever language the request used.
- One PR per feature, based on the default branch — never stack PRs.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.

## Relationship to other skills

```
design-feature ─┐
feature-from-issue ─┼─▶ plan-feature ─▶ execute-phase (executes phases)
direct ask ─────┘                         │
                                          └─▶ audit-docs (audit anytime)
```

## Done when

- `docs/features/<NN>-<slug>/` exists with SPEC + every planning artifact filled.
- The roadmap lists the feature with correct number, order, dependencies.
- No code changed; open questions captured in `decisions.md`.
