# 66 — planning obligations

Row shape per `skills/pre-execution-review/references/LEDGERS.md` §2:
`obligation-id | authority-source | affected-use-case-or-invariant | phase |
task | implementation-owner | validator | required-evidence | status`.
Exactly one phase and one task per row; every row `planned` at cut time,
`verified` (or evidenced `n/a`) before the unit ships. Reader validators are
single commands with a stated outcome so `scripts/promise-coherence.mjs` can
re-run them at the head; non-reader validators (`bun run test`,
`bun scripts/…`) are re-run by the root gate instead and are marked by their
evidence rows.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | SPEC AC2 + `decisions.md` D1 | bounded health probe before the first memory read; absent binary/transport/runner yields `DEGRADED`, never a hang and never a blocked unit | P1 | P1 | execute-phase | `bun run test` exits 0 (probe suite: timeout, missing-binary, missing-runner fixtures) | probe test names in the P1 Evidence row | planned |
| O2 | SPEC AC2 + issue #262 comment 2026-09-28 item 2 | sync/autosync staleness is part of the verdict — a responding server that has not synced is not `ok` | P1 | P1 | execute-phase | `bun run test` exits 0 (staleness fixture asserts a non-`ok` verdict) | staleness test name in the P1 Evidence row | planned |
| O3 | SPEC AC1 + issue #262 comment 2026-10-21 item 1 | unit-boundary saves carry goal, numbered ACs, Evidence outcomes and discoveries, keyed `unit/<NN-slug>/doc`, at start / each phase / close | P2 | P2 | execute-phase | `grep -q "unit/<NN-slug>" skills/unit-lane/references/MEMORY.md exits 0` | pasted protocol paragraph in the P2 Evidence row | planned |
| O4 | SPEC AC4 + issue #262 comment 2026-10-15 (discipline rewrite) | recall order: `mem_context` → scoped search with explicit `project` → one explicit `all_projects: true` retry; omitted selectors are never global; `available_projects` on ambiguity | P2 | P2 | execute-phase | `grep -q "all_projects" skills/unit-lane/references/MEMORY.md exits 0` | pasted discipline block in the P2 Evidence row | planned |
| O5 | SPEC AC7 + issue #262 comment 2026-09-28 item 1 | keyword-bound recall ceiling disclosed where recall guidance lives (a miss is not evidence of absence) | P2 | P2 | execute-phase | `grep -q "keyword-bound" skills/unit-lane/references/MEMORY.md exits 0` | pasted disclosure in the P2 Evidence row | planned |
| O6 | SPEC AC5 + issue #262 comment 2026-09-28 item 3 | every save passes an explicit `session_id`; `mem_session_end` only on confirmed-stale ids; the ambiguity case never fails silently | P2 | P2 | execute-phase | `grep -q "mem_session_end" skills/unit-lane/references/MEMORY.md exits 0` | pasted attribution rule in the P2 Evidence row | planned |
| O7 | SPEC AC8 + issue #262 comment 2026-10-21 items 3–4 | degradation recorded, never silent: mirror marked pending, local progress preserved, file + mirror writes read back | P2 | P2 | execute-phase | `grep -q "pending" skills/unit-lane/references/MEMORY.md exits 0` | pasted degradation rule in the P2 Evidence row | planned |
| O8 | SPEC AC6 + `decisions.md` D2 | canonical split stated by the journal writer: `docs/LOGS.md` is the git-traveling team journal; `mem_session_summary` is unit-keyed local recall | P3 | P3 | execute-phase | `grep -q "mem_session_summary" skills/log-session/SKILL.md exits 0` | pasted split text in the P3 Evidence row | planned |
| O9 | SPEC AC5 + issue #262 comment 2026-10-15 | `mem_session_summary` explicit `project` fallback documented as the session-attribution escape hatch | P3 | P3 | execute-phase | `grep -q "project fallback" skills/unit-lane/references/MEMORY.md exits 0` | pasted fallback line in the P3 Evidence row | planned |
| O10 | SPEC AC3 + `decisions.md` D3 (pi consent rule) | pi registration is consent-gated, only when the binary is present, and reports exactly what was written | P4 | P4 | execute-phase | `bun run test` exits 0 (pi registration + consent fixtures) | test names in the P4 Evidence row | planned |
| O11 | SPEC AC3 + `decisions.md` D3 (install route) | documented install route is `pi install npm:gentle-engram@latest`; `engram setup pi` is never printed as an instruction | P4 | P4 | execute-phase | `grep -rn "engram setup pi" packages/pi-agentic-workflow matches 0` | grep stdout in the P4 Evidence row | planned |
| O12 | `AGENTS.md` Packages § (feature 75 rule) + PE-008 | pi package version bumped with its CHANGELOG companion row and the stale schema pin 4.6.0 → 4.7.0 in the same PR | P4 | P4 | execute-phase | `node scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow exits 0` | gate stdout in the P4 Evidence row | planned |
| O13 | SPEC AC3 + issue #219 §Mechanics (non-pi parity) | `init-workspace` offers Engram ask-first, reports exactly what was written, skips cleanly on refusal | P5 | P5 | execute-phase | `grep -q "ENGRAM" skills/init-workspace/SKILL.md exits 0` | step text in the P5 Evidence row | planned |
| O14 | `AGENTS.md` "Version every change" + SPEC AC9 | touched skills bump `version:` with CHANGELOG rows; budgets re-based; root gate green | P6 | P6 | execute-phase | `bun scripts/check-skill-context.mjs --routes exits 0` | gate stdout in the P6 Evidence row | planned |
| O15 | `AGENTS.md` Packages § + PE-009 | the touched crate `@gtrabanco/agentic-workflow` carries its own version bump + CHANGELOG companion row | P6 | P6 | execute-phase | `node --test scripts/*.test.mjs exits 0` | root-suite stdout in the P6 Evidence row | planned |
