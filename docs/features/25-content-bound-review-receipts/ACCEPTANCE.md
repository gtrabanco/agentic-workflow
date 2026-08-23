# Acceptance manifest v1 — 25-content-bound-review-receipts

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Candidate-snapshot validators + JSON Schema reject every malformed class: undeclared fields, abbreviated/mixed-format ids, unsorted/duplicate/NUL/absolute/traversing paths, unsupported statuses, negative sizes, bad mode, rename/copy `oldPath` violations, deletion `objectSha`, gitlink nullability, empty-diff/trees-match rule | `cd packages/agentic-workflow-schema && npm test` → exit 0 (candidate-snapshot suites) |
| AC2 | Review-receipt validator + JSON Schema reject undeclared fields and enforce closed kind (10) / severity (5) / verdict vocabularies, digest + ISO-8601 UTC timestamp formats, unique finding ids, opaque non-empty identities, policyVersion presence | `cd packages/agentic-workflow-schema && npm test` → exit 0 (review-receipt suites) |
| AC3 | Published canonical vectors pass identically on the TypeScript path and the JSON-Schema path; repeated canonicalize/digest/compare calls are deeply equal | `cd packages/agentic-workflow-schema && npm test` → exit 0 (vector + determinism suites) |
| AC4 | Freshness predicate returns exactly one stable code per stale dimension — `stale-base-tree`, `stale-candidate-tree`, `stale-manifest`, `stale-acceptance-fingerprint`, `stale-review-policy` — plus full-revert and empty-diff handling | `cd packages/agentic-workflow-schema && npm test` → exit 0 (freshness matrix) |
| AC5 | Edge matrix green: >32 changed paths, >4 MiB file, binary content, rename/copy/type-changed — all represented in manifests and surviving validate→digest→compare | `cd packages/agentic-workflow-schema && npm test` → exit 0 (edge-matrix suites) |
| AC6 | Bilingual package docs state validity ≠ correctness + mandatory content binding in both languages | `grep -c "validity" packages/agentic-workflow-schema/README.md` → ≥1 ; `grep -c "validez" packages/agentic-workflow-schema/README.es.md` → ≥1 ; contracts section present in both |
| AC7 | Release + repo gates: version `3.3.0`; pack lists both new schema files; all pre-existing suites green; skill context budgets PASS; skills CLI lists all | `grep '"version"' packages/agentic-workflow-schema/package.json` → `"3.3.0"`; `npm pack --dry-run`; `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0 |
| AC8 | Prior machine contracts untouched: `envelope.schema.json`, `skill-outcome.schema.json`, `workflow-snapshot.schema.json`, existing types and export meanings unchanged | read-verified: `git diff main -- packages/agentic-workflow-schema/envelope.schema.json packages/agentic-workflow-schema/skill-outcome.schema.json packages/agentic-workflow-schema/workflow-snapshot.schema.json` empty |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `npm pack --dry-run` (in `packages/agentic-workflow-schema/`)
