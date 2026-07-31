# 18 — normalized-repository-state

## Goal

Make repository knowledge deterministic across the workflow. A first-class,
evidence-backed Normalized Repository State (NRS) separates verified facts,
accepted decisions, planned work, documentation, open questions, and inference;
it is frozen before planning and implementation and updated only through an
explicit contradiction-resolution flow. Closes #110.

## Branch

`feat/110-normalized-repository-state`

## Size

`L` — workflow contracts, template substrate, and consumer skills change.

## Dependencies

Hard: none. Soft: existing roadmap-status and workflow-status contracts, both
merged on `main`.

## Product half

### Context

Independent state reconstruction makes weak executors confuse documentation,
planned work, and implementation, and rediscover accepted decisions.

### Business goals

Provide a reusable repository-agnostic primitive that reduces state drift and
repeat exploration without treating a cache as truth.

### Scope

#### In scope

- A versioned NRS Markdown artifact with evidence-backed categories.
- Discovery that creates facts only and freezes a snapshot.
- Resolution as the sole update path for facts and accepted decisions.
- Consumption rules for planning, execution, review, audit, status, and drivers.

#### Out of scope / non-goals

- Caching repository contents, automatic conflict resolution, long-term memory,
  runtime databases, or replacing repository inspection.
- Changing roadmap status semantics, invariants, or the envelope schema.

### Capability closure

- [ ] Create — `discover-repository-state` writes `docs/workflow/REPOSITORY_STATE.md`; test: `grep -q "Repository Facts" skills/discover-repository-state/SKILL.md`.
- [ ] Read/list — workflow skills consume a frozen snapshot with evidence paths; test: each affected skill names the artifact.
- [ ] Update — `resolve-repository-state` only, after a contradiction; test: `grep -q "sole" skills/resolve-repository-state/SKILL.md`.
- [ ] Delete — n/a: snapshots are retained as an audit trail.
- [ ] State transitions — `draft → frozen → contradicted → resolved/frozen`, owned by discovery and resolver only.
- [ ] Roles — n/a: skills are the authority boundaries; this repo has no runtime ACL.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Facts cite evidence | in-scope | AC 1 |
| 2 | Inference stays separate | in-scope | AC 2 |
| 3 | Documentation is not implementation | in-scope | AC 3 |
| 4 | Planned work is not missing work | in-scope | AC 4 |
| 5 | Decisions are reusable | in-scope | AC 5 |
| 6 | Snapshot freezes | in-scope | AC 6 |
| 7 | Conflicts are explicit | in-scope | AC 7 |
| 8 | Resolver owns updates | in-scope | AC 8 |
| 9 | Missing facts permit inspection | in-scope | AC 9 |
| 10 | Repository remains truth | in-scope | AC 9 |

### Acceptance criteria

1. `grep -q "Repository Facts" skills/discover-repository-state/SKILL.md` passes.
2. `grep -q "Inference" template/docs/workflow/REPOSITORY_STATE.md` passes.
3. `grep -q "Documentation" template/docs/workflow/REPOSITORY_STATE.md` passes.
4. `grep -q "Planned work" template/docs/workflow/REPOSITORY_STATE.md` passes.
5. `grep -q "Accepted decisions" template/docs/workflow/REPOSITORY_STATE.md` passes.
6. `grep -q "frozen" skills/discover-repository-state/SKILL.md` passes.
7. `grep -q "contradiction" skills/resolve-repository-state/SKILL.md` passes.
8. `grep -q "sole" skills/resolve-repository-state/SKILL.md` passes.
9. `npx skills add . --list` passes; the repository remains authoritative.

### Tooling

`bump-skill`, golden-fixture runs for edited executor-path skills, and `npx
skills add . --list`.

### Product decisions

- D1: target projects keep a committed ledger at
  `docs/workflow/REPOSITORY_STATE.md`, mirrored in `template/`.
- D2: frozen facts are immutable; only a contradiction and resolver can create
  a revised fact or accepted decision.

### Deferred decisions

none

### Spec-lint (mechanical — presence checks only)

All fields and closure rows are filled, ten expectation rows are resolved, and
each in-scope item maps to an acceptance criterion.

## Design status

designed

## Engineering half

### Technical goals

Ship two user-facing skills and a canonical ledger. Other workflow roles consume
frozen state, inspect only absent facts, and propose rather than overwrite
contradictions.

### Architecture impact

NRS is a documentation ledger, not an application layer. Discovery and
resolution are writers; all other skills are read-only consumers.

### Design

The ledger records snapshot id, source revision, status, and tables for facts,
decisions, planned work, documentation, questions, inference, and contradictions.
Each fact records statement, evidence, observed-at, and status.

### Decisions to confirm

none

### Testing requirements

Run phase task greps, `npx skills add . --list`, and golden fixture runs after
executor-path edits.

### Dev scenarios

- Missing fact: inspection creates proposed evidence, not a silent fact edit.
- Conflict: the consumer records a contradiction and routes to resolution.
- Documentation-only claim: it remains Documentation, never a fact.
- Stale snapshot: discovery creates a new snapshot; source remains truth.

### Phases

- P1 — NRS artifact and discovery contract.
- P2 — Contradiction resolution.
- P3 — Planning and execution consumption.
- P4 — Review, audit, status, and orchestration consumption.
- P5 — Hardening & PR.

### Deploy & rollback

No runtime deploy. Revert the PR; existing direct discovery remains available.

### Open questions / risks

Risk: stale wording could imply NRS overrides source. P5 verifies the fallback.

### Deliverables

Two skills, ledger template, consumer contracts, bilingual workflow docs, and
planning artifacts.

### Post-merge next feature

none
