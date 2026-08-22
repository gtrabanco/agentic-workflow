# TASKS — 24-workflow-transition-decider

## P1 — Export the workflow-decision contract surface

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new exhaustiveness suite.

- [x] Define and export the frozen reason-code vocabularies with derived
  TypeScript unions for the five sense codes, six stop codes, and
  `invoke-proven-transition`.
- [x] Define and export `WorkflowDecisionPolicy`, `WorkflowDecisionInput`, and
  the three `WorkflowActionDecision` variants (invoke, sense, stop) with the
  exact closed shapes from Design.
- [x] Define and export the frozen `WORKFLOW_TRANSITION_TABLE` reproducing the
  13-row direct-invocation table verbatim, with row conditions expressed as
  data.
- [x] Re-export the decision contract surface from the package entry point
  `src/index.ts`.
- [x] Add `test/workflow-decision.test.mjs` with the exhaustiveness suite:
  every `WORKFLOW_INTENTS` member is covered as a row key, an allowed next
  intent, or an explicit recommendation/merge rule; every row key is a
  profiled skill or `none`.
- [x] Assert `Object.isFrozen` on the exported vocabularies and the transition
  table.

## P2 — Implement the decideWorkflowAction decision pipeline

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 (compiles; existing suites and the P1 exhaustiveness suite remain
green).

- [x] Implement the `decideWorkflowAction` entry with defensive runtime
  validation: a malformed snapshot or outcome returns `sense` with
  `sense-missing-evidence`, a malformed policy returns `stop` with
  `stop-policy-denied`, and unknown values never throw.
- [x] Implement initial and freshness routing: an absent last outcome returns
  `sense-initial`; an outcome revision mismatch returns `sense-stale-revision`.
- [x] Implement outcome-status stop routing for `blocked`, `needs-input`, and
  `failed`, preserving canonical blockers and questions into targets,
  evidence refs, and detail.
- [x] Implement contradiction routing: a declared contradiction with a
  table-allowed `resolve-repository-state` proposal proceeds toward invoke;
  every other proposal under contradiction returns `stop-contradiction` with
  the contradiction evidence.
- [x] Implement recommendation routing for `status`, `ask-human`, `stop`, and
  `none`, plus the closed-table match with row conditions: unlisted
  transitions return `sense-unlisted-transition`, unmet row conditions return
  `sense-missing-evidence` (or `sense-unknown-state` when the state is
  unknown).
- [x] Implement auth checks: effect authorization uses capability profiles
  from `WORKFLOW_SKILL_PROFILES`, evidence authorization cross-references
  outcome `evidence_refs` and snapshot provenance, and the `policy` gates
  both allowed intents and forge-write authorization.
- [x] Build the `evidenceRefs` array: outcome evidence_refs, snapshot
  provenance `field@source:line`, and contradiction fields where relevant.
  Build `detail` from the table condition template.
- [x] Re-export `decideWorkflowAction` from the package entry point.

## P3 — Prove decision behavior with the full test matrix

Layer: hardening. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 with the full twelve-class suite plus property tests.

- [x] Add `test/workflow-decision.test.mjs` table-driven assertions covering the twelve scenario classes: fresh, stale, blocked, needs-input, failed, contradictory, unknown, unauthorized-effect, missing-evidence, review, audit, and merge.
- [x] Add `test/workflow-decision-property.test.mjs` with a seeded,
  deterministic fuzz loop proving malformed or unrecognized input values never
  produce `invoke` and never throw.
- [x] Add determinism assertions: identical input produces deeply equal
  decisions on repeated calls.
- [x] Add the target-contract negative matrix: free-form, additional, and
  mismatched targets return `stop-forbidden-transition`; missing required
  identities return `sense-missing-evidence`.
- [x] Re-run the full package suite and record that every pre-existing test
  remains green.

## P4 — Release the bilingual decision reference

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0; `grep '"version"' packages/agentic-workflow-schema/package.json` →
`3.2.0`; `npm pack --dry-run` lists the unchanged public artifact set.

- [ ] Add the `decideWorkflowAction` section to `README.md`: contract summary,
  one safe model-call-elision example, one mandatory `workflow-status`
  fallback example, mandatory sensor points list.
- [ ] Add the same section to `README.es.md` using the equivalent autoritativa/orientativo semantics.
- [ ] Bump version `3.1.0` → `3.2.0` in `package.json`.
- [ ] Verify: `cd packages/agentic-workflow-schema && npm test` → exit 0;
  `grep '"version"' packages/agentic-workflow-schema/package.json` → `3.2.0`;
  `npm pack --dry-run` lists unchanged artifact set.

## P5 — Hardening & PR

Layer: close-out. Done-when: PR opened with URL printed.

- [ ] Run the full repository verification gate: `npm test`,
  `node scripts/check-skill-context.mjs`, `npx skills add . --list`.
- [ ] Verify no changes to `WorkflowSnapshot v1`, `Envelope v2`, `SkillOutcome v1`,
  and the three shipped `*.schema.json` files.
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`.
- [ ] Open a pull request on GitHub against the default branch (`gh pr create --body-file <path>` — body written as a
  Markdown file, real backticks, never inline `--body`/heredoc that leaves
  `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes
  `Closes #137`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<pr>` and push