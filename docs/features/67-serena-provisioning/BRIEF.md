# Brief — unit 67 (serena-provisioning)

A reviewer's two-minute restatement, written from `decisions.md` so no
reviewer has to re-derive the step's questions. Issue #219.

## What the change is

Serena provisioning becomes **present by default** on both paths, after the
project-config half already landed (PRs #263/#264):

- **pi path** — `@gtrabanco/pi-agentic-workflow` exact-pins
  `@bacnh85/pi-serena` and declares its extension entry through
  `node_modules`, so a pi install gets the `serena_*` tools with no extra
  step; a scheduled action watches the pins and opens an issue when one drifts.
- **non-pi path** — `init-workspace` gains the consented tool-install step
  (`uv tool install … serena-agent`), MCP registration for the detected
  platform, and the consented global-trust append.
- **pi-side readiness** — a latched, code-only nudge suggests
  `/init-workspace` when the project config is missing/stale; it never writes
  to the project or to any configuration.

## Asked → Resolution

| Asked | Resolution |
|---|---|
| Q1 · pi activation shape | **A** — dependency + second `pi.extensions` entry `./node_modules/@bacnh85/pi-serena/extensions/index.ts`, exact-pinned, scratch-install verified, plus a scheduled pin-watch action (D1, owner, ask form `d387d8bb`) |
| Q2 · who writes `.serena/project.yml` | **B** — `init-workspace` is the only writer; the pi package reports fail-closed and its README names `/init-workspace` (D2, owner, same form) |
| Q3 · settings toggle | **A** — none; required substrate, pi's own off switch documented (D3, owner, same form) |
| Q4 · global trust write | **A** — ask-first append inside the consented Serena step; refusal = recorded residual (D4, owner, ask form `81f1be20`) |
| Q5 · code-level readiness nudge | **A** — latched once-per-state check, no writes, soft on failure (D5, owner, ask form `d387d8bb`) |

## What a reviewer can check, mechanically

- `node scripts/needs-input.mjs docs/features/67-serena-provisioning` — exit 0,
  `Pending: none`.
- `bun scripts/unit-route.mjs --triage 67-serena-provisioning` — exit 0, the
  nine-step block pasted verbatim in the SPEC.
- `grep -c "^| INV-" docs/features/67-serena-provisioning/sources.md` — every
  claim carries a source and a tier/cost verdict.
- After implementation: the SPEC's Evidence rows, one per AC.

## What this unit deliberately does not do

- No LSP evidence consumption inside review (roadmap row 51 / issue #218).
- No second writer of `.serena/project.yml` inside the pi package (D2).
- No new config key in the pi package's closed schema (D3).
- No schema/envelope surface, no triage-catalog change.

## Plan stage (2026-10-21)

none — no questions: every claim was settled by provenance or research

Twelve `CLAIM-*` rows (`sources.md`) were swept against the candidate sources
(`AGENTS.md`, prior `decisions.md`, the four GitHub workflows, the roadmap);
zero `contradicts` hits, so no `open-question` row was appended for the plan.
The cut is six phases (P1…P6) with thirteen obligations (O1…O13, all `planned`)
and twelve planning-evidence rows, in `planning-evidence.md` and
`planning-obligations.md`.
