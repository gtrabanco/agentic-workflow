# Acceptance manifest v2 — 26-staged-verification-contracts

Status: frozen

Replacement approved by the user on 2026-08-26. This manifest supersedes blob
`a4c643dabe8105293c76a1013713c4a3919a96cb` under the dated SPEC amendment. It
strengthens the finish line around one runtime validation authority exposed
through two public entry points and bounded, usable verification plans; it does
not authorize a second validation path.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The sole public plan-validation entry point, `validateVerificationPlanV1(value: unknown)`, rejects every malformed plan class: undeclared/inherited fields, empty or oversized command lists, duplicate/empty/oversized ids, vocabulary violations, malformed executable/args/working directories, invalid timeouts, budget violations, and non-boolean `stopOnFailure`. It returns normalized own-property data only. | `cd packages/agentic-workflow-schema && npm test` → exit 0 (authoritative plan-validation suites) |
| AC2 | The sole public receipt-validation entry point, `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)`, performs structural and plan-bound validation in one call and rejects undeclared/inherited fields, closed-vocabulary/digest/timestamp/exit-signal/evidence/skip violations, duplicate or unknown command ids, wrong order or stage, invalid fail-fast sequencing, plan-digest mismatch, and verdict mismatch. No standalone structural receipt validator is exported as an alternative authority. | `cd packages/agentic-workflow-schema && npm test` → exit 0 (authoritative receipt-validation suites + public-export assertions) |
| AC3 | Stage/verdict semantics are green: fast success, fast fail-fast, full success, full fail-fast, timeout, infrastructure error, skipped with/without reason, missing results, requested-full coverage gap, vacuous-fast pin — and a full receipt cannot pass unless every declared fast and full command has a current passed result. | `cd packages/agentic-workflow-schema && npm test` → exit 0 (stage/verdict suites) |
| AC4 | The freshness predicate returns every stable code on a reachable, disjoint condition — `stale-plan`, `stale-candidate-snapshot`, `stale-acceptance-fingerprint`, `incomplete-missing-results`, `incomplete-unjustified-skip`, `incomplete-stage-coverage` — plus `{fresh: true}`. | `cd packages/agentic-workflow-schema && npm test` → exit 0 (freshness reachability matrix) |
| AC5 | Published canonical vectors for both contracts pass through the authoritative public validators; repeated canonicalize/digest/derive/compare calls are deeply equal; frozen runtime vector entries are readonly in TypeScript. | `cd packages/agentic-workflow-schema && npm test` → exit 0 (vector, type-contract, and determinism suites) |
| AC6 | Bilingual package docs state the two-stage model, the delivery-gate rule, the no-execution boundary, the single validation authority, the structural-projection status of the JSON Schemas, and every v1 usability limit in both languages. Examples bind to explicit current candidate/acceptance values and use timeout-consistent result timestamps. | `cd packages/agentic-workflow-schema && npm run test:verification-docs` → exit 0 (extractable TypeScript example compilation + EN/ES semantic/parity assertions) |
| AC7 | Release + repository qualification is reproducible: version `3.4.0`; the package verifier proves both generated schema projections ship; all package suites pass; skill context budgets PASS; the skills CLI lists all; npm and Bun frozen installs succeed from synchronized locks. | `(cd packages/agentic-workflow-schema && npm ci && bun install --frozen-lockfile && npm test && npm run check:verification-package) && node scripts/check-skill-context.mjs && npx skills add . --list` → exit 0 |
| AC8 | Prior machine contracts remain untouched: the five existing schema files (`envelope`, `skill-outcome`, `workflow-snapshot`, `candidate-snapshot`, `review-receipt`) and all pre-existing export meanings outside the unshipped feature-26 surface are unchanged. | read-verified: `git diff main -- packages/agentic-workflow-schema/envelope.schema.json packages/agentic-workflow-schema/skill-outcome.schema.json packages/agentic-workflow-schema/workflow-snapshot.schema.json packages/agentic-workflow-schema/candidate-snapshot.schema.json packages/agentic-workflow-schema/review-receipt.schema.json` empty |
| AC9 | JSON Schema files are deterministic, generated structural projections of the canonical internal verification-contract definition, carry explicit non-authoritative projection metadata, and cannot drift through hand edits. Every Draft-07-expressible rule matches the authoritative validator; semantic validity is claimed only by the public validator entry points. | `cd packages/agentic-workflow-schema && npm run check:verification-schemas` → exit 0; projection fixture tests in `npm test` → exit 0 |
| AC10 | Usability bounds are enforced identically by the authoritative validators and generated structural projections where Draft-07 can express them: ≤128 commands/results, ≤64 args per command, id/commandId ≤128 chars, executable/workingDirectory/skipReason/evidence ref ≤1024 chars, each arg ≤4096 chars, canonical plan ≤256 KiB, canonical receipt ≤512 KiB, fast command timeout ≤10 min and aggregate fast budget ≤15 min, full command timeout ≤60 min and aggregate full-stage budget ≤2 h, and at most 50 redacted code+RFC-6901-path diagnostics. A 128-command plan+receipt validation/digest benchmark stays within the declared 100 ms warm-process p95 ceiling. | `cd packages/agentic-workflow-schema && npm test` → boundary suites exit 0; `npm run bench:verification -- --commands 128` → exit 0 and p95 ≤100 ms |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator/test to manufacture PASS.
- The two named public validators are the only runtime validation authorities;
  generated JSON Schemas are structural tooling projections, never an alternate
  semantic PASS.
- Never hand-edit generated schema output; change the canonical definition and
  regenerate it.
- Do not raise bounds or benchmark thresholds to make the current candidate pass
  without a new explicit user-approved SPEC amendment and replacement manifest.
- Passing declared checks is necessary, not sufficient; final independent review
  and the named manual documentation check remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm ci`
- `cd packages/agentic-workflow-schema && bun install --frozen-lockfile`
- `cd packages/agentic-workflow-schema && npm run gate:verification`
- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm run test:verification-docs`
- `cd packages/agentic-workflow-schema && npm run check:verification-schemas`
- `cd packages/agentic-workflow-schema && npm run check:verification-package`
- `cd packages/agentic-workflow-schema && npm run bench:verification -- --commands 128`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
