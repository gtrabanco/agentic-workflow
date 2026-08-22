# Acceptance manifest v1 — 23-workflow-skill-capability-profiles

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Export readonly values and TypeScript unions for exactly: roles `sensor | planner | executor | reviewer | auditor | publisher`; effects `repository-read | repository-write | git-write | forge-read | forge-write`; reasoning `mechanical | semantic | critical`; context sources `repository | semantic-context | episodic-memory | execution-state`; required evidence `workflow-snapshot | current-candidate | verification | independent-review | audit | issue-state | pull-request-state` | read-verified: grep `as const` arrays and `typeof` unions in `packages/agentic-workflow-schema/src/index.ts` |
| AC2 | Every built-in profile matches the exact AC2 table (12 profiles with correct role, reasoning, effects, context sources, required evidence) | command-verified: `cd packages/agentic-workflow-schema && npm test` includes the exact frozen AC2 table assertion and duplicate-free 12-profile inventory assertion |
| AC3 | `capabilities` is optional on the public `WorkflowSkillProfile` TypeScript boundary, every shipped built-in profile populates it, and the pre-existing `skill`, `output`, and `nativeFallback` fields retain both their types and source-compatible writability | command-verified: `cd packages/agentic-workflow-schema && npm test` compiles `test/fixtures/workflow-skill-profile-compat.ts`, which omits `capabilities` and assigns all three legacy fields; shipped built-ins remain deeply readonly |
| AC4 | A capability-aware consumer presented with a profile lacking `capabilities` must fail closed instead of inferring values from the skill name | command-verified: `cd packages/agentic-workflow-schema && npm test` includes fail-closed consumer test that rejects profile without capabilities |
| AC5 | Runtime widening is unsupported; any later vocabulary or built-in profile change requires a reviewed package change and new package version | command-verified: `cd packages/agentic-workflow-schema && npm test` asserts `Object.isFrozen` on vocabulary arrays, profiles, capabilities, and nested arrays and proves mutation throws; read-verified: package version is `3.1.0` |
| AC6 | `cd packages/agentic-workflow-schema && npm test` exits 0, covers exact inventory uniqueness and rejects unknown role, effect, reasoning, context-source, and evidence values, while existing `renderOutputInstruction()`, `parseTurn()`, Envelope v2, SkillOutcome v1, and WorkflowSnapshot v1 regressions remain green | command-verified: `cd packages/agentic-workflow-schema && npm test` exits 0 |
| AC7 | `packages/agentic-workflow-schema/README.md` and `README.es.md` contain synchronized capability-profile guidance stating that repository evidence is authoritative and semantic/episodic context is advisory | command-verified: `cd packages/agentic-workflow-schema && npm test` includes language-aware assertions for the authoritative/advisory English wording and the equivalent authoritative/orientative Spanish wording |
| AC8 | the package version receives a minor bump and `cd packages/agentic-workflow-schema && npm pack --dry-run` includes compiled JavaScript, declarations, and both package references through the existing package entry point | command-verified: `cd packages/agentic-workflow-schema && npm test` parses `npm pack --dry-run --json` and independently requires `dist/index.js`, `dist/index.d.ts`, `README.md`, and `README.es.md`; read-verified: version is `3.1.0` |
| AC9 | No runtime create, update, delete, state-transition, ACL-assignment, or profile-widening surface is introduced | read-verified: grep `packages/agentic-workflow-schema/src/index.ts` — no create/update/delete/widen/public-mutation functions; `Object.isFrozen` on exports |
| AC10 | No provider/model mapping, agent runtime, automatic invocation, skill-prose mirror, undeclared field, or external I/O is added | read-verified: grep `packages/agentic-workflow-schema/src/index.ts` — no provider names, no agent invocation, no I/O, no undeclared fields |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm pack --dry-run --json`
- `git status --porcelain -- docs/`
- `git status --porcelain`
