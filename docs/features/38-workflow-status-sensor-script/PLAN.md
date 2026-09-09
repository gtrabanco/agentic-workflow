# PLAN — 38-workflow-status-sensor-script

Four implementation phases (sensor core emission → failure contract → skill
slimming → qualification). The collection/assembly design, failure contract,
and slimming surface are frozen in `SPEC.md` (`## Engineering half` →
`### Design`). Artifact revision of this plan set: `38-plan-1`.

## P1 — Sensor script core emission

Layer: config/infra. `scripts/workflow-status.mjs` executes SENSOR_CORE steps
1–9 into one schema-valid Envelope v2 on stdout; red-first fixture suite.

## P2 — Sensor script failure contract

Layer: config/infra. Namespaced degradation codes, bounded forge latency,
`--json-only` no-op, `--help`/`--version`, `--last-envelope` hint diff +
no-progress guard, fail-open hints, invalid-invocation fatal class,
stdout/stderr separation.

## P3 — Workflow-status skill slimming

Layer: docs. SKILL.md + SENSOR_CORE.md + ENVELOPE_CORE.md slim to
interpret-and-recommend; discipline pins re-targeted (never weakened); budgets
re-based; version bump 3.2.1 → 3.3.0.

## P4 — Qualify the sensor unit

Layer: hardening. Driver wiring (EN + ES), MIGRATION note, pi bundle parity,
full frozen validation ladder, read-verified injection-safety pass, truthful
planning-doc close-out, PR open with `Closes #185` + roadmap flip.
