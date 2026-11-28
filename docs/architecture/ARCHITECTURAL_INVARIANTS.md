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
- Enforcement: machine: `bun test scripts/vocabulary-parity.test.mjs` + `bun test scripts/normative-drift.test.mjs`
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

## AI-002 — a project-domain carrier never enters the exportable scaffold

- **Rule:** `template/` — the one product surface a target project copies
  wholesale — carries no citation to this repository's own project-domain
  state: no source-repo issue or PR URLs, no concrete unit citations
  (`docs/features/<n>-<slug>`, `docs/fix/<n>-<slug>` with a concrete slug —
  the naming-convention placeholders stay legal), no source decision or
  research-tree citations (`docs/design/`, `docs/research/`, `docs/golden/`).
  The npm package names, the skills install instruction and the marked example
  `scripts/local-gate.mjs` are sanctioned source-repo content.
- **Rationale:** the boundary IR7 declares prose-only in the charter's origin
  (domain separation — "a project decision never enters a product surface")
  has one direction that is exactly checkable, and the merge-driver registry
  lesson showed why: `template/.gitattributes` mentions the source's own
  manifests, and only a hidden-file-aware sweep sees it. Purity of the copied
  scaffold is the machine core; the two-way context-aware direction remains
  product-audit's person-run domain-drift sweep.
- **Applies to:** every text file `template/` ships, hidden files included —
  plus any future wholesale-copied product surface added in the same sweep.
- **Evidence:** `scripts/domain-separation.test.mjs` is the rule's
  enforcement: it reads the full `template/` tree (hidden files included,
  penalizing `rg`'s default blindness on dotfiles), refuses each carrier
  class with a file:line citation, and sane-checks every rule against its own
  header's live example so a rule can never pass forever green.
- **Change authority:** an owner decision (the records block in the owning
  fix unit's `decisions.md`); the ruleset's deliberate non-rules (the
  shared-merge path classes are product vocabulary) are recorded in the
  detector's header, never re-litigated in review.
- Enforcement: machine: `bun test scripts/domain-separation.test.mjs`
