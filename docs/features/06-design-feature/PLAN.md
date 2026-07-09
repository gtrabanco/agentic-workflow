# 06 — design-feature · PLAN

Phased implementation plan. Labels are fixed `P1, P2, …` ("phases"); the last
phase is hardening. Planning (this artifact set) is produced by `plan-feature`
and is **not** a numbered phase. `P1` is the first implementation phase and also
commits the planning artifacts. Execute with `execute-phase 06 P1`, then `P2`…

See `SPEC.md` for the full specification; `TASKS.md` for the tickable per-phase
checklists.

## P1 — SPEC two-halves convention + template + pipeline docs

**Goal:** land the substrate every later phase references — the two-halves SPEC
template with the design-complete marker, and the documented five-stage pipeline.

- Commit the planning artifacts for this feature (P1 convention).
- Edit `docs/features/_TEMPLATE/SPEC.md`: group sections into a **Product half**
  (Goal, Context, Business goals, Scope, Capability closure → Acceptance criteria,
  Tooling, product Decisions, `## Design status`) and an **Engineering half**
  (Architecture impact, Design, Phases, Testing, Dev scenarios, Deploy & rollback,
  Deliverables). Add the `## Design status` marker line.
- Edit `docs/workflow/FEATURE_WORKFLOW.md`: name the design → plan → execute →
  review → audit pipeline; describe the two-halves SPEC and the redirect gate.
- Edit `docs/workflow/SKILLS.md`: add the `design-feature` reference row and note
  the `plan-feature` role change (engineering planning only).

**Exit:** template shows both halves + marker; workflow docs name the pipeline;
`grep -q "## Design status" docs/features/_TEMPLATE/SPEC.md` passes.

## P2 — design-feature skill (core)

**Goal:** the new user-facing skill, authored to the repo contract and
weak-model-executable.

- Create `skills/design-feature/SKILL.md` with frontmatter: `name: design-feature`,
  `user-invocable: true`, `version: 1.0.0`, author/license per siblings,
  description carrying trigger phrases ("design a feature", "add feature", "add a
  feature", "new feature", "close the capability gaps", "define the feature").
- Body: `## Turn contract` (product half written + `designed` marker stamped +
  `→ Next:` last + machine envelope last-of-all); `Step 0 — Discover the project`;
  `Process` = folded raw-idea interview → proportional research (domain-gated) →
  **capability-closure checklist** (per-entity CRUD + state transitions + UI entry
  + API + test / explicit `n/a`; per-capability entry point + ACL; per-role
  assign/revoke/view) → per-feature tooling notes → upsert semantics → interaction
  rule (bare vs `<instruction>`) → scale-down; `Guardrails`; `## Portability`;
  `Relationship to other skills`; `Done when`; `→ Next:` block; `## Machine
  envelope`.
- Emit the closure checklist skeleton + Acceptance-criteria derivation into the
  SPEC product half; stamp `## Design status: designed`.

**Exit:** acceptance criteria 1, 3, 4 pass; `npx skills add . --list` lists
`design-feature`.

## P3 — plan-feature slim (MAJOR) + interview retirement + alignment

**Goal:** make `plan-feature` a pure engineering-planning step with a friendly
redirect, and remove the second product-definition door.

- Slim `skills/plan-feature/SKILL.md`: drop the raw-idea interview routing row;
  add the **redirect gate** (undesigned → STOP → fixed `/design-feature <slug>`
  block, no bypass flag); keep the from-issue and scoped-slug paths; **major**
  version bump. Update its Turn contract / Routing / Done-when accordingly.
- Delete `skills/plan-feature-interview/` and repoint every reference (router
  internals list, `docs/workflow/*`, READMEs) to `design-feature`.
- Adapt `skills/plan-feature-from-issue/SKILL.md`: emit the two-halves SPEC, fill
  the product half + closure for detailed issues, hand a thin issue to
  `design-feature`; minor bump. Respect the ≥-tier composition rule.
- Adapt `skills/plan-feature-scaffold/SKILL.md`: fill the **engineering half**
  only of an already-`designed` SPEC; minor bump if body text changes.
- Add `docs/workflow/MIGRATION.md` notes: `plan-feature` major slim + redirect;
  `plan-feature-interview` removed → use `/design-feature`.

**Exit:** acceptance criteria 6, 7, 9 pass; router no longer interviews;
`test ! -e skills/plan-feature-interview`.

## P4 — Hardening + bookkeeping

**Goal:** bookkeeping consistent, edge cases closed, PR opened.

- Run `bump-skill`: `design-feature` 1.0.0 (new row), `plan-feature` major,
  `plan-feature-interview` removal row, `plan-feature-from-issue` /
  `plan-feature-scaffold` minors → `CHANGELOG.md` + `CHANGELOG.es.md` + README
  skills + model tables (EN/ES).
- Hardening (edge cases + dev-scenario failure modes): run `npx skills add .
  --list`; run **every** acceptance-criteria command (1–11); `/audit-docs` for
  cross-doc drift; weak-model read-through of `design-feature` (every closure row
  independently checkable, no "if needed", fixed formats); confirm the closure
  gate rejects a blank row (NEEDS_INPUT/BLOCKED, not a silent pass); confirm
  `design:upsert` destroys nothing; confirm no stack leakage and `## Portability`
  + `→ Next:` blocks intact across edited skills.
- Close out: open the PR (`gh pr create --body-file <path>`) with `Closes #13`
  and **print the PR URL**; update the roadmap row 06 to `done · [#<pr>](<url>)`;
  commit `docs: link PR #<n>` and push.

**Exit:** all acceptance criteria pass; PR open with URL printed; roadmap row
updated.
