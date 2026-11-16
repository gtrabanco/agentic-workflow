# #595 — Test surplus audit: Tests dimension gains the surplus direction

## Origin

Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595).
Triaged 2026-11-17: promoted to feature (new product-audit dimension direction).
Promoted label applied.

## What

product-audit's Tests dimension only covered the **deficit** direction (missing tests).
This unit adds the **surplus** direction — tests that should not exist — with
three checks and a verified-no-surplus evidence row.

## Acceptance criteria

- [ ] A product-audit pass on this repo reaches the Tests dimension and records the `verified: no surplus tests` row or evidence-backed findings.
- [ ] The three surplus checks are in the dimension inventory with their evidence standards.
- [ ] The weakening-vs-deletion boundary is stated where the check is defined.
- [ ] `bun scripts/check-skill-context.mjs` green; no stack/vendor references; changeset per repo rule.

## Dependencies

Soft order: **#596** (obligation tags + duplication evidence) can complement this unit; neither blocks the other natively.
Soft Related: **#444** (decision-substrate — future model-scored candidate proposal upgrades the sweep).

## Relevant files

- `skills/product-audit/references/AUDIT_DIMENSIONS.md`
- `skills/product-audit/references/AUDIT_PROCESS.md`
- `packages/agentic-workflow-schema/` (if finding code needs schema-export)
- `docs/workflow/GATE_INVENTORY.md` + AGENTS.md owner table
- `.changeset/`

## Non-goals

- No deletion mechanism inside product-audit (findings only; the skill never edits code).
- No new scripts or gates (uses tags/claims a test carries and manual-owner evidence).
- No decision-model dependency (deterministic prose and audit route only).
- No translation artifacts (English-only rule).