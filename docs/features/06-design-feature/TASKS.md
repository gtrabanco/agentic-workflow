# 06 — design-feature · TASKS

Per-phase checklists the executor ticks off. Labels fixed `P1, P2, …`.
Run `execute-phase 06 P1`, then `P2`, `P3`, `P4`.

## P1 — SPEC two-halves convention + template + pipeline docs

- [x] Commit this planning artifact set (P1 commits the planning docs). —
      `docs(06-design-feature): planning artifacts`
- [x] Edit `docs/features/_TEMPLATE/SPEC.md`: add a **Product half** grouping
      (Goal, Context, Business goals, Scope, Capability closure → Acceptance
      criteria, Tooling, product Decisions, `## Design status`). — Goal stays a
      meta section before the halves per the existing template convention
      (alongside Branch/Size/Dependencies); Context onward is grouped under
      `## Product half`.
- [x] Edit the same template: add an **Engineering half** grouping (Architecture
      impact, Design, Phases, Testing, Dev scenarios, Deploy & rollback,
      Deliverables).
- [x] Add the `## Design status` marker line to the template with its
      `designed`/not-yet semantics.
- [x] Add a `## Capability closure` section skeleton to the template (per-entity
      CRUD + state / per-capability / per-role, with explicit `n/a`).
- [x] Edit `docs/workflow/FEATURE_WORKFLOW.md`: name design → plan → execute →
      review → audit; describe two-halves SPEC + redirect gate.
- [x] Edit `docs/workflow/SKILLS.md`: add `design-feature`; note `plan-feature`
      is now engineering-planning only.
- [x] Verify `grep -q "## Design status" docs/features/_TEMPLATE/SPEC.md`.

## P2 — design-feature skill (core)

- [x] Create `skills/design-feature/SKILL.md` frontmatter: `name: design-feature`,
      `user-invocable: true`, `version: 1.0.0`, author/license, description with
      "add feature"/"add a feature"/"new feature" triggers.
- [x] `## Turn contract` (product half + `designed` marker + `→ Next:` last +
      envelope last-of-all).
- [x] `Step 0 — Discover the project`.
- [x] `Process`: raw-idea interview (folded) → proportional research
      (domain-gated) → capability-closure checklist → per-feature tooling notes →
      upsert semantics → interaction rule (bare vs `<instruction>`) → scale-down.
- [x] Capability-closure checklist written as independently-checkable rows with
      explicit `n/a: <reason>`; blank row = gate fail.
- [x] `Guardrails`, `## Portability`, `Relationship to other skills`, `Done when`,
      closing `→ Next:` block, `## Machine envelope`.
- [x] Verify AC1 `grep -q "^name: design-feature$"` + `^user-invocable: true$`.
- [x] Verify AC3 `grep -iq "add feature"`; AC4 `grep -iq "capability closure"`.
- [x] Verify `npx skills add . --list` lists `design-feature`.

## P3 — plan-feature slim (MAJOR) + interview retirement + alignment

- [ ] Slim `skills/plan-feature/SKILL.md`: remove raw-idea interview routing row.
- [ ] Add the redirect gate (undesigned → STOP → fixed `/design-feature <slug>`
      block; **no bypass flag**). Update Turn contract / Routing / Done when.
- [ ] Bump `plan-feature` **major**.
- [ ] `rm -r skills/plan-feature-interview/` and repoint every reference
      (`grep -rl plan-feature-interview` across skills/docs/READMEs) to
      `design-feature`.
- [ ] Adapt `skills/plan-feature-from-issue/SKILL.md`: emit two-halves SPEC,
      satisfy closure / hand thin issues to design-feature; respect ≥-tier rule;
      minor bump.
- [ ] Adapt `skills/plan-feature-scaffold/SKILL.md`: fill engineering half only;
      minor bump if body changes.
- [ ] Add `docs/workflow/MIGRATION.md` notes (plan-feature major slim + redirect;
      interview removed → `/design-feature`).
- [ ] Verify AC6 (`/design-feature` present, no bypass flag), AC7
      (`test ! -e skills/plan-feature-interview` + no references), AC9 (MIGRATION).

## P4 — Hardening + bookkeeping (last phase)

- [ ] Run `bump-skill`: design-feature 1.0.0 row, plan-feature major, interview
      removal, from-issue/scaffold minors → `CHANGELOG.md` + `CHANGELOG.es.md`.
- [ ] Verify README skills + model tables (EN/ES) list `design-feature` and drop
      `plan-feature-interview`.
- [ ] Run `npx skills add . --list` (all parse; interview gone).
- [ ] Run every acceptance-criteria command (AC1–AC11).
- [ ] Run `/audit-docs`; reconcile any drift it reports.
- [ ] Weak-model read-through of `design-feature`: every closure row checkable, no
      "if needed", fixed output formats, `## Portability` intact.
- [ ] Confirm closure gate rejects a blank row (NEEDS_INPUT/BLOCKED, not silent
      pass); confirm `design-feature <existing-slug>` upsert destroys nothing.
- [ ] Confirm no stack/product references leaked into new skill or shared docs.
- [ ] **Close-out — open the PR** (`gh pr create --body-file <path>` — body as a
      Markdown file, real backticks, never inline `--body`/heredoc) with
      `Closes #13` and **PRINT THE PR URL in the chat**.
- [ ] Update the roadmap row 06 to `done · [#<pr>](<pr-url>)`.
- [ ] Commit `docs: link PR #<n>` and push.
