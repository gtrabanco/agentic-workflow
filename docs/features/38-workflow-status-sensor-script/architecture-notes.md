# architecture-notes — 38-workflow-status-sensor-script

## Position in the pipeline

```text
                    ┌─ external drivers (ORCHESTRATION.md) ─┐
                    │  poll the envelope, route, pick tiers  │
                    ▼                                        │
scripts/workflow-status.mjs  (NEW — the deterministic producer)
  ├─ runs SENSOR_CORE steps 1–9 (incl. 6a)          read-only, bounded
  ├─ assembles Envelope v2 from the schema package   (loadSchemaRuntime,
  │   via scripts/schema-runtime.mjs                 validateEnvelope self-check)
  ├─ degrades declared failures to
  │   unavailable-<source>-<cause> (exit 0)
  └─ prints one JSON document to stdout              byte-identical per tree

skills/workflow-status  (SLIMMED — interpret-and-recommend)
  ├─ runs the script, reads the JSON
  ├─ interprets next.recommended (tier map, suggested triggers) + codes
  └─ prints the human summary, then the envelope last

consumers: decideWorkflowAction() stays CONSUMER-side (schema package, A-12)
```

## Surfaces and layers

- **Script (config/infra):** `scripts/workflow-status.mjs` (new) — collection,
  assembly, degradation, flags. Consumes `scripts/schema-runtime.mjs` (built
  local package by explicit path; no published fallback, no new dependency).
- **Suite (config/infra):** `scripts/workflow-status-sensor.test.mjs` (new) —
  git fixture repo + `gh` shims (missing / fail-fast / non-terminating),
  red-first per phase.
- **Skill (docs):** `skills/workflow-status/SKILL.md`,
  `references/SENSOR_CORE.md` (keeps the `sensor-fields@1` grammar block — the
  normative-drift surface), `references/ENVELOPE_CORE.md` (keeps state mapping
  + tier map). Six other reference files byte-identical.
- **Pins (repository tests):** `scripts/bounded-delivery-loops.test.mjs`,
  `scripts/pre-execution-quality.test.mjs`,
  `scripts/workflow-status-pre-execution.test.mjs` re-targeted to
  script-behavior form (never weakened); `scripts/normative-drift.test.mjs`
  unchanged (grammar block stays in place).
- **Docs:** `docs/workflow/ORCHESTRATION.md` + `.es.md` (driver wiring),
  `docs/workflow/MIGRATION.md` (additive note), `CHANGELOG.md` (3.2.1 → 3.3.0),
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (re-based sensor entry).
- **Distribution:** `packages/pi-agentic-workflow` re-bundled only through
  `bundle:skills`; `packages/agentic-workflow-schema/` byte-untouched
  (`detail` schema-unconstrained — `envelope.schema.json:184`).

## Ownership invariants held

- The script performs no durable-ledger write of any kind (read-only by
  construction, A-03); the sensor never edits a roadmap row, ledger, or receipt.
- `decideWorkflowAction()` stays consumer-side exclusively (A-12).
- Labels-only urgency (feature 15) is structural: bodies/comments are never
  fetched (A-07); the read-verified pass re-checks at qualification (A-RV).
- Envelope vocabulary unchanged (A-13): every new `detail` shape rides the
  schema-unconstrained `detail` object — no package release.
