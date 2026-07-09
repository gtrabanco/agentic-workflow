# 06 — design-feature · progress

Running log, one entry per phase. Executors append; do not rewrite history.

| Phase | Status | Date | Notes |
|---|---|---|---|
| P1 — SPEC two-halves + template + pipeline docs | done | 2026-07-09 | Template + FEATURE_WORKFLOW.md + SKILLS.md updated |
| P2 — design-feature skill (core) | done | 2026-07-09 | `skills/design-feature/SKILL.md` v1.0.0 authored |
| P3 — plan-feature slim (major) + interview retirement + alignment | done | 2026-07-09 | `plan-feature` 2.0.0, redirect gate; interview retired; from-issue/scaffold aligned |
| P4 — Hardening + bookkeeping | done | 2026-07-09 | bump-skill run; all ACs + audit-docs verified; PR opened |

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
- **P3 (execute-phase 06 P3)** — Slimmed `skills/plan-feature/SKILL.md` to
  2.0.0 (major): dropped the `--interview` flag and the raw-idea routing row,
  added the **redirect gate** (no `SPEC.md`, `## Design status` not
  `designed`, or empty Capability closure → STOP, print the fixed
  `/design-feature <slug>` block, no bypass flag — confirmed no
  `--force-plan`/`--skip-design`/`--no-design` flag exists), updated Turn
  contract / Routing / Machine envelope (`BLOCKED` now covers the redirect,
  kind `undesigned`) / Relationship / Done when. Deleted
  `skills/plan-feature-interview/` (`git rm -r`) and repointed every **live**
  reference to `design-feature`: `skills/plan-feature-from-issue/SKILL.md`
  (1.3.0 — writes the product half, satisfies capability closure, hands thin
  issues to `design-feature` respecting the ≥-tier rule),
  `skills/plan-feature-scaffold/SKILL.md` (1.5.0 — fills only the engineering
  half, verifies `designed` before writing), `docs/workflow/PORTABLE_PROMPT.md`,
  `docs/workflow/RECOMMENDED_SKILLS.md`, `docs/workflow/REPLICATE.md`,
  `docs/workflow/model-routing.yml` (design-feature tier row added,
  plan-feature-interview row dropped), `README.md`, `README.es.md`. Added the
  `docs/workflow/MIGRATION.md` section (plan-feature 2.0.0, command
  muscle-memory table, backfill guidance for pre-existing single-half SPECs).
  **D12 recorded**: AC7's blanket grep can't literally return zero (this
  feature's own planning docs, `ROADMAP.md`'s row 06, and MIGRATION.md's
  pre-existing v2 historical section all legitimately keep the name) — verified
  file-by-file instead that every live/operational doc was repointed; see
  `decisions.md`. `npx skills add . --list` — no errors, `plan-feature-interview`
  absent, `design-feature`/`plan-feature`/`plan-feature-from-issue`/
  `plan-feature-scaffold` all discovered with their new descriptions. AC6/AC7/AC9
  verified. Next: `execute-phase 06 P4`.
- **P4 (execute-phase 06 P4)** — Ran `bump-skill`: new `design-feature` 1.0.0
  row, `plan-feature` major-bump row, `plan-feature-interview` removal row,
  `plan-feature-from-issue`/`plan-feature-scaffold` minor rows added to
  `CHANGELOG.md` + `CHANGELOG.es.md` (per-skill tables + release log, both
  languages); README.md/README.es.md gained a `## Design`/`### Diseño` section
  and an updated `plan-feature` row/description and model-tier table row; lint
  (5 authoring rules) found no genuine violations (the "Step 0" / phase-naming
  regex hits are the fixed section header, not `S1`/`S2` labels — false
  positive, confirmed). Ran the full AC sweep: AC1–AC11 all pass (`npx skills
  add . --list` discovers all 28 skills cleanly, no parse errors,
  `plan-feature-interview` fully absent from `skills/`). Ran `/audit-docs`:
  Decision PASS — no genuine drift (roadmap row 06 still `planned` is expected
  mid-phase state, resolved by this phase's close-out below; the "Step 0" hits
  are the same false positive). Weak-model read-through of `design-feature`:
  every closure row independently checkable, no "if needed", `## Portability`
  intact, closure gate rejects a blank row (`NEEDS_INPUT`), upsert destroys
  nothing (append-only to `decisions.md`). No stack/product leakage confirmed
  by spot-grep (only false-positive substring hits inside "Guardrails").
  Close-out: PR opened (see PR reference below), roadmap row flipped to
  `done`, `docs: link PR` commit pushed.
