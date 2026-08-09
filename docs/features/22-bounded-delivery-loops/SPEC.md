# 22 — bounded-delivery-loops

## Goal

Reduce human babysitting, repeated context loading, and issue/PR fragmentation while preserving the workflow's evidence, scope, review independence, and merge safeguards.

## Branch

`feat/22-bounded-delivery-loops`

## Size

`L` — coordinated contract changes across planning, execution, review, folding, orchestration, templates, and bilingual workflow docs.

## Dependencies

Hard: feature 21 merged. Soft: none.

---

## Product half

### Context

The workflow now has route-specific context and SHA-bound review receipts, but its normal manual path still asks the user to re-invoke execution per phase and to relay `review-change → fold-findings → review-change` cycles. `plan-fix` accepts multiple issues only when every pair shares defect class and files, which rejects cohesive capability repairs and mechanical batches. Opportunistic implementation findings can still create issues automatically. These contracts reward administrative completion rather than complete, verified outcomes.

### Business goals

- Finish more real capabilities per human decision.
- Make cheap tool-capable models useful inside bounded, verifier-driven loops.
- Reduce repeated skill context and unnecessary reviews without weakening the final gate.
- Prevent issue count and PR count from becoming proxies for progress.

### Scope

#### In scope

- One frozen acceptance manifest per feature/fix unit.
- `execute-phase <NN>` and `execute-phase --fix <n>` run all remaining phases by default; an explicit `P<n>` keeps atomic execution.
- Multi-issue fixes group by one outcome/verification/rollback boundary, including capability bundles and homogeneous mechanical batches.
- `fold-findings` groups compatible findings into atomic correction batches.
- New `loop-review-fold` orchestrates context-clean review and correction with a fixed cycle budget and no-progress detection.
- Out-of-scope discoveries become proposals in the current unit; no automatic issue creation from execution/review/fold/audit.
- `ship-roadmap` and workflow documentation use the new unit-level execution and bounded review loop.
- Context-route budgets and weak-model golden fixtures cover the new routes.

#### Out of scope / non-goals

- Replacing project tests with an LLM judge.
- Claiming that passing declared checks proves every possible quality property.
- Automatically merging outside `ship-roadmap --fullauto`.
- Automatically changing acceptance criteria or weakening tests during a loop.
- Provider-specific RLM runtime implementation; the loop contract remains portable to RLM/headless drivers.

### Capability closure

#### Entity: delivery unit

- Create: feature/fix planners create `ACCEPTANCE.md` · test: contract fixture.
- Read/list: executor/reviewer read the frozen manifest and receipt · test: route fixture.
- Update: only a user-approved SPEC amendment may replace the frozen manifest · test: mutation rejection fixture.
- Delete: n/a; removal before delivery is a blocker.
- State transitions: planned → executing → candidate → corrected → review-pass/blocked; every transition has repository evidence.

#### Entity: correction batch

- Create: compatible issues/findings grouped by one outcome, verifier, and rollback boundary.
- Read/list: fixed tables retain every source issue/finding ID.
- Update: members may be split before edits when atomicity fails.
- Delete: no source item may disappear; it remains in the report/ledger.
- State transitions: queued → corrected → verified or blocked/replan/decision-required.

#### Roles and entry points

- User: invokes planning/execution/loop commands and owns scope/acceptance decisions.
- Executor: may implement but cannot weaken the acceptance manifest or create backlog.
- Reviewer: context-clean, read-only, receipt issuer; never edits or merges.
- Fullauto wrapper: remains the only automated merge authority.

### Integration closure

- Planning: creates the manifest and cohesive fix groups.
- Execution: verifies the manifest receipt before each phase and loops remaining phases.
- Review: validates the frozen candidate against the manifest.
- Folding: repairs batches without reclassification or issue creation.
- Audit: continues consuming the exact-SHA review receipt.
- Orchestration: routes whole-unit execution and bounded review/fold loops.
- Distribution/docs: new skill, model route, counts, EN/ES guides, changelogs, migration.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Omitting a phase executes the unit, not only P1 | in-scope | AC 2 |
| 2 | Explicit phase invocation still works | in-scope | AC 2 |
| 3 | Intermediate review checkpoints do not interrupt unit-loop mode | in-scope | AC 3 |
| 4 | A failing gate stops before red commit | in-scope | AC 3 |
| 5 | Auth issues may group although they have different symptoms | in-scope | AC 4 |
| 6 | Small CSS/docs issues may form homogeneous batches | in-scope | AC 4 |
| 7 | Unrelated risky issues remain separate | in-scope | AC 4 |
| 8 | Review/fold cannot loop forever | in-scope | AC 6 |
| 9 | Passing bytes are not reviewed twice | in-scope | AC 6 |
| 10 | New findings do not become issues without user action | in-scope | AC 5 |
| 11 | Cheap models receive compact failures and durable state | in-scope | AC 3, AC 6 |
| 12 | Tests/acceptance cannot be weakened to manufacture green | in-scope | AC 1 |

### Acceptance criteria

