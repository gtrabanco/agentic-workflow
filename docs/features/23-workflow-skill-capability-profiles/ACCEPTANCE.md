# Acceptance manifest v1 — 23-workflow-skill-capability-profiles

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Export readonly values and TypeScript unions for exactly: roles `sensor | planner | executor | reviewer | auditor | publisher`; effects `repository-read | repository-write | git-write | forge-read | forge-write`; reasoning `mechanical | semantic | critical`; context sources `repository | semantic-context | episodic-memory | execution-state`; required evidence `workflow-snapshot | current-candidate | verification | independent-review | audit | issue-state | pull-request-state` | read-verified: grep `as const` arrays and `typeof` unions in `packages/agentic-workflow-schema/src/index.ts` |
| AC2 | Every built-in profile matches the exact AC2 table (12 profiles with correct role, reasoning, effects, context sources, required evidence) | read-verified: `grep -c` on capabilities in `packages/agentic-workflow-schema/src/index.ts` matches 12; table rows match spec |
| AC3 | `capabilities` is optional on the public `WorkflowSkillProfile` TypeScript boundary, every shipped built-in profile populates it, and `output` plus `nativeFallback` retain their current meanings | read-verified: `capabilities?: WorkflowSkillCapabilities` optional field present; existing `output` and `nativeFallback` fields unchanged |
| AC4 | A capability-aware consumer presented with a profile lacking `capabilities` must fail closed instead of inferring values from the skill name | command-verified: `cd packages/agentic-workflow-schema && npm test` includes fail-closed consumer test that rejects profile without capabilities |
| AC5 | Runtime widening is unsupported; any later vocabulary or built-in profile change requires a reviewed package change and new package version | command-verified: `Object.isFrozen` assertions on exported arrays and profile entries in test suite; no runtime create/update/delete/widen surface introduced |
| AC6 | `cd packages/agentic-workflow-schema && npm test` exits 0, covers exact inventory uniqueness and rejects unknown role, effect, reasoning, context-source, and evidence values, while existing `renderOutputInstruction()`, `parseTurn()`, Envelope v2, SkillOutcome v1, and WorkflowSnapshot v1 regressions remain green | command-verified: `cd packages/agentic-workflow-schema && npm test` exits 0 |
| AC7 | `packages/agentic-workflow-schema/README.md` and `README.es.md` contain synchronized capability-profile guidance stating that repository evidence is authoritative and semantic/episodic context is advisory | read-verified: grep "evidence" and "advisory" or "authoritative" in both README files; both contain capability-profile guidance |
| AC8 | the package version receives a minor bump and `cd packages/agentic-workflow-schema && npm pack --dry-run` includes compiled JavaScript, declarations, and both package references through the existing package entry point | command-verified: `cd packages/agentic-workflow-schema && npm pack --dry-run | grep -E "(index\.js|index\.d\.ts|README\.(md|es\.md))"` lists expected files |
| AC9 | No runtime create, update, delete, state-transition, ACL-assignment, or profile-widening surface is introduced | read-verified: grep `packages/agentic-workflow-schema/src/index.ts` — no create/update/delete/widen/public-mutation functions; `Object.isFrozen` on exports |
| AC10 | No provider/model mapping, agent runtime, automatic invocation, skill-prose mirror, undeclared field, or external I/O is added | read-verified: grep `packages/agentic-workflow-schema/src/index.ts` — no provider names, no agent invocation, no I/O, no undeclared fields |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm pack --dry-run`
- `grep -c "capabilities" packages/agentic-workflow-schema/src/index.ts`
- `git status --porcelain -- docs/`
- `git status --porcelain`