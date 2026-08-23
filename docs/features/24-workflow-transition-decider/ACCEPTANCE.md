# Acceptance manifest v1 — 24-workflow-transition-decider

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The closed transition/evidence/reason-code tables cover every current `WorkflowIntent`: the exhaustiveness suite derives coverage from `WORKFLOW_INTENTS` and the exported frozen `WORKFLOW_TRANSITION_TABLE` (row key, allowed next intent, or explicit recommendation/merge rule), so a new intent added without an explicit rule fails the suite | command-verified: `cd packages/agentic-workflow-schema && npm test` exits 0 including the exhaustiveness suite in `test/workflow-decision.test.mjs` |
| AC2 | Table-driven tests cover the twelve scenario classes — fresh, stale, blocked, needs-input, failed, contradictory, unknown, unauthorized-effect, missing-evidence, review, audit, and merge — each asserting the exact decision kind, intent, reason code, and target handling | command-verified: `cd packages/agentic-workflow-schema && npm test` exits 0 with the twelve-class suite |
| AC3 | Property/fuzz tests prove malformed or unrecognized values cannot produce `invoke` and never throw | command-verified: `cd packages/agentic-workflow-schema && npm test` exits 0 with the seeded, deterministic fuzz suite in `test/workflow-decision-property.test.mjs` |
| AC4 | The function performs no I/O and produces the same result for the same input | command-verified: determinism assertions (deep equality on repeated calls) in `test/workflow-decision-property.test.mjs`; read-verified: no I/O imports added to `src/index.ts`, value-in/value-out signature |
| AC5 | The documentation includes one safe model-call-elision example and one mandatory `workflow-status` fallback example, plus the mandatory sensor points, in English and Spanish | command-verified: `grep -c "decideWorkflowAction" packages/agentic-workflow-schema/README.md packages/agentic-workflow-schema/README.es.md` finds the section in both; both example headings present in both files; read-verified: sensor-point list present in both |
| AC6 | Existing package and repository verification passes unchanged | command-verified: `cd packages/agentic-workflow-schema && npm test` → exit 0; `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0 |
| AC7 | Additive package API and minor release: version `3.2.0`, unchanged public artifact set, existing export meanings unchanged, consumers that do not call `decideWorkflowAction()` retain current behavior | command-verified: `grep '"version"' packages/agentic-workflow-schema/package.json` → `3.2.0`; `cd packages/agentic-workflow-schema && npm pack --dry-run` lists the unchanged artifact set; read-verified: v3.1.0 export surface unchanged |
| AC8 | No changes to `WorkflowSnapshot v1`, `Envelope v2`, or `SkillOutcome v1`, and no second repository-state model — the function consumes the existing snapshot compiler output | read-verified: `git diff` clean on the three shipped `*.schema.json` files and the existing contract types; decision code imports only existing exports |
| AC9 | Effect and evidence checks use the #136 capability profiles; no hard-coded private skill permission lists inside the checks | read-verified: `decideWorkflowAction` reads `WORKFLOW_SKILL_PROFILES` for effects and required evidence; the only skill-name table is the exported, versioned `WORKFLOW_TRANSITION_TABLE` |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm pack --dry-run`
- `grep '"version"' packages/agentic-workflow-schema/package.json`
- `grep -c "decideWorkflowAction" packages/agentic-workflow-schema/README.md packages/agentic-workflow-schema/README.es.md`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `git status --porcelain -- docs/`
- `git status --porcelain`
