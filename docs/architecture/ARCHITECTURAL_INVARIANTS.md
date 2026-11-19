# Architectural invariants

> Optional. Keep this document only when your project has long-lived
> architectural constraints that autonomous changes must preserve.

Architectural invariants are repository constraints, not coding standards,
feature requirements, or implementation details. They change only through the
explicit architectural-decision path named by the project.

## How to use this document

One invariant per section. Make each rule independently checkable and cite
evidence from the repository. A missing document means no project invariants
are declared; workflow skills must remain compatible with that state.

```markdown
## AI-001 — <short rule>

- Rule: <property that must remain true>
- Rationale: <why it protects the repository>
- Applies to: <modules, public contracts, or change types>
- Evidence: <paths, tests, commands, or diagrams that establish the rule>
- Change authority: <decision record or named approval path>
```

## Invariants

Add project-specific entries here. Do not infer or accept a new or changed rule
from a feature SPEC, implementation, or passing test alone.

## AI-001 — every closed vocabulary the workflow publishes has one machine owner

- **Rule:** `@gtrabanco/agentic-workflow-schema` owns every closed vocabulary a
  published contract names (an envelope, a grammar block, a receipt, a README
  contract section). A consumer **imports** it. A literal copy is legal only
  inside a **named pre-build entrypoint** — a module that must run before the
  schema package's build exists on a fresh clone — and such a file carries this
  invariant's id in its header and its only pin. A closed set no published
  contract names stays where its implementation lives, classified rather than
  assumed.
- **Rationale:** a mirror is a second source of truth that drifts silently: the
  runner crate justified its copies with "this crate does not depend on the
  schema package", a sentence that was true when written and false one day later
  when the dependency landed (#427). Nothing forced re-verification, so the
  premise outlived its fact. One owner makes drift unrepresentable instead of
  merely unlikely.
- **Applies to:** every package in this repository, and every skill, script or
  template that documents a closed set. A token added to a vocabulary is a
  schema const plus the consumer's use of it — plus the grammar block when the
  set is surfaced — in the same PR.
- **Evidence:** `scripts/vocabulary-parity.test.mjs` is the rule's enforcement: it
  refuses a literal copy of a published name, refuses a normative row whose
  `schema-export:` const does not live in the schema package, pins any permitted
  exception by real import, and prints a receipt classifying every runner const.
  `scripts/normative-drift.test.mjs` recomputes each restatement against its
  const, so prose can never outvote the machine.
- **Change authority:** an owner decision on the issue that proposes the change;
  this invariant is never reworded by an implementation.

The machine shape of the rule, so a checker reads a grammar instead of a
sentence:

```text
vocabulary-residency@1
owner | packages/agentic-workflow-schema/src
consumer | import from @gtrabanco/agentic-workflow-schema, re-export the consumer's historical name
mirror | only inside a named pre-build entrypoint; header names this invariant; pinned once in scripts/vocabulary-parity.test.mjs
runner-internal | a set no published contract names stays in its module, classified by the residency case
token-change | schema const + consumer use + (grammar block when surfaced) in one PR
```
