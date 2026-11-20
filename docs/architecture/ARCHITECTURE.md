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

## Document retention

A unit's carrier is part of the structure this document describes: `legacy`,
`spec-by-reference` and `settled` are the three accepted layouts, and a merged
unit may settle to the third. The procedure — what a settle keeps, the one
eligibility predicate, the byte-bound archive and its restore — is owned by
[`docs/workflow/RETENTION.md`](../workflow/RETENTION.md); this section only
records the rule that a structure change must respect: **a settle removes no
traceability**, so the `## Log` survives verbatim and the trimmable files are
restorable.

A unit written before the provenance stamp (#462) is out of scope for the trimmer
forever. The documented path to make it a candidate is a **provenance re-stamp**
(`agentic-workflow unit-doc <slug> provenance`, which writes the format the
carrier derives), never a synthesized stamp and never a forced settle.

## Diagram

```
<optional: a simple ASCII or mermaid diagram of the dependency direction>
```
