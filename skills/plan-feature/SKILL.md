---
name: plan-feature
user-invocable: true
argument-hint: <idea | #N | NN-slug> | --interview | --from-issue N | --scaffold <slug> | --next
model: opus
effort: medium
description: >
  One entry point to plan a feature. Detects the input — a raw idea (interview), a
  GitHub issue #N (issue → scoped SPEC), or an already-scoped slug/SPEC (straight
  to scaffolding) — routes to the right internal step, then ensures the roadmap
  entry and prints the next step. Force a path with flags to skip detection;
  `--next` plans the next planned feature from the roadmap. Triggers: "plan a
  feature", "plan the feature from issue N", "plan the next roadmap feature",
  "scaffold feature NN", "I have an idea, plan it", "create SPEC and TASKS for NN".
---

# Plan Feature (router)

One door to turn anything — an idea, an issue, or a scoped slug — into a planned,
roadmap-registered feature. Routes to a focused internal step so only the work you
need runs (no fat single skill). **Docs only — no code, no branch.**

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the **roadmap** (`docs/features/ROADMAP.md`), so routing
and roadmap registration match the project's real layout.

## Routing

Pick the mode — first match wins:

1. **Flag forces it** (skip detection): `--interview`, `--from-issue <N>`,
   `--scaffold <slug>`, `--next`.
2. **Issue** — an issue number or issue URL → `plan-feature-from-issue`.
3. **Scoped** — an existing roadmap slug or a filled `SPEC.md` → `plan-feature-scaffold`.
4. **Raw idea** — a vague description → `plan-feature-interview`.
5. **`--next` / no input** — read the roadmap, take the next `planned` entry; if
   it's a thin line → `plan-feature-interview`, if scoped → `plan-feature-scaffold`.
6. **Ambiguous** — ask one question, then route.

## Process

1. **Route** per above. The interview / from-issue internals produce a **filled
   SPEC**; then invoke `plan-feature-scaffold` to generate the full artifact set
   and register the roadmap. The scoped path runs `plan-feature-scaffold` directly.
2. **Confirm roadmap.** Ensure the feature is in `docs/features/ROADMAP.md` with
   the right number, ordering, and dependencies.
3. **Print the next step:** `execute-phase <NN> P1`.

## Guardrails

- Docs only — no code, no branch (that is `execute-phase`).
- Don't re-ask what a flag, the issue, or the docs already settle.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise per the project's **Workflow conventions** (docs-language).

## Internal steps (not user-invocable)

- `plan-feature-interview` — interview a raw idea into a SPEC.
- `plan-feature-from-issue` — issue → scoped SPEC, `Closes #N`.
- `plan-feature-scaffold` — SPEC → full artifact set + roadmap entry.

## Relationship to other skills

- `triage-issue` routes here to promote an issue to a feature.
- `execute-phase` executes the phases afterward (`audit-docs` audits anytime).

## Done when

- A planned feature with its full artifact set exists and is roadmap-registered,
  and the user knows the next step (`execute-phase <NN> P1`).
