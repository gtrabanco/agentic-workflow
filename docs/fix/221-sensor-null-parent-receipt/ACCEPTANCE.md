# Acceptance manifest v1 — fix-221-sensor-null-parent-receipt

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The receipt parser reads null-word lineage lines as absent and non-null ones as their recorded value (bare-hex passthrough, `sha256:` dress stripped, every other parsed field byte-identical) | `node --test scripts/pre-execution-receipt-parent.test.mjs` → exit 0 |
| AC2 | A current fix-unit plan receipt senses `current` — never the false `missing` — with no gate blocker for the unit; the sensor suite is green including the pinned case | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (includes "a current fix-unit plan receipt senses current, not missing (#221)") |
| AC3 | Feature-unit sensing and the verifier's own comparison path stay behavior-identical | `node --test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/pre-execution-timeline.test.mjs scripts/pre-execution-quality.test.mjs` → exit 0 |
| AC4 | The repo-wide scripts regression is green (schema `dist/` built first: `cd packages/agentic-workflow-schema && bun install --frozen-lockfile && bun run build`) | `node --test scripts/*.test.mjs` → exit 0 |
| AC5 | Skill context budgets pass; no skill byte drifted | `bun scripts/check-skill-context.mjs` → exit 0 |
| AC6 | Fix index carries the #221 unit row and is flipped to `done · [PR]` at close-out | read-verified: from repo root, `grep -cE "sensor-null-parent-receipt.*done · \[#"` → 1 (presence alone is green from plan time; the flip is the outcome) |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node --test scripts/pre-execution-receipt-parent.test.mjs`
- `node --test scripts/workflow-status-sensor.test.mjs`
- `node --test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/pre-execution-timeline.test.mjs scripts/pre-execution-quality.test.mjs`
- `cd packages/agentic-workflow-schema && bun install --frozen-lockfile && bun run build`
- `node --test scripts/*.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `grep -cE "sensor-null-parent-receipt.*done · \["` docs/fix/README.md (repo root)
