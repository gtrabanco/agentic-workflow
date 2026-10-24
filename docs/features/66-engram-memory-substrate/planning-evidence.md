# 66 — planning evidence

Row shape: `id | claim | source | status` (M-scope home per
`skills/pre-execution-review/references/LEDGERS.md` §1 and the plan step's
sizing rule — bound by the plan snapshot, never duplicated in the SPEC).

| id | claim | source | status |
|---|---|---|---|
| PE-001 | The runner crate owns a router bin (`memory` command slot) and a bun test harness for the new probe | `packages/agentic-workflow/package.json:13,20`; `bin/agentic-workflow.mjs` switch (CLAIM-001) | verified |
| PE-002 | Skills invoke crate services by path / by CLI name — the probe's invocation has a precedent, and a missing runner is the DEGRADED case | `skills/execute-phase/references/PREFLIGHT.md:200`; `docs/workflow/LANE_FLOW.md:234-239`; CLAIM-003, CLAIM-014 | verified |
| PE-003 | The probe must read sync/autosync staleness, and a green exit code is not health (`doctor` exits 0 while JSON says `status: error`) | research R3–R4 (SPEC Evidence); SPEC AC2 | verified |
| PE-004 | `init-workspace` consented-step pattern exists to mirror (reference doc + wired step + report exactly) | `skills/init-workspace/references/BOOTSTRAP_WRITE.md:28-31`, `references/SERENA.md:84` (CLAIM-004) | verified |
| PE-005 | The pi package has the extension + settings surfaces a consent-gated registration belongs to, and pi exposes `pi.registerMcpServer(name, config)` | `packages/pi-agentic-workflow/src/extension/*`, `src/settings/store.ts`, `README.md:131`; pi docs `extensions.md:197` (CLAIM-005, CLAIM-006) | verified |
| PE-006 | Install route: `pi install npm:gentle-engram@latest`; `engram setup pi` discarded (stale version until re-run) | `decisions.md` D3, owner answer 2026-10-21 (CLAIM-007) | verified |
| PE-007 | Skill edits require a budgets re-base and `version:` bumps; skills/pi changes require the pi package version + CHANGELOG companion row in the same PR | `AGENTS.md` Verification § + Packages §; `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (CLAIM-008, CLAIM-009) | verified |
| PE-008 | Pre-existing pin drift blocks the PR gate: pi pins `@gtrabanco/agentic-workflow-schema` at 4.6.0, registry published 4.7.0 — parity gate already rejects | `node scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow` → `GATE REJECTION — dependency-pin-drift`, 2026-10-21 (CLAIM-010) | verified |
| PE-009 | Registry facts at planning time: `@gtrabanco/agentic-workflow` 0.2.0, `@gtrabanco/pi-agentic-workflow` 0.26.0, `@gtrabanco/agentic-workflow-schema` 4.7.0 | `npm view …` outputs, 2026-10-21 (CLAIM-010, CLAIM-015) | verified |
| PE-010 | The target-project scaffold carries no `scripts/` tree, so portability of the probe rests on the runner CLI + the DEGRADED clause | `find template -maxdepth 2 -type d`, 2026-10-21 (CLAIM-014) | verified |
| PE-011 | The engram↔feature-61 non-goal conflict is resolved at tier 0 by the owner decision (reconcile in the docs step), never re-decided here | `docs/features/61-adaptive-unit-lane/SPEC.md:153`; `docs/LOGS.md:2451` (CLAIM-011) | verified |
| PE-012 | Carrying-surface list for the protocol text (unit-lane, execute-phase, log-session; init-workspace for provisioning) is a dated, cheap assumption, not a frozen fact | `decisions.md` Assumption A2, 2026-10-21 (CLAIM-012) | unknown — ASSUMPTION-UNVERIFIED (owner: plan step A2, correctable until P2 lands) |
