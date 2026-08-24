# Acceptance manifest v1 — 26-staged-verification-contracts

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Verification-plan validator + JSON Schema reject every malformed class: undeclared fields, empty command list, duplicate/empty ids, stage/cost-class vocabulary violations, empty or NUL-bearing executable/args, working-directory policy↔nullness violations, relative paths that are empty/NUL/absolute/`..`-traversing, non-positive-integer or non-integer `timeoutMs`, non-boolean `stopOnFailure` | `cd packages/agentic-workflow-schema && npm test` → exit 0 (verification-plan suites) |
| AC2 | Verification-receipt validator + JSON Schema reject undeclared fields and enforce closed status (5) / verdict (3) / stage (2) vocabularies, lowercase 64-hex digest formats ×3, ISO-8601 UTC timestamps with `endedAt ≥ startedAt`, the exit-code/signal matrix, evidence-reference bounds (ref ≤ 1024, bytes ≥ 0, sha256 64-hex), skip-reason rules, duplicate result command ids, verdict consistency with `deriveVerificationVerdict` | `cd packages/agentic-workflow-schema && npm test` → exit 0 (verification-receipt suites) |
| AC3 | Stage/verdict semantics green: fast success, fast fail-fast, full success, full fail-fast, timeout, infrastructure error, skipped with/without reason, missing results, requested-full coverage gap, vacuous-fast pin — and a full receipt cannot pass unless every declared fast and full command has a current passed result | `cd packages/agentic-workflow-schema && npm test` → exit 0 (stage/verdict suites) |
| AC4 | Freshness predicate returns exactly one stable code per dimension — `stale-plan`, `stale-candidate-snapshot`, `stale-acceptance-fingerprint`, `incomplete-missing-results`, `incomplete-unjustified-skip`, `incomplete-stage-coverage` — plus `{fresh: true}` | `cd packages/agentic-workflow-schema && npm test` → exit 0 (freshness suites) |
| AC5 | Published canonical vectors for both contracts pass identically on the TypeScript path and the JSON-Schema path; repeated canonicalize/digest/derive/compare calls are deeply equal | `cd packages/agentic-workflow-schema && npm test` → exit 0 (vector + determinism suites) |
| AC6 | Bilingual package docs state the two-stage model, the delivery-gate rule (only a current, complete full receipt), and the no-execution boundary in both languages | `grep -c "staged verification" packages/agentic-workflow-schema/README.md` → ≥1 ; `grep -c "verificación por etapas" packages/agentic-workflow-schema/README.es.md` → ≥1 ; delivery-gate statement present in both |
| AC7 | Release + repo gates: version `3.4.0`; pack lists both new schema files; all pre-existing suites green; skill context budgets PASS; skills CLI lists all | `grep '"version"' packages/agentic-workflow-schema/package.json` → `"3.4.0"`; `npm pack --dry-run` (in `packages/agentic-workflow-schema/`); `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0 |
| AC8 | Prior machine contracts untouched: the five existing schema files (`envelope`, `skill-outcome`, `workflow-snapshot`, `candidate-snapshot`, `review-receipt`) and all pre-existing types/export meanings unchanged | read-verified: `git diff main -- packages/agentic-workflow-schema/envelope.schema.json packages/agentic-workflow-schema/skill-outcome.schema.json packages/agentic-workflow-schema/workflow-snapshot.schema.json packages/agentic-workflow-schema/candidate-snapshot.schema.json packages/agentic-workflow-schema/review-receipt.schema.json` empty |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `npm pack --dry-run` (in `packages/agentic-workflow-schema/`)
