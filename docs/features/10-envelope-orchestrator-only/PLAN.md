# 10 — envelope-orchestrator-only · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` (the executor's
argument, e.g. `execute-phase 10 P2`). Planning is done; `P1` is the first
implementation phase. The last phase is hardening. Opening the PR is the final
*step* of P4, not a phase of its own.

> **Execution is driver-gated.** Do not start P1 until the user confirms the
> external opencode/Node driver ships the envelope repair loop (see SPEC
> Dependencies + `known-issues.md`). Planning is complete regardless.

## P1 — Orchestration home (the contract moves in)

One concern: the orchestration layer. Add, before anything is removed from the
skills, the canonical contract at its new home so nothing is momentarily
homeless.

- Add the canonical **driver system-prompt snippet** (fenced, verbatim) to
  `skills/orchestration-envelope/SKILL.md`.
- Document the **repair loop** protocol (parse-fail → re-invoke with the one-line
  prompt) in `docs/workflow/ORCHESTRATION.md`.
- Mirror the snippet into `docs/workflow/PORTABLE_PROMPT.md` (the prompt a driver
  injects).
- Note `workflow-status` stays the inline emitter (no repair loop needed for it).
- Gate: AC4, AC5.

## P2 — Strip the 14 skills

One concern/layer: skills text. Uniform, mechanical, grep-checkable. Apply the
three-deletion removal shape (SPEC → Design) to each:
`audit-docs, audit-pr, bump-skill, design-feature, execute-phase, generate-docs,
init-workspace, log-session, plan-feature, plan-fix, product-audit, review-change,
ship-roadmap, triage-issue`.

- Delete the `## Machine envelope` section.
- Delete the turn-contract envelope box line(s).
- Remove any "then the machine envelope" clause so `→ Next:` is the true last
  output.
- Do **not** touch `workflow-status` or `orchestration-envelope`.
- Do **not** hand-edit `version:` here (P3 does it via bump-skill).
- Gate: AC1, AC2, AC3.

## P3 — Release metadata

One concern: version/release docs.

- Run `bump-skill` for the 14 stripped skills: MAJOR bump each, add rows to
  `CHANGELOG.md` + `CHANGELOG.es.md`, refresh both README skill/model tables.
- Add the `docs/workflow/MIGRATION.md` entry (what/where-now, per SPEC → Design).
- Gate: AC6, AC7.

## P4 — Hardening + PR

Edge cases + dev-scenario failure modes, then close out.

- Sweep for **dangling envelope references** across `skills/` and `docs/workflow/`
  (AC10) — any skill still pointing at a removed section is fixed.
- Confirm `packages/agentic-workflow-schema/` is untouched (AC8).
- Confirm `npx skills add . --list` lists all skills (AC9).
- Re-confirm `workflow-status` still emits (AC3) and P1's repair-loop doc reads
  coherently end-to-end.
- Re-run every AC command; all pass.
- Open the PR (`gh pr create --body-file …`, body includes `Closes #17`), PRINT
  THE PR URL, update the roadmap row to `done · [#<pr>]`, commit `docs: link PR`.
- Gate: full AC re-run green.
