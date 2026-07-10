# 10 — envelope-orchestrator-only · known-issues

Deferred / external items. Do not implement deferred work inline.

## Blocking external gate — driver repair loop (issue #17 §"Hard sequencing constraint")

The user's Node/opencode driver must implement `parseEnvelope()` + the re-invoke
repair loop **before** this skills change merges. If the skills strip lands first,
every driven run loses routing the moment a skill stops emitting the envelope.

- **Owner:** the user's external driver project (outside this repo).
- **Effect on this feature:** blocks **execution** (`execute-phase 10 P1`), not
  planning. Confirm the driver is ready before starting P1.
- **Not a roadmap dependency:** the roadmap dependency graph tracks feature→feature
  edges only; this is an external system, recorded here and flagged by the
  `plan-feature` closing block.

## Out of scope — deferred to their owners (not this feature)

- Envelope **schema / npm package** changes — frozen this feature (SPEC AC8). Any
  schema evolution is a separate unit against
  `packages/agentic-workflow-schema/` + `orchestration-envelope`.
- The driver's **implementation** of the snippet + repair loop — the user's
  external project; this feature only documents the contract.