1. **command + read-verified:** every newly planned feature/fix emits a valid `ACCEPTANCE.md`; execution records its blob fingerprint and fails closed on unapproved changes.
2. **read-verified:** no-phase feature/fix invocation executes all remaining phases through close-out; explicit `P<n>` executes exactly one phase.
3. **read-verified:** unit-loop mode runs phase-local gates/commits, skips intermediate review hand-offs, persists compact state, and stops on red/ambiguous/no-progress evidence.
4. **read-verified:** multi-issue planning accepts capability bundles and homogeneous mechanical batches when one outcome, verification plan, release/rollback boundary, and compatible risk hold; refusals return maximal compatible groups rather than one issue per command.
5. **command:** active execution/review/fold routes contain no automatic issue-creation action for discovered work; independent work is a proposal until explicit user triage.
6. **read-verified:** `loop-review-fold` uses context-clean review, folds the full compatible queue, re-reviews only changed HEADs, defaults to a bounded correction budget, and returns PASS/BLOCKED/NEEDS-DECISION/NO-PROGRESS/BUDGET-EXHAUSTED.
7. **read-verified:** grouped fold commits retain one output/ledger tick per finding and never combine groups with different verification or rollback boundaries.
8. **command:** context checks, link checks, skill discovery, contract fixtures, existing receipt/dependency tests, and `git diff --check` pass.
9. **read-verified:** README, SKILLS, FEATURE/ISSUE workflow, ORCHESTRATION, MIGRATION, model routing, templates, and EN/ES siblings describe the same behavior.
10. **read-verified:** a weakest-tool-capable-model fixture proves manifest preservation, complete no-phase execution routing, no issue creation, and bounded loop termination.

### Tooling

Repository scripts, fake-forge fixtures, golden fixture, skills CLI. No MCP required.

### Product decisions

- D1: keep `execute-phase` as the single execution entry point; progressive loading owns unit-loop detail instead of a second execution skill.
- D2: explicit phase means atomic mode; omitted phase means all remaining phases.
- D3: group by one user-visible/operational outcome plus one verification and rollback boundary, never by file coincidence alone.
- D4: independent discoveries are proposals; only explicit user triage creates backlog.
- D5: `loop-review-fold` is separate because review must be context-clean and read-only.
- D6: default correction budget is two fold cycles; unchanged HEAD/finding set stops immediately as no progress.
- D7: final review remains mandatory; intermediate reviews are skipped in unit-loop mode unless the run stops and the user explicitly requests one.

### Deferred decisions

None.

## Design status

`designed`

---

## Engineering half

### Technical goals

- Add one internal verification contract consumed by planners, executor, reviewer, and loop.
- Add one user-facing review/fold conductor without duplicating reviewer or folder checklists.
- Preserve exact-SHA receipts, merge authority, gates, commits, and recovery semantics.

### Architecture impact

Documentation-only workflow product. Existing skill composition boundaries are preserved: executor writes, reviewer reads, folder writes, audit gates, wrapper merges. No project architectural invariant document exists; n/a.

### Design

`verification-contract` owns `ACCEPTANCE.md`, its immutable baseline, receipt, validation ladder, and anti-weakening rules. `execute-phase` dispatches on the presence of a phase argument and loads `UNIT_LOOP.md` only for omitted-phase routes. `loop-review-fold` stores no second finding format: it consumes review decisions and the existing ledger, calls the existing skills in fresh contexts where available, and retains only cycle receipts. Fix/finding grouping uses a shared atomic-delivery test: outcome, verifier, release/rollback boundary, risk compatibility, and aggregate size.

### Decisions to confirm

Resolved by the user's request and D1–D7.

### Testing requirements

Contract tests exercise routing, refusal/acceptance examples, manifest mutation, no automatic issue creation, fold grouping, and loop terminal states. Existing context and receipt tests remain green.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `execute:remaining` | three unfinished phases | omitted-phase dispatch |
| `execute:explicit` | one requested phase | atomic dispatch |
| `fix:auth-bundle` | several auth defects, shared successful-login outcome | capability grouping |
| `fix:docs-batch` | homogeneous corrections across docs | mechanical grouping |
| `loop:new-finding` | correction reveals one new defect | second bounded cycle |
| `loop:no-progress` | same HEAD and finding set | immediate stop |
| `manifest:mutation` | executor edits acceptance baseline | fail-closed gate |

### Phases

The implementation is delivered in one user-visible run. Internal commits may separate contracts, behavior, and documentation for reviewability; they are not invocation boundaries.

### Deploy & rollback

Merge-only. Revert the PR to restore prior skill contracts.

### Open questions / risks

- A cheap model can still satisfy incomplete tests; independent review and manual verification remain necessary.
- A full-unit inline context may grow on hosts without fresh-worker primitives; compact receipts and the external-driver fallback bound this, but cannot create true fresh context on an incapable host.

### Deliverables

Skills, references, templates, fixtures, bilingual docs, routing metadata, changelogs, and migration guidance.

### Post-merge next feature

Measure real provider cost/convergence across representative weak models before changing default model tiers.
