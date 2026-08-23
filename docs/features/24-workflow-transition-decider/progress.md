# Progress — 24-workflow-transition-decider

## Acceptance receipt v1
- Manifest: docs/features/24-workflow-transition-decider/ACCEPTANCE.md · Blob: ad5e17020510ae78c883548502d0b1f2f8bb5ce7 · Status: frozen · Verified: 2026-08-22

## P3 — 2026-08-22
- Done: added 12 scenario class tests (fresh, stale, blocked, needs-input, failed, contradictory, unknown, unauthorized-effect, missing-evidence, review, audit, merge), target-contract negative matrix, property/fuzz tests (22 malformed inputs, 50 determinism iterations), determinism assertions
- Remains: P4 (bilingual docs + version bump), P5 (close-out PR)
- Gotchas: `decideWorkflowAction` lookup must use last validated skill (outcome.skill), not the proposal intent (outcome.next.intent); `audit-pr` requires exactly 1 target; `merge` has no capability profile but is allowed as built-in terminal
- Files: packages/agentic-workflow-schema/test/workflow-decision.test.mjs, packages/agentic-workflow-schema/test/workflow-decision-property.test.mjs
- Next: P4 — Release the bilingual decision reference

## P2 — 2026-08-22
- Done: implemented decideWorkflowAction pipeline with defensive validation, initial/freshness routing, outcome-status stop, contradiction routing, closed-table match, effect/evidence/policy auth checks, evidence refs builder
- Remains: P3 (full test matrix), P4 (bilingual reference + version bump), P5 (close-out PR)
- Gotchas: SkillOutcomeBlocker has no evidence_refs field; non-invocable intents (status/ask-human/stop/none) must be explicitly blocked from invoke path; lookup must use outcome.skill not outcome.next.intent
- Files: packages/agentic-workflow-schema/src/index.ts
- Next: P3 — Prove decision behavior with the full test matrix

## P1 — 2026-08-22
- Done: exported reason-code vocabularies, decision types (WorkflowDecisionPolicy, WorkflowDecisionInput, WorkflowActionDecision), frozen 14-row WORKFLOW_TRANSITION_TABLE, exhaustiveness suite
- Remains: P2 (decision pipeline), P3 (tests), P4 (docs), P5 (PR)
- Gotchas: WorkflowIntent uses "status" not "workflow-status"; WORKFLOW_INTENTS uses as const (not Object.freeze), so Object.isFrozen check fails on it alone
- Files: packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/test/workflow-decision.test.mjs
- Next: P2 — Implement the decideWorkflowAction decision pipeline

## Unit-loop receipt — P2
- Commit: pending · Gate: cd packages/agentic-workflow-schema && npm test (exit 0) · Acceptance blob: ad5e17020510ae78c883548502d0b1f2f8bb5ce7
- Next: P3 · Attempts: 0

## P4 — 2026-08-22
- Done: added decideWorkflowAction section to README.md and README.es.md with contract summary, elision example, fallback example, sensor points list; bumped version 3.1.0 → 3.2.0
- Remains: P5 (close-out PR)
- Gotchas: none
- Files: packages/agentic-workflow-schema/README.md, packages/agentic-workflow-schema/README.es.md, packages/agentic-workflow-schema/package.json
- Next: P5 — Hardening & PR

## Unit-loop receipt — P4
- Commit: pending · Gate: cd packages/agentic-workflow-schema && npm test (exit 0) · Acceptance blob: ad5e17020510ae78c883548502d0b1f2f8bb5ce7
- Next: P5 · Attempts: 0

## P5 — 2026-08-22
- Done: full repo verification (npm test 76/76, check-skill-context PASS, skills add exit 0), no contract changes, PR #143 opened, roadmap updated
- Remains: none — unit finished
- Gotchas: none
- Files: docs/features/ROADMAP.md
- Next: unit finished
