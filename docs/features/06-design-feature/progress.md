# 06 — design-feature · progress

Running log, one entry per phase. Executors append; do not rewrite history.

| Phase | Status | Date | Notes |
|---|---|---|---|
| P1 — SPEC two-halves + template + pipeline docs | done | 2026-07-09 | Template + FEATURE_WORKFLOW.md + SKILLS.md updated |
| P2 — design-feature skill (core) | done | 2026-07-09 | `skills/design-feature/SKILL.md` v1.0.0 authored |
| P3 — plan-feature slim (major) + interview retirement + alignment | not started | — | |
| P4 — Hardening + bookkeeping | not started | — | |

## Log

- **Planning (plan-feature, from issue #13)** — SPEC + full M artifact set written;
  roadmap row 06 registered. Size M, no dependencies (U1/U2 merged). Next:
  `execute-phase 06 P1`.
- **P1 (execute-phase 06 P1)** — `docs/features/_TEMPLATE/SPEC.md` restructured
  into a Product half (Context, Business goals, Scope, Capability closure →
  Acceptance criteria, Tooling, Product decisions, `## Design status`) and an
  Engineering half (Technical goals, Architecture impact, Design, Decisions to
  confirm, Testing requirements, Dev scenarios, Phases, Deploy & rollback, Open
  questions/risks, Deliverables, Post-merge next feature), with the capability-
  closure checklist skeleton embedded. `docs/workflow/FEATURE_WORKFLOW.md` gains
  a `Stage 0 — Design` section (design-feature, capability closure, the redirect
  gate) and renumbers `Stage 1`/`1b` for the plan router; the worked example now
  opens with `/design-feature`. `docs/workflow/SKILLS.md` gains a `## Design`
  section for `design-feature`, updates `plan-feature`'s role to
  "engineering-planning only" with the redirect, and updates the composition
  diagram — the `plan-feature-interview` row is dropped from these two docs
  (its actual removal, `rm -r skills/plan-feature-interview/`, is P3; other refs
  in README/REPLICATE/RECOMMENDED_SKILLS/MIGRATION/model-routing stay until
  P3's full sweep). `design-feature` and `plan-feature-scaffold` skills
  themselves don't exist/aren't edited yet — P2/P3. Next: `execute-phase 06 P2`.
- **P2 (execute-phase 06 P2)** — Authored `skills/design-feature/SKILL.md`
  (`user-invocable: true`, `version: 1.0.0`), with `## Turn contract`,
  `Step 0`, `Process` (interaction rule → raw-idea interview folded in →
  proportional research → capability-closure checklist → scale-down →
  per-feature tooling → write product half → stamp `## Design status` →
  roadmap registration → upsert discipline → hand-off), `Guardrails`,
  `## Machine envelope` (`OK`/`NEEDS_INPUT`/`BLOCKED`), `## Portability`,
  `Relationship to other skills`, `Done when` with the closing `→ Next:`
  block. Verified: AC1 (`name:`/`user-invocable:` greps), AC3 (`add feature`),
  AC4 (`capability closure`), `npx skills add . --list` discovers it alongside
  every existing skill with no parse errors. `plan-feature` itself is not yet
  edited to redirect here — that's P3. Next: `execute-phase 06 P3`.
