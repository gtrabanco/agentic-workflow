# 19 — architectural-invariants

## Goal

Make long-lived architectural constraints explicit and evidence-based so
autonomous workflow changes cannot cause architectural drift while still passing
a feature SPEC and local checks. Closes #109.

## Branch

`feat/109-architectural-invariants`

## Size

`L` — template substrate, workflow contract, and planning/execution/review
skills change.

## Dependencies

Hard: 18 — normalized-repository-state, merged in #114. Soft: existing
architecture documentation and review contracts.

## Product half

### Context

The workflow has no first-class boundary between feature decisions, repository
architecture, and workflow architecture. An autonomous change can therefore
drift while meeting a SPEC and its test gate.

### Business goals

Make architecture evolution deliberate, auditable, reusable, and compatible
with projects that have not yet declared invariants.

### Scope

#### In scope

- A portable workflow contract for optional architectural invariants.
- An optional project invariant-document template with stable, evidence-backed entries.
- Planning, execution, review, and audit evaluation rules.
- Explicit stop-and-decision routing for violations and new/changed invariants.
- Optional consumption of frozen normalized repository facts.

#### Out of scope / non-goals

- Defining a project's architecture, technologies, domain model, or an architectural-decision store.
- Replacing repository inspection, creating mandatory normalization, automatic decisions, or contradiction resolution; feature 18 owns normalized state.
- Converting coding standards, implementation details, or roadmap entries into architectural invariants.

### Capability closure

- [ ] Create — `template/docs/architecture/ARCHITECTURAL_INVARIANTS.md` supplies an optional rule format; test: `test -f template/docs/architecture/ARCHITECTURAL_INVARIANTS.md`.
- [ ] Read/list — planning, execution, review, and audit discover declared invariants; test: affected skills cite `ARCHITECTURAL_INVARIANTS.md`.
- [ ] Update — n/a: project authority changes rules through its own explicit architectural-decision process.
- [ ] Delete — n/a: removing an invariant is an architecture decision, not a workflow operation.
- [ ] State transitions — `preserves | violates | introduces | changes`, with the last three stopping for an explicit decision.
- [ ] Roles — n/a: skills enforce process authority; this repository has no runtime ACL.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Project rules are optional | in-scope | AC 1 |
| 2 | Rules have stable identifiers | in-scope | AC 1 |
| 3 | Rules cite repository evidence | in-scope | AC 2 |
| 4 | A SPEC cannot override a rule | in-scope | AC 3 |
| 5 | Violations stop normal work | in-scope | AC 4 |
| 6 | New rules require acknowledgement | in-scope | AC 4 |
| 7 | Reviews check preservation | in-scope | AC 5 |
| 8 | Audits block undocumented drift | in-scope | AC 6 |
| 9 | Frozen facts reduce rediscovery | in-scope | AC 7 |
| 10 | Repository source remains authoritative | in-scope | AC 7 |

### Acceptance criteria

1. `test -f template/docs/architecture/ARCHITECTURAL_INVARIANTS.md` passes.
2. `grep -q "Evidence" docs/workflow/WORKFLOW_INVARIANTS.md` passes.
3. `grep -q "cannot silently relax" docs/workflow/WORKFLOW_INVARIANTS.md` passes.
4. `grep -q "explicit architectural decision" skills/execute-phase/SKILL.md` passes.
5. `grep -q "Architectural invariants" skills/review-change/SKILL.md` passes.
6. `grep -q "Architectural invariants" skills/audit-pr/SKILL.md` passes.
7. `grep -rq "REPOSITORY_STATE.md" docs/workflow/WORKFLOW_INVARIANTS.md skills` passes.
8. `npx skills add . --list` passes; an absent project invariant document is non-blocking.

### Tooling

`bump-skill`, golden-fixture runs for changed executor-path skills, and `npx skills add . --list`.

### Product decisions

- D1: projects use the optional path `docs/architecture/ARCHITECTURAL_INVARIANTS.md`, or declare an equivalent in their documentation map.
- D2: `violates`, `introduces`, and `changes` always require an explicit architectural decision; skills may report but not accept one.
- D3: NRS is a preferred optional evidence source; source inspection remains authoritative and no project must adopt NRS.

### Deferred decisions

none

### Spec-lint (mechanical — presence checks only)

All fields and closure rows are filled, ten expectation rows are resolved, and each in-scope item maps to an acceptance criterion.

## Design status

designed

## Engineering half

### Technical goals

Add a documentation-only, stack-agnostic invariant contract. Skills discover an optional project document, consume frozen NRS evidence when present, and stop normal flow rather than fabricating an architectural decision.

### Architecture impact

The workflow adds a contract layer, not a runtime layer. Repository invariant documents remain project-owned; workflow documentation supplies the protocol. Feature 18 remains the sole owner of repository fact normalization and contradiction resolution.

### Design

The workflow document defines the invariant entry schema, evidence hierarchy, four-state classification, and role responsibilities. The template places the optional project document beside the architecture document and declares it in the documentation map. Consumer skills add one shared stop rule: cite evidence, record `n/a` when absent, and route a violation/new/changed invariant to the declared architectural-decision authority.

### Decisions to confirm

none

### Testing requirements

Run phase checks, both-language documentation links, `npx skills add . --list`, and the golden fixture for every modified executor-path skill.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| absent invariant document | existing project has no rules | `n/a` compatibility branch |
| frozen NRS | shared facts are present | consume evidence before direct inspection |
| invariant violation | proposed change crosses a declared boundary | stop and explicit-decision route |
| contradictory evidence | source conflicts with frozen fact | `resolve-repository-state` route |

### Phases

- P1 — Invariant contract
  Layer: docs. Done-when: `test -f docs/workflow/WORKFLOW_INVARIANTS.md` → exit 0.
- P2 — Planning evaluation
  Layer: docs. Done-when: `grep -rl "ARCHITECTURAL_INVARIANTS.md" skills/design-feature skills/plan-feature skills/plan-feature-from-issue skills/plan-feature-scaffold skills/init-workspace | wc -l` → `5`.
- P3 — Execution evaluation
  Layer: docs. Done-when: `grep -q "Architectural invariants" skills/execute-phase/SKILL.md` → exit 0.
- P4 — Review evaluation
  Layer: docs. Done-when: `grep -rl "Architectural invariants" skills/review-change skills/audit-pr | wc -l` → `2`.
- P5 — Hardening & PR
  Layer: hardening. Done-when: `npx skills add . --list` → exit 0.

### Deploy & rollback

No runtime deploy. Revert the PR; repositories without an invariant document continue unchanged.

### Open questions / risks

Risk: agents may treat documentation as proof. The contract explicitly keeps repository inspection authoritative and routes NRS contradictions to its owner.

### Deliverables

Workflow contract and Spanish sibling, optional template document, updated template guide, consumer contracts, bilingual workflow index, and planning artifacts.

### Post-merge next feature

none
