# Acceptance manifest v1 — fix-134-machine-contract

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Strict contracts reject unknown and malformed routing fields. | `cd packages/agentic-workflow-schema && npm test` |
| AC2 | The parser normalizes only named legacy facts and rejects unrecoverable ambiguity. | `cd packages/agentic-workflow-schema && npm test` |
| AC3 | The snapshot is pure, provenance-bearing, and explicit about unknowns and contradictions. | `cd packages/agentic-workflow-schema && npm test` |
| AC4 | All public schemas and bilingual package docs are publishable. | `cd packages/agentic-workflow-schema && npm pack --dry-run` |
| AC5 | Changed skills remain discoverable and within their context budgets. | `npx skills add . --list && node scripts/check-skill-context.mjs` |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; independent review and
  issue-acceptance reconciliation remain required before delivery.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm pack --dry-run`
- `npx skills add . --list`
- `node scripts/check-skill-context.mjs`
