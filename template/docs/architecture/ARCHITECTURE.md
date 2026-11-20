# Architecture

> Stub. Document **your** chosen architecture here. The workflow is
> architecture-agnostic — it respects whatever you write, it does not impose a
> pattern.

## Pattern

Name the pattern you use (layered, hexagonal/ports-and-adapters, clean, modular
monolith, MVC, feature-sliced, …) and why.

## Modules / layers

List the modules or layers and what each is responsible for.

| Module / layer | Responsibility | May depend on | Must NOT depend on |
|---|---|---|---|
| `<name>` | `<what it does>` | `<…>` | `<…>` |

## Dependency rules (invariants)

The rules that must never be violated. These are what the workflow's review and
planning skills check against. Be explicit, e.g.:

- `<rule, e.g. "the domain layer imports no framework/IO code">`
- `<rule, e.g. "UI never talks to the database directly">`

For long-lived constraints that apply beyond dependency direction, use the
optional companion `ARCHITECTURAL_INVARIANTS.md`. It records one checkable rule,
its repository evidence, and the authority required to change it.

## Diagram

```
<optional: a simple ASCII or mermaid diagram of the dependency direction>
```

## Promoting a decision

A decision a unit takes is recorded with its **scope**, and the scope decides
where it lives (`decision-scope@1`, owner:
`skills/unit-lane/references/DESIGN.md`). A `unit-only` decision binds that unit
and stays in its ledger. A **`cross-unit`** decision binds work beyond the unit,
so it is promoted to exactly ONE permanent owner doc — the one below that owns
its subject — and the unit ledger links that doc instead of restating it.

| what the decision orders | owner doc |
|---|---|
| how this project is worked on — a convention or a law every session obeys | the agent guide (`AGENTS.md`, `## Inviolable rules`: one row per law whose `owner` cell cites the mechanism that enforces it) |
| the structure — module or layer ownership, a dependency direction, a boundary | this document (`ARCHITECTURE.md`), in the section that owns the subject |
| a long-lived property with a checkable mechanism | `ARCHITECTURAL_INVARIANTS.md`, one `AI-<n>` entry carrying its rule, its evidence and the authority that may change it |

**Precedence when a scope spans several.** The document that carries the
mechanism owns the statement; the guide carries one law row whose `owner` cell
cites it. A second full statement in the always-loaded guide is a restatement,
not a promotion — one rule, one owner, and a pointer from the law.

**Link, never copy.** The unit's `decision` row records `cross-unit` and cites
the owner doc's path — `AGENTS.md`, `docs/architecture/ARCHITECTURE.md`,
`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, plus any doc this project's
guide names in its charter's `Decision records` slot. The promoted statement is
written once, in that doc; a later unit that needs it links it, and a copy is a
defect the audit reports.

**Who promotes.** A promotion is an owner-directed documentation change. An
agent proposes it — the `product-audit` `Decision promotion` dimension reports
every cross-unit decision that cites no owner doc — and the owner lands it in
the change that takes it. No agent moves a rule into this document or into the
guide on its own initiative.
