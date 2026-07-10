# 13 — init-workspace-upgrade-mode · progress

Running log — one entry per phase.

## Planning — 2026-07-10

Planned from issue #20 (U10) via `plan-feature` → `plan-feature-from-issue`
(product half, capability closure satisfied, `## Design status: designed`) →
`plan-feature-scaffold` (engineering half + this artifact set). Size **M**,
2 phases. Dependencies 06/07/08 (U3/U4/U5) all `done`+merged → startable, no
blockers (fix index empty; only open issues are #20 and #21). Roadmap row 13
registered as `planned`. Branch `feat/13-init-workspace-upgrade-mode` off `main`
(614bc55). Next: `execute-phase 13 P1`.

## P1 — Upgrade mode in `init-workspace` — 2026-07-10

Extended Step 0 detection (`skills/init-workspace/SKILL.md`) to recognize an
existing agentic-workflow scaffold (marker: `CLAUDE.md` + `docs/features/
ROADMAP.md` or `docs/workflow/`) and offer **upgrade** as the default action
alongside merge/adapt/abort. Added the `## Upgrade mode` process section with
the six ordered steps from the SPEC design (fetch current template → diff
substrate → read `MIGRATION.md` → propose-only-missing short interview →
additive write → report). Added the additive-only, never-clobber invariant to
Guardrails. All four P1 acceptance greps pass; `npx skills add . --list`
still discovers `init-workspace` cleanly (gate green — no application build
in this repo, doc-coherence is the bar). Planning artifacts and the roadmap
row were already committed in `04f9edd` before this phase started. Next:
`execute-phase 13 P2` (documented recommendation + hardening + `bump-skill`
+ PR).

## P2 — Documented recommendation + hardening

_pending_
