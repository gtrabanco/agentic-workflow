---
name: plan-feature-scaffold
user-invocable: false
version: 1.1.0
model: opus
effort: medium
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal step of plan-feature: from a scoped SPEC, generate the planning
  artifact set scaled to the feature's size (XS/S → SPEC-only; M/L → full set
  with a hardening phase) and register the roadmap entry. Docs only — never code.
---

# Plan Feature — Scaffold (internal)

Turn a scoped feature into the project's complete planning artifact set, ready
for phase-by-phase execution. **Docs only — never code.**

## When to use

- The `plan-feature` router calls this once a feature is scoped — from an
  interview, an issue, or an already-scoped slug/SPEC — to fill out its
  `docs/features/<NN>-<slug>/` folder and update the roadmap.

Not for writing code (that is `execute-phase`) or deciding *whether* to build
(that is the `plan-feature` router / `triage-issue`).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the feature SPEC **template**, the **roadmap**
(numbering/order/deps), 1–2 recent feature folders to mirror the artifact set, and
the architecture/domain docs the map points to. No template/roadmap → fall back to
the agent guide and state the assumption.

## Process

1. **Resolve identity.** From the roadmap, pick the next free number and a
   kebab-case slug. Record dependencies (features that must land first) and note
   ordering conflicts.
2. **Fill the SPEC.** Copy the template to `docs/features/<NN>-<slug>/SPEC.md`
   and complete *every* section — goals, architecture impact, acceptance,
   branch name (`feat/<NN>-<slug>` or per project convention), **size**
   (`XS/S/M/L` per the template's scale; estimate it if planning didn't),
   dependencies, testing, and **dev scenarios** (happy path **and** failure
   modes: empty/degraded state, races, outages — plus how to reproduce each
   locally). No unfilled placeholders; record genuinely-unknown values as open
   questions in `decisions.md`, not blanks.
3. **Scale the artifacts to the size.**
   - **XS/S** → the SPEC is the only planning artifact. Skip the set below,
     register the roadmap entry, and hand off to `execute-phase <NN>`
     (single-pass). Don't generate ceremony the feature doesn't need.
   - **M/L** → generate the full set, mirroring the recent features':
     - `PLAN.md` — phased plan (P1, P2, …); phases are an *implementation*
       sequence, not a delivery boundary. **The last implementation phase is
       always a hardening phase**: edge cases and the SPEC's dev-scenario
       failure modes (empty/degraded states, races, outages), implemented and
       tested — not just documented.
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
   `execute-phase <NN> P1` (M/L) or `execute-phase <NN>` single-pass (XS/S).

## Guardrails

- Docs only. No source edits, migrations, or dependencies.
- Respect the architecture: honor layer rules (inner layers don't import outer)
  and any domain/i18n/SEO/a11y rules from the docs map.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise honor the project's **Workflow conventions** (branch/PR, docs-language).

## Relationship to other skills

Invoked by the `plan-feature` router (after `plan-feature-interview` /
`plan-feature-from-issue`, or directly for a scoped slug/SPEC). Hands off to
`execute-phase` for P1; `audit-docs` audits anytime.

## Done when

- `docs/features/<NN>-<slug>/` exists with SPEC + every planning artifact filled.
- The roadmap lists the feature with correct number, order, dependencies.
- No code changed; open questions captured in `decisions.md`.
