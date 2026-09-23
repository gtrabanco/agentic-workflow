# Acceptance manifest v1 — 62-pi-native-conductor

Status: frozen

Frozen 2026-09-23 by `review-change` from the SPEC's acceptance criteria
AC1…AC12. One stable ID per SPEC criterion; validators copied from the criteria.
The manifest is the implementation/review finish line, not a second
specification; the executor may strengthen coverage but never move it.

| ID | Required outcome | Validator |
|---|---|---|
| AC-01 | Native `advance` command registered by package code (not skill dir): `factory.ts` imports `registerAdvanceCommand`, calls it with `ADVANCE_COMMAND`, and the alias-coverage test confirms the command is in the registered command set | `cd packages/pi-agentic-workflow && bun run test` → exit 0; `grep -c 'ADVANCE_COMMAND' test/alias-coverage.test.mjs` ≥ 1 |
| AC-02 | Decide-then-invoke loop: each iteration runs the sensor, validates Envelope v2, calls `decideWorkflowAction()`, and on `invoke` sends the verbatim `/skill:<verb> <args>` — argv never mutated; `sendUserMessage` receives exactly the mapped string | `cd packages/pi-agentic-workflow && bun test test/conductor-loop.test.mjs test/conductor-decide.test.mjs test/conductor-invoke.test.mjs` → exit 0 (loop AC1/AC2, decide AC4, invoke AC2) |
| AC-03 | Fail-closed refusals: sensor spawn failure, non-JSON, schema-invalid envelope, degradations[] → typed refusal from `CONTINUATION_REFUSALS` (`sensor-degraded`, `precondition-uncheckable`, `rendering-failed`, `no-decision-available`), loop stops, no invocation sent | `cd packages/pi-agentic-workflow && bun test test/conductor-sensor.test.mjs test/conductor-loop.test.mjs` → exit 0 (sensor AC3 + loop AC3/AC9) |
| AC-04 | Sense and stop verdicts: `sense` → re-sense once → STOPPED if still stale; every `stop` decision ends loop with reason code (`stop-blocked`, `stop-needs-input`, `stop-failed`, `stop-contradiction`) and detail | `cd packages/pi-agentic-workflow && bun test test/conductor-loop.test.mjs test/conductor-decide.test.mjs` → exit 0 (loop AC4, decide AC4 sense/stop rows) |
| AC-05 | Deterministic urgency judge: 5-row table (no-urgent, fix-next → finish-first, dirty==false → interrupt-now, tasks_from_boundary≤1 → finish-first, ambiguous → fail-safe finish-first); no model call | `cd packages/pi-agentic-workflow && bun test test/conductor-urgency.test.mjs` → exit 0 (5 rows + valid verdict + reason present) |
| AC-06 | Unattended adversarial floor: attended → no flag; unattended + L/sensitive → `--adversarial 2`; unattended + security → `--adversarial 3`; security overrides sensitive; non-review intent → no adversarial flag | `cd packages/pi-agentic-workflow && bun test test/conductor-invoke.test.mjs` → exit 0 (attended/none, L/2, security/3, security overrides, non-review none) |
| AC-07 | Closeout gate: clean iff `git status --porcelain` empty ∧ ahead==0; 3 consecutive partials → STOPPED with park reason | `cd packages/pi-agentic-workflow && bun test test/conductor-closeout.test.mjs test/conductor-loop.test.mjs` → exit 0 (closeout AC7 + loop AC7 3-partials) |
| AC-08 | Terminal banners: COMPLETE (nothing startable), BLOCKED (unblock map), STOPPED (cap/refusal/needs-input), stop code detail; iterations cap stops with `stop-failed` + cap detail | `cd packages/pi-agentic-workflow && bun test test/conductor-loop.test.mjs` → exit 0 (loop AC8 banners + cap) |
| AC-09 | Merge authority intact: merge-ready PR → stop-needs-input naming `/audit-pr`, no merge command ever sent; `--fullauto` does not enable merge | `cd packages/pi-agentic-workflow && bun test test/conductor-loop.test.mjs` → exit 0 (loop AC9 merge-ready + fullauto no-merge) |
| AC-10 | Run log: every iteration appends one line (`YYYY-MM-DD HH:MM — kind/code — command/stop — k/cap`); gitignored | `cd packages/pi-agentic-workflow && bun test test/conductor-loop.test.mjs` → exit 0 (loop AC10 log format); grep confirms `.agentic-workflow/advance-run.log` matches `*.log` in `.gitignore` |
| AC-11 | Snapshot mapping is deterministic and tested: envelope→WorkflowSnapshot mapping is pure function, each envelope field lands in the correct snapshot field; same input → deepEqual; different input → different | `cd packages/pi-agentic-workflow && bun test test/conductor-snapshot.test.mjs` → exit 0 (mapping + purity + null-unit) |
| AC-12 | Gates stay green: root suite (554/0), schema suite (717/0), pi suite (339/0 bun + 339/0 node), npm pack valid — all pass at merge time; no envelope field/code changed | `node --test scripts/*.test.mjs` → exit 0; `cd packages/agentic-workflow-schema && bun run test` → exit 0; `cd packages/pi-agentic-workflow && bun run test` → exit 0; `cd packages/pi-agentic-workflow && bun run test:node` → exit 0 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review
  and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && bun run test`
- `cd packages/pi-agentic-workflow && bun run test`
- `cd packages/pi-agentic-workflow && bun run test:node`
- `node --test scripts/*.test.mjs`
- `cd packages/pi-agentic-workflow && npm pack --dry-run`