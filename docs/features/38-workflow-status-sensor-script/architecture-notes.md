# architecture-notes — 38-workflow-status-sensor-script

## Layer analysis

The implementation spans two layers:

- **config/infra (P1, P2):** `scripts/workflow-status.mjs` is a new Node.js CLI script
  in the existing `scripts/` directory. It follows the same convention as
  `scripts/schema-runtime.mjs`, `scripts/check-skill-context.mjs`, and all other
  scripts in the directory: ES module, no transpilation, no bundler, Node ≥ 18.
  The script uses only `node:fs`, `node:path`, `node:child_process` (for the snapshot
  verifier subprocess) — no new dependencies.
- **docs (P3):** Skill text changes (SKILL.md, SENSOR_CORE.md, ENVELOPE_CORE.md),
  discipline-test pin updates, context budget manifest updates, ORCHESTRATION.md wiring,
  MIGRATION.md note, CHANGELOG rows. All text changes. No source code touched.
- **hardening (P4):** No new surface. Regression suite runs against existing infrastructure.
  Schema package is byte-untouched. Pi bundle re-syncs skill trees.

## Port analysis

No new ports, API endpoints, or network interfaces. The script is a CLI tool invoked
locally via `node scripts/workflow-status.mjs`. Consumers (drivers, ship-roadmap, humans)
read its stdout output. No binding to external services beyond what the existing
`gh` and `git` commands already do.

## Schema analysis

The script consumes the schema package's Envelope v2 vocabulary through the repo's
established loader (`scripts/schema-runtime.mjs` → `packages/agentic-workflow-schema/dist/index.js`).
The schema package itself is byte-untouched (A:13). The script uses:

- `loadSchemaRuntime()` — import the built dist
- `validateEnvelope()` — self-validate the envelope before printing
- The Envelope v2 field definitions (from the schema's exported types)

No new schema types, fields, or validators are introduced. The `detail` field is
schema-unconstrained (`envelope.schema.json:182-184`, "documented per skill"), so the
script's new `detail` shapes (degradation codes, workflow_observations, pre_execution)
need no schema-package change.

## Binding analysis

### Tight bindings (must be updated together)

- SKILL.md ↔ SENSOR_CORE.md: both slimmed in the same P3 change. If one is slimmed
  but the other is not, the skill's `--json-only` mode would still reference the
  prose-instructed steps (broken).
- Discipline-test pins ↔ slimmed skill text: all four re-targeted pin suites must
  exit 0 together. If one pin's source is not updated, the suite fails.
- ORCHESTRATION.md ↔ ORCHESTRATION.es.md: bilingual sync — both must carry the
  same script wiring in the same change (per the bilingual sync rule).
- CHANGELOG siblings: both must get the 3.2.1 → 3.3.0 row.
- SKILL_CONTEXT_BUDGETS.json ↔ check-skill-context.mjs: the budget manifest entry
  must match what the tool measures.

### Loose bindings (independent of this feature)

- Schema package (`packages/agentic-workflow-schema/`): byte-untouched. The schema
  package's own suite must pass, but no changes are required.
- Pi package (`packages/pi-agentic-workflow/`): re-bundled through `bundle:skills`,
  which copies skill trees. The script does not travel (PE-009), so the Pi bundle
  output is unchanged from the pre-slimming bundle (it copies the slimmed skill trees).

### No bindings

- `decideWorkflowAction()` (schema package): stays consumer-side. The script does not
  reference it (A:12). The function lives exclusively in the schema package and is
  called by consumers (drivers, ship-roadmap) after reading the script's output.